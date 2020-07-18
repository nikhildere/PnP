using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;

namespace Provisioning.UX.AppWeb.Models
{
    [DataContract]
    public class SiteCheckRequest
    {
        [DataMember(Name = "tenantAdminUrl")]
        public string TenantAdminUrl { get; set; }

        [DataMember(Name = "siteUrl")]
        public string SiteUrl { get; set; }

        [DataMember(Name = "hostPath")]
        public string HostPath { get; set; }

        [DataMember(Name = "inputValue")]
        public string InputValue { get; set; }

        [DataMember(Name = "rootTemplate")]
        public string RootTemplate { get; set; }

        [DataMember(Name = "success")]
        public bool Success { get; set; }

        [DataMember(Name = "errorMessage")]
        public string ErrorMessage { get; set; }
    }
}