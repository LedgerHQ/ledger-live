import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { addBugLink, addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { transactionsNewSendFlow } from "./send/newSendFlowData";
import { getSendFlowMode } from "tests/utils/featureFlagUtils";

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

const mode = getSendFlowMode();

test.describe("New Send Flow", () => {
  // In "legacy" mode the new send flow is not exercised: register no tests.
  if (mode === "legacy") return;

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
          if (entry.bugTicket) {
            await addBugLink([entry.bugTicket]);
          }

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
