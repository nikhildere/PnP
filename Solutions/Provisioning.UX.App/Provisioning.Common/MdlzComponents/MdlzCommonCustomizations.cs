using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
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

        #region Constants

        private const string rt_Hostname = "[RemoteWebHostNameToken]";

        #endregion

        #region Fields
        private bool isSubSite;
        private ProvisioningTemplate provTemplate;
        private SiteInformation request;
        private string actualRequestOwner;
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

        private void SetRequestAccessMails(Web web)
        {
            try
            {
                string emailAddresses = "";

            }
            catch (Exception ex)
            {
                Log.Error("Provisioning.Common.MdlzComponents.MdlzCommonCustomizations.SetRequestAccessMails", ex.Message);
                throw;
            }
        }

        private void SetAccessForAll(Web web)
        {
            try
            {
                if (!request.IsConfidential)
                {
                    web.AddReaderAccess();
                }
            }
            catch (Exception ex)
            {
                Log.Error("Provisioning.Common.MdlzComponents.MdlzCommonCustomizations.SetAccessForAll", ex.Message);
                throw;
            }
        }

        private void AddHostnameToCustomActionUrls()
        {
            AddHostnameToCustomActionUrls(provTemplate.CustomActions.SiteCustomActions);
            AddHostnameToCustomActionUrls(provTemplate.CustomActions.WebCustomActions);
        }

        private void AddHostnameToCustomActionUrls(CustomActionCollection actions)
        {
            try
            {
                foreach (var item in actions)
                {
                    if (!string.IsNullOrEmpty(item.Url))
                        item.Url = item.Url.Replace(rt_Hostname, appSettings.HostedAppHostNameOverride);

                    if (!string.IsNullOrEmpty(item.ScriptBlock))
                        item.ScriptBlock = item.ScriptBlock.Replace(rt_Hostname, appSettings.HostedAppHostNameOverride);
                }
            }
            catch (Exception ex)
            {
                Log.Error("Provisioning.Common.MdlzComponents.MdlzCommonCustomizations.AddHostnameToCustomActionUrls", ex.Message);

                throw;
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
            UsingContext(ctx =>
            {
                Web _web = ctx.Web;
                isSubSite = _web.IsSubSite();
                if (!isSubSite)
                {
                    EnsureDefaultAssociatedGroups(_web);
                    DisableSPD(ctx.Site);
                }
                AddHostnameToCustomActionUrls();
                DisableMDS(_web);
            });
        }

        private void PostProvisioningApply()
        {
            UsingContext(ctx =>
            {
                Web _web = ctx.Web;
                if (!isSubSite)
                {
                    SetRequestAccessMails(_web);
                    SetAccessForAll(_web);
                }
            });
        }

        private void PreCreationApply()
        {
            actualRequestOwner = request.SiteOwner.Name;
            provTemplate.Security.AdditionalOwners.Add(new OfficeDevPnP.Core.Framework.Provisioning.Model.User() { Name = actualRequestOwner });
            request.SiteOwner = new SiteUser() { Name = appSettings.DefaultScAdminLoginName };
        }

        private void PostCreationApply()
        {
            request.SiteOwner.Name = actualRequestOwner;
        }
        #endregion

        #endregion

        #region Public Methods
        public void Apply(Action siteCreation, Action siteProvision)
        {
            PreCreationApply();
            siteCreation();
            PostCreationApply();

            PreProvisionApply();
            siteProvision();
            PostProvisioningApply();
        }

        public static void EnsureDefaultAssociatedGroups(Web w)
        {
            try
            {
                var ctx = w.Context;

                ctx.Load(w, x => x.Title, x => x.AssociatedOwnerGroup, x => x.AssociatedMemberGroup, x => x.AssociatedVisitorGroup);
                ctx.ExecuteQuery();

                if (w.AssociatedOwnerGroup == null)
                    w.AssociatedOwnerGroup = w.SiteGroups.Add(new GroupCreationInformation { Title = string.Format("{0} Owner", w.Title) });

                if (w.AssociatedMemberGroup == null)
                    w.AssociatedMemberGroup = w.SiteGroups.Add(new GroupCreationInformation { Title = string.Format("{0} Member", w.Title) });

                if (w.AssociatedVisitorGroup == null)
                    w.AssociatedVisitorGroup = w.SiteGroups.Add(new GroupCreationInformation { Title = string.Format("{0} Visitor", w.Title) });

                ctx.ExecuteQuery();
            }
            catch (Exception ex)
            {
                Log.Error("Provisioning.Common.MdlzComponents.MdlzCommonCustomizations.EnsureDefaultAssociatedGroups", ex.Message);
                throw;
            }
        }

        public static void DisableSPD(Site site)
        {
            try
            {
                site.AllowDesigner = site.AllowMasterPageEditing = site.AllowRevertFromTemplate = false;
                site.Context.Load(site);
                site.Context.ExecuteQuery();
            }
            catch (Exception ex)
            {
                Log.Error("Provisioning.Common.MdlzComponents.MdlzCommonCustomizations.DisableSPD", ex.Message);
                throw;
            }
        }

        public static void DisableMDS(Web web)
        {
            try
            {
                web.EnableMinimalDownload = false;
                web.Update();
                web.Context.Load(web);
                web.Context.ExecuteQuery();
            }
            catch (Exception ex)
            {
                Log.Error("Provisioning.Common.MdlzComponents.MdlzCommonCustomizations.DisableSPD", ex.Message);
                throw;
            }
        }
        #endregion
    }
}
