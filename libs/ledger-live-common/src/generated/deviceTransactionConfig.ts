import algorand from "../families/algorand/deviceTransactionConfig";
import bitcoin from "../families/bitcoin/deviceTransactionConfig";
import cardano from "../families/cardano/deviceTransactionConfig";
import celo from "../families/celo/deviceTransactionConfig";
import cosmos from "../families/cosmos/deviceTransactionConfig";
import crypto_org from "../families/crypto_org/deviceTransactionConfig";
import elrond from "../families/elrond/deviceTransactionConfig";
import ethereum from "../families/ethereum/deviceTransactionConfig";
import evm from "../families/evm/deviceTransactionConfig";
import filecoin from "../families/filecoin/deviceTransactionConfig";
import hedera from "../families/hedera/deviceTransactionConfig";
import near from "../families/near/deviceTransactionConfig";
import ripple from "../families/ripple/deviceTransactionConfig";
import solana from "../families/solana/deviceTransactionConfig";
import stellar from "../families/stellar/deviceTransactionConfig";
import tezos from "../families/tezos/deviceTransactionConfig";
import tron from "../families/tron/deviceTransactionConfig";
import zilliqa from "../families/zilliqa/deviceTransactionConfig";
import polkadot from "@ledgerhq/coin-polkadot/deviceTransactionConfig";
import zilliqa from "../families/zilliqa/deviceTransactionConfig";

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
  polkadot,
  zilliqa,
};
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_cosmos } from "../families/cosmos/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_filecoin } from "../families/filecoin/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stellar } from "../families/stellar/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tezos } from "../families/tezos/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "../families/tron/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_polkadot } from "@ledgerhq/coin-polkadot/deviceTransactionConfig";

export type ExtraDeviceTransactionField =
  | ExtraDeviceTransactionField_cosmos
  | ExtraDeviceTransactionField_filecoin
  | ExtraDeviceTransactionField_stellar
  | ExtraDeviceTransactionField_tezos
  | ExtraDeviceTransactionField_tron
  | ExtraDeviceTransactionField_polkadot;
