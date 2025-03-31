// import { test } from "../fixtures/common";
// import { addTmsLink } from "../utils/allureUtils";
// import { getDescription } from "../utils/customJsonReporter";
// import { CLI } from "../utils/cliUtils";
// import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
// import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
// import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
// import invariant from "invariant";
// import { getEnv } from "@ledgerhq/live-env";
// import { TransactionStatus } from "@ledgerhq/live-common/e2e/enum/TransactionStatus";
//
// const subAccounts = [
//   { account: Account.ETH_USDT_1, xrayTicket1: "B2CQA-2577, B2CQA-1079", xrayTicket2: "B2CQA-2583" },
//   { account: Account.XLM_USCD, xrayTicket1: "B2CQA-2579", xrayTicket2: "B2CQA-2585" },
//   { account: Account.ALGO_USDT_1, xrayTicket1: "B2CQA-2575", xrayTicket2: "B2CQA-2581" },
//   { account: Account.TRX_USDT, xrayTicket1: "B2CQA-2580", xrayTicket2: "B2CQA-2586" },
//   { account: Account.BSC_BUSD_1, xrayTicket1: "B2CQA-2576", xrayTicket2: "B2CQA-2582" },
//   { account: Account.POL_DAI_1, xrayTicket1: "B2CQA-2578", xrayTicket2: "B2CQA-2584" },
// ];
//
// const subAccountReceive = [
//   { account: Account.ETH_USDT_1, xrayTicket: "B2CQA-2492" },
//   { account: Account.ETH_LIDO, xrayTicket: "B2CQA-2491" },
//   { account: Account.TRX_USDT, xrayTicket: "B2CQA-2496" },
//   { account: Account.BSC_BUSD_1, xrayTicket: "B2CQA-2489" },
//   { account: Account.BSC_SHIBA, xrayTicket: "B2CQA-2490" },
//   { account: Account.POL_DAI_1, xrayTicket: "B2CQA-2493" },
//   { account: Account.POL_UNI, xrayTicket: "B2CQA-2494" },
// ];
//
// for (const token of subAccounts) {
//   test.describe("Add subAccount without parent", () => {
//     test.use({
//       userdata: "skip-onboarding",
//       speculosApp: token.account.currency.speculosApp,
//     });
//
//     test(
//       `Add Sub Account without parent (${token.account.currency.speculosApp.name}) - ${token.account.currency.ticker}`,
//       {
//         annotation: {
//           type: "TMS",
//           description: token.xrayTicket1,
//         },
//       },
//       async ({ app }) => {
//         await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
//
//         await app.portfolio.openAddAccountModal();
//         await app.addAccount.expectModalVisiblity();
//
//         await app.addAccount.selectToken(token.account);
//         await app.addAccount.addAccounts();
//
//         await app.addAccount.done();
//         await app.layout.goToPortfolio();
//         await app.portfolio.navigateToAsset(token.account.currency.name);
//         await app.account.navigateToToken(token.account);
//         await app.account.expectLastOperationsVisibility();
//         await app.account.expectTokenAccount(token.account);
//       },
//     );
//   });
// }
//
// //Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581
// for (const token of subAccountReceive) {
//   test.describe("Add subAccount when parent exists", () => {
//     test.use({
//       userdata: "speculos-subAccount",
//       speculosApp: token.account.currency.speculosApp,
//     });
//
//     test(
//       `[${token.account.currency.speculosApp.name}] Add subAccount when parent exists (${token.account.currency.ticker})`,
//       {
//         annotation: {
//           type: "TMS",
//           description: token.xrayTicket,
//         },
//       },
//       async ({ app }) => {
//         await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
//
//         await app.layout.goToAccounts();
//         await app.accounts.navigateToAccountByName(token.account.accountName);
//         await app.account.expectAccountVisibility(token.account.accountName);
//
//         await app.account.clickAddToken();
//         await app.receive.selectToken(token.account);
//
//         await app.receive.continue();
//
//         const displayedAddress = await app.receive.getAddressDisplayed();
//         await app.receive.expectValidReceiveAddress(displayedAddress);
//
//         await app.speculos.expectValidAddressDevice(token.account, displayedAddress);
//         await app.receive.expectApproveLabel();
//       },
//     );
//   });
// }
//
// for (const token of subAccounts) {
//   test.describe("Token visible in parent account", () => {
//     test.use({
//       userdata: "speculos-subAccount",
//     });
//
//     test(
//       `Token visible in parent account (${token.account.currency.speculosApp.name}) - ${token.account.currency.ticker}`,
//       {
//         annotation: {
//           type: "TMS",
//           description: token.xrayTicket2,
//         },
//       },
//       async ({ app }) => {
//         await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
//
//         await app.layout.goToAccounts();
//         await app.accounts.navigateToAccountByName(token.account.accountName);
//         await app.account.expectTokenToBePresent(token.account);
//       },
//     );
//   });
// }
//
// const transactionE2E = [
//   {
//     tx: new Transaction(Account.SOL_GIGA_1, Account.SOL_GIGA_2, "0.5", undefined, "noTag"),
//     xrayTicket: "B2CQA-3055, B2CQA-3057",
//   },
// ];
//
// for (const transaction of transactionE2E) {
//   test.describe("Send token - E2E", () => {
//     test.use({
//       userdata: "skip-onboarding",
//       speculosApp: transaction.tx.accountToDebit.currency.speculosApp,
//       cliCommands: [
//         (appjsonPath: string) => {
//           return CLI.liveData({
//             currency: transaction.tx.accountToCredit.currency.id,
//             index: transaction.tx.accountToCredit.index,
//             add: true,
//             appjson: appjsonPath,
//           });
//         },
//         (appjsonPath: string) => {
//           return CLI.liveData({
//             currency: transaction.tx.accountToDebit.currency.id,
//             index: transaction.tx.accountToDebit.index,
//             add: true,
//             appjson: appjsonPath,
//           });
//         },
//       ],
//     });
//
//     test(
//       `Send from ${transaction.tx.accountToDebit.accountName} to ${transaction.tx.accountToCredit.accountName} - ${transaction.tx.accountToDebit.currency.name} - E2E test`,
//       {
//         annotation: {
//           type: "TMS",
//           description: transaction.xrayTicket,
//         },
//       },
//       async ({ app }) => {
//         await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
//
//         await app.layout.goToAccounts();
//         await app.accounts.navigateToAccountByName(transaction.tx.accountToDebit.accountName);
//         await app.account.navigateToTokenInAccount(transaction.tx.accountToDebit);
//         await app.account.clickSend();
//         await app.send.craftTx(transaction.tx);
//         await app.send.continueAmountModal();
//         await app.send.expectTxInfoValidity(transaction.tx);
//         await app.send.clickContinueToDevice();
//
//         await app.speculos.signSendTransaction(transaction.tx);
//         await app.send.expectTxSent();
//         await app.account.navigateToViewDetails();
//         await app.sendDrawer.addressValueIsVisible(transaction.tx.accountToCredit.address);
//         await app.drawer.closeDrawer();
//         if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
//           await app.layout.goToAccounts();
//           await app.accounts.clickSyncBtnForAccount(transaction.tx.accountToCredit.accountName);
//           await app.accounts.navigateToAccountByName(transaction.tx.accountToCredit.accountName);
//           await app.account.navigateToTokenInAccount(transaction.tx.accountToDebit);
//           await app.account.expectAccountBalance();
//           await app.account.checkAccountChart();
//           await app.account.selectAndClickOnLastOperation(TransactionStatus.RECEIVED);
//           await app.sendDrawer.expectReceiverInfos(transaction.tx);
//         }
//       },
//     );
//   });
// }
//
// const transactionsAddressInvalid = [
//   {
//     transaction: new Transaction(Account.ALGO_USDT_1, Account.ALGO_USDT_2, "0.1", Fee.MEDIUM),
//     recipient: Account.ALGO_USDT_2.address,
//     expectedErrorMessage: "Recipient account has not opted in the selected ASA.",
//     xrayTicket: "B2CQA-2702",
//   },
//   {
//     transaction: new Transaction(Account.SOL_GIGA_1, Account.SOL_WIF_2, "0.1", undefined),
//     recipient: Account.SOL_WIF_2.ataAddress,
//     expectedErrorMessage: "This associated token account holds another token",
//     xrayTicket: "B2CQA-3083",
//   },
//   {
//     transaction: new Transaction(Account.SOL_1, Account.SOL_GIGA_2, "0.1", undefined),
//     recipient: Account.SOL_GIGA_2.ataAddress,
//     expectedErrorMessage: "This is a token account. Input a regular wallet address",
//     xrayTicket: "B2CQA-3084",
//   },
//   {
//     transaction: new Transaction(Account.SOL_WIF_1, Account.SOL_WIF_2, "0.1", undefined),
//     recipient: Account.SOL_WIF_2.currency.contractAddress,
//     expectedErrorMessage: "This is a token address. Input a regular wallet address",
//     xrayTicket: "B2CQA-3085",
//   },
//   {
//     transaction: new Transaction(Account.SOL_WIF_1, Account.SOL_GIGA_2, "0.1", undefined),
//     recipient: Account.SOL_GIGA_2.currency.contractAddress,
//     expectedErrorMessage: "This is a token address. Input a regular wallet address",
//     xrayTicket: "B2CQA-3086",
//   },
//   {
//     transaction: new Transaction(Account.SOL_1, Account.SOL_WIF_2, "0.1", undefined),
//     recipient: Account.SOL_WIF_2.currency.contractAddress,
//     expectedErrorMessage: "This is a token address. Input a regular wallet address",
//     xrayTicket: "B2CQA-3087",
//   },
// ];
//
// for (const transaction of transactionsAddressInvalid) {
//   test.describe("Send token - invalid address input", () => {
//     test.use({
//       userdata: "skip-onboarding",
//       speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
//       cliCommands: [
//         (appjsonPath: string) => {
//           return CLI.liveData({
//             currency: transaction.transaction.accountToDebit.currency.id,
//             index: transaction.transaction.accountToDebit.index,
//             add: true,
//             appjson: appjsonPath,
//           });
//         },
//       ],
//     });
//
//     test(
//       `Send from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName} - ${transaction.transaction.accountToCredit.currency.name} - ${transaction.expectedErrorMessage}`,
//       {
//         annotation: {
//           type: "TMS",
//           description: transaction.xrayTicket,
//         },
//       },
//       async ({ app }) => {
//         await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
//
//         await app.layout.openSendModalFromSideBar();
//         await app.send.selectDebitCurrency(transaction.transaction);
//         invariant(transaction.recipient, "Recipient address is not defined");
//         await app.send.fillRecipient(transaction.recipient);
//         await app.send.checkContinueButtonDisabled();
//         await app.send.checkErrorMessage(transaction.expectedErrorMessage);
//       },
//     );
//   });
// }
//
// const transactionsAddressValid = [
//   {
//     transaction: new Transaction(Account.SOL_GIGA_1, Account.SOL_GIGA_2, "0.1", undefined),
//     expectedErrorMessage:
//       "This is not a regular wallet address but an associated token account. Continue only if you know what you are doing",
//     xrayTicket: "B2CQA-3082",
//   },
// ];
//
// for (const transaction of transactionsAddressValid) {
//   test.describe("Send token - valid address input", () => {
//     test.use({
//       userdata: "skip-onboarding",
//       speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
//       cliCommands: [
//         (appjsonPath: string) => {
//           return CLI.liveData({
//             currency: transaction.transaction.accountToDebit.currency.id,
//             index: transaction.transaction.accountToDebit.index,
//             add: true,
//             appjson: appjsonPath,
//           });
//         },
//       ],
//     });
//
//     test(
//       `Send from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName} - ${transaction.transaction.accountToDebit.currency.name} - valid address input`,
//       {
//         annotation: {
//           type: "TMS",
//           description: transaction.xrayTicket,
//         },
//       },
//       async ({ app }) => {
//         await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
//
//         await app.layout.openSendModalFromSideBar();
//         await app.send.selectDebitCurrency(transaction.transaction);
//         const recipientAddress = transaction.transaction.accountToCredit.ataAddress ?? "";
//         await app.send.fillRecipient(recipientAddress);
//
//         await app.send.checkContinueButtonEnable();
//         await app.send.checkInputWarningMessage(transaction.expectedErrorMessage);
//       },
//     );
//   });
// }
//
// const tokenTransactionInvalid = [
//   {
//     tx: new Transaction(Account.BSC_BUSD_1, Account.BSC_BUSD_2, "1", Fee.FAST),
//     expectedWarningMessage: new RegExp(
//       /You need \d+\.\d+ BNB in your account to pay for transaction fees on the Binance Smart Chain network\. .*/,
//     ),
//     xrayTicket: "B2CQA-2700",
//   },
//   {
//     tx: new Transaction(Account.ETH_USDT_2, Account.ETH_USDT_1, "1", Fee.FAST),
//     expectedWarningMessage: new RegExp(
//       /You need \d+\.\d+ ETH in your account to pay for transaction fees on the Ethereum network\. .*/,
//     ),
//     xrayTicket: "B2CQA-2701",
//   },
//   {
//     tx: new Transaction(Account.ETH_USDT_1, Account.ETH_USDT_2, "10000", Fee.MEDIUM),
//     expectedWarningMessage: "Sorry, insufficient funds",
//     xrayTicket: "B2CQA-3043",
//   },
//   {
//     tx: new Transaction(Account.SOL_GIGA_3, Account.SOL_GIGA_1, "0.5", undefined, "noTag"),
//     expectedWarningMessage: new RegExp("Sorry, insufficient funds"),
//     xrayTicket: "B2CQA-3058",
//   },
// ];
//
// for (const transaction of tokenTransactionInvalid) {
//   test.describe("Send token (subAccount) - invalid amount input", () => {
//     test.use({
//       userdata: "skip-onboarding",
//       speculosApp: transaction.tx.accountToDebit.currency.speculosApp,
//       cliCommands: [
//         (appjsonPath: string) => {
//           return CLI.liveData({
//             currency: transaction.tx.accountToDebit.currency.id,
//             index: transaction.tx.accountToDebit.index,
//             add: true,
//             appjson: appjsonPath,
//           });
//         },
//       ],
//     });
//     test(
//       `Send from ${transaction.tx.accountToDebit.accountName} to ${transaction.tx.accountToCredit.accountName} - invalid amount input`,
//       {
//         annotation: {
//           type: "TMS",
//           description: transaction.xrayTicket,
//         },
//       },
//       async ({ app }) => {
//         await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
//
//         await app.layout.goToAccounts();
//         await app.accounts.navigateToAccountByName(transaction.tx.accountToDebit.accountName);
//         await app.account.navigateToTokenInAccount(transaction.tx.accountToDebit);
//         await app.account.clickSend();
//         await app.send.craftTx(transaction.tx);
//         await app.send.checkContinueButtonDisabled();
//         if (transaction.expectedWarningMessage instanceof RegExp) {
//           await app.send.checkAmountWarningMessage(transaction.expectedWarningMessage);
//         } else {
//           await app.send.checkErrorMessage(transaction.expectedWarningMessage);
//         }
//       },
//     );
//   });
// }
//
// test.describe("Send token (subAccount) - valid address & amount input", () => {
//   const tokenTransactionValid = new Transaction(
//     Account.ETH_USDT_1,
//     Account.ETH_USDT_2,
//     "1",
//     Fee.MEDIUM,
//   );
//   test.use({
//     userdata: "skip-onboarding",
//     speculosApp: tokenTransactionValid.accountToDebit.currency.speculosApp,
//     cliCommands: [
//       (appjsonPath: string) => {
//         return CLI.liveData({
//           currency: tokenTransactionValid.accountToDebit.currency.id,
//           index: tokenTransactionValid.accountToDebit.index,
//           add: true,
//           appjson: appjsonPath,
//         });
//       },
//     ],
//   });
//
//   test(
//     `Send from ${tokenTransactionValid.accountToDebit.accountName} to ${tokenTransactionValid.accountToCredit.accountName} - valid address & amount input`,
//     {
//       annotation: {
//         type: "TMS",
//         description: "B2CQA-2703, B2CQA-475",
//       },
//     },
//     async ({ app }) => {
//       await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
//
//       await app.layout.goToAccounts();
//       await app.accounts.navigateToAccountByName(tokenTransactionValid.accountToDebit.accountName);
//       await app.account.navigateToTokenInAccount(tokenTransactionValid.accountToDebit);
//       await app.account.clickSend();
//       await app.send.fillRecipient(tokenTransactionValid.accountToCredit.address);
//       await app.send.checkContinueButtonEnable();
//       await app.send.checkInputErrorVisibility("hidden");
//       await app.send.continue();
//       await app.send.fillAmount(tokenTransactionValid.amount);
//       await app.send.checkContinueButtonEnable();
//     },
//   );
// });
