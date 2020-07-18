﻿(function () {
    //'use strict';

    var app = angular.module('app');

    app.directive('siteAvailabilityValidator', ['$http', '$SharePointJSOMService', function ($http, $SharePointJSOMService) {

        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {

                function setAsLoading(bool) {
                    ngModel.$setValidity('site-loading', !bool);
                    //scope.$apply();
                }

                function setAsAvailable(bool) {
                    ngModel.$setValidity('site-available', bool);
                    //scope.$apply();
                }

                ngModel.$parsers.push(function (value) {
                    if (!value || value.length == 0) return;  // removed this for custom url checks -> "|| !scope.allowCustomUrl"
                    setAsLoading(true);
                    setAsAvailable(false);
                    //scope.$apply();
                    var isTeamsTemplate = scope.siteConfiguration.template.rootTemplate == "TEAMS";

                    if (value === undefined)
                        return ''
                    //cleanInputValue = value.replace(/[^\w\s]/gi, '');
                    cleanInputValue = value.replace(/[^a-zA-Z0-9\s]/gi, '');
                    cleanInputValue = isTeamsTemplate ? cleanInputValue.replace(/\s+/g, ' ') : cleanInputValue.replace(/\s+/g, '');

                    if (cleanInputValue != value) {
                        ngModel.$setViewValue(cleanInputValue);
                        ngModel.$render();
                    }

                    setTimeout(function () {
                        var request = { tenantAdminUrl: scope.siteConfiguration.template.tenantAdminUrl, hostPath: scope.siteConfiguration.template.hostPath, rootTemplate: scope.siteConfiguration.template.rootTemplate, inputValue: cleanInputValue };
                        //scope.siteConfiguration.template.tenantAdminUrl
                        // use the SP service to query for the user's inputted site URL
                        $.when($SharePointJSOMService.checkUrlREST(request))
                            .done(function (data) {

                                // web service call was successful - site already exists
                                // double check its status code and set as unavailable
                                //if (data.statusCode == 200) {
                                //    console.log(data);
                                //    setAsLoading(false);
                                //    setAsAvailable(false);
                                //}

                                if (data.success) {
                                    console.log(data);
                                    setAsLoading(false);
                                    setAsAvailable(false);
                                }
                                else {
                                    setAsLoading(false);
                                    setAsAvailable(true);
                                    if (isTeamsTemplate)
                                        scope.siteConfiguration.details.url = data.siteUrl;
                                }
                            })
                            .fail(function (err) {

                                // web service call failed - site does not already exist
                                // set as a valid site
                                //setAsLoading(false);
                                //setAsAvailable(true);

                            });
                    }, 0);

                    return value;

                })
            }
        }
    }]);

    app.directive('siteTitleValidator', ['$http', '$SharePointJSOMService', function ($http, $SharePointJSOMService) {

        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {

                ngModel.$parsers.push(function (inputValue) {
                    if (inputValue === undefined)
                        return ''
                    cleanInputValue = inputValue.replace(/[^\w\s]/gi, '');

                    if (cleanInputValue != inputValue) {
                        ngModel.$setViewValue(cleanInputValue);
                        ngModel.$render();
                    }
                    return cleanInputValue;
                })
            }
        }
    }]);

    app.directive('specialCharsValidator', ['$http', '$SharePointJSOMService', function ($http, $SharePointJSOMService) {

        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {

                ngModel.$parsers.push(function (inputValue) {
                    if (inputValue === undefined)
                        return ''
                    cleanInputValue = inputValue.replace(/[^\w\s]/gi, '');

                    if (cleanInputValue != inputValue) {
                        ngModel.$setViewValue(cleanInputValue);
                        ngModel.$render();
                    }
                    return cleanInputValue;
                })
            }
        }
    }]);

    app.directive('ccSpinner', ['$window', function ($window) {
        // Description:
        //  Creates a new Spinner and sets its options
        // Usage:
        //  <div data-cc-spinner="vm.spinnerOptions"></div>
        var directive = {
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element, attrs) {
            scope.spinner = null;
            scope.$watch(attrs.ccSpinner, function (options) {
                if (scope.spinner) {
                    scope.spinner.stop();
                }
                scope.spinner = new $window.Spinner(options);
                scope.spinner.spin(element[0]);
            }, true);
        }
    }]);

})();