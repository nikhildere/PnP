using Microsoft.SharePoint.Client;
using Provisioning.Common;
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
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security;
using System.Text;
using System.Threading.Tasks;

namespace Provisioning.Job
{
    public class SiteProvisioningJob
    {
        // Notes: 
        // Recent: Cleanup activity - Removed unnecessary code
        // Previous: updates were made in processing site requests that include handling timeouts in provisioning the site itself
        // as well as updates to handle failed site provisioning attempts such as retries and picking up where it left off.

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
            //var sec = new SecureString();
            //("nick@2017").ToCharArray().ToList().ForEach(x => sec.AppendChar(x));
            //using (var ctx = new ClientContext("https://ndmdlz.sharepoint.com/sites/SPOVF3Team/") { Credentials = new SharePointOnlineCredentials("nd.mdlz@ndmdlz.onmicrosoft.com", sec) })
            //{
            //    var caColl = ctx.Web.GetCustomActions();
            //    var ca = caColl.FirstOrDefault(x => x.Name == "MondelezJsInjections_e22a344d-3e37-4593-b643-17b99e0b459e");

            //    ca.Sequence = 100;
            //    ca.ScriptBlock = @"var scr_elem = document.createElement('script');
            //                     scr_elem.type = 'text/javascript';
            //                    scr_elem.src = '/SiteAssets/Team/scripts/MDLZTeamsite.Init.js';
            //                    var headElem = document.getElementsByTagName('head')[0];
            //                    headElem.appendChild(scr_elem);";
            //    ca.ScriptSrc = "";
            //    ca.Update();
            //    ctx.Load(ca);
            //    ctx.ExecuteQuery();
            //}

            #region Process Approved Requests
            // Begin processing of approved requests
            Log.Info("Provisioning.Job.SiteProvisioningJob.ProcessSiteRequests", "Beginning Processing the site request repository");
            var _siteManager = _requestFactory.GetSiteRequestManager();
            var _requests = _siteManager.GetApprovedRequests();
            Log.Info("Provisioning.Job.SiteProvisioningJob.ProcessSiteRequests", "There are {0} site requests pending in the repository.", _requests.Count);
            if (_requests.Count > 0)
            {
                this.ProvisionSites(_requests);
            }
            else
            {
                Log.Info("Provisioning.Job.SiteProvisioningJob.ProcessSiteRequests", "There are no site requests pending in the repository");
            }

            SendPendingAndRejectedEmail(_siteManager);

            // End processing of approved requests
            #endregion

            #region Process Failed or Incomplete Requests
            // Begin processing of failed requests (retry all that are not in approved or complete status)
            //Log.Info("Provisioning.Job.SiteProvisioningJob.ProcessSiteRequests", "Beginning processing of the site request repository for failed or incomplete requests");
            //_siteManager = _requestFactory.GetSiteRequestManager();
            //_requests = _siteManager.GetIncompleteRequests();
            //Log.Info("Provisioning.Job.SiteProvisioningJob.ProcessSiteRequests", "There are {0} failed site requests pending in the repository.", _requests.Count);
            //if (_requests.Count > 0)
            //{
            //    this.ProvisionSites(_requests);
            //}
            //else
            //{
            //    Log.Info("Provisioning.Job.SiteProvisioningJob.ProcessSiteRequests", "There are no failed site requests pending in the repository");
            //}
            // End processing of failed requests
            #endregion
        }

