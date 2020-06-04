/*
 * CLARK 2014
 * SP O365
 *
 * v1.1
 * v1.2 - added in timer for search results -- added in people search url 8/22/2014
 * V1.3 - added code to keep the user profile data in session storage to reduce the number of API calls
 *        strengthen userProfile not available algorithm
 * V1.4 - updated init function to remove timer
 * V1.5 - updated loader
 *
 * simpler way to get the extended user information and start the tracking
 * when the user info it available
 *  note
 * We've tried to use the method in http://msdn.microsoft.com/en-us/library/office/jj920104(v=office.15).aspx
 * but the SP.UserProfile.js is not being loaded on all the pages
 * So we are using the API that is guaranteed to be available on all pages
 *
 * This plug-in requires the webtrends standard tag -- do not use the min tag
 *
 * lOAD EXAMPLE
 sp_O365: {
 src: window.wt_sp_globals.url + "/Lists/WebtrendsAssets/sp_O365_Plugin.js",
 async:false,
 DivList: ".*",
 rightClick:true,
 download:true}
 *
 */
(function () {

    wt_O365 = {
        TrackDivs: "",
        SearchSent: false,
        doWork: function (dcs, options) {
            // JC - added to send search results on search page load
            // O365 SP2013 search results
            dcs.addTransform(function (dcs, options) {
                if ((~location.pathname.toUpperCase().indexOf('/SEARCH') || ~location.pathname.toUpperCase().indexOf('/OSSSEARCH') || ~location.pathname.toUpperCase().indexOf('/PEOPLERESULTS') )
                    && Webtrends.getQryParams(location.search)['k']
                    && !wt_O365.SearchSent) {
                    // the search results are dynamically inserted into the page, wait until the results are ready
                    wtsTid = setTimeout(function () {
                        var resultCount = null;
                        try {
                            r = document.querySelectorAll('#ResultCount, #ResultsCount,#SRST')[0];
                            rString = r.innerText ? r.innerText : r.textContent;
                            if (~rString.toUpperCase().indexOf('ABOUT')) {
                                resultCount = rString.toUpperCase().match(/ABOUT ([0-9\,]+)/)[1].replace(',', '');
                            } else if (~rString.toUpperCase().indexOf('OF')) {
                                resultCount = rString.toUpperCase().match(/OF ([0-9\,]+)/)[1].replace(',', '');
                            } else if (~rString.toUpperCase().indexOf('RESULT')) {
                                resultCount = rString.toUpperCase().match(/([0-9\,]+)/)[1].replace(',', '');
                            }
                        } catch (e) {
                            resultCount = 0;
                        }
                        var searchTerm = Webtrends.getQryParams(location.search)['k'];
                        // query param can also be in a hash
                        if (location.hash && ~location.hash.indexOf('k=')) {
                            hashArr = location.hash.split('&');
                            for (var c = 0; c < hashArr.length; c++) {
                                if (typeof hashArr[c] != 'undefined' && ~hashArr[c].indexOf('k=')) {
                                    searchTerm = location.hash.split('=').pop()
                                }
                            }
                        }
                        Webtrends.multiTrack({argsa: [   'WT.oss', searchTerm,
                            "WT.oss_r", resultCount.toString(),
                            "WT,ti", 'Search Results',
                            'WT.dl', '99'
                        ],
                            finish: function (d, o) {
                                d.WT.oss_r = '';
                                d.WT.oss = '';
                            }})
                    }, 2000);
                    wt_O365.SearchSent = true;
                }
                // this has to be on all instead of collect because we are not using .track()
                // we are using multitrack for the first hit
            }, "all");
            //
            // this is for inner results (re-search) activities
            // some sites don't reload the search page, they dynamically update the markup
            //
            dcs.addSelector('A', {
                filter: function (dcsObject, o) {
                    var el = o['element'] || {};
                    if (~el.id.indexOf('_SearchLink') && wt_O365.SearchSent) {
                        // inner page search wait for the results
                        wtsTid = setTimeout(function () {
                            var resultCount = null;
                            try {
                                r = document.querySelectorAll('#ResultCount, #ResultsCount,#SRST')[0];
                                rString = r.innerText ? r.innerText : r.textContent;
                                if (~rString.toUpperCase().indexOf('ABOUT')) {
                                    resultCount = rString.toUpperCase().match(/ABOUT ([0-9\,]+)/)[1].replace(',', '');
                                } else if (~rString.toUpperCase().indexOf('OF')) {
                                    resultCount = rString.toUpperCase().match(/OF ([0-9\,]+)/)[1].replace(',', '');
                                } else if (~rString.toUpperCase().indexOf('RESULT')) {
                                    resultCount = rString.toUpperCase().match(/([0-9\,]+)/)[1].replace(',', '');
                                }
                            } catch (e) {
                                resultCount = 0;
                            }
                            var searchTerm = Webtrends.getQryParams(location.search)['k'];
                            // query param can also be in a hash
                            if (location.hash && ~location.hash.indexOf('k=')) {
                                hashArr = location.hash.split('&');
                                for (var c = 0; c < hashArr.length; c++) {
                                    if (typeof hashArr[c] != 'undefined' && ~hashArr[c].indexOf('k=')) {
                                        searchTerm = location.hash.split('=').pop()
                                    }
                                }
                            }
                            Webtrends.multiTrack({argsa: [   'WT.oss', searchTerm,
                                "WT.oss_r", resultCount.toString(),
                                "WT,ti", 'Search Results',
                                'WT.dl', '99'
                            ],
                                finish: function (d, o) {
                                    d.WT.oss_r = '';
                                    d.WT.oss = '';
                                }})
                        }, 2000)

                    }
                    return true
                },
                transform: function (dcsObject, o) {
                }
            });
            // upload picture tracker
            dcs.addSelector('*', {
                actionElems: { 'INPUT': 1 },
                filter: function (dcsObject, o) {
                    return !~o.element.id.indexOf('ChoosePicture');
                },
                transform: function (dcsObject, o) {
                    o.argsa.push('WT.ti', 'Click: Picture Upload');
                    o.argsa.push('WT.dl', 'SHP_CLICK');
                }
            });
            dcs.addTransform(function (d, o) {
                if (document.title == '') o.argsa.push("WT.ti", "No Page Title Defined");
            }, "all");
            if (typeof options["rightClick"] != 'undefined' && options["rightClick"]) {
                dcs.addSelector('a', {
                    filter: function (dcsObject, o) {
                        var evt = o['event'] || {};
                        return !dcsObject._isRightClick(evt);
                    },
                    transform: function (dcsObject, o) {
                        var e = o['event'] || {};
                        var el = o['element'] || {};
                        dcsObject._autoEvtSetup(o);
                        var res = dcsObject.getURIArrFromEvent(el);
                        var ttl = dcsObject.getTTL(e, el, res.dcsuri);
                        o['argsa'].push(
                            "DCS.dcssip", res.dcssip,
                            "DCS.dcsuri", res.dcsuri,
                            "DCS.dcsqry", res.dcsqry,
                            "DCS.dcsref", res.dcsref,
                            "WT.ti", "RightClick:" + ttl,
                            "WT.nv", dcsObject.dcsNavigation(e, dcsObject.navigationtag),
                            "WT.dl", 'SHP_CLICK');
                    },
                    finish: function (dcsObject, o) {
                        dcsObject._autoEvtCleanup();
                    },
                    callback: function (e, f) {
                        preserve.validataImg(e, this.argsa);
                    }
                });
            }
            //
            // SharePoint download link handler
            //
            if (typeof options["download"] != 'undefined' && options["download"]) {
                dcs.addSelector('a', {
                    filter: function (dcsObject, o) {
                        var e = o['element'] || {};
                        var evt = o['event'] || {};
                        return !(dcsObject.dcsTypeMatch(e.pathname, dcsObject._downloadtypes) && !dcsObject._isRightClick(evt));
                    },
                    transform: function (dcsObject, o) {
                        var e = o['event'] || {};
                        var el = o['element'] || {};
                        dcsObject._autoEvtSetup(o);
                        var res = dcsObject.getURIArrFromEvent(el);
                        var ttl = dcsObject.getTTL(e, el, res.dcsuri);
                        o['argsa'].push(
                            "DCS.dcssip", res.dcssip,
                            "DCS.dcsuri", res.dcsuri,
                            "DCS.dcsqry", res.dcsqry,
                            "DCS.dcsref", res.dcsref,
                            "WT.ti", "Download:" + ttl,
                            "WT.nv", dcsObject.dcsNavigation(e, dcsObject.navigationtag),
                            "WT.dl", "SHP",
                            "WT.shp_doc_a", "DC",
                            "WT.shp_doc", ttl);
                    },
                    finish: function (dcsObject, o) {
                        dcsObject._autoEvtCleanup();
                    },
                    callback: function (e, f) {
                        preserve.validataImg(e, this.argsa);
                    }
                });
            }
            //
            // get the collection title
            // this is used as the site name in the reports
            // query from SP2013/O365 developer reference guide
            try {
                wtAjax({
                    url: _spPageContextInfo.siteAbsoluteUrl + "/_api/web?$select=Title,Id,Url,Description",
                    type: "GET",
                    async: false,
                    cache: false,
                    timeout: 5000,
                    headers: {accept: "application/json;odata=verbose", "content-type": "application/json;odata=verbose"},
                    success: function (g) {
                        window.wt_sp_globals.title = g.d.Title;
                    }, error: function (i, g, h) {
                        window.wt_sp_globals.title = "Not Set"
                    }});
            } catch (e) {
                window.wt_sp_globals.title = "Not Set"
            }
            //
            // webpart click tracking
            //
            dcs.addSelector("*", {actionElems: {A: 1, BUTTON: 1, INPUT: 1, SPAN: 1}, filter: function (c, g) {
                var d = g.event || {};
                var f = g.element || {};
                return false
            }, transform: function (c, i) {
                var d = i.event || {};
                var f = i.element || {};
                var h = f.parentNode;
                var j = wt_O365.webPartName(f, {SPAN: 1, TD: 1});
                var g = '';
                if (f.childNodes.length == 0) g = f.innerText || f.textContent;
                if (g == "") {
                    g = f.title
                }
                if (g == "" && f.firstChild && typeof f.firstChild.title != 'undefined') {
                    g = f.firstChild.title
                }
                if (g != "") {
                    g = g.replace(/[^\x20-\x80]+/g, "").replace(/^\s+|\s+$/g, "")
                }
                if (g.nodeName == "INPUT") {
                    g = f.value
                }
                if (g == "") {
                    return;
                }
                var searchTerm = Webtrends.getQryParams(location.search)['k'];
                // query param can also be in a hash
                if (location.hash && ~location.hash.indexOf('k=')) {
                    hashArr = location.hash.split('&');
                    for (var c = 0; c < hashArr.length; c++) {
                        if (typeof hashArr[c] != 'undefined' && ~hashArr[c].indexOf('k=')) {
                            searchTerm = location.hash.split('=').pop()
                        }
                    }
                }

                if (searchTerm && searchTerm.length > 0) i.argsa.push("WT.oss", searchTerm);
                c._autoEvtSetup(i);
                i.argsa.push("WT.shp_wpv", j, "WT.ti", 'Click: ' + g, "WT.nv", c.dcsNavigation(d, c.navigationtag), "WT.dl", "SHP_CLICK")
            }, finish: function (c, e) {
                c.WT.shp_wpv = c.WT.nv = '';
                c.WT.ti = document.title;
            }});
        },
        tags: [],

        webPartName: function (el, nodeTypes) {
            // webpart click data
            try {
                var node = el.parentNode;
                var wpTitle = '';
                wpNamNode = [];
                while (node && wpTitle == '') {
                    for (n in nodeTypes) {
//                       wpNamNode = node.querySelectorAll('.ms-webpart-titleText span');
                        wpNamNode = node.querySelectorAll('.js-webpart-titleCell');
                        if (wpNamNode.length > 0) break;
                    }
                    if (wpNamNode.length > 0) {
                        //                       wpTitle = wpNamNode[0].textContent.replace(/[^\x20-\x80]+/g, "").replace(/^\s+|\s+$/g, "") || wpNamNode[0].innerText.replace(/[^\x20-\x80]+/g, "").replace(/^\s+|\s+$/g, "");
                        wpTitle = wpNamNode[0].title;

                    }
                    node = node.parentNode;
                }
                return wpTitle;
            } catch (e) {
                return ''
            }

            try {
                var node = el.parentNode;
                var wpTitle = '';
                wpNamNode = [];
                while (node && wpTitle == '') {
                    for (n in nodeTypes) {
                        wpNamNode = node.querySelectorAll(n + '[id^="WebPartTitle"]');
                        if (wpNamNode.length > 0) break;
                    }
                    if (wpNamNode.length > 0) {
                        wpTitle = wpNamNode[0].getAttribute("title");
                    }
                    node = node.parentNode;
                }
                return wpTitle;
            } catch (e) {
                return ''
            }
        }
    }
})();
//
// we could use ExecuteOrDelayScriptUntilLoaded - but often it not instantiated
// when the tag starts.  So poll until sp has been instantiated
// this will hold up the tag from doing a collect until we return from this function

