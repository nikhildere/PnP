/*
 Copyright (c) 2013 Webtrends, Inc.
 SharePoint 2013 Plugin v3.0.50
 SharePoint SPO Plugin updated 10/08/2014
 Updated document tracking to fire separate paths for documents if in the uri, query string, wopiframe, preview window
 Added WT.shp_doc
 Added WT.shp_doc_loc
 Updated search results tracking to use wildcarded topleveluserid
 Updated search results to search through the element id's objects until it finds the results node
 Updated search to not fire results again on pagination
 Updated search to override WT.ti and WT.cg_s
 Updated WT.cg_s to allow override by search results
 Updated to look at webtrends.load.js for list of possible search results pages to use look for.
 Updated Web Part list to add "No Web Part Title Found" when no title is successfully pulled
 Updated Web Part to trim values to 40 characters at word boundaries
 Updated this.cfg to include webPart character limit setting.
 Updated generic Link Tracking for Microsoft
 Updated this.cfg to all swithing all click tracking on or off
 Added several ECB menu options and updated others
 Updated some setTimeOut values to try and get more consistent results in different browsers
 Updated Preview Window logic to capture document name better
 Updated code to fire with registerPluginCallback
 Updated search results to work with new registerPluginCallback
 Updated homesite to populate from the webtrends.ups.js file
 Updated link tracking to ensure WT.oss and WT.oss_r are not passed
 Updated search tracking to work on both big and small search
 Removed unnecessary functions from previous search
 Added code to avoid running when loaded in an iframe, to avoid issues with search results trying to run the code in the popup window.

 */
(function () {
    WebTrendsSP_intra = function (tag, plugin) {
        if (tag.config.debug == true) console.log("Registering sp.js");
        this.enabled = true;
        this.tagObj = tag;
        this.tagVersion = "3.0.50";

        // config support features
        this.cfg = {
            extraUserInfo: true,
            username: false,
            content: true,
            search: true,
            bread: true,
            webparts: true,
            documentMenuClick: true,
            list: true,
            allClick: true,  // new code
            webPartLimit: "40",  // new code
            debugmode: tag.config.debug
        };

        // page constants
        this.ids = {
            //searcheleid: "ResultCount", // unused anywhere
            breadid: "DeltaPlaceHolderPageTitleInTitleArea", // previously unused-updated breadcrumb code to use
            topleveluserid: "SuiteNavUserName",
            //searchBox: "ctl00_.*_csr_sbox", // new code
            searchBox: "DataProvider"
            //searchBox: "ctl00_PlaceHolderMain_ctl00_csr_sbox",
            //searchResult: "Result" // unused anywhere
        };
    }

    WebTrendsSP_intra.prototype.getCurrentCheckedItem = function () {
        var selectedDocs = [];
        try {
            var tables = document.getElementsByTagName("table");
            var docTables = [];
            if (tables) {
                for (var i = 0; i < tables.length; i++) {
                    if (tables[i].id.indexOf("DoclibView") >= 0) {
                        docTables.push(tables[i]);
                    }
                }
                for (var i = 0; i < docTables.length; i++) {
                    var rows = docTables[i].getElementsByTagName("tr");
                    for (var n = 0; n < rows.length; n++) {
                        if (rows[n].className.indexOf("itm-selected") >= 0) {
                            var docUrl = rows[n].childNodes[2].firstChild.firstChild.href;
                            selectedDocs.push(docUrl);
                        }
                    }
                }
            }
        }
        catch (e) {
            if (this.cfg.debugmode) {
                console.log("Error getting selected items.");
                console.log(e);
            }
        }
        return selectedDocs.join(";");
    }

    // why have this function?  It isn't used anywhere.
    WebTrendsSP_intra.prototype.getCurrentCheckedItemOrig = function () {
        var tds = document.getElementsByTagName("td");
        var checkedItems = "";
        if (tds) {
            for (var i = 0; i < tds.length; i++) {
                if (/^\<[^\<]*role=\"checkbox\".*/.test(tds[i].outerHTML) > 0 && /^\<[^\<]*aria-checked=\"true\".*/.test(tds[i].outerHTML)) {
                    if (tds[i]["nextSibling"]["nextSibling"].getElementsByTagName("a")[0]["href"]) {
                        checkedItems = checkedItems + tds[i]["nextSibling"]["nextSibling"].getElementsByTagName("a")[0]["href"] + ";";
                    }
                }
            }
        }
        if (checkedItems.charAt(checkedItems.length - 1) == ";") {
            checkedItems = checkedItems.substring(0, checkedItems.length - 1);
        }
        return checkedItems;
    }

    WebTrendsSP_intra.prototype.getElementsByClassName = function (className) {
        var hasClassName = new RegExp("(?:^|\\s)" + className + "(?:$|\\s)");
        var allElements = document.getElementsByTagName("*");
        var results = [];
        var i = 0;
        var element;
        for (i = 0; (element = allElements[i]) != null; i++) {
            var elementClass = element.className;
            if (elementClass && elementClass.indexOf(className) >= 0 && hasClassName.test(elementClass)) {
                results.push(element);
            }
        }
        return results;
    }

    WebTrendsSP_intra.prototype.waitForElement = function (elementId, timeout, callback) {
        var elem = document.getElementById(elementId);
        if (elem) {
            callback(elem);
        }
        else {
            //element not found, poll for it
            this.pollForElement(elementId, new Date().getTime(), timeout, callback);
        }
    }

    WebTrendsSP_intra.prototype.pollForElement = function (elementId, startTime, timeout, callback) {
        var self = this;
        if (new Date().getTime() - startTime > timeout) {
            //polling timeout
            callback();
        }
        else {
            window.setTimeout(function () {
                var elem = document.getElementById(elementId);
                if (elem) {
                    //found element, call the callback
                    callback(elem);
                }
                else {
                    //Element not found, try again
                    self.pollForElement(elementId, startTime, timeout, callback);
                }
            }, 200);
        }
    }

    WebTrendsSP_intra.prototype.addSearchResultListener = function () {
        if (this.cfg.debugmode) console.log("Search Results: Begin elementId Search");
        this.waitForElement(this.ids.searchBox, 5000, function (elem) {

            try {
                if (wt_sp_globals.pluginObj.cfg.debugmode) console.log("Search Results: Begin dataProvider Search");
                if (!elem) return; //if Search box not found
                var dataProvider = $getClientControl(elem) || Srch.U.getClientComponent(elem);
                // Callback function for when results are ready
                dataProvider.add_resultReady(function (dataProvider) {
                    var searchTerm = dataProvider.$2_3.k;
                    var resultCount = dataProvider.$9_3;
                    if (searchTerm && wt_sp_globals.lastSearchTerm == undefined) {
                        wt_sp_globals.lastSearchTerm = searchTerm;
                        wt_sp_globals.lastSearchCount = resultCount;
                        if (wt_sp_globals.pluginObj.cfg.debugmode) console.log("Search Results: Page View");
                        wt_sp_globals.pluginObj.searchRegisterPlugin();
                    } else if (searchTerm && searchTerm != wt_sp_globals.lastSearchTerm) {
                        wt_sp_globals.lastSearchTerm = searchTerm;
                        wt_sp_globals.lastSearchCount = resultCount;
                        if (wt_sp_globals.pluginObj.cfg.debugmode) console.log("Search Results: Re-search");
                        Webtrends.multiTrack();
                    } else if (searchTerm && searchTerm == wt_sp_globals.lastSearchTerm) {
                        if (wt_sp_globals.pluginObj.cfg.debugmode) console.log("Search Results: Same Term");
                    } else {
                        wt_sp_globals.lastSearchTerm = "Collection of Search Results Failed";
                        wt_sp_globals.lastSearchCount = 0;
                        if (wt_sp_globals.pluginObj.cfg.debugmode) console.log("Search Results: Collection Failed");
                        wt_sp_globals.pluginObj.searchRegisterPlugin();
                    }
                });
            }
            catch (ex) {
                if (wt_sp_globals.pluginObj.cfg.debugmode) console.log(ex);
                wt_sp_globals.lastSearchTerm = "Collection of Search Results Failed";
                wt_sp_globals.lastSearchCount = 0;
                wt_sp_globals.pluginObj.searchRegisterPlugin();
            }
        });
    }

    /*****************************************START NEW****************************************************/

    WebTrendsSP_intra.prototype.searchRegisterPlugin = function () {
        if (wt_sp_globals.pluginObj.cfg.debugmode) console.log("Callback: sp.js");
        wt_sp_globals.pluginObj.tagObj.registerPluginCallback("sp");
    }

    WebTrendsSP_intra.prototype.searchPageTest = function () {
        return true;
        var path = window.location.pathname.toLowerCase();
        var searchPage = Webtrends.dcss.dcsobj_0.config.searchPage.toLowerCase().split(",");
        var searchPageBlock = false;
        for (var page in searchPage) {
            if (path.indexOf(searchPage[page]) >= 0) {
                return true;
            }
        }
        return false;
    }

    WebTrendsSP_intra.prototype.isDocParam = function (dcsObject, options) {
        var el = options['element'] || {};
        var evt = options['event'] || {};
        var queryString = el.search.slice(1).split("&");
        for (var parIndex in queryString) {
            var parameter = queryString[parIndex].split("=");
            for (var extIndex in dcsObject._downloadtypes) {
                if (parameter[1].indexOf("." + dcsObject._downloadtypes[extIndex]) >= 0) {
                    return true;
                }
            }
        }
        return false;
    }
    /*****************************************END NEW******************************************************/
})();

