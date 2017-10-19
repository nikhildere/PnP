function LoadMdlzBranding(templateName) {
	
	//document.getElementsByTagName("body")[0].style.opacity = "0";
	var head = document.getElementsByTagName('head')[0];

    //Form Loading div
  /*  var loadingDiv = '<div id="loader" style="display:table; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; background: #fff;">'
    + '<div style="display:table-cell; vertical-align:middle; text-align: center;">'
    + 'loading...<br />'
    + '</div></div>';*/

    var isIframeElement = null;
    var curURL = null;
    var indexNintex = null;
	var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
  

    //Call GetElementByClassName 
    isIframeElement = GEBCN("ms-datepicker-html");
    curURL = window.location.href;
    indexNintex = (curURL.indexOf("_layouts/15/Upload.aspx") != -1 || curURL.indexOf("_layouts/15/NintexWorkflow/WorkflowDesigner.aspx") != -1 || curURL.indexOf("_layouts/15/zoombldr.aspx?culture=en-US") != -1 || curURL.indexOf("_layouts/15/Chart/WebUI") != -1 || curURL.indexOf("Lists/Calendar/NewForm.aspx?RootFolder=Lists%2FCalendar&IsDlg=1") != -1) ? true : false;

    //Dont append Mondelez JS and CSS to iframe head if iframe element is found
  if (isIframeElement.length == 0 && isSafari == false && indexNintex == false) {
        //First hide default Sharepoint form element 
        document.getElementsByTagName('form')[0].style.visibility = "hidden";
        //Append Loading div to body
       // document.getElementsByTagName('body')[0].insertAdjacentHTML('afterbegin', loadingDiv);
    }

    var scriptFiles = [{ src: "/SiteAssets/vNext/Team/Templates/" + templateName + "/jquery-1.11.0.min.js" },
                        { src: "/SiteAssets/vNext/Team/Templates/" + templateName + "/" + templateName + ".js" },
						{ src: "/SiteAssets/vNext/Common/scripts/WebTrendsMDLZ/webtrends.load.js", addOnlyIfTrue: function () { return (typeof wt_sp_globals == 'undefined' || !wt_sp_globals); } },
                        { src: "/SiteAssets/vNext/Common/ProvApp/scripts/SubSiteOverride.js" },
						{ src: "/SiteAssets/Common/scripts/MDLZ.SiteLifeCycle.js", addOnlyIfTrue: function () { return (typeof MdlzLifeCycle == 'undefined' || !MdlzLifeCycle); } }];


    var cssFiles = ["/SiteAssets/vNext/Team/Templates/" + templateName + "/" + templateName + ".css"];

    for (var i = 0; i < cssFiles.length; i++) {
        var cssRef = document.createElement("link");
        cssRef.type = "text/css";
        cssRef.rel = "stylesheet";
        cssRef.href = cssFiles[i];
        if (isIframeElement.length == 0 && indexNintex == false)
            head.appendChild(cssRef);
    }

    for (var i = 0; i < scriptFiles.length; i++) {
        var sFile = scriptFiles[i];

        if (!sFile.addOnlyIfTrue || (sFile.addOnlyIfTrue && sFile.addOnlyIfTrue())) {
            var scriptRef = document.createElement("script");
            scriptRef.type = "text/javascript";
            scriptRef.src = sFile.src;
            if (isIframeElement.length == 0 && isSafari == false && indexNintex == false)
                head.appendChild(scriptRef);
        }
    }

   /* var scriptFiles = [{ src: "/SiteAssets/Team/Templates/" + templateName + "/jquery-1.11.0.min.js" },
                        { src: "/SiteAssets/Team/Templates/" + templateName + "/" + templateName + ".js" },
						{ src: "/SiteAssets/Common/scripts/MDLZ.SiteLifeCycle.js", addOnlyIfTrue: function () { return (typeof MdlzLifeCycle == 'undefined' || !MdlzLifeCycle); } }];
	
	var asyncScriptFiles = [{ src: "/_layouts/15/MDLZ.SiteTemplate.MasterPage/scripts/WebTrendsMDLZ/webtrends.load.js", addOnlyIfTrue: function () { return (typeof wt_sp_globals == 'undefined' || !wt_sp_globals); } }];
	
	var cssFiles = ["/SiteAssets/Team/Templates/" + templateName + "/" + templateName + ".css"];

   
    for (var i = 0; i < cssFiles.length; i++) {
        var cssRef = document.createElement("link");
        cssRef.type = "text/css";
        cssRef.rel = "stylesheet";
        cssRef.href = cssFiles[i];
        if (isIframeElement.length == 0 && indexNintex == false)
            head.appendChild(cssRef);
    }
	
	loadJsRecursive(2);

    function loadJsRecursive(lastUIManipulationJsNum) {
        var y = -1;
        
        loadJsRecursiveInternal();

        function loadJsRecursiveInternal() {
            y++;
            
            if (y == lastUIManipulationJsNum) {
                document.getElementsByTagName("body")[0].style.opacity = "1";
			}
            else{
                if (!scriptFiles[y].addOnlyIfTrue || (scriptFiles[y].addOnlyIfTrue && scriptFiles[y].addOnlyIfTrue())) {
					if (isIframeElement.length == 0  && indexNintex == false){
						loadScript(scriptFiles[y].src, loadJsRecursiveInternal);
					}
				}
			}
        }
    }
	
	for (var i = 0; i < asyncScriptFiles.length; i++) {
        if (!asyncScriptFiles[i].addOnlyIfTrue || (asyncScriptFiles[i].addOnlyIfTrue && asyncScriptFiles[i].addOnlyIfTrue())) {
			var scriptRef = document.createElement("script");
			scriptRef.type = "text/javascript";
			scriptRef.src = asyncScriptFiles[i].src;
			scriptRef.aync = true;
			head.appendChild(scriptRef);
		}
    }

    function loadScript(url, callback) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        if (script.readyState) {  //IE
            script.onreadystatechange = function () {
                if (script.readyState === "loaded" || script.readyState === "complete") {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {  //Others
            script.onload = function () {
                callback();
            };
        }

        script.src = url;
        head.appendChild(script);
    }*/

}

LoadMdlzBranding("Mdlz_T03");


//Fix for IE8 as getElementsbyClassName doesnt work in IE8
function GEBCN(cn) {
    if (document.getElementsByClassName) // Returns NodeList here
        return document.getElementsByClassName(cn);

    cn = cn.replace(/ *$/, '');

    if (document.querySelectorAll) // Returns NodeList here
        return document.querySelectorAll((' ' + cn).replace(/ +/g, '.'));

    cn = cn.replace(/^ */, '');

    var classes = cn.split(/ +/), clength = classes.length;
    var els = document.getElementsByTagName('*'), elength = els.length;
    var results = [];
    var i, j, match;

    for (i = 0; i < elength; i++) {
        match = true;
        for (j = clength; j--;)
            if (!RegExp(' ' + classes[j] + ' ').test(' ' + els[i].className + ' '))
                match = false;
        if (match)
            results.push(els[i]);
    }

    // Returns Array here
    return results;
}