// worse case -- if jQuery fails to load trap for it
wtTidFallback = setTimeout(function () {
    // we should never get here
    wt_SP_O345_Init();
}, 3000);
/*
wtTid = setInterval(function () {
    if (typeof _spBodyOnLoadWrapper != 'undefined' && typeof _spPageContextInfo != 'undefined' && typeof ExecuteOrDelayUntilScriptLoaded != 'undefined') {
        ExecuteOrDelayUntilScriptLoaded(window.wt_SP_O345_Init, "sp.js");
        //
        // SP Chrome Bug Workaround
        //
        //       if (typeof _spBodyOnloadCalled === 'undefined' || _spBodyOnLoadCalled) {
        //           wt_SP_O345_Init();
        //       } else {
        //           _spBodyOnLoadFunctionNames.push("window.wt_SP_O345_Init");
        //       }
        clearInterval(wtTid);
//        clearTimeout(wtTidFallback);
    }
}, 10);
*/
/*
 New version of the loader for SP2013
 */
// Function to load initial webtrends.js file after core.js has run
window.wtLoadAfterCore = function () {
    if (typeof SP !== "undefined" && typeof SP.SOD !== "undefined" && typeof SP.SOD.executeFunc !== "undefined" && typeof _spPageContextInfo !== "undefined") {
        setTimeout(function () {
            SP.SOD.executeFunc("core.js", "$_global_core", function () {
                wt_SP_O345_Init();
            });
        }, 1000);
    }
    else {
        setTimeout(window.wt_sp_globals.wtLoadAfterCore, 200);
    }
};

