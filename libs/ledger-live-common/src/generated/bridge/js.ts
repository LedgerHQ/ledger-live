import bitcoin from "../../families/bitcoin/bridge/js";
import cardano from "../../families/cardano/bridge/js";
import celo from "../../families/celo/bridge/js";
import cosmos from "../../families/cosmos/bridge/js";
import crypto_org from "../../families/crypto_org/bridge/js";
import elrond from "../../families/elrond/bridge/js";
import ethereum from "../../families/ethereum/bridge/js";
import filecoin from "../../families/filecoin/bridge/js";
import hedera from "../../families/hedera/bridge/js";
import near from "../../families/near/bridge/js";
import ripple from "../../families/ripple/bridge/js";
import solana from "../../families/solana/bridge/js";
import stellar from "../../families/stellar/bridge/js";
import tezos from "../../families/tezos/bridge/js";
import tron from "../../families/tron/bridge/js";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { withDevice } from "../../hw/deviceAccess";
import { createBridges as polkadotCreateBridges } from "@ledgerhq/coin-polkadot/bridge/js";
import { createBridges as algorandCreateBridges } from "@ledgerhq/coin-algorand/bridge/js";
import { createBridges as evmCreateBridges } from "@ledgerhq/coin-evm/bridge/js";

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
  polkadot: polkadotCreateBridges(withDevice, network, makeLRUCache),
  algorand: algorandCreateBridges(withDevice, network, makeLRUCache),
  evm: evmCreateBridges(withDevice, network, makeLRUCache),
};
