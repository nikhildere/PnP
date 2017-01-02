using Microsoft.SharePoint.Client;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace Mondelez.SiteLifecycle.Common.Utilities
{
    public static class ContextUtility
    {
        public static ClientContext GetContext(string siteUrl)
        {
            ClientContext ctx = new ClientContext(siteUrl);
            ProvisionContextForFormAuthSitesIfRequired(ctx, siteUrl);
            return ctx;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        public static ClientContext GetContextFromNonExactUrl(string url, bool getContextForSiteCollection = true)
        {
            return GetContext(GetExactUrlFromApi(url));
        }

        public static string GetExactUrlFromApi(string nonExactUrl, bool getContextForSiteCollection = true)
        {
            if (nonExactUrl.TrimEnd(' ', '/').Count(x => x.Equals('/')) > 4)
            {

                nonExactUrl = new Uri(nonExactUrl).AbsoluteUri;
                string resourceUrl = nonExactUrl.Substring(0, nonExactUrl.LastIndexOf('/')) + "/_api/contextinfo";

                //string resourceUrl = "http://basesmc15/_api/contextinfo";
                HttpWebRequest wreq = HttpWebRequest.Create(resourceUrl) as HttpWebRequest;
                wreq.UseDefaultCredentials = true;
                wreq.Method = "POST";
                wreq.Accept = "application/json;odata=verbose";
                wreq.ContentLength = 0;
                wreq.ContentType = "application/json";
                string result;
                WebResponse wresp = wreq.GetResponse();

                using (StreamReader sr = new StreamReader(wresp.GetResponseStream()))
                {
                    result = sr.ReadToEnd();
                }

                var jss = new JavaScriptSerializer();
                var val = jss.Deserialize<Dictionary<string, object>>(result);
                var d = val["d"] as Dictionary<string, object>;
                var wi = d["GetContextWebInformation"] as Dictionary<string, object>;
                return getContextForSiteCollection ? wi["SiteFullUrl"].ToString() : wi["WebFullUrl"].ToString();
            }
            else
            {
                nonExactUrl = nonExactUrl.TrimEnd(' ', '/');
            }
            return nonExactUrl;
        }

        private static void ctx_ExecutingWebRequest(object sender, WebRequestEventArgs e)
        {
            try
            {
                //Add the header that tells SharePoint to use Windows authentication.
                e.WebRequestExecutor.RequestHeaders.Add("X-FORMS_BASED_AUTH_ACCEPTED", "f");
            }
            catch (Exception ex)
            {
                //LogException("Error setting authentication header:", ex);
            }

        }

        private static void ProvisionContextForFormAuthSitesIfRequired(ClientContext ctx, string url)
        {
            string[] formsUrlHosts = new[] { "partners.mdlz.com", "ppepartners.mdlz.com" };

            Uri u = new Uri(url);
            if (formsUrlHosts.Contains(u.Host.ToLower()))
            {
                ctx.ExecutingWebRequest += ctx_ExecutingWebRequest;
            }
        }

        public static string GetSiteCollectionUrl(string url, bool renameHostnameToMdlzDotCom = true, bool enforceHttps = true)
        {
            url = System.Web.HttpUtility.UrlDecode(url);
            Uri u;

            if (CheckURLValid(url, out u))
            {
                url = u.GetLeftPart(UriPartial.Path).Replace("//", "/").Replace(":/", "://");
                if (renameHostnameToMdlzDotCom)
                {
                    url = url.ToLower().Replace(".kraft.com", ".mdlz.com");
                }
                u = new Uri(url);

                string scheme = enforceHttps ? "https" : u.Scheme;

                string retUrl = null;

                if (url.ToLower().IndexOf(string.Format("{0}://{1}/sites", u.Scheme, u.Authority)) > -1)
                {
                    if (url.Count(x => x == '/') >= 5)
                        retUrl = string.Format("{0}://{1}/{2}{3}", scheme, u.Authority, u.Segments[1], u.Segments[2].TrimEnd('/'));
                    else
                        retUrl = url.TrimEnd('/');
                }
                else
                {
                    retUrl = string.Format("{0}://{1}", scheme, u.Authority);
                }

                return System.Web.HttpUtility.UrlDecode(retUrl);
            }

            return url;
        }

        private static bool CheckURLValid(string source, out Uri uriResult)
        {
            return Uri.TryCreate(source, UriKind.Absolute, out uriResult) && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
        }

        public static void ExecuteQueryRetry(this ClientRuntimeContext clientContext, int retryCount = 10, int delay = 500)
        {
            int retryAttempts = 0;
            int backoffInterval = delay;

            if (retryCount <= 0)
                throw new ArgumentException("Provide a retry count greater than zero.");

            if (delay <= 0)
                throw new ArgumentException("Provide a delay greater than zero.");

            // Do while retry attempt is less than retry count
            while (retryAttempts < retryCount)
            {
                try
                {
                    //// ClientTag property is limited to 32 chars
                    //if (string.IsNullOrEmpty(clientTag))
                    //{
                    //    clientTag = $"{PnPCoreUtilities.PnPCoreVersionTag}:{GetCallingPnPMethod()}";
                    //}
                    //if (clientTag.Length > 32)
                    //{
                    //    clientTag = clientTag.Substring(0, 32);
                    //}
                    //clientContext.ClientTag = clientTag;

                    // Make CSOM request more reliable by disabling the return value cache. Given we 
                    // often clone context objects and the default value is
                    clientContext.DisableReturnValueCache = true;
                    clientContext.ExecuteQuery();
                    return;
                }
                catch (WebException wex)
                {
                    var response = wex.Response as HttpWebResponse;
                    // Check if request was throttled - http status code 429
                    // Check is request failed due to server unavailable - http status code 503
                    if (response != null && (response.StatusCode == (HttpStatusCode)429 || response.StatusCode == (HttpStatusCode)503))
                    {
                        //Log.Warning(Constants.LOGGING_SOURCE, CoreResources.ClientContextExtensions_ExecuteQueryRetry, backoffInterval);

                        //Add delay for retry
                        Thread.Sleep(backoffInterval);

                        //Add to retry count and increase delay.
                        retryAttempts++;
                        backoffInterval = backoffInterval * 2;
                    }
                    else
                    {
                        throw;
                    }
                }
            }
            throw new Exception(string.Format($"Maximum retry attempts {retryCount}, has be attempted."));
        }
    }
}
