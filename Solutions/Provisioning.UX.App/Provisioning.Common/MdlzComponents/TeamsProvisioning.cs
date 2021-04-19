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
using System.Threading;
using System.Threading.Tasks;

namespace Provisioning.Common.MdlzComponents
{
    public class TeamsProvisioning
    {
        const int secondsToWaitBetweenEachAttempt = 30;

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
            string groupID = null;
            bool isGroupExist = false;
            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Acquring Graph API token");
            string token = AcquireToken();
            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Graph API token acquired successfuly");

            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Loading teams template - {0}", request.Template);
            ProvisioningHierarchy hierarchyToApply = new ReflectionManager().GetTemplateProvider(ModuleKeys.PROVISIONINGPROVIDER_KEY).GetHierarchy(template.ProvisioningTemplate);
            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Loaded teams template successfully - {0}", request.Template);

            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Mapping teams template with request information");
            TemplateRequestMapping(hierarchyToApply, request);
            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Mapped teams template with request infromation successfully");

            if (request.RequestStatusMessage != "Retry")
            {
                Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Checking if group already exists");
                isGroupExist = DoesGroupWithNameExists(request.Title, token, out groupID);

                if (isGroupExist)
                    throw new Exception("Team with same name already exists.");
            }
            else
            {
                Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Request is candidate for retry");
            }


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

                    //var owners = hierarchyToApply.Teams.Teams[0].Security.Owners.Where(x => 1 == 1).ToList();
                    //if (owners.Count > 10)
                    //{
                    //    hierarchyToApply.Teams.Teams[0].Security.Owners.Clear();
                    //    hierarchyToApply.Teams.Teams[0].Security.Owners.AddRange(owners.Select(x => new TeamSecurityUser { UserPrincipalName = x.UserPrincipalName }));
                    //}

                    MdlzUtilities.PerformActionRetry((ex) =>
                    {
                        if (string.IsNullOrEmpty(ex) || ex?.ToLower().Contains("no team found with group id") == true)
                        {
                            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Setting the Group ID to blank");
                            hierarchyToApply.Teams.Teams[0].GroupId = string.Empty;
                            tenant.ApplyTenantTemplate(hierarchyToApply, "SAMPLE-SEQUENCE", prov);
                            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Applying teams template - completed");
                            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Checking if the team was created");
                            groupID = hierarchyToApply.Teams?.Teams?.FirstOrDefault()?.GroupId;
                            isGroupExist = !string.IsNullOrEmpty(groupID);
                        }
                        //isGroupExist = DoesGroupWithNameExists(request.Title, token, out groupID);
                        Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Retrieving newly created team");
                        team = GetTeamDetailsByGroupID(groupID, token);
                        Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Newly created team retrieved successfully: {0}", JsonConvert.SerializeObject(team));
                    },



                    secondsToWaitBetweenEachAttempt: secondsToWaitBetweenEachAttempt, retryAttempts: 30);

                    //if (owners.Count > 10)
                    //{
                    //    for (int i = 10; i < owners.Count; i++)
                    //    {
                    //        if()
                    //    }

                    //    int skip = 10;
                    //    var ownersToAdd = owners.Skip(skip + 10).Take(10).Select(x => new TeamSecurityUser { UserPrincipalName = x.UserPrincipalName });

                    //    if (owners.Count() > 0)
                    //    {
                    //        HttpHelper.MakePostRequestForString($"{GraphHelper.MicrosoftGraphBaseURI}v1.0/groups/{groupID}/owners/$ref", groupCreationRequest, HttpHelper.JsonContentType, accessToken);
                    //    }

                    //    MdlzUtilities.PerformActionRetry((ex) =>
                    //    {

                    //    });
                    //}

                    if (team != null)
                    {
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


                        if (hierarchyToApply.Templates?.Count > 0)
                        {
                            Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Attempting to apply {0} SharePoint Templates", hierarchyToApply.Templates.Count);
                            var auth = new AppOnlyAuthenticationSite() { SiteUrl = team.SharePointSiteUrl };

                            using (var ctx = auth.GetAuthenticatedContext())
                            {
                                foreach (var item in hierarchyToApply.Templates)
                                {
                                    try
                                    {
                                        Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Attempting to apply SharePoint Template named - {0}", item.Id);
                                        ctx.Web.ApplyProvisioningTemplate(item);
                                    }
                                    catch (Exception ex)
                                    {
                                        Utilities.Log.Error("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Failed to apply SharePoint Template named - {0}", item.Id);
                                        Utilities.Log.Error("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", ex.ToString());
                                    }
                                }
                            }
                        }


                        Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Completed creating team. Team Name: {0}. Group ID: {1}", request.Title, team.GroupID);
                    }
                    else
                    {
                        Utilities.Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites.CreateTeam", "Team creation failed. Team Name: {0}", request.Title);
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
            owners.AddRange(new[] { request.SiteOwner.Name.Split(new[] { '|' }, StringSplitOptions.None).Last().ToLower() });
            owners.AddRange(request.AdditionalAdministrators.Select(x => x.Name.Split(new[] { '|' }, StringSplitOptions.None).Last().ToLower()));
            //owners.AddRange(new[] { settings.DefaultScAdminLoginName.ToLower(), request.SiteOwner.Email.ToLower() });
            template.Security.Owners.AddRange(owners.Distinct().Select(x => new TeamSecurityUser { UserPrincipalName = x }).Take(10));
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

        public static CreatedTeam GetTeamDetailsByGroupID(string alreadyExistingGroupId, string accessToken)
        {
            if (!string.IsNullOrEmpty(alreadyExistingGroupId))
            {
                var jsonGroupSpo = JsonConvert.DeserializeAnonymousType(HttpHelper.MakeGetRequestForString($"https://graph.microsoft.com/v1.0/groups/{alreadyExistingGroupId}/sites/root/weburl", accessToken), new { value = "" });
                var jsonGroup = JsonConvert.DeserializeAnonymousType(HttpHelper.MakeGetRequestForString($"https://graph.microsoft.com/v1.0/groups/{alreadyExistingGroupId}?$select=mail", accessToken), new { mail = "" });
                var jsonTeam = JsonConvert.DeserializeAnonymousType(HttpHelper.MakeGetRequestForString($"https://graph.microsoft.com/v1.0/teams/{alreadyExistingGroupId}?$select=webUrl", accessToken), new { webUrl = "" });

                return new CreatedTeam { GroupID = alreadyExistingGroupId, Mail = (jsonGroup).mail, SharePointSiteUrl = (jsonGroupSpo).value, TeamUrl = (jsonTeam).webUrl };
                //return new CreatedTeam { GroupID = alreadyExistingGroupId, Mail = (await jsonGroup).mail, SharePointSiteUrl = (await jsonGroupSpo).value };
            }
            else
                throw new Exception("GetTeamDetailsByGroupID: Group ID cannot be blank");
        }

        public class CreatedTeam
        {
            public string GroupID { get; set; } = string.Empty;
            public string SharePointSiteUrl { get; set; } = string.Empty;
            public string TeamUrl { get; set; } = string.Empty;
            public string Mail { get; set; } = string.Empty;

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

        public static string GetUserLicenseDetails(string userUpn, string accessToken)
        {
            return HttpHelper.MakeGetRequestForString($"https://graph.microsoft.com/v1.0/users/{userUpn}/licenseDetails", accessToken);
        }
        #endregion
    }
}