        /// <summary>
        /// Member to handle provisioning sites
        /// </summary>
        /// <param name="siteRequests">The site request</param>
        public void ProvisionSites(ICollection<SiteInformation> siteRequests)
        {
            var _tm = this._siteTemplateFactory.GetManager();
            var _requestManager = this._requestFactory.GetSiteRequestManager();

            foreach (var siteRequest in siteRequests)
            {
                string siteOwnerEmail = siteRequest.SiteOwner.Email, siteOwnerName = siteRequest.SiteOwner.Name;
                try
                {
                    // ****************************************************
                    // Step 1 - Get Template                   
                    // ****************************************************
                    var _template = _tm.GetTemplateByName(siteRequest.Template);
                    if (_template == null)
                    {
                        //NO TEMPLATE FOUND THAT MATCHES WE CANNOT PROVISION A SITE
                        var _message = string.Format("Template: {0} was not found for site {1}. Ensure that the template file exits.", siteRequest.Template, siteRequest.Url);
                        Log.Error("Provisioning.Job.SiteProvisioningJob.ProvisionSites", _message);
                        throw new ConfigurationErrorsException(_message);
                    }

                    // ****************************************************
                    // Step 2 - Update request status                    
                    // ****************************************************
                    var _provisioningTemplate = _tm.GetProvisioningTemplate(_template.ProvisioningTemplate);

                    //NO TEMPLATE FOUND THAT MATCHES WE CANNOT PROVISION A SITE
                    if (_template == null)
                    {
                        Log.Warning("Provisioning.Job.SiteProvisioningJob.ProvisionSites", "Template {0} was not found for Site Url {1}.", siteRequest.Template, siteRequest.Url);
                    }

                    _requestManager.UpdateRequestStatus(siteRequest.Url, SiteRequestStatus.Processing);

                    SiteProvisioningManager _siteProvisioningManager = new SiteProvisioningManager(siteRequest, _template);
                    MdlzCommonCustomizations customizations = new MdlzCommonCustomizations(siteRequest, _provisioningTemplate, _template);

                    customizations.Apply(
                    () =>
                    {
                        // ****************************************************
                        // Step 3 - Create the site                    
                        // ****************************************************
                        Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites", "Provisioning Site Request for Site Url {0}.", siteRequest.Url);
                        _siteProvisioningManager.CreateSiteCollection(siteRequest, _template);
                    },
                    () =>
                    {
                        // ****************************************************
                        // Step 4 - Apply provisioning template                    
                        // ****************************************************
                        Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites", "Applying Provisioning Template for Site Url {0}.", siteRequest.Url);
                        _siteProvisioningManager.ApplyProvisioningTemplate(_provisioningTemplate, siteRequest, _template);
                    });

                    // ****************************************************
                    // Step 5 - Update request access email                    
                    // ****************************************************
                    Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites", "Updating Request Access Email Address for Site Url {0}.", siteRequest.Url);
                    _siteProvisioningManager.UpdateRequestAccessEmail(siteRequest);

                    // ****************************************************
                    // Step 6 - Update site description                   
                    // ****************************************************
                    Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites", "Updating site description for Site Url {0}.", siteRequest.Url);
                    _siteProvisioningManager.UpdateSiteDescription(siteRequest);

                    // ****************************************************
                    // Step 7 - Send success email                    
                    // ****************************************************
                    Log.Info("Provisioning.Job.SiteProvisioningJob.ProvisionSites", "Sending Success Email for Site Url {0}.", siteRequest.Url);


                    this.SendSuccessEmail(siteRequest);

                    // ****************************************************
                    // Step 8 - Set status to complete                    
                    // ****************************************************
                    _requestManager.UpdateRequestStatus(siteRequest.Url, SiteRequestStatus.Complete, "");

                }
                catch (ProvisioningTemplateException _pte)
                {
                    _requestManager.UpdateRequestStatus(siteRequest.Url, SiteRequestStatus.CompleteWithErrors, _pte.Message);
                }
                catch (Exception _ex)
                {
                    Log.Error("Provisioning.Job.SiteProvisioningJob.ProvisionSites", _ex.ToString());
                    _requestManager.UpdateRequestStatus(siteRequest.Url, SiteRequestStatus.Exception, _ex.Message);
                    var siteOwner = (siteRequest.SiteOwner ?? (siteRequest.SiteOwner = new SiteUser()));
                    siteOwner.Name = siteOwnerName;
                    siteOwner.Email = siteOwnerEmail;
                    this.SendFailureEmail(siteRequest, _ex.Message, true);
                }
            }
        }



        /// <summary>
        /// Sends a Notification that the Site was created
        /// </summary>
        /// <param name="info"></param>
        protected void SendSuccessEmail(SiteInformation info)
        {
            //TODO CLEAN UP EMAILS
            try
            {
                StringBuilder _admins = new StringBuilder();
                SuccessEmailMessage _message = new SuccessEmailMessage();
                _message.SiteUrl = info.Url;
                _message.SiteOwner = info.SiteOwner.Name;
                _message.Subject = "Notification: Your new SharePoint site is ready";

                _message.To.Add(info.SiteOwner.Email);
                foreach (var admin in info.AdditionalAdministrators)
                {
                    _message.Cc.Add(admin.Email);
                    _admins.Append(admin.Name);
                    _admins.Append(" ");
                }
                _message.SiteAdmin = _admins.ToString();
                EmailHelper.SendNewSiteSuccessEmail(_message);
            }
            catch (Exception ex)
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
        protected void SendFailureEmail(SiteInformation info, string errorMessage, bool sendToAdmin)
        {
            try
            {
                StringBuilder _admins = new StringBuilder();
                FailureEmailMessage _message = new FailureEmailMessage();
                _message.SiteUrl = info.Url;
                _message.SiteOwner = info.SiteOwner.Name;
                _message.Subject = "Alert: Your new SharePoint site request had a problem.";
                _message.ErrorMessage = errorMessage;
                if (sendToAdmin)
                {
                    _message.To.Add(info.SiteOwner.Email);
                }
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
                    if (sendToAdmin)
                    {
                        _message.Cc.Add(admin.Email);
                    }
                    _admins.Append(admin.Name);
                    _admins.Append(" ");
                }
                _message.SiteAdmin = _admins.ToString();
                EmailHelper.SendFailEmail(_message);
            }
            catch (Exception ex)
            {
                Log.Error("Provisioning.Job.SiteProvisioningJob.SendSuccessEmail",
                    "There was an error sending email. The Error Message: {0}, Exception: {1}",
                     ex.Message,
                     ex);
            }

        }

