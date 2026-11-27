import { addParamsToURL } from "@ledgerhq/live-common/wallet-api/helpers";
import { NATIVE_STAKE_POSITION_INPUT_KEY } from "@features/flow-stake-position";

/** Merges Earn init params into a partner dapp URL (getInitialURL does not merge `inputs` when goToURL is set). */
export function buildEarnGoToURL(
  customDappUrl: string,
  initParams: Record<string, string | undefined>,
): string {
  try {
    const url = new URL(customDappUrl);
    // Only the host grants the stake position capability, through `initParams` and its flag.
    url.searchParams.delete(NATIVE_STAKE_POSITION_INPUT_KEY);
    addParamsToURL(url, initParams);
    return url.toString();
  } catch {
    return customDappUrl;
  }
}
