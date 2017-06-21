function SubO_ExecuteWhenJqueryReady(codeToExecute) {
    setTimeout(function () {
        if (window.jQuery) {
            codeToExecute();
        } else {
            SubO_ExecuteWhenJqueryReady();
        }
    }, 300);
}
SubO_ExecuteWhenJqueryReady(function ()
{
    $(document).ready(function () {

        //Update create new site link point to our custom page.

        var SubSiteSettings_Web_Url = (window.location.hostname.toLowerCase().startsWith('ppe') ? 'https://createitdev.mdlzaddins.com' : 'https://createit.mdlzaddins.com') + '/pages/subsite/newsbweb.aspx?SPHostUrl='
        var url = SubSiteSettings_Web_Url + encodeURIComponent(_spPageContextInfo.webAbsoluteUrl);

        var link = document.getElementById('createnewsite');
        if (link != undefined) {
            // Could be get from SPSite root web property bag - now hard coded for demo purposes
            link.href = url;
        }

        if (window.location.pathname.toLowerCase().endsWith("newsbweb.aspx")) {
            window.location = SubSiteSettings_Web_Url;
        }

        //Make list url clickable on list settings page
        if (window.location.pathname.toLowerCase().endsWith('listedit.aspx')) {
            var listEditUrlElem = $('td.ms-listeditheader > table#idItemHoverTable tr:nth-child(3) > td:last-child');
            if (listEditUrlElem) {
                var listEditUrl = listEditUrlElem.text().trim();
                if (listEditUrl.toLowerCase().startsWith('https://')) {
                    listEditUrlElem.html('<a href="' + listEditUrl + '">' + listEditUrl + '</a>');
                }
            }
        }
    });
});


