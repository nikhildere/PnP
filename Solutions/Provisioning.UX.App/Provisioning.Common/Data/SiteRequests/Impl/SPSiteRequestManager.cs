﻿using Microsoft.Online.SharePoint.TenantAdministration;
using Microsoft.SharePoint.Client;
using Provisioning.Common.Authentication;
using Provisioning.Common.Configuration;
using Provisioning.Common.Configuration.Application;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Provisioning.Common.Utilities;
using Provisioning.Common.Data.SiteRequests;
using Provisioning.Common.Data.Templates;

namespace Provisioning.Common.Data.SiteRequests.Impl
{
    /// <summary>
    /// Implmentation class for the Site Request Repository that leverages SharePoint as the datasource.
    /// </summary>
    internal class SPSiteRequestManager : AbstractModule, ISiteRequestManager, ISharePointClientService
    {
        #region Private Instance Members
        private static readonly IConfigurationFactory _cf = ConfigurationFactory.GetInstance();
        private static readonly IAppSettingsManager _manager = _cf.GetAppSetingsManager();
        const string LOGGING_SOURCE = "SPSiteRequestManagerImpl"; 
        const string FIELD_XML_FORMAT = @"<Field Type=""{0}"" Name=""{1}"" StaticName=""{1}"" DisplayName=""{2}"" ID=""{3}"" {4}/>";
        const string CAML_NEWREQUEST_BY_URL = "<Query><Where><And><Eq><FieldRef Name=SP_Url'/><Value Type='Text'>{0}</Value></Eq><Eq><FieldRef Name='Status'/><Value Type='Text'>New</Value></Eq></And></Where></Query>";
        const string CAML_NEWREQUESTS = "<View><Query><Where><Eq><FieldRef Name='SP_ProvisioningStatus'/><Value Type='Text'>New</Value></Eq></Where></Query><RowLimit>100</RowLimit></View>";
        const string CAML_GETREQUEST_BY_URL = "<View><Query><Where><Eq><FieldRef Name='SP_Url'/><Value Type='Text'>{0}</Value></Eq></Where></Query><RowLimit>100</RowLimit></View>";
        const string CAML_APPROVEDREQUESTS = "<View><Query><Where><Eq><FieldRef Name='SP_ProvisioningStatus'/><Value Type='Text'>Approved</Value></Eq></Where></Query><RowLimit>100</RowLimit></View>";
        const string CAML_GETREQUESTSBYOWNER = "<View><Query><Where><Eq><FieldRef Name='SP_Owner' LookupId='True'/><Value Type='Int'>{0}</Value></Eq></Where></Query></View>";
        #endregion

        #region Constructor
        public SPSiteRequestManager()
        {
        }
        #endregion

        #region Private Methods
        /// <summary>
        /// Creates the Site Request if it doesnt exist
        /// </summary>
        /// <param name="ctx"></param>
        private void HandleSiteRequestList(ClientContext ctx)
        {
            try
            {
                SiteRequestList.CreateSharePointRepositoryList(ctx.Web,
                    SiteRequestList.TITLE,
                    SiteRequestList.DESCRIPTION,
                    SiteRequestList.LISTURL);
                
                Log.Info("Provisioning.Common.Data.SiteRequests.Impl.SPSiteRequestManagerImpl.HandleSiteRequestList",
                    PCResources.SiteRequest_List_Creation_SuccessFull, SiteRequestList.LISTURL, ctx.Url,
                    SiteRequestList.LISTURL,
                    ctx.Url);
            }
            catch (Exception _ex)
            {
                Log.Fatal("Provisioning.Common.Data.SiteRequests.Impl.SPSiteRequestManagerImpl.HandleSiteRequestList",
                    PCResources.SiteRequest_List_Creation_Error,
                    SiteRequestList.LISTURL,
                    ctx.Url,
                    _ex);
            }
        }
        /// <summary>
        /// Used to get a value from a list
        /// </summary>
        /// <param name="item"></param>
        /// <param name="fieldName"></param>
        /// <returns></returns>
        private string BaseSet(ListItem item, string fieldName)
        {
            return item[fieldName] == null ? String.Empty : item[fieldName].ToString();
        }

        private T BaseGet<T>(ListItem item, string fieldName)
        {
            var value = item[fieldName];
            return (T)value;
        }
    
