import type { Account } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import type { AppRequest } from "../../hw/actions/app";
import { isSwapDisableAppsInstall } from "../swap/utils/isIntegrationTestEnv";
import { isExchangeSwap, type Exchange } from "../types";

type ExchangeMainAccounts = Readonly<{
  mainFromAccount: Account | null;
  mainToAccount: Account | null;
}>;

/** The accounts whose coin apps the Exchange app needs next to it, when the exchange has them. */
export function getExchangeMainAccounts(
  exchange: Partial<Exchange> | undefined,
): ExchangeMainAccounts {
  const mainFromAccount = exchange?.fromAccount
    ? getMainAccount(exchange.fromAccount, exchange.fromParentAccount)
    : null;
  const mainToAccount =
    exchange &&
    isExchangeSwap(exchange as Exchange) &&
    "toAccount" in exchange &&
    exchange.toAccount
      ? getMainAccount(exchange.toAccount, exchange.toParentAccount)
      : null;
  return { mainFromAccount, mainToAccount };
}

/**
 * The device context every step of an exchange runs in: the Exchange app, with the coin apps of
 * the accounts involved installed next to it. Start, confirmation and signature all share it
 * because the Exchange app hands over to the coin app on its own.
 */
export function buildExchangeAppRequest({
  mainFromAccount,
  mainToAccount,
}: Partial<ExchangeMainAccounts>): AppRequest {
  if (isSwapDisableAppsInstall()) {
    return { appName: "Exchange" };
  }

  const dependencies: NonNullable<AppRequest["dependencies"]> = [];
  if (mainFromAccount) {
    dependencies.push({ appName: mainFromAccount.currency.managerAppName });
  }
  if (mainToAccount) {
    dependencies.push({ appName: mainToAccount.currency.managerAppName });
  }

  const shouldAddEthApp =
    (mainFromAccount?.currency.family === "evm" || mainToAccount?.currency.family === "evm") &&
    mainFromAccount?.currency.managerAppName !== "Ethereum" &&
    mainToAccount?.currency.managerAppName !== "Ethereum";

  // For cases like wanting AVAX to use the ETH app.
  if (shouldAddEthApp) {
    dependencies.push({ appName: "Ethereum" });
  }

  return { appName: "Exchange", dependencies, requireLatestFirmware: true };
}
