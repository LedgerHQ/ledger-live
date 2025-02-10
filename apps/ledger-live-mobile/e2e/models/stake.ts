import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Application } from "../page";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

export async function verifyAppValidationStakeInfo(
  app: Application,
  delegation: Delegate,
  amount: string,
) {
  const currenciesForValidationAmount = [Currency.ATOM, Currency.NEAR, Currency.CELO];
  const currenciesForValidationProvider = [Currency.ATOM, Currency.XTZ];

  const currency = delegation.account.currency;
  const provider = delegation.provider;

  await app.deviceValidation.expectDeviceValidationScreen();

  if (currenciesForValidationAmount.includes(currency)) {
    await app.deviceValidation.expectAmount(amount);
  }
  if (currenciesForValidationProvider.includes(currency)) {
    await app.deviceValidation.expectProvider(provider);
  }
}

export async function verifyStakeOperationDetailsInfo(
  app: Application,
  delegation: Delegate,
  amount: string,
) {
  const currenciesForProvider = [Currency.ATOM];
  const currenciesForRecipientAsProvider = [Currency.NEAR];
  const currenciesForSender = [Currency.NEAR, Currency.CELO, Currency.XTZ];
  const currenciesForAmount = [Currency.ATOM, Currency.NEAR];
  const currenciesForDelegateType = [Currency.ATOM, Currency.SOL, Currency.XTZ];
  const currenciesForStakeType = [Currency.NEAR];
  const currenciesForLockType = [Currency.CELO];

  const currency = delegation.account.currency;
  const provider = delegation.provider;

  await app.operationDetails.waitForOperationDetails();
  await app.operationDetails.checkAccount(delegation.account.accountName);

  if (currenciesForAmount.includes(currency)) {
    await app.operationDetails.checkDelegatedAmount(amount);
  }
  if (currenciesForProvider.includes(currency)) {
    await app.operationDetails.checkProvider(provider);
  }
  if (currenciesForRecipientAsProvider.includes(currency)) {
    await app.operationDetails.checkRecipient(provider);
  }
  if (currenciesForSender.includes(currency)) {
    await app.operationDetails.checkSender(delegation.account.address);
  }
  if (currenciesForDelegateType.includes(currency)) {
    await app.operationDetails.checkTransactionType("DELEGATE");
  }
  if (currenciesForStakeType.includes(currency)) {
    await app.operationDetails.checkTransactionType("STAKE");
  }
  if (currenciesForLockType.includes(currency)) {
    await app.operationDetails.checkTransactionType("LOCK");
  }
}
