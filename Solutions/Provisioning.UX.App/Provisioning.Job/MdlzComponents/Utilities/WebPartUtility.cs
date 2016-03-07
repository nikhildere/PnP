using Microsoft.SharePoint.Client;
using OfficeDevPnP.Core.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Provisioning.Job.MdlzComponents.Utilities
{
    public class WebPartUtility
    {
        public static void AddWikiHomePageListViewWebparts(Web w, List<WikiPageWebPart> listDetails)
        {
            try
            {
                var ctx = w.Context;
                ctx.Load(w, x => x.RootFolder, x => x.ServerRelativeUrl);
                ctx.ExecuteQuery();

                string strListViewWebPartSchemaXml = @"<?xml version=""1.0"" encoding=""utf-8"" ?>
                                                    <webParts>
                                                      <webPart xmlns=""http://schemas.microsoft.com/WebPart/v3"">
                                                        <metaData>
                                                          <type name=""Microsoft.SharePoint.WebPartPages.XsltListViewWebPart, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c"" />
                                                          <importErrorMessage>Cannot import this Web Part.</importErrorMessage>
                                                        </metaData>
                                                        <data>
                                                          <properties>
                                                            <property name=""ListUrl"" type=""string"">{0}</property>
                                                            <property name=""MissingAssembly"" type=""string"">Cannot import this Web Part.</property>
                                                          </properties>
                                                        </data>
                                                      </webPart>
                                                    </webParts>";

                string serverRelativeHomepageUrl = UrlUtility.Combine(w.ServerRelativeUrl, w.RootFolder.WelcomePage);

                foreach (var item in listDetails)
                {
                    AddWikiWebPart(w, serverRelativeHomepageUrl, strListViewWebPartSchemaXml, item.Row, item.Col, item.ListTitle, item.ViewFields);
                }
            }
            catch (Exception)
            {

                throw;
            }

        }

        private static void AddWikiWebPart(Web w, string serverRelativeHomepageUrl, string webpartXml, int row, int col, string listTitle, string[] fieldsInView)
        {
            try
            {
                List l = w.Lists.GetByTitle(listTitle);
                w.Context.Load(l, x => x.RootFolder);
                w.Context.ExecuteQuery();

                w.AddWebPartToWikiPage(serverRelativeHomepageUrl, new OfficeDevPnP.Core.Entities.WebPartEntity { WebPartXml = string.Format(webpartXml, l.RootFolder.Name) }, row, col, true);

                if (fieldsInView != null && fieldsInView.Length > 0)
                {
                    var viewQuery = l.Views.Where(x => x.Hidden);
                    w.Context.LoadQuery(l.Views.Where(x => x.Hidden));

                    if (viewQuery != null)
                    {
                        var viewHidd = viewQuery.First();
                        viewHidd.ViewFields.RemoveAll();

                        foreach (string item in fieldsInView)
                        {
                            viewHidd.ViewFields.Add(item);
                        }
                        viewHidd.RowLimit = 10;
                        w.Context.ExecuteQuery();
                    }
                }
            }
            catch (Exception)
            {

                throw;
            }
        }


    }

    public class WikiPageWebPart
    {
        public int Row { get; set; }
        public int Col { get; set; }
        public string ListTitle { get; set; }
        public string[] ViewFields { get; set; }

        public WikiPageWebPart(int _col, int _row, string _listTitle, string[] _viewFields)
        {
            Row = _row;
            Col = _col;
            ListTitle = _listTitle;
            ViewFields = _viewFields;
        }
    }
}