        /// <summary>
        /// 
        /// </summary>
        /// <param name="ctx"></param>
        /// <param name="item"></param>
        /// <param name="field"></param>
        /// <returns></returns>
        private SiteUser BaseSetUser(ClientContext ctx, ListItem item, string field)
        {
            SiteUser _owner = new SiteUser();
            var _fieldUser = ((FieldUserValue)(item[field]));
            User _user = ctx.Web.EnsureUser(_fieldUser.LookupValue);
            ctx.Load(_user, u => u.LoginName, u => u.Email, u => u.PrincipalType, u => u.Title);
            ctx.ExecuteQuery();

       //     _owner.Email = _user.Email;
       //     _owner.LoginName = _user.LoginName;
            _owner.Name = _user.Email;
            return _owner;
        }

        /// <summary>
        /// Method to Help with Converting to Int
        /// </summary>
        /// <param name="item"></param>
        /// <param name="fieldName"></param>
        /// <returns></returns>
        private int BaseSetInt(ListItem item, string fieldName)
        {
            return Convert.ToInt32(item[fieldName]);
        }

        /// <summary>
        /// Method to return a uint from a string field
        /// </summary>
        /// <param name="item"></param>
        /// <param name="fieldName"></param>
        /// <returns></returns>
        private uint BaseSetUint(ListItem item, string fieldName)
        {
            object _temp = item[fieldName];
            uint _result = new uint();
            if (_temp != null)
            {
                uint.TryParse(item[fieldName].ToString(), out _result);
                return _result;
            }
            return _result;

        }

        /// <summary>
        /// Method for working with User Fields
        /// </summary>
        /// <param name="ctx"></param>
        /// <param name="item"></param>
        /// <param name="fieldName"></param>
        /// <returns></returns>
        private List<SiteUser> BaseSetUsers(ClientContext ctx, ListItem item, string fieldName)
        {
            List<SiteUser> _users = new List<SiteUser>();
            if(item[fieldName] != null)
            {
                foreach (FieldUserValue _userValue in item[fieldName] as FieldUserValue[])
                {
                    User _user = ctx.Web.EnsureUser(_userValue.LookupValue);
                    ctx.Load(_user, u => u.LoginName, u => u.Email, u => u.PrincipalType, u => u.Title);
                    ctx.ExecuteQuery();

                    var _spUser = new SiteUser()
                    {
                        //Email = _user.Email,
                        //LoginName = _user.LoginName,
                        Name = _user.Email
                    };
                    _users.Add(_spUser);
                }
            }
            return _users;
        }
       
        /// <summary>
        /// Helper to Get the web of a given site collection using Tenant API
        /// </summary>
        /// <param name="url"></param>
        /// <param name="ctx"></param>
        /// <returns></returns>
        private Web GetWeb(string url, ClientContext ctx)
        {
            Tenant tenant = new Tenant(ctx);
            var site = tenant.GetSiteByUrl(url);
            var web = site.RootWeb;
            return web;
        }

