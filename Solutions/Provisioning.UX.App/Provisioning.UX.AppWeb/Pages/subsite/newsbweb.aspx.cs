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
using Provisioning.Common.Data.Metadata;

namespace Provisioning.UX.AppWeb.Pages.SubSite
{
    public partial class newsbweb : System.Web.UI.Page
    {
        private ClientContext _ctxCurrentWeb;
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
            _ctxCurrentWeb = _spContext.CreateUserClientContextForSPHost();

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


            BindSiteTemplates();

            var languages = MetadataFactory.GetInstance().GetManager().GetAvailableLanguages();
            ddlLanguages.DataSource = languages;
            ddlLanguages.DataBind();
            if (languages.Any(x => x.Value == _ctxCurrentWeb.Web.Language.ToString()))
            {
                var itemToSelect = ddlLanguages.Items.Cast<System.Web.UI.WebControls.ListItem>().FirstOrDefault(x => x.Value == _ctxCurrentWeb.Web.Language.ToString());
                if (itemToSelect != null)
                    itemToSelect.Selected = true;
            }



        }

        private void BindSiteTemplates()
        {
            if (string.IsNullOrEmpty(ddlLanguages.SelectedValue))
            {
                _ctxCurrentWeb.Load(_ctxCurrentWeb.Web, x => x.Language);
                _ctxCurrentWeb.ExecuteQueryRetry();
            }

            var availableWebTemplatesForWeb = _ctxCurrentWeb.Web.GetAvailableWebTemplates(string.IsNullOrEmpty(ddlLanguages.SelectedValue) ? _ctxCurrentWeb.Web.Language : uint.Parse(ddlLanguages.SelectedValue), true);

            _ctxCurrentWeb.Load(availableWebTemplatesForWeb);
            bool isPublishingWeb = _ctxCurrentWeb.Web.IsPublishingWeb();
            
            var _siteFactory = SiteTemplateFactory.GetInstance();
            var _tm = _siteFactory.GetManager();
            var _templates = _tm.GetAvailableTemplates();

            var pubTemplates = new[] { "ENTERWIKI#0" };

            listSites.DataSource = _templates.Where(x => !x.RootWebOnly && x.Enabled
                                        && availableWebTemplatesForWeb.Any(y => y.Name == x.RootTemplate)
                                        && (isPublishingWeb || !pubTemplates.Any(y => y == x.RootTemplate)));
            listSites.DataBind();
            listSites.SelectedIndex = 0;
        }

        protected bool DoesUserHavePermission()
        {
            BasePermissions perms = new BasePermissions();
            perms.Set(PermissionKind.ManageSubwebs);
            ClientResult<bool> _permResult = _ctxCurrentWeb.Web.DoesUserHavePermissions(perms);
            _ctxCurrentWeb.ExecuteQuery();
            return _permResult.Value;
        }

        protected void btnCreate_Click(object sender, EventArgs e)
        {
            try
            {
                pnlErrMsg.Visible = false;
                ltlErrMsg.Text = "";

                var spContext = SharePointContextProvider.Current.GetSharePointContext(Context);
                Web newWeb = null;
                using (var ctx = spContext.CreateUserClientContextForSPHost())
                {
                    //Web newWeb = CreateSubSite(ctx, ctx.Web, txtUrl.Text, listSites.SelectedValue, txtTitle.Text, txtDescription.Text);
                    newWeb = CreateSubSiteAndApplyProvisioningTemplate(ctx, ctx.Web, txtUrl.Text, txtTitle.Text, txtDescription.Text);
                }

                if (newWeb != null)
                {
                    // Redirect to just created site
                    Response.Redirect(newWeb.Url);
                }
            }
            catch (Exception ex)
            {
                pnlErrMsg.Visible = true;
                ltlErrMsg.Text = "An error occurred while creating your site. Please try again.";
                Log.Error($"{nameof(newsbweb)}:{nameof(btnCreate)}", ex.ToString());
            }
        }

        private void SetHiddenFields()
        {
            string _url = Request.QueryString["SPHostUrl"];
            this.Url.Value = _url;
        }


        public Web CreateSubSiteAndApplyProvisioningTemplate(ClientContext ctx, Web hostWeb, string txtUrl,
                                 string title, string description)
        {
            if (!hostWeb.WebExists(txtUrl))
            {
                var _siteTemplateFactory = SiteTemplateFactory.GetInstance();
                var _tm = _siteTemplateFactory.GetManager();
                var _template = _tm.GetTemplateByName(listSites.SelectedItem.Text);

                // Create web creation configuration
                WebCreationInformation information = new WebCreationInformation();
                information.WebTemplate = _template.RootTemplate;
                information.Description = description;
                information.Title = title;
                information.Url = txtUrl;
                information.Language = ddlLanguages.SelectedValue.ToInt32();

                Web newWeb = null;
                newWeb = hostWeb.Webs.Add(information);
                ctx.ExecuteQuery();
                
                ctx.Load(newWeb);
                ctx.ExecuteQuery();

                using (var ctxNewWeb = ctx.Clone(newWeb.Url))
                {
                    newWeb = ctxNewWeb.Web;
                    ProvisioningTemplate _provisioningTemplate = GetProvTemplateAndMakeAdjustments(newWeb, _tm, _template);
                    newWeb.ApplyProvisioningTemplate(_provisioningTemplate);
                }

                pnlErrMsg.Visible = false;
                ltlErrMsg.Text = "";

                return newWeb;
            }
            else
            {
                pnlErrMsg.Visible = true;
                ltlErrMsg.Text = "Subsite with same url already exists, change the url and try again.";
            }
            return null;
        }


        private ProvisioningTemplate GetProvTemplateAndMakeAdjustments(Web newWeb, ISiteTemplateManager _tm, Template _template)
        {

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

        protected void ddlLanguages_SelectedIndexChanged(object sender, EventArgs e)
        {
            BindSiteTemplates();
        }
    }
}