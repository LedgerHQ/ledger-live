import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { TokenAccount, getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
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

const NEW_SEND_FLOW_FAMILIES = Array.from(
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
  teamOwner?: Team;
  /**
   * When set, the amount input is asserted to pin the currency's decimal magnitude: an exact
   * round-trip, plus one decimal deeper rejected. Only meaningful when the amount already
   * fills the currency's magnitude — otherwise the deeper value is legitimately accepted.
   */
  verifyAmountPrecision?: boolean;
  /**
   * When set, the operation-details amount is asserted to equal `tx.amount` exactly.
   *
   * Not valid for families whose operation value is `amount + fee` — bitcoin, polkadot,
   * cardano, internet_computer, zcash, sui, aptos all build their optimistic operation that
   * way, and with broadcast disabled the drawer renders that optimistic value. Enable it per
   * entry, on entries that have actually been run.
   */
  verifyOperationAmount?: boolean;
};

export function registerNewSendFlowTests(entries: NewSendFlowEntry[]) {
  for (const entry of entries) {
    const tx = entry.transaction;
    const family = getFamilyByCurrencyId(tx.accountToDebit.currency.id);
    const validMemoTag = tx.memoTag !== "noTag" ? tx.memoTag : undefined;
    const currency = tx.accountToDebit.currency;
    const currencyLabel = currency.testLabel;

    test.describe("Send - new flow", () => {
      test.use({
        teamOwner: entry.teamOwner ?? Team.COIN_INTEGRATION,
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
        `[${currencyLabel}] - Send (new send flow)${
          tx.accountToDebit.derivationMode ? ` - ${tx.accountToDebit.derivationMode}` : ""
        }${validMemoTag ? " with memo" : ""}`,
        {
          tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
          annotation: [
            { type: "TMS", description: entry.xrayTicket },
            ...(entry.bugTicket ? [{ type: "BUG", description: entry.bugTicket }] : []),
          ],
        },
        async ({ app }) => {
          const isTokenTransaction = tx.accountToDebit instanceof TokenAccount;

          const requiresMemoStep = family ? MEMO_STEP_FAMILIES.has(family) : false;

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

          if (requiresMemoStep && validMemoTag) {
            await app.newSendFlow.typeMemo(validMemoTag);
          }
          await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
          if (requiresMemoStep && !validMemoTag) {
            await app.newSendFlow.confirmSkipMemo();
          }

          await app.newSendFlow.fillCryptoAmount(tx.amount);
          if (entry.verifyAmountPrecision) {
            await app.newSendFlow.expectAmountMagnitude(tx.amount);
          }

          if (tx.speed) {
            await app.newSendFlow.selectFeePreset(tx.speed);
          }

          await app.newSendFlow.clickReview();

          await app.newSendFlow.waitForSignature();
          await app.speculos.signSendTransaction(tx);
          await app.newSendFlow.waitForSuccessConfirmation();

          await app.newSendFlow.clickViewDetails();
          await app.sendDrawer.addressValueIsVisible(tx.accountToCredit.address);
          if (entry.verifyOperationAmount) {
            await app.sendDrawer.expectAmountVisible(tx.amount);
          }
          if (validMemoTag && tx.accountToDebit.currency.id === Currency.SOL.id) {
            await app.sendDrawer.expectMemoVisible(validMemoTag);
          }
        },
      );
    });
  }
}
