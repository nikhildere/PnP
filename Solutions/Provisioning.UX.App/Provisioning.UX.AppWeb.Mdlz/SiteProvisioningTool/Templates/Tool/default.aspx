<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" data-ng-app="app">
<head>
    <meta charset="utf-8"/> 
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Create It - Site Provisioning</title>
    <script type="text/javascript" src="../../SiteAssets/SiteProvisioningTool/Bundle/scripts/bundle.js"></script>    
    <link rel="stylesheet" href="../../SiteAssets/SiteProvisioningTool/Bundle/styles/bundle.css" />
</head>
<body>    
   <div id="divSPChrome"></div>           
        
    <!-- Include the Wizard View -->
    <div data-ng-include="'shell.html'"></div>

    <script type="text/javascript">
        $(document).on('click', '.panel-heading span.clickable', function (e) {
            var $this = $(this);
            if (!$this.hasClass('panel-collapsed')) {
                $this.parents('.panel').find('.panel-body').slideUp();
                $this.addClass('panel-collapsed');
                $this.find('i').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
            } else {
                $this.parents('.panel').find('.panel-body').slideDown();
                $this.removeClass('panel-collapsed');
                $this.find('i').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
            }
        })
    </script>
</body>
</html>