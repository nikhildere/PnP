function SubO_ExecuteWhenJqueryReady(codeToExecute) {
    setTimeout(function () {
        if (window.jQuery) {
            codeToExecute();
        } else {
            SubO_ExecuteWhenJqueryReady(codeToExecute);
        }
    }, 300);
}
SubO_ExecuteWhenJqueryReady(function ()
{
    $(document).ready(function () {

        //Update create new site link point to our custom page.
        var link = document.getElementById('createnewsite');
        if (link != undefined) {
            var SubSiteSettings_Web_Url = (window.location.hostname.toLowerCase().startsWith('ndmdlz') ? 'https://localhost:44365' : 'https://createit.mdlzaddins.com') + '/pages/subsite/newsbweb.aspx?SPHostUrl='
            var url = SubSiteSettings_Web_Url + encodeURIComponent(_spPageContextInfo.webAbsoluteUrl);

            // Could be get from SPSite root web property bag - now hard coded for demo purposes
            link.href = url;
        }

        //Make list url clickable on list settings page
        if (window.location.pathname.toLowerCase().endsWith('listedit.aspx')) {
            var listEditUrlElem = $('td.ms-listeditheader > table#idItemHoverTable tr:nth-child(3) > td:last-child');
            if (listEditUrlElem && listEditUrlElem.length > 0) {
                var listEditUrl = listEditUrlElem.first().text().trim();
                if (listEditUrl.toLowerCase().startsWith('https://')) {
                    listEditUrlElem.html('<a href="' + listEditUrl + '">' + listEditUrl + '</a>');
                }
            }
        }
    });
});

(function () {
    if (window.location.pathname.toLowerCase().endsWith("newsbweb.aspx")) {
        var SubSiteSettings_Web_Url = (window.location.hostname.toLowerCase().startsWith('ndmdlz') ? 'https://localhost:44365' : 'https://createit.mdlzaddins.com') + '/pages/subsite/newsbweb.aspx?SPHostUrl='
        var url = SubSiteSettings_Web_Url + encodeURIComponent(_spPageContextInfo.webAbsoluteUrl);
        document.getElementsByTagName("body")[0].style.display = "none";
        window.location = url;
    }
})();