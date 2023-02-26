import celo from "../families/celo/cli-transaction";
import cosmos from "../families/cosmos/cli-transaction";
import crypto_org from "../families/crypto_org/cli-transaction";
import elrond from "../families/elrond/cli-transaction";
import filecoin from "../families/filecoin/cli-transaction";
import hedera from "../families/hedera/cli-transaction";
<<<<<<< HEAD
import stacks from "../families/stacks/cli-transaction";
import icon from "../families/icon/cli-transaction";
=======
import icon from "../families/icon/cli-transaction";
import near from "../families/near/cli-transaction";
import osmosis from "../families/osmosis/cli-transaction";
import polkadot from "../families/polkadot/cli-transaction";
import ripple from "../families/ripple/cli-transaction";
import solana from "../families/solana/cli-transaction";
>>>>>>> 414b5dbd18 (feat: add staking feature for icon network)
import stellar from "../families/stellar/cli-transaction";
import tron from "../families/tron/cli-transaction";
import vechain from "../families/vechain/cli-transaction";
import { cliTools as algorand } from "../families/algorand/setup";
import { cliTools as bitcoin } from "../families/bitcoin/setup";
import { cliTools as cardano } from "../families/cardano/setup";
import { cliTools as evm } from "../families/evm/setup";
import { cliTools as near } from "../families/near/setup";
import { cliTools as polkadot } from "../families/polkadot/setup";
import { cliTools as solana } from "../families/solana/setup";
import { cliTools as tezos } from "../families/tezos/setup";
import { cliTools as xrp } from "../families/xrp/setup";

export default {
  celo,
  cosmos,
  crypto_org,
  elrond,
  filecoin,
  hedera,
<<<<<<< HEAD
  stacks,
  icon,
=======
  icon,
  near,
  osmosis,
  polkadot,
  ripple,
  solana,
>>>>>>> 414b5dbd18 (feat: add staking feature for icon network)
  stellar,
  tron,
  vechain,
  algorand,
  bitcoin,
  cardano,
  evm,
  near,
  polkadot,
  solana,
  tezos,
  xrp,
};
