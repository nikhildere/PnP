﻿function applyWebPartStyles() {

    if ($("#DeltaPlaceHolderMain") != null && $("#DeltaPlaceHolderMain") != undefined) {
        $("#DeltaPlaceHolderMain").each(function (zoneIndex) {
                   if ($(".ms-webpart-chrome") != null && $(".ms-webpart-chrome") != undefined) {
                       		                 $(this).find(".ms-webpart-chrome").each(function (index) {
		                
		
		                    if ($(this).find(".ms-webpart-chrome-title").length > 0) {
		                                      
		 						 if (index % 2 == 0) {
		                            $(this).css("border", "#0045ad 1px solid !important");
		                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url('/SiteAssets/vNext/PS/images/grey_header_mdl.png')");
		                            $(this).find(".ms-webpart-chrome-title").css("background-repeat","repeat-x");
		                        }
		                        else{
		 						     $(this).css("border", "#d61c31 1px solid !important");
		 						     $(this).find(".ms-webpart-chrome-title").css("background-image", "url('/SiteAssets/vNext/PS/images/red_header_mdl.png')");
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
        //   $("#s4-titlerow").prepend("<a href='javascript:goToSiteHome();'><span class='mondoleze-team-site-title'>" + _spPageContextInfo.webTitle + "</span></a>");
        $("#pageTitle").prepend("<a href='javascript:goToSiteHome();'><span class='mondoleze-team-site-title'>" + _spPageContextInfo.webTitle + "</span></a>");
    }
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


function Reinit() {
    //verify we have finished loading init.js  

    if (typeof (_spBodyOnLoadWrapper) != 'undefined') {

        //verify we have not already initialized the onload wrapper  

        //if (_spBodyOnloadCalled == false) {

            //initialize onload functions  

            _spBodyOnLoadWrapper();

       // }
    }
    else { //wait for 10ms and try again if init.js has not been loaded   
        InitTimer();
    }

}


function InitTimer() {
    setTimeout(Reinit, 10);
}
