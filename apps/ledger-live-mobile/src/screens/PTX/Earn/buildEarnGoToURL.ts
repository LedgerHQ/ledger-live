import { addParamsToURL } from "@ledgerhq/live-common/wallet-api/helpers";

/** Merges Earn init params into a partner dapp URL (getInitialURL does not merge `inputs` when goToURL is set). */
export function buildEarnGoToURL(
  customDappUrl: string,
  initParams: Record<string, string | undefined>,
): string {
  try {
    const url = new URL(customDappUrl);
    addParamsToURL(url, initParams);
    return url.toString();
  } catch {
    return customDappUrl;
  }
}
