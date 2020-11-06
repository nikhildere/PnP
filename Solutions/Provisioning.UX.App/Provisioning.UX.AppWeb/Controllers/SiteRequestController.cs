using Microsoft.SharePoint.ApplicationPages.ClientPickerQuery;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OfficeDevPnP.Core.WebAPI;
using Provisioning.Common;
using Provisioning.Common.Data.SiteRequests;
using Provisioning.Common.MdlzComponents;
using Provisioning.Common.Utilities;
using Provisioning.UX.AppWeb.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Provisioning.UX.AppWeb.Controllers
{
    public class SiteRequestController : ApiController
    {
        [HttpPut]
        public void Register(WebAPIContext sharePointServiceContext)
        {
            WebAPIHelper.AddToCache(sharePointServiceContext);
        }

        /// <summary>
        /// Gets a site request in the date repository
        /// POST api/<controller>
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        [Route("api/provisioning/siteRequests/getSiteRequest/url")]
        [WebAPIContextFilter]
        [HttpPost]
        public HttpResponseMessage GetSiteRequest([FromBody]string value)
        {
            try
            {
                var _data = JsonConvert.DeserializeObject<SiteRequest>(value);
                var _requestToCheck = ObjectMapper.ToSiteRequestInformation(_data);

                ISiteRequestFactory _srf = SiteRequestFactory.GetInstance();
                var _manager = _srf.GetSiteRequestManager();
                var _siteRequest = _manager.GetSiteRequestByUrl(_data.Url);
                if (_siteRequest == null)
                {
                    var _message = string.Format("The site request url {0} does not exist", _requestToCheck.Url);
                    HttpResponseMessage _response = Request.CreateResponse(HttpStatusCode.NotFound, _message);
                    throw new HttpResponseException(_response);

                }
                else
                {
                    return Request.CreateResponse<SiteInformation>(HttpStatusCode.OK, _siteRequest);
                }

            }
            catch (HttpResponseException)
            {
                throw;
            }
            catch (JsonException _ex)
            {
                var _message = string.Format("There was an error with the data. Exception {0}", _ex.Message);
                Log.Error("SiteRequestController.GetSiteRequest",
                     "There was an error processing the request. Error Message {0} Error Stack {1}",
                     _ex.Message,
                     _ex);
                HttpResponseMessage _response = Request.CreateResponse(HttpStatusCode.BadRequest, _message);
                throw new HttpResponseException(_response);
            }
            catch (Exception _ex)
            {
                var _message = string.Format("There was an error with the data. Exception {0}", _ex.Message);
                Log.Error("SiteRequestController.GetSiteRequest",
                    "There was an error processing your request. Error Message {0} Error Stack {1}",
                    _ex.Message,
                    _ex);
                HttpResponseMessage _response = Request.CreateResponse(HttpStatusCode.InternalServerError, _message);
                throw new HttpResponseException(_response);
            }
        }

        /// <summary>
        /// Creates new a site request in the data repository
        /// POST api/<controller>
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        [Route("api/provisioning/siteRequests/create")]
        [WebAPIContextFilter]
        [HttpPost]
        public HttpResponseMessage CreateSiteRequest([FromBody]string value)
        {
            SiteRequest _data = null;
            try
            {
                _data = JsonConvert.DeserializeObject<SiteRequest>(value);
                var _newRequest = ObjectMapper.ToSiteRequestInformation(_data);
                _newRequest.BaseTemplate = JToken.Parse(value)["baseTemplate"].ToString();

                // Handle the case when the URL is null - ie, were going to generate the URL later 
                if (_newRequest.Url == null)
                {
                    _newRequest.Url = "uri://autogenerate/" + Guid.NewGuid().ToString("N");
                }

                if (_newRequest.BaseTemplate == "TEAMS")
                {
                    string token = TeamsProvisioning.AcquireToken();
                    List<string> owners = new List<string>();
                    owners.AddRange(_newRequest.AdditionalAdministrators.Select(x => x.Name.ToLower()));
                    owners.AddRange(new[] { _newRequest.SiteOwner.Name.ToLower() });
                    List<string> usersWithoutTeamsLicense = new List<string>();

                    foreach (var item in owners)
                    {
                        bool hasTeamsLicense = false;
                        string upn = item;
                        try
                        {
                            upn = upn.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries).Last();
                            string licenseJson = TeamsProvisioning.GetUserLicenseDetails(upn, token);
                            var json = JToken.Parse(licenseJson);
                            hasTeamsLicense = json["value"].Any(x => x["servicePlans"].Any(y => y["servicePlanId"].ToString() == "57ff2da0-773e-42df-b2af-ffb7a2317929" && y["provisioningStatus"].ToString() == "Success"));
                        }
                        catch { }

                        if (!hasTeamsLicense)
                            usersWithoutTeamsLicense.Add(upn);
                    }

                    if (usersWithoutTeamsLicense.Count > 0)
                    {
                        return Request.CreateResponse(HttpStatusCode.BadRequest, $"Could not complete your request as following users don't have a Microsoft Teams license and hence cannot be added as owners:{Environment.NewLine + Environment.NewLine + string.Join(Environment.NewLine, usersWithoutTeamsLicense)}");
                    }
                }
                ///Save the Site Request
                ISiteRequestFactory _srf = SiteRequestFactory.GetInstance();
                var _manager = _srf.GetSiteRequestManager();

                _manager.CreateNewSiteRequest(_newRequest);


                return Request.CreateResponse<SiteRequest>(HttpStatusCode.Created, _data);

            }
            catch (JsonSerializationException _ex)
            {
                var _message = string.Format("There was an error with the data. Exception {0}", _ex.Message);

                Log.Error("SiteRequestController.CreateSiteRequest",
                     "There was an error creating the new site request. Error Message {0} Error Stack {1}",
                     _ex.Message,
                     _ex);

                HttpResponseMessage _response = Request.CreateResponse(HttpStatusCode.BadRequest, _message);
                throw new HttpResponseException(_response);
            }

            catch (Exception _ex)
            {
                var _message = string.Format("There was an error processing the request. Exception {0}", _ex.Message);
                HttpResponseMessage _response = Request.CreateResponse(HttpStatusCode.InternalServerError, _message);

                Log.Error("SiteRequestController.CreateSiteRequest",
                    "There was an error creating the new site request. Error Message {0} Error Stack {1}",
                    _ex.Message,
                    _ex);
                throw new HttpResponseException(_response);
            }
        }

        /// <summary>
        /// Gets sets requests by users email
        /// POST api/<controller>
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        [Route("api/provisioning/siteRequests/getOwnerRequests")]
        [WebAPIContextFilter]
        [HttpPost]
        public HttpResponseMessage GetOwnerRequestsByEmail([FromBody] string ownerEmailAddress)
        {
            try
            {
                var _user = JsonConvert.DeserializeObject<SiteUser>(ownerEmailAddress);
                ISiteRequestFactory _requestFactory = SiteRequestFactory.GetInstance();
                var _manager = _requestFactory.GetSiteRequestManager();
                var _siteRequests = _manager.GetOwnerRequests(_user.Name);
                return Request.CreateResponse((HttpStatusCode)200, _siteRequests);
            }
            catch (JsonSerializationException _ex)
            {
                var _message = string.Format("There was an error with the data. Exception {0}", _ex.Message);

                Log.Error("SiteRequestController.GetOwnerRequestsByEmail",
                     "There was an error get site requests by email. Error Message {0} Error Stack {1}",
                     _ex.Message,
                     _ex);

                HttpResponseMessage _response = Request.CreateResponse(HttpStatusCode.BadRequest, _message);
                throw new HttpResponseException(_response);
            }
            catch (Exception _ex)
            {
                var _message = string.Format("There was an error processing the request. {0}", _ex.Message);
                Log.Error("SiteRequestController.GetOwnerRequestsByEmail", "There was an error processing the request. Exception: {0}", _ex);
                HttpResponseMessage _response = Request.CreateResponse(HttpStatusCode.InternalServerError, _message);
                throw new HttpResponseException(_response);
            }
        }


    }
}
