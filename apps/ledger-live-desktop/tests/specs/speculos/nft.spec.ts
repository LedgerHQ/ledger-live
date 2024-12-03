import { test } from "../../fixtures/common";
import { NFTTransaction } from "../../models/Transaction";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Nft } from "@ledgerhq/live-common/e2e/enum/Nft";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { commandCLI } from "tests/utils/cliUtils";

test.describe("send NFT to ENS address", () => {
  const transaction = new NFTTransaction(Account.ETH_1, Account.ETH_MC, Nft.PODIUM, Fee.SLOW);
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
      await app.account.selectNFT(transaction.nft.nftName);
      await app.nftDrawer.expectNftNameIsVisible(transaction.nft.nftName);
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
      if (account.nft) {
        await app.account.selectNFT(account.nft[0].nftName);
        await app.nftDrawer.expectNftNameIsVisible(account.nft[0].nftName);
      }
      await app.nftDrawer.expectNftFloorPriceIsVisible();
      await app.nftDrawer.expectNftFloorPricePositive();
      await app.nftDrawer.clickNftOptions();
      await app.nftDrawer.checkOpenSea();
    },
  );
});

const accounts = [
  { account: Account.ETH_1, xrayTicket: "B2CQA-801.1" },
  { account: Account.POL_1, xrayTicket: "B2CQA-801.2" },
];
for (const account of accounts) {
  test.describe("The user displays all the nfts from his account", () => {
    test.use({
      userdata: "skip-onboarding",
      cliCommands: [
        {
          command: commandCLI.liveData,
          args: {
            currency: account.account.currency.currencyId,
            index: account.account.index,
            appjson: "",
            add: true,
          },
        },
      ],
      speculosApp: account.account.currency.speculosApp,
    });

    test(
      `User displays all the nfts from his ${account.account.currency.name} account`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-659",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(account.account.accountName);
        await app.account.checkNftListInAccount(account.account);
      },
    );
  });
}
