﻿using Provisioning.Common;
using Provisioning.Common.Authentication;
using Provisioning.Common.Configuration;
using Provisioning.Common.Configuration.Application;
using Provisioning.Common.Data;
using Provisioning.Common.Data.SiteRequests;
using Provisioning.Common.Data.Templates;
using Provisioning.Common.Mail;
using Provisioning.Common.MdlzComponents;
using Provisioning.Common.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Provisioning.Job
{
    public class SiteProvisioningJob
    {
        #region Instance Members
        ISiteRequestFactory _requestFactory;
        IConfigurationFactory _configFactory;
        ISiteTemplateFactory _siteTemplateFactory;
        IAppSettingsManager _appManager;
        AppSettings _settings;
        #endregion

        #region Constructors
        public SiteProvisioningJob()
        {
            this._configFactory = ConfigurationFactory.GetInstance();
            this._appManager = _configFactory.GetAppSetingsManager();
            this._settings = _appManager.GetAppSettings();
            this._requestFactory = SiteRequestFactory.GetInstance();
            this._siteTemplateFactory = SiteTemplateFactory.GetInstance();
        }
        #endregion

        public void ProcessSiteRequests()
        {
            var _srManager = _requestFactory.GetSiteRequestManager();
            var _requests = _srManager.GetApprovedRequests();

            Log.Info("Provisioning.Job.SiteProvisioningJob.ProcessSiteRequests", "There is {0} Site Request Messages pending in the queue.", _requests.Count);
            //TODO LOG HOW MANY ITEMS
            if(_requests.Count > 0)
            {
                this.ProvisionSites(_requests);
            }
            else
            {
                Log.Info("Provisioning.Job.SiteProvisioningJob.ProcessSiteRequests", "There is no Site Request pending in the queue");
            }
        }

        public void ProvisionSites(ICollection<SiteRequestInformation> siteRequests)
        {
            var _tm = this._siteTemplateFactory.GetManager();
            var _requestManager = this._requestFactory.GetSiteRequestManager();

            foreach (var siteRequest in siteRequests)
            {
                try 
                {
                    var _template = _tm.GetTemplateByName(siteRequest.Template);
                    var _provisioningTemplate = _tm.GetProvisioningTemplate(_template.ProvisioningTemplate);
                  
                    //NO TEMPLATE FOUND THAT MATCHES WE CANNOT PROVISION A SITE
                    if (_template == null) {
                        Log.Warning("Provisioning.Job.SiteProvisioningJob.ProvisionSites", "Template {0} was not found for Site Url {1}.", siteRequest.Template, siteRequest.Url);
                    }

                    _requestManager.UpdateRequestStatus(siteRequest.Url, SiteRequestStatus.Processing);
                    SiteProvisioningManager _siteProvisioningManager = new SiteProvisioningManager(siteRequest, _template);
                    Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites", "Provisioning Site Request for Site Url {0}.", siteRequest.Url);

                    MdlzCommonCustomizations customizations = new MdlzCommonCustomizations(siteRequest, _provisioningTemplate, _template);
                    
                    customizations.Apply(()=>_siteProvisioningManager.CreateSiteCollection(siteRequest, _template), 
                                         ()=>_siteProvisioningManager.ApplyProvisioningTemplates(_provisioningTemplate, siteRequest));
                    
                    this.SendSuccessEmail(siteRequest);
                    _requestManager.UpdateRequestStatus(siteRequest.Url, SiteRequestStatus.Complete);
                }
                catch(ProvisioningTemplateException _pte)
                {
                    _requestManager.UpdateRequestStatus(siteRequest.Url, SiteRequestStatus.Exception, _pte.Message);
                }
                catch(Exception _ex)
                {
                  _requestManager.UpdateRequestStatus(siteRequest.Url, SiteRequestStatus.Exception, _ex.Message);
                  this.SendFailureEmail(siteRequest, _ex.Message);
                }
               
            }
        }

        /// <summary>
        /// Sends a Notification that the Site was created
        /// </summary>
        /// <param name="info"></param>
        protected void SendSuccessEmail(SiteRequestInformation info)
        {
            //TODO CLEAN UP EMAILS
            try
            { 
                StringBuilder _admins = new StringBuilder();
                SuccessEmailMessage _message = new SuccessEmailMessage();
                _message.SiteUrl = info.Url;
                _message.SiteOwner = info.SiteOwner.Name;
                _message.Subject = "Notification: Your new SharePoint site is ready";

                _message.To.Add(info.SiteOwner.Name);
                foreach (var admin in info.AdditionalAdministrators)
                {
                    _message.Cc.Add(admin.Name);
                    _admins.Append(admin.Name);
                    _admins.Append(" ");
                }
                _message.SiteAdmin = _admins.ToString();
                EmailHelper.SendNewSiteSuccessEmail(_message);
            }
            catch(Exception ex)
            {
                Log.Error("Provisioning.Job.SiteProvisioningJob.SendSuccessEmail",
                    "There was an error sending email. The Error Message: {0}, Exception: {1}", 
                     ex.Message,
                     ex);
         
            }
        }

        /// <summary>
        /// Sends an Failure Email Notification
        /// </summary>
        /// <param name="info"></param>
        /// <param name="errorMessage"></param>
        protected void SendFailureEmail(SiteRequestInformation info, string errorMessage)
        {
            try
            {
                StringBuilder _admins = new StringBuilder();
                FailureEmailMessage _message = new FailureEmailMessage();
                _message.SiteUrl = info.Url;
                _message.SiteOwner = info.SiteOwner.Name;
                _message.Subject = "Alert: Your new SharePoint site request had a problem.";
                _message.ErrorMessage = errorMessage;
                _message.To.Add(info.SiteOwner.Name);

                if (!string.IsNullOrEmpty(this._settings.SupportEmailNotification))
                {
                    string[] supportAdmins = this._settings.SupportEmailNotification.Split(';');
                    foreach (var supportAdmin in supportAdmins)
                    {
                        _message.To.Add(supportAdmin);

                    }
                }
                foreach (var admin in info.AdditionalAdministrators)
                {
                    _message.Cc.Add(admin.Name);
                    _admins.Append(admin.Name);
                    _admins.Append(" ");
                }
                _message.SiteAdmin = _admins.ToString();
                EmailHelper.SendFailEmail(_message);
            }
            catch(Exception ex)
            {
                Log.Error("Provisioning.Job.SiteProvisioningJob.SendSuccessEmail",
                    "There was an error sending email. The Error Message: {0}, Exception: {1}",
                     ex.Message,
                     ex);
            }
          
        }

    }
}
