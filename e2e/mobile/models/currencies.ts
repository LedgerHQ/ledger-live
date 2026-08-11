import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";

export const getCurrencyManagerApp = (currencyId: string) =>
  findCryptoCurrencyById(currencyId)?.managerAppName.toLowerCase().split(" ")[0];
