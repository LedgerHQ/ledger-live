import { createResolver } from "../../bridge/jsHelpers";
import { Resolver } from "../../hw/getAddress/types";
import type { EvmAddress, EvmSignature, EvmSigner } from "@ledgerhq/coin-evm/signer";
import * as ethSigner from "@ledgerhq/hw-app-eth";
import polkadotResolver from "@ledgerhq/coin-evm/hw-getAddress";

export const resolver: Resolver = createResolver<EvmSigner, EvmAddress | EvmSignature>(
  transport => {
    return new ethSigner.default(transport);
  },
  polkadotResolver,
);
