(function wpouierioweprjwherl() {

    var enabled = true;

    function executeWhenJqueryIsReady(funcToExecute) {
        if(enabled == true)
            typeof ($) !== 'undefined' ? funcToExecute() : setTimeout(function () { executeWhenJqueryIsReady(funcToExecute); }, 300);
    }

    executeWhenJqueryIsReady(function () {
        SP.SOD.executeFunc('sp.js', 'SP.ClientContext', null);
        ExecuteOrDelayUntilScriptLoaded(function () {
            var urls = {
                "https://collaboration.mdlz.com/sites/effectivequalitydiscussions": "https://collaboration.mdlz.com/sites/EQDs",
                "https://collaboration.mdlz.com/sites/qudos": " https://collaboration.mdlz.com/sites/qudosawards",
                "https://collaboration.mdlz.com/sites/globalqualityhub": "https://collaboration.mdlz.com/sites/quality"
            };

            var redirUrl = urls[_spPageContextInfo.siteAbsoluteUrl.toLowerCase()];

            if (redirUrl) {
                var msg = $('<div style="margin-top: 20px;font-weight: bold;">This site has been moved to ' + redirUrl + '. <br><br>You will be redirected to the new location in 10 seconds.</div>')[0];

                SP.UI.ModalDialog.showModalDialog({
                    html: msg,
                    title: "Site Moved",
                    allowMaximize: false,
                    showClose: false,
                    width: 350,
                    height: 150
                });

                (function timer_redirectFunc() {
                    {
                        if (timer == 10) {
                            window.location = redirUrl;
                        }
                        else {
                            timer++;
                            //console.log(timer);
                            setTimeout(timer_redirectFunc, 1000);
                        }
                    }

                })();
            }
        }, 'sp.js');
        
        var timer = 0;


        
    });
})();