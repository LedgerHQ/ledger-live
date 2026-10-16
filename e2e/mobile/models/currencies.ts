import { findCryptoCurrencyById } from "@domain/entity-currency-crypto/legacy";

export const getCurrencyManagerApp = (currencyId: string) =>
  findCryptoCurrencyById(currencyId)?.managerAppName.toLowerCase().split(" ")[0];
