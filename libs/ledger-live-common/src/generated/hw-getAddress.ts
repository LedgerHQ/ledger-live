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
import { resolver as algorand } from "../families/algorand/setup";
import { resolver as evm } from "../families/evm/setup";
import { resolver as polkadot } from "../families/polkadot/setup";

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
