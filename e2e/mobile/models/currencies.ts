import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

export const getCurrencyManagerApp = (currencyId: string) =>
  findCryptoCurrencyById(currencyId)?.managerAppName.toLowerCase().split(" ")[0];
