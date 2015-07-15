/*
Copyright (c) 2013 Webtrends, Inc.
SharePoint 2013 Plugin v3.0.50
*/
(function () {
    WebTrendsSP_intra = function (tag, plugin) {
        this.enabled = true;
        this.tagObj = tag;
        this.tagVersion = "3.0.50";

        // config support features
        this.cfg = {
            extraUserInfo: true,
            username: true,
            content: true,
            search: true,
            bread: true,
            webparts: true,
            documentMenuClick: true,
            list: true,
            debugmode: false
        };

        // page constants
        this.ids = {
            searcheleid: "ResultCount",
            breadid: "ctl00_PlaceHolderPageTitleInTitleArea_ctl01_ctl00",
            topleveluserid: "DeltaSuiteBarRight",
            searchBox: "ctl00_PlaceHolderMain_ctl00_csr_SearchLink",
            searchResult: "Result"
        };
    }
    WebTrendsSP_intra.prototype.getCurrentCheckedItem = function () {
        var selectedDocs = [];
        try {
            var tables = document.getElementsByTagName("table");
            var docTables = [];
            if (tables) {
                for (var i = 0; i < tables.length; i++) {
                    if (tables[i].id.indexOf("DoclibView") > 0) {
                        docTables.push(tables[i]);
                    }
                }
                for (var i = 0; i < docTables.length; i++) {
                    var rows = docTables[i].getElementsByTagName("tr");
                    for (var n = 0; n < rows.length; n++) {
                        if (rows[n].className.indexOf("itm-selected") > 0) {
                            var docUrl = rows[n].childNodes[2].firstChild.firstChild.href;
                            selectedDocs.push(docUrl);
                        }
                    }
                }
            }
        }
        catch (e) {
            if (cfg.debugmode) {
                console.log("Erorr getting selected items.");
                console.log(ex);
            }
        }
        return selectedDocs.join(";");
    }
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
            if (elementClass && elementClass.indexOf(className) != -1 && hasClassName.test(elementClass)) {
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

        if (!this.cfg.search) {
            return;
        }

        this.waitForElement(this.ids.searchBox, 3000, function (elem) {
            try {
                //Search box not found
                if (!elem)
                    return;

                var search = $getClientControl(elem);
                var dataProvider = search.$1i_3[0];

                //Callback function for when results are ready
                dataProvider.add_resultReady(function (dataProvider) {
                    var searchTerm = dataProvider.$2_3.k;
                    var resultCount = dataProvider.$9_3;

                    if (searchTerm && searchTerm != window.wt_sp_globals.lastSearchTerm) {
                        Webtrends.multiTrack({
                            args: {
                                "WT.oss": searchTerm,
                                "WT.oss_r": resultCount.toString()
                            }
                        });
                        window.wt_sp_globals.lastSearchTerm = "";
                    }
                });

                //Its possible that search results are ready before this executes. If so, send the event
                //dataProvider.hasOwnProperty("$9_3") appears to be the only way to determine
                //if the search results are actually ready. Prior to be readying it will be in
                //the prototype so we can't just look for the presence of it.
                var searchTerm = dataProvider.$2_3.k;
                var resultCount = dataProvider.$9_3;
                if (searchTerm && dataProvider.hasOwnProperty("$9_3")) {
                    Webtrends.multiTrack({
                        args: {
                            "WT.oss": searchTerm,
                            "WT.oss_r": resultCount.toString()
                        }
                    });
                    window.wt_sp_globals.lastSearchTerm = searchTerm;
                }
            }
            catch (ex) {
            }
        });
    }
})();

