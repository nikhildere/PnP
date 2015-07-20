using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Framework.Provisioning.Extensibility;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using Provisioning.Common.Utilities;
using Provisioning.Job.MdlzComponents.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using System.Web.UI.WebControls.WebParts;

namespace Provisioning.Job.MdlzComponents.ExtensibilityProviders
{
    public class MdlzBlogSiteExtensibilityProvider : IProvisioningExtensibilityProvider
    {
        public void ProcessRequest(ClientContext ctx, ProvisioningTemplate template, string configurationData)
        {
            Web web = ctx.Web;
            var props = new List<Expression<Func<Web, object>>>();
            if (!web.IsPropertyAvailable("ServerRelativeUrl"))
                props.Add(x => x.ServerRelativeUrl);
            if (web.RootFolder.ServerObjectIsNull != false)
                props.Add(x => x.RootFolder);

            if (props.Count > 0)
            {
                ctx.Load(web, props.ToArray());
                ctx.ExecuteQuery();
            }

            //var homepageFile = web.GetFileByServerRelativeUrl(UrlUtility.Combine(web.ServerRelativeUrl, web.RootFolder.WelcomePage));

            var webparts = web.GetWebParts(UrlUtility.Combine(web.ServerRelativeUrl, web.RootFolder.WelcomePage));

            foreach (var item in webparts)
            {
                item.WebPart.Properties["ChromeType"] = PartChromeType.Default;
                item.SaveWebPartChanges();
            }
            ctx.ExecuteQuery();
        }
    }


}
