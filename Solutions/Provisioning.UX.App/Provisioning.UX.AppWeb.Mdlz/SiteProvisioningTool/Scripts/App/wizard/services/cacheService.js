(function () {
    var app = angular.module('app.wizard');

    app.service("cacheService", function () {
        var appCachePropertyName = "CreateItCache";


        this.GetCachedObject = function (cachePropertyName, actionToGetValueIfNotCached, cachePeriodInMinutes, isStoreInSessionCache) {
            var deferred = $q.defer();

            var storage = isStoreInSessionCache ? sessionStorage : localStorage;

            var returnObj;
            if (storage[appCachePropertyName]) {
                var mainObj = JSON.parse(storage[appCachePropertyName]);
                var propObj = mainObj[cachePropertyName];

                if (propObj && propObj.SavedOn && (new Date() < new Date(propObj.SavedOn.getTime() + ((cachePeriodInMinutes || 1440) * 60000)))) {
                    returnObj = propObj.Data;
                    deferred.resolve(returnObj);
                }
            }
            else {
                storage[appCachePropertyName] = JSON.stringify({});
            }

            if (!returnObj) {
                var i_deferred = $q.defer();

                i_deferred.promise.then(function (response) {
                    var mainObj = JSON.parse(storage[appCachePropertyName]);
                    mainObj[cachePropertyName] = { SavedOn: new Date(), Data: response.data };
                    storage[appCachePropertyName] = JSON.stringify(mainObj);
                    deferred.resolve(mainObj);
                });

                actionToGetValueIfNotCached(i_deferred);
            }

            return deferred.promise;
        };

        this.RemoveCacheKey = function (cachePropertyName, isStoreInSessionCache)
        {
            var storage = isStoreInSessionCache ? sessionStorage : localStorage;
            var mainObj = JSON.parse(storage[appCachePropertyName]);
            mainObj[cachePropertyName] = null;
            storage[appCachePropertyName] = JSON.stringify(mainObj);
        }

        this.BurstAppCache = function (isStoreInSessionCache)
        {
            var storage = isStoreInSessionCache ? sessionStorage : localStorage;
            storage[appCachePropertyName] = null;
        }

    });
})();