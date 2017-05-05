$(document).ready(function () {

    //Update create new site link point to our custom page.
    var SubSiteSettings_Web_Url = 'https://createitdev.mdlzaddins.com' + '/pages/subsite/newsbweb.aspx?SPHostUrl='
    var url = SubSiteSettings_Web_Url + encodeURIComponent(_spPageContextInfo.webAbsoluteUrl);

    var link = document.getElementById('createnewsite');
    if (link != undefined) {
        // Could be get from SPSite root web property bag - now hard coded for demo purposes
        link.href = url;
    }

    if (window.location.pathname.toLowerCase().endsWith("newsbweb.aspx")) {
        window.location = SubSiteSettings_Web_Url;
    }
});