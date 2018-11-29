using Microsoft.Online.SharePoint.TenantManagement;
using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Enums;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using OfficeDevPnP.Core.Framework.Provisioning.ObjectHandlers;
using Provisioning.Common.Authentication;
using Provisioning.Common.Configuration;
using Provisioning.Common.Configuration.Application;
using Provisioning.Common.Data.Templates;
using Provisioning.Common.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Provisioning.Common.MdlzComponents
{
    public class MdlzCommonCustomizations
    {
        private const string cn_EnableExternalSharing = "ExternalSharingMode",
            cn_RemoteWebHostNameToken = "RemoteWebHostNameToken",
            cn_RemoteWebHostNameTokenFormat = "https://{0}";
        #region Fields
        private bool isSubSite;
        private ProvisioningTemplate provTemplate;
        private SiteInformation request;
        private SiteUser actualRequestOwner;
        private static AppSettings appSettings;
        IAuthentication Authentication;
        #endregion

        #region Constructor
        public MdlzCommonCustomizations(SiteInformation _request, ProvisioningTemplate _provTemplate, Template template)
        {
            request = _request;
            provTemplate = _provTemplate;

            if (appSettings == null)
            {
                IConfigurationFactory _cf = ConfigurationFactory.GetInstance();
                IAppSettingsManager _manager = _cf.GetAppSetingsManager();
                appSettings = _manager.GetAppSettings();
            }
            Authentication = new AppOnlyAuthenticationSite();
            Authentication.SiteUrl = _request.Url;
        }
        #endregion

        #region Private Methods

        #region Utils

        private void SetAccessForAll(Web web)
        {
            try
            {
                if (!request.IsConfidential)
                {
                    web.AddReaderAccess(request.SharePointOnPremises ? BuiltInIdentity.Everyone : BuiltInIdentity.EveryoneButExternalUsers);
                }
            }
            catch (Exception ex)
            {
                Log.Error("Provisioning.Common.MdlzComponents.MdlzCommonCustomizations.SetAccessForAll", ex.Message);
                throw;
            }
        }

        private void AdjustExternalSharing()
        {
            if (provTemplate.Properties.ContainsKey(cn_EnableExternalSharing))
            {
                if(provTemplate.Properties.ContainsKey(cn_EnableExternalSharing))
                    request.EnableExternalSharing =  provTemplate.Properties[cn_EnableExternalSharing].ToEnum<SharingCapabilities>();
            }
        }

        private void UsingContext(Action<ClientContext> action)
        {
            using (ClientContext _ctx = Authentication.GetAuthenticatedContext())
            {
                _ctx.RequestTimeout = int.MaxValue;
                action(_ctx);
            }
        }



        #endregion

        #region Step Methods
        private void PreProvisionApply()
        {
            //RemoveUnrequiredLocalizations(provTemplate, request.Lcid);

            //Add hostname parameter for custom actions token replacement
            provTemplate.Parameters.Add(cn_RemoteWebHostNameToken,
                string.Format(cn_RemoteWebHostNameTokenFormat, ConfigurationFactory.GetInstance().GetAppSetingsManager().GetAppSettings().HostedAppHostNameOverride));
            UsingContext(ctx =>
            {
                var owner = ctx.Web.EnsureUser(request.SiteOwner.Name);

                ctx.Web.AssociatedMemberGroup.Owner = ctx.Web.AssociatedOwnerGroup;
                ctx.Web.AssociatedMemberGroup.Update();
                ctx.Web.AssociatedVisitorGroup.Owner = ctx.Web.AssociatedOwnerGroup;
                ctx.Web.AssociatedVisitorGroup.Update();

                ctx.Load(owner);
                ctx.Load(ctx.Web, x => x.RegionalSettings.TimeZone, x=>x.RegionalSettings.TimeZones);
                ctx.ExecuteQueryRetry();

                if(ctx.Web.RegionalSettings.TimeZone.Id != request.TimeZoneId)
                {
                    ctx.Web.RegionalSettings.TimeZone = ctx.Web.RegionalSettings.TimeZones.FirstOrDefault(x=>x.Id == request.TimeZoneId);
                    ctx.Web.RegionalSettings.Update();
                    ctx.ExecuteQueryRetry();
                }

                request.SiteOwner.Email = owner.Email;
            });
        }
        private void PostProvisioningApply()
        {
            UsingContext(ctx =>
            {
                Web _web = ctx.Web;
                if (!isSubSite)
                {
                    SetAccessForAll(_web);
                }
            });
        }

        private void PreCreationApply()
        {
            actualRequestOwner = request.SiteOwner;
            provTemplate.Security.AdditionalOwners.Add(new OfficeDevPnP.Core.Framework.Provisioning.Model.User() { Name = actualRequestOwner.Name });
            request.SiteOwner = new SiteUser() { Name = appSettings.DefaultScAdminLoginName, Email = appSettings.DefaultScAdminLoginName };
            AdjustExternalSharing();
        }

        private void PostCreationApply()
        {
            request.SiteOwner = actualRequestOwner;

            //Reinstantiate Authentication object as the request url might have been changed in case safe url is on
            this.Authentication = new AppOnlyAuthenticationSite();
            this.Authentication.SiteUrl = request.Url;
        }
        #endregion

        #endregion

        #region Public Methods

        public void Apply(Action siteCreation, Action siteProvision)
        {
            PreCreationApply();

            try
            {
                siteCreation();
            }
            finally
            {
                PostCreationApply();
            }

            PreProvisionApply();
            siteProvision();
            PostProvisioningApply();
        }

        #endregion

        #region Public Static
        //public static void LocalizeElementsFix(string siteUrl, ProvisioningTemplate provTemplate, IAuthentication auth)
        //{
        //    using (ClientContext _ctx = auth.GetAuthenticatedContext())
        //    {
        //        _ctx.RequestTimeout = int.MaxValue;
        //        LocalizeElementsFix(_ctx.Web, provTemplate);
        //    }
        //}

        //public static void LocalizeElementsFix(Web web, ProvisioningTemplate provTemplate)
        //{
        //    var parser = new TokenParser(web, provTemplate);

        //    foreach (var item in provTemplate.Lists)
        //    {
        //        item.Title = parser.ParseString(item.Title);
        //        item.Url = parser.ParseString(item.Url);
        //        item.Description = parser.ParseString(item.Description);
        //    }

        //    foreach (var item in provTemplate.Pages)
        //    {
        //        foreach (var webpart in item.WebParts)
        //        {
        //            webpart.Contents = parser.ParseString(webpart.Contents);
        //            webpart.Title = parser.ParseString(webpart.Title);
        //        }
        //    }
        //}

        //public static void RemoveUnrequiredLocalizations(ProvisioningTemplate _provTemplate, uint currentLanguageID)
        //{
        //    _provTemplate.Localizations.RemoveAll(x => x.LCID != currentLanguageID);
        //}

        public static void AddCustomParametersToProvisioningTemplate(ProvisioningTemplate _provTemplate)
        {
            _provTemplate.Parameters.Add(cn_RemoteWebHostNameToken,
                string.Format(cn_RemoteWebHostNameTokenFormat, ConfigurationFactory.GetInstance().GetAppSetingsManager().GetAppSettings().HostedAppHostNameOverride));
        }

        public static void RemoveRecentFromQuickLaunch(ClientContext ctx)
        {
            ctx.Load(ctx.Web.Navigation.QuickLaunch);
            ctx.ExecuteQueryRetry();

            var nav = ctx.Web.Navigation.QuickLaunch.Where(x => x.Url == string.Empty || x.Url.EndsWith("SitePages/Forms/ByAuthor.aspx"));

            if (nav != null)
                for (int i = nav.Count() - 1; i >= 0; i--)
                {
                    nav.ElementAt(i).DeleteObject();
                }
            if (ctx.HasPendingRequest)
                ctx.ExecuteQueryRetry();
        }
        #endregion
    }
}
