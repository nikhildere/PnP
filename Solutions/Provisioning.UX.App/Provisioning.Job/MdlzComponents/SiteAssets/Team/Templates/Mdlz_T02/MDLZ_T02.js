//Mdlz Template 02 Javascript file

//Initiates call to on load funcionality on page load.
//_spBodyOnLoadFunctionNames.push("OnloadTemplatefunctions");


/*window.onload = function(){
	//Disable Loading Div after the Mondelez branding is applied
    $('#loader').fadeOut("Slow");
    document.getElementsByTagName('form')[0].style.visibility = "visible";
	OnloadTemplatefunctions();
	
	//Fix for ribbon overlapping
   if($('.ms-cui-tabContainer').length)
        $('#s4-ribbonrow').css("cssText","height:126px;");
};*/

function checkVariable(){
	if(window.jQuery){
	try{
	//window.onload = function() {
	$(document).ready(function(){
		//Disable Loading Div after the Mondelez branding is applied
		//$('#loader').fadeOut("Slow");
		//document.getElementsByTagName('body')[0].style.visibility = 'visible';
		//document.getElementsByTagName('form')[0].style.visibility = "visible";
		//document.getElementsByTagName('body')[0].style.display="";
		//$('#loader').fadeOut("Slow");
    document.getElementsByTagName('form')[0].style.visibility = "visible";
	//document.getElementsByTagName("body")[0].style.opacity = "1";
	//OnloadTemplatefunctions();
		OnloadTemplatefunctions();
		
		//Fix for ribbon overlapping
	   if($('.ms-cui-tabContainer').length)
			$('#s4-ribbonrow').css("cssText","height:126px;");
	});
}catch(e){
	/*document.getElementById('loader').style.display = 'none';
	document.getElementsByTagName('body')[0].style.visibility = 'visible';
	document.getElementsByTagName('form')[0].style.visibility = "visible";
	OnloadTemplatefunctions();*/
	window.setTimeout("checkVariable();",100);
	}
}
	else{
	window.setTimeout("checkVariable();",100);
	}
}
checkVariable();
//Calls template funcionalities on page load.
function OnloadTemplatefunctions() {
	//call to function to set equal width for all navigation links.	
	setAutoWidthNavigation();
	//Call to function that adds site title on banner
	addSiteTitle();

    //Replacing Lookout with MyMix
	$("[id*='ShellLookout']>SPAN").text("MyMix");
	if ($("#DeltaTopNavigation ul").length > 1) { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root > li:first-child > a:first-child").hide(); }

 
	// MPW Set Header Background Image if Site Icon is defined
	pageHeaderBackground();

	// MPW run the function to get the template parameters and process them (Stored in SiteIconDescription)
	get_template_parms() ;


}



//*******************START-Constructs breadcrumbs for document library folder structure
var folder_nav_css = 'folder-nav-container';
var useDocLibTitleAsRootFolderName = false;//whether to show 'Root' for root folder or document library title

//replace query string key with value
function replaceQueryStringAndGet(url, key, value) {
    var re = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
    separator = url.indexOf('?') !== -1 ? "&" : "?";
    if (url.match(re)) {
        return url.replace(re, '$1' + key + "=" + value + '$2');
    }
    else {
        return url + separator + key + "=" + value;
    }
}


function folderNavigation() {
    function onPostRender(renderCtx) {
        if (renderCtx.rootFolder) {
            var listUrl = decodeURIComponent(renderCtx.listUrlDir);
            var rootFolder = decodeURIComponent(renderCtx.rootFolder);
            if (renderCtx.rootFolder == '' || rootFolder.toLowerCase() == listUrl.toLowerCase())
                return;

            //get the folder path excluding list url. removing list url will give us path relative to current list url
            var folderPath = rootFolder.toLowerCase().indexOf(listUrl.toLowerCase()) == 0 ? rootFolder.substr(listUrl.length) : rootFolder;
            var pathArray = folderPath.split('/');
            var navigationItems = new Array();
            var currentFolderUrl = listUrl;

            var rootNavItem =
                {
                    title: useDocLibTitleAsRootFolderName ? renderCtx.ListTitle : "Root",
                    url: replaceQueryStringAndGet(document.location.href, 'RootFolder', listUrl)
                };
            navigationItems.push(rootNavItem);

            for (var index = 0; index < pathArray.length; index++) {
                if (pathArray[index] == '')
                    continue;
                var lastItem = index == pathArray.length - 1;
                currentFolderUrl += '/' + pathArray[index];
                var item =
                    {
                        title: pathArray[index],
                        url: lastItem ? '' : replaceQueryStringAndGet(document.location.href, 'RootFolder', encodeURIComponent(currentFolderUrl))
                    };
                navigationItems.push(item);
            }
            RenderItems(renderCtx, navigationItems);
        }
    }


    //Add a div and then render navigation items inside span
    function RenderItems(renderCtx, navigationItems) {
        if (navigationItems.length == 0) return;
        var folderNavDivId = 'foldernav_' + renderCtx.wpq;
        var webpartDivId = 'WebPart' + renderCtx.wpq;


        //a div is added beneth the header to show folder navigation
        var folderNavDiv = document.getElementById(folderNavDivId);
        var webpartDiv = document.getElementById(webpartDivId);
        if (folderNavDiv != null) {
            folderNavDiv.parentNode.removeChild(folderNavDiv);
            folderNavDiv = null;
        }
        if (folderNavDiv == null) {
            var folderNavDiv = document.createElement('div');
            folderNavDiv.setAttribute('id', folderNavDivId);
            folderNavDiv.setAttribute('class', folder_nav_css);
            webpartDiv.parentNode.insertBefore(folderNavDiv, webpartDiv);
            folderNavDiv = document.getElementById(folderNavDivId);
        }


        for (var index = 0; index < navigationItems.length; index++) {
            if (navigationItems[index].url == '') {
                var span = document.createElement('span');
                span.innerHTML = navigationItems[index].title;
                folderNavDiv.appendChild(span);
            }
            else {
                var span = document.createElement('span');
                var anchor = document.createElement('a');
                anchor.setAttribute('href', navigationItems[index].url);
                anchor.innerHTML = navigationItems[index].title;
                span.appendChild(anchor);
                folderNavDiv.appendChild(span);
            }

            //add arrow (>) to separate navigation items, except the last one
            if (index != navigationItems.length - 1) {
                var span = document.createElement('span');
                span.innerHTML = '&nbsp;>&nbsp;';
                folderNavDiv.appendChild(span);
            }
        }
    }


    function _registerTemplate() {
        var viewContext = {};

        viewContext.Templates = {};
        viewContext.OnPostRender = onPostRender;
        SPClientTemplates.TemplateManager.RegisterTemplateOverrides(viewContext);
    }
    //delay the execution of the script until clienttempltes.js gets loaded
    ExecuteOrDelayUntilScriptLoaded(_registerTemplate, 'clienttemplates.js');
};



//Function that constructs breadcrumb for document library folder structure
folderNavigation();
//Function to retreive querystring value from url
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function removeTags() {
    var txt = document.getElementById('myString').value;
    var rex = /(<([^>]+)>)/ig;
    alert(txt.replace(rex, ""));

}

//**************END-Constructs breadcrumbs for document library folder structure

//Function that adds page title and adds link for home
//Function that adds page title and adds link for home
function addSiteTitle() {

    //Check for page info global variable. 
    if (_spPageContextInfo != null && _spPageContextInfo != undefined) {
	    //Adds page heading in absence of breadcrumb.        
		if($('.DocHeading').length)
		{
	
		if( $.trim($(".DocHeading").html()).length == 0)
			{
			var value =$("#DeltaPlaceHolderPageTitleInTitleArea a").text();	
			$(".DocHeading").html(value);
			}
		}
		//Add home link to re-direct to site home page
		$("#pageTitle").children().hide(); 
		$("#pageTitle").append("<a href='javascript:goToSiteHome();'><span class='mondoleze-template-site-title' id='mondeleze-template-sitetitle'>" + _spPageContextInfo.webTitle + "</span></a>");
    }
}

//function to re-direct to default home page of site
function goToSiteHome() {
    window.location = _spPageContextInfo.webAbsoluteUrl;
    return false;
}
//Manipulate total width of navigation element and set equal width for all navigation links.
//Auto width calculation based on number of navigation.
function setAutoWidthNavigation() {

    //Do check if site is publishing or non publishing ;
    //Site is Publishing if Number of UL in whole navigation is TWO or more than ONE   
    if ($("#DeltaTopNavigation ul").length > 1) {
        //calculate width for each navigation based on number of navigation on whole navigation
        var topNavItemCount = $('#DeltaTopNavigation div ul ul li.static').length;
        topNavItemWidth = 99 / (topNavItemCount);
        //set width for indivial navigation link
        $('#DeltaTopNavigation ul li.static').width(topNavItemWidth + '%');
    }
    else { 
         //Site is NON Publishing if Number of UL in is ONE or lesser 
        //calculate width for each navigation based on number of navigation on whole navigation
        var topNavItemCount = $('#DeltaTopNavigation div ul li.static').length;

        //Based on user access for owner/contributor EDIT nav option added in Top navigation; exclude that from total navigation count
        var g = $('#DeltaTopNavigation div ul li.ms-listMenu-editLink').length;
        
        if (g > 0) {
            topNavItemWidth = 99 / (topNavItemCount - 1);
        }
        else {
            topNavItemWidth = 99 / (topNavItemCount);
        }

        //set width for individual navigation link
        $('#DeltaTopNavigation ul li.static').width(topNavItemWidth + '%');
    }

}


//check IE Version
function msieversion()
   {
      var ua = window.navigator.userAgent
      var msie = ua.indexOf ( "MSIE " )

      if ( msie > 0 )      // If Internet Explorer, return version number
         return parseInt (ua.substring (msie+5, ua.indexOf (".", msie )))
      else                 // If another browser, return 0
         return 0

   }
   
function pageHeaderBackground() {
// This function detects if a site icon image has been defined by the Owners, uses it as the header background image,  and then replaces the original icon with a transarent image so the <A> Home Tag still links

// find the site logo span tag
var source = document.getElementById("DeltaSiteLogo") ;

// look for the icon img tag
var icon = source.getElementsByTagName("img") ;

// if the site icon tag was found ....
if (icon.length > 0) {                      // img tag was found ....

// get the icon source path
var iconsrc = icon[0].getAttribute("src") ;

// if there is a site icon specified by the Site Owner (ie not one from the server _layouts directory)
if (iconsrc.indexOf("_layouts") == -1  && iconsrc != "") {   // -1 = not found indicator
} else {  // Else use the TEMPLATE Default Image Source
    iconsrc = "/SiteAssets/vNext/Team/Templates/Mdlz_T02/Images/T02_banner.png"
} ; // end if-else

// get the s4-titlerow object so we can apply new background image inline
var header = document.getElementById("s4-titlerow") ;

// get the existing s4-titlerow styles and add the new background image
var headerstyle = header.getAttribute("style") ;
if (headerstyle != null) {
header.setAttribute("style", headerstyle + "; " + "background-image:url('" + iconsrc + "')") ;
} else {
header.setAttribute("style", "background-image:url('" + iconsrc + "')") ;
}; // endif headerstyle is null


// now replace icon src with a transparent icon so the Home <A> Tag still displays correctly
icon[0].setAttribute("src", "/SiteAssets/vNext/Team/Templates/Mdlz_T02/Images/MDLZSiteIconTransparent.png");

// get existing icon styles and add the display none setting  ENTIRE SECTION REMOVED (Replaced by lines above)
//var iconstyle = icon[0].getAttribute("style") ;
//if (iconstyle != null) {
//icon[0].setAttribute("style", iconstyle + " " + "display:none !important") ;
//} else {
//icon[0].setAttribute("style", "display:none !important") ;
//}; // endif iconstyle is null

// } ; // endif icon is not in _layouts folder (ie not the default icon)   REMOVED and if/else used instead

} ; // endif icon exists

} ; // end function

  
// MPW Set Header Background Image if Site Icon is defined    REMOVED and put higher up ..
// pageHeaderBackground();




function get_template_parms() {   // MPW Parameters are stored in SITE ICON DESCRIPTION in the format NONAV/MINTYNAV/BOLDBLUENAV/PURPLENAV/GREENNAV/YELLOWNAV/ORANGENAV - default is red ...

var siteiconimage = document.getElementById('ctl00_onetidHeadbnnr2');
var text = siteiconimage.getAttribute('alt') ;

if (text != "" && text !=undefined && text != null) {

//Get the topnav DIV for use lower down ...
var topnav = document.getElementById("DeltaTopNavigation") ;


// If it contains "NONAV" then add a class to hide the navigation
if (text.indexOf("NONAV") == -1  && text != "") {   // -1 = not found indicator
}else{   // else if found ....
if (topnav) {topnav.className += topnav.className ? ' templateNONAV': 'templateNONAV'} ;
} ; // endif else

    // Set TopNav FONT color Classes @Anand
var ul = topnav.getElementsByTagName('UL');
for (var i = 0 ; i < ul.length ; i++) { // Loop through UL tags looking for "static" class
    var currentclass = ul[i].className;
    if (currentclass != null && currentclass != undefined) {
        if (currentclass.indexOf('static') >= 0) {   // If ul.static class found ....

            // Check if navigation FONT color specified  
            if (text.indexOf("TOPLINKFONT") >= 0) {
                // if HEXCODE Topnav     
                textNav = text;
                if (textNav.indexOf("MINTYTOPLINKFONT") == -1 && textNav.indexOf("BOLDBLUETOPLINKFONT") == -1 && textNav.indexOf("GREENTOPLINKFONT") == -1 && textNav.indexOf("PURPLETOPLINKFONT") == -1 && textNav.indexOf("YELLOWTOPLINKFONT") == -1 && textNav.indexOf("REDTOPLINKFONT") == -1 && textNav.indexOf("ORANGETOPLINKFONT") == -1 && textNav.indexOf("LIGHTGRAYTOPLINKFONT") == -1 && textNav.indexOf("DARKGRAYTOPLINKFONT") == -1 && textNav.indexOf("BLACKTOPLINKFONT") == -1 && textNav.indexOf("WHITETOPLINKFONT") == -1) {
                    // if (ul[i]) { ul[i].className += ul[i].className ? ' templateHEXNAV' : 'templateHEXNAV' };
                    var hexCode;
                    textNav = textNav.split(" ");

                    for (var i = 0; i <= textNav.length - 1; i++) {
                        if (textNav[i].indexOf("TOPLINKFONT") >= 0)
                            hexCode = textNav[i];
                    }

                    hexCode = hexCode.split("TOPLINKFONT");

                    $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").attr("style", "color:" + hexCode[0] + "!important");

                }
            }

            // if MINTYTOPLINKFONT Topnav
            if (text.indexOf("MINTYTOPLINKFONT") >= 0) {    // MINTYTOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateMINTYTOPLINKFONT"); };
            };

            // if BOLDBLUETOPLINKFONT Topnav
            if (text.indexOf("BOLDBLUETOPLINKFONT") >= 0) {    // BOLDBLUETOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateBOLDBLUETOPLINKFONT"); };
            };

            // if GREENTOPLINKFONT Topnav
            if (text.indexOf("GREENTOPLINKFONT") >= 0) {    // GREENTOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateGREENTOPLINKFONT"); };
            };

            // if PURPLETOPLINKFONT Topnav
            if (text.indexOf("PURPLETOPLINKFONT") >= 0) {    // PURPLETOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templatePURPLETOPLINKFONT"); };
            };

            // if YELLOWTOPLINKFONT Topnav
            if (text.indexOf("YELLOWTOPLINKFONT") >= 0) {    // YELLOWTOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateYELLOWTOPLINKFONT"); };
            };

            // if REDTOPLINKFONT Topnav
            if (text.indexOf("REDTOPLINKFONT") >= 0) {    // REDTOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateREDTOPLINKFONT"); };
            };

            // if ORANGETOPLINKFONT Topnav
            if (text.indexOf("ORANGETOPLINKFONT") >= 0) {    // ORANGETOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateORANGETOPLINKFONT"); };
            };

            // if LIGHTGRAYTOPLINKFONT Topnav
            if (text.indexOf("LIGHTGRAYTOPLINKFONT") >= 0) {    // LIGHTGRAYTOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateLIGHTGRAYTOPLINKFONT"); };
            };

            // if DARKGRAYTOPLINKFONT Topnav
            if (text.indexOf("DARKGRAYTOPLINKFONT") >= 0) {    // DARKGRAYTOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateDARKGRAYTOPLINKFONT"); };
            };

            // if BLACKTOPLINKFONT Topnav
            if (text.indexOf("BLACKTOPLINKFONT") >= 0) {    // BLACKTOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateBLACKTOPLINKFONT"); };
            };

            // if WHITETOPLINKFONT Topnav
            if (text.indexOf("WHITETOPLINKFONT") >= 0) {    // WHITETOPLINKFONT wording found ....
                if ("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span") { $("#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li span span").addClass("templateWHITETOPLINKFONT"); };
            };

        }; // endif UL class = static

    }; // endif currentclass != null

};

    // For breadcrumb @Anand
if (text.indexOf("SHOWBREADCRUMB") == -1) {
    $(".ms-breadcrumb-anchor").hide();

}
else {
    /* To apply transparent image on breadcrumb @Anand */
    $(".ms-breadcrumb-anchor").show();
    // find the site breadcrumb span tag
    var bc_source = document.getElementById("DeltaBreadcrumbDropdown");

    // look for the breadcrumb icon img tag
    var iconbc = bc_source.getElementsByTagName("img");
    // if the site icon tag was found ....
    if (iconbc.length > 0) {

        iconbc[0].setAttribute("src", "/SiteAssets/vNext/Team/Templates/Mdlz_T02/Images/breadcrumb%20icon.png");
        $("#GlobalBreadCrumbNavPopout-anchor IMG").attr("style", "top:0px !important");
        $("#GlobalBreadCrumbNavPopout-anchor IMG").attr("style", "left:0px !important");

    }; // endif icon exists
	
	//Apply css only for IE8
	var ieVersion = msieversion();
	if(ieVersion == 7)
	{
		
		if($("#zz12_TopNavigationMenu ul[id*='zz13_RootAspMenu']").length)
			$("#DeltaTopNavigation ul[id*='RootAspMenu']").css("cssText","margin-left: -785px !important;");
		else
			$("#DeltaTopNavigation ul[id*='RootAspMenu']").css("cssText","margin-left: -784.5px !important;");
	} 
}

// Set TopNav background color Classes 
var ul = topnav.getElementsByTagName('UL') ;
for ( var i=0 ; i< ul.length ; i++ ) { // Loop through UL tags looking for "static" class
var currentclass = ul[i].className ;
if (currentclass != null && currentclass != undefined) {
if (currentclass.indexOf('static') >= 0 ) {   // If ul.static class found ....

    // Check if navigation color specified  
    if (text.indexOf("NAV") >= 0 && text.indexOf("NONAV") == -1) {
        // if HEXCODE Topnav     
        textNav = text;
        if (textNav.indexOf("MINTYNAV") == -1 && textNav.indexOf("BOLDBLUENAV") == -1 && textNav.indexOf("GREENNAV") == -1 && textNav.indexOf("PURPLENAV") == -1 && textNav.indexOf("YELLOWNAV") == -1 && textNav.indexOf("REDNAV") == -1 && textNav.indexOf("ORANGENAV") == -1 && textNav.indexOf("LIGHTGRAYNAV") == -1 && textNav.indexOf("DARKGRAYNAV") == -1 && textNav.indexOf("BLACKNAV") == -1 && textNav.indexOf("WHITENAV") == -1) {
            var hexCode = null;
            textNav = textNav.split(" ");

            for (var i = 0; i <= textNav.length - 1; i++) {
                if (textNav[i].indexOf("NAV") >= 0 && textNav[i].indexOf("SHOWLEFTNAV") == -1)
                    hexCode = textNav[i];
            }

            if (hexCode !== null) {
                hexCode = hexCode.split("NAV");
                
                $("div[id*='TopNavigation'] ul.static").css("cssText","background-color:"+ hexCode[0] + ' !important;');

                if (ul[i]) { ul[i].className += ul[i].className ? ' templateHEXNAV' : 'templateHEXNAV' };
            }
        }
    }

// if MINTYNAV Topnav
if (text.indexOf("MINTYNAV") >= 0 ) {    // MINTYNAV wording found ....
if (ul[i]) {ul[i].className += ul[i].className ? ' templateMINTYNAV': 'templateMINTYNAV'} ;
} ;

// if BOLDBLUENAV Topnav
if (text.indexOf("BOLDBLUENAV") >= 0 ) {    // Bold Blue wording found ....
if (ul[i]) {ul[i].className += ul[i].className ? ' templateBOLDBLUENAV': 'templateBOLDBLUENAV'} ;
} ;

// if GREENNAV Topnav
if (text.indexOf("GREENNAV") >= 0 ) {    // GREENNAV wording found ....
if (ul[i]) {ul[i].className += ul[i].className ? ' templateGREENNAV': 'templateGREENNAV'} ;
} ;

// if PURPLENAV Topnav
if (text.indexOf("PURPLENAV") >= 0 ) {    // PURPLENAV wording found ....
if (ul[i]) {ul[i].className += ul[i].className ? ' templatePURPLENAV': 'templatePURPLENAV'} ;
} ;

// if YELLOWNAV Topnav
if (text.indexOf("YELLOWNAV") >= 0 ) {    // YELLOWNAV wording found ....
if (ul[i]) {ul[i].className += ul[i].className ? ' templateYELLOWNAV': 'templateYELLOWNAV'} ;
} ;

// if REDNAV Topnav
if (text.indexOf("REDNAV") >= 0 ) {    // REDNAV wording found ....
if (ul[i]) {ul[i].className += ul[i].className ? ' templateREDNAV': 'templateREDNAV'} ;
} ;

// if ORANGENAV Topnav
if (text.indexOf("ORANGENAV") >= 0 ) {    // ORANGENAV wording found ....
if (ul[i]) {ul[i].className += ul[i].className ? ' templateORANGENAV': 'templateORANGENAV'} ;
} ;

// if LIGHTGRAYNAV Topnav
if (text.indexOf("LIGHTGRAYNAV") >= 0 ) {    // LIGHTGRAYNAV wording found ....
if (ul[i]) {ul[i].className += ul[i].className ? ' templateLIGHTGRAYNAV': 'templateLIGHTGRAYNAV'} ;
} ;

// if DARKGRAYNAV Topnav
if (text.indexOf("DARKGRAYNAV") >= 0 ) {    // DARKGRAYNAV wording found ....
if (ul[i]) {ul[i].className += ul[i].className ? ' templateDARKGRAYNAV': 'templateDARKGRAYNAV'} ;
} ;

    // if BLACKNAV Topnav
if (text.indexOf("BLACKNAV") >= 0) {    // BLACKNAV wording found ....
    if (ul[i]) { ul[i].className += ul[i].className ? ' templateBLACKNAV' : 'templateBLACKNAV' };
};

    // if WHITENAV Topnav
if (text.indexOf("WHITENAV") >= 0) {    // WHITENAV wording found ....
    if (ul[i]) { ul[i].className += ul[i].className ? ' templateWHITENAV' : 'templateWHITENAV' };
};

} ; // endif UL class = static

} ; // endif currentclass != null

} ; // end FOR loop 

    // Enable Left Nav @Anand
    // if SHOWLEFTNAV
if (text.indexOf("SHOWLEFTNAV") == -1) {    // SHOWLEFTNAV wording not found ....        
    if ($("div[id*='QuickLaunch']").length) {
        var titleID = document.getElementById("contentBox");
        //Get datepicker element inside LeftNavigation
        var datePickerLeftNav = $("#AsynchronousViewDefault_CalendarView");
                                
        //Add HidecontentBoxClass STYLE only if there is not any other element in SideNavigation like datepicker...
        if (titleID && datePickerLeftNav.length==0) {
            titleID.className += titleID.className ? ' HidecontentBoxClass' : 'HidecontentBoxClass'
        };

        $("div[id*='QuickLaunch']").css("display", "none");
		
		
		//If Site Contents exists in Left Nav
		if ($("div[class*='sideNavBox'] .ms-core-listMenu-verticalBox").length) {        
				$("div[class*='sideNavBox'] .ms-core-listMenu-verticalBox").css("display", "none");
	    }
		
    }
};

// Set s4-workspace body sides colors
var workspace = document.getElementById("s4-workspace") ;

    // Check if SIDE color specified  
if (text.indexOf("SIDES") >= 0) {
    // if HEXCODE sides     
    textSides = text;
    if (textSides.indexOf("MINTYSIDES") == -1 && textSides.indexOf("BOLDBLUESIDES") == -1 && textSides.indexOf("GREENSIDES") == -1 && textSides.indexOf("PURPLESIDES") == -1 && textSides.indexOf("YELLOWSIDES") == -1 && textSides.indexOf("REDSIDES") == -1 && textSides.indexOf("ORANGESIDES") == -1 && textSides.indexOf("LIGHTGRAYSIDES") == -1 && textSides.indexOf("DARKGRAYSIDES") == -1 && textSides.indexOf("WHITESIDES") == -1 && textSides.indexOf("BLACKSIDES") == -1 && textSides.indexOf("TRANSPARENTSIDES") == -1) {
        if (workspace) { workspace.className += workspace.className ? ' templateHEXSIDES' : 'templateHEXSIDES' };
        var hexCode;
        textSides = textSides.split(" ");

        for (var i = 0; i <= textSides.length - 1; i++) {
            if (textSides[i].indexOf("SIDES") >= 0)
                hexCode = textSides[i];
        }

        hexCode = hexCode.split("SIDES");
        $(".templateHEXSIDES").css("cssText","background-color:"+ hexCode[0] + ' !important;');
    }
}

// if MINTYSIDES
if (text.indexOf("MINTYSIDES") >= 0 ) {    // MINTYSIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateMINTYSIDES': 'templateMINTYSIDES'} ;
} ;

// if BOLDBLUESIDES
if (text.indexOf("BOLDBLUESIDES") >= 0 ) {    // Bold Blue wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateBOLDBLUESIDES': 'templateBOLDBLUESIDES'} ;
} ;

// if GREENSIDES
if (text.indexOf("GREENSIDES") >= 0 ) {    // GREENSIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateGREENSIDES': 'templateGREENSIDES'} ;
} ;

// if PURPLESIDES
if (text.indexOf("PURPLESIDES") >= 0 ) {    // PURPLESIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templatePURPLESIDES': 'templatePURPLESIDES'} ;
} ;

// if YELLOWSIDES
if (text.indexOf("YELLOWSIDES") >= 0 ) {    // YELLOWSIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateYELLOWSIDES': 'templateYELLOWSIDES'} ;
} ;

// if REDSIDES
if (text.indexOf("REDSIDES") >= 0 ) {    // REDSIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateREDSIDES': 'templateREDSIDES'} ;
} ;

// if ORANGESIDES
if (text.indexOf("ORANGESIDES") >= 0 ) {    // ORANGESIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateORANGESIDES': 'templateORANGESIDES'} ;
} ;

// if LIGHTGRAYSIDES
if (text.indexOf("LIGHTGRAYSIDES") >= 0 ) {    // LIGHTGRAYSIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateLIGHTGRAYSIDES': 'templateLIGHTGRAYSIDES'} ;
} ;

// if DARKGRAYSIDES
if (text.indexOf("DARKGRAYSIDES") >= 0 ) {    // DARKGRAYSIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateDARKGRAYSIDES': 'templateDARKGRAYSIDES'} ;
} ;

// if WHITESIDES
if (text.indexOf("WHITESIDES") >= 0 ) {    // WHITESIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateWHITESIDES': 'templateWHITESIDES'} ;
} ;

// if TRANSPARENTSIDES
if (text.indexOf("TRANSPARENTSIDES") >= 0 ) {    // TRANSPARENTSIDES wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateTRANSPARENTSIDES': 'templateTRANSPARENTSIDES'} ;
} ;

// if BLACKSIDES 
if (text.indexOf("BLACKSIDES") >= 0 ) {    // BLACKSIDES  wording found ....
if (workspace) {workspace.className += workspace.className ? ' templateBLACKSIDES': 'templateBLACKSIDES'} ;
} ;



// Set s4-bodyContainer page colors
var bodyC = document.getElementById("s4-bodyContainer") ;

    // Check if PAGE color specified  
if (text.indexOf("PAGE") >= 0) {
    // if HEXCODE page     
    textPage = text;
    if (textPage.indexOf("MINTYPAGE") == -1 && textPage.indexOf("BOLDBLUEPAGE") == -1 && textPage.indexOf("PURPLEPAGE") == -1 && textPage.indexOf("REDPAGE") == -1 && textPage.indexOf("ORANGEPAGE") == -1 && textPage.indexOf("YELLOWPAGE") == -1 && textPage.indexOf("GREENPAGE") == -1 && textPage.indexOf("DARKGRAYPAGE") == -1 && textPage.indexOf("LIGHTGRAYPAGE") == -1 && textPage.indexOf("TRANSPARENTPAGE ") == -1 && textPage.indexOf("WHITEPAGE") == -1 && textPage.indexOf("BLACKPAGE") == -1) {
        if (bodyC) { bodyC.className += bodyC.className ? ' templateHEXPAGE' : 'templateHEXPAGE' };
        var hexCode;
        textPage = textPage.split(" ");

        for (var i = 0; i <= textPage.length - 1; i++) {
            if (textPage[i].indexOf("PAGE") >= 0)
                hexCode = textPage[i];
        }

        hexCode = hexCode.split("PAGE");
        $(".templateHEXPAGE").css("cssText","background-color:"+ hexCode[0] + ' !important;');
    }
}

// if MINTYPAGE
if (text.indexOf("MINTYPAGE") >= 0 ) {    // MINTYPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateMINTYPAGE': 'templateMINTYPAGE'} ;
} ;

// if BOLDBLUEPAGE
if (text.indexOf("BOLDBLUEPAGE") >= 0 ) {    // Bold Blue wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateBOLDBLUEPAGE': 'templateBOLDBLUEPAGE'} ;
} ;

// if GREENPAGE
if (text.indexOf("GREENPAGE") >= 0 ) {    // GREENPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateGREENPAGE': 'templateGREENPAGE'} ;
} ;

// if PURPLEPAGE
if (text.indexOf("PURPLEPAGE") >= 0 ) {    // PURPLEPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templatePURPLEPAGE': 'templatePURPLEPAGE'} ;
} ;

// if YELLOWPAGE
if (text.indexOf("YELLOWPAGE") >= 0 ) {    // YELLOWPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateYELLOWPAGE': 'templateYELLOWPAGE'} ;
} ;

// if REDPAGE
if (text.indexOf("REDPAGE") >= 0 ) {    // REDPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateREDPAGE': 'templateREDPAGE'} ;
} ;

// if ORANGEPAGE
if (text.indexOf("ORANGEPAGE") >= 0 ) {    // ORANGEPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateORANGEPAGE': 'templateORANGEPAGE'} ;
} ;

// if LIGHTGRAYPAGE
if (text.indexOf("LIGHTGRAYPAGE") >= 0 ) {    // LIGHTGRAYPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateLIGHTGRAYPAGE': 'templateLIGHTGRAYPAGE'} ;
} ;

// if DARKGRAYPAGE
if (text.indexOf("DARKGRAYPAGE") >= 0 ) {    // DARKGRAYPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateDARKGRAYPAGE': 'templateDARKGRAYPAGE'} ;
} ;

// if WHITEPAGE
if (text.indexOf("WHITEPAGE") >= 0 ) {    // WHITEPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateWHITEPAGE': 'templateWHITEPAGE'} ;
} ;

    // if BLACKPAGE
if (text.indexOf("BLACKPAGE") >= 0) {    // BLACKPAGE wording found ....
    if (bodyC) { bodyC.className += bodyC.className ? ' templateBLACKPAGE' : 'templateBLACKPAGE' };
};

// if TRANSPARENTPAGE
if (text.indexOf("TRANSPARENTPAGE") >= 0 ) {    // TRANSPARENTPAGE wording found ....
if (bodyC) {bodyC.className += bodyC.className ? ' templateTRANSPARENTPAGE': 'templateTRANSPARENTPAGE'} ;
} ;





// Set TITLE colors
var titleID = document.getElementById("mondeleze-template-sitetitle");

    // Check if site name HEXcolor specified  
if (text.indexOf("SITENAME") >= 0) {
    textSiteName = text;
    if (textSiteName.indexOf("MINTYSITENAME") == -1 && textSiteName.indexOf("BOLDBLUESITENAME") == -1 && textSiteName.indexOf("GREENSITENAME") == -1 && textSiteName.indexOf("PURPLESITENAME") == -1 && textSiteName.indexOf("YELLOWSITENAME") == -1 && textSiteName.indexOf("REDSITENAME") == -1 && textSiteName.indexOf("ORANGESITENAME") == -1 && textSiteName.indexOf("LIGHTGRAYSITENAME") == -1 && textSiteName.indexOf("DARKGRAYSITENAME") == -1 && textSiteName.indexOf("WHITESITENAME") == -1 && textSiteName.indexOf("BLACKSITENAME") == -1) {
        if (titleID) { titleID.className += titleID.className ? ' templateHEXSITENAME' : 'templateHEXSITENAME' };

        var hexCode;
        textSiteName = textSiteName.split(" ");

        for (var i = 0; i <= textSiteName.length - 1; i++) {
            if (textSiteName[i].indexOf("SITENAME") >= 0)
                hexCode = textSiteName[i];
        }

        hexCode = hexCode.split("SITENAME");
        $(".templateHEXSITENAME").css("color", hexCode[0]);
    }
}

// if MINTYSITENAME
if (text.indexOf("MINTYSITENAME") >= 0 ) {    // MINTYSITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateMINTYSITENAME': 'templateMINTYSITENAME'} ;
} ;

// if BOLDBLUESITENAME
if (text.indexOf("BOLDBLUESITENAME") >= 0 ) {    // Bold Blue wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateBOLDBLUESITENAME': 'templateBOLDBLUESITENAME'} ;
} ;

// if GREENSITENAME
if (text.indexOf("GREENSITENAME") >= 0 ) {    // GREENSITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateGREENSITENAME': 'templateGREENSITENAME'} ;
} ;

// if PURPLESITENAME
if (text.indexOf("PURPLESITENAME") >= 0 ) {    // PURPLESITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templatePURPLESITENAME': 'templatePURPLESITENAME'} ;
} ;

// if YELLOWSITENAME
if (text.indexOf("YELLOWSITENAME") >= 0 ) {    // YELLOWSITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateYELLOWSITENAME': 'templateYELLOWSITENAME'} ;
} ;

// if REDSITENAME
if (text.indexOf("REDSITENAME") >= 0 ) {    // REDSITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateREDSITENAME': 'templateREDSITENAME'} ;
} ;

// if ORANGESITENAME
if (text.indexOf("ORANGESITENAME") >= 0 ) {    // ORANGESITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateORANGESITENAME': 'templateORANGESITENAME'} ;
} ;

// if LIGHTGRAYSITENAME
if (text.indexOf("LIGHTGRAYSITENAME") >= 0 ) {    // LIGHTGRAYSITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateLIGHTGRAYSITENAME': 'templateLIGHTGRAYSITENAME'} ;
} ;

// if DARKGRAYSITENAME
if (text.indexOf("DARKGRAYSITENAME") >= 0 ) {    // DARKGRAYSITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateDARKGRAYSITENAME': 'templateDARKGRAYSITENAME'} ;
} ;

// if WHITESITENAME
if (text.indexOf("WHITESITENAME") >= 0 ) {    // WHITESITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateWHITESITENAME': 'templateWHITESITENAME'} ;
} ;

// if BLACKSITENAME
if (text.indexOf("BLACKSITENAME") >= 0 ) {    // BLACKSITENAME wording found ....
if (titleID) {titleID.className += titleID.className ? ' templateBLACKSITENAME': 'templateBLACKSITENAME'} ;
} ;



} ; // endif text contains a value

    //To increase TopNav Height @Anand
if($(".HIGHTOPLINKS").length)
if (text.indexOf("HIGHTOPLINKS") >= 0) {
    if ($('#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li ul').length)
        $('#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li ul li').addClass('HIGHTOPLINKS'); //For Publishing
    else {
        $('.ms-breadcrumb-anchor').addClass('ms-breadcrumb-anchor-NonPublishing');
        $('#DeltaTopNavigation ul.static.ms-core-listMenu-root.root li').addClass('HIGHTOPLINKS'); //For Non-Publishing
    }
}
} ; // end function get_template_parms
