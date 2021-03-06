﻿<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="newsbweb.aspx.cs" Inherits="Provisioning.UX.AppWeb.Pages.SubSite.newsbweb" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Create New Subsite</title>
    <%--<link href="../../Styles/site.css" rel="stylesheet" type="text/css" />
     <script src="//ajax.aspnetcdn.com/ajax/jQuery/jquery-2.1.1.min.js" type="text/javascript" ></script>      
     <script src="../../Scripts/chromeloader.js?rev=1" type="text/javascript"></script>--%>
    <script type="text/javascript" src="/assets/scripts/bundle-subsite.js"></script>
    <link href="/assets/styles/bundle-subsite.css" rel="stylesheet" />
</head>
<body style="display: none; overflow: auto;">
    <form id="form1" runat="server">
        <div id="divSPChrome"></div>
        <div class="page">
            <script type="text/javascript">
                $(function () {
                    $('#cancel_button').click(function () {
                        window.location = $('#Url').val();
                    });
                });
            </script>
            <asp:ScriptManager ID="scriptManager" runat="server" EnableCdn="True" AsyncPostBackTimeout="300" />
            <asp:UpdateProgress ID="progress" runat="server" AssociatedUpdatePanelID="mainPanel" DynamicLayout="true">
                <ProgressTemplate>
                    <div id="divWaitingPanel" style="position: absolute; z-index: 3; background: rgb(255, 255, 255); width: 100%; bottom: 0px; top: 0px;">
                        <div style="top: 40%; position: absolute; left: 50%; margin-left: -150px;">
                            <img alt="Working on it" src="data:image/gif;base64,R0lGODlhEAAQAIAAAFLOQv///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCgABACwJAAIAAgACAAACAoRRACH5BAUKAAEALAwABQACAAIAAAIChFEAIfkEBQoAAQAsDAAJAAIAAgAAAgKEUQAh+QQFCgABACwJAAwAAgACAAACAoRRACH5BAUKAAEALAUADAACAAIAAAIChFEAIfkEBQoAAQAsAgAJAAIAAgAAAgKEUQAh+QQFCgABACwCAAUAAgACAAACAoRRACH5BAkKAAEALAIAAgAMAAwAAAINjAFne8kPo5y02ouzLQAh+QQJCgABACwCAAIADAAMAAACF4wBphvID1uCyNEZM7Ov4v1p0hGOZlAAACH5BAkKAAEALAIAAgAMAAwAAAIUjAGmG8gPW4qS2rscRPp1rH3H1BUAIfkECQoAAQAsAgACAAkADAAAAhGMAaaX64peiLJa6rCVFHdQAAAh+QQJCgABACwCAAIABQAMAAACDYwBFqiX3mJjUM63QAEAIfkECQoAAQAsAgACAAUACQAAAgqMARaol95iY9AUACH5BAkKAAEALAIAAgAFAAUAAAIHjAEWqJeuCgAh+QQJCgABACwFAAIAAgACAAACAoRRADs=" style="width: 32px; height: 32px;" />
                            <span class="ms-accentText" style="font-size: 36px;">&nbsp;Working on it...</span>
                        </div>
                    </div>
                </ProgressTemplate>
            </asp:UpdateProgress>
            <asp:UpdatePanel ID="mainPanel" runat="server" ChildrenAsTriggers="true">
                <ContentTemplate>
                    <div style="margin: 10px 10px; margin-top: -65px;">
                        <img src="https://www.mondelezinternational.com/-/media/Mondelez/Images/mdlz-logo.png" style="width: 200px;">
                        <fieldset>
                            <legend>Create New Subsite</legend>
                            <br />
                            <br />
                            <table id="SiteInfoTable" width="15%">
                                <tbody>
                                    <tr>
                                        <td>
                                            <asp:Panel runat="server" ID="pnlErrMsg" Visible="false"
                                                Style="color: red; padding: 5px; border: 1px solid silver; border-radius: 5px; background: lightyellow;">
                                                <asp:Literal runat="server" ID="ltlErrMsg"></asp:Literal>
                                            </asp:Panel>

                                        </td>
                                    </tr>
                                    <tr>
                                        <!-- Title and Description -->
                                        <td class="ms-sectionheader" style="padding-top: 4px;" height="22" valign="top">
                                            <h3 class="ms-standardheader ms-inputformheader">Title and Description
                                            </h3>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td valign="top" style="padding-left: 150px;">

                                            <h3 class="ms-standardheader ms-inputformheader">Title:</h3>
                                            <div class="ms-input">
                                                <asp:TextBox ID="txtTitle" runat="server" CssClass="ms-fullWidth" onkeyup="javascript:txtTitleChanged();"></asp:TextBox>
                                            </div>
                                            <br />
                                            <h3 class="ms-standardheader ms-inputformheader">Description:</h3>
                                            <div class="ms-input">
                                                <asp:TextBox ID="txtDescription" runat="server" CssClass="ms-fullWidth" TextMode="MultiLine" Rows="2"></asp:TextBox>
                                            </div>
                                            <br />
                                            <h3 class="ms-standardheader ms-inputformheader">Language:</h3>
                                            <div class="ms-input">
                                                <asp:DropDownList runat="server" ID="ddlLanguages" AutoPostBack="true" CssClass="ms-fullWidth" OnSelectedIndexChanged="ddlLanguages_SelectedIndexChanged" DataValueField="Value" DataTextField="Key">
                                                </asp:DropDownList>
                                            </div>
                                            <br />
                                            <br />
                                        </td>
                                    </tr>
                                    <tr>
                                        <!-- Web Site Address -->
                                        <td class="ms-sectionheader" style="padding-top: 4px;" height="22" valign="top">
                                            <h3 class="ms-standardheader ms-inputformheader">Web Site Address
                                            </h3>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-left: 150px;" valign="top">
                                            <h3 class="ms-standardheader ms-inputformheader">URL name:</h3>
                                            <div style="float: left; white-space: nowrap; padding-bottom: 10px; padding-left: 15px; width: 450px;">
                                                <div style="width: 320px; font-size: 13px; float: left; padding-top: 2px; white-space: normal; word-break: break-all;" id="divBasePath">
                                                    <asp:Label ID="lblBasePath" runat="server"></asp:Label>
                                                </div>
                                                <div class="ms-input" style="width: 130px; float: left;">
                                                    <asp:TextBox ID="txtUrl" runat="server" CssClass="ms-fullWidth"></asp:TextBox>
                                                </div>
                                            </div>
                                            <br />

                                            <br />
                                            <br />
                                        </td>
                                    </tr>
                                    <tr>
                                        <!-- Template -->
                                        <td class="ms-sectionheader" style="padding-top: 4px;" height="22" valign="top">
                                            <h3 class="ms-standardheader ms-inputformheader">Template Selection
                                            </h3>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-left: 150px;" valign="top">
                                            <h3 class="ms-standardheader ms-inputformheader">Select Template:</h3>
                                            <div>

                                                <div class="ms-input" style="padding-left: 15px;">
                                                    <asp:ListBox ID="listSites" runat="server" CssClass="ms-fullWidth" DataTextField="Title" DataValueField="Title"></asp:ListBox>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input id="Url" name="Url" type="hidden" value="" runat="server" />
                                            <br />
                                            <br />
                                            <div id="divButtons" style="float: right;">
                                                <asp:Button ID="btnCreate" runat="server" Text="Create" CssClass="ms-ButtonHeightWidth" OnClick="btnCreate_Click" />
                                                <asp:Button ID="btnCancel" runat="server" Text="Cancel" CssClass="ms-ButtonHeightWidth" OnClick="btnCancel_Click" />
                                            </div>
                                            <div class="clear"></div>
                                        </td>
                                    </tr>
                                </tbody>

                            </table>

                        </fieldset>
                </ContentTemplate>
            </asp:UpdatePanel>
        </div>
    </form>
    <div id="MicrosoftOnlineRequired">
        <div style="float: left">
            <%--<img style="position:relative;top:4px;"  src="../../images/MicrosoftLogo.png" alt="©2015 Microsoft Corporation"/>--%>
            <span id="copyright">&copy; <%= DateTime.Now.ToString("yyyy") %> Mondelez International</span>&nbsp;&nbsp;&nbsp;
            <a href="https://collaboration.mdlz.com/sites/productivityhub/sharepoint/Pages/SLK.aspx">IQU University</a> |
            <a href="https://collaboration.mdlz.com/sites/productivityhub/sharepoint/Pages/TrainingVideos.aspx">Training Videos</a> |
            
        </div>
        <div style="float: right">
            <%--<a id="supportUrl" href="https://yoururl/" target="_blank">Community</a> |
            <a id="feedbackUrl" href="https://yoururl" target="_blank">Feedback</a>--%>
            For Technical Assistance Contact SharePoint Support at <u><a href="mailto:DLKNAMSSharePointSupport@mdlz.com">DLKNAMSSharePointSupport@mdlz.com</a></u>
        </div>
        <div class="clear"></div>
    </div>
</body>
</html>