var sp_intra_loader = function (tag, plugin) {
    var _sp_intra = new WebTrendsSP_intra(tag, plugin);
    window.wt_sp_globals.pluginObj = _sp_intra;
    var cfg = _sp_intra.cfg;
    var ids = _sp_intra.ids;
    var version = _sp_intra.tagVersion;

    /*****************************************START NEW****************************************************/

    function getURIArrFromHREF(href) {
        var a = href;
        var res = {};
        res.dcssip = href.substring(href.indexOf("//") + 2, href.indexOf(".com") + 4);
        res.dcsuri = href.substring(href.indexOf(".com") + 4, (href.indexOf("?") >= 0 ? href.indexOf("?") : (href.indexOf("#") >= 0 ? href.indexOf("#") : href.length)));
        res.dcsqry = href.substring(href.indexOf("?") >= 0 ? href.indexOf("?") + 1 : (href.indexOf("#") >= 0 ? href.indexOf("#") : href.length), (href.indexOf("#") >= 0 ? href.indexOf("#") : href.length));
        res.dcsref = window.location.href;
        return res;
    }

    /*
     // Enable to abort hits on some Preview Window Options
     function onPreviewWindowDiscard(dcsObject, options) {
     var el = options['element'] || {};
     var evt = options['event'] || {};
     var dcsuri;
     if (el.text.toUpperCase().indexOf("EDIT") >= 0) {
     dcsuri = el.pathname;
     if (dcsObject.dcsTypeMatch(dcsuri, dcsObject._downloadtypes)) return false;
     }
     else if (el.text.toUpperCase().indexOf("POST") >= 0) {
     dcsuri = el.href;
     dcsuri = dcsuri.substring(dcsuri.indexOf("('") + 2, dcsuri.lastIndexOf("')"));
     dcsuri = decodeURIComponent(dcsuri);
     dcsuri = dcsuri.substring(dcsuri.indexOf(".com") + 4, (dcsuri.indexOf("?") >= 0 ? dcsuri.indexOf("?") : dcsuri.length));
     if (dcsObject.dcsTypeMatch(dcsuri, dcsObject._downloadtypes)) return false;
     }
     else if (el.text.toUpperCase().indexOf("SEND") >= 0) {
     dcsuri = el.href;
     dcsuri = decodeURIComponent(dcsuri);
     dcsuri = dcsuri.substring(dcsuri.indexOf("<") + 1, dcsuri.indexOf(">"));
     dcsuri = dcsuri.substring(dcsuri.indexOf(".com") + 4, (dcsuri.indexOf("?") >= 0 ? dcsuri.indexOf("?") : dcsuri.length));
     if (dcsObject.dcsTypeMatch(dcsuri, dcsObject._downloadtypes)) return false;
     }
     else if (el.text.toUpperCase().indexOf("VIEW LIBRARY") >= 0) {
     //dcsuri = el.pathname;
     //if (dcsObject.dcsTypeMatch(dcsuri, dcsObject._downloadtypes)) return false;
     return true;
     }
     else if (el.text.toUpperCase().indexOf("OPEN") >= 0) {
     dcsuri = el.pathname;
     if (dcsObject.dcsTypeMatch(dcsuri, dcsObject._downloadtypes)) return false;
     }
     else if (el.text.toUpperCase().indexOf("FOLLOW") >= 0) {
     dcsuri = el.href;
     dcsuri = dcsuri.substring(dcsuri.indexOf("('") + 2, dcsuri.lastIndexOf("',"));
     while (dcsuri.indexOf("\\u002f") >= 0) { dcsuri = dcsuri.replace("\\u002f","/"); }
     dcsuri = dcsuri.substring(dcsuri.indexOf(".com") + 4, (dcsuri.indexOf("?") >= 0 ? dcsuri.indexOf("?") : dcsuri.length));
     if (dcsObject.dcsTypeMatch(dcsuri, dcsObject._downloadtypes)) return false;
     }
     return true;
     }
     */

    // Preview Window Menu Options
    function onPreviewWindowLink(dcsObject, multiTrackObject) {
        var el = multiTrackObject['element'] || {};
        var evt = multiTrackObject['event'] || {};
        dcsObject._autoEvtSetup(multiTrackObject);
        var classname;
        var href;
        var dcssip;
        var dcsuri;
        var dcsqry;
        var dcsref;
        var docName;
        var docAction;
        var ttl;
        var dl;
        var a;
        var res;

        if (el.text.toUpperCase().indexOf("EDIT") >= 0) {
            a = el.href;
            docAction = "ED";
        }
        else if (el.text.toUpperCase().indexOf("POST") >= 0) {
            a = el.href;
            if (a.indexOf("('") >= 0) {
                a = a.substring(a.indexOf("('") + 2, a.lastIndexOf("')"));
                a = decodeURIComponent(a);
            }
            docAction = "PO";
        }
        else if (el.text.toUpperCase().indexOf("SEND") >= 0) {
            a = el.href;
            a = decodeURIComponent(a);
            a = a.substring(a.indexOf("<") + 1, a.indexOf(">"));
            docAction = "SE";
        }
        if (el.text.toUpperCase().indexOf("VIEW LIBRARY") >= 0) {
            a = el.href;
            ttl = a.substring(a.lastIndexOf("/") + 1);
            docAction = "VL";
        }
        else if (el.text.toUpperCase().indexOf("OPEN") >= 0) {
            a = el.href;
            docAction = "DC";
        }
        else if (el.text.toUpperCase().indexOf("FOLLOW") >= 0) {
            a = el.href;
            a = a.substring(a.indexOf("('") + 2, a.lastIndexOf("',"));
            while (a.indexOf("\\u002f") >= 0) { a = a.replace("\\u002f","/"); }
            docAction = "F";
        }
        else if (el.text.toUpperCase().indexOf("SHARE") >= 0) {
            a = el.href;
            docAction = "SH";
        }
        res = getURIArrFromHREF(a);
        dcssip = res.dcssip;
        dcsuri = res.dcsuri;
        dcsqry = res.dcsqry;
        dcsref = res.dcsref;
        if (dcsObject.dcsTypeMatch(dcsuri, dcsObject._downloadtypes)) {
            for (var extIndex in dcsObject._downloadtypes) {
                if (dcsuri.indexOf(dcsObject._downloadtypes[extIndex]) >= 0) {
                    docName = dcsuri.substring(dcsuri.lastIndexOf("/") + 1);
                    break;
                }
            }
        } else if (el.href.indexOf(".aspx#") >= 0){
            docName = el.parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[0].childNodes[2].childNodes[1].innerHTML;
        } else if (el.href.toLowerCase().indexOf("allitems.aspx") >= 0) {
            docName = el.parentNode.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[5].innerHTML.trim();
            ttl = docName;
        } else {
            //docName = el.parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[1].childNodes[5].childNodes[1].childNodes[1].childNodes[3].innerHTML.trim();
            //ttl = docName;
            docName = dcssip + dcsuri;
            if (dcsqry != "") {
                docName += "?" + dcsqry;
            }
            ttl = docName = dcsuri.substring(dcsuri.lastIndexOf("/") + 1);
        }
        if (ttl === undefined) ttl = docName;
        dl = "SHP";

        multiTrackObject.argsa.push(
            "DCS.dcssip", dcssip,
            "DCS.dcsuri", dcsuri,
            "DCS.dcsqry", dcsqry,
            "DCS.dcsref", dcsref,
            "WT.ti", ttl,
            "WT.nv", el.className,
            "WT.dl", dl,
            "WT.shp_doc_a", docAction,
            "WT.shp_doc", docName,
            "WT.shp_doc_loc", "Preview Window",
            "WT.oss", "",
            "WT.oss_r",""
        );
    }

    // Direct Links in Results or Document Library
    function onClickBoundLink(event) {
        var el = event.target || event.srcElement;
        var classname;
        var dcssip;
        var dcsuri;
        var dcsqry;
        var dcsref;
        var docName;
        var docAction;
        var ttl;
        var dl;
        var res;
        var a;
        var queryString
        a = el.href;
        res = getURIArrFromHREF(a);
        dcssip = res.dcssip;
        dcsuri = res.dcsuri;
        dcsqry = res.dcsqry;
        dcsref = res.dcsref;
        if (dcsuri.toUpperCase().indexOf("WOPIFRAME") >=0) {
            queryString = dcsqry.split("&");
            for (var i = 0; i < queryString.length; i++) {
                if (queryString[i].split("=")[0] == "file") {
                    docName = queryString[i].split("=")[1];
                    break
                }
            }
        } else docName = dcsuri.substring(dcsuri.lastIndexOf("/") + 1);
        ttl = docName;
        docAction = "DC";
        dl = "SHP";
        Webtrends.multiTrack({
            argsa: [
                "DCS.dcssip", dcssip,
                "DCS.dcsuri", dcsuri,
                "DCS.dcsqry", dcsqry,
                "DCS.dcsref", dcsref,
                "WT.ti", docName,
                "WT.nv", el.className,
                "WT.dl", "20",
                "WT.shp_doc_a", "DC",
                "WT.shp_doc", docName,
                "WT.shp_doc_loc", "Direct Link",
                "WT.oss", "",
                "WT.oss_r",""
            ]
        });
    }
    /*****************************************END NEW******************************************************/

    Webtrends.addTransform(function (dcsObject, trackObject) {
        if (!trackObject.argsa)
            trackObject.argsa = [];

        // tag version
        if (version != "3.0.50") {
            trackObject.argsa.push("WT.sp_tv", version);
        }

        // extra user info from User Profile Service
        if (cfg.extraUserInfo) {
            if (typeof (wt_sp_user) != "undefined") {
                try {
                    if (cfg.debugmode) console.log("User Info: Collect UPS Data");
                    for (var prop in wt_sp_user) {
                        if (prop.indexOf("wterr_") != 0)
                            trackObject.argsa.push(prop, decodeURIComponent(wt_sp_user[prop]));
                    }
                }
                catch (ex) {
                    if (cfg.debugmode) {
                        console.log("Error occurs when get extra user info.");
                        console.log(ex);
                    }
                }
            }
        }

        // username
        if (cfg.username) {
            if (typeof (wt_sp_user) == "undefined") {
                try {
                    if (cfg.debugmode) console.log("Username: Collect from ElementId");
                    var userName = document.getElementById(ids.topleveluserid).innerHTML; // new code
                    userName = userName.replace("&amp;", "&"); // new code
                    trackObject.argsa.push("WT.shp_uname", userName); // new code
                }
                catch (ex) {
                    if (cfg.debugmode) {
                        console.log("Error occurs when get username.");
                        console.log(ex);
                    }
                }
            }
        }

        // content group
        if (cfg.content) {
            try {
                if (cfg.debugmode) console.log("Content Group: Collect from 'wt_sp_globals'");
                if (wt_sp_globals.title) {
                    trackObject.argsa.push("WT.cg_n", wt_sp_globals.title);
                }
            }
            catch (ex) {
                if (cfg.debugmode) {
                    console.log("Error occurs when get content group.");
                    console.log(ex);
                }
            }
        }

        // sub content group
        if ((document.title) && (cfg.content)) {
            try {
                if (cfg.debugmode) console.log("Sub-Content Group: Collect from page title");
                if (window.RegExp) {
                    var searchPageBlock = _sp_intra.searchPageTest(); // new code
                    if (searchPageBlock == false)	{	 // new code
                        var tire = new RegExp("^" + window.location.protocol + "//" + window.location.hostname + "\\s-\\s");
                        trackObject.argsa.push("WT.cg_s", document.title.replace(tire, ""));
                    }
                }
                else {
                    var searchPageBlock = _sp_intra.searchPageTest(); // new code
                    if (searchPageBlock == false)	{	 // new code
                        trackObject.argsa.push("WT.cg_s", document.title);
                    }
                }
            }
            catch (ex) {
                if (cfg.debugmode) {
                    console.log("Error occurs when get sub content group.");
                    console.log(ex);
                }
            }
        }
        // Breadcrumb
        if (cfg.bread) {

            try {
                if (cfg.debugmode) console.log("Breadcrumb: Collect from ElementId");
                var bcFinal = "";
                var titleSpan = document.getElementById(ids.breadid);
                if (titleSpan.getElementsByTagName("a").length == 0) {
                    var t = titleSpan.innerText ? titleSpan.innerText : titleSpan.textContent;
                    bcFinal = t.replace(/\s+/g, "") + ":";
                }
                else {
                    var nodes = titleSpan.getElementsByTagName("a");
                    if (nodes) {
                        for (var i = 0; i < nodes.length; i++) {
                            var te = nodes[i].innerText ? nodes[i].innerText : nodes[i].textContent;
                            if (te && te.replace(/\s+/g, "") != "") {
                                bcFinal += te + ":";
                            }
                        }
                    }
                }
                if (bcFinal != "") {
                    trackObject.argsa.push("WT.shp_bc", bcFinal.substr(0, bcFinal.length - 1));
                }
            }
            catch (ex) {
                if (cfg.debugmode) {
                    console.log("Error occurs when get breadcrumb.");
                    console.log(ex.message);
                    console.log(ex);
                }
            }
        }

        // webparts on page
        if (cfg.webparts) {
            try {
                if (cfg.debugmode) console.log("WebParts: Collect from ElementId");
                var wp_final = "";
                var divCollection = document.getElementsByTagName("span");
                if (divCollection.length > 0) {
                    for (var i = 0; i < divCollection.length; i++) {
                        var Temp = divCollection[i].getAttribute("id");
                        if (/WebPartT.*/.test(Temp)) {
                            var wp_pull = divCollection[i].getAttribute("title");
                            if (wp_pull.length > cfg.webPartLimit) {
                                wp_pull = wp_pull.substring(0,cfg.webPartLimit);
                                wp_pull = wp_pull.substring(0,wp_pull.lastIndexOf(" ")) + "...";
                            }
                            if (wp_pull == "") {wp_final = wp_final + "No Title Found for " + Temp + ";";}
                            else wp_final = wp_final + wp_pull + ";";
                        }
                    }
                    if (wp_final != "") {
                        trackObject.argsa.push("WT.shp_wpv", wp_final.substr(0, wp_final.length - 1));
                    }
                }
            }
            catch (ex) {
                if (cfg.debugmode) {
                    console.log("Error occurs when get webparts info.");
                    console.log(ex);
                }
            }
        }

        // list
        if (cfg.list) {
            try {
                if (cfg.debugmode) console.log("Lists: Collect from ElementId");
                var url = window.location;
                var action;

                if (url.search && url.search.indexOf("DiscussionParentId") > 0) {
                    action = "Reply";
                }
                else if (url.href) {
                    if (url.href.indexOf("DispForm.aspx") > 0) {
                        action = "ViewItem";
                    }
                    else if (url.href.indexOf("EditForm.aspx") > 0) {
                        action = "EditItem";
                    }
                    else if (url.href.indexOf("NewForm.aspx") > 0) {
                        action = "NewItem";
                    }
                }
                if (action) {
                    trackObject.argsa.push("WT.shp_list_item_action", action);
                    var listInfo = document.title.split("-");
                    trackObject.argsa.push("WT.shp_list", listInfo[0].replace(/\s+$/, ''));
                    if (listInfo.length > 1) {
                        trackObject.argsa.push("WT.shp_list_item", listInfo[1].replace(/^\s+/, ''));
                    }
                }
            }
            catch (ex) {
                if (cfg.debugmode) {
                    console.log("Error occurs when get list info.");
                    console.log(ex);
                }
            }
        }

        // Search
        if (_sp_intra.cfg.search) {
            if (cfg.debugmode) console.log("Search Results: Collect from Global Store");
            try {
                trackObject.argsa.push(
                    "WT.oss", window.wt_sp_globals.lastSearchTerm,
                    "WT.oss_r", window.wt_sp_globals.lastSearchCount.toString(),
                    "WT.ti", "Search Results",
                    "WT.cg_s", "Search"
                );
            }
            catch (ex) {
 //               console.log("Error occurs when get search info.");
 //               console.log(ex);
            }

        }

    }, "all");


    if (_sp_intra.cfg.search) {
        if(_sp_intra.searchPageTest() == true){
            window.wt_sp_globals.pluginObj.addSearchResultListener();
            if (cfg.debugmode) console.log("Search Results: searchPage=true");
        }
    }

    /*
     // Pop up menu
     setTimeout(function () {
     if (_sp_intra.getElementsByClassName("ms-srch-item").length > 0) {
     var classOuter = _sp_intra.getElementsByClassName("ms-srch-item");
     for (var i = 0; i < classOuter.length; i++) {
     classOuter[i].addEventListener('mouseover', onMouseBind);
     }
     }
     }, 6000);

     onMouseBind = function (event) {
     setTimeout(function () {
     var classInner = _sp_intra.getElementsByClassName("ms-calloutLink ms-uppercase");
     for (var i = 0; i < classInner.length; i++) {
     classInner[i].addEventListener('click', onPreviewWindowLink);
     }
     },1500);
     }
     */

    /*****************************************START NEW****************************************************/

    // All Link Tracking
    if (_sp_intra.cfg.allClick) {
        // Generic Link Tracking
        _sp_intra.tagObj.addSelector('a', {
            filter: function (dcsObject, options) {
                var el = options['element'] || {};
                var evt = options['event'] || {};
                if (dcsObject._isRightClick(evt)) return true;
                if (el.className == "ms-calloutLink ms-uppercase") return true;
                if (el.className == "ms-calloutLink ms-calloutLinkEnabled") return true;
                if (el.className == "ms-listlink ms-draggable") return true;
                if (el.href.toUpperCase().indexOf("WOPIFRAME") >= 0) return true;
                if (dcsObject.dcsTypeMatch(el.pathname, dcsObject._downloadtypes)) return true;
                if (window.location.href.toUpperCase().indexOf("THUMBNAILS.ASPX") >= 0 && el.className == "") return true;
                var docParam = false;
                if (el.search.length > 0) return _sp_intra.isDocParam(dcsObject, options);
                return false;
            },
            transform: function (dcsObject, multiTrackObject) {
                var el = multiTrackObject['element'] || {};
                var evt = multiTrackObject['event'] || {};
                dcsObject._autoEvtSetup(multiTrackObject);
                var res = dcsObject.getURIArrFromEvent(el);
                var ttl = dcsObject.getTTL(evt, el, res.dcsuri);
                var offsite = "";
                var destURL = "";
                if (ttl.indexOf("</") >= 0) ttl = ttl.replace(/<\/?[a-z][a-z0-9]*[^<>]*>/ig, "").replace(/[^\w\s\/\.\@\-\_\+\:\;\?\(\)]/gi, "").replace(/\s+/g, " ");
                if (ttl == "") ttl = "(No Title Found)";
                destURL = (res.dcssip + res.dcsuri).toLowerCase();
                homesite = dcsObject.config.homesite.toLowerCase().substring(dcsObject.config.homesite.indexOf("//")+ 2);
                offsite = (destURL.indexOf(homesite) == -1 && el.href.indexOf("javascript:") == -1 && el.href.indexOf("mailto:") == -1) ? "true" : "false";
                dl = (offsite == "true") ? "24" : "1";
                multiTrackObject.argsa.push(
                    "DCS.dcssip", res.dcssip,
                    "DCS.dcsuri", res.dcsuri,
                    "DCS.dcsqry", res.dcsqry,
                    "DCS.dcsref", window.location.href,
                    "WT.ti", "Link: " + ttl,
                    "WT.nv", dcsObject.dcsNavigation(evt, dcsObject.navigationtag),
                    "WT.dl", dl,
                    "WT.z_offsite", offsite,
                    "WT.oss", "",
                    "WT.oss_r",""
                );
            },
            finish: function (dcsObject, multiTrackObject) {
                dcsObject._autoEvtCleanup();
            }
        });
    }

    // Documents
    if (_sp_intra.cfg.documentMenuClick) {
        if (typeof _sp_intra.tagObj["_downloadtypes"] != 'undefined' && _sp_intra.tagObj["_downloadtypes"]) {

            // Bind to direct links in Document Library,
            // Necessary because only some file types work with the addSelector code
            setTimeout(function () {
                if (_sp_intra.getElementsByClassName("ms-listlink ms-draggable").length > 0) {
                    classname = _sp_intra.getElementsByClassName("ms-listlink ms-draggable");
                    for (var i = 0; i < classname.length; i++) {
                        classname[i].addEventListener('click', onClickBoundLink);
                    }
                }
            }, 4000);

            // Direct link of documents in WopiFrame,
            // May be redundant now that addSelector works on query string, and onClickBoundLink works on doc library files.
            _sp_intra.tagObj.addSelector('a', {
                filter: function (dcsObject, options) {
                    var el = options['element'] || {};
                    var evt = options['event'] || {};
                    if (dcsObject._isRightClick(evt)) return true;
                    if (el.className == "ms-calloutLink ms-uppercase") return true;
                    if (el.className == "ms-calloutLink ms-calloutLinkEnabled") return true;
                    if (el.className == "ms-listlink ms-draggable") return true;
                    if (el.href.toUpperCase().indexOf("WOPIFRAME") == -1) return true;
                    return false;
                },
                transform: function (dcsObject, multiTrackObject) {
                    var el = multiTrackObject['element'] || {};
                    var evt = multiTrackObject['event'] || {};
                    dcsObject._autoEvtSetup(multiTrackObject);
                    var res = dcsObject.getURIArrFromEvent(el);
                    var ttl = dcsObject.getTTL(evt, el, res.dcsuri);
                    var docName = "";
                    var docExt = "";
                    var qryString = res.dcsqry.split("&");
                    for (var i = 0; i < qryString.length; i++) {
                        if (qryString[i].split("=")[0] == "file") {
                            docName = qryString[i].split("=")[1];
                            docExt = qryString[i].split("=")[1].split('.').pop();
                            break
                        }
                    }
                    multiTrackObject.argsa.push(
                        "DCS.dcssip", res.dcssip,
                        "DCS.dcsuri", res.dcsuri,
                        "DCS.dcsqry", res.dcsqry,
                        "DCS.dcsref", window.location.href,
                        "WT.ti", docName,
                        "WT.nv", dcsObject.dcsNavigation(evt, dcsObject.navigationtag),
                        "WT.dl", "20",
                        "WT.shp_doc_a", "DC",
                        "WT.shp_doc", docName,
                        "WT.shp_doc_loc", "Direct Link",
                        "WT.oss", "",
                        "WT.oss_r",""
                    );
                },
                finish: function (dcsObject, multiTrackObject) {
                    dcsObject._autoEvtCleanup();
                }
            });

            // Direct link of documents in uri stem.
            _sp_intra.tagObj.addSelector('a', {
                filter: function (dcsObject, options) {
                    var el = options['element'] || {};
                    var evt = options['event'] || {};
                    if (dcsObject._isRightClick(evt)) return true;
                    if (el.className == "ms-calloutLink ms-uppercase") return true;
                    if (el.className == "ms-calloutLink ms-calloutLinkEnabled") return true;
                    if (el.className == "ms-listlink ms-draggable") return true;
                    if (!dcsObject.dcsTypeMatch(el.pathname, dcsObject._downloadtypes)) return true;
                    return false;
                },
                transform: function (dcsObject, multiTrackObject) {
                    var el = multiTrackObject['element'] || {};
                    var evt = multiTrackObject['event'] || {};
                    dcsObject._autoEvtSetup(multiTrackObject);
                    var res = dcsObject.getURIArrFromEvent(el);
                    var ttl = dcsObject.getTTL(evt, el, res.dcsuri);
                    var docName = "";
                    for (var extIndex in dcsObject._downloadtypes) {
                        if (res.dcsuri.indexOf(dcsObject._downloadtypes[extIndex]) >= 0) {
                            docName = res.dcsuri.substring(res.dcsuri.lastIndexOf("/") + 1);
                            break;
                        }
                    }
                    multiTrackObject.argsa.push(
                        "DCS.dcssip", res.dcssip,
                        "DCS.dcsuri", res.dcsuri,
                        "DCS.dcsqry", res.dcsqry,
                        "DCS.dcsref", window.location.href,
                        "WT.ti", docName,
                        "WT.nv", dcsObject.dcsNavigation(evt, dcsObject.navigationtag),
                        "WT.dl", "20",
                        "WT.shp_doc_a", "DC",
                        "WT.shp_doc", docName,
                        "WT.shp_doc_loc", "Direct Link",
                        "WT.oss", "",
                        "WT.oss_r",""
                    );
                },
                finish: function (dcsObject, multiTrackObject) {
                    dcsObject._autoEvtCleanup();
                }
            });

            // Direct link of documents in the query string.
            _sp_intra.tagObj.addSelector('a', {
                filter: function (dcsObject, options) {
                    var el = options['element'] || {};
                    var evt = options['event'] || {};
                    if (dcsObject._isRightClick(evt)) return true;
                    if (!_sp_intra.isDocParam(dcsObject, options)) return true;
                    if (el.className == "ms-calloutLink ms-uppercase") return true;
                    if (el.className == "ms-calloutLink ms-calloutLinkEnabled") return true;
                    if (el.className == "ms-listlink ms-draggable") return true;
                    if (el.href.toUpperCase().indexOf("WOPIFRAME") >= 0) return true;
                    return false;
                },
                transform: function (dcsObject, multiTrackObject) {
                    var el = multiTrackObject['element'] || {};
                    var evt = multiTrackObject['event'] || {};
                    dcsObject._autoEvtSetup(multiTrackObject);
                    var res = dcsObject.getURIArrFromEvent(el);
                    var ttl = dcsObject.getTTL(evt, el, res.dcsuri);
                    var docName = "";
                    var queryString = res.dcsqry.split("&");
                    for (var parIndex in queryString) {
                        var parameter = queryString[parIndex].split("=");
                        for (var extIndex in dcsObject._downloadtypes) {
                            if (parameter[1].indexOf("." + dcsObject._downloadtypes[extIndex]) >= 0) {
                                docName = parameter[1].substring(parameter[1].lastIndexOf("/") + 1);
                                break;
                            }
                        }
                        if (docName != "") break;
                    }
                    multiTrackObject.argsa.push(
                        "DCS.dcssip", res.dcssip,
                        "DCS.dcsuri", res.dcsuri,
                        "DCS.dcsqry", res.dcsqry,
                        "DCS.dcsref", window.location.href,
                        "WT.ti", docName,
                        "WT.nv", dcsObject.dcsNavigation(evt, dcsObject.navigationtag),
                        "WT.dl", "20",
                        "WT.shp_doc_a", "DC",
                        "WT.shp_doc", docName,
                        "WT.shp_doc_loc", "Direct Link",
                        "WT.oss", "",
                        "WT.oss_r",""
                    );
                },
                finish: function (dcsObject, multiTrackObject) {
                    dcsObject._autoEvtCleanup();
                }
            });

            // Search Results Preview Window Links
            _sp_intra.tagObj.addSelector('a', {
                filter: function (dcsObject, options) {
                    var el = options['element'] || {};
                    var evt = options['event'] || {};
                    if (el.className != "ms-calloutLink ms-uppercase") return true;
                    //if (onPreviewWindowDiscard(dcsObject, options)) return true; // enable to filter out some Preview Window Menu options
                    return false;
                },
                transform: function (dcsObject, multiTrackObject) {
                    var el = multiTrackObject['element'] || {};
                    var evt = multiTrackObject['event'] || {};
                    dcsObject._autoEvtSetup(multiTrackObject);
                    onPreviewWindowLink(dcsObject, multiTrackObject);
                },
                finish: function (dcsObject, multiTrackObject) {
                    dcsObject._autoEvtCleanup();
                }
            });

            // Document Library Preview Window Links
            _sp_intra.tagObj.addSelector('a', {
                filter: function (dcsObject, options) {
                    var el = options['element'] || {};
                    var evt = options['event'] || {};
                    if (el.className != "ms-calloutLink ms-calloutLinkEnabled") return true;
                    //if (onPreviewWindowDiscard(dcsObject, options)) return true; // enable to filter out some Preview Window Menu options
                    return false;
                },
                transform: function (dcsObject, multiTrackObject) {
                    var el = multiTrackObject['element'] || {};
                    var evt = multiTrackObject['event'] || {};
                    dcsObject._autoEvtSetup(multiTrackObject);
                    onPreviewWindowLink(dcsObject, multiTrackObject);
                },
                finish: function (dcsObject, multiTrackObject) {
                    dcsObject._autoEvtCleanup();
                }
            });
        }
    }


    /*
     // iframed download tracking from sp_O365.js code that seems to be unnecessary now
     if (typeof $ != "undefined") {
     $("a.ms-listlink, a.ms-srch-item-link").on("mousedown", function (c) {
     var d = $(this).closest("A")[0];
     var f = d.href.split("&");
     for (var g = 0; g < f.length; g++) {
     if (f[g].split("=")[0] == "file") {

     // add document file name
     var docName = "";
     docName = f[g].substring(5);
     // end document file name

     Webtrends.multiTrack({
     argsa: [
     "WT.ti", "Download:" + f[g].split("=")[1],
     "WT.dl", "20",
     "WT.shp_doc_a", "DC",
     "WT.shp_doc", docName,
     "WT.shp_doc_ext", f[g].split("=")[1].split('.').pop()
     ]
     });
     break
     }
     }
     })
     }
     */
    /*****************************************END NEW******************************************************/

        //Download from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Copies.Download"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "DC");
        }
    })

    //Check Out from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.EditCheckout.CheckOut"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "CO");
        },
        dcsDelay: 50
    })

    //Discard Check Out from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.EditCheckout.DiscardCheckOut"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "DCO");
        }
    })

    //Check In from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.EditCheckout.CheckIn"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "CI");
        }

    })

    //Delete from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.Delete"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "D");
        }
    })

    //View Properties from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.ViewProperties"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "VP");
        }
    })

    //Edit Properties from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.EditProperties"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "EP");
        }
    })

    //Send to Other Location from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Document.All.SendTo.Menu.Items.OtherLocation"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "OL");
        }
    })

    //Create Document Workspace from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Document.All.SendTo.Menu.Items.CreateDocumentWorkspace"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "CD");
        }
    })

    //Upload Document from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.New.AddDocument"],a[id^="idHomePageNewDocument"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            // this function was missing the following compared to all the others?
            //var currentItems = _sp_intra.getCurrentCheckedItem();
            //var docLocation = document.createElement('a');
            //docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", "Upload Document", "WT.dl", "SHP", "WT.shp_doc_a", "UD");
        }
    })

    //New Document from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.New.NewDocument"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            // this function was missing the following compared to all the others?
            //var currentItems = _sp_intra.getCurrentCheckedItem();
            //var docLocation = document.createElement('a');
            //docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", "New Document", "WT.dl", "SHP", "WT.shp_doc_a", "ND");
        }
    })

    //Edit Document from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.EditCheckout.EditDocument"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "ED");
        }
    })

    //Version History from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.ViewVersions"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "V");
        }
    })

    //Send Email from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Share.EmailItemLink"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "SE");
        }
    })

    //Publish from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Workflow.Publish"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "PI");
        }
    })

    //Unpublish from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Workflow.Unpublish"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "UP");
        }
    })

    //Manage Permissions from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.ManagePermissions"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "MP");
        }
    })

    //Manage Copies from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Copies.ManageCopies"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "EC");
        }
    })

    //Go to source from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Copies.GoToSourceItem"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "GS");
        }
    })

    //View Workflows from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Workflow.ViewWorkflows"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "W");
        }
    })

    //Share from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Share.ShareItem"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "SH");
        }
    })

    //Popularity Trends from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Share.ViewAnalyticsReport"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "VR");
        }
    })

    //Follow from Ribbon
    _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Share.Follow"]', {
        filter: function (dcsObject, options) {
            return (options.element.className.indexOf("disabled") >= 0);
        },
        transform: function (dcsObject, multiTrackObject) {
            var currentItems = _sp_intra.getCurrentCheckedItem();
            var docLocation = document.createElement('a');
            docLocation.href = currentItems;
            multiTrackObject.argsa.push("WT.ti", currentItems.split("/")[currentItems.split("/").length-1], "DCS.dcsuri",docLocation.pathname.replace(/^([^\/])/,'/$1'), "WT.dl", "SHP", "WT.shp_doc_a", "F");
        }
    })

    //For pop up menu
    var currentItem = "";

    /* ExecuteOrDelayUntilScriptLoaded does not appear to be working properly in SharePoint 2013.
     * "Execute" works in that if the specified script has loaded, the provided function will be executed.
     *
     * "DelayUntilScriptLoaded" does not work. It identifies that the specified script has not been loaded
     * but doesn't execute when it does load.
     *
     * Using a basic timeout temporarily to allow for validation of the functionality until we can figure out
     * an alternative
     */

    //ExecuteOrDelayUntilScriptLoaded(function () 
    window.setTimeout(function () {

        //This method gets called when the first popup is loaded.
        //We hook into it in order to determine, and save, the 
        //document being acted on.
        if (typeof (ShowMenuForTrOuter) != 'undefined' && !ShowMenuForTrOuter.isWT) {
            var origFunc = window.ShowMenuForTrOuter;
            window.ShowMenuForTrOuter = function (a, b, c) {

                /*
                 //Document Name
                 var docItem = a.parentNode.parentNode.childNodes[2];
                 //Trim whitespace
                 docItem = docName.innerText.replace(/^\s+/, '').replace(/\s+$/, '');
                 */

                //Doc URL
                var docItem;
                try {
                    docItem = a.parentNode.parentNode.childNodes[2].firstChild.firstChild.href;
                }
                catch(e) {
                    docItem = a.parentNode.parentNode.childNodes[1].firstChild.firstChild.href;
                }
                window.wt_sp_globals.currentDoc = docItem;
                origFunc(a, b, c);
            }
            window.ShowMenuForTrOuter.isWT = true;
        }

        if (typeof (ExecuteOnClick) == 'function' && !ExecuteOnClick.isWT) {
            var origExecuteOnClick = ExecuteOnClick;
            window.ExecuteOnClick = function (b, a) {

                var action = "", titlePrefix = "";
                var executeOrigInCallBack = false;
                var delay = 0;

                //Download a Copy from ECB Menu
                if (b.toString().indexOf("DownloadACopy") >= 0) {
                    titlePrefix = "Download a Copy:";
                    action = "DC";
                    executeOrigInCallBack = false;
                }
                //View Properties from ECB Menu
                else if (b.toString().indexOf("EditItem2") >= 0) {
                    titlePrefix = "View Properties:";
                    action = "VP";
                    executeOrigInCallBack = false;
                }
                //Edit Properties from ECB Menu
                else if (b.toString().indexOf("EditItemWithCheckoutAlert") >= 0) {
                    titlePrefix = "Edit Properties:";
                    action = "EP";
                    executeOrigInCallBack = false;
                }
                //Check Out from ECB Menu
                else if (b.toString().indexOf("CheckoutSingleItemFromECB") >= 0) {
                    titlePrefix = "Check Out:";
                    action = "CO";
                    executeOrigInCallBack = false;
                    delay = 10;
                }
                //Check In from ECB Menu
                else if (b.toString().indexOf("CheckInSingleItemFromECB") >= 0) {
                    titlePrefix = "Check In:";
                    action = "CI";
                    executeOrigInCallBack = false;
                }
                //Discard Checkout from ECB Menu
                else if (b.toString().indexOf("UnDoCheckOutwithNotification") >= 0) {
                    titlePrefix = "Undo Checkout:";
                    action = "DCO";
                    executeOrigInCallBack = false;
                }
                //Download and Create Document Workspace from ECB Menu
                else if (b.toString().indexOf("STSNavigate") >= 0) {
                    //Was it a download, create document workspace, or workflows
                    if (b.indexOf("download.aspx") >= 0) {
                        titlePrefix = "Download:";
                        action = "DC";
                        executeOrigInCallBack = true;
                    }
                    else if (b.indexOf("createws.aspx") >= 0) {
                        titlePrefix = "Create Document Workspace:";
                        action = "CD";
                        executeOrigInCallBack = true;
                    }
                    else if (b.indexOf("Workflow.aspx") >= 0) {
                        titlePrefix = "Workflows:";
                        action = "W";
                        executeOrigInCallBack = true;
                    }
                    else if (b.toString().indexOf("Compliance_Details") >=0) {
                        titlePrefix = "Compliance_Details:";
                        action = "CD";
                        executeOrigInCallBack = false;
                    }
                    else {
                        origExecuteOnClick(b, a);
                        return;
                    }
                }
                //Send to Other Location from ECB Menu
                else if (b.toString().indexOf("NavigateToSendToOtherLocationV4") >= 0) {
                    titlePrefix = "Send To Other Location:";
                    action = "OL";
                    executeOrigInCallBack = false;
                }
                //Send to Email from ECB Menu
                else if (b.toString().indexOf("SendEmail") >= 0) {
                    action = "SE";
                    executeOrigInCallBack = false;
                }
                //Manage Permissions from ECB Menu
                else if (b.toString().indexOf("EnsureScriptFunc('sharing.js'") >= 0) {
                    titlePrefix = "Manage Permissions:";
                    action = "MP";
                    executeOrigInCallBack = true;
                }
                //Delete from ECB Menu
                else if (b.toString().indexOf("DeleteDocLibItem") >= 0) {
                    titlePrefix = "Delete:";
                    action = "D";
                    executeOrigInCallBack = false;
                }
                //Edit document from ECB Menu
                else if (b.toString().indexOf("editDocumentWithProgID2") >= 0) {
                    titlePrefix = "Edit Document:";
                    action = "ED";
                    executeOrigInCallBack = false;
                }
                // View in Browser from ECB Menu   
                else if (b.toString().indexOf("View_in_Browser") >=0) {
                    titlePrefix = "View in Browser:";
                    action = "VB";
                    executeOrigInCallBack = false;
                }
                // Version History from ECB Menu   
                else if (b.toString().indexOf("Versions") >=0) {
                    titlePrefix = "Version History:";
                    action = "V";
                    executeOrigInCallBack = false;
                }
                // Follow from ECB Menu   
                else if (b.toString().indexOf("followingcommon") >=0) {
                    titlePrefix = "Follow:";
                    action = "F";
                    executeOrigInCallBack = false;
                }
                //Something else from ECB Menu
                else {
                    origExecuteOnClick(b, a);
                    return;
                }
                var dcsCallback, postFunction;
                if (executeOrigInCallBack) {
                    dcsCallback = function (dcs, options) {
                        origExecuteOnClick(b, a);
                    };
                    postFunction = function (b, a) { };
                }
                else {
                    dcsCallback = function (dcs, options) { };
                    postFunction = origExecuteOnClick;
                }

                if (typeof(wt_sp_globals.currentDoc) != 'undefined') {
                    /*************************************************
                     *
                     * JDN - Removed descriptive text prepended to document
                     * name in WT.ti so that WT.ti could be used as a dimension
                     * JDN - Passing URI of document as dcsuri
                     *
                     **************************************************/
                    var docLocation = document.createElement('a');
                    docLocation.href = wt_sp_globals.currentDoc;
                    var docName = docLocation.href; // NEW CODE
                    docName = docName.substring(docName.lastIndexOf("/") + 1); // NEW CODE
                    Webtrends.multiTrack({
                        args: {
                            "DCS.dcsuri": docLocation.pathname.replace(/^([^\/])/, '/$1'),
                            "DCS.dcsref": window.location.href,
                            "WT.ti": wt_sp_globals.currentDoc.split("/")[wt_sp_globals.currentDoc.split("/").length - 1],
                            "WT.dl": "SHP",
                            "WT.shp_doc_a": action,
                            "WT.shp_doc": docName, // NEW CODE
                            "WT.shp_doc_loc": "ECB Menu"
                        },
                        dcsDelay: 500,
                        callback: dcsCallback
                    });
                    /*
                     Webtrends.multiTrack({

                     args: {
                     "WT.ti": titlePrefix + wt_sp_globals.currentDoc,
                     "WT.dl": "SHP",
                     "WT.shp_doc_a": action
                     },
                     dcsDelay: delay,
                     callback: dcsCallback
                     });
                     */
                };
                postFunction(b, a);
            }
            window.ExecuteOnClick.isWT = true;
        }
    }, 5000);
    if(!_sp_intra.searchPageTest())	{
        if (tag.config.debug) console.log("Callback: sp.js")
        tag.registerPluginCallback("sp");
    }
}
if (window.self === window.top) Webtrends.registerPlugin('sp', sp_intra_loader);
