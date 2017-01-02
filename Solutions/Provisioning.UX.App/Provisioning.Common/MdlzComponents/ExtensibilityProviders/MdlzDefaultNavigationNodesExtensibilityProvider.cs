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
using OfficeDevPnP.Core.Utilities;

namespace Provisioning.Common.MdlzComponents.ExtensibilityProviders
{
    public class MdlzDefaultNavigationNodesExtensibilityProvider : IProvisioningExtensibilityHandler
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
            
            try
            {
                var web = tokenParser._web;
                web.EnsureProperty(x => x.Url);

                Dictionary<string, string> d = new Dictionary<string, string>
                {
                    [tokenParser.ParseString("{res:announce_Folder}")] = UrlUtility.Combine(web.Url, tokenParser.ParseString("{res:lists_Folder}/{res:announce_Folder}")),
                    [tokenParser.ParseString("{res:shareddocuments_Title_15}")] = UrlUtility.Combine(web.Url, tokenParser.ParseString("{res:shareddocuments_Folder}")),
                    [tokenParser.ParseString("Site Contents")] = UrlUtility.Combine(web.Url, "/_layouts/15/viewlsts.aspx")
                };

                foreach (var item in d)
                {
                    try
                    {
                        web.AddNavigationNode(item.Key, new Uri(item.Value), string.Empty, OfficeDevPnP.Core.Enums.NavigationType.TopNavigationBar, asLastNode: true);
                    }
                    catch (Exception ex)
                    {
                        Common.Utilities.Log.Error($"{nameof(MdlzDefaultNavigationNodesExtensibilityProvider)}.{nameof(Provision)}", $"{ex.ToString()}: Key: {item.Key} Value: {item.Value}");
                    }
                }
            }
            catch (Exception ex)
            {
                Common.Utilities.Log.Error($"{nameof(MdlzDefaultNavigationNodesExtensibilityProvider)}.{nameof(Provision)}", ex.ToString());
            }
        }
    }
}