        protected void SendPendingAndRejectedEmail(ISiteRequestManager mgr)
        {
            ICollection<SiteInformation> infoColl = mgr.GetApprovalAndRejectedSitesForNotification();
            var approverEmailAddresses = mgr.GetRequestApprovers().Where(x=> !string.IsNullOrEmpty(x.Email)).Select(x=>x.Email);

            infoColl.ToList().ForEach(info =>
            {
                string newStatusMsg = null;
                if (info.RequestStatus == "New" && string.IsNullOrEmpty(info.NotificationStatus))
                {
                    #region SentForApprovalEmailMessage
                    try
                    {
                        StringBuilder _admins = new StringBuilder();
                        SentForApprovalEmailMessage _message = new SentForApprovalEmailMessage();
                        _message.SiteUrl = info.Url;
                        _message.SiteOwner = info.SiteOwner.Name;
                        _message.SiteTemplate = info.Template;
                        _message.SiteTitle = info.Title;
                        _message.Subject = "Notification: Your new SharePoint site request is being reviewed";

                        _message.To.Add(info.SiteOwner.Email);
                        foreach (var admin in info.AdditionalAdministrators)
                        {
                            _message.Cc.Add(admin.Email);
                            _admins.Append(admin.Name);
                            _admins.Append(" ");
                        }
                        _message.SiteAdmin = _admins.ToString();
                        EmailHelper.SendSentForApprovalEmail(_message);

                        newStatusMsg = "Approval Mail Sent";
                    }
                    catch (Exception ex)
                    {
                        Log.Error("Provisioning.Job.SiteProvisioningJob.SendPendingAndRejectedEmail",
                            "There was an error sending email. The Error Message: {0}, Exception: {1}",
                             ex.Message,
                             ex);
                    }
                    #endregion

                    #region NewRequestReceivedForApprovalEmailMessage
                    if (!string.IsNullOrEmpty(newStatusMsg))//This conditions means that site owner mail went through successfully
                    {
                        try
                        {
                            StringBuilder _admins = new StringBuilder();
                            NewRequestReceivedForApprovalEmailMessage _message = new NewRequestReceivedForApprovalEmailMessage();
                            _message.SiteUrl = info.Url;
                            _message.SiteOwner = info.SiteOwner.Name;
                            _message.SiteTemplate = info.Template;
                            _message.SiteTitle = info.Title;
                            _message.Subject = "Approval Required For Site Creation";
                            _message.EditPageUrl = $"{_settings.SPHostUrl}/Lists/SiteRequests/EditForm.aspx?ID={info.Id}";
                            
                            _message.To.AddRange(approverEmailAddresses);
                            foreach (var admin in info.AdditionalAdministrators)
                            {
                                _admins.Append(admin.Name);
                                _admins.Append(" ");
                            }
                            _message.SiteAdmin = _admins.ToString();
                            EmailHelper.SendNewRequestReceivedForApprovalEmailMessage(_message);
                        }
                        catch (Exception ex)
                        {
                            Log.Error("Provisioning.Job.SiteProvisioningJob.SendPendingAndRejectedEmail",
                                "There was an error sending email. The Error Message: {0}, Exception: {1}",
                                 ex.Message,
                                 ex);
                        }
                    }
                    #endregion
                }
                else if (info.RequestStatus == "Rejected" && !string.IsNullOrEmpty(info.NotificationStatus) && info.NotificationStatus != "Rejected Mail Sent")
                {
                    #region RequestRejectedEmailMessage
                    try
                    {
                        StringBuilder _admins = new StringBuilder();
                        RequestRejectedEmailMessage _message = new RequestRejectedEmailMessage();
                        _message.SiteUrl = info.Url;
                        _message.SiteOwner = info.SiteOwner.Name;
                        _message.SiteTemplate = info.Template;
                        _message.SiteTitle = info.Title;
                        _message.Subject = "Alert: Your new SharePoint site request has been rejected.";

                        _message.To.Add(info.SiteOwner.Email);
                        foreach (var admin in info.AdditionalAdministrators)
                        {
                            _message.Cc.Add(admin.Email);
                            _admins.Append(admin.Name);
                            _admins.Append(" ");
                        }
                        _message.SiteAdmin = _admins.ToString();
                        EmailHelper.SendRequestRejectedEmailMessage(_message);
                        newStatusMsg = "Rejected Mail Sent";
                    }
                    catch (Exception ex)
                    {
                        Log.Error("Provisioning.Job.SiteProvisioningJob.SendPendingAndRejectedEmail",
                            "There was an error sending email. The Error Message: {0}, Exception: {1}",
                             ex.Message,
                             ex);
                    }
                    #endregion
                }

                if (!string.IsNullOrEmpty(newStatusMsg))
                {
                    //Update request status 
                    mgr.UpdateNotificationStatus(info.Url, newStatusMsg);
                }
            });
        }
    }
}
