<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="Provisioning.UX.AppWeb.Default" Async="true"  %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" data-ng-app="app">
<head>
    <meta charset="utf-8"/> 
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Create It - Site Provisioning</title>
    <script type="text/javascript" src="../assets/scripts/bundle.js?v=2.2"></script>    
    <link type="text/css" rel="stylesheet" href="../assets/styles/bundle.css?v=2.2"/>
</head>
<body>    
    <%--<div class="navBar">
        <div class="ms-fontWeight-semilight" style="padding: 8px 0px 0px 15px; color: white; font-size: 22px;">Office 365</div>
        <div class="NavLine"></div><div class="appTitle ms-fontWeight-semilight">Site Provisioning</div>
   </div>--%> 
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
    <asp:Literal runat="server" ID="ltlInitialData" ClientIDMode="Static"></asp:Literal>
</body>
</html>
