import type { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import DeviceAction from "../../models/DeviceAction";
import { formattedAmount, getAccountName, getAccountUnit } from "../../models/currencies";

/**
 * Send half of mock account balance and assert operation details (shared by split currency suites).
 */
export async function runSendCurrencyHalfBalanceFlow(
  deviceAction: DeviceAction,
  firstDeviceSelectRef: { value: boolean },
  currencyId: CryptoCurrencyId,
) {
  const account = app.testAccounts.find(a => a.currency.id === currencyId);
  if (!account) throw new Error(`Account not found for currency: ${currencyId}`);

  const halfBalance = account.balance.div(2);
  const accountName = getAccountName(account);
  const unit = getAccountUnit(account);
  const amountInput = formattedAmount(unit, halfBalance, { useGrouping: false });
  const amountWithCode = formattedAmount(unit, halfBalance);

  await app.portfolio.openViaDeeplink();
  await app.send.openViaDeeplink();
  await app.common.performSearch(accountName);
  await app.common.selectAccount(account.id);
  await app.send.setRecipient(account.freshAddress);
  await app.send.recipientContinue(account.currency.name == "Cosmos" ? "noTag" : undefined);
  await app.send.setAmount(amountInput);
  await app.send.amountContinue();
  await app.send.expectSummaryAmount(amountWithCode);
  await app.send.summaryContinue();

  if (firstDeviceSelectRef.value) {
    await deviceAction.selectMockDevice();
    firstDeviceSelectRef.value = false;
  }
  await deviceAction.openApp();

  await app.common.successClose();
  await app.portfolio.scrollToTransactions();
  await app.portfolio.expectLastTransactionAmount(`-${amountWithCode}`);
  await app.portfolio.openLastTransaction();
  await app.operationDetails.isOpened();
  await app.operationDetails.checkAccount(accountName);
  await app.operationDetails.checkAmount(`-${amountWithCode}`);
}
