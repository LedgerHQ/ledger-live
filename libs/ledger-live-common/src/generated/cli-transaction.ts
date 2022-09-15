import algorand from "../families/algorand/cli-transaction";
import bitcoin from "../families/bitcoin/cli-transaction";
import cardano from "../families/cardano/cli-transaction";
import celo from "../families/celo/cli-transaction";
import cosmos from "../families/cosmos/cli-transaction";
import crypto_org from "../families/crypto_org/cli-transaction";
import elrond from "../families/elrond/cli-transaction";
import ethereum from "../families/ethereum/cli-transaction";
import filecoin from "../families/filecoin/cli-transaction";
import hedera from "../families/hedera/cli-transaction";
import near from "../families/near/cli-transaction";
import ripple from "../families/ripple/cli-transaction";
import solana from "../families/solana/cli-transaction";
import stacks from "../families/stacks/cli-transaction";
import stellar from "../families/stellar/cli-transaction";
import tezos from "../families/tezos/cli-transaction";
import tron from "../families/tron/cli-transaction";
import { makeLRUCache } from "../cache";
import network from "../network";
import polkadotCreateCliTools from "@ledgerhq/coin-polkadot/cli-transaction";

export default {
  algorand,
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
  stacks,
  stellar,
  tezos,
  tron,
  polkadot: polkadotCreateCliTools(network, makeLRUCache),
};
