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

namespace Provisioning.Common.MdlzComponents.ExtensibilityProviders
{
    public class MdlzBPSiteExtensibilityProvider : IProvisioningExtensibilityHandler
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
                //Creating 'BP Contribute' permission level and assigning it to 'BP Contributor' group
                var contriRoleDef = ctx.Web.RoleDefinitions.GetByType(RoleType.Contributor);
                ctx.Load(contriRoleDef);
                Group grp = ctx.Web.AddGroup("BP Contributors", "BP Contributors", false);

                grp.Owner = ctx.Web.AssociatedOwnerGroup;
                grp.Update();

                var basePerms = new BasePermissions();

                foreach (PermissionKind bp in Enum.GetValues(typeof(PermissionKind)))
                {
                    if (contriRoleDef.BasePermissions.Has(bp) && bp != PermissionKind.BrowseUserInfo && bp != PermissionKind.EditMyUserInfo)
                        basePerms.Set(bp);
                }

                var roleDefBindings = new RoleDefinitionBindingCollection(ctx);
                var roleDef = ctx.Web.RoleDefinitions.Add(new RoleDefinitionCreationInformation()
                {
                    BasePermissions = basePerms,
                    Name = "BP Contribute",
                    Description = "This permission gives basic contributor permissions except for viewing and edit user profile information",
                });

                roleDef.Update();
                roleDefBindings.Add(roleDef);
                var roleAssig = ctx.Web.RoleAssignments.Add(grp, roleDefBindings);
                roleAssig.Update();

                ctx.ExecuteQueryRetry();

                MdlzCommonCustomizations.RemoveRecentFromQuickLaunch(ctx);
            }
            catch (Exception ex)
            {
                Common.Utilities.Log.Error("MdlzTeamSiteExtensibilityProvider.Provision", ex.ToString());
                throw;
            }

        }
    }
}
