"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var app_1 = __importDefault(require("./commands/app"));
var appUninstallAll_1 = __importDefault(require("./commands/appUninstallAll"));
var appsCheckAllAppVersions_1 = __importDefault(require("./commands/appsCheckAllAppVersions"));
var appsInstallAll_1 = __importDefault(require("./commands/appsInstallAll"));
var appsUpdateTestAll_1 = __importDefault(require("./commands/appsUpdateTestAll"));
var balanceHistory_1 = __importDefault(require("./commands/balanceHistory"));
var bot_1 = __importDefault(require("./commands/bot"));
var botPortfolio_1 = __importDefault(require("./commands/botPortfolio"));
var botTransfer_1 = __importDefault(require("./commands/botTransfer"));
var broadcast_1 = __importDefault(require("./commands/broadcast"));
var cleanSpeculos_1 = __importDefault(require("./commands/cleanSpeculos"));
var countervalues_1 = __importDefault(require("./commands/countervalues"));
var derivation_1 = __importDefault(require("./commands/derivation"));
var devDeviceAppsScenario_1 = __importDefault(require("./commands/devDeviceAppsScenario"));
var deviceAppVersion_1 = __importDefault(require("./commands/deviceAppVersion"));
var deviceInfo_1 = __importDefault(require("./commands/deviceInfo"));
var deviceVersion_1 = __importDefault(require("./commands/deviceVersion"));
var discoverDevices_1 = __importDefault(require("./commands/discoverDevices"));
var envs_1 = __importDefault(require("./commands/envs"));
var estimateMaxSpendable_1 = __importDefault(require("./commands/estimateMaxSpendable"));
var exportAccounts_1 = __importDefault(require("./commands/exportAccounts"));
var firmwareRepair_1 = __importDefault(require("./commands/firmwareRepair"));
var firmwareUpdate_1 = __importDefault(require("./commands/firmwareUpdate"));
var generateAppJsonFromDataset_1 = __importDefault(require("./commands/generateAppJsonFromDataset"));
var generateTestScanAccounts_1 = __importDefault(require("./commands/generateTestScanAccounts"));
var generateTestTransaction_1 = __importDefault(require("./commands/generateTestTransaction"));
var genuineCheck_1 = __importDefault(require("./commands/genuineCheck"));
var getAddress_1 = __importDefault(require("./commands/getAddress"));
var getTransactionStatus_1 = __importDefault(require("./commands/getTransactionStatus"));
var liveData_1 = __importDefault(require("./commands/liveData"));
var makeCompoundSummary_1 = __importDefault(require("./commands/makeCompoundSummary"));
var managerListApps_1 = __importDefault(require("./commands/managerListApps"));
var portfolio_1 = __importDefault(require("./commands/portfolio"));
var proxy_1 = __importDefault(require("./commands/proxy"));
var receive_1 = __importDefault(require("./commands/receive"));
var repl_1 = __importDefault(require("./commands/repl"));
var satstack_1 = __importDefault(require("./commands/satstack"));
var satstackStatus_1 = __importDefault(require("./commands/satstackStatus"));
var scanDescriptors_1 = __importDefault(require("./commands/scanDescriptors"));
var send_1 = __importDefault(require("./commands/send"));
var signMessage_1 = __importDefault(require("./commands/signMessage"));
var speculosList_1 = __importDefault(require("./commands/speculosList"));
var swap_1 = __importDefault(require("./commands/swap"));
var sync_1 = __importDefault(require("./commands/sync"));
var testDetectOpCollision_1 = __importDefault(require("./commands/testDetectOpCollision"));
var testGetTrustedInputFromTxHash_1 = __importDefault(require("./commands/testGetTrustedInputFromTxHash"));
var user_1 = __importDefault(require("./commands/user"));
var version_1 = __importDefault(require("./commands/version"));
var walletconnect_1 = __importDefault(require("./commands/walletconnect"));
exports["default"] = {
    app: app_1["default"],
    appUninstallAll: appUninstallAll_1["default"],
    appsCheckAllAppVersions: appsCheckAllAppVersions_1["default"],
    appsInstallAll: appsInstallAll_1["default"],
    appsUpdateTestAll: appsUpdateTestAll_1["default"],
    balanceHistory: balanceHistory_1["default"],
    bot: bot_1["default"],
    botPortfolio: botPortfolio_1["default"],
    botTransfer: botTransfer_1["default"],
    broadcast: broadcast_1["default"],
    cleanSpeculos: cleanSpeculos_1["default"],
    countervalues: countervalues_1["default"],
    derivation: derivation_1["default"],
    devDeviceAppsScenario: devDeviceAppsScenario_1["default"],
    deviceAppVersion: deviceAppVersion_1["default"],
    deviceInfo: deviceInfo_1["default"],
    deviceVersion: deviceVersion_1["default"],
    discoverDevices: discoverDevices_1["default"],
    envs: envs_1["default"],
    estimateMaxSpendable: estimateMaxSpendable_1["default"],
    exportAccounts: exportAccounts_1["default"],
    firmwareRepair: firmwareRepair_1["default"],
    firmwareUpdate: firmwareUpdate_1["default"],
    generateAppJsonFromDataset: generateAppJsonFromDataset_1["default"],
    generateTestScanAccounts: generateTestScanAccounts_1["default"],
    generateTestTransaction: generateTestTransaction_1["default"],
    genuineCheck: genuineCheck_1["default"],
    getAddress: getAddress_1["default"],
    getTransactionStatus: getTransactionStatus_1["default"],
    liveData: liveData_1["default"],
    makeCompoundSummary: makeCompoundSummary_1["default"],
    managerListApps: managerListApps_1["default"],
    portfolio: portfolio_1["default"],
    proxy: proxy_1["default"],
    receive: receive_1["default"],
    repl: repl_1["default"],
    satstack: satstack_1["default"],
    satstackStatus: satstackStatus_1["default"],
    scanDescriptors: scanDescriptors_1["default"],
    send: send_1["default"],
    signMessage: signMessage_1["default"],
    speculosList: speculosList_1["default"],
    swap: swap_1["default"],
    sync: sync_1["default"],
    testDetectOpCollision: testDetectOpCollision_1["default"],
    testGetTrustedInputFromTxHash: testGetTrustedInputFromTxHash_1["default"],
    user: user_1["default"],
    version: version_1["default"],
    walletconnect: walletconnect_1["default"]
};
//# sourceMappingURL=commands-index.js.map