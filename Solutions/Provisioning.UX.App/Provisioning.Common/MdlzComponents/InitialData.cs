using Microsoft.SharePoint.Client;
using Provisioning.Common.Authentication;
using Provisioning.Common.Data;
using Provisioning.Common.Data.AppSettings;
using Provisioning.Common.Utilities;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Provisioning.Common.MdlzComponents
{
    public class InitialData: AbstractModule, ISharePointClientService
    {
        public void GetData()
        {
            ICollection<AppSetting> _returnResults = new List<AppSetting>();
            UsingContext(ctx =>
            {
                Stopwatch _timespan = Stopwatch.StartNew();
                try
                {
                    var _web = ctx.Web;
                    ctx.Load(_web);
                    if (!_web.ListExists(SPDataConstants.LIST_TITLE_APPSETTINGS))
                    {
                        var _message = String.Format("The List {0} does not exist in Site {1}",
                         SPDataConstants.LIST_TITLE_APPSETTINGS,
                         ctx.Url);

                        Log.Fatal("SPAppSettingsManager.GetAppSettings", _message);
                        throw new DataStoreException(_message);
                    }

                    var _camlQuery = CamlQuery.CreateAllItemsQuery();

                    var _list = ctx.Web.Lists.GetByTitle(SPDataConstants.LIST_TITLE_APPSETTINGS);
                    var _listItemCollection = _list.GetItems(_camlQuery);
                    ctx.Load(_listItemCollection,
                        eachItem => eachItem.Include(
                            item => item,
                            item => item["ID"],
                            item => item["SP_Key"],
                            item => item["SP_Value"],
                            item => item["SP_Description"]));
                    ctx.ExecuteQuery();

                    _timespan.Stop();
                    Log.TraceApi("SharePoint", "SPAppSettingsManager.GetAppSettings", _timespan.Elapsed);

                    foreach (ListItem _item in _listItemCollection)
                    {
                        var _setting = new AppSetting()
                        {
                            Id = _item.BaseGetInt("ID"),
                            Key = _item.BaseGet("SP_Key"),
                            Value = _item.BaseGet("SP_Value"),
                            Description = _item.BaseGet("SP_Description")
                        };
                        _returnResults.Add(_setting);
                    }

                }
                catch (ServerException ex)
                {
                    //TODO LOG
                }
                catch (DataStoreException ex)
                {
                    throw;
                }

            });
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
    }
}
