using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Framework.Provisioning.ObjectHandlers;
using Provisioning.Common.Data.Templates;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;
using System.Web.UI;
using System.Web.UI.WebControls;
using Provisioning.Common.MdlzComponents;
using Provisioning.Common.Utilities;
using Provisioning.Common.Configuration;
using OfficeDevPnP.Core.Framework.Provisioning.Model;

namespace Provisioning.UX.AppWeb.Pages.SubSite
{
    public partial class newsbweb : System.Web.UI.Page
    {
        private ClientContext _ctx;
        private string remoteUrl = string.Empty;

        protected void Page_PreInit(object sender, EventArgs e)
        {
            Uri redirectUrl;
            switch (SharePointContextProvider.CheckRedirectionStatus(Context, out redirectUrl))
            {
                case RedirectionStatus.Ok:
                    return;
                case RedirectionStatus.ShouldRedirect:
                    Response.Redirect(redirectUrl.AbsoluteUri, endResponse: true);
                    break;
                case RedirectionStatus.CanNotRedirect:
                    Response.Write("An error occurred while processing your request.");
                    Response.End();
                    break;
            }
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            remoteUrl = HttpContext.Current.Request.Url.Host;

            var _spContext = SharePointContextProvider.Current.GetSharePointContext(Context);
            _ctx = _spContext.CreateUserClientContextForSPHost();

            if (!Page.IsPostBack)
            {
                if (this.DoesUserHavePermission())
                {
                    SetHiddenFields();
                    SetUI();

                }
            }
        }

        private void SetUI()
        {
            
            // define initial script, needed to render the chrome control
            string script = @"
            function chromeLoaded() {
                $('body').show();
            }

            //function callback to render chrome after SP.UI.Controls.js loads
            function renderSPChrome() {
                //Set the chrome options for launching Help, Account, and Contact pages
                var options = {
                    'appTitle': document.title,
                    'onCssLoaded': 'chromeLoaded()'
                };

                //Load the Chrome Control in the divSPChrome element of the page
                var chromeNavigation = new SP.UI.Controls.Navigation('divSPChrome', options);
                chromeNavigation.setVisible(true);
            }";

            //register script in page
            Page.ClientScript.RegisterClientScriptBlock(typeof(Default), "BasePageScript", script, true);

            lblBasePath.Text = Request["SPHostUrl"] + "/";

            var availableWebTemplatesForWeb = _ctx.Web.GetAvailableWebTemplates(1033, true);
            _ctx.Load(availableWebTemplatesForWeb);
            bool isPublishingWeb = _ctx.Web.IsPublishingWeb();

            var _siteFactory = SiteTemplateFactory.GetInstance();
            var _tm = _siteFactory.GetManager();
            var _templates = _tm.GetAvailableTemplates();

            var pubTemplates = new[] { "ENTERWIKI#0" };
            
            listSites.DataSource = _templates.Where(x => !x.RootWebOnly && x.Enabled
                                        && availableWebTemplatesForWeb.Any(y=>y.Name ==  x.RootTemplate)
                                        && (isPublishingWeb || !pubTemplates.Any(y => y == x.RootTemplate)));
            listSites.DataBind();

            listSites.SelectedIndex = 0;
        }

        protected bool DoesUserHavePermission()
        {
            BasePermissions perms = new BasePermissions();
            perms.Set(PermissionKind.ManageSubwebs);
            ClientResult<bool> _permResult = _ctx.Web.DoesUserHavePermissions(perms);
            _ctx.ExecuteQuery();
            return _permResult.Value;
        }

        protected void btnCreate_Click(object sender, EventArgs e)
        {
            var spContext = SharePointContextProvider.Current.GetSharePointContext(Context);

            using (var ctx = spContext.CreateUserClientContextForSPHost())
            {
                //Web newWeb = CreateSubSite(ctx, ctx.Web, txtUrl.Text, listSites.SelectedValue, txtTitle.Text, txtDescription.Text);
                Web newWeb = CreateSubSiteAndApplyProvisioningTemplate(ctx, ctx.Web, txtUrl.Text, txtTitle.Text, txtDescription.Text);

                // Redirect to just created site
                Response.Redirect(newWeb.Url);
            }
        }

