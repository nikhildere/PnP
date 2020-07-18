using Microsoft.Online.SharePoint.TenantAdministration;
using Microsoft.Online.SharePoint.TenantManagement;
using Microsoft.SharePoint.Client;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OfficeDevPnP.Core.Diagnostics;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using OfficeDevPnP.Core.Framework.Provisioning.Model.Teams;
using OfficeDevPnP.Core.Framework.Provisioning.ObjectHandlers;
using OfficeDevPnP.Core.Utilities;
using Provisioning.Common.Authentication;
using Provisioning.Common.Configuration;
using Provisioning.Common.Data.Templates;
using Provisioning.Common.Utilities;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Provisioning.Common.MdlzComponents
{
    public class TeamsProvisioning
    {
        AppOnlyAuthenticationSite authentication;
        AppSettings settings;

        public TeamsProvisioning()
        {
            authentication = new AppOnlyAuthenticationSite();
            authentication.SiteUrl = authentication.TenantAdminUrl;
            settings = ConfigurationFactory.GetInstance().GetAppSetingsManager().GetAppSettings();
        }

        public CreatedTeam CreateTeam(SiteInformation request, Template template)
        {
            CreatedTeam team = null;
            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Acquring Graph API token");
            string token = AcquireToken();
            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Graph API token acquired successfuly");

            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Loading teams template - {0}", request.Template);
            ProvisioningHierarchy hierarchyToApply = new ReflectionManager().GetTemplateProvider(ModuleKeys.PROVISIONINGPROVIDER_KEY).GetHierarchy(template.ProvisioningTemplate);
            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Loaded teams template successfully - {0}", request.Template);

            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Mapping teams template with request information");
            TemplateRequestMapping(hierarchyToApply, request);
            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Mapped teams template with request infromation successfully");

            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Checking if group already exists");
            bool isGroupExist = DoesGroupWithNameExists(request.Title, token, out string groupID);

            if (isGroupExist)
                throw new Exception("Team with same name already exists.");

            var prov = new OfficeDevPnP.Core.Framework.Provisioning.Model.Configuration.ApplyConfiguration { };
            ProvisioningTemplateApplyingInformation _pta = new ProvisioningTemplateApplyingInformation();
            prov.ProgressDelegate = (message, step, total) =>
                Utilities.Log.Info("SiteProvisioningManager.ApplyProvisioningTemplate", "Applying Provisioning template - Step {0}/{1} : {2} ", step, total, message);

            using (ClientContext clientContext = authentication.GetAuthenticatedContext())
            {
                using (new PnPProvisioningContext((resource, scope) => Task.FromResult(token)))
                {
                    Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Applying teams template - started");
                    var tenant = new Tenant(clientContext);
                    tenant.ApplyTenantTemplate(hierarchyToApply, "SAMPLE-SEQUENCE", prov);
                    Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Applying teams template - completed");

                    Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Checking if the team was created");
                    isGroupExist = DoesGroupWithNameExists(request.Title, token, out groupID);
                    

                    //Utilities.Log.Info(nameof(TeamsProvisioning), "Successfully applied template to {}");

                    if (isGroupExist)
                    {
                        Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Retrieving newly created team");
                        team = GetTeamDetailsByGroupID(groupID, token).Result;
                        Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Newly created team retrieved successfully");

                        Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Setting external sharing configuration for associated SharePoint site to ExistingExternalUserSharingOnly");
                        SharingCapabilities sharing = SharingCapabilities.ExistingExternalUserSharingOnly;
                        if (hierarchyToApply.Parameters.ContainsKey("ExternalSharingMode"))
                            sharing = hierarchyToApply.Parameters["ExternalSharingMode"].ToEnum<SharingCapabilities>();

                        var siteProps = tenant.GetSitePropertiesByUrl(team.SharePointSiteUrl, false);
                        siteProps.SharingCapability = sharing;
                        siteProps.Update();
                        tenant.Context.Load(siteProps);
                        tenant.Context.ExecuteQueryRetry();
                        Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Completed setting external sharing configuration for associated SharePoint site to ExistingExternalUserSharingOnly");
                    }
                    else
                    {
                        throw new Exception("Team could not be created");
                    }
                }
            }
            return team;
        }

        //public void GetTeamsTemplate()
        //{
        //    using (ClientContext clientContext = authentication.GetAuthenticatedContext())
        //    {
        //        using (new PnPProvisioningContext((resource, scope) => Task.FromResult(AcquireTokenAsync(resource, scope))))
        //        {
        //            var tenant = new Tenant(clientContext);
        //            ProvisioningHierarchy x = tenant.GetTenantTemplate(new OfficeDevPnP.Core.Framework.Provisioning.Model.Configuration.ExtractConfiguration { Tenant = new OfficeDevPnP.Core.Framework.Provisioning.Model.Configuration.Tenant.ExtractTenantConfiguration { Teams = new OfficeDevPnP.Core.Framework.Provisioning.Model.Configuration.Tenant.Teams.ExtractTeamsConfiguration { TeamSiteUrls = null } } });

        //            new ReflectionManager().GetTemplateProvider(ModuleKeys.PROVISIONINGPROVIDER_KEY).Save()

        //            var formatter = new XMLPnPSchemaFormatter();
        //            using (var stream = formatter.ToFormattedTemplate(x))
        //            {
        //                return XElement.Load(stream).ToString();
        //            }
        //        }
        //    }
        //}

        public static string AcquireToken(string resource = null, string scope = null)
        {
            var tenantId = ConfigurationManager.AppSettings["TenantID"];
            //DEV:C_.iEC1Rt0~x0~gr23K4oshDh6UhC8.I0u
            // ensure that your Azure AD app has Group.ReadWrite.All, Directory.ReadWrite.All and User.Read.All permissions
            var clientId = ConfigurationManager.AppSettings["GaClientID"];
            var clienSecret = ConfigurationManager.AppSettings["GaSecret"];

            string apiURl = null;
            string content = null;
            if (scope != null)
            {
                apiURl = $"https://login.microsoftonline.com/{tenantId}/oauth2/token";
                content = $"grant_type=client_credentials&client_id={clientId}&client_secret={clienSecret}&scope={scope}&resource={resource}";
            }
            else
            {
                apiURl = $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token";
                content = $"grant_type=client_credentials&client_id={clientId}&client_secret={clienSecret}&scope=https://graph.microsoft.com/.default";
            }

            string response = OfficeDevPnP.Core.Utilities.HttpHelper.MakePostRequestForString(apiURl, content, "application/x-www-form-urlencoded");
            var json = JToken.Parse(response);
            return json["access_token"].ToString();
        }

        private void TemplateRequestMapping(ProvisioningHierarchy hierarchyToApply, SiteInformation request)
        {
            var template = hierarchyToApply.Teams.Teams[0];
            template.DisplayName = request.Title;
            template.Description = request.Description;
            template.Security = (template.Security ?? new TeamSecurity());
            template.Security.AllowToAddGuests = request.EnableExternalSharing != SharingCapabilities.Disabled;

            var spProps = !string.IsNullOrEmpty(request.SiteMetadataJson) ? JsonConvert.DeserializeObject<Dictionary<string, string>>(request.SiteMetadataJson) : new Dictionary<string, string>();
            if (spProps.ContainsKey("_site_props_externalsharing"))
                template.Security.AllowToAddGuests = spProps["_site_props_externalsharing"].ToBoolean();


            List<string> owners = new List<string>();
            owners.AddRange(request.AdditionalAdministrators.Select(x => x.Email.ToLower()));
            owners.AddRange(new[] { request.SiteOwner.Email.ToLower() });
            //owners.AddRange(new[] { settings.DefaultScAdminLoginName.ToLower(), request.SiteOwner.Email.ToLower() });
            template.Security.Owners.AddRange(owners.Distinct().Select(x => new TeamSecurityUser { UserPrincipalName = x }));
        }


        #region Static Methods
        public static bool DoesGroupWithNameExists(string displayName, string accessToken, out string groupID)
        {
            string mailNickName = CreateMailNicknameFromDisplayName(displayName);

            List<KeyValuePair<string, string>> filterFieldsAndValues = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("displayName", displayName),
                new KeyValuePair<string, string>("mailNickname", displayName),
                new KeyValuePair<string, string>("mailNickname", mailNickName)
            };

            groupID = !string.IsNullOrEmpty(displayName) ?
                ItemAlreadyExists($"https://graph.microsoft.com/v1.0/groups", filterFieldsAndValues, accessToken) :
                null;

            return (!string.IsNullOrEmpty(groupID));
        }

        public static async Task<CreatedTeam> GetTeamDetailsByGroupID(string alreadyExistingGroupId, string accessToken)
        {
            //List<KeyValuePair<string, string>> filterFieldsAndValues = new List<KeyValuePair<string, string>>
            //{
            //    new KeyValuePair<string, string>("id", alreadyExistingGroupId)
            //};

            //var alreadyExistingGroupId = !string.IsNullOrEmpty(groupID) ?
            //    ItemAlreadyExists($"https://graph.microsoft.com/v1.0/groups", filterFieldsAndValues, accessToken) :
            //    null;

            if (!string.IsNullOrEmpty(alreadyExistingGroupId))
            {
                var jsonGroup = Task.Run(() => JsonConvert.DeserializeAnonymousType(HttpHelper.MakeGetRequestForString($"https://graph.microsoft.com/v1.0/groups/{alreadyExistingGroupId}?$select=mail", accessToken), new { mail = "" }));
                var jsonGroupSpo = Task.Run(() => JsonConvert.DeserializeAnonymousType(HttpHelper.MakeGetRequestForString($"https://graph.microsoft.com/v1.0/groups/{alreadyExistingGroupId}/sites/root/weburl", accessToken), new { value = "" }));
                var jsonTeam = Task.Run(() => JsonConvert.DeserializeAnonymousType(HttpHelper.MakeGetRequestForString($"https://graph.microsoft.com/v1.0/teams/{alreadyExistingGroupId}?$select=webUrl", accessToken), new { webUrl = "" }));

                return new CreatedTeam { GroupID = alreadyExistingGroupId, Mail = (await jsonGroup).mail, SharePointSiteUrl = (await jsonGroupSpo).value, TeamUrl = (await jsonTeam).webUrl };
            }
            return null;
        }

        public class CreatedTeam
        {
            public string GroupID { get; set; }
            public string SharePointSiteUrl { get; set; }
            public string TeamUrl { get; set; }
            public string Mail { get; set; }

        }

        private static string ItemAlreadyExists(string uri, List<KeyValuePair<string, string>> filterFieldsAndValues, string accessToken)
        {
            string id;
            string url = $"{uri}?$select=id&$filter=";

            for (int i = 0; i < filterFieldsAndValues.Count; i++)
            {
                var item = filterFieldsAndValues[i];
                url += $"{item.Key}%20eq%20'{WebUtility.UrlEncode(item.Value)}'";

                if (i < filterFieldsAndValues.Count - 1)
                    url += " or ";
            }

            String json = HttpHelper.MakeGetRequestForString(url, accessToken);
            // Get the id of existing item
            var ids = GetIdsFromList(json);
            id = ids.Length > 0 ? ids[0] : null;
            return id;
        }

        private static string[] GetIdsFromList(string json)
        {
            return JsonConvert.DeserializeAnonymousType(json, new { value = new[] { new { id = "" } } }).value.Select(v => v.id).ToArray();
        }

        public static string CreateMailNicknameFromDisplayName(string displayName)
        {
            var mailNickname = displayName.ToLower();
            mailNickname = RemoveUnallowedCharacters(mailNickname);
            mailNickname = ReplaceAccentedCharactersWithLatin(mailNickname);
            return mailNickname;
        }

        private static string RemoveUnallowedCharacters(string str)
        {
            const string unallowedCharacters = "[&_,!@;:#¤`´~¨='%<>/\\\\\"\\.\\$\\*\\^\\+\\|\\{\\}\\[\\]\\-\\(\\)\\?\\s]";
            var regex = new Regex(unallowedCharacters);
            return regex.Replace(str, "");
        }

        private static string ReplaceAccentedCharactersWithLatin(string str)
        {
            const string a = "[äåàáâãæ]";
            var regex = new Regex(a, RegexOptions.IgnoreCase);
            str = regex.Replace(str, "a");

            const string e = "[èéêëēĕėęě]";
            regex = new Regex(e, RegexOptions.IgnoreCase);
            str = regex.Replace(str, "e");

            const string i = "[ìíîïĩīĭįı]";
            regex = new Regex(i, RegexOptions.IgnoreCase);
            str = regex.Replace(str, "i");

            const string o = "[öòóôõø]";
            regex = new Regex(o, RegexOptions.IgnoreCase);
            str = regex.Replace(str, "o");

            const string u = "[üùúû]";
            regex = new Regex(u, RegexOptions.IgnoreCase);
            str = regex.Replace(str, "u");

            const string c = "[çċčćĉ]";
            regex = new Regex(c, RegexOptions.IgnoreCase);
            str = regex.Replace(str, "c");

            const string d = "[ðďđđ]";
            regex = new Regex(d, RegexOptions.IgnoreCase);
            str = regex.Replace(str, "d");

            return str;
        }
        #endregion
    }
}