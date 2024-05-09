import cardano from "../families/cardano/cli-transaction";
import celo from "../families/celo/cli-transaction";
import cosmos from "../families/cosmos/cli-transaction";
import crypto_org from "../families/crypto_org/cli-transaction";
import elrond from "../families/elrond/cli-transaction";
import filecoin from "../families/filecoin/cli-transaction";
import hedera from "../families/hedera/cli-transaction";
import ripple from "../families/ripple/cli-transaction";
import stacks from "../families/stacks/cli-transaction";
import stellar from "../families/stellar/cli-transaction";
import tezos from "../families/tezos/cli-transaction";
import tron from "../families/tron/cli-transaction";
import vechain from "../families/vechain/cli-transaction";
import { cliTools as algorand } from "../families/algorand/setup";
import { cliTools as bitcoin } from "../families/bitcoin/setup";
import { cliTools as evm } from "../families/evm/setup";
import { cliTools as near } from "../families/near/setup";
import { cliTools as polkadot } from "../families/polkadot/setup";
import { cliTools as solana } from "../families/solana/setup";

export default {
  cardano,
  celo,
  cosmos,
  crypto_org,
  elrond,
  filecoin,
  hedera,
  ripple,
  stacks,
  stellar,
  tezos,
  tron,
  vechain,
  algorand,
  bitcoin,
  evm,
  near,
  polkadot,
  solana,
};
