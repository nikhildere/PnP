using Newtonsoft.Json.Linq;
using OfficeDevPnP.Core.Diagnostics;
using OfficeDevPnP.Core.Utilities;
using Provisioning.Common;
using Provisioning.Common.Authentication;
using Provisioning.Common.Data.Templates;
using Provisioning.Common.MdlzComponents;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Provisioning.Common.MdlzComponents.TeamsProvisioning;

namespace Provisioning.Job
{
    class TeamsTest
    {
        public void SetGuestSettingsForTeam()
        {
            //string token = AcquireTokenAsync("https://graph.microsoft.com/", "Group.ReadWrite.All");
            string token = AcquireTokenAsync("https://graph.microsoft.com/", null);

            SetAllowToAddGuestsSetting(new PnPMonitoredScope(), "4bd17091-707b-417b-8061-4b7fcaf99317", false, token);
        }

        public void GetTeam()
        {
            string token = AcquireTokenAsync("https://graph.microsoft.com/", null);
            bool doesGrpExists = TeamsProvisioning.DoesGroupWithNameExists("O365 Service Operations", token, out string groupID);
            var team = TeamsProvisioning.GetTeamDetailsByGroupID(groupID, token).Result;
        }
        private string AcquireTokenAsync(string resource, string scope = null)
        {
            //scope = null;
            var tenantId = ConfigurationManager.AppSettings["TenantID"];
            //DEV:C_.iEC1Rt0~x0~gr23K4oshDh6UhC8.I0u
            // ensure that your Azure AD app has Group.ReadWrite.All and User.Read.All permissions
            var clientId = ConfigurationManager.AppSettings["GaClientID"];
            var clienSecret = ConfigurationManager.AppSettings["GaSecret"];

            string apiURl = null;
            string content = null;
            if (scope == null)
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

        private static void CreateAllowToAddGuestsSetting(string teamId, bool allowToAddGuests, string accessToken)
        {
            try
            {
                var body = $"{{'displayName': 'Group.Unified.Guest', 'templateId': '08d542b9-071f-4e16-94b0-74abb372e3d9', 'values': [{{'name': 'AllowToAddGuests','value': '{allowToAddGuests}'}}] }}";
                HttpHelper.MakePostRequest($"https://graph.microsoft.com/v1.0/groups/{teamId}/settings", body, "application/json", accessToken);
            }
            catch (Exception e)
            {

            }
        }

        internal static bool GetAllowToAddGuestsSetting(PnPMonitoredScope scope, string teamId, string accessToken)
        {
            try
            {
                var groupGuestSettings = GetGroupUnifiedGuestSettings(scope, teamId, accessToken);
                if (groupGuestSettings != null && groupGuestSettings["values"] != null && groupGuestSettings["values"].FirstOrDefault(x => x["name"].Value<string>().Equals("AllowToAddGuests")) != null)
                {
                    return groupGuestSettings["values"].First(x => x["name"].ToString() == "AllowToAddGuests").Value<bool>();
                }
                return false;
            }
            catch (Exception e)
            {
                return false;
            }
        }

        /// <summary>
        /// Gets the Group.Unified.Guest settings for the unified group that is connected to the team.
        /// </summary>
        /// <param name="scope">The PnP Provisioning Scope</param>
        /// <param name="teamId">The ID of the target Team</param>
        /// <param name="accessToken">The OAuth 2.0 Access Token</param>
        /// <returns>All guest related settings for the team connected unified group (not just external sharing)</returns>
        private static JToken GetGroupUnifiedGuestSettings(PnPMonitoredScope scope, string teamId, string accessToken)
        {
            try
            {
                var response = JToken.Parse(HttpHelper.MakeGetRequestForString($"https://graph.microsoft.com/v1.0/groups/{teamId}/settings", accessToken));
                return response["value"]?.FirstOrDefault(x => x["templateId"].ToString() == "08d542b9-071f-4e16-94b0-74abb372e3d9");
            }
            catch (Exception e)
            {
                return null;
            }
        }

        private static void SetAllowToAddGuestsSetting(PnPMonitoredScope scope, string teamId, bool allowToAddGuests, string accessToken)
        {
            if (GetAllowToAddGuestsSetting(scope, teamId, accessToken))
            {
                UpdateAllowToAddGuestsSetting(scope, teamId, allowToAddGuests, accessToken);
            }
            else
            {
                CreateAllowToAddGuestsSetting(scope, teamId, allowToAddGuests, accessToken);
            }
        }

        private static void UpdateAllowToAddGuestsSetting(PnPMonitoredScope scope, string teamId, bool allowToAddGuests, string accessToken)
        {
            try
            {
                var groupGuestSettings = GetGroupUnifiedGuestSettings(scope, teamId, accessToken);
                groupGuestSettings["values"].FirstOrDefault(x => x["name"].ToString() == "AllowToAddGuests")["value"] = allowToAddGuests.ToString();

                HttpHelper.MakePatchRequestForString($"https://graph.microsoft.com/v1.0/groups/{teamId}/settings/{groupGuestSettings["id"]}", groupGuestSettings, "application/json", accessToken);
            }
            catch (Exception e)
            {
                //scope.LogError(CoreResources.Provisioning_ObjectHandlers_Teams_Team_RemovingMemberError, e.Message);
            }
        }

        private static void CreateAllowToAddGuestsSetting(PnPMonitoredScope scope, string teamId, bool allowToAddGuests, string accessToken)
        {
            try
            {
                var body = $"{{'displayName': 'Group.Unified.Guest', 'templateId': '08d542b9-071f-4e16-94b0-74abb372e3d9', 'values': [{{'name': 'AllowToAddGuests','value': '{allowToAddGuests}'}}] }}";
                HttpHelper.MakePostRequest($"https://graph.microsoft.com/v1.0/groups/{teamId}/settings", body, "application/json", accessToken);
            }
            catch (Exception e)
            {
                //scope.LogError(CoreResources.Provisioning_ObjectHandlers_Teams_Team_RemovingMemberError, e.Message);
            }
        }

        public static void CreateTeamsInProd()
        {
            var req = new SiteInformation
            {
                Title = "Create It Blank Team Internal Only",
                Description = "Create It Blank Team Internal Only Description",
                AdditionalAdministrators = new List<SiteUser>() { new SiteUser { Email = "jamahl.wiggins@mdlz.com" }, new SiteUser { Email = "richard.hunt@mdlz.com" } },
                SiteOwner = new SiteUser { Email = "nikhil.dere@mdlz.com" },
                //SiteMetadataJson = "{'_site_props_externalsharing':'true'}"
            };
            var temp = new Template { ProvisioningTemplate = "Mdlz.MicrosoftTeams/BlankTeam.xml" };
            var t = new TeamsProvisioning();
            t.CreateTeam(req, temp);


            req.Title = "Create It Blank Team Externals Allowed";
            req.Description = "Create It Blank Team Externals Allowed Description";
            req.SiteMetadataJson = "{'_site_props_externalsharing':'true'}";
            t = new TeamsProvisioning();
            t.CreateTeam(req, temp);
        }
    }
}
