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
import algorand from "@ledgerhq/coin-algorand/hw-getAddress";
import evm from "@ledgerhq/coin-evm/hw-getAddress";
import { of } from "rxjs";
import type Transport from "@ledgerhq/hw-transport";
import type {
  Result,
  GetAddressOptions,
} from "@ledgerhq/coin-framework/derivation";
import { withDevicePromise } from "../hw/deviceAccess";
import * as polkadotSigner from "@ledgerhq/hw-app-polkadot";
import polkadotResolver from "@ledgerhq/coin-polkadot/hw-getAddress";
const polkadot = async (
  transport: Transport,
  opts: GetAddressOptions
): Promise<Result> => {
  const signer = await withDevicePromise("", (transport: Transport) =>
    of(new polkadotSigner.default(transport))
  );
  return polkadotResolver(signer)(opts);
};

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
  polkadot,
  algorand,
  evm,
};
