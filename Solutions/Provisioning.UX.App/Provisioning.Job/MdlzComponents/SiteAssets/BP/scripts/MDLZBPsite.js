function applyWebPartStyles() {
    if ($(".ms-webpart-zone") != null && $(".ms-webpart-zone") != undefined) {
        $(".ms-webpart-zone").each(function (zoneIndex) {
            if ($(".ms-webpart-chrome") != null && $(".ms-webpart-chrome") != undefined) {
                $(this).find(".ms-webpart-chrome").each(function (index) {
                    if ($(this).find(".ms-webpart-chrome-title").length > 0) {

                        if (index % 2 == 0) {
                            $(this).find(".ms-webpart-chrome-title").css("margin-bottom", "0px");
                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url(/SiteAssets/vNext/BP/Images/aqua_header_mdl.png)");
                            $(this).find(".ms-webpart-chrome-title").css("background-repeat", "repeat-x");
                        }
                        else {
                            $(this).find(".ms-webpart-chrome-title").css("margin-bottom", "0px");
                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url(/SiteAssets/vNext/BP/Images/blue_header_mdl.png)");
                            $(this).find(".ms-webpart-chrome-title").css("background-repeat", "repeat-x");
                        }
                    }



                });



            }
        });
    }


    if ($(".ms-webpart-zone") != null && $(".ms-webpart-zone") != undefined) {
        $(".ms-webpart-zone").each(function (zoneIndex) {
            if ($(".ms-webpart-chrome") != null && $(".ms-webpart-chrome") != undefined) {
                $(this).find(".ms-webpart-chrome").each(function (index) {
                    if ($(this).find(".ms-wpContentDivSpace").length > 0) {

                        if (index % 2 == 0) {
                            $(this).find(".ms-wpContentDivSpace").css("border", "#08bece 1px solid");

                        }
                        else {
                            $(this).find(".ms-wpContentDivSpace").css("border", "#0034a5 1px solid");

                        }
                    }



                });



            }
        });
    }

    if ($(".ms-rte-layoutszone-outer") != null && $(".ms-rte-layoutszone-outer") != undefined) {
        $(".ms-rte-layoutszone-outer").each(function (zoneIndex) {
            if ($(".ms-webpart-chrome") != null && $(".ms-webpart-chrome") != undefined) {
                $(this).find(".ms-webpart-chrome").each(function (index) {
                    if ($(this).find(".ms-webpart-chrome-title").length > 0) {
                        if (index % 2 == 0) {
                            $(this).css("border", "#08bece 1px solid");
                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url(/SiteAssets/vNext/BP/Images/aqua_header_mdl.png)");
                            $(this).find(".ms-webpart-chrome-title").css("background-repeat", "repeat-x");
                        }
                        else {
                            $(this).css("border", "#0034a5 1px solid");
                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url(/SiteAssets/vNext/BP/Images/blue_header_mdl.png)");
                            $(this).find(".ms-webpart-chrome-title").css("background-repeat", "repeat-x");
                        }
                    }
                });
            }
        });
    }
}


function addSiteTitle() {
    if (_spPageContextInfo != null && _spPageContextInfo != undefined) {
        // $("#s4-titlerow").prepend("<a href='javascript:goToSiteHome();'><span class='mondoleze-team-site-title'>" + _spPageContextInfo.webTitle + "</span></a>");
        $("#pageTitle").prepend("<a href='javascript:goToSiteHome();'><span class='mondoleze-team-site-title'>" + _spPageContextInfo.webTitle + "</span></a>");
    }

    var strHtml = ' <p style="text-align:center"><span lang="en-gb" style="color:red"><strong>' +
    			  'Confidential information of either party should not be posted unless there are appropriate ' +
    			  'confidentiality obligations from Mondelēz International and its business partner.</strong></span></p>';

    $(strHtml).insertAfter("a#mainContent");
}

function goToSiteHome() {
    window.location = _spPageContextInfo.webAbsoluteUrl;
    return false;
}

