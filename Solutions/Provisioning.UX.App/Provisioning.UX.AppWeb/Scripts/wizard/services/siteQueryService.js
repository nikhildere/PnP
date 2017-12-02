(function () {
    'use strict';

    angular
        .module('app.wizard')
        .service('$SharePointJSOMService', function ($q, $http) {
            this.checkUrlREST = function (request) {
                //var deferred = $.Deferred();                



                //var executor = new SP.RequestExecutor($scope.spAppWebUrl);
                //executor.executeAsync({
                //    url: $scope.spAppWebUrl + "/_api/SP.AppContextSite(@target)/web/url" + "?@target='" + $scope.siteConfiguration.spNewSitePrefix + value + "'",
                //    method: "GET",
                //    headers: { "Accept": "application/json; odata=verbose" },                    
                //    success: function (data, textStatus, xhr) {                       

                //        deferred.resolve(data);
                //    },
                //    error: function (xhr, textStatus, errorThrown) {
                //        deferred.reject(JSON.stringify(xhr));
                //    }
                //});
                //return deferred;

                var deferred = $.Deferred();
                var formData = JSON.stringify(request);
                $http({
                    method: 'POST',
                    data: "=" + formData,
                    url: '/api/provisioning/doesSiteExists',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }).success(function (data, status, headers, config) {
                    deferred.resolve(data);
                    console.log("api/provisioning/checkUrlREST result is " + data);
                }).error(function (data, status) {
                    deferred.reject(data);
                    console.log("api/provisioning/checkUrlREST " + data);
                });
                return deferred;

            };

            this.GetPeoplePickerSearchEntities = function (searchTerm)
            {
                var deferred = $.Deferred();
                var formData = searchTerm;
                $http({
                    method: 'POST',
                    data: "=" + formData,
                    url: '/api/provisioning/getPeoplePickerSearchEntities',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }).success(function (data, status, headers, config) {
                    deferred.resolve(data);
                    console.log("api/provisioning/GetPeoplePickerSearchEntities result is " + data);
                }).error(function (data, status) {
                    deferred.reject(data);
                    console.log("api/provisioning/GetPeoplePickerSearchEntities " + data);
                });
                return deferred;
            }


           
        });
})();
    
