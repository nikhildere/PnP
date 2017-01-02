using Mondelez.SiteLifecycle.Common.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Framework.Provisioning.Connectors;
using OfficeDevPnP.Core.Framework.Provisioning.Providers.Xml;

namespace Provisioning.FlipToVnext
{
    class Program
    {
        static void Main(string[] args)
        {

        }

        static void Apply()
        {
            string folderPath;
            var urls = TextFileUtility.GetTextFromFileAndSplitNewLine(out folderPath);
            folderPath = TextFileUtility.GetFolderPath(folderPath);

            Console.WriteLine("Provide name of the template to use for flip - file should be present in the 'Templates' folder:");

            string connectionString = "Templates",
                templateToUse = Console.ReadLine();

            XMLFileSystemTemplateProvider x = new XMLFileSystemTemplateProvider(connectionString, string.Empty)
            { Connector = new FileSystemConnector(connectionString, string.Empty) };

            var provTemplate = x.GetTemplate(templateToUse);
            object lockObj = new object();
            int i = 1;

            Parallel.ForEach(urls, item =>
            {
                try
                {
                    using (ClientContext ctx = ContextUtility.GetContext(item))
                    {
                        ctx.Web.ApplyProvisioningTemplate(provTemplate);
                        Console.WriteLine($"{i++}. {item}");
                    }
                }
                catch (Exception ex)
                {
                    
                }
            });

        }
    }
}
