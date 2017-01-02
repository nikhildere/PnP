using OfficeDevPnP.Core.Framework.Provisioning.Extensibility;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using OfficeDevPnP.Core.Diagnostics;
using OfficeDevPnP.Core.Framework.Provisioning.ObjectHandlers;
using OfficeDevPnP.Core.Framework.Provisioning.ObjectHandlers.TokenDefinitions;
using System.Web.UI.WebControls.WebParts;
using System.Linq.Expressions;
using OfficeDevPnP.Core.Utilities;

namespace Provisioning.Common.MdlzComponents.ExtensibilityProviders
{
    public class MdlzBlogSiteExtensibilityProvider : IProvisioningExtensibilityHandler
    {
        public ProvisioningTemplate Extract(ClientContext ctx, ProvisioningTemplate template, ProvisioningTemplateCreationInformation creationInformation, PnPMonitoredScope scope, string configurationData)
        {
            return template;
        }

        public IEnumerable<TokenDefinition> GetTokens(ClientContext ctx, ProvisioningTemplate template, string configurationData)
        {
            return null;
        }

        public void ProcessRequest(ClientContext ctx, ProvisioningTemplate template, string configurationData)
        {

        }

        public void Provision(ClientContext ctx, ProvisioningTemplate template, ProvisioningTemplateApplyingInformation applyingInformation, TokenParser tokenParser, PnPMonitoredScope scope, string configurationData)
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
