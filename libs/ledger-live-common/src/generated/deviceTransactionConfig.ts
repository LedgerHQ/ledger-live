import bitcoin from "../families/bitcoin/deviceTransactionConfig";
import cardano from "../families/cardano/deviceTransactionConfig";
import casper from "../families/casper/deviceTransactionConfig";
import celo from "../families/celo/deviceTransactionConfig";
import cosmos from "../families/cosmos/deviceTransactionConfig";
import crypto_org from "../families/crypto_org/deviceTransactionConfig";
import elrond from "../families/elrond/deviceTransactionConfig";
import filecoin from "../families/filecoin/deviceTransactionConfig";
import hedera from "../families/hedera/deviceTransactionConfig";
import internet_computer from "../families/internet_computer/deviceTransactionConfig";
import near from "../families/near/deviceTransactionConfig";
import ripple from "../families/ripple/deviceTransactionConfig";
import solana from "../families/solana/deviceTransactionConfig";
import stacks from "../families/stacks/deviceTransactionConfig";
import stellar from "../families/stellar/deviceTransactionConfig";
import tezos from "../families/tezos/deviceTransactionConfig";
import tron from "../families/tron/deviceTransactionConfig";
import algorand from "@ledgerhq/coin-algorand/deviceTransactionConfig";
import evm from "@ledgerhq/coin-evm/deviceTransactionConfig";
import polkadot from "@ledgerhq/coin-polkadot/deviceTransactionConfig";

export default {
  bitcoin,
  cardano,
  casper,
  celo,
  cosmos,
  crypto_org,
  elrond,
  filecoin,
  hedera,
  internet_computer,
  near,
  ripple,
  solana,
  stacks,
  stellar,
  tezos,
  tron,
  algorand,
  evm,
  polkadot,
};
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_casper } from "../families/casper/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_cosmos } from "../families/cosmos/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_filecoin } from "../families/filecoin/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stacks } from "../families/stacks/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_stellar } from "../families/stellar/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tezos } from "../families/tezos/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_tron } from "../families/tron/deviceTransactionConfig";
import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_polkadot } from "@ledgerhq/coin-polkadot/bridge/deviceTransactionConfig";

export type ExtraDeviceTransactionField =
  | ExtraDeviceTransactionField_casper
  | ExtraDeviceTransactionField_cosmos
  | ExtraDeviceTransactionField_filecoin
  | ExtraDeviceTransactionField_stacks
  | ExtraDeviceTransactionField_stellar
  | ExtraDeviceTransactionField_tezos
  | ExtraDeviceTransactionField_tron
  | ExtraDeviceTransactionField_polkadot;
