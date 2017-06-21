$(document).ready(function(){

    $("#pageTitle").prepend("<a href='"+_spPageContextInfo.webAbsoluteUrl+"'><span class='mondoleze-team-site-title'>" + _spPageContextInfo.webTitle + "</span></a>");

    if ($('div[id*="TopNavigationMenu"] > ul > li > ul').length > 0) {
        $('div[id*="TopNavigationMenu"]').addClass('mdz-pubWithNodes');
    }
    $('#O365_MainLink_Help').closest('div').on('click', function () {
                window.open("https://collaboration.mdlz.com/sites/productivityhub/sharepoint/Pages/Home.aspx", null,
                'top=1,left=1,center=yes,resizable=yes,Width=500px,Height= 400px,status=yes,titlebar=yes;toolbar=no,menubar=no,location=yes,scrollbars=no');
            }).addClass('o365cs-nav-button');
}); 