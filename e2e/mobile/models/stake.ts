import { DelegateType } from "@ledgerhq/live-e2e-shared/models/Delegate";

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
  operationType?: "VOTE",
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
    Currency.SUI,
    Currency.XTZ,
    Currency.INJ,
    Currency.OSMO,
    Currency.ADA,
    Currency.MULTIVERS_X,
    Currency.SEI_EVM,
  ];
  const currenciesForStakeType = [Currency.NEAR];
  const currenciesForLockType = [Currency.CELO];
  const currenciesForVoteType = [Currency.CELO];

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
    await app.operationDetails.checkRecipientAsProvider(provider);
  }
  if (currenciesForSender.includes(currency)) {
    const address = delegation.account.address;
    if (address) {
      await app.operationDetails.checkSender(address);
    } else {
      throw new Error("Account address is undefined");
    }
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
  if (operationType === "VOTE" && currenciesForVoteType.includes(currency)) {
    await app.operationDetails.checkTransactionType("VOTE");
    await app.operationDetails.checkCeloValidatorGroup(provider);
  } else if (currenciesForLockType.includes(currency)) {
    await app.operationDetails.checkTransactionType("LOCK");
  }
}

// Matches the sibling XTZ op-details shape (account + sender + type); the principal amount is
// verified on the device screen (delegateTezos), not re-checked here.
export async function verifyTezosStakingOperationDetails(
  delegation: DelegateType,
  kind: "stake" | "unstake",
) {
  const address = delegation.account.address;
  if (!address) {
    throw new Error("Account address is undefined");
  }

  await app.operationDetails.waitForOperationDetails();
  await app.operationDetails.checkAccount(delegation.account.accountName);
  await app.operationDetails.checkSender(address);
  if (kind === "stake") {
    await app.operationDetails.checkTransactionType("STAKE");
  } else {
    // Tezos renders UNSTAKE as "Unstaking" (its own i18n override, since funds stay pending ~4
    // days); the shared operationsType map keeps the generic "Unstaked" for other families.
    await app.operationDetails.checkTransactionTitle("Unstaking");
  }
}
