<%@ Page Language="C#" MasterPageFile="~masterurl/default.master" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage,Microsoft.SharePoint,Version=16.0.0.0,Culture=neutral,PublicKeyToken=71e9bce111e9429c" meta:webpartpageexpansion="full" meta:progid="SharePoint.WebPartPage.Document" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<%@ Assembly Name="Microsoft.Web.CommandUI, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<asp:Content ContentPlaceHolderID="PlaceHolderPageTitle" runat="server">
    <SharePoint:EncodedLiteral runat="server" text="<%$Resources:wss,multipages_homelink_text%>" EncodeMethod="HtmlEncode" />
    - 
	<SharePoint:ProjectProperty Property="Title" runat="server" />
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
    <SharePoint:ProjectProperty Property="Title" runat="server" />
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">

    <meta name="CollaborationServer" content="SharePoint Team Web Site" />
    <SharePoint:StyleBlock runat="server">   

.s4-nothome {
    display:none;
}
.ms-bodyareaframe {
    padding: 0px;
}
</SharePoint:StyleBlock>
    <SharePoint:ScriptBlock runat="server">

    var navBarHelpOverrideKey = "WSSEndUser";

	</SharePoint:ScriptBlock>
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderSearchArea" runat="server">

    <SharePoint:DelegateControl runat="server"
        ControlId="SmallSearchInputBox" />

</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderLeftActions" runat="server">
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderPageDescription" runat="server">
    <SharePoint:ProjectProperty Property="Description" runat="server" />
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
    <table cellspacing="0" border="0" width="100%">
        <tr>
            <td>
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 5px 10px 10px 10px;">
                    <tr>

                        <td valign="top" width="100%" colspan="2">
                            <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" ID="Top" Title="loc:Top">
                                <zonetemplate></zonetemplate>
                            </WebPartPages:WebPartZone>
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" width="65%">
                            <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" ID="Left" Title="loc:Left">
                                <zonetemplate>
				</zonetemplate>
                            </WebPartPages:WebPartZone>
                        </td>
                        <td valign="top" width="35%">
                            <WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" ID="Right" Title="loc:Right">
                                <zonetemplate>

				</zonetemplate>
                            </WebPartPages:WebPartZone>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</asp:Content>

