﻿using Microsoft.Online.SharePoint.TenantAdministration;
using Microsoft.SharePoint.Client;
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
            var _spj = new SiteProvisioningJob();
            _spj.ProcessSiteRequests();
        }
    }
}
