import casper from "../families/casper/deviceTransactionConfig";
import celo from "../families/celo/deviceTransactionConfig";
import cosmos from "../families/cosmos/deviceTransactionConfig";
import crypto_org from "../families/crypto_org/deviceTransactionConfig";
import elrond from "../families/elrond/deviceTransactionConfig";
import filecoin from "../families/filecoin/deviceTransactionConfig";
import hedera from "../families/hedera/deviceTransactionConfig";
import internet_computer from "../families/internet_computer/deviceTransactionConfig";
import stacks from "../families/stacks/deviceTransactionConfig";
import algorand from "@ledgerhq/coin-algorand/deviceTransactionConfig";
import bitcoin from "@ledgerhq/coin-bitcoin/deviceTransactionConfig";
import cardano from "@ledgerhq/coin-cardano/deviceTransactionConfig";
import evm from "@ledgerhq/coin-evm/deviceTransactionConfig";
import near from "@ledgerhq/coin-near/deviceTransactionConfig";
import polkadot from "@ledgerhq/coin-polkadot/deviceTransactionConfig";
import solana from "@ledgerhq/coin-solana/deviceTransactionConfig";
import stellar from "@ledgerhq/coin-stellar/deviceTransactionConfig";
import tezos from "@ledgerhq/coin-tezos/deviceTransactionConfig";
import tron from "@ledgerhq/coin-tron/deviceTransactionConfig";
import xrp from "@ledgerhq/coin-xrp/deviceTransactionConfig";
import kadena from "@ledgerhq/coin-kadena/deviceTransactionConfig";

export default {
  casper,
  celo,
  cosmos,
  crypto_org,
  elrond,
  filecoin,
  hedera,
  internet_computer,
  stacks,
  algorand,
  bitcoin,
  cardano,
  evm,
  near,
  polkadot,
  solana,
  stellar,
  tezos,
  tron,
  xrp,
  kadena,
};
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_casper } from "../families/casper/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_cosmos } from "../families/cosmos/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_filecoin } from "../families/filecoin/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stacks } from "../families/stacks/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_polkadot } from "@ledgerhq/coin-polkadot/bridge/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "@ledgerhq/coin-tron/bridge/deviceTransactionConfig";

export type ExtraDeviceTransactionField =
  | ExtraDeviceTransactionField_casper
  | ExtraDeviceTransactionField_cosmos
  | ExtraDeviceTransactionField_filecoin
  | ExtraDeviceTransactionField_stacks
  | ExtraDeviceTransactionField_polkadot
  | ExtraDeviceTransactionField_tron;
