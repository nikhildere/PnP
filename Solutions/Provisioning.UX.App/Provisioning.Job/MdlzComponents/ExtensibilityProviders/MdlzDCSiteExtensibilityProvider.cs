﻿using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Framework.Provisioning.Extensibility;
using OfficeDevPnP.Core.Framework.Provisioning.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Provisioning.Job.MdlzComponents.ExtensibilityProviders
{
    public class MdlzBPSiteExtensibilityProvider : IProvisioningExtensibilityProvider
    {
        public void ProcessRequest(ClientContext ctx, ProvisioningTemplate template, string configurationData)
        {
            
        }
    }
}