(function () {
    'use strict';
    var controllerId = 'wizard';

    angular
        .module('app.wizard')
        .controller('WizardModalInstanceController', WizardModalInstanceController);
    //.value('urlparams', null);

    WizardModalInstanceController.$inject = ['$rootScope', 'common', 'config', '$scope', '$log', '$modalInstance', 'Templates', 'BusinessMetadata', 'utilservice', '$SharePointProvisioningService', '$q', '$http', '$filter', '$SharePointJSOMService', 'tabParameters'];

    function WizardModalInstanceController($rootScope, common, config, $scope, $log, $modalInstance, Templates, BusinessMetadata, $utilservice, $SharePointProvisioningService, $q, $http, $filter, $SharePointJSOMService, tabParameters) {
        $scope.title = 'WizardModalInstanceController';

        //$scope.siteConfiguration = {};
        $scope.siteConfiguration.properties = {};
        var vm = this;

        var logSuccess = common.logger.getLogFn(controllerId, 'success');
        var logError = common.logger.getLogFn(controllerId, 'error');
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        var spHostWebUrl = $scope.spHostWebUrl;
        var spAppWebUrl = $scope.spAppWebUrl;

        //activate();

        //Form validation object
        $scope.allFormsValid = {
            readAndAccept: function () { return $scope.siteConfiguration.responsibilities.read; },
            //siteIntendedUse: false,
            siteDetails: false,
            //sitePrivacy: false,
            siteTemplate: function () { return $scope.siteConfiguration.template == null; }
        };



        activate();


        //Set language and time zone defaults
        for (var i = 0; i < $scope.appSettings.length; i++) {
            var setting = $scope.appSettings[i]
            switch (setting.Key) {
                case 'DefaultLanguage':
                    $scope.siteConfiguration.language = setting.Value
                    break;
                case 'DefaultTimeZone':
                    $scope.siteConfiguration.timezone = setting.Value
                    break;
                case 'DefaultRegion':
                    $scope.siteConfiguration.properties.region = setting.Value
                    break;
                case 'DefaultDivision':
                    $scope.siteConfiguration.properties.division = setting.Value
                    break;
                case 'DefaultFunction':
                    $scope.siteConfiguration.properties.function = setting.Value
                    break;
                case 'DefaultSiteClassification':
                    $scope.siteConfiguration.privacy.classification = setting.Value
                    $scope.allFormsValid.sitePrivacy = true
                    break;
            }

        }



        $scope.siteConfiguration.spHostWebUrl = spHostWebUrl;
        $scope.siteConfiguration.spRootHostName = "https://" + $utilservice.spRootHostName(spHostWebUrl); // still need to capture proto
        $scope.siteConfiguration.responsibilities = { read: false };
        $scope.siteConfiguration.allowCustomUrl = true;

        $scope.cancel = function () {
            if (confirm('This will clear your selection and close the dialog. Are you sure?'))
                $modalInstance.dismiss('cancel');
        };

        // Init responsibilities values
        $scope.siteConfiguration.properties.termsaccepted = false;
        $scope.siteConfiguration.properties.pursuelearningpathagreed = false;
        $scope.siteConfiguration.properties.communityparticipationagreed = false;
        $scope.siteConfiguration.properties.manageaccesstositeaccepted = false;
        $scope.siteConfiguration.properties.maintenanceresponsibilityaccepted = false;

        // Init misc prop values
        $scope.siteConfiguration.properties.sponprem = false;
        $scope.siteConfiguration.properties.externalsharing = false;

        //Form validation object
        $scope.allFormsValid = {
            siteResponsibilities: false,
            siteIntendedUse: false,
            siteDetails: false,
            sitePrivacy: false,
            siteTemplate: function () { return $scope.siteConfiguration.template == null; }
        };

        //Watching the forms of the specific views
        $scope.$watch('formWizard.$valid', function () {
            switch ($scope.getCurrentStep()) {
                case 4:
                    $scope.allFormsValid.siteResponsibilities = $scope.formWizard.siteResponsibilitiesform == null ? false : $scope.formWizard.siteResponsibilitiesform.$valid;
                    break;
                //case 3:
                //    $scope.allFormsValid.siteIntendedUse = $scope.formWizard.siteintendeduseform == null ? false : $scope.formWizard.siteintendeduseform.$valid;
                //    break;
                case 3:
                    $scope.allFormsValid.siteDetails = $scope.formWizard.sitedetailsform == null ? false : $scope.formWizard.sitedetailsform.$valid;
                    break;
                //case 7:
                //    $scope.allFormsValid.sitePrivacy = $scope.formWizard.siteprivacyform == null ? false : $scope.formWizard.siteprivacyform.$valid;
                //    break;
            }

        });

        //submitcheck
        $scope.submitDenied = false;

        //set confidential selected by default
        $scope.siteConfiguration.isConfidential = 1;
        $scope.siteConfiguration.isOnBehalfOf = 0;

        $scope.finished = function () {

            $scope.siteConfiguration.properties.sponprem = $scope.siteConfiguration.spOnPrem;

            //checks if all mandatory forms are valid before submit
            if (!$scope.allFormsValid.siteResponsibilities ||
                //!$scope.allFormsValid.siteIntendedUse ||
                !$scope.allFormsValid.siteDetails ||
                //!$scope.allFormsValid.sitePrivacy ||
                $scope.allFormsValid.siteTemplate()) {

                $scope.submitDenied = true;
            }
            else {

                //  save the site request when the wizard is complete

                var siteRequest = new Object();
                siteRequest.title = $scope.siteConfiguration.details.title;
                if ($scope.siteConfiguration.allowCustomUrl) {
                    siteRequest.url = null
                }
                else {
                    siteRequest.url = $scope.siteConfiguration.spNewSitePrefix + $scope.siteConfiguration.details.url;
                }
                siteRequest.description = $scope.siteConfiguration.details.description;
                siteRequest.lcid = $scope.siteConfiguration.language;
                siteRequest.timeZoneId = $scope.siteConfiguration.timezone;


                siteRequest.primaryOwner = $scope.siteConfiguration.primaryOwner.LoginName;
                siteRequest.additionalAdministrators = $scope.siteConfiguration.secondaryOwners ? $scope.siteConfiguration.secondaryOwners.map(function (owner) { return owner.Key; }) : [];

                if ($scope.siteConfiguration.isOnBehalfOf == 1 && $scope.siteConfiguration.primaryOwnerOnBehalf != null && $scope.siteConfiguration.primaryOwnerOnBehalf.length == 1) {
                    siteRequest.additionalAdministrators.push(siteRequest.primaryOwner);
                    siteRequest.requestedBy = siteRequest.primaryOwner;
                    siteRequest.primaryOwner = $scope.siteConfiguration.primaryOwnerOnBehalf[0].Key;
                }

                siteRequest.sharePointOnPremises = $scope.siteConfiguration.spOnPrem;
                siteRequest.template = $scope.siteConfiguration.template.title;
                siteRequest.autoApprove = $scope.siteConfiguration.template.autoApprove;
                //siteRequest.sitePolicy = $scope.siteConfiguration.privacy.classification;
                //siteRequest.businessCase = $scope.siteConfiguration.purpose.description;
                siteRequest.enableExternalSharing = $scope.siteConfiguration.externalSharing;
                siteRequest.isConfidential = $scope.siteConfiguration.isConfidential;

                //property bag entries will enumerate all properties defined in siteConfiguration.properties

                var props = {};
                angular.forEach($scope.siteConfiguration.properties, function (value, key) {
                    var data = angular.isObject(value) ? value : encodeURIComponent(value);
                    var propData = "";
                    if ($.isArray(data)) {
                        angular.forEach(data, function (value, key) {
                            if (value.Value != undefined)
                                value = encodeURIComponent(value.Value);
                            if (propData == "") {
                                propData = value;
                            }
                            else {
                                propData = propData + "," + value;
                            }
                        });

                        props["_site_props_" + key] = propData;
                    }
                    else {
                        props["_site_props_" + key] = data;
                    }
                });

                //add properties to javaScript object
                siteRequest.properties = props;

                //process the siterequest
                if ($scope.siteConfiguration.allowCustomUrl) {
                    saveNewSiteRequest(siteRequest);
                } else {
                    processNewSiteRequest(siteRequest);
                }



            }
        };

        $scope.interacted = function (field) {
            return field.$dirty;
        };

        $scope.selectTemplate = function (template) {

            if ($scope.siteConfiguration.template != template)
                $scope.siteConfiguration.details = {};

            // Add the selected template to the configuration object
            $scope.siteConfiguration.template = template;
            // Add the Path to the configuration object to store the url
            $scope.siteConfiguration.spNewSitePrefix = template.hostPath; // + template.managedPath + "/";
            $scope.siteConfiguration.spOnPrem = template.sharePointOnPremises;
            $scope.siteConfiguration.tenantAdminUrl = template.tenantAdminUrl;

            //ExternalSharing Request to determine if External Sharing is enabled in the tenant
            var externalSharingRequest = new Object();
            externalSharingRequest.tenantAdminUrl = template.tenantAdminUrl;
            isExternalSharingEnabled(externalSharingRequest);
            var siteUrlRequest = new Object();
            isSiteUrlProviderUsed(siteUrlRequest)
        }

        $scope.filterSiteTemplates = function (template) {
            //return true;
            //return (template.rootTemplate != 'BLOG#0' && template.rootTemplate != 'ENTERWIKI#0');
            return (template.subWebOnly == false) && template.mdlzSiteCategory == $scope.SelectedMdlzSiteCategory.Title

        }

        function activate() {

            $log.info($scope.title + ' Activated');
            $scope.siteConfiguration = {};
            $scope.siteConfiguration.properties = {};
            $scope.siteConfiguration.privacy = {};

            if (tabParameters == 0 || tabParameters) {
                $scope.SelectedMdlzSiteCategory = $scope.MdlzSiteCategories[tabParameters];
                $scope.IsTabbedInterface = false;
            }
            adjustSteps(true);

            // Initialize modal dialog box information
            initModal();
            //getTemplates();
            //getBusinessMetadata();

            var promises = [];
            common.activateController(promises, controllerId)
                .then(function () {
                    logSuccess('Wizard Activated');
                });
            
            
        }

        function adjustSteps(resetToFirstStep) {
            $scope.WillRenderIntro = (!$scope.IsTabbedInterface && $scope.SelectedMdlzSiteCategory.IntroTemplatePath != null)
            $scope.steps = $scope.WillRenderIntro ? [1, 2, 3, 4] : [2, 3, 4];
            $scope.FirstStep = $scope.WillRenderIntro ? 1 : 2;
            if (resetToFirstStep)
                $scope.step = $scope.FirstStep;
        }

        function initModal() {
            
            $scope.wizard = { tacos: 2 };

            $scope.isCurrentStep = function (step) {
                return $scope.step === step;
            };

            $scope.setCurrentStep = function (step) {
                $scope.step = step;
            };

            $scope.getCurrentStep = function () {
                return $scope.step;
            };

            $scope.isFirstStep = function () {
                return $scope.step === $scope.FirstStep;
            };

            $scope.isLastStep = function () {
                return $scope.step === $scope.steps[($scope.steps.length - 1)];
            };

            $scope.handlePrevious = function () {
                $scope.step -= ($scope.isFirstStep()) ? 0 : 1;
            };

            $scope.handleNext = function () {
                if ($scope.isLastStep()) {
                    //$modalInstance.close($scope.wizard);
                } else {
                    $scope.step += 1;
                }
            };
            $scope.showPreviewPopup = showPreviewPopup;

        }

        function showPreviewPopup(_templ) {
            var pvModal = $rootScope.PreviewModalPopup || {};
            pvModal.ImageUrl = _templ.imageUrl.toLowerCase().replace("_png.jpg", ".png").replace("/_w/", "/");
            pvModal.Visible = true;
            $rootScope.PreviewModalPopup = pvModal;
            //$rootScope.$apply();
        }




        function isExternalSharingEnabled(request) {
            //Mdlz - keeping external sharing disabled by default. Internally it will be enabled for Partner sites only.
            $scope.siteConfiguration.externalSharingEnabled = false;
            return;

            //get if external sharing is enabled for the tenant
            $.when($SharePointProvisioningService.isExternalSharingEnabled(request)).done(function (data) {
                if (data != null) {
                    if (data.success == true) {
                        $scope.siteConfiguration.externalSharingEnabled = data.externalSharingEnabled;
                    }
                    else { $scope.siteConfiguration.externalSharingEnabled = false; }
                }
            }).fail(function (err) {
                console.info(JSON.stringify(err));
            });
        }

        function isSiteUrlProviderUsed(request) {
            $scope.siteConfiguration.allowCustomUrl = false;
            return;

            //get if external sharing is enabled for the tenant


            //$.when($SharePointProvisioningService.isSiteUrlProviderUsed(request)).done(function (data) {

            //    if (data != null) {
            //        if (data.UsesCustomProvider == true) {
            //            $scope.siteConfiguration.allowCustomUrl = false
            //            return
            //        }
            //    }
            //    $scope.siteConfiguration.allowCustomUrl = true
            //}).fail(function (err) {
            //    console.info(JSON.stringify(err));
            //});
        }



        function saveNewSiteRequest(request) {
            $.when($SharePointProvisioningService.createNewSiteRequest(request)).done(function (data, status) {
                if (data != null) {
                    if (data.success != true) {
                        logSuccess("Success!, Site Request has been submitted");
                        $modalInstance.close($scope.siteConfiguration);
                    }
                    else {
                        logError("Oops, something bad has occured.")
                    }

                }
            }).fail(function (data, status) {
                console.log(err);
                log.getLogFn
            });
            console.log(request);
        }

        function processNewSiteRequest(request) {

            $.when($SharePointProvisioningService.getSiteRequestByUrl(request)).done(function (data, status) {
                if (data != null) {
                    if (status == 200) {
                        //there is results dont save  the new site request
                        logError("There is an existing site request with this url. Please choose a new url for your site.", null, true);
                    }
                    else if (status == 404) {

                        $SharePointProvisioningService.createNewSiteRequest(request).promise.then(function (data, status) {
                            if (data != null) {
                                logSuccess("Success!! You will receive an email notification once we have created your site.");
                                $modalInstance.close($scope.siteConfiguration);
                            }
                        }, function (data, status) {
                            console.log(data);
                            logError(data, null, true);
                            
                        });

                        //$.when($SharePointProvisioningService.createNewSiteRequest(request)).done(function (data, status) {
                        //    if (data != null) {
                        //        logSuccess("Success!! You will receive an email notification once we have created your site.");
                        //        $modalInstance.close($scope.siteConfiguration);
                        //    }
                        //}).fail(function (data, status) {
                        //    console.log(err);
                        //});
                        console.log(request);
                    }
                }
            });
            console.log(request);
        }

        $scope.siteConfiguration.primaryOwner = $scope.spUser;

        $scope.GetPeoplePickerSearchEntities = function (query, loadingProp) {
            $scope.siteConfiguration[loadingProp] = true;
            //var deferred = $q.defer();

            //$app.withSPContext2(function (spContext) {
            //    var queryParams = new SP.UI.ApplicationPages.ClientPeoplePickerQueryParameters();
            //    queryParams.set_allowEmailAddresses(true);
            //    queryParams.set_allowMultipleEntities(false);
            //    queryParams.set_maximumEntitySuggestions(10);
            //    queryParams.set_principalType(1);
            //    queryParams.set_principalSource(15);
            //    queryParams.set_queryString(query);
            //    queryParams.set_allUrlZones(false);

            //    var result = SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser(spContext, queryParams);
            //    spContext.executeQueryAsync(function () {
            //        $scope.siteConfiguration[loadingProp] = false;
            //        deferred.resolve(JSON.parse(result.m_value));
            //    }, function (err) { deferred.reject(err) });
            //});

            //return deferred.promise

            var deferred = $q.defer();
            $.when($SharePointJSOMService.GetPeoplePickerSearchEntities(query)).done(function (data, status) {
                if (data != null) {
                    deferred.resolve(JSON.parse(data).filter(function (e) { return e && e.EntityData && e.EntityData.Email }));
                }
                $scope.siteConfiguration[loadingProp] = false;
            }).fail(function (err) {
                console.info(JSON.stringify(err));
                deferred.reject(err);
                $scope.siteConfiguration[loadingProp] = false;
            });

            return deferred.promise

        }

        $scope.GetFilteredMetadataObjects = function (query, collection) {
            var retColl;
            if (query == null || query == "")
                retColl = collection;
            else
                retColl = $filter('filter')(collection, { Value: query });
            var deferred = $q.defer();
            deferred.resolve(retColl);
            return deferred.promise
        }
        $scope.GetCsvForMetadataObject = function (mdObj) {
            return mdObj == null ? "" : mdObj.map(function (obj) { return obj.Value }).join(", ");
        }

        $scope.GetCsvForPeoplePicker = function (ppObj) {
            return !$.isArray(ppObj) ? ppObj : (ppObj == null ? "" : ppObj.map(function (obj) { return obj.DisplayText; }).join("; "));
        }

        $scope.SetSelectedMdlzSiteCategory = function (sel) {
            $scope.SelectedMdlzSiteCategory = sel;
            adjustSteps(false);
        }

        $scope.GetSelectedValueForKey = function (collection, value) {
            for (var i = 0; i < collection.length; i++) {
                if (collection[i].Value == value)
                    return collection[i].Key;
            }
            return "";
        }

        $scope.IsCurrentStepValid = function (_step) {
            var step = _step || $scope.getCurrentStep();
            var isValid = false;

            switch (step) {
                case 1:
                    isValid = true;
                    break;
                case 2:
                    isValid = ($scope.siteConfiguration.template != null);
                    break;
                case 3:
                    if (!$scope.formsTempStore_SiteDetails || $scope.formWizard.sitedetailsform != null) {
                        if ($scope.formsTempStore_SiteDetails) {
                            $scope.formWizard.sitedetailsform.$dirty = $scope.formsTempStore_SiteDetails.$dirty;
                        }
                        $scope.formsTempStore_SiteDetails = $scope.formWizard.sitedetailsform;
                    }
                    isValid = $scope.formsTempStore_SiteDetails && $scope.formsTempStore_SiteDetails.$dirty && $scope.formsTempStore_SiteDetails.$valid;
                    break;
                case 4:
                    isValid = $scope.siteConfiguration.properties && $scope.siteConfiguration.properties.termsaccepted;
                    break;
            }

            return isValid;
        }


    }
})();
