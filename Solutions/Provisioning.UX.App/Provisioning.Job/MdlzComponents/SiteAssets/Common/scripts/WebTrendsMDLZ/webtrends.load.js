/*
 Copyright (c) 2013 Webtrends, Inc.
 SharePoint 2013 Loader v3.0.50
 */
window.wt_sp_globals = window.wt_sp_globals ? window.wt_sp_globals : {}
window.wt_sp_globals.loadCount = 0;


window.webtrendsAsyncInit = function () {

    var dcs = new Webtrends.dcs().init({
        dcsid: "dcs222cyw0653er4n55az3al0_1v1k",
        timezone: -6,
        i18n: false,
        onsitedoms:new RegExp("kraft.com|mdlz.com"),
        downloadtypes:"xls,doc,pdf,txt,csv,zip,docx,xlsx,rar,gzip",
        plugins: {
            sp: { src: "/SiteAssets/vNext/Common/scripts/WebTrendsMDLZ/webtrends.sp.js" },
            mondelez_custom: { src: "/SiteAssets/vNext/Common/scripts/WebTrendsMDLZ/Mondelez_Customs.js" },
            Preserve: { src: "/SiteAssets/vNext/Common/scripts/WebTrendsMDLZ/Preserve.js" },
            hm: {
                src: "//s.webtrends.com/js/webtrends.hm.js",
                transform: function (dcs, options) {
                    //args has already been merged into argsa so we need to modify that
                    if (!options.argsa) options.argsa = [];
                    var pageInfo = parsePageInfo();
                    for (var key in pageInfo)
                        if (pageInfo.hasOwnProperty(key))
                            options.argsa.push(key, pageInfo[key]);
                }
            },
            sp_O365: {
                src: "/SiteAssets/vNext/Common/scripts/WebTrendsMDLZ/sp_O365_Plugin.js",
                async:false,
                DivList: ".*",
                rightClick:true,
                download:true,
                userProfile:{
                    BuildingName:"WT.shp_buildingname",
                    Level1GlobalOrganization:"WT.shp_Level1Org",
                    Level2SubOrganization:"WT.shp_Level2Org",
                    Function:"WT.shp_function",
                    // user identifiable daa we want to mask
                    'WT.shp_uname':'UserProfile_GUID',
                    'WT.shp_mgr': "DO NOT SEND",
                    'WT.shp_login': "UserProfile_GUID",
                    'WT.ng_username':"UserProfile_GUID",
                    'WT.ng_useraccountname':"UserProfile_GUID"
                }
            }

        }
    });

    //MDS appears to be wiping out the reference to Webtrends.
    //Store it off here and restore it later
    window.wt_sp_globals.Webtrends = Webtrends;
    window.wt_sp_globals.loadCount++;

    trackIfReady();
};

//MDS is not enabled or we are using our feature - webtrends.load.js will get reloaded every page transition (real or simulated)
if (window.location.href.indexOf("start.aspx") < 0 || window.wt_sp_globals.method == "feature") {
    loadScript();
    window.wt_sp_globals.loadCount++;
}
//Manual install and MDS is enabled - we will not get reloaded so we need to detect simulated page transitions
//This file is loaded asynchronously, pageLoaded may have already occurred
else {
    asyncDeltaManager.add_pageLoaded(function () {
        if (window.wt_sp_globals.Webtrends) {
            resetScript();
        }
        else {
            loadScript();
        }
        window.wt_sp_globals.loadCount++;
        trackIfReady();
    });
}

function trackIfReady() {

    //This ensures that the script has loaded and that the page has finished loading so everything is available
    if (window.wt_sp_globals.loadCount >= 2) {

        if (window.wt_sp_globals.pluginObj)
            window.wt_sp_globals.pluginObj.addSearchResultListener();

        Webtrends.addTransform(function (dcs, options) {
            //args has already been merged into argsa so we need to modify that
            if (!options.argsa) options.argsa = [];
            var pageInfo = parsePageInfo();
            for (var key in pageInfo)
                if (pageInfo.hasOwnProperty(key))
                    options.argsa.push(key, pageInfo[key]);
        }, "all");

        Webtrends.multiTrack({
        });
    }
}

//With MDS enabled, URLs will take the following format:
//<site collection>/_layouts/15/start.aspx#<url to content>
//In this scenario we need to rebuild the URL parameters that we send
function parsePageInfo() {

    //MDS is not enabled, no need for any special processing
    if (window.location.href.indexOf("start.aspx") == -1) {
        return {};
    }

    var path = window.location.pathname;
    var qry = window.location.search;
    var hash = window.location.hash;

    var a = document.createElement("a");
    a.href = hash.substring(1);

    var apath = a.pathname;
    var aqry = a.search
    var ahash = a.hash;

    //Add the path portion of the anchor to the main path
    var dcsuri = path + ((apath) ? ("#" + apath) : "");

    //Add the anchor's query string to the main query string    
    var dcsqry = qry.concat(
        (aqry ? (qry ? ("&" + aqry.substr(1)) : aqry) : "")
    );

    return {
        "DCS.dcssip": location.hostname,
        "DCS.dcsuri": dcsuri,
        "DCS.dcsqry": dcsqry,
        "WT.ti": document.title,
        "WT.es": location.hostname + dcsuri
    };
}

function loadScript() {
    // wait until _spPageContextInfo.siteAbsoluteUrl is ready
    tid = setInterval(function () {
        if (typeof _spPageContextInfo != 'undefined') {
            clearInterval(tid);
            window.wt_sp_globals.url = _spPageContextInfo.siteAbsoluteUrl;
            (function () {
                var s = document.createElement("script");
                s.async = true;
                s.src = "/SiteAssets/vNext/Common/scripts/WebTrendsMDLZ/webtrends.js";
                var s2 = document.getElementsByTagName("script")[0];
                s2.parentNode.insertBefore(s, s2);
            })();
        }
    }, 10);
}

//Simulated page transitions with MDS wipes out some functionality from the already
//loaded base tag. Using our MDS compatible feature, our script is being reloaded each
//time so everything is reset, but with the manual install we have to do it ourselves.
function resetScript() {

    //Restore reference to Webtrends
    window.Webtrends = window.wt_sp_globals.Webtrends;

    //Rebind to mouse events so heatmaps and selectors work
    var tmp = /MSIE (\d+)/.exec(navigator.userAgent);
    var ie = (tmp) ? tmp[1] : 99;
    Webtrends.addEventListener(document, (ie >= 8) ? "mousedown" : "mouseup", function (e) {
        if (!e) e = window.event;
        Webtrends.broadcastEvent("wtmouse", { 'event': e });
    });
}