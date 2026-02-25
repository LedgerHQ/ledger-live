import { DeeplinkHandlerRegistry, DeeplinkRoute, DeeplinkHandlerContext } from "./types";

import { accountsHandler, accountHandler } from "./handlers/accounts.handler";
import { addAccountHandler } from "./handlers/addAccount.handler";
import { buyHandler } from "./handlers/buy.handler";
import { earnHandler } from "./handlers/earn.handler";
import { managerHandler } from "./handlers/manager.handler";
import { swapHandler } from "./handlers/swap.handler";
import { bridgeHandler } from "./handlers/bridge.handler";
import { sendHandler, receiveHandler, delegateHandler } from "./handlers/transactionFlow.handler";
import { settingsHandler } from "./handlers/settings.handler";
import { cardHandler, discoverHandler, walletConnectHandler } from "./handlers/discover.handler";
import { marketHandler, assetHandler } from "./handlers/market.handler";
import { recoverHandler, recoverRestoreFlowHandler } from "./handlers/recover.handler";
import { postOnboardingHandler } from "./handlers/postOnboarding.handler";
import { ledgerSyncHandler } from "./handlers/ledgerSync.handler";
import { defaultHandler } from "./handlers/default.handler";

export const deeplinkRegistry: DeeplinkHandlerRegistry = {
  accounts: accountsHandler,
  account: accountHandler,
  "add-account": addAccountHandler,
  buy: buyHandler,
  earn: earnHandler,
  myledger: managerHandler,
  swap: swapHandler,
  bridge: bridgeHandler,
  send: sendHandler,
  receive: receiveHandler,
  delegate: delegateHandler,
  settings: settingsHandler,
  card: cardHandler,
  discover: discoverHandler,
  wc: walletConnectHandler,
  market: marketHandler,
  asset: assetHandler,
  recover: recoverHandler,
  "recover-restore-flow": recoverRestoreFlowHandler,
  "post-onboarding": postOnboardingHandler,
  ledgersync: ledgerSyncHandler,
  default: defaultHandler,
};

export function executeHandler(
  route: DeeplinkRoute,
  context: DeeplinkHandlerContext,
): void | Promise<void> {
  const handler = deeplinkRegistry[route.type];

  if (handler) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
    return (handler as any)(route, context);
  }

  return defaultHandler({ type: "default" }, context);
}
