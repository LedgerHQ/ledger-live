import { test } from "../../fixtures/common";
import { NFTTransaction } from "../../models/Transaction";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { commandCLI } from "tests/utils/cliUtils";

test.describe("send NFT to ENS address", () => {
  const transaction = new NFTTransaction(Account.ETH_1, Account.ETH_MC, "Podium", Fee.SLOW);
  test.beforeAll(async () => {
    process.env.DISABLE_TRANSACTION_BROADCAST = "true";
  });
  test.afterAll(async () => {
    delete process.env.DISABLE_TRANSACTION_BROADCAST;
  });
  test.use({
    userdata: "skip-onboarding",
    cliCommands: [
      {
        command: commandCLI.liveData,
        args: {
          currency: transaction.accountToDebit.currency.currencyId,
          index: transaction.accountToDebit.index,
          appjson: "",
          add: true,
        },
      },
    ],
    speculosApp: transaction.accountToDebit.currency.speculosApp,
  });

  test(
    "Send NFT to ENS address",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2203",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);
      await app.account.navigateToNFTGallery();
      await app.account.selectNFT(transaction.nftName);
      await app.nftDrawer.expectNftNameIsVisible(transaction.nftName);
      await app.nftDrawer.clickSend();
      await app.send.craftNFTTx(transaction);
      await app.send.expectNFTTxInfoValidity(transaction);
      await app.speculos.signSendNFTTransaction(transaction);
      await app.send.expectTxSent();
      await app.account.navigateToViewDetails();
      await app.drawer.close();
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);
      await app.account.navigateToNFTOperation();
      await app.sendDrawer.expectNftInfos(transaction);
    },
  );
});

test.describe("The user can see his NFT floor price", () => {
  const account = Account.ETH_1;
  test.use({
    userdata: "skip-onboarding",
    cliCommands: [
      {
        command: commandCLI.liveData,
        args: {
          currency: account.currency.currencyId,
          index: account.index,
          appjson: "",
          add: true,
        },
      },
    ],
    speculosApp: account.currency.speculosApp,
  });

  test(
    "User can see his NFT floor price",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-659",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.navigateToNFTGallery();
      await app.account.selectNFT("Antius's Forecast");
      await app.nftDrawer.expectNftNameIsVisible("Antius's Forecast");
      await app.nftDrawer.expectNftFloorPriceIsVisible();
      await app.nftDrawer.expectNftFloorPricePositive();
      await app.nftDrawer.clickNftOptions();
      await app.nftDrawer.checkOpenSea();
    },
  );
});