        /// <summary>
        /// Helper Member to return SiteRequest from the SharePoint SiteRequest Repository
        /// </summary>
        /// <param name="camlQuery"></param>
        /// <returns></returns>
        private ICollection<SiteRequestInformation> GetSiteRequestsByCaml(string camlQuery)
        {
            List<SiteRequestInformation> _siteRequests = new List<SiteRequestInformation>();
            UsingContext(ctx =>
            {
                var _camlQuery = new CamlQuery();
                _camlQuery.ViewXml = camlQuery;
                var web = ctx.Web;
                if (!web.ListExists(SiteRequestList.TITLE))
                {
                    this.HandleSiteRequestList(ctx);
                }

                var list = ctx.Web.Lists.GetByTitle(SiteRequestList.TITLE);

                var _listItemCollection = list.GetItems(_camlQuery);
                ctx.Load(_listItemCollection,
                     eachItem => eachItem.Include(
                     item => item,
                     item => item[SiteRequestFields.TITLE],
                     item => item[SiteRequestFields.DESCRIPTION_NAME],
                     item => item[SiteRequestFields.TEMPLATE_NAME],
                     item => item[SiteRequestFields.POLICY_NAME],
                     item => item[SiteRequestFields.URL_NAME],
                     item => item[SiteRequestFields.OWNER_NAME],
                     item => item[SiteRequestFields.ADD_ADMINS_NAME],
                     item => item[SiteRequestFields.LCID_NAME],
                     item => item[SiteRequestFields.EXTERNALSHARING_NAME],
                     item => item[SiteRequestFields.PROVISIONING_STATUS_NAME],
                     item => item[SiteRequestFields.ONPREM_REQUEST_NAME],
                     item => item[SiteRequestFields.LCID_NAME],
                     item => item[SiteRequestFields.TIMEZONE_NAME],
                     item => item[SiteRequestFields.BC_NAME],
                     item => item[SiteRequestFields.PROPS_NAME],
                     item => item[SiteRequestFields.STATUSMESSAGE_NAME],
                     item => item[SiteRequestFields.ISCONFIDENTIAL_NAME]));
                ctx.ExecuteQuery();

                foreach (ListItem _item in _listItemCollection)
                {
                    var _site = new SiteRequestInformation()
                    {
                        Title = this.BaseSet(_item, SiteRequestFields.TITLE),
                        Description = this.BaseSet(_item, SiteRequestFields.DESCRIPTION_NAME),
                        Template = this.BaseSet(_item, SiteRequestFields.TEMPLATE_NAME),
                        SitePolicy = this.BaseSet(_item, SiteRequestFields.POLICY_NAME),
                        Url = this.BaseSet(_item, SiteRequestFields.URL_NAME),
                        SiteOwner = this.BaseSetUser(ctx, _item, SiteRequestFields.OWNER_NAME),
                        AdditionalAdministrators = this.BaseSetUsers(ctx, _item, SiteRequestFields.ADD_ADMINS_NAME),
                        EnableExternalSharing = this.BaseGet<bool>(_item, SiteRequestFields.EXTERNALSHARING_NAME),
                        RequestStatus = this.BaseSet(_item, SiteRequestFields.PROVISIONING_STATUS_NAME),
                        Lcid = this.BaseSetUint(_item, SiteRequestFields.LCID_NAME),
                        TimeZoneId = this.BaseSetInt(_item, SiteRequestFields.TIMEZONE_NAME),
                        SharePointOnPremises = this.BaseGet<bool>(_item, SiteRequestFields.ONPREM_REQUEST_NAME),
                        BusinessCase = this.BaseSet(_item, SiteRequestFields.BC_NAME),
                        PropertiesJSON = this.BaseSet(_item, SiteRequestFields.PROPS_NAME),
                        RequestStatusMessage = this.BaseSet(_item, SiteRequestFields.STATUSMESSAGE_NAME),
                        IsConfidential = this.BaseGet<bool>(_item, SiteRequestFields.ISCONFIDENTIAL_NAME)
                    };
                    _siteRequests.Add(_site);
                }
            });
            return _siteRequests;
        }

        private SiteRequestInformation GetSiteRequestByCaml(string camlQuery, string filter)
        {
            SiteRequestInformation _siteRequest = null;
            UsingContext(ctx =>
            { 
                CamlQuery _caml = new CamlQuery();
                _caml.ViewXml = string.Format(camlQuery, filter);
                var web = ctx.Web;

                if (!web.ListExists(SiteRequestList.TITLE))
                {
                    this.HandleSiteRequestList(ctx);
                }

                var list = ctx.Web.Lists.GetByTitle(SiteRequestList.TITLE);
                var _listItemCollection = list.GetItems(_caml);

                ctx.Load(_listItemCollection,
                    eachItem => eachItem.Include(
                    item => item,
                    item => item[SiteRequestFields.TITLE],
                    item => item[SiteRequestFields.DESCRIPTION_NAME],
                    item => item[SiteRequestFields.TEMPLATE_NAME],
                    item => item[SiteRequestFields.POLICY_NAME],
                    item => item[SiteRequestFields.URL_NAME],
                    item => item[SiteRequestFields.OWNER_NAME],
                    item => item[SiteRequestFields.PROVISIONING_STATUS_NAME],
                    item => item[SiteRequestFields.ADD_ADMINS_NAME],
                    item => item[SiteRequestFields.LCID_NAME],
                    item => item[SiteRequestFields.EXTERNALSHARING_NAME],
                    item => item[SiteRequestFields.PROVISIONING_STATUS_NAME],
                    item => item[SiteRequestFields.ONPREM_REQUEST_NAME],
                    item => item[SiteRequestFields.LCID_NAME],
                    item => item[SiteRequestFields.TIMEZONE_NAME],
                    item => item[SiteRequestFields.BC_NAME],
                    item => item[SiteRequestFields.PROPS_NAME],
                    item => item[SiteRequestFields.STATUSMESSAGE_NAME]));
                ctx.ExecuteQuery();

                if (_listItemCollection.Count > 0)
                {
                    ListItem _item = _listItemCollection.First();

                    _siteRequest = new SiteRequestInformation()
                    {
                        Title = this.BaseSet(_item, SiteRequestFields.TITLE),
                        Description = this.BaseSet(_item, SiteRequestFields.DESCRIPTION_NAME),
                        Template = this.BaseSet(_item, SiteRequestFields.TEMPLATE_NAME),
                        SitePolicy = this.BaseSet(_item, SiteRequestFields.POLICY_NAME),
                        Url = this.BaseSet(_item, SiteRequestFields.URL_NAME),
                        SiteOwner = this.BaseSetUser(ctx, _item, SiteRequestFields.OWNER_NAME),
                        AdditionalAdministrators = this.BaseSetUsers(ctx, _item, SiteRequestFields.ADD_ADMINS_NAME),
                        EnableExternalSharing = this.BaseGet<bool>(_item, SiteRequestFields.EXTERNALSHARING_NAME),
                        RequestStatus = this.BaseSet(_item, SiteRequestFields.PROVISIONING_STATUS_NAME),
                        Lcid = this.BaseSetUint(_item, SiteRequestFields.LCID_NAME),
                        TimeZoneId = this.BaseSetInt(_item, SiteRequestFields.TIMEZONE_NAME),
                        SharePointOnPremises = this.BaseGet<bool>(_item, SiteRequestFields.ONPREM_REQUEST_NAME),
                        BusinessCase = this.BaseSet(_item, SiteRequestFields.BC_NAME),
                        PropertiesJSON = this.BaseSet(_item, SiteRequestFields.PROPS_NAME),
                        RequestStatusMessage = this.BaseSet(_item, SiteRequestFields.STATUSMESSAGE_NAME)
                    };

                   
                }
            });

            return _siteRequest;
        }
        #endregion

