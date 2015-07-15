/**
 * Created by clarkj on 5/30/14.
 */
//
// right click tracking
//
// there are a number of SharePoint objects that you right click to activate
// this captures all right click events
function mondelez_custom_loader(dcs, options) {

// Kraft breadcrumb customization
// Kraft webpart customizations
    dcs.addTransform(function (dcs, o) {
        // Kraft Custom Breadcrubms
        // <!-- Customization SWAP POSITION of class(s4-title s4-lp)-(BreadCrumbBar) and id(s4-topheader2)-SiteHomeLink BAR -->
        try {
            var bcFinal = "";
            bcTrail = {
                Root: "a.s4-breadcrumbRootNode",
                Current: "SPAN.s4-breadcrumbCurrentNode",
                Title: "SPAN#ctl00_PlaceHolderPageTitleInTitleArea_ctl01_ctl00"
            };
            for (var bcLevel in bcTrail) {
                var n = document.querySelectorAll(bcTrail[bcLevel])[0];
                if (n) {
                    var t = n.innerText ? n.innerText : n.textContent;
                    bcFinal = bcFinal + t.replace(/^\s+|\s+$/g, "") + ";";
                }
            }

            if (bcFinal != "") {
                dcs.WT["shp_bc"] = bcFinal.substr(0, bcFinal.length - 1);
            }

            // breadcrumb format #2
            //
            var bcFinal = "";
            var titleSpan = document.getElementById('breadcrumb');
            if (titleSpan.getElementsByTagName("span").length == 0) {
                var t = titleSpan.innerText ? titleSpan.innerText : titleSpan.textContent;
                bcFinal = t.replace(/\s+/g, "") + ":";
            }
            else {
                var nodes = titleSpan.getElementsByTagName("span")[0].getElementsByTagName("span");
                if (nodes) {
                    for (var i = 0; i < nodes.length; i++) {
                        var te = nodes[i]["innerText"] ? nodes[i]["innerText"] : nodes[i].textContent;
                        if (te && te.replace(/\s+/g, "") != "" && nodes[i].firstChild.nodeName == 'A') {
                            bcFinal = bcFinal + te + ":";
                        }
                    }
                }
            }
            if (bcFinal != "") {
                dcs.WT["shp_bc"] = bcFinal.substr(0, bcFinal.length - 1);
            }


        } catch (e) {
        }
    }, "all");
}
Webtrends.registerPlugin('mondelez_custom', mondelez_custom_loader);