// Run Load function
window.wtLoadAfterCore();


function wt_SP_O345_Init() {
    try {
//        clearInterval(wtTid);
        clearTimeout(wtTidFallback);
    }catch(ignore){}

    // set up the defaults
    // in case the userProfile call fails for some reason

    window.wt_sp_user = [];
    // user identifiable data we want to mask
    window.wt_sp_user['WT.shp_uname'] = "Not Available";
    window.wt_sp_user['WT.shp_login'] = "Not Available";
    window.wt_sp_user['WT.ng_username'] = "Not Available";
    window.wt_sp_user['WT.ng_useraccountname'] = "Not Available";
    //
    // this method is derived from the SP2013/O365 MSDN developers guide
    //
    try {
        // if we already have the user profile data don't ping the API a second time
        if (typeof JSON != 'undefined' && typeof JSON.parse != 'undefined' && getSessionData(Webtrends) != null && getSessionData(Webtrends) != 'null' && JSON.parse(getSessionData(Webtrends)).length > 0) {
            window.wt_sp_user = JSON.parse(getSessionData(Webtrends));
            Webtrends.registerPlugin("sp_O365", function (dsc, options) {
                wt_O365.doWork(dsc, options)
            });
        } else {
            wtAjax({
                type: 'GET',
                url: _spPageContextInfo.siteAbsoluteUrl + "/_api/SP.UserProfiles.PeopleManager/GetMyProperties",
                headers: { Accept: "application/json;odata=verbose" },
                success: function (data) {

                    if (typeof window.wt_sp_user == 'undefined') window.wt_sp_user = {};
                    /*
                     Domain WT.shp_domain
                     Location WT.shp_location
                     Manager Name WT.shp_mgr
                     Department WT.shp_dept
                     Job Title WT.shp_title
                     Office Location WT.shp_office
                     Login Name WT.shp_login
                     */
                    var wtData = {
                        'SPS-Department': "WT.shp_dept",
                        Manager: "WT.shp_mgr",
                        PreferredName: "WT.shp_uname",
                        Office: "WT.shp_office",
                        AccountName: "WT.shp_login",
                        'SPS-JobTitle': "WT.shp_title",
                        Location: "WT.shp_location",
                        Function: "WT.shp_function"
                    };

                    if (Webtrends.plugins.sp_O365['userProfile']) {
                        for (var p in Webtrends.plugins.sp_O365['userProfile']) {
                            if (!~p.indexOf("WT.")) {
                                // if the parameter is already defined - remove it from the array
                                for (var q in wtData) {
                                    if (wtData[q] == Webtrends.plugins.sp_O365['userProfile'][p]) {
                                        delete wtData[q];
                                    }
                                }
                                wtData[p] = Webtrends.plugins.sp_O365['userProfile'][p];
                            }
                        }
                    }

                    var g = data.d.UserProfileProperties.results;
                    // move the user profile data into a simple array
                    // its easier to deal with this way and saves
                    // iterating through it multiple times
                    var userProfileDat = [];
                    for (var c = 0; c < g.length; c++) {
                        if (g[c].Value && g[c].Value != '') userProfileDat[g[c].Key] = g[c].Value
                    }


                    for (var k in wtData) {
                        if (typeof userProfileDat[k] != 'undefined') {
                            wt_sp_user[wtData[k]] = userProfileDat[k];
                            if (wt_sp_user[wtData[k]]
                                && wt_sp_user[wtData[k]].split('|').length > 0) {
                                wt_sp_user[wtData[k]] = wt_sp_user[wtData[k]].split("|").pop();
                            }
                        }
                    }

                    // reverse mapping cases
                    if (Webtrends.plugins.sp_O365['userProfile']) {
                        for (var p in Webtrends.plugins.sp_O365['userProfile']) {
                            if (~p.indexOf("WT.")) {
                                // if the parameter is already defined - remove it from the array
                                if (userProfileDat[Webtrends.plugins.sp_O365['userProfile'][p]] != undefined)
                                    wt_sp_user[p] = userProfileDat[Webtrends.plugins.sp_O365['userProfile'][p]];
                                else wt_sp_user[p] = "";
                            }
                        }
                    }
                    // store the user profile data in session storage
                    if (typeof JSON != 'undefined' && typeof JSON.stringify != 'undefined') {
                        storeSessionData(Webtrends, JSON.stringify(wt_sp_user));
                    }
                    Webtrends.registerPlugin("sp_O365", function (dsc, options) {
                        wt_O365.doWork(dsc, options)
                    });
                },
                error: function (xhr, textStatus, errorThrown) {
                    Webtrends.registerPlugin("sp_O365", function (dsc, options) {
                        wt_O365.doWork(dsc, options)
                    });
                    Webtrends.multiTrack({argsa: ["WT.shp_err", errorThrown]});
                }
            });
        }
    } catch (e) {
        Webtrends.registerPlugin("sp_O365", function (dsc, options) {
            wt_O365.doWork(dsc, options)
        });
        Webtrends.multiTrack({argsa: ["WT.shp_err", e.message]});

    }
}

