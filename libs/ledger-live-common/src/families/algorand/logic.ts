// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-algorand/logic";

import { createResolver } from "../../bridge/jsHelpers";
import { Resolver } from "../../hw/getAddress/types";
import type {
  AlgorandAddress,
  AlgorandSignature,
  AlgorandSigner,
} from "@ledgerhq/coin-algorand/signer";
import * as algorandSigner from "@ledgerhq/hw-app-algorand";
import algorandResolver from "@ledgerhq/coin-algorand/hw-getAddress";

export const resolver: Resolver = createResolver<
  AlgorandSigner,
  AlgorandAddress | AlgorandSignature
>((transport) => {
  return new algorandSigner.default(transport);
}, algorandResolver);
