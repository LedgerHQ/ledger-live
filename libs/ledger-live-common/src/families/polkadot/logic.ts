// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-polkadot/logic";

import { createResolver } from "../../bridge/jsHelpers";
import { Resolver } from "../../hw/getAddress/types";
import type {
  PolkadotAddress,
  PolkadotSignature,
  PolkadotSigner,
} from "@ledgerhq/coin-polkadot/signer";
import * as polkadotSigner from "@ledgerhq/hw-app-polkadot";
import polkadotResolver from "@ledgerhq/coin-polkadot/hw-getAddress";

export const resolver: Resolver = createResolver<
  PolkadotSigner,
  PolkadotAddress | PolkadotSignature
>((transport) => {
  return new polkadotSigner.default(transport);
}, polkadotResolver);
