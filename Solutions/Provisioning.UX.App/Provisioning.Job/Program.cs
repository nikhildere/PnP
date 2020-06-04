using Microsoft.Online.SharePoint.TenantAdministration;
using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Framework.Provisioning.Connectors;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using OfficeDevPnP.Core.Framework.Provisioning.Providers.Xml;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security;
using System.Text;
using System.Threading.Tasks;

namespace Provisioning.Job
{
    class Program
    {
        static void Main(string[] args)
        {
            new SiteProvisioningJob().ProcessSiteRequests();
            //GetTempBackup();
        }

        static void GetTempBackup()
        {
            SecureString s = new SecureString();
            "nick@2020".ToList().ForEach(x => s.AppendChar(x));

            using (ClientContext ctx = new ClientContext("https://ndmdlz.sharepoint.com/sites/SpfxBpMay18_3") { Credentials = new SharePointOnlineCredentials("nik@ndmdlz.onmicrosoft.com", s) })
            {
                var web = ctx.Web;
                var provtemp = web.GetProvisioningTemplate();
                string xml = provtemp.ToXML();
                System.IO.File.WriteAllText(@"C:\Users\huy4230\OneDrive - MDLZ\WorkPC\Documents\Temp\2020-05-14\CM-ProvTemplate3.xml", xml);
            }

            //"".ToList().ForEach(x => s.AppendChar(x));

            //using (ClientContext ctx = new ClientContext("https://collaboration.mdlz.com/sites/m365learning") { Credentials = new SharePointOnlineCredentials("SPAddinAdmin@Mondelez.onmicrosoft.com", s) })
            //{
            //    XMLFileSystemTemplateProvider templateProvider = new XMLFileSystemTemplateProvider { Connector = new FileSystemConnector(@"C:\Users\huy4230\OneDrive - MDLZ\WorkPC\Documents\Temp\2020-04-08\Template\O365Learning\source", "") };
            //    ProvisioningTemplate pt = templateProvider.GetTemplate("O365CL.xml");
            //    ctx.Web.ApplyProvisioningTemplate(pt);
            //}

        }
    }
}