        #region ISharePointClientService Members
        /// <summary>
        /// Class used for working with the ClientContext
        /// </summary>
        /// <param name="action"></param>
        public virtual void UsingContext(Action<ClientContext> action)
        {
            UsingContext(action, Timeout.Infinite);
        }

        /// <summary>
        /// Class used for working with the ClientContext
        /// </summary>
        /// <param name="action"></param>
        /// <param name="csomTimeOut"></param>
        public virtual void UsingContext(Action<ClientContext> action, int csomTimeout)
        {
            using (ClientContext _ctx = Authentication.GetAuthenticatedContext())
            {
                _ctx.RequestTimeout = csomTimeout;
                action(_ctx);
            }
        }
        #endregion

        #region Properties
        /// <summary>
        /// Returns the implementation for AppOnlyAuthentication
        /// </summary>
        public IAuthentication Authentication
        {
            get
            {
                return new AppOnlyAuthenticationSite();
            }
            
        }
        #endregion

        #region ISiteRequestManager Members

        public ICollection<SiteRequestInformation> GetOwnerRequests(string email)
        {
            ICollection<SiteRequestInformation> _returnResults = new List<SiteRequestInformation>();
            UsingContext(ctx =>
            {
                var _user = ctx.Web.EnsureUser(email);
                ctx.Load(_user);
                ctx.ExecuteQuery();

                if(_user != null)
                {
                    var _userID = _user.Id;
                    var camlString = string.Format(CAML_GETREQUESTSBYOWNER, _userID);
                    _returnResults = this.GetSiteRequestsByCaml(camlString);
                }

            });
            return _returnResults;
        }

