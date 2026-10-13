import { createMultiAddressAccountLayer } from "../../../bridge/generic-coin-framework/multiAddressAccountLayer";
import { bitcoinFamily } from "./family";

/** The bitcoin family's account layer on the generic bridge: the multi-address engine (ADR-065). */
export const bitcoinAccountLayer = createMultiAddressAccountLayer(bitcoinFamily);

export { computeIntentType } from "./selection";
