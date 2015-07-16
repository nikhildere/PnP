function applyWebPartStyles() {
    if ($(".ms-webpart-zone") != null && $(".ms-webpart-zone") != undefined) {
        $(".ms-webpart-zone").each(function (zoneIndex) {
            if ($(".ms-webpart-chrome") != null && $(".ms-webpart-chrome") != undefined) {
                $(this).find(".ms-webpart-chrome").each(function (index) {
                    if ($(this).find(".ms-webpart-chrome-title").length > 0) {

                        if (index % 2 == 0) {
                            $(this).find(".ms-webpart-chrome-title").css("margin-bottom", "0px");
                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url(/SiteAssets/Team/Images/orange_header_mdl.png)");
                            $(this).find(".ms-webpart-chrome-title").css("background-repeat", "repeat-x");
                        }
                        else {
                            $(this).find(".ms-webpart-chrome-title").css("margin-bottom", "0px");
                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url(/SiteAssets/Team/Images/purple_header_mdl.png)");
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
                            $(this).find(".ms-wpContentDivSpace").css("border", "#ff6d21 1px solid");

                        }
                        else {
                            $(this).find(".ms-wpContentDivSpace").css("border", "#732c84 1px solid");

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
                            $(this).css("border", "#ff6d21 1px solid");
                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url(/SiteAssets/Team/Images/orange_header_mdl.png)");
                            $(this).find(".ms-webpart-chrome-title").css("background-repeat", "repeat-x");
                        }
                        else {
                            $(this).css("border", "#732c84 1px solid");
                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url(/SiteAssets/Team/Images/purple_header_mdl.png)");
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

//call function

runScriptAfterJqueryLoad();

function runScriptAfterJqueryLoad() {
    if (window.$) {
        $(function () {
            Reinit();

            //Replacing Lookout with MyMix
            //$("[id*='ShellLookout']").text('MyMix');
            $("[id*='ShellLookout']>SPAN").text("MyMix");
            //setting set icon to prjsetng.aspx for Upgraded sites
            var seticonurl = _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/prjsetng.aspx";
            $("[href*='_layouts/SiteMetaDataTagger/SiteMetaDataTagger.aspx']").attr("href", seticonurl);
            
            $('#O365_MainLink_Help').closest('div').on('click', function () {
                window.open("https://collaboration.kraft.com/sites/productivityhub/sharepoint/Pages/Home.aspx", null,
                'top=1,left=1,center=yes,resizable=yes,Width=500px,Height= 400px,status=yes,titlebar=yes;toolbar=no,menubar=no,location=yes,scrollbars=no');
            }).addClass('o365cs-nav-button');

            applyWebPartStyles();
            addSiteTitle();
        });
    } else {
        // wait 50 milliseconds and try again.
        window.setTimeout(runScriptAfterJqueryLoad, 10);
    }
}

function Reinit()  
{  
 //verify we have finished loading init.js  

        if(typeof(_spBodyOnLoadWrapper) != 'undefined')  
        {  

                //verify we have not already initialized the onload wrapper  

               // if(_spBodyOnloadCalled == false)  

                //{  

                    //initialize onload functions  

                    _spBodyOnLoadWrapper();  

                //}  
        }  
        else 
        { //wait for 10ms and try again if init.js has not been loaded   
            InitTimer();  
            }  

}  

    
function InitTimer()
{
   setTimeout(Reinit,10);  
} 
