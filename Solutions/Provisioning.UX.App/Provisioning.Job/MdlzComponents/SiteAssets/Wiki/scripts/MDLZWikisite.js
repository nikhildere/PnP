function applyWebPartStyles() {
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
                            $(this).css("border", "#0045ad 1px solid");
                            $(this).find(".ms-webpart-chrome-title").css("background-image", "url(/SiteAssets/Team/Images/blue_header_mdl.png)");
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
		    //  applyWebPartStyles();
		    Reinit();
		    
		        //Replacing Lookout with MyMix
		        //$("[id*='ShellLookout']").text('MyMix');
		          $("[id*='ShellLookout']>SPAN").text("MyMix");
		
		        //setting set icon to prjsetng.aspx for Upgraded sites
		        var seticonurl = _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/prjsetng.aspx";
		        $("[href*='_layouts/SiteMetaDataTagger/SiteMetaDataTagger.aspx']").attr("href", seticonurl);
		    
		    addSiteTitle();
		    //ExecuteOrDelayUntilScriptLoaded(GetHelpData, "sp.js");
		    $('#ctl00_TopHelpLink').attr('href', 'javascript:;').attr('onclick', '').click(GetHelpData);
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

//        }
    }
    else { //wait for 10ms and try again if init.js has not been loaded   
        InitTimer();
    }

}


function InitTimer() {
    setTimeout(Reinit, 10);
}