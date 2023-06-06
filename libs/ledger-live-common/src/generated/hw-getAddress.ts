import bitcoin from "../families/bitcoin/hw-getAddress";
import cardano from "../families/cardano/hw-getAddress";
import celo from "../families/celo/hw-getAddress";
import cosmos from "../families/cosmos/hw-getAddress";
import crypto_org from "../families/crypto_org/hw-getAddress";
import elrond from "../families/elrond/hw-getAddress";
import ethereum from "../families/ethereum/hw-getAddress";
import filecoin from "../families/filecoin/hw-getAddress";
import hedera from "../families/hedera/hw-getAddress";
import near from "../families/near/hw-getAddress";
import ripple from "../families/ripple/hw-getAddress";
import solana from "../families/solana/hw-getAddress";
import stellar from "../families/stellar/hw-getAddress";
import tezos from "../families/tezos/hw-getAddress";
import tron from "../families/tron/hw-getAddress";
import { createResolver } from "../bridge/jsHelpers";
import { Resolver } from "../hw/getAddress/types";
import type { AlgorandSigner } from "@ledgerhq/coin-algorand/signer";
import * as algorandSigner from "@ledgerhq/hw-app-algorand";
import algorandResolver from "@ledgerhq/coin-algorand/hw-getAddress";
const algorand: Resolver = createResolver<AlgorandSigner>((transport) => {
  return new algorandSigner.default(transport);
}, algorandResolver);
import type { EvmSigner } from "@ledgerhq/coin-evm/signer";
import * as evmSigner from "@ledgerhq/hw-app-eth";
import evmResolver from "@ledgerhq/coin-evm/hw-getAddress";
const evm: Resolver = createResolver<EvmSigner>((transport) => {
  return new evmSigner.default(transport);
}, evmResolver);
import type { PolkadotSigner } from "@ledgerhq/coin-polkadot/signer";
import * as polkadotSigner from "@ledgerhq/hw-app-polkadot";
import polkadotResolver from "@ledgerhq/coin-polkadot/hw-getAddress";
const polkadot: Resolver = createResolver<PolkadotSigner>((transport) => {
  return new polkadotSigner.default(transport);
}, polkadotResolver);

export default {
  bitcoin,
  cardano,
  celo,
  cosmos,
  crypto_org,
  elrond,
  ethereum,
  filecoin,
  hedera,
  near,
  ripple,
  solana,
  stellar,
  tezos,
  tron,
  algorand,
  evm,
  polkadot,
};
