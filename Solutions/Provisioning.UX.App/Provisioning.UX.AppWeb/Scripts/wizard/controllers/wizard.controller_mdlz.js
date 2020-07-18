(function () {
    'use strict';
    var controllerId = 'dashboard';

    //if (!window.location.origin) { // Some browsers (mainly IE) does not have this property, so we need to build it manually...
    //    window.location.origin = window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : '');
    //}

    angular
        .module('app.wizard')
        .controller('WizardController', WizardController);

    WizardController.$inject = ['spinnerService', '$rootScope', 'common', 'config', '$scope', '$log', '$modal', 'AppSettings', 'utilservice', '$SharePointProvisioningService', '$http', 'Templates', 'BusinessMetadata'];

    function WizardController(spinnerService, $rootScope, common, config, $scope, $log, $modal, AppSettings, $utilservice, $SharePointProvisioningService, $http, Templates, BusinessMetadata) {
        $scope.title = 'WizardController';
        var vm = this;
        var logSuccess = common.logger.getLogFn(controllerId, 'success');
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);
        var user = new Object();


        $rootScope.userContext = [];
        $scope.user;
        $scope.spinnerService = spinnerService;
        $scope.loading = false;
        $scope.siteConfiguration = {};
        var completedLoadRequests = 0, totalRequests = 7;
        $scope.ProgressBar = 5;

        activate();

        function activate() {


            $log.info($scope.title + ' Activated');
            $scope.appSettings = {};
            $scope.loading = true;

            getInitialData($scope);


            //// web_url/_layouts/15/resource
            //var scriptbase = hostweburl + "/_layouts/15/";
            //// Load the js files and continue to the successHandler
            //$.getScript(scriptbase + "SP.Runtime.js",
            //    function () {
            //        $.getScript(scriptbase + "SP.js",
            //            function () {
            //                $.getScript(scriptbase + "SP.RequestExecutor.js",
            //                    function () {
            //                        $scope.spHostWebUrl = $utilservice.spHostUrl();
            //                        $scope.spAppWebUrl = $utilservice.spAppWebUrl();
            //                        $scope.getCurrentUser();
            //                    }
            //                );
            //            }
            //        );
            //    }
            //);

            //getAppSettings();
            initModal();
            //getBusinessMetadata();
            //getTemplates();

            var promises = [];
            common.activateController(promises, controllerId)
                .then(function () {
                    log('Activated Dashboard View');
                    log('Retrieving request history from source');
                });
        }

        $scope.cancel = function () {
            //alert($scope.hostUrl);
            //window.location = $scope.spHostWebUrl;
            window.close();
        };

        function loadSpinners() {
            $scope.spinnerService.showGroup('requests');
        }

        function initModal() {

            // Set event handler to open the modal dialog window
            $scope.open = function () {

                // Set modal configuration options
                var modalInstance = $modal.open({
                    scope: $scope,
                    templateUrl: '/Pages/mdlz/Wizard.modal.html',
                    controller: 'WizardModalInstanceController',
                    size: 'lg',
                    windowClass: 'modal-pnp',
                    keyboard: false,
                    backdrop: 'static'
                });

                // Process the data returned from the modal after it is successfuly completed
                modalInstance.result.then(function (configuration) {
                    $scope.completedConfiguration = configuration;
                    //getRequestsByOwner(user);
                    logSuccess("Request Saved!! <br>You will receive an email notification once we have created your site.", null, true);
                }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                    //getRequestsByOwner(user);
                });
            };
        }

        $scope.getCurrentUser = function () {
            var isSPOD = (typeof O365 === "undefined");
            var odataType = isSPOD ? "verbose" : "nometadata";
            var executor = new SP.RequestExecutor($scope.spAppWebUrl);
            executor.executeAsync(
                {
                    url: $scope.spAppWebUrl + "/_api/SP.AppContextSite(@t)/web/currentUser?$select=email,loginname,title&@t='" + $scope.spHostWebUrl + "'",
                    method: "GET",
                    headers:
                    {
                        "Accept": "application/json;odata=" + odataType
                    },
                    success: function (data) {
                        var jsonResults = JSON.parse(data.body);
                        jsonResults = isSPOD ? jsonResults.d : jsonResults;
                        $log.info('Current user email: ' + jsonResults.Email);
                        user.name = jsonResults.Email;
                        $scope.spUser = jsonResults;
                        //getRequestsByOwner(user);                          
                        incrementProgBar();
                        $scope.$apply();
                    },
                    error: function () { alert("We are having problems retrieving specific information from the server. Please try again later"); }
                }
            );
        }

        function getRequestsByOwner(request) {
            $scope.loading = true;
            if (request.name == 'undefined' || request.name == "") {
                log('Attempting to retrieve user data...');
                $scope.getCurrentUser();
            }
            else {
                $.when($SharePointProvisioningService.getSiteRequestsByOwners(request)).done(function (data) {
                    if (data != null) {
                        vm.existingRequests = data;
                        $scope.spinnerService.hideGroup('requests');
                        logSuccess('Retrieved user request history');
                        $scope.loading = false;
                    }
                }).fail(function (err) {
                    console.info(JSON.stringify(err));
                    $scope.loading = false;
                });
            }
        }

        function getAppSettings() {

            // Use the app settings factory to retrieve app settings data
            AppSettings.getAppSettings().then(function (settingsdata) {

                // Store settings data 
                $scope.appSettings = settingsdata;

                // Set MdlzSiteCategories
                for (var i = 0; i < $scope.appSettings.length; i++) {
                    var setting = $scope.appSettings[i]
                    switch (setting.Key) {
                        case 'MdlzSiteCategories':
                            $scope.MdlzSiteCategories = setting.Value.split(';');
                            $scope.SelectedMdlzSiteCategory = $scope.MdlzSiteCategories[0];
                            break;
                    }

                }

                incrementProgBar();

            });


        }

        $scope.OpenMyRequestsModal = function () {
            getRequestsByOwner({ name: $scope.spUser.Email });
            $scope.miExistingRequests = $modal.open({
                scope: $scope,
                templateUrl: '/Pages/mdlz/modal_myrequests.html',
                //controller: 'WizardModalInstanceController',
                size: 'lg',
                windowClass: 'modal-pnp',
                keyboard: false,
                backdrop: 'static'
            });
        }

        $scope.cancelExistingRequests = function () {
            $scope.miExistingRequests.dismiss('cancel');
            $scope.spinnerService._unregisterAll();
        };

        $scope.fnFilterPendingRequests = function (item) {
            return item.requestStatus == "New" || item.requestStatus == "Approved" || item.requestStatus == "Processing";
        }

        $scope.isDataLoading = function () {
            return !($scope.spUser != null && $scope.regions != null && $scope.functions != null && $scope.templates != null && $scope.languages != null && $scope.timezones != null);
        }

        function getTemplates() {
            //get the site templates
            $.when($SharePointProvisioningService.getSiteTemplates($scope)).done(function (data, status) {
                if (data != null) {
                    // Store returned templates 
                    $scope.templates = data;
                    incrementProgBar();
                }
            }).fail(function (err) {
                console.info(JSON.stringify(err));
            });
        }

        function getBusinessMetadata() {

            // Use the metadata factory to retrieve a list of regions
            BusinessMetadata.getRegions().then(function (regionsdata) {

                // Store region data 
                $scope.regions = regionsdata;
                incrementProgBar();
            });

            // Use the metadata factory to retrieve a list of functions
            BusinessMetadata.getFunctions().then(function (functionsdata) {

                // Store functions data 
                $scope.functions = functionsdata;
                incrementProgBar();
            });

            // Use the metadata factory to retrieve a list of divisions
            //BusinessMetadata.getDivisions().then(function (divisionsdata) {

            //    // Store divisions data 
            //    $scope.divisions = divisionsdata;
            //});

            // Use the metadata factory to retrieve a list of languages
            BusinessMetadata.getLanguages().then(function (languagesdata) {

                // Store langauges data 
                $scope.languages = languagesdata;
                incrementProgBar();
            });

            // Use the metadata factory to retrieve a list of timezones
            BusinessMetadata.getTimeZones().then(function (timezonesdata) {

                // Store time zones data 
                $scope.timezones = timezonesdata;
                incrementProgBar();
            });

            // Use the metadata factory to retrieve a list of site classifications
            //BusinessMetadata.getSiteClassifications().then(function (classificationdata) {

            //    // Store site classification data 
            //    $scope.siteclassifications = classificationdata;
            //});
        }

        function incrementProgBar() {
            completedLoadRequests++;
            var x = completedLoadRequests / totalRequests * 100;

            $scope.ProgressBar = x >= 100 ? 100 : x;

        }

        function getInitialData($scope) {
            user.name = initialData.User.Email;
            $scope.spUser = initialData.User;

            $scope.regions = initialData.Data.BusinessMetadata.Regions;
            $scope.functions = initialData.Data.BusinessMetadata.Functions;
            $scope.languages = initialData.Data.BusinessMetadata.Languages;
            $scope.timezones = initialData.Data.BusinessMetadata.TimeZones;
            $scope.templates = templatesData;
            $scope.appSettings = initialData.Data.AppSettings;

            // Set MdlzSiteCategories
            for (var i = 0; i < $scope.appSettings.length; i++) {
                var setting = $scope.appSettings[i]
                switch (setting.Key) {
                    case 'MdlzSiteCategories':
                        $scope.MdlzSiteCategories = JSON.parse(setting.Value).filter(x => !x.IsBetaOnly || initialData.User.IsBetaUser);
                        $scope.SelectedMdlzSiteCategory = $scope.MdlzSiteCategories[0];
                        break;
                }

            }

            completedLoadRequests = totalRequests;
            $scope.ProgressBar = 100;
            $scope.loading = false;
        }

    }
})();