import algorand from "@ledgerhq/coin-algorand/deviceTransactionConfig";
import aptos from "@ledgerhq/coin-aptos/deviceTransactionConfig";
import bitcoin from "@ledgerhq/coin-bitcoin/deviceTransactionConfig";
import cardano from "@ledgerhq/coin-cardano/deviceTransactionConfig";
import casper from "@ledgerhq/coin-casper/deviceTransactionConfig";
import celo from "@ledgerhq/coin-celo/deviceTransactionConfig";
import cosmos from "@ledgerhq/coin-cosmos/deviceTransactionConfig";
import evm from "@ledgerhq/coin-evm/deviceTransactionConfig";
import hedera from "@ledgerhq/coin-hedera/deviceTransactionConfig";
import filecoin from "@ledgerhq/coin-filecoin/deviceTransactionConfig";
import internet_computer from "@ledgerhq/coin-internet_computer/deviceTransactionConfig";
import icon from "@ledgerhq/coin-icon/deviceTransactionConfig";
import multiversx from "@ledgerhq/coin-multiversx/deviceTransactionConfig";
import near from "@ledgerhq/coin-near/deviceTransactionConfig";
import polkadot from "@ledgerhq/coin-polkadot/deviceTransactionConfig";
import solana from "@ledgerhq/coin-solana/deviceTransactionConfig";
import stacks from "@ledgerhq/coin-stacks/deviceTransactionConfig";
import stellar from "@ledgerhq/coin-stellar/deviceTransactionConfig";
import tezos from "@ledgerhq/coin-tezos/deviceTransactionConfig";
import ton from "@ledgerhq/coin-ton/deviceTransactionConfig";
import tron from "@ledgerhq/coin-tron/deviceTransactionConfig";
import xrp from "@ledgerhq/coin-xrp/deviceTransactionConfig";
import mina from "@ledgerhq/coin-mina/deviceTransactionConfig";

export default {
  algorand,
  aptos,
  bitcoin,
  cardano,
  casper,
  celo,
  cosmos,
  evm,
  hedera,
  filecoin,
  internet_computer,
  icon,
  multiversx,
  near,
  polkadot,
  solana,
  stacks,
  stellar,
  tezos,
  ton,
  tron,
  xrp,
  mina,
};
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_aptos } from "@ledgerhq/coin-aptos/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_casper } from "@ledgerhq/coin-casper/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_filecoin } from "@ledgerhq/coin-filecoin/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stacks } from "@ledgerhq/coin-stacks/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_polkadot } from "@ledgerhq/coin-polkadot/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "@ledgerhq/coin-tron/bridge/deviceTransactionConfig";

export type ExtraDeviceTransactionField =
  | ExtraDeviceTransactionField_aptos
  | ExtraDeviceTransactionField_casper
  | ExtraDeviceTransactionField_filecoin
  | ExtraDeviceTransactionField_stacks
  | ExtraDeviceTransactionField_polkadot
  | ExtraDeviceTransactionField_tron;
