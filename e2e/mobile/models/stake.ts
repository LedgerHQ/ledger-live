import { DelegateType } from "@ledgerhq/live-common/e2e/models/Delegate";

export async function verifyAppValidationStakeInfo(
  delegation: DelegateType,
  amount: string,
  fees?: string,
) {
  const currenciesForValidationAmount = [
    Currency.ATOM,
    Currency.NEAR,
    Currency.CELO,
    Currency.INJ,
    Currency.OSMO,
    Currency.MULTIVERS_X,
  ];
  const currenciesForValidationProvider = [
    Currency.ATOM,
    Currency.XTZ,
    Currency.INJ,
    Currency.OSMO,
  ];

  const currency = delegation.account.currency;
  const provider = delegation.provider;

  await app.deviceValidation.expectDeviceValidationScreen();

  if (currenciesForValidationAmount.includes(currency)) {
    await app.deviceValidation.expectAmount(amount);
  }
  if (currenciesForValidationProvider.includes(currency)) {
    await app.deviceValidation.expectProvider(provider);
  }

  if (fees) {
    await app.deviceValidation.expectFees(fees);
  }
}

export async function verifyStakeOperationDetailsInfo(
  delegation: DelegateType,
  amount: string,
  fees?: string,
) {
  const currenciesForProvider = [Currency.ATOM, Currency.INJ, Currency.OSMO, Currency.MULTIVERS_X];
  const currenciesForRecipientAsProvider = [Currency.NEAR];
  const currenciesForSender = [Currency.NEAR, Currency.CELO, Currency.XTZ, Currency.MULTIVERS_X];
  const currenciesForAmount = [
    Currency.ATOM,
    Currency.NEAR,
    Currency.INJ,
    Currency.OSMO,
    Currency.MULTIVERS_X,
  ];
  const currenciesForDelegateType = [
    Currency.ATOM,
    Currency.SOL,
    Currency.XTZ,
    Currency.INJ,
    Currency.OSMO,
    Currency.ADA,
    Currency.MULTIVERS_X,
  ];
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
  if (fees) {
    await app.operationDetails.checkFees(fees);
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
