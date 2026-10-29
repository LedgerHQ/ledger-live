import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-e2e-shared/enum/Account";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import {
  type LiveDataCommandOptions,
  liveDataWithRecipientAddressCommand,
} from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  FF_NEW_SEND_FLOW_ENABLED,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { StellarMemoType } from "@ledgerhq/live-e2e-shared/enum/MemoType";
import type { Application } from "tests/page";
import { buildTags, shouldSkipLNSTag } from "tests/utils/tagsUtils";
import { exclusiveLockFor } from "tests/utils/exclusiveLock";

type BalanceType = "public" | "private";

function getRequiredFamily(currencyId: string): string {
  const family = getFamilyByCurrencyId(currencyId);
  if (!family) {
    throw new Error(`Missing family for currency ${currencyId}`);
  }
  return family;
}

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
  disableBroadcast?: boolean;
  balanceType?: BalanceType;
  postSeedHook?: LiveDataCommandOptions["postSeedHook"];
  /** Runs on the recipient step once the address is typed, before the memo is filled. */
  recipientStepHook?: (app: Application, tx: Transaction) => Promise<void>;
};

function currencyRequiresMemoStep(currencyId: string): boolean {
  const family = getFamilyByCurrencyId(currencyId);
  return family ? MEMO_STEP_FAMILIES.has(family) : false;
}

export function requireRecipientAddress(tx: Transaction): string {
  const recipientAddress = tx.accountToCredit.address;
  if (!recipientAddress) {
    throw new Error(
      `Missing recipient address for ${tx.accountToCredit.accountName}. ` +
        `Ensure the CLI setup populates the address.`,
    );
  }
  return recipientAddress;
}

export async function openNewSendFromAccount(
  app: Application,
  tx: Transaction,
  balanceType?: BalanceType,
) {
  await app.mainNavigation.openTargetFromMainNavigation("accounts");
  await app.accounts.navigateToAccountByName(getParentAccountName(tx.accountToDebit));
  if (tx.accountToDebit instanceof TokenAccount) {
    await app.account.navigateToTokenInAccount(tx.accountToDebit);
  }
  await app.account.clickSend();
  await app.newSendFlow.waitForDialog();
  if (balanceType) {
    await app.newSendFlow.selectBalanceType(balanceType);
  }
}

export async function reachAmountStep(
  app: Application,
  tx: Transaction,
  balanceType?: BalanceType,
) {
  await openNewSendFromAccount(app, tx, balanceType);
  await passRecipientStep(app, tx);
}

/** Reaches the Amount step from the account page the app is already on. */
export async function reachAmountStepFromCurrentAccount(app: Application, tx: Transaction) {
  await app.account.clickSend();
  await app.newSendFlow.waitForDialog();
  await passRecipientStep(app, tx);
}

async function passRecipientStep(
  app: Application,
  tx: Transaction,
  recipientStepHook?: NewSendFlowEntry["recipientStepHook"],
) {
  await app.newSendFlow.typeAddress(requireRecipientAddress(tx));
  await recipientStepHook?.(app, tx);

  const validMemoTag = tx.memoTag !== "noTag" ? tx.memoTag : undefined;
  const requiresMemoStep = currencyRequiresMemoStep(tx.accountToDebit.currency.id);
  if (requiresMemoStep && validMemoTag) {
    await app.newSendFlow.typeMemo(validMemoTag);
  }
  await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
  if (requiresMemoStep && !validMemoTag) {
    await app.newSendFlow.confirmSkipMemo();
  }
}

export async function checkStellarMemoTypes(app: Application, tx: Transaction) {
  await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
  await app.newSendFlow.cancelSkipMemo();
  await app.newSendFlow.expectBackOnRecipientStepWithMemo();

  await app.newSendFlow.expectMemoType(StellarMemoType.MEMO_TEXT);
  await app.newSendFlow.openMemoTypes();
  await app.newSendFlow.expectMemoTypeOptions(Object.values(StellarMemoType));
  await app.newSendFlow.selectMemoType(StellarMemoType.NO_MEMO);
  await app.newSendFlow.expectMemoType(StellarMemoType.NO_MEMO);

  await app.newSendFlow.openMemoTypes();
  await app.newSendFlow.selectMemoType(StellarMemoType.MEMO_TEXT);
  await app.newSendFlow.expectMemoType(StellarMemoType.MEMO_TEXT);
}

export function registerNewSendFlowTests(entries: NewSendFlowEntry[]) {
  for (const entry of entries) {
    const tx = entry.transaction;
    const validMemoTag = tx.memoTag !== "noTag" ? tx.memoTag : undefined;
    const currency = tx.accountToDebit.currency;
    const currencyLabel = currency.testLabel;
    const sendLock = exclusiveLockFor({
      broadcastAccounts: entry.disableBroadcast ? [] : [tx.accountToDebit],
    });

    test.describe("Send - new flow", { lock: sendLock.names }, () => {
      test.use({
        teamOwner: entry.teamOwner ?? Team.COIN_INTEGRATION,
        userdata: "skip-onboarding-with-last-seen-device",
        speculosApp: tx.accountToDebit.currency.speculosApp,
        cliCommands: [
          liveDataWithRecipientAddressCommand(tx, {
            useScheme: true,
            postSeedHook: entry.postSeedHook,
          }),
        ],
        ...sendLock.fixtures,
        featureFlags: {
          ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
          ...FF_NEW_SEND_FLOW_ENABLED,
        },
        ...(entry.disableBroadcast && { env: { DISABLE_TRANSACTION_BROADCAST: "1" } }),
      });

      test(
        `[${currencyLabel}] - Send (new send flow)${
          tx.accountToDebit.derivationMode ? ` - ${tx.accountToDebit.derivationMode}` : ""
        }${validMemoTag ? " with memo" : ""}`,
        {
          tag: buildTags({
            currencyId: tx.accountToDebit.currency.id,
            skipLNS: shouldSkipLNSTag(tx.accountToDebit.currency.id),
            extraTags: tx.accountToDebit === Account.BTC_NATIVE_SEGWIT_1 ? ["@smoke"] : [],
          }),
          annotation: [
            { type: "TMS", description: entry.xrayTicket },
            ...(entry.bugTicket ? [{ type: "BUG", description: entry.bugTicket }] : []),
          ],
        },
        async ({ app }) => {
          await openNewSendFromAccount(app, tx, entry.balanceType);
          await passRecipientStep(app, tx, entry.recipientStepHook);

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
