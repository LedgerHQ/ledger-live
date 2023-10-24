import bitcoin from "../families/bitcoin/hw-getAddress";
import cardano from "../families/cardano/hw-getAddress";
import casper from "../families/casper/hw-getAddress";
import celo from "../families/celo/hw-getAddress";
import cosmos from "../families/cosmos/hw-getAddress";
import crypto_org from "../families/crypto_org/hw-getAddress";
import elrond from "../families/elrond/hw-getAddress";
import filecoin from "../families/filecoin/hw-getAddress";
import hedera from "../families/hedera/hw-getAddress";
import internet_computer from "../families/internet_computer/hw-getAddress";
import near from "../families/near/hw-getAddress";
import ripple from "../families/ripple/hw-getAddress";
import solana from "../families/solana/hw-getAddress";
import stacks from "../families/stacks/hw-getAddress";
import stellar from "../families/stellar/hw-getAddress";
import tezos from "../families/tezos/hw-getAddress";
import tron from "../families/tron/hw-getAddress";
import vechain from "../families/vechain/hw-getAddress";
import { resolver as algorand } from "../families/algorand/setup";
import { resolver as evm } from "../families/evm/setup";
import { resolver as polkadot } from "../families/polkadot/setup";

export default {
  bitcoin,
  cardano,
  casper,
  celo,
  cosmos,
  crypto_org,
  elrond,
  filecoin,
  hedera,
  internet_computer,
  near,
  ripple,
  solana,
  stacks,
  stellar,
  tezos,
  tron,
  vechain,
  algorand,
  evm,
};
