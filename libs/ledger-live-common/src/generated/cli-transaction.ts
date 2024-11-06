import celo from "../families/celo/cli-transaction";
import crypto_org from "../families/crypto_org/cli-transaction";
import filecoin from "../families/filecoin/cli-transaction";
import stacks from "../families/stacks/cli-transaction";
import vechain from "../families/vechain/cli-transaction";
import { cliTools as algorand } from "../families/algorand/setup";
import { cliTools as bitcoin } from "../families/bitcoin/setup";
import { cliTools as cardano } from "../families/cardano/setup";
import { cliTools as cosmos } from "../families/cosmos/setup";
import { cliTools as elrond } from "../families/elrond/setup";
import { cliTools as evm } from "../families/evm/setup";
import { cliTools as hedera } from "../families/hedera/setup";
import { cliTools as icon } from "../families/icon/setup";
import { cliTools as near } from "../families/near/setup";
import { cliTools as polkadot } from "../families/polkadot/setup";
import { cliTools as solana } from "../families/solana/setup";
import { cliTools as stellar } from "../families/stellar/setup";
import { cliTools as tezos } from "../families/tezos/setup";
import { cliTools as ton } from "../families/ton/setup";
import { cliTools as tron } from "../families/tron/setup";
import { cliTools as xrp } from "../families/xrp/setup";

export default {
  celo,
  crypto_org,
  filecoin,
  stacks,
  vechain,
  algorand,
  bitcoin,
  cardano,
  cosmos,
  elrond,
  evm,
  hedera,
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