        private void SetHiddenFields()
        {
            string _url = Request.QueryString["SPHostUrl"];
            this.Url.Value = _url;
        }

        public Web CreateSubSite(ClientContext ctx, Web hostWeb, string txtUrl,
                                string template, string title, string description)
        {
            // Create web creation configuration
            WebCreationInformation information = new WebCreationInformation();
            information.WebTemplate = template;
            information.Description = description;
            information.Title = title;
            information.Url = txtUrl;
            // Currently all English, could be extended to be configurable based on language pack usage



            Web newWeb = null;
            newWeb = hostWeb.Webs.Add(information);
            ctx.ExecuteQuery();

            ctx.Load(newWeb);
            ctx.ExecuteQuery();

            // Add sub site link override
            new subsitehelper().AddJsLink(ctx, newWeb, this.Request);

            // Let's first upload the custom theme to host web
            new subsitehelper().DeployThemeToWeb(hostWeb, "MyCustomTheme",
                            HostingEnvironment.MapPath(string.Format("~/{0}", "Pages/subsite/resources/custom.spcolor")),
                            string.Empty,
                            HostingEnvironment.MapPath(string.Format("~/{0}", "Pages/subsite/resources/custombg.jpg")),
                            string.Empty);

            // Setting the Custom theme to host web
            new subsitehelper().SetThemeBasedOnName(ctx, newWeb, hostWeb, "MyCustomTheme");

            // Set logo to the site

            // Get the path to the file which we are about to deploy
            new subsitehelper().UploadAndSetLogoToSite(ctx.Web, HostingEnvironment.MapPath(
                                                            string.Format("~/{0}", "Pages/subsite/resources/template-icon.png")));

            // All done, let's return the newly created site
            return newWeb;
        }


        public Web CreateSubSiteAndApplyProvisioningTemplate(ClientContext ctx, Web hostWeb, string txtUrl,
                                 string title, string description)
        {
            // Create web creation configuration
            WebCreationInformation information = new WebCreationInformation();
            information.WebTemplate = listSites.SelectedItem.Value;
            information.Description = description;
            information.Title = title;
            information.Url = txtUrl;

            Web newWeb = null;
            newWeb = hostWeb.Webs.Add(information);
            ctx.ExecuteQuery();

            ctx.Load(newWeb);
            ctx.ExecuteQuery();

            ProvisioningTemplate _provisioningTemplate = GetProvTemplateAndMakeAdjustments(newWeb);

            newWeb.ApplyProvisioningTemplate(_provisioningTemplate);

            return newWeb;
        }

        private ProvisioningTemplate GetProvTemplateAndMakeAdjustments(Web newWeb)
        {
            var _siteTemplateFactory = SiteTemplateFactory.GetInstance();
            var _tm = _siteTemplateFactory.GetManager();
            var _template = _tm.GetTemplateByName(listSites.SelectedItem.Text);
            //var templatePath = Server.MapPath(Path.Combine("~/Resources/SiteTemplates/ProvisioningTemplates", _template.ProvisioningTemplate));
            var _provisioningTemplate = _tm.GetProvisioningTemplate(_template.ProvisioningTemplate);

            ReflectionManager _helper = new ReflectionManager();
            _provisioningTemplate.Connector = _helper.GetProvisioningConnector(ModuleKeys.PROVISIONINGCONNECTORS_KEY);

            //MdlzCommonCustomizations.RemoveUnrequiredLocalizations(_provisioningTemplate, newWeb.Language);
            //MdlzCommonCustomizations.LocalizeElementsFix(newWeb, _provisioningTemplate);
            MdlzCommonCustomizations.AddCustomParametersToProvisioningTemplate(_provisioningTemplate);

            //Handle Custom actions


            foreach (var _webActions in _provisioningTemplate.CustomActions.WebCustomActions)
            {
                //IF ITS A SCRIPT SRC WE DO NOT WANT TO MODIFY
                if (!string.IsNullOrEmpty(_webActions.Url))
                {
                    var _escapedURI = Uri.EscapeUriString(newWeb.Url);
                    _webActions.Url = string.Format(_webActions.Url, _escapedURI);
                }
            }

            return _provisioningTemplate;
        }

        protected void btnCancel_Click(object sender, EventArgs e)
        {
            Response.Redirect(Page.Request["SPHostUrl"]);
        }
    }
}