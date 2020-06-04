    (function () {
        
        var dbStatusColl =
            [
                { DbName: 'Nintex_Content_01', Status: 'Completed' },
                { DbName: 'Nintex_Content_01', Status: 'Completed' },
                { DbName: 'Nintex_Content_02', Status: 'Completed' },
                { DbName: 'Nintex_Content_03', Status: 'Completed' },
                { DbName: 'Nintex_Content_04', Status: 'Completed' },
                { DbName: 'Team_XLContent_12', Status: 'Completed' },
                { DbName: 'Team_XLContent_26', Status: 'Completed' },
                { DbName: 'Team_XLContent_35', Status: 'Completed' },
                { DbName: 'Team_XLContent_40', Status: 'Completed' },
                { DbName: 'Team_XLContent_41', Status: 'Completed' },
                { DbName: 'Team_XLContent_49', Status: 'Completed' },
                { DbName: 'Team_XLContent_Custom', Status: 'Completed' }
            ]

        /*******************************************************
         *Status Options:
         *1. Pending
         *2. WIP
         *3. Completed
         *  
         * DO NOT MAKE CHANGES TO CODE FORM THIS LINE ONWARDS
         * 
         * *****************************************************/
        var isAzure = window.location.hostname.toString().toLowerCase() == 'nwsites.mdlz.com';

        var msgConstantsHtml =
        {
            clickHereLink: ' <a href="https://collaboration.mdlz.com/sites/NintexTeamSiteMigration/Shared Documents/Migration Approach for Nintex enabled Team site-PS.pptx?Web=1">click here</a>',
            nintexSupportTeamMailtoLink: '<a href="mailto:DLNintexSupport@mdlz.com">DLNintexSupport@mdlz.com</a>'
        }

        var msgConstants =
        {
            PreMigrationOnAzure: 'DO NOT use this team site: it has been created by the SharePoint team for testing purposes ONLY. This site will be deleted on July 15th in preparation for the movement of the Nintex workflow sites. For more information' + msgConstantsHtml.clickHereLink,    
            PostMigrationOnAzureDuringMigration: 'This team site is under maintenance, please do not use it until informed . For any technical support please write to ' + msgConstantsHtml.nintexSupportTeamMailtoLink+' along with the web address of the site and details of the issue',
            PostMigrationOnAzureOnRelease: 'This team site is ready to use and under dedicated hypercare support until the end of August. For any technical support please write to ' + msgConstantsHtml.nintexSupportTeamMailtoLink+' along with the web address of the site and details of the issue',
            PreMigrationOnSpod: 'All team sites containing Nintex workflows, including this one, are moving to a new location and will be read-only between August 8th and August 12th. For more information, please refer the documentation' + msgConstantsHtml.clickHereLink,
            PostMigrationOnSpod: 'This team site has been migrated to a new location <a href="{NewUrl}">{NewUrl}</a>. This old site will be deleted between 21st Sept - 24th Sept 2018, Kindly update all your bookmark with new location ASAP'
        };

        function executeNotice() {
            var msg = GetMessageToShow();

            if (msg)
            { 
                $(function () { 
                    if(!$('html').hasClass('ms-dialog'))
                        $('<div style="background: #fff19d !important;padding: 15px;text-align: center;"><span class="ms-status-body" id="status_1_body"><div style="top: 5px; width: 20px; height: 20px; overflow: hidden; margin-right: 10px; display: inline-block; position: relative;"><img class="ms-status-iconImg2" style="left: -45px; top: -180px; position: absolute;" src="/_layouts/15/images/spcommon.png"></div><b style="margin-right: 10px;">Migration Notice:</b>'+ msg +'</span></div>').insertBefore('#suiteBar')
                });     
            } 
        }

        var jQueryCtr = 0;
        function executeWhenJqueryIsReady(funcToExecute) {
            if(typeof ($) !== 'undefined')
                funcToExecute() 
             else
            {
                if(jQueryCtr++ > 10)
                {
                    loadJQuery();
                    jQueryCtr = 0;
                    executeWhenJqueryIsReady(funcToExecute);
                }
                else
                {
                    setTimeout(function () { executeWhenJqueryIsReady(funcToExecute); }, 300);
                } 
            }
        }

        function loadJQuery()
        {
            var head = document.getElementsByTagName('head')[0];
            var scriptRef = document.createElement("script");
            scriptRef.type = "text/javascript";
            scriptRef.src = "/SiteAssets/vNext/Common/scripts/jquery-1.11.0.min.js"
            head.appendChild(scriptRef);
        }

        function GetMessageToShow() { 
            var cSiteUrl = _spPageContextInfo.siteAbsoluteUrl.toLowerCase();
            cSiteUrl = isAzure ? cSiteUrl.replace('nwsites.mdlz.com', 'collaboration.mdlz.com') : cSiteUrl;
            var cSiteDbName = dbSiteColl.filter(function (x) { return x.Site.toLowerCase() == cSiteUrl })[0].DbName.toLowerCase();
            var cSiteDbStatus = dbStatusColl.filter(function (x) { return x.DbName.toLowerCase() == cSiteDbName })[0].Status.toLowerCase();
            var messageToReturn;

            switch (cSiteDbStatus)
            {
                case "completed":
                    messageToReturn = isAzure ? msgConstants.PostMigrationOnAzureOnRelease : msgConstants.PostMigrationOnSpod
                                                                                                .replace('{NewUrl}', window.location.href.replace(window.location.hostname, 'nwsites.mdlz.com'))
                                                                                                .replace('{NewUrl}', window.location.href.replace(window.location.hostname, 'nwsites.mdlz.com'));
                    break;
                case "pending":
                    messageToReturn = isAzure ? msgConstants.PreMigrationOnAzure : msgConstants.PreMigrationOnSpod;
                    break;
                case "wip":
                    messageToReturn = msgConstants.PostMigrationOnAzureDuringMigration;
                    break;
            }
            return messageToReturn;
        }

        executeWhenJqueryIsReady(executeNotice);

        var dbSiteColl =
            [
                { Site: 'https://collaboration.mdlz.com/sites/GlobalEnterpriseSystems', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MBSBPOVDI', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/DATAPROCESSINGEEMEAMASTERDATA', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/pilotplant', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/KFRussiaRoutingPortal2010', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/SpecificationAgreementReportTeamsite', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/NACapabilitiesTest', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/WiSEApprovals', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/CorporateQualityCapabilityTool', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/DATAPROCESSINGAPMASTERDATA', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/NARockford', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MDLZGlobalEA', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/COUPAAdministration', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/LearningManagementTeam', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/ETLICR', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/ContractManagementRepository', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/LatinAmericaEngineering', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/BICustomerMasterRequests', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MasterDataBiscuits', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/FotoDelExito', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/InfosysPOCSite', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/InvoiceForms', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/LAEngineeringCapabilities2', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/AppropriationRequestFiles', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/LACapExandCapabilityTeam', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/ebenefits', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/EAMIS', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/HumanResourcesLeaversHub', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/EEMEAMASTERDATASUPPORT', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/GlobalBiscuit', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/AutoStoreMiltonKeynes', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/CompendiaChangeRequests', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/AutoStoreSkelmersdale', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/KronosPayrollSiteAuditlog', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MondelezCorporateTax', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MasterDataGumsandCandies', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MDBPB', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MasterDataVSA', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MasterDataDryMix', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/TradeTermsInvoiceProcess', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MDBPProductsMaterials', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/QualityandCompliance', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/SupplierManagement', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/NominaCARICAM', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MDBPBOM', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MasterDataCheeseKeS', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/MoveSite', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/ISCAcademy', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/KFEU Obsolesence-WriteOff', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/SalesForceTicketingFrance', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/CRSSCREPORTING', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/ContratosAnuais', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/LAEngineeringCapabilities', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/GCDocMgmtSysANZ', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/CAOManufacturing', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/AppropriationRequestForm', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/AmericasProductionChangeControl', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/Exceptions', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/LAChocolate', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/LatinAmericaSustainabilityStatement', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/Level1IIMStepupCard', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/BYOCSite', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/SAF', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/MasterDatacwbConfectionery', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/MBSMKTGSUP', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/SAPSecurity', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/MDBPPricesandDiscounts', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/ScheduleIntelligence', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/MDBPVendorManagement', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/QualityIssuetrackingsiteEUBusinessquality', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/MDBPCustomer', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/ProcurementShareServices', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/NAMDDataCollectionSite', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/SouthernCone', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/MBSPerformanceManagement', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/MBSESChangeControl', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/MBSContractGovernance', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/MDBPCostRelease', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/PlantChangeRequests', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/middleware', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/SecurityKronosCardLogs', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/NordicSalesSystemsAccess', DbName: 'Nintex_Content_02' },
                { Site: 'https://collaboration.mdlz.com/sites/CockpitFiscal', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/GlobalTax', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/CSRS', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ProcureToPay', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/PPDRProduction', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/CRSSCCLOSING1', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/infosys', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/APHRWebForm', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/Workflow', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/PCardApplication', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/customerservicespain', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/KrafteTaxFileRoom', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/EMEAMinorReleases', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/MasterDataApprovalProcess', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ECLA', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/GomsCandiesWACAM', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ChicagoBakerySafetySite', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ISPoland', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ClaremontOnlineForms', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/CargadeDescuentosPEB', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/KaizenIdeasProgramMBSCCR', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ChicagoBakerySCNTeamsite', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/BalanceANCAM', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ECGovernanceSharePoint', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/LA', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ISServiceCatalogGlobal', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/HRAdvisorTeamSite', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/AutostoreAccess', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ManufacturingAbsenceRecordsTEST', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/CSLUKandIEPricing', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/autostoreoldbury', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/MarlbrookKronosAuditLog', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ChirkKronosAuditLog', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/CorrectionFileAuditLog', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/WiSEIntegration', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/MasterdataFG', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ScoresbyIL6S', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/PubRoutesinProgress', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/TradingTermsAgreement', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/TeamSiteContratosVenezuelaAndean', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/SupportTest', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/ThaneTechnicalCentre', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/NAFixedAssets', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/pss', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/SCCellPhone', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/MBSGlobalKnowledgeManagement', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/TradeTermsSignoffProcess', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/PayrollChile', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/MBSCJoyStore', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/MSOGroup', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/OvertimeCSL', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/OTC', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/TestPubRoutesInProgress', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/RHEcuador', DbName: 'Nintex_Content_03' },
                { Site: 'https://collaboration.mdlz.com/sites/AssetTaggingRegisterCapitalFinance', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/EMEA SAP Security Teamsite', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/IntranetCommercial', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/BuyMenuCard', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/FG', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/Payroll Caricam', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/EMEAMajorReleases', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/OTCSpainArchive', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/CanalMMove', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/SpecificationConformanceReview', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/CIM', DbName: 'Nintex_Content_04' },
				{ Site: 'https://collaboration.mdlz.com/sites/PubRoutesApproved', DbName: 'Nintex_Content_01' },
                { Site: 'https://collaboration.mdlz.com/sites/ContractsCaricam', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/IncidentandProblemManagement', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/WorkflowRebates', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/GestionesRRHH', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/SSMDashboard', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/Catalyst Asia-Pacific Security', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/PCSAF', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/SC - Notas de credito', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/Application Support EU - Service Request Approval', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/Confidentiality and Create a CDA', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/ISServiceCatalog', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/MBSCIWF', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/PreventativeActionTracking', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/RealEstateApprovals', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/InContactChangeGovernanceMEU', DbName: 'Nintex_Content_04' },
                { Site: 'https://collaboration.mdlz.com/sites/eqcmsEU', DbName: 'Team_XLContent_12' },
                { Site: 'https://collaboration.mdlz.com/sites/eqcmsLA', DbName: 'Team_XLContent_26' },
                { Site: 'https://collaboration.mdlz.com/sites/Customer Service and Logistics', DbName: 'Team_XLContent_35' },
                { Site: 'https://collaboration.mdlz.com/sites/eqcmsAP', DbName: 'Team_XLContent_40' },
                { Site: 'https://collaboration.mdlz.com/sites/eqcmsNA', DbName: 'Team_XLContent_41' },
                { Site: 'https://collaboration.mdlz.com/sites/eqcmsGlobal', DbName: 'Team_XLContent_49' },
                { Site: 'https://collaboration.mdlz.com/sites/NintexRedirectTest1', DbName: 'Team_XLContent_Custom' },
                { Site: 'https://collaboration.mdlz.com/sites/NintexRedirectTest2', DbName: 'Team_XLContent_Custom' },
                { Site: 'https://collaboration.mdlz.com/sites/NintexRedirectTest3', DbName: 'Team_XLContent_Custom' },
            ]

    })();