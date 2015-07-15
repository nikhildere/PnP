
function LoadMdlzBranding() {
    var head = document.getElementsByTagName('head')[0];

    var scriptFiles = ["/SiteAssets/Common/scripts/jquery-1.11.0.min.js",
                        "/SiteAssets/Wiki/scripts/MDLZWikisite.js",
                        "/SiteAssets/Common/scripts/WebTrendsMDLZ/webtrends.load.js",
                        "/SiteAssets/Common/scripts/MDLZ.SiteLifeCycle.js"];

    var cssFiles = ["/SiteAssets/Wiki/Css/MDLZWikisite.css"];



    for (var i = 0; i < cssFiles.length; i++) {
        var cssRef = document.createElement("link");
        cssRef.type = "text/css";
        cssRef.rel = "stylesheet";
        cssRef.href = cssFiles[i];
        head.appendChild(cssRef);
    }

    for (var i = 0; i < scriptFiles.length; i++) {
        var scriptRef = document.createElement("script");
        scriptRef.type = "text/javascript";
        scriptRef.src = scriptFiles[i];
        head.appendChild(scriptRef);
    }
};

LoadMdlzBranding();
