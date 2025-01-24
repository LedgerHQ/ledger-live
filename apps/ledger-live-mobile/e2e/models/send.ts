import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Application } from "../page";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";

export async function verifyAppValidationSendInfo(
  app: Application,
  transaction: Transaction,
  amount: string,
) {
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

  if (currenciesForValidationAmount.includes(currency)) {
    await app.deviceValidation.expectAmount(amount);
  }

  if (currenciesForValidationRecipient.includes(currency)) {
    await app.deviceValidation.expectAddress(addressRecipient);
  }

  if (currenciesForValidationSender.includes(currency)) {
    await app.deviceValidation.expectAddress(addressSender);
  }
}
