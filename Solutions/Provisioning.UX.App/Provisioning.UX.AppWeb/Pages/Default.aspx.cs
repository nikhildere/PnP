using System;
using System.Linq;
using System.Web.UI;
using OfficeDevPnP.Core.WebAPI;
using Provisioning.Common.MdlzComponents;
using Microsoft.SharePoint.Client;
using System.Runtime.Serialization.Json;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Collections.Generic;
using Provisioning.Common.Metadata;
using System.Runtime.Serialization;
using System.Reflection;
using Provisioning.Common.Data.AppSettings;
using Provisioning.Common.Data.Templates;

namespace Provisioning.UX.AppWeb
{
    public partial class Default : System.Web.UI.Page
    {
        protected void Page_PreInit(object sender, EventArgs e)
        {
            Uri redirectUrl;
            switch (SharePointContextProvider.CheckRedirectionStatus(Context, out redirectUrl))
            {
                case RedirectionStatus.Ok:
                    return;
                case RedirectionStatus.ShouldRedirect:
                    Response.Redirect(redirectUrl.AbsoluteUri, endResponse: true);
                    break;
                case RedirectionStatus.CanNotRedirect:
                    Response.Write("An error occurred while processing your request.");
                    Response.End();
                    break;
            }
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            // The following code gets the client context and Title property by using TokenHelper.
            // To access other properties, the app may need to request permissions on the host web.
            
            ltlInitialData.Text = new InitialData().GetData(Context);


            if (this.Request.Cookies[WebAPIHelper.SERVICES_TOKEN] == null)
            {
                //Register provisioning service
                Page.RegisterWebAPIService("api/provisioning");
            }
        }
    }

    
}