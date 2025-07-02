import { SwapType } from "@ledgerhq/live-common/lib/e2e/models/Swap";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export function setupEnv(disableBroadcast?: boolean) {
  const originalBroadcastValue = process.env.DISABLE_TRANSACTION_BROADCAST;
  beforeAll(async () => {
    process.env.SWAP_DISABLE_APPS_INSTALL = "true";
    if (disableBroadcast) process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  });
  afterAll(async () => {
    delete process.env.SWAP_DISABLE_APPS_INSTALL;
    if (originalBroadcastValue !== undefined) {
      process.env.DISABLE_TRANSACTION_BROADCAST = originalBroadcastValue;
    } else {
      delete process.env.DISABLE_TRANSACTION_BROADCAST;
    }
  });
}

export async function performSwapUntilQuoteSelectionStep(
  accountToDebit: Account,
  accountToCredit: Account,
  amount: string,
  continueToQuotes: boolean = true,
) {
  await app.swapLiveApp.waitForSwapLiveApp();
  const fromCurrencyTexts = await app.swapLiveApp.getFromCurrencyTexts();
  if (!fromCurrencyTexts.includes(accountToDebit.accountName)) {
    await app.swapLiveApp.tapFromCurrency();
    await app.common.performSearch(accountToDebit.currency.name);
    await app.stake.selectCurrency(accountToDebit.currency.id);
    await app.common.selectFirstAccount();
  }
  await app.swapLiveApp.tapToCurrency();
  await app.common.performSearch(accountToCredit.currency.name);
  await app.stake.selectCurrency(accountToCredit.currency.id);
  await app.common.selectFirstAccount();
  await app.swapLiveApp.inputAmount(amount);

  if (continueToQuotes) {
    await app.swapLiveApp.tapGetQuotesButton();
    await app.swapLiveApp.waitForQuotes();
  }
}

export async function checkSwapInfosOnDeviceVerificationStep(
  swap: SwapType,
  selectedProvider: string,
  amount: string,
) {
  const amountTo = await app.swap.getAmountToReceive();
  const fees = await app.swap.getFees();

  swap.setAmountToReceive(amountTo);
  swap.setFeesAmount(fees);

  await app.swap.verifyAmountToReceive(amountTo);
  await app.swap.verifyAmountSent(amount.toString(), swap.accountToDebit.currency.ticker);
  await app.swap.verifySourceAccount(swap.accountToDebit.currency.name);
  await app.swap.verifyTargetCurrency(swap.accountToCredit.currency.name);
  await app.swap.verifyProvider(selectedProvider);
}
