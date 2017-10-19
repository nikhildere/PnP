using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Entities;
using OfficeDevPnP.Core.Framework.Provisioning.Extensibility;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using Provisioning.Common.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using OfficeDevPnP.Core.Diagnostics;
using OfficeDevPnP.Core.Framework.Provisioning.ObjectHandlers;
using OfficeDevPnP.Core.Framework.Provisioning.ObjectHandlers.TokenDefinitions;
using Provisioning.Common.MdlzComponents;

namespace Provisioning.Common.MdlzComponents.ExtensibilityProviders
{
    public class MdlzProjectSiteExtensibilityProvider : IProvisioningExtensibilityHandler
    {

        public ProvisioningTemplate Extract(ClientContext ctx, ProvisioningTemplate template, ProvisioningTemplateCreationInformation creationInformation, PnPMonitoredScope scope, string configurationData)
        {
            return template;
        }

        public IEnumerable<TokenDefinition> GetTokens(ClientContext ctx, ProvisioningTemplate template, string configurationData)
        {
            return null;
        }
        
        public void Provision(ClientContext ctx, ProvisioningTemplate template, ProvisioningTemplateApplyingInformation applyingInformation, TokenParser tokenParser, PnPMonitoredScope scope, string configurationData)
        {
            try
            {
                ctx.Load(ctx.Web, x => x.ServerRelativeUrl);
                MdlzCommonCustomizations.RemoveRecentFromQuickLaunch(ctx);

                List list = ctx.Web.GetList(ctx.Web.ServerRelativeUrl + "/Lists/TeamMembers");
                ctx.Load(list, x => x.Fields.Include(y => y.InternalName));
                ctx.ExecuteQuery();

                if (!list.Fields.Any(x => x.InternalName == "Person"))
                    list.CreateField(new FieldCreationInformation(FieldType.User) { InternalName = "Person", DisplayName = "Person", AddToDefaultView = true });
                
            }
            catch (Exception ex)
            {
                Common.Utilities.Log.Error("MdlzProjectSiteExtensibilityProvider.Provision", ex.ToString());
                throw;
            }

        }
    }
}
