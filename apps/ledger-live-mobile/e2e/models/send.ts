import { TransactionType } from "@ledgerhq/live-common/e2e/models/Transaction";

export async function verifyAppValidationSendInfo(transaction: TransactionType, amount: string) {
  const currenciesForValidationAmount = [
    Currency.sepETH,
    Currency.DOT,
    Currency.POL,
    Currency.ALGO,
    Currency.ADA,
    Currency.DOGE,
    Currency.SOL,
    Currency.TRX,
    Currency.XLM,
    Currency.XRP,
    Currency.ATOM,
    Currency.BCH,
  ];

  const currenciesForValidationRecipient = [Currency.sepETH, Currency.POL];
  const currenciesForValidationSender = [Currency.ATOM];

  const currency = transaction.accountToCredit.currency;
  const addressRecipient = transaction.accountToCredit.address;
  const addressSender = transaction.accountToDebit.address;
  const ensName = transaction.accountToCredit.ensName;

  await app.deviceValidation.expectDeviceValidationScreen();

  if (currenciesForValidationAmount.includes(currency)) {
    await app.deviceValidation.expectAmount(amount);
  }

  if (currenciesForValidationRecipient.includes(currency)) {
    await app.deviceValidation.expectAddress(addressRecipient);
  }

  if (currenciesForValidationSender.includes(currency)) {
    await app.deviceValidation.expectAddress(addressSender);
  }

  if (ensName) {
    await app.send.expectValidationEnsName(ensName);
  }
}
