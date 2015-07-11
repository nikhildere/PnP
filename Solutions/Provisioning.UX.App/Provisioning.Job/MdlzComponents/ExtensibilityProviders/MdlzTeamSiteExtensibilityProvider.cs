using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Framework.Provisioning.Extensibility;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using Provisioning.Common.Utilities;
using Provisioning.Job.MdlzComponents.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Provisioning.Job.MdlzComponents.ExtensibilityProviders
{
    public class MdlzTeamSiteExtensibilityProvider : IProvisioningExtensibilityProvider
    {
        const string
            ln_announcements = "",
            ln_sharedDocuments = "",
            ln_calendar = "",
            ln_teamDiscussion = "";

        public void ProcessRequest(ClientContext ctx, ProvisioningTemplate template, string configurationData)
        {
            Web w = ctx.Web;

            List<WikiPageWebPart> listDetails = new List<WikiPageWebPart>();
            listDetails.Add(new WikiPageWebPart(1, 1, "Announcements", null));
            listDetails.Add(new WikiPageWebPart(1, 3, "Shared Documents", null));
            listDetails.Add(new WikiPageWebPart(1, 2, "Calendar", null));
            listDetails.Add(new WikiPageWebPart(2, 2, "Team Discussion", null));

            WebPartUtility.AddWikiHomePageListViewWebparts(w, listDetails);
        }


    }


}
