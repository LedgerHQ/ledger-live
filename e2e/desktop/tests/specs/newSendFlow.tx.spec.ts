import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { liveDataWithRecipientAddressCommand } from "tests/utils/cliCommandsUtils";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

function getRequiredFamily(currencyId: string): string {
  const family = getFamilyByCurrencyId(currencyId);
  if (!family) {
    throw new Error(`Missing family for currency ${currencyId}`);
  }
  return family;
}

const NEW_SEND_FLOW_FAMILIES = Array.from(
  new Set(
    [
      Currency.XTZ,
      Currency.TRX,
      Currency.ETH,
      Currency.NEAR,
      Currency.SOL,
      Currency.ALGO,
      Currency.XLM,
      Currency.XRP,
      Currency.BTC,
      Currency.KAS,
    ].map(currency => getRequiredFamily(currency.id)),
  ),
);

const MEMO_STEP_FAMILIES = new Set(
  [Currency.ALGO, Currency.XLM, Currency.XRP, Currency.SOL].map(currency =>
    getRequiredFamily(currency.id),
  ),
);

const transactionsNewSendFlow = [
  {
    transaction: new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.SLOW),
    xrayTicket: "B2CQA-2574",
  },
  {
    transaction: new Transaction(Account.POL_1, Account.POL_2, "0.001", Fee.SLOW),
    xrayTicket: "B2CQA-2807",
  },
  {
    transaction: new Transaction(Account.DOGE_1, Account.DOGE_2, "0.01", Fee.SLOW),
    xrayTicket: "B2CQA-2573",
  },
  {
    transaction: new Transaction(Account.BCH_1, Account.BCH_2, "0.0001", Fee.SLOW),
    xrayTicket: "B2CQA-2808",
  },
  {
    transaction: new Transaction(Account.ALGO_1, Account.ALGO_2, "0.001"),
    xrayTicket: "B2CQA-2810",
  },
  {
    transaction: new Transaction(Account.SOL_1, Account.SOL_2, "0.000001", undefined, "noTag"),
    xrayTicket: "B2CQA-2811",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    xrayTicket: "B2CQA-2812",
  },
  {
    transaction: new Transaction(Account.XLM_1, Account.XLM_2, "0.0001", undefined, "noTag"),
    xrayTicket: "B2CQA-2813",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "0.0001", undefined, "noTag"),
    xrayTicket: "B2CQA-2816",
  },
  {
    transaction: new Transaction(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.BTC_NATIVE_SEGWIT_2,
      "0.00001",
      Fee.MEDIUM,
    ),
    xrayTicket: "B2CQA-3925",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_3, "0.0001", Fee.SLOW),
    xrayTicket: "B2CQA-3924",
  },
  {
    transaction: new Transaction(Account.KASPA_1, Account.KASPA_2, "0.2"),
    xrayTicket: "B2CQA-3840",
  },
  {
    transaction: new Transaction(Account.BASE_1, Account.BASE_2, "0.000001"),
    xrayTicket: "B2CQA-4225",
  },
];

test.describe("New Send Flow", () => {
  for (const entry of transactionsNewSendFlow) {
    const tx = entry.transaction;
    const family = getFamilyByCurrencyId(tx.accountToDebit.currency.id);

    test.describe(tx.accountToDebit.accountName, () => {
      test.use({
        teamOwner: Team.COIN_INTEGRATION,
        userdata: "skip-onboarding-with-last-seen-device",
        speculosApp: tx.accountToDebit.currency.speculosApp,
        cliCommands: [liveDataWithRecipientAddressCommand(tx)],
        featureFlags: {
          newSendFlow: {
            enabled: true,
            params: { families: NEW_SEND_FLOW_FAMILIES },
          },
        },
      });

      test(
        `Send ${tx.amount} ${tx.accountToDebit.currency.ticker} from ${tx.accountToDebit.accountName} to ${tx.accountToCredit.accountName}`,
        {
          tag: [
            "@NanoSP",
            "@LNS",
            "@NanoX",
            "@Stax",
            "@Flex",
            "@NanoGen5",
            `@${tx.accountToDebit.currency.id}`,
            ...(family ? [`@family-${family}`] : []),
          ],
          annotation: { type: "TMS", description: entry.xrayTicket },
        },
        async ({ app }) => {
          const requiresMemoStep = family ? MEMO_STEP_FAMILIES.has(family) : false;

          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

          await app.mainNavigation.openTargetFromMainNavigation("accounts");
          await app.accounts.navigateToAccountByName(tx.accountToDebit.accountName);

          await app.account.clickSend();
          await app.newSendFlow.waitForDialog();

          const recipientAddress = tx.accountToCredit.address;
          if (!recipientAddress) {
            throw new Error(
              `Missing recipient address for ${tx.accountToCredit.accountName}. ` +
                `Ensure the CLI setup populates the address.`,
            );
          }
          await app.newSendFlow.typeAddress(recipientAddress);

          if (requiresMemoStep) {
            await app.newSendFlow.skipMemo();
          } else {
            await app.newSendFlow.clickOnSendToButton();
          }

          await app.newSendFlow.fillCryptoAmount(tx.amount);

          if (tx.speed) {
            await app.newSendFlow.selectFeePreset(tx.speed);
          }

          await app.newSendFlow.clickReview();

          await app.newSendFlow.waitForSignature();
          await app.speculos.signSendTransaction(tx);
          await app.newSendFlow.waitForSuccessConfirmation();
        },
      );
    });
  }
});
