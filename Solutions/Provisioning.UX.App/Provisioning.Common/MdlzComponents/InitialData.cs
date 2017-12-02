using Microsoft.SharePoint.Client;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Provisioning.Common.Authentication;
using Provisioning.Common.Data;
using Provisioning.Common.Data.AppSettings;
using Provisioning.Common.Data.Templates;
using Provisioning.Common.Metadata;
using Provisioning.Common.Utilities;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace Provisioning.Common.MdlzComponents
{
    public class InitialData : AbstractModule, ISharePointClientService
    {
        const string CAML_GET_ENABLED_SITEMETADATA = "<View><Query><Where><Eq><FieldRef Name='SP_Enabled'/><Value Type='Text'>True</Value></Eq></Where><OrderBy><FieldRef Name='SP_DisplayOrder'/></OrderBy></Query><RowLimit>100</RowLimit></View>";

        public string GetData(HttpContext Context)
        {
            string retVal = null;
            System.Linq.Expressions.Expression<Func<ListItemCollection, object>>[] exp = new System.Linq.Expressions.Expression<Func<ListItemCollection, object>>[]
            { (eachItem) => eachItem.Include(item => item, item => item["ID"], item => item["SP_Key"], item => item["SP_Value"], item => item["SP_DisplayOrder"], item => item["SP_Enabled"]) };

            Func<ListItemCollection, List<SiteMetadata>> f = (listItemColl) => listItemColl.Cast<ListItem>().Select(_item => new SiteMetadata()
            {
                Id = _item.BaseGetInt("ID"),
                Key = _item.BaseGet("SP_Key"),
                Value = _item.BaseGet("SP_Value"),
                DisplayOrder = _item.BaseGetInt("SP_DisplayOrder"),
                Enabled = _item.BaseGet<bool>("SP_Enabled")
            }).ToList();

            UsingContext(ctx =>
            {
                Stopwatch _timespan = Stopwatch.StartNew();
                try
                {
                    //var _web = ctx.Web;
                    //ctx.Load(_web);

                    #region SP Queries
                    var lc_AppSettings = ctx.Web.Lists.GetByTitle(SPDataConstants.LIST_TITLE_APPSETTINGS).GetItems(CamlQuery.CreateAllItemsQuery());
                    ctx.Load(lc_AppSettings,
                        eachItem => eachItem.Include(item => item, item => item["ID"], item => item["SP_Key"], item => item["SP_Value"], item => item["SP_Description"]));

                    var lc_Regions = ctx.Web.Lists.GetByTitle("Regions").GetItems(new CamlQuery { ViewXml = CAML_GET_ENABLED_SITEMETADATA });
                    ctx.Load(lc_Regions, exp);

                    var lc_Functions = ctx.Web.Lists.GetByTitle("Functions").GetItems(new CamlQuery { ViewXml = CAML_GET_ENABLED_SITEMETADATA });
                    ctx.Load(lc_Functions, exp);

                    var lc_Languages = ctx.Web.Lists.GetByTitle("Languages").GetItems(new CamlQuery { ViewXml = CAML_GET_ENABLED_SITEMETADATA });
                    ctx.Load(lc_Languages, exp);

                    var lc_Timezones = ctx.Web.Lists.GetByTitle("TimeZone").GetItems(new CamlQuery { ViewXml = CAML_GET_ENABLED_SITEMETADATA });
                    ctx.Load(lc_Timezones, exp);

                    var lc_Templates = ctx.Web.Lists.GetByTitle("Templates").GetItems(CamlQuery.CreateAllItemsQuery());
                    ctx.Load(lc_Templates,
                         eachItem => eachItem.Include(
                         item => item,
                         item => item[TemplateFields.TTILE_NAME],
                         item => item[TemplateFields.DESCRIPTION_NAME],
                         item => item[TemplateFields.TEMPLATEIMAGE_NAME],
                        item => item[TemplateFields.HOSTPATH_NAME],
                        item => item[TemplateFields.TENANTURL_NAME],
                        item => item[TemplateFields.ONPREM_NAME],
                        item => item[TemplateFields.TEMPLATE_NAME],
                        item => item[TemplateFields.STORAGEMAX_NAME],
                        item => item[TemplateFields.STORAGEWARN_NAME],
                        item => item[TemplateFields.USERCODEMAX_NAME],
                        item => item[TemplateFields.USERCODEWARN_NAME],
                         item => item[TemplateFields.PROVISIONINGTEMPLATE_NAME],
                         item => item[TemplateFields.ENABLED_NAME],
                        item => item[TemplateFields.ROOTWEBONLY_NAME],
                        item => item[TemplateFields.SUBWEBONLY_NAME],
                        item => item[TemplateFields.USETEMPLATESITEPOLICY_NAME],
                        item => item[TemplateFields.AutoApprove],
                        item => item[TemplateFields.MdlzSiteCategory]));

                    ctx.ExecuteQuery();
                    #endregion

                    _timespan.Stop();
                    Log.TraceApi("SharePoint", "InitialData.GetData", _timespan.Elapsed);

                    var initialData = new
                    {
                        AppSettings = lc_AppSettings.Cast<ListItem>().Select(_item => new AppSetting
                        { Id = _item.BaseGetInt("ID"), Key = _item.BaseGet("SP_Key"), Value = _item.BaseGet("SP_Value"), Description = _item.BaseGet("SP_Description") }).ToList(),

                        BusinessMetadata = new
                        {
                            Regions = f(lc_Regions),
                            Functions = f(lc_Functions),
                            Languages = f(lc_Languages),
                            TimeZones = f(lc_Timezones)
                        }


                    };
                    var siteTemplates = lc_Templates.Cast<ListItem>().Select(item => new Template()
                    {
                        Title = item.BaseGet(TemplateFields.TTILE_NAME),
                        Description = item.BaseGet(TemplateFields.DESCRIPTION_NAME),
                        Enabled = item.BaseGet<bool>(TemplateFields.ENABLED_NAME),
                        ProvisioningTemplate = item.BaseGet(TemplateFields.PROVISIONINGTEMPLATE_NAME),
                        // ManagedPath = item.BaseGet(TemplateFields.MANAGEDPATH_NAME),
                        ImageUrl = item.BaseGet<FieldUrlValue>(TemplateFields.TEMPLATEIMAGE_NAME).Url,
                        TenantAdminUrl = item.BaseGet<FieldUrlValue>(TemplateFields.TENANTURL_NAME).Url,
                        HostPath = item.BaseGet<FieldUrlValue>(TemplateFields.HOSTPATH_NAME).Url,
                        RootWebOnly = item.BaseGet<bool>(TemplateFields.ROOTWEBONLY_NAME),
                        SubWebOnly = item.BaseGet<bool>(TemplateFields.SUBWEBONLY_NAME),
                        StorageMaximumLevel = item.BaseGetInt(TemplateFields.STORAGEMAX_NAME),
                        StorageWarningLevel = item.BaseGetInt(TemplateFields.STORAGEWARN_NAME),
                        UserCodeMaximumLevel = item.BaseGetInt(TemplateFields.USERCODEMAX_NAME),
                        UserCodeWarningLevel = item.BaseGetInt(TemplateFields.USERCODEWARN_NAME),
                        SharePointOnPremises = item.BaseGet<bool>(TemplateFields.ONPREM_NAME),
                        RootTemplate = item.BaseGet(TemplateFields.TEMPLATE_NAME),
                        UseTemplateDefinedPolicy = item.BaseGet<bool>(TemplateFields.USETEMPLATESITEPOLICY_NAME),
                        AutoApprove = item.BaseGet<bool>(TemplateFields.AutoApprove),
                        MdlzSiteCategory = item.BaseGet(TemplateFields.MdlzSiteCategory)
                    }).ToList();

                    var spContext = SharePointContextProvider.Current.GetSharePointContext(Context);
                    User loggedInUser = null;

                    using (var clientContext = spContext.CreateUserClientContextForSPHost())
                    {
                        clientContext.Load(clientContext.Web.CurrentUser, x => x.Email, x => x.LoginName, x => x.Title);
                        clientContext.ExecuteQuery();
                        loggedInUser = clientContext.Web.CurrentUser;
                    }

                    var obj = new { Data = initialData, User = new { Email = loggedInUser.Email, LoginName = loggedInUser.LoginName, Title = loggedInUser.Title } };
                    
                    var settings = new JsonSerializerSettings();
                    settings.DateFormatString = "YYYY-MM-DD";
                    settings.ContractResolver = new CustomContractResolver();
                    string strTemplatesData = JsonConvert.SerializeObject(siteTemplates, settings);

                    System.Web.Script.Serialization.JavaScriptSerializer j = new System.Web.Script.Serialization.JavaScriptSerializer();
                    string strInitialData = j.Serialize(obj);

                    retVal = $"<script type=\"text/javascript\"> var initialData = {strInitialData}; var templatesData ={strTemplatesData}; </script>";
                }
                catch (Exception _ex)
                {
                    var _message = string.Format(PCResources.TemplateProviderBase_Exception_Message, _ex.Message);
                    Log.Error("Provisioning.Common.MdlzComponents.GetData", _ex.ToString());
                    throw new DataStoreException(_message, _ex);
                }
            });
            return retVal;
        }

        public IAuthentication Authentication
        {
            get
            {
                var _auth = new AppOnlyAuthenticationSite();
                _auth.SiteUrl = this.ConnectionString;
                return _auth;
            }

        }

        public void UsingContext(Action<ClientContext> action)
        {
            UsingContext(action, Timeout.Infinite);
        }

        public void UsingContext(Action<ClientContext> action, int csomTimeout)
        {
            using (ClientContext _ctx = this.Authentication.GetAuthenticatedContext())
            {
                _ctx.RequestTimeout = csomTimeout;
                action(_ctx);
            }
        }

        public class CustomContractResolver : DefaultContractResolver
        {
            private Dictionary<string, string> PropertyMappings { get; set; } = new Dictionary<string, string>();

            public CustomContractResolver()
            {
                typeof(Template).GetProperties().ToList().ForEach((x) =>
                {
                    if (!PropertyMappings.ContainsKey(x.Name))
                    {
                        var propAttrib = x.GetCustomAttributes(typeof(DataMemberAttribute), true).FirstOrDefault();
                        if (propAttrib != null)
                            PropertyMappings.Add(x.Name, propAttrib.ToString());
                    }
                });
            }

            protected override string ResolvePropertyName(string propertyName)
            {
                string resolvedName = null;
                var resolved = this.PropertyMappings.TryGetValue(propertyName, out resolvedName);
                return (resolved) ? resolvedName : base.ResolvePropertyName(propertyName);
            }
        }
    }
}
