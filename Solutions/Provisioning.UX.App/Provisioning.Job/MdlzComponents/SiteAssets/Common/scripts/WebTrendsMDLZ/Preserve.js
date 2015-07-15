/*
 Preserver Hit Data

 This plugin stores hit data inside localStorage or Cookie  and if the data is sent clears the storage
 or sends it on the next hit

 Version / mod history
 0.0.9B  8/21/2012

 Multitrack usage looks like:

 Webtrends.multiTrack({
 argsa: wtArgs,
 callback:function(e,f){ preserve.validataImg(e,this.argsa);}
 });

 */
(function (WT) {
    preserve = {

        QueueInit: function (dcs, options) {
            //
            // extend the dcs callback timeout timer to allow time for mobile data to move
            // we could also use a ping technique to see what the turn-time is. store it in localStorage
            // and dynamically set this number at the expense of an additional hit
            //
            if (dcs.config ) dcs.config.dcsdelay = 300;
            preserve.Flush(dcs)
        },
        //  Save the hit if it did not go through
        validataImg: function (dcs, argsa) {
            // if the image transfer was not successful the width and height will be 0
            // and the complete flag will be true
            // save these hits
            if (!dcs.images) {
                // if they are using the min tag, search for the image objects
                for (n in dcs) {
                    if (typeof dcs[n] == 'object') {
                        if (dcs[n][0] && dcs[n][0].tagName == 'IMG') {
                            dcs.images = dcs[n];
                        }
                    }
                }
            }

            for (var c = 0; c < dcs.images.length; c++) {
                var i = dcs.images[c];
                // look for hits that did not go through
                if (i.width == 0 && i.complete) {
                    preserve.Store(i.src);
                }
            }
        },

        //  if we have data, flush it by re-creating the image calls
        Flush: function (dcsObject) {
            if (localStorage && localStorage['WTtag']) {
                tag = localStorage['WTtag'];
                localStorage.removeItem('WTtag')
            } else {
                tag = decodeURI(dcsObject.dcsGetCookie('WTtag'));
                document.cookie = "WTtag=;path=/;expires=" + (new Date(new Date().getTime() - 1)).toGMTString();
            }
            if (tag && tag.length > 0) {
                var tagVals = tag.split('&');
                var tagSend = [];
                for (var o = 0; o < tagVals.length; o++) {
                    if (tagVals[o] == "WTEOR") {
                        var P = tagSend.join('&');
                        preserve.dcsCreateImage(P);
                        var tagSend = [];
                    } else {
                        tagSend.push(tagVals[o]);
                    }
                }
            }
        },
        // store the data into localStorage
        // we could also put it into a cookie at this point
        Store: function (hit) {
            // stringify the parameters
            // add in our End Of Record marker
            hit = hit + '&WTEOR';
            if (localStorage) {
                if (localStorage['WTtag']) {
                    localStorage['WTtag'] = localStorage['WTtag'] + '&' + hit;
                } else {
                    localStorage['WTtag'] = hit;
                }
            } else {
                // remove our keys to be safe
                tag = encodeURL(tag);
                if (dcsObject.dcsGetCookie('WTtag'))
                    tag = dcsObject.dcsGetCookie('WTtag') + '&' + tag;
                else
                    document.cookie = 'WTtag=' + tag + "; path=/";


            }
        },
        // Webtrends  create image function
        dcsCreateImage: function (dcsSrc) {
            if (document.images) {
                var img = new Image();
                img.src = dcsSrc;
            }
        }
    };
    Webtrends.registerPlugin("Preserve", function (dcs, options) {
        preserve.QueueInit(dcs, options)
    });
})();

