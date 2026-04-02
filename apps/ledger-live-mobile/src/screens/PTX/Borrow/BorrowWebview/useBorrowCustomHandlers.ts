import type { AccountLike } from "@ledgerhq/types-live";
import { WebviewProps } from "~/components/Web3AppWebview/types";
import { useCustomExchangeHandlers } from "~/components/WebPTXPlayer/CustomHandlers";

export function useBorrowCustomHandlers(
  manifest: WebviewProps["manifest"],
  accounts: AccountLike[],
) {
  return useCustomExchangeHandlers({ manifest, accounts });
}
