﻿var hostweburl;
var appweburl;
var spLanguage;

//load the SharePoint resources
$(document).ready(function () {
    //Get the URI decoded URL.
    hostweburl = decodeURIComponent(getQueryStringParameter('SPHostUrl'));
    var appweburl = decodeURIComponent(getQueryStringParameter('SPAppWebUrl'));
    var spLanguage = decodeURIComponent(getQueryStringParameter('SPLanguage'));

    // The SharePoint js files URL are in the form:
    // web_url/_layouts/15/resource
    var scriptbase = hostweburl + "/_layouts/15/";

    // Load the js file and continue to the 
    //   success handler
    $.ajaxSetup({ cache: true });
    $.getScript(scriptbase + "SP.UI.Controls.js", renderChrome)
});

//Function to prepare the options and render the control
function renderChrome() {

    // The Help, Account and Contact pages receive the  same query string parameters as the main page

    var options = {
        "onCssLoaded": "chromeLoaded()",
    };

    var nav = new SP.UI.Controls.Navigation("divSPChrome",
                options);
    nav.setVisible(true);
}

// Callback for the onCssLoaded event defined in the options object of the chrome control
function chromeLoaded() {
    // When the page has loaded the required resources for the chrome control, display the page body.
    $("body").show();
}

// Function to retrieve a query string value.
// For production purposes you may want to use
//  a library to handle the query string.
function getQueryStringParameter(paramToRetrieve) {
    var params =
        document.URL.split("?")[1].split("&");
    var strParams = "";
    for (var i = 0; i < params.length; i = i + 1) {
        var singleParam = params[i].split("=");
        if (singleParam[0] == paramToRetrieve)
            return singleParam[1];
    }
}