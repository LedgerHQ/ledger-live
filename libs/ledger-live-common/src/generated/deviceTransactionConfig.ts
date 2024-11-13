import casper from "../families/casper/deviceTransactionConfig";
import celo from "../families/celo/deviceTransactionConfig";
import crypto_org from "../families/crypto_org/deviceTransactionConfig";
import filecoin from "../families/filecoin/deviceTransactionConfig";
import internet_computer from "../families/internet_computer/deviceTransactionConfig";
import stacks from "../families/stacks/deviceTransactionConfig";
import algorand from "@ledgerhq/coin-algorand/deviceTransactionConfig";
import bitcoin from "@ledgerhq/coin-bitcoin/deviceTransactionConfig";
import cardano from "@ledgerhq/coin-cardano/deviceTransactionConfig";
import cosmos from "@ledgerhq/coin-cosmos/deviceTransactionConfig";
import elrond from "@ledgerhq/coin-elrond/deviceTransactionConfig";
import evm from "@ledgerhq/coin-evm/deviceTransactionConfig";
import hedera from "@ledgerhq/coin-hedera/deviceTransactionConfig";
import icon from "@ledgerhq/coin-icon/deviceTransactionConfig";
import near from "@ledgerhq/coin-near/deviceTransactionConfig";
import polkadot from "@ledgerhq/coin-polkadot/deviceTransactionConfig";
import solana from "@ledgerhq/coin-solana/deviceTransactionConfig";
import stellar from "@ledgerhq/coin-stellar/deviceTransactionConfig";
import tezos from "@ledgerhq/coin-tezos/deviceTransactionConfig";
import ton from "@ledgerhq/coin-ton/deviceTransactionConfig";
import tron from "@ledgerhq/coin-tron/deviceTransactionConfig";
import xrp from "@ledgerhq/coin-xrp/deviceTransactionConfig";

export default {
  casper,
  celo,
  crypto_org,
  filecoin,
  internet_computer,
  stacks,
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
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_casper } from "../families/casper/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_filecoin } from "../families/filecoin/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stacks } from "../families/stacks/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_polkadot } from "@ledgerhq/coin-polkadot/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "@ledgerhq/coin-tron/bridge/deviceTransactionConfig";

export type ExtraDeviceTransactionField =
  | ExtraDeviceTransactionField_casper
  | ExtraDeviceTransactionField_filecoin
  | ExtraDeviceTransactionField_stacks
  | ExtraDeviceTransactionField_polkadot
  | ExtraDeviceTransactionField_tron;
