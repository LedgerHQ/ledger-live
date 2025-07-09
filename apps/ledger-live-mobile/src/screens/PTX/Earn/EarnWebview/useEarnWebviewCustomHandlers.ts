import type { AccountLike } from "@ledgerhq/types-live";
import { WebviewProps } from "~/components/Web3AppWebview/types";

import { sendEarnLiveAppReady } from "../../../../../e2e/bridge/client";
import { useCustomExchangeHandlers } from "~/components/WebPTXPlayer/CustomHandlers";

export function useEarnCustomHandlers(manifest: WebviewProps["manifest"], accounts: AccountLike[]) {
  return useCustomExchangeHandlers({ manifest, accounts, sendAppReady: sendEarnLiveAppReady });
}
