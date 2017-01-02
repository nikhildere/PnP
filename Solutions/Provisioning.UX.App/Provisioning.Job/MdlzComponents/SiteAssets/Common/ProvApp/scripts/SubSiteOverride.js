﻿// Register script for MDS if possible
// RegisterModuleInit("OverrideNewSubSiteLink.js", SubSiteOverride_Inject); //MDS registration

//if (document.readyState === "complete") {
//    //Already loaded!
//    SubSiteOverride_Inject(); //non MDS run
//}
//else {
//    //Add onload or DOMContentLoaded event listeners Mozilla, Opera and webkit nightlies currently support this event
//    if (document.addEventListener) {
//        // Use the handy event callback
//        document.addEventListener("DOMContentLoaded", function () { SubSiteOverride_Inject(); }, false);
//        // If IE event model is used
//    } else if (document.attachEvent) {
//        // ensure firing before onload,
//        // maybe late but safe also for iframes
//        document.attachEvent("onreadystatechange", function () { SubSiteOverride_Inject(); });
//    }
//}

//// Actual execution
//function SubSiteOverride_Inject() {

//    // Run injection only for site content
//    if ((window.location.href.toLowerCase().indexOf("viewlsts.aspx") > -1 && window.location.href.toLowerCase().indexOf("_layouts/15") > -1)) {
//        SubSiteOverride_OverrideLinkToAppUrl();
//    }
//}

//// Actual link override. Checking the right URL from root site collection of the tenant/web application
//function SubSiteOverride_OverrideLinkToAppUrl() {

//    //Update create new site link point to our custom page.
//    var link = document.getElementById('createnewsite');
//    var SubSiteSettings_Web_Url = 'https://localhost:44365' + '/pages/subsite/newsbweb.aspx?SPHostUrl='
//    var url = SubSiteSettings_Web_Url + encodeURIComponent(_spPageContextInfo.webAbsoluteUrl);
//    if (link != undefined) {
//        // Could be get from SPSite root web property bag - now hard coded for demo purposes
//        link.href = url;
//    }
//}

//if (typeof (Sys) != "undefined" && Boolean(Sys) && Boolean(Sys.Application)) {
//    Sys.Application.notifyScriptLoaded();
//}
//if (typeof (NotifyScriptLoadedAndExecuteWaitingJobs) == "function") {
//    NotifyScriptLoadedAndExecuteWaitingJobs("SubSiteOverride.js");
//}

//window.onload =
function mdlz_spo_handleSubsiteLink() {
    //Update create new site link point to our custom page.
    var SubSiteSettings_Web_Url = 'https://mdzusoktulsps11:2222' + '/pages/subsite/newsbweb.aspx?SPHostUrl='
    var url = SubSiteSettings_Web_Url + encodeURIComponent(_spPageContextInfo.webAbsoluteUrl);

    var link = document.getElementById('createnewsite');
    if (link != undefined) {
        // Could be get from SPSite root web property bag - now hard coded for demo purposes
        link.href = url;
    }

    if (window.location.pathname.toLowerCase().endsWith("newsbweb.aspx"))
    {
        window.location = SubSiteSettings_Web_Url;
    }
}
mdlz_spo_handleSubsiteLink();