//
// since not all sites (SP2013) have jQuery do a simple xmlhttp request
//
function wtAjax(func) {
    var oReq = new XMLHttpRequest();

    oReq.open(func.type, func.url, true);
    if (func.headers) {
        for (var h in func.headers) {
            oReq.setRequestHeader(h, func.headers[h]);
        }
    }
    oReq.setRequestHeader('Accept', 'application/json;odata=verbose');

    oReq.onreadystatechange = function () {
        if (oReq.readyState == 4) {
            if (oReq.status == 200) {
                if (typeof $ != 'undefined' && typeof $.parseJSON != 'undefined') func.success($.parseJSON(oReq.responseText));
                else func.success(JSON.parse(oReq.responseText));
            } else func.error('', '', "XML Request status" + oReq.status)
        }
    };
    oReq.send();
}

// a little glue to add in querySelectorAll into browsers that don't natively support it
// like IE6 & 7

if (!document.querySelectorAll) {
    // IE7 support for querySelectorAll. Supports multiple / grouped selectors and the attribute selector with a "for" attribute. http://www.codecouch.com/
    (function (d, s) {
        d = document, s = d.createStyleSheet();
        d.querySelectorAll = function (r, c, i, j, a) {
            a = d.all, c = [], r = r.replace(/\[for\b/gi, '[htmlFor').split(',');
            for (i = r.length; i--;) {
                s.addRule(r[i], 'k:v', 0);
                for (j = a.length; j--;) a[j].currentStyle.k && c.push(a[j]);
                s.removeRule(0);
            }
            return c;
        }
    })()
}

//  Get the user profile data from sessionStorage or cookie
getSessionData = function (dcsObject) {
    if (sessionStorage && sessionStorage['userProfileInfo']) {
        data = sessionStorage['userProfileInfo'];
    } else {
        data = decodeURI(dcsObject.dcsGetCookie('userProfileInfo'));
    }
    return data;
};
// store the data into sessionStorage or cookie
storeSessionData = function (dcsObject, data) {
    if (sessionStorage) {
        sessionStorage['userProfileInfo'] = data;
    } else {
        document.cookie = 'userProfileInfo=' + encodeURI(data) + "; path=/";
    }
};

