(function () {
    var app = angular.module('app.wizard');

    app.service("CreateItDataService", ["$cacheService", function ($q, $http, $cacheService) {

        var CreateItBaseUrl = "/sites/createitvnext";
        var httpGetonfig = { header: { 'accept': 'application/json;odata=verbose' } }

        var promise_GetInitialData;
        this.GetInitialData = function () {

            if (!promise_GetInitialData) {
                promise_GetInitialData = $cacheService.GetCachedObject('InitialData', function (deferred) {
                    var context = new SP.ClientContext(this.CreateItBaseUrl);
                    var lists = context.get_web().get_lists();

                    var dataObj = {};

                    var metaDataListNames = ['Regions', 'TimeZone', 'Functions', 'Languages'];
                    dataObj.MetaDataLists = {};

                    metaDataListNames.forEach(function (item) {
                        var c_metadataQuery = new SP.CamlQuery();
                        c_metadataQuery.set_viewXml("<View><Query><Where><Eq><FieldRef Name='SP_Enabled'/><Value Type='Text'>True</Value></Eq></Where></Query><RowLimit>100</RowLimit></View>");
                        dataObj.MetaDataLists[item] = lists.getByTitle('Regions').getItems(c_metadataQuery);
                        context.load(dataObj.MetaDataLists[item]);
                    });

                    dataObj.AppSettings = lists.getByTitle('AppSettings').getItems(new SP.CamlQuery());
                    context.load(dataObj.AppSettings);

                    dataObj.Templates = lists.getByTitle('Templates').getItems(new SP.CamlQuery());
                    context.load(dataObj.Templates);

                    //caml.set_viewXml("<View><Query><Where><BeginsWith><FieldRef Name='Title' /><Value Type='Text'>T</Value></BeginsWith>            </Where></Query></View>");
                    context.executeQueryAsync(function () {

                        (function () {
                            var t_MetaDataLists = [];
                            dataObj.MetaDataLists.forEach(function (item) {
                                var enumerator = item.getEnumerator();
                                var t_ListObj = [];
                                while (enumerator.moveNext()) {
                                    var _item = enumerator.get_current();
                                    var t_Obj = {};
                                    t_Obj.Id = parseInt(_item.get_item("ID"));
                                    t_Obj.Key = _item.get_item("SP_Key");
                                    t_Obj.Value = _item.get_item("SP_Value");
                                    t_Obj.DisplayOrder = parseInt(_item.get_item("SP_DisplayOrder"));
                                    t_Obj.Enabled = _item.get_item("SP_Enabled");
                                    t_ListObj.push(t_Obj);
                                }
                                t_MetaDataLists.push(t_ListObj);
                            });
                            dataObj.MetaDataLists = t_MetaDataLists;
                        })();


                        (function () {
                            var t_AppSettings = [];
                            var enumerator = dataObj.AppSettings.getEnumerator();
                            while (enumerator.moveNext()) {
                                var _item = enumerator.get_current();
                                var t_Obj = {};
                                t_Obj.Id = parseInt(_item.get_item("ID"));
                                t_Obj.Key = _item.get_item("SP_Key");
                                t_Obj.Value = _item.get_item("SP_Value");
                                t_Obj.Description = _item.get_item("SP_Description");
                                t_AppSettings.push(t_Obj);
                            }
                            dataObj.AppSettings = t_AppSettings;
                        })();

                        (function () {

                            dataObj.Templates = getTemplatesFromItemColl(dataObj.Templates);



                        })();

                        deferred.resolve(dataObj);
                    }, function (sender, args) {
                        deferred.reject(args.get_message());
                    });
                });
            }
            return promise_GetInitialData;
        }

        var promise_GetCurrentUser;
        this.GetCurrentUser = function () {
            if (!promise_GetCurrentUser) {
                promise_GetCurrentUser = $http.get(CreateItBaseUrl + '/_api/web/currentuser', httpGetonfig).then(function (res) {
                    return res.data.d;
                });
            }
            return promise_GetCurrentUser;
        }

        this.GetExistingRequests = function () {
            return this.GetCurrentUser().then(function (user) {
                return $http.get(CreateItBaseUrl + "/_api/web/lists/getbytitle('Site Requests')/items?$top=1000&$select=Url,ProvisioningStatus&$filter=RequestedBy eq '" + user.Id + "'").then(function (res) {
                    return res.data.d.results;
                });
            });
        }

        this.GetPeoplePickerEntities = function (query) {
            return this.GetFormDigestValue().then(function (fd) {
                return $http({
                    'url': CreateItBaseUrl + "/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser",
                    'method': 'POST',
                    'data': JSON.stringify({
                        'queryParams': {
                            '__metadata': {
                                'type': 'SP.UI.ApplicationPages.ClientPeoplePickerQueryParameters'
                            },
                            'AllowEmailAddresses': true,
                            'AllowMultipleEntities': false,
                            'AllUrlZones': false,
                            'MaximumEntitySuggestions': 20,
                            'PrincipalSource': 15,
                            'PrincipalType': 15,
                            'QueryString': query
                        }
                    }),
                    'headers': {
                        'accept': 'application/json;odata=verbose',
                        'content-type': 'application/json;odata=verbose',
                        'X-RequestDigest': fd.FormDigest
                    },
                }).then(function (res) {
                    return JSON.parse(res.data.d.ClientPeoplePickerSearchUser);
                });
            });
        }

        var promise_GetFormDigestValue;
        var fdExpiry;

        this.GetFormDigestValue = function () {
            //If we have a valid promise, return it and exit this method
            if (promise_GetFormDigestValue && fdExpiry && (new Date() < fdExpiry)) {
                return promise_GetFormDigestValue;
            }


            if (!promise_GetFormDigestValue) {
                var fdFromPage = $('#__REQUESTDIGEST').val();

                //If we are on a SharePoint page we can get hold of the form digest from the page itself. If we have it, return it and exit this method
                if (fdFromPage && fdFromPage.length > 0) {
                    var deferred = $q.defer();
                    fdExpiry = new Date((new Date().getTime() + ((1800 - 30) * 1000)));

                    deferred.resolve({
                        FormDigest: fdFromPage,
                        Expiry: fdExpiry
                    });

                    promise_GetFormDigestValue = deferred.promise;
                    return promise_GetFormDigestValue;
                }
            }

            //Only and only if the FormDigest value we have has expired and we are not getting it via the page, we shall make a new request to the contextInfo API
            var apiUrl_ContextInfo = CreateItBaseUrl + "_api/contextinfo";

            promise_GetFormDigestValue = $http({
                method: "POST",
                url: apiUrl_ContextInfo,
                headers: ApiUrlConstants.JsonHeader,
            }).then(function (_response) {
                fdExpiry = new Date((new Date().getTime() + ((_response.data.d.GetContextWebInformation.FormDigestTimeoutSeconds - 30) * 1000)));
                return {
                    FormDigest: _response.data.d.GetContextWebInformation.FormDigestValue,
                    Expiry: fdExpiry
                };
            }, function (data, status) {
                return data;
            });

            return promise_GetFormDigestValue;
        }

        this.SaveNewSiteRequest = function (newReqObj) {

            var deferred = $q.defer();

            var clientContext = new SP.ClientContext(CreateItBaseUrl);
            var oList = clientContext.get_web().get_lists().getByTitle('Site Requests');

            var itemCreateInfo = new SP.ListItemCreationInformation();
            var item = oList.addItem(itemCreateInfo);

            item.set_item('Title', siteRequest.title);
            item.set_item('SP_Description', siteRequest.description);
            item.set_item('SP_Template', siteRequest.template);
            item.set_item('SP_Url', siteRequest.url);
            item.set_item('SP_Lcid', siteRequest.Lcid);
            item.set_item('SP_TimeZone', siteRequest.timeZoneId);
            item.set_item('SP_Policy', siteRequest.sitePolicy);
            item.set_item('SP_ExternalSharingFlag', false);
            item.set_item('SP_RequestOnPrem', siteRequest.sharePointOnPremises);
            item.set_item('SP_BusinessCase', siteRequest.businessCase);
            item.set_item('SP_Props', siteRequest.siteMetadataJson);
            item.set_item('SP_IsConfidential', siteRequest.isConfidential);
            item.set_item('SP_Owner', SP.FieldUserValue.fromUser(siteRequest.primaryOwner));

            if (siteRequest.requestedBy)
                item.set_item('SP_RequestedBy') = SP.FieldUserValue.fromUser(siteRequest.requestedBy);

            if (siteRequest.autoApprove) {
                item.set_item('SP_ProvisioningStatus', 'Approved');
                item.set_item('SP_ApprovedDate', new Date());
            }
            else {
                item.set_item('SP_ProvisioningStatus', 'New');
            }


            if (item.additionalAdministrators && item.additionalAdministrators.length > 0) {
                var addAdmins = [];
                addAdmins.forEach(function (x) { addAdmins.push(SP.FieldUserValue.fromUser(x)); });
                item.set_item('SP_AdditionalAdmins', addAdmins);
            }

            item.update();
            clientContext.load(item);

            clientContext.executeQueryAsync(function () {
                deferred.resolve();
            }, function (sender, args) {
                deferred.reject(args.get_message());
            });
            return deferred.promise;

        }

        this.SaveNewSubsiteRequest = function (siteRequest) {
            var clientContext = new SP.ClientContext(CreateItBaseUrl);
            var oList = clientContext.get_web().get_lists().getByTitle('SubSite Requests');

            var itemCreateInfo = new SP.ListItemCreationInformation();
            var item = oList.addItem(itemCreateInfo);

            item.set_item('Title', siteRequest.title);
            item.set_item('ParentSiteUrl', siteRequest.ParentSiteUrl);
            item.set_item('NewSiteUrl', siteRequest.NewSiteUrl);
            item.set_item('Description', siteRequest.Description);
            item.set_item('MdlzTemplate', siteRequest.MdlzTemplate);
            item.set_item('InheritPermissions', siteRequest.InheritPermissions);
            item.set_item('DisplaySiteOnQuickLaunchOfParent', siteRequest.DisplaySiteOnQuickLaunchOfParent);
            item.set_item('DisplaySiteOnTopLinkBarOfParent', siteRequest.DisplaySiteOnTopLinkBarOfParent);
            item.set_item('UseTopLinkBarFromParent', siteRequest.UseTopLinkBarFromParent);

            item.update();
            clientContext.load(item);

            clientContext.executeQueryAsync(function () {
                deferred.resolve();
            }, function (sender, args) {
                deferred.reject(args.get_message());
            });
        }

        var promise_GetTemplatesForSubsite;
        this.GetTemplatesForSubsite = function () {
            if (!promise_GetTemplatesForSubsite) {
                promise_GetTemplatesForSubsite = $cacheService.GetCachedObject('InitialData', function (deferred) {
                    var context = new SP.ClientContext(this.CreateItBaseUrl);
                    var lists = context.get_web().get_lists();
                    var caml = new SP.CamlQuery();
                    caml.set_viewXml("<View><Query><Where><And><Eq><FieldRef Name='SP_RootWebOnly' /><Value Type='Boolean'>0</Value></Eq><Eq><FieldRef Name='SP_SubWebOnly' /><Value Type='Boolean'>1</Value></Eq></And></Where></Query></View>");//TODO
                    var templates = lists.getByTitle('Templates').getItems();
                    context.load(templates);
                    context.executeQueryAsync(function () {
                        var objToReturn = getTemplatesFromItemColl(templates);
                    }, function (sender, args) {
                        deferred.reject(args.get_message());
                    });
                });
            }

            return promise_GetTemplatesForSubsite;
        }

        function getTemplatesFromItemColl(itemColl) {
            var t_Templates = [];
            var TemplateFields = {};
            TemplateFields.TTILE_NAME = "Title";
            TemplateFields.DESCRIPTION_NAME = "SP_Description";
            TemplateFields.TEMPLATEIMAGE_NAME = "SP_TemplateImageUrl";
            TemplateFields.HOSTPATH_NAME = "SP_Host_Path";
            TemplateFields.TENANTURL_NAME = "SP_TenantUrl";
            TemplateFields.ONPREM_NAME = "SP_RequestOnPrem";
            TemplateFields.TEMPLATE_NAME = "SP_Template";
            TemplateFields.STORAGEMAX_NAME = "SP_StorageMaximumLevel";
            TemplateFields.STORAGEWARN_NAME = "SP_StorageWarningLevel";
            TemplateFields.USERCODEMAX_NAME = "SP_UserCodeMaximumLevel";
            TemplateFields.USERCODEWARN_NAME = "SP_UserCodeWarningLevel";
            TemplateFields.PROVISIONINGTEMPLATE_NAME = "SP_SiteProvisioningTemplate";
            TemplateFields.ENABLED_NAME = "SP_Enabled";
            TemplateFields.ROOTWEBONLY_NAME = "SP_RootWebOnly";
            TemplateFields.SUBWEBONLY_NAME = "SP_SubWebOnly";
            TemplateFields.TTITLE_NAME = "Title";
            TemplateFields.USETEMPLATESITEPOLICY_NAME = "SP_UseTemplateSitePolicy";
            TemplateFields.AutoApprove = "SP_AutoApprove";
            TemplateFields.MdlzSiteCategory = "SP_MdlzSiteCategory";

            var enumerator = itemColl.getEnumerator();
            while (enumerator.moveNext()) {
                var _item = enumerator.get_current();
                var t_Obj = {};

                t_Obj.Title = _item.get_item(TemplateFields.TTILE_NAME),
                t_Obj.Description = _item.get_item(TemplateFields.DESCRIPTION_NAME),
                t_Obj.Enabled = _item.get_item(TemplateFields.ENABLED_NAME),//bool
                t_Obj.ProvisioningTemplate = _item.get_item(TemplateFields.PROVISIONINGTEMPLATE_NAME),
                t_Obj.ImageUrl = _item.get_item(TemplateFields.TEMPLATEIMAGE_NAME).Url,//FieldUrlValue
                t_Obj.TenantAdminUrl = _item.get_item(TemplateFields.TENANTURL_NAME).Url,//FieldUrlValue
                t_Obj.HostPath = _item.get_item(TemplateFields.HOSTPATH_NAME).Url,//FieldUrlValue
                t_Obj.RootWebOnly = _item.get_item(TemplateFields.ROOTWEBONLY_NAME),
                t_Obj.SubWebOnly = _item.get_item(TemplateFields.SUBWEBONLY_NAME),//bool
                t_Obj.StorageMaximumLevel = parseInt(_item.get_item(TemplateFields.STORAGEMAX_NAME)),
                t_Obj.StorageWarningLevel = parseInt(_item.get_item(TemplateFields.STORAGEWARN_NAME)),
                t_Obj.UserCodeMaximumLevel = parseInt(_item.get_item(TemplateFields.USERCODEMAX_NAME)),
                t_Obj.UserCodeWarningLevel = parseInt(_item.get_item(TemplateFields.USERCODEWARN_NAME)),
                t_Obj.SharePointOnPremises = item.BaseGet < bool > (TemplateFields.ONPREM_NAME),
                t_Obj.RootTemplate = _item.get_item(TemplateFields.TEMPLATE_NAME),
                t_Obj.UseTemplateDefinedPolicy = _item.get_item(TemplateFields.USETEMPLATESITEPOLICY_NAME),//bool
                t_Obj.AutoApprove = _item.get_item(TemplateFields.AutoApprove),//bool
                t_Obj.MdlzSiteCategory = _item.get_item(TemplateFields.MdlzSiteCategory)

                t_Templates.push(t_Obj);
            }
            return t_Templates;
        }
    }]);
})();