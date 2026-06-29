import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import addAccountFlowByFamily from "~/generated/AddAccountFlow";
import type { AddAccountFlowHandlers } from "./addAccountFlowContract";

const isAddAccountFlowFamily = (family: string): family is keyof typeof addAccountFlowByFamily =>
  Object.prototype.hasOwnProperty.call(addAccountFlowByFamily, family);

export const getAddAccountFlowHandlers = (
  currency: CryptoOrTokenCurrency,
): AddAccountFlowHandlers | null => {
  if (currency.type !== "CryptoCurrency") return null;
  if (!isAddAccountFlowFamily(currency.family)) return null;
  return addAccountFlowByFamily[currency.family];
};
