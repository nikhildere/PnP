using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Entities;
using OfficeDevPnP.Core.Framework.Provisioning.Extensibility;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Provisioning.Job.MdlzComponents.ExtensibilityProviders
{
    public class MdlzProjectSiteExtensibilityProvider : IProvisioningExtensibilityProvider
    {
        public void ProcessRequest(ClientContext ctx, ProvisioningTemplate template, string configurationData)
        {
            List list = ctx.Web.GetListByUrl("Lists/TeamMembers");
            if (list.Fields.Any(x => x.InternalName == "Person"))
                list.CreateField(new FieldCreationInformation(FieldType.User) { InternalName = "Person", DisplayName = "Person", AddToDefaultView = true });
        }
    }
}
