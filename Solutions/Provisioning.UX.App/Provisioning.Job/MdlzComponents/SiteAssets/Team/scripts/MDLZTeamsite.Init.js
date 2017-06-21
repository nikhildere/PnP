
function LoadMdlzBranding() {
    document.getElementsByTagName("body")[0].style.opacity = "0";
    var head = document.getElementsByTagName('head')[0];

    var scriptFiles = ["/SiteAssets/vNext/Common/scripts/jquery-1.11.0.min.js",
                        "/SiteAssets/vNext/Team/scripts/MDLZTeamsite.js",
                        "/SiteAssets/vNext/Common/ProvApp/scripts/SubSiteOverride.js",
                        "/SiteAssets/Common/scripts/MDLZ.SiteLifeCycle.js"];
    var asyncScriptFiles = ["/SiteAssets/vNext/Common/scripts/WebTrendsMDLZ/webtrends.load.js"];

    var cssFiles = ["/SiteAssets/vNext/Team/Css/MDLZTeamsite.css"];


    for (var i = 0; i < cssFiles.length; i++) {
        var cssRef = document.createElement("link");
        cssRef.type = "text/css";
        cssRef.rel = "stylesheet";
        cssRef.href = cssFiles[i];
        head.appendChild(cssRef);
    }

    loadJsRecursive(2);

    function loadJsRecursive(lastUIManipulationJsNum) {
        var y = -1;
        
        loadJsRecursiveInternal();

        function loadJsRecursiveInternal() {
            y++;
            
            if (y == lastUIManipulationJsNum) 
                document.getElementsByTagName("body")[0].style.opacity = "1";

            if(y < scriptFiles.length)
                loadScript(scriptFiles[y], loadJsRecursiveInternal);
        }
    }

    for (var i = 0; i < asyncScriptFiles.length; i++) {
        var scriptRef = document.createElement("script");
        scriptRef.type = "text/javascript";
        scriptRef.src = asyncScriptFiles[i];
        scriptRef.aync = true;
        head.appendChild(scriptRef);
    }

    function loadScript(url, callback) {
        var script = document.createElement("script")
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
        document.getElementsByTagName("head")[0].appendChild(script);
    }
};

LoadMdlzBranding();
