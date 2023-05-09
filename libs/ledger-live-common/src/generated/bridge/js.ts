import algorand from "../../families/algorand/bridge/js";
import bitcoin from "../../families/bitcoin/bridge/js";
import cardano from "../../families/cardano/bridge/js";
import celo from "../../families/celo/bridge/js";
import cosmos from "../../families/cosmos/bridge/js";
import crypto_org from "../../families/crypto_org/bridge/js";
import elrond from "../../families/elrond/bridge/js";
import ethereum from "../../families/ethereum/bridge/js";
import evm from "../../families/evm/bridge/js";
import filecoin from "../../families/filecoin/bridge/js";
import hedera from "../../families/hedera/bridge/js";
import near from "../../families/near/bridge/js";
import ripple from "../../families/ripple/bridge/js";
import solana from "../../families/solana/bridge/js";
import stellar from "../../families/stellar/bridge/js";
import tezos from "../../families/tezos/bridge/js";
import tron from "../../families/tron/bridge/js";
import zilliqa from "../../families/zilliqa/bridge/js";
import { makeLRUCache } from "../../cache";
import network from "../../network";
import { withDevice } from "../../hw/deviceAccess";
import { createBridges as polkadotCreateBridges } from "@ledgerhq/coin-polkadot/bridge/js";

export default {
  algorand,
  bitcoin,
  cardano,
  celo,
  cosmos,
  crypto_org,
  elrond,
  ethereum,
  evm,
  filecoin,
  hedera,
  near,
  ripple,
  solana,
  stellar,
  tezos,
  tron,
  zilliqa,
  polkadot: polkadotCreateBridges(withDevice, network, makeLRUCache),
};
