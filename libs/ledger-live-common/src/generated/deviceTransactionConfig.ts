import casper from "../families/casper/deviceTransactionConfig";
import celo from "../families/celo/deviceTransactionConfig";
import algorand from "@ledgerhq/coin-algorand/deviceTransactionConfig";
import bitcoin from "@ledgerhq/coin-bitcoin/deviceTransactionConfig";
import cardano from "@ledgerhq/coin-cardano/deviceTransactionConfig";
import cosmos from "@ledgerhq/coin-cosmos/deviceTransactionConfig";
import elrond from "@ledgerhq/coin-elrond/deviceTransactionConfig";
import evm from "@ledgerhq/coin-evm/deviceTransactionConfig";
import hedera from "@ledgerhq/coin-hedera/deviceTransactionConfig";
import filecoin from "@ledgerhq/coin-filecoin/deviceTransactionConfig";
import internet_computer from "@ledgerhq/coin-internet_computer/deviceTransactionConfig";
import icon from "@ledgerhq/coin-icon/deviceTransactionConfig";
import near from "@ledgerhq/coin-near/deviceTransactionConfig";
import polkadot from "@ledgerhq/coin-polkadot/deviceTransactionConfig";
import solana from "@ledgerhq/coin-solana/deviceTransactionConfig";
import stacks from "@ledgerhq/coin-stacks/deviceTransactionConfig";
import stellar from "@ledgerhq/coin-stellar/deviceTransactionConfig";
import tezos from "@ledgerhq/coin-tezos/deviceTransactionConfig";
import ton from "@ledgerhq/coin-ton/deviceTransactionConfig";
import tron from "@ledgerhq/coin-tron/deviceTransactionConfig";
import xrp from "@ledgerhq/coin-xrp/deviceTransactionConfig";

export default {
  casper,
  celo,
  algorand,
  bitcoin,
  cardano,
  cosmos,
  elrond,
  evm,
  hedera,
  filecoin,
  internet_computer,
  icon,
  near,
  polkadot,
  solana,
  stacks,
  stellar,
  tezos,
  ton,
  tron,
  xrp,
};
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_casper } from "../families/casper/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_filecoin } from "@ledgerhq/coin-filecoin/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stacks } from "@ledgerhq/coin-stacks/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_polkadot } from "@ledgerhq/coin-polkadot/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "@ledgerhq/coin-tron/bridge/deviceTransactionConfig";

export type ExtraDeviceTransactionField =
  | ExtraDeviceTransactionField_casper
  | ExtraDeviceTransactionField_filecoin
  | ExtraDeviceTransactionField_stacks
  | ExtraDeviceTransactionField_polkadot
  | ExtraDeviceTransactionField_tron;
