import { urls } from "~/utils/urls";

export type SwapTermsProvider = keyof typeof urls.swap.providers;

const CHANGELLY_PROVIDER = "changelly";
const NEAR_INTENTS_PROVIDER = "nearintents";

export type SwapTermsCopy = Readonly<{
  /** The provider whose terms apply: `changelly_v2` and the like share the Changelly ones. */
  providerName: string;
  acceptTerms: string;
  /** The links of the sentence, in the order of its placeholders. Empty for an unknown provider. */
  links: string[];
}>;

function isSwapTermsProvider(name: string): name is SwapTermsProvider {
  return name in urls.swap.providers;
}

function getAcceptTermsKey(providerName: string): string {
  if (providerName === NEAR_INTENTS_PROVIDER)
    return "DeviceAction.confirmSwap.nearIntentsAcceptTerms";
  if (providerName === CHANGELLY_PROVIDER) {
    return "DeviceAction.confirmSwap.changellySimplifiedAcceptTerms";
  }
  return "DeviceAction.confirmSwap.acceptTerms";
}

/**
 * The terms the user accepts by confirming a swap on the device. The legacy confirmation and the
 * Device Intent drawer both show them, so they must agree on every provider.
 */
export function getSwapTermsCopy(provider: string): SwapTermsCopy {
  const providerName = provider.includes(CHANGELLY_PROVIDER) ? CHANGELLY_PROVIDER : provider;
  const providerUrls = isSwapTermsProvider(providerName)
    ? urls.swap.providers[providerName]
    : undefined;
  const isChangelly = providerName === CHANGELLY_PROVIDER;

  const links = [
    providerUrls?.tos,
    isChangelly && providerUrls && "amlKyc" in providerUrls ? providerUrls.amlKyc : undefined,
    isChangelly && providerUrls && "support" in providerUrls ? providerUrls.support : undefined,
  ].filter((url): url is string => Boolean(url));

  return { providerName, acceptTerms: getAcceptTermsKey(providerName), links };
}
