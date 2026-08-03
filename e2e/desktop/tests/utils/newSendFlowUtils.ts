import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { TokenAccount, getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { addBugLink, addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED } from "tests/utils/featureFlagUtils";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { buildTags } from "tests/utils/tagsUtils";

function getRequiredFamily(currencyId: string): string {
  const family = getFamilyByCurrencyId(currencyId);
  if (!family) {
    throw new Error(`Missing family for currency ${currencyId}`);
  }
  return family;
}

export const NEW_SEND_FLOW_FAMILIES = Array.from(
  new Set(
    [
      Currency.ADA,
      Currency.ALGO,
      Currency.APT,
      Currency.ATOM,
      Currency.BASE,
      Currency.BCH,
      Currency.BTC,
      Currency.DOGE,
      Currency.DOT,
      Currency.ETH,
      Currency.HBAR,
      Currency.ICP,
      Currency.KAS,
      Currency.NEAR,
      Currency.OSMO,
      Currency.POL,
      Currency.SOL,
      Currency.SUI,
      Currency.TRX,
      Currency.VET,
      Currency.XLM,
      Currency.XRP,
      Currency.XTZ,
      Currency.ZEC,
    ].map(currency => getRequiredFamily(currency.id)),
  ),
);

const MEMO_STEP_FAMILIES = new Set(
  [
    Currency.ALGO,
    Currency.XLM,
    Currency.XRP,
    Currency.SOL,
    Currency.ATOM,
    Currency.ICP,
    Currency.ADA,
    Currency.HBAR,
  ].map(currency => getRequiredFamily(currency.id)),
);

export type NewSendFlowEntry = {
  transaction: Transaction;
  xrayTicket: string;
  bugTicket?: string;
};

export function registerNewSendFlowTests(entries: NewSendFlowEntry[]) {
  for (const entry of entries) {
    const tx = entry.transaction;
    const family = getFamilyByCurrencyId(tx.accountToDebit.currency.id);
    const validMemoTag = tx.memoTag !== "noTag" ? tx.memoTag : undefined;

    test.describe(tx.accountToDebit.accountName, () => {
      test.use({
        teamOwner: Team.COIN_INTEGRATION,
        userdata: "skip-onboarding-with-last-seen-device",
        speculosApp: tx.accountToDebit.currency.speculosApp,
        cliCommands: [liveDataWithRecipientAddressCommand(tx)],
        featureFlags: {
          ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
          newSendFlow: {
            enabled: true,
            params: { families: NEW_SEND_FLOW_FAMILIES },
          },
        },
      });

      test(
        `Send ${tx.amount} ${tx.accountToDebit.currency.ticker}${
          tx.accountToDebit.derivationMode ? ` [${tx.accountToDebit.derivationMode}]` : ""
        }${validMemoTag ? " with memo" : ""} from ${tx.accountToDebit.accountName} to ${
          tx.accountToCredit.accountName
        }`,
        {
          tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
          annotation: { type: "TMS", description: entry.xrayTicket },
        },
        async ({ app }) => {
          const isTokenTransaction = tx.accountToDebit instanceof TokenAccount;

          const requiresMemoStep = family ? MEMO_STEP_FAMILIES.has(family) : false;

          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
          if (entry.bugTicket) {
            await addBugLink([entry.bugTicket]);
          }

          await app.mainNavigation.openTargetFromMainNavigation("accounts");

          const accountName = getParentAccountName(tx.accountToDebit);
          await app.accounts.navigateToAccountByName(accountName);

          if (isTokenTransaction) {
            await app.account.navigateToTokenInAccount(tx.accountToDebit);
          }

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
            if (validMemoTag) {
              await app.newSendFlow.typeMemo(validMemoTag);
              await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
            } else {
              await app.newSendFlow.skipMemo();
            }
          } else {
            await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
          }

          await app.newSendFlow.fillCryptoAmount(tx.amount);

          if (tx.speed) {
            await app.newSendFlow.selectFeePreset(tx.speed);
          }

          await app.newSendFlow.clickReview();

          await app.newSendFlow.waitForSignature();
          await app.speculos.signSendTransaction(tx);
          await app.newSendFlow.waitForSuccessConfirmation();

          await app.newSendFlow.clickViewDetails();
          await app.sendDrawer.addressValueIsVisible(tx.accountToCredit.address);
          if (validMemoTag && tx.accountToDebit.currency.id === Currency.SOL.id) {
            await app.sendDrawer.expectMemoVisible(validMemoTag);
          }
        },
      );
    });
  }
}