        public void CreateNewSiteRequest(SiteRequestInformation siteRequest)
        {
            UsingContext(ctx =>
            {
                var web = ctx.Web;

                if(!web.ListExists(SiteRequestList.TITLE)) {
                    this.HandleSiteRequestList(ctx);
                }

                List list = web.Lists.GetByTitle(SiteRequestList.TITLE);
                ListItemCreationInformation _listItemCreation = new ListItemCreationInformation();
                ListItem _record = list.AddItem(_listItemCreation);
                _record[SiteRequestFields.TITLE] = siteRequest.Title;
                _record[SiteRequestFields.DESCRIPTION_NAME] = siteRequest.Description;
                _record[SiteRequestFields.TEMPLATE_NAME] = siteRequest.Template;
                _record[SiteRequestFields.URL_NAME] = siteRequest.Url;
                _record[SiteRequestFields.LCID_NAME] = siteRequest.Lcid;
                _record[SiteRequestFields.TIMEZONE_NAME] = siteRequest.TimeZoneId;
                _record[SiteRequestFields.POLICY_NAME] = siteRequest.SitePolicy;
                _record[SiteRequestFields.EXTERNALSHARING_NAME] = siteRequest.EnableExternalSharing;
                _record[SiteRequestFields.ONPREM_REQUEST_NAME] = siteRequest.SharePointOnPremises;
                _record[SiteRequestFields.BC_NAME] = siteRequest.BusinessCase;
                _record[SiteRequestFields.PROPS_NAME] = siteRequest.PropertiesJSON;
                _record[SiteRequestFields.ISCONFIDENTIAL_NAME] = siteRequest.IsConfidential;
                //If Settings are set to autoapprove then automatically approve the requests

                ISiteTemplateFactory _siteTemplateFactory = SiteTemplateFactory.GetInstance();
                Template selSiteTemplate = _siteTemplateFactory.GetManager().GetTemplateByName(siteRequest.Template);
                
                //if(_manager.GetAppSettings().AutoApprove) {
                if(selSiteTemplate != null &&  selSiteTemplate.AutoApprove)  {
                    _record[SiteRequestFields.PROVISIONING_STATUS_NAME] = SiteRequestStatus.Approved.ToString();
                    _record[SiteRequestFields.APPROVEDDATE_NAME] = DateTime.Now;
                }
                else {
                    _record[SiteRequestFields.PROVISIONING_STATUS_NAME] = SiteRequestStatus.New.ToString();
                }
                
                FieldUserValue _siteOwner = FieldUserValue.FromUser(siteRequest.SiteOwner.Name);
                _record[SiteRequestFields.OWNER_NAME] = _siteOwner;
                
                //Additional Admins
                if(siteRequest.AdditionalAdministrators != null)
                {
                    if (siteRequest.AdditionalAdministrators.Count > 0)
                    {
                        FieldUserValue[] _additionalAdmins = new FieldUserValue[siteRequest.AdditionalAdministrators.Count];
                        int _index = 0;
                        foreach (SiteUser _user in siteRequest.AdditionalAdministrators)
                        {
                            FieldUserValue _adminFieldUser = FieldUserValue.FromUser(_user.Name);
                            _additionalAdmins[_index] = _adminFieldUser;
                            _index++;
                        }
                        _record[SiteRequestFields.ADD_ADMINS_NAME] = _additionalAdmins;
                    }
                }
            
                _record.Update();
                ctx.ExecuteQuery();
                Log.Info("Provisioning.Common.Data.Impl.UpdateRequestStatus", PCResources.SiteRequestNew_Successfull, siteRequest.Url);
            }
            );
        }

        public SiteRequestInformation GetSiteRequestByUrl(string url)
        {
            return this.GetSiteRequestByCaml(CAML_GETREQUEST_BY_URL, url);
        }

        public ICollection<SiteRequestInformation> GetNewRequests()
        {
            return this.GetSiteRequestsByCaml(CAML_NEWREQUESTS);
        }

        public ICollection<SiteRequestInformation> GetApprovedRequests()
        {
            return this.GetSiteRequestsByCaml(CAML_APPROVEDREQUESTS);
        }

        public bool DoesSiteRequestExist(string url)
        {
            var _result = this.GetSiteRequestByUrl(url);
            if(_result != null)
            {
                return true;
            }
            return false;
        }

        public void UpdateRequestStatus(string url, SiteRequestStatus status)
        {
            this.UpdateRequestStatus(url, status, string.Empty);
        }

        public void UpdateRequestStatus(string url, SiteRequestStatus status, string statusMessage)
        {
            UsingContext(ctx =>
            {
                Log.Info("Provisioning.Common.Data.Impl.UpdateRequestStatus", PCResources.SiteRequestUpdate_Successfull, url, status.ToString());
               
                var web = ctx.Web;
                if (!web.ListExists(SiteRequestList.TITLE))
                {
                    this.HandleSiteRequestList(ctx);
                }

                var _list = ctx.Web.Lists.GetByTitle(SiteRequestList.TITLE);
                var _query = new CamlQuery();
                _query.ViewXml = string.Format(CAML_GETREQUEST_BY_URL, url);
                
                ListItemCollection _itemCollection =_list.GetItems(_query);
                ctx.Load(_itemCollection);
                ctx.ExecuteQuery();

                if (_itemCollection.Count != 0)
                {
                    ListItem _item = _itemCollection.FirstOrDefault();
                    _item[SiteRequestFields.PROVISIONING_STATUS_NAME] = status.ToString();
               
                    if (!string.IsNullOrEmpty(statusMessage))
                    {
                        _item[SiteRequestFields.STATUSMESSAGE_NAME] = statusMessage;
                    }
                    _item.Update();
                    ctx.ExecuteQuery();
         
                }
            });

        }

        #endregion
    }
}