function fixNavigation() {
    if ($('div[id*="TopNavigationMenu"] > ul > li > ul').length > 0) {
        $('div[id*="TopNavigationMenu"]').addClass('mdz-pubWithNodes');
    }
}

//call function

runScriptAfterJqueryLoad();

function runScriptAfterJqueryLoad() {
    if (window.$) {
        $(function () {
            Reinit();
            //Replacing Lookout with MyMix
            // $("[id*='ShellLookout']").text('MyMix');
            $("[id*='ShellLookout']>SPAN").text("MyMix");
            //setting set icon to prjsetng.aspx for Upgraded sites
            var seticonurl = _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/prjsetng.aspx";
            $("[href*='_layouts/SiteMetaDataTagger/SiteMetaDataTagger.aspx']").attr("href", seticonurl);

    fixNavigation();
    applyWebPartStyles();
    addSiteTitle();

            $('#O365_MainLink_Help').closest('div').on('click', function () {
                window.open("https://collaboration.mdlz.com/sites/productivityhub/sharepoint/Pages/Home.aspx", null,
                'top=1,left=1,center=yes,resizable=yes,Width=500px,Height= 400px,status=yes,titlebar=yes;toolbar=no,menubar=no,location=yes,scrollbars=no');
            }).addClass('o365cs-nav-button');
        });
    } else {
        // wait 50 milliseconds and try again.
        window.setTimeout(runScriptAfterJqueryLoad, 50);
    }
}






function GetHelpData() {
    clientContext = new SP.ClientContext.get_current();
    oList = clientContext.get_web().get_lists().getByTitle('HelpLinkConfig');

    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml('<View><Query><Where><Eq><FieldRef Name=\'Title\'/>' +
        '<Value Type=\'Text\'>HelpLink</Value></Eq></Where></Query><RowLimit>1</RowLimit></View>');
    this.collListItem = oList.getItems(camlQuery);

    clientContext.load(collListItem);

    clientContext.executeQueryAsync(Function.createDelegate(this, this.onQuerySucceeded), Function.createDelegate(this, this.onQueryFailed));

}

function onQuerySucceeded(sender, args) {

    var listItemInfo = '';

    var listItemEnumerator = collListItem.getEnumerator();

    while (listItemEnumerator.moveNext()) {
        var oListItem = listItemEnumerator.get_current();
        listItemInfo = oListItem.get_item('Value');
    }

    //$("#ctl00_TopHelpLink").attr("onclick", "window.open ('" + listItemInfo.toString() + "', null,'top=1,left=1,center=yes,resizable=yes,Width=500px,Height= 400px,status=yes,titlebar=yes;toolbar=no,menubar=no,location=yes,scrollbars=no'); return false;");
    window.open(listItemInfo.toString(), null,
        'top=1,left=1,center=yes,resizable=yes,Width=500px,Height= 400px,status=yes,titlebar=yes;toolbar=no,menubar=no,location=yes,scrollbars=no');
}


function onQueryFailed(sender, args) {

    alert('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
}


function Reinit() {
    //verify we have finished loading init.js  

    if (typeof (_spBodyOnLoadWrapper) != 'undefined') {

        //verify we have not already initialized the onload wrapper  

        // if (_spBodyOnloadCalled == false) {

        //initialize onload functions  

        _spBodyOnLoadWrapper();

        //}
    }
    else { //wait for 10ms and try again if init.js has not been loaded   
        InitTimer();
    }

}


function InitTimer() {
    setTimeout(Reinit, 10);
}

//$(document).ready(function () {
//    var strHtml = ' <p style="text-align:center"><span lang="en-gb" style="color:red"><strong>' +
//                  'Confidential information of either party should not be posted unless there are appropriate ' +
//                  'confidentiality obligations from Mondelēz International and its business partner.</strong></span></p>';

//    $(strHtml).insertAfter("a#mainContent");
//});