var sp_intra_loader = function (tag, plugin) {

    var _sp_intra = new WebTrendsSP_intra(tag, plugin);
    window.wt_sp_globals.pluginObj = _sp_intra;

    var cfg = _sp_intra.cfg;
    var ids = _sp_intra.ids;
    var version = _sp_intra.tagVersion;

    Webtrends.addTransform(function (dcsObject, trackObject) {

        if (!trackObject.argsa)
            trackObject.argsa = [];

        //tag version
        if (version != "3.0.50") {
            trackObject.argsa.push("WT.sp_tv", version);
        }

        //extra user info---------------------------
        if (cfg.extraUserInfo) {
            if (typeof (wt_sp_user) != "undefined") {
                try {
                	for (var prop in wt_sp_user) {
                		if (prop.indexOf("wterr_") != 0)
							trackObject.argsa.push(prop, decodeURIComponent(wt_sp_user[prop]));
                    }
                }
                catch (ex) {
                    if (cfg.debugmode) {
                        console.log("Erorr occurs when get extra user info.");
                        console.log(ex);
                    }
                }
            }
        }

        //username
        if (cfg.username) {
            try {
                var userName = document.getElementById(ids.topleveluserid).childNodes[1].childNodes[2].childNodes[0].firstChild;
                trackObject.argsa.push("WT.shp_uname", userName.data);
            }
            catch (ex) {
                if (cfg.debugmode) {
                    console.log("Erorr occurs when get username.");
                    console.log(ex);
                }
            }
        }

        // content group
        if (cfg.content) {
            try {
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
                if (window.RegExp) {
                    var tire = new RegExp("^" + window.location.protocol + "//" + window.location.hostname + "\\s-\\s");
                    trackObject.argsa.push("WT.cg_s", document.title.replace(tire, ""));
                }
                else {
                    trackObject.argsa.push("WT.cg_s", document.title);
                }
            }
            catch (ex) {
                if (cfg.debugmode) {
                    console.log("Error occurs when get sub content group.");
                    console.log(ex);
                }
            }
        }

        //Breadcrumb
        if (cfg.bread) {
            try {
                var bcFinal = "";
                var titleSpan = document.getElementById(ids.breadid);
                if (titleSpan.getElementsByTagName("span").length == 0) {
                    var t = titleSpan.innerText ? titleSpan.innerText : titleSpan.textContent;
                    bcFinal = t.replace(/\s+/g, "") + ":";
                }
                else {
                    var nodes = titleSpan.getElementsByTagName("span")[0].getElementsByTagName("span");
                    if (nodes) {
                        for (var i = 0; i < nodes.length; i++) {
                            var te = nodes[i]["innerText"] ? nodes[i]["innerText"] : nodes[i].textContent;
                            if (te && te.replace(/\s+/g, "") != "" ) {

                                bcFinal = bcFinal + te + ":";
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
                var wp_final = "";
                var divCollection = document.getElementsByTagName("span");
                if (divCollection.length > 0) {
                    for (var i = 0; i < divCollection.length; i++) {
                        var Temp = divCollection[i].getAttribute("id");
                        if (/WebPartT.*/.test(Temp)) {
                            var wp_pull = divCollection[i].getAttribute("title");
                            wp_final = wp_final + wp_pull + ";";
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

    }, "all");

    if (_sp_intra.cfg.search) {
        window.wt_sp_globals.pluginObj.addSearchResultListener();
    }

    if (_sp_intra.cfg.documentMenuClick) {

        //Download
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Copies.Download"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Download:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "DC");
            }
        })

        //Check Out
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.EditCheckout.CheckOut"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Check Out:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "CO");
            },
            dcsDelay: 50
        })

        //Discard Check Out
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.EditCheckout.DiscardCheckOut"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Undo Check Out:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "DCO");
            }
        })

        //Check In
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.EditCheckout.CheckIn"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Check In:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "CI");
            }

        })

        //Delete
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.Delete"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Delete:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "D");
            }
        })

        //View Properties
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.ViewProperties"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "View Properties:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "VP");
            }
        })

        //Edit Properties
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.EditProperties"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Edit Properties:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "EP");
            }
        })

        //Send to Other Location
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Document.All.SendTo.Menu.Items.OtherLocation"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Send To Other Location:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "OL");
            }
        })

        //Create Document Workspace
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Document.All.SendTo.Menu.Items.CreateDocumentWorkspace"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Create Document Workspace:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "CD");
            }
        })

        //Upload Document
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.New.AddDocument"],a[id^="idHomePageNewDocument"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                multiTrackObject.argsa.push("WT.ti", "Upload Document", "WT.dl", "SHP", "WT.shp_doc_a", "UD");
            }
        })

        //New Document
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.New.NewDocument"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                multiTrackObject.argsa.push("WT.ti", "New Document", "WT.dl", "SHP", "WT.shp_doc_a", "ND");
            }
        })

        //Edit Document
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.EditCheckout.EditDocument"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Edit Document:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "ED");
            }
        })

        //Version History
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.ViewVersions"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Version History:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "V");
            }
        })

        //Send Email 
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Share.EmailItemLink"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "E-mail a Link:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "SE");
            }
        })

        //Publish
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Workflow.Publish"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Publish:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "PI");
            }
        })

        //Unpublish
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Workflow.Unpublish"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Unpublish:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "UP");
            }
        })

        //Manage Permissions
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Manage.ManagePermissions"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Document Permissions:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "MP");
            }
        })

        //Manage Copies
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Copies.ManageCopies"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Manage Copies:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "EC");
            }
        })

        //Go to source
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Copies.GoToSourceItem"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Go To Source:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "GS");
            }
        })

        //View Workflows
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Workflow.ViewWorkflows"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Workflows:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "W");
            }
        })

        //Share
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Share.ShareItem"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Share:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "SH");
            }
        })

        //Popularity Trends
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Share.ViewAnalyticsReport"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Popularity Trends:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "VR");
            }
        })

        //Follow
        _sp_intra.tagObj.addSelector('a[id^="Ribbon.Documents.Share.Follow"]', {
            filter: function (dcsObject, options) {
                return (options.element.className.indexOf("disabled") >= 0);
            },
            transform: function (dcsObject, multiTrackObject) {
                var currentItems = _sp_intra.getCurrentCheckedItem();
                multiTrackObject.argsa.push("WT.ti", "Follow:" + currentItems, "WT.dl", "SHP", "WT.shp_doc_a", "F");
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
                    var docItem = a.parentNode.parentNode.childNodes[2].firstChild.firstChild.href;
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
                    //View Properties
                    if (b.toString().indexOf("EditItem2") == 0) {
                        titlePrefix = "View Properties:";
                        action = "VP";
                        executeOrigInCallBack = false;
                    }
                        //Edit Properties
                    else if (b.toString().indexOf("EditItemWithCheckoutAlert") == 0) {
                        titlePrefix = "Edit Properties:";
                        action = "EP";
                        executeOrigInCallBack = false;
                    }
                        //Check Out
                    else if (b.toString().indexOf("CheckoutSingleItemFromECB") == 0) {
                        titlePrefix = "Check Out:";
                        action = "CO";
                        executeOrigInCallBack = false;
                        delay = 10;
                    }
                        //Check In
                    else if (b.toString().indexOf("CheckInSingleItemFromECB") == 0) {
                        titlePrefix = "Check In:";
                        action = "CI";
                        executeOrigInCallBack = false;
                    }
                        //Discard Checkout
                    else if (b.toString().indexOf("UnDoCheckOutwithNotification") == 0) {
                        titlePrefix = "Undo Checkout:";
                        action = "DCO";
                        executeOrigInCallBack = false;
                    }
                        //Download and Create Document Workspace
                    else if (b.toString().indexOf("STSNavigate") == 0) {
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
                        else {
                            origExecuteOnClick(b, a);
                            return;
                        }
                    }
                        //Send to Other Location
                    else if (b.toString().indexOf("NavigateToSendToOtherLocationV4") == 0) {
                        titlePrefix = "Send To Other Location:";
                        action = "OL";
                        executeOrigInCallBack = false;
                    }
                        //Send to Email
                    else if (b.toString().indexOf("SendEmail") >= 0) {
                        action = "SE";
                        executeOrigInCallBack = false;
                    }
                        //Manage Permissions
                    else if (b.toString().indexOf("EnsureScriptFunc('sharing.js'") == 0) {
                        titlePrefix = "Manage Permissions:";
                        action = "MP";
                        executeOrigInCallBack = true;
                    }
                        //Delete
                    else if (b.toString().indexOf("DeleteDocLibItem") == 0) {
                        titlePrefix = "Delete:";
                        action = "D";
                        executeOrigInCallBack = false;
                    }
                        //Edit document
                    else if (b.toString().indexOf("editDocumentWithProgID2") == 0) {
                        titlePrefix = "Edit Document:";
                        action = "ED";
                        executeOrigInCallBack = false;
                    }
                        //Something else
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

                    Webtrends.multiTrack({
                        args: {
                            "WT.ti": titlePrefix + wt_sp_globals.currentDoc,
                            "WT.dl": "SHP",
                            "WT.shp_doc_a": action
                        },
                        dcsDelay: delay,
                        callback: dcsCallback
                    });

                    postFunction(b, a);
                }
                window.ExecuteOnClick.isWT = true;
            }

        }, 1000);
    }
}
Webtrends.registerPlugin('sp', sp_intra_loader);