import casper from "../families/casper/hw-getAddress";
import celo from "../families/celo/hw-getAddress";
import crypto_org from "../families/crypto_org/hw-getAddress";
import filecoin from "../families/filecoin/hw-getAddress";
import hedera from "../families/hedera/hw-getAddress";
import internet_computer from "../families/internet_computer/hw-getAddress";
import stacks from "../families/stacks/hw-getAddress";
import { resolver as algorand } from "../families/algorand/setup";
import { resolver as bitcoin } from "../families/bitcoin/setup";
import { resolver as cardano } from "../families/cardano/setup";
import { resolver as cosmos } from "../families/cosmos/setup";
import { resolver as elrond } from "../families/elrond/setup";
import { resolver as evm } from "../families/evm/setup";
import { resolver as icon } from "../families/icon/setup";
import { resolver as near } from "../families/near/setup";
import { resolver as polkadot } from "../families/polkadot/setup";
import { resolver as solana } from "../families/solana/setup";
import { resolver as stellar } from "../families/stellar/setup";
import { resolver as tezos } from "../families/tezos/setup";
import { resolver as ton } from "../families/ton/setup";
import { resolver as tron } from "../families/tron/setup";
import { resolver as xrp } from "../families/xrp/setup";

export default {
  casper,
  celo,
  crypto_org,
  filecoin,
  hedera,
  internet_computer,
  stacks,
  algorand,
  bitcoin,
  cardano,
  cosmos,
  elrond,
  evm,
  icon,
  near,
  polkadot,
  solana,
  stellar,
  tezos,
  ton,
  tron,
  xrp,
};
