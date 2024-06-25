import casper from "../families/casper/hw-getAddress";
import celo from "../families/celo/hw-getAddress";
import cosmos from "../families/cosmos/hw-getAddress";
import crypto_org from "../families/crypto_org/hw-getAddress";
import elrond from "../families/elrond/hw-getAddress";
import filecoin from "../families/filecoin/hw-getAddress";
import hedera from "../families/hedera/hw-getAddress";
import internet_computer from "../families/internet_computer/hw-getAddress";
import stacks from "../families/stacks/hw-getAddress";
import vechain from "../families/vechain/hw-getAddress";
import { resolver as algorand } from "../families/algorand/setup";
import { resolver as bitcoin } from "../families/bitcoin/setup";
import { resolver as cardano } from "../families/cardano/setup";
import { resolver as evm } from "../families/evm/setup";
import { resolver as near } from "../families/near/setup";
import { resolver as polkadot } from "../families/polkadot/setup";
import { resolver as solana } from "../families/solana/setup";
import { resolver as stellar } from "../families/stellar/setup";
import { resolver as tezos } from "../families/tezos/setup";
import { resolver as tron } from "../families/tron/setup";
import { resolver as xrp } from "../families/xrp/setup";
import { resolver as kadena } from "../families/kadena/setup";

export default {
  casper,
  celo,
  cosmos,
  crypto_org,
  elrond,
  filecoin,
  hedera,
  internet_computer,
  stacks,
  vechain,
  algorand,
  bitcoin,
  cardano,
  evm,
  near,
  polkadot,
  solana,
  stellar,
  tezos,
  tron,
  xrp,
  kadena,
};
