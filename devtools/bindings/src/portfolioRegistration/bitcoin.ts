import { portfolioNetworkOf } from "@domain/api-account-portfolio";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import type { PortfolioRegistrationStrategy } from "./types";

/** What the Portfolio service accepts as an xpub to derive addresses from. */
const SERVICE_XPUB = /^[1-9A-HJ-NP-Za-km-z]{111}$/;
/** The service derives addresses from a full path, while a descriptor stops at the account. */
const FIRST_ADDRESS_SUFFIX = "/0/0";

/** A Bitcoin account is registered by its xpub; the service derives its addresses. */
export const bitcoinRegistration: PortfolioRegistrationStrategy = {
  register(descriptor) {
    if (descriptor.type !== "utxo" || descriptor.network.name !== "bitcoin") return undefined;
    const network = portfolioNetworkOf(currencyIdFromNetwork(descriptor.network));
    if (!network || !SERVICE_XPUB.test(descriptor.xpub)) return undefined;
    return {
      type: "auto_derive",
      network,
      xpub: descriptor.xpub,
      derivationPath: `${descriptor.path}${FIRST_ADDRESS_SUFFIX}`,
    };
  },
};
