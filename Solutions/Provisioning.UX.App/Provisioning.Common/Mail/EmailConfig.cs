using Provisioning.Common.Configuration;
using Provisioning.Common.Utilities;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Provisioning.Common.Mail
{
    public class EmailConfig
    {
        #region Variable

        public string SuccessEmailTemplate { get; set; }
        public string FailureEmailTemplate { get; set; }
        public string SentForApprovalEmailTemplate { get; set; }
        public string NewRequestReceivedForApprovalEmailTemplate { get; set; }
        public string RequestRejectedEmailTemplate { get; set; }
        public Stream SuccessEmailTemplateImage { get; set; }
        public Stream FailEmailTemplateImage { get; set; }
        public Stream SentForApprovalEmailTemplateImage { get; set; }
        public Stream NewRequestReceivedForApprovalEmailTemplateImage { get; set; }
        public Stream RequestRejectedEmailTemplateImage { get; set; }

        private const string CONFIG_NEWSITETEMPLATE = "EmailNewSiteTemplate";
        private const string CONFIG_FAILEMAILTEMPLATE = "EmailFailureSiteTemplate";
        private const string CONFIG_SENTFORAPPROVALEMAILTEMPLATE = "SentForApprovalEmailTemplate";
        private const string CONFIG_NEWREQUESTRECEIVEDFORAPPROVALEMAILTEMPLATE = "NewRequestReceivedForApprovalEmailTemplate";
        private const string CONFIG_REQUESTREJECTEDEMAILTEMPLATE = "RequestRejectedEmailTemplate";
        private const string TOKEN_SITEURL = "[SITEURL]";
        private const string TOKEN_SITEOWNER = "[SITEOWNER]";
        private const string TOKEN_SITEADMIN = "[SITEADMIN]";
        private const string TOKEN_SITETITLE = "[SITETITLE]";
        private const string TOKEN_EDITPAGEURL = "[EDITPAGEURL]";
        private const string TOKEN_SITETEMPLATE = "[SITETEMPLATE]";
        private const string TOKEN_STORAGELIMIT = "[STORAGELIMIT]";
        private const string TOKEN_ERROR_MESSAGE = "[ERRORMESSAGE]";

        #endregion
        #region Constructor
        public EmailConfig()
        {
            ConfigManager cf = new ConfigManager();
            string successEmail = cf.GetAppSettingsKey(CONFIG_NEWSITETEMPLATE);
            string failEmail = cf.GetAppSettingsKey(CONFIG_FAILEMAILTEMPLATE);
            string sentForApprovalEmail = cf.GetAppSettingsKey(CONFIG_SENTFORAPPROVALEMAILTEMPLATE);
            string newRequestReceivedForApprovalEmail = cf.GetAppSettingsKey(CONFIG_NEWREQUESTRECEIVEDFORAPPROVALEMAILTEMPLATE);
            string requestRejectedEmail = cf.GetAppSettingsKey(CONFIG_REQUESTREJECTEDEMAILTEMPLATE);
            
            if (File.Exists(successEmail))
            {
                using (StreamReader sr = new StreamReader(successEmail))
                {
                    this.SuccessEmailTemplate = sr.ReadToEnd();
                }
            }
            else
            {
                Log.Warning("Provisioning.Common.Mail.EmailConfig", "Your Email Template doesn't exist");
            }
            
            if(File.Exists(failEmail))
            {
                using (StreamReader sr = new StreamReader(failEmail))
                {
                    this.FailureEmailTemplate = sr.ReadToEnd();
                }
            }
            else
            {
                Log.Warning("Provisioning.Common.Mail.EmailConfig", "Your Email Template doesn't exist");
            }

            if (File.Exists(sentForApprovalEmail))
            {
                using (StreamReader sr = new StreamReader(sentForApprovalEmail))
                {
                    this.SentForApprovalEmailTemplate = sr.ReadToEnd();
                }
            }
            else
            {
                Log.Warning("Provisioning.Common.Mail.EmailConfig", "Your Email Template doesn't exist");
            }

            if (File.Exists(newRequestReceivedForApprovalEmail))
            {
                using (StreamReader sr = new StreamReader(newRequestReceivedForApprovalEmail))
                {
                    this.NewRequestReceivedForApprovalEmailTemplate = sr.ReadToEnd();
                }
            }
            else
            {
                Log.Warning("Provisioning.Common.Mail.EmailConfig", "Your Email Template doesn't exist");
            }

            if (File.Exists(requestRejectedEmail))
            {
                using (StreamReader sr = new StreamReader(requestRejectedEmail))
                {
                    this.RequestRejectedEmailTemplate = sr.ReadToEnd();
                }
            }
            else
            {
                Log.Warning("Provisioning.Common.Mail.EmailConfig", "Your Email Template doesn't exist");
            }

        }
        #endregion

        #region Method
        public string GetNewSiteEmailTemplateContent(SuccessEmailMessage message)
        {
            string template = this.SuccessEmailTemplate;

            template = template.Replace(TOKEN_SITEURL, message.SiteUrl);
            template = template.Replace(TOKEN_SITEOWNER, message.SiteOwner);
            template = template.Replace(TOKEN_SITEADMIN, message.SiteAdmin);
            //template = template.Replace(TOKEN_STORAGELIMIT,
            //    String.Format(new FileSizeFormatProvider(), "{0:fs}", message.StorageLimit));
            return template;
        }

        public string GetFailureEmailTemplateContent(FailureEmailMessage message)
        {
            string template = this.FailureEmailTemplate;

            template = template.Replace(TOKEN_SITEURL, message.SiteUrl);
            template = template.Replace(TOKEN_SITEOWNER, message.SiteOwner);
            template = template.Replace(TOKEN_SITEADMIN, message.SiteAdmin);
            template = template.Replace(TOKEN_ERROR_MESSAGE, message.ErrorMessage);

            return template;
        }

        public string GetSentForApprovalEmailTemplateContent(SentForApprovalEmailMessage message)
        {
            string template = this.SentForApprovalEmailTemplate;

            template = template.Replace(TOKEN_SITEURL, message.SiteUrl);
            template = template.Replace(TOKEN_SITEOWNER, message.SiteOwner);
            template = template.Replace(TOKEN_SITEADMIN, message.SiteAdmin);
            template = template.Replace(TOKEN_SITETITLE, message.SiteTitle);
            template = template.Replace(TOKEN_SITETEMPLATE, message.SiteTemplate);
            //template = template.Replace(TOKEN_STORAGELIMIT,
            //    String.Format(new FileSizeFormatProvider(), "{0:fs}", message.StorageLimit));
            return template;
        }

        public string GetNewRequestReceivedForApprovalEmailMessage(NewRequestReceivedForApprovalEmailMessage message)
        {
            string template = this.NewRequestReceivedForApprovalEmailTemplate;

            template = template.Replace(TOKEN_SITEURL, message.SiteUrl);
            template = template.Replace(TOKEN_SITEOWNER, message.SiteOwner);
            template = template.Replace(TOKEN_SITEADMIN, message.SiteAdmin);
            template = template.Replace(TOKEN_SITETITLE, message.SiteTitle);
            template = template.Replace(TOKEN_SITETEMPLATE, message.SiteTemplate);
            template = template.Replace(TOKEN_EDITPAGEURL, message.EditPageUrl);

            //template = template.Replace(TOKEN_STORAGELIMIT,
            //    String.Format(new FileSizeFormatProvider(), "{0:fs}", message.StorageLimit));
            return template;
        }

        public string GetRequestRejectedEmailMessage(RequestRejectedEmailMessage message)
        {
            string template = this.RequestRejectedEmailTemplate;

            template = template.Replace(TOKEN_SITEURL, message.SiteUrl);
            template = template.Replace(TOKEN_SITEOWNER, message.SiteOwner);
            template = template.Replace(TOKEN_SITEADMIN, message.SiteAdmin);
            template = template.Replace(TOKEN_SITETITLE, message.SiteTitle);
            template = template.Replace(TOKEN_SITETEMPLATE, message.SiteTemplate);
            
            //template = template.Replace(TOKEN_STORAGELIMIT,
            //    String.Format(new FileSizeFormatProvider(), "{0:fs}", message.StorageLimit));
            return template;
        }
        #endregion
    }
}
