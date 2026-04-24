import type { CoinModuleLoader, FamilySetup } from "./types";

import * as aleoSetup from "../families/aleo/setup";
import aleoTransaction from "@ledgerhq/coin-aleo/transaction";

import * as algorandSetup from "../families/algorand/setup";
import algorandTransaction from "@ledgerhq/coin-algorand/transaction";
import algorandMockAccount from "@ledgerhq/coin-algorand/mock";

import * as aptosSetup from "../families/aptos/setup";
import aptosTransaction from "@ledgerhq/coin-aptos/transaction";

import * as bitcoinSetup from "../families/bitcoin/setup";
import bitcoinTransaction from "@ledgerhq/coin-bitcoin/transaction";
import * as bitcoinWalletApiAdapter from "../families/bitcoin/walletApiAdapter";
import * as bitcoinPlatformAdapter from "../families/bitcoin/platformAdapter";
import { clearAccount as bitcoinClearAccount } from "../families/bitcoin/clearAccount";
import {
  isEditableOperation as bitcoinIsEditableOperation,
  isStuckOperation as bitcoinIsStuckOperation,
  getStuckAccountAndOperation as bitcoinGetStuckAccountAndOperation,
} from "../families/bitcoin/operations";

import * as cantonSetup from "../families/canton/setup";
import cantonTransaction from "@ledgerhq/coin-canton/transaction";
import { isAccountEmpty as cantonIsAccountEmpty } from "@ledgerhq/coin-canton";

import * as cardanoSetup from "../families/cardano/setup";
import cardanoTransaction from "@ledgerhq/coin-cardano/transaction";

import casperTransaction from "@ledgerhq/coin-casper/transaction";

import celoTransaction from "@ledgerhq/coin-celo/transaction";

import * as concordiumSetup from "../families/concordium/setup";
import concordiumTransaction from "@ledgerhq/coin-concordium/transaction";

import * as cosmosSetup from "../families/cosmos/setup";
import cosmosTransaction from "@ledgerhq/coin-cosmos/transaction";
import * as cosmosWalletApiAdapter from "../families/cosmos/walletApiAdapter";
import cosmosMockAccount from "@ledgerhq/coin-cosmos/mock";
import { isAccountEmpty as cosmosIsAccountEmpty } from "@ledgerhq/coin-cosmos/helpers";
import { getVotesCount as cosmosGetVotesCount } from "../families/cosmos/getVotesCount";

import * as evmSetup from "../families/evm/setup";
import evmTransaction from "@ledgerhq/coin-evm/transaction";
import * as evmWalletApiAdapter from "../families/evm/walletApiAdapter";
import * as evmPlatformAdapter from "../families/evm/platformAdapter";
import { validateAddress as evmValidateAddress } from "@ledgerhq/coin-evm/logic/validateAddress";
import evmAlpacaSigner from "../bridge/generic-alpaca/families/evm/signer";
import {
  isEditableOperation as evmIsEditableOperation,
  isStuckOperation as evmIsStuckOperation,
  getStuckAccountAndOperation as evmGetStuckAccountAndOperation,
} from "../families/evm/operations";

import * as filecoinSetup from "../families/filecoin/setup";
import filecoinTransaction from "@ledgerhq/coin-filecoin/transaction";

import * as hederaSetup from "../families/hedera/setup";
import hederaTransaction from "@ledgerhq/coin-hedera/transaction";

import * as iconSetup from "../families/icon/setup";
import iconTransaction from "@ledgerhq/coin-icon/transaction";

import * as icSetup from "../families/internet_computer/setup";
import icTransaction from "@ledgerhq/coin-internet_computer/transaction";

import * as minaSetup from "../families/mina/setup";
import minaTransaction from "@ledgerhq/coin-mina/transaction";

import * as multiversxSetup from "../families/multiversx/setup";
import multiversxTransaction from "@ledgerhq/coin-multiversx/transaction";

import * as nearSetup from "../families/near/setup";
import nearTransaction from "@ledgerhq/coin-near/transaction";

import * as polkadotSetup from "../families/polkadot/setup";
import polkadotTransaction from "@ledgerhq/coin-polkadot/transaction";
import * as polkadotWalletApiAdapter from "../families/polkadot/walletApiAdapter";
import * as polkadotPlatformAdapter from "../families/polkadot/platformAdapter";

import solanaAlpacaSigner from "../bridge/generic-alpaca/families/solana/signer";
import * as solanaSetup from "../families/solana/setup";
import solanaTransaction from "@ledgerhq/coin-solana/transaction";
import * as solanaWalletApiAdapter from "../families/solana/walletApiAdapter";
import { validateAddress as solanaValidateAddress } from "@ledgerhq/coin-solana/logic/validateAddress";

import * as stacksSetup from "../families/stacks/setup";
import stacksTransaction from "@ledgerhq/coin-stacks/transaction";

import stellarAlpacaSigner from "../bridge/generic-alpaca/families/stellar/signer";
import * as stellarSetup from "../families/stellar/setup";
import stellarTransaction from "../families/stellar/transaction";
import * as stellarDeviceTxConfig from "../families/stellar/deviceTransactionConfig";
import { validateAddress as stellarValidateAddress } from "@ledgerhq/coin-stellar/logic/validateAddress";

// sui/setup is require()'d lazily because @mysten/ledgerjs-hw-app-sui is ESM-only
import suiTransaction from "@ledgerhq/coin-sui/transaction";

import tezosAlpacaSigner from "../bridge/generic-alpaca/families/tezos/signer";
import * as tezosSetup from "../families/tezos/setup";
import tezosTransaction from "@ledgerhq/coin-tezos/transaction";
import { getVotesCount as tezosGetVotesCount } from "../families/tezos/getVotesCount";
import { validateAddress as tezosValidateAddress } from "@ledgerhq/coin-tezos/logic/validateAddress";

import * as tonSetup from "../families/ton/setup";
import tonTransaction from "@ledgerhq/coin-ton/transaction";

import * as tronSetup from "../families/tron/setup";
import tronTransaction from "@ledgerhq/coin-tron/transaction";
import { isAccountEmpty as tronIsAccountEmpty } from "@ledgerhq/coin-tron/index";
import { getVotesCount as tronGetVotesCount } from "../families/tron/getVotesCount";

import * as vechainSetup from "../families/vechain/setup";
import vechainTransaction from "@ledgerhq/coin-vechain/transaction";
import vechainMockAccount from "@ledgerhq/coin-vechain/mock";
import { isAccountEmpty as vechainIsAccountEmpty } from "@ledgerhq/coin-vechain";

import xrpAlpacaSigner from "../bridge/generic-alpaca/families/xrp/signer";
import * as xrpSetup from "../families/xrp/setup";
import xrpTransaction from "../families/xrp/transaction";
import * as xrpDeviceTxConfig from "../families/xrp/deviceTransactionConfig";
import * as xrpWalletApiAdapter from "../families/xrp/walletApiAdapter";
import * as xrpPlatformAdapter from "../families/xrp/platformAdapter";
import { validateAddress as xrpValidateAddress } from "@ledgerhq/coin-xrp/logic/validateAddress";

export const coinModuleLoaders: CoinModuleLoader[] = [
  {
    family: "aleo",
    loadSetup: (): FamilySetup => aleoSetup,
    loadTransaction: () => aleoTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-aleo/deviceTransactionConfig"),
  },
  {
    family: "algorand",
    loadSetup: (): FamilySetup => algorandSetup,
    loadTransaction: () => algorandTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-algorand/deviceTransactionConfig"),
    loadMockBridge: () => require("../families/algorand/bridge/mock").default,
    loadMockAccount: () => algorandMockAccount,
  },
  {
    family: "aptos",
    loadSetup: (): FamilySetup => aptosSetup,
    loadTransaction: () => aptosTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-aptos/deviceTransactionConfig"),
  },
  {
    family: "bitcoin",
    loadSetup: (): FamilySetup => bitcoinSetup,
    loadTransaction: () => bitcoinTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-bitcoin/deviceTransactionConfig"),
    loadWalletApiAdapter: () => Promise.resolve(bitcoinWalletApiAdapter),
    loadPlatformAdapter: () => Promise.resolve(bitcoinPlatformAdapter),
    loadAccount: () => import("@ledgerhq/coin-bitcoin/account"),
    loadMockBridge: () => require("../families/bitcoin/bridge/mock").default,
    loadClearAccount: () => bitcoinClearAccount,
    loadIsEditableOperation: () => bitcoinIsEditableOperation,
    loadIsStuckOperation: () => bitcoinIsStuckOperation,
    loadGetStuckAccountAndOperation: () => bitcoinGetStuckAccountAndOperation,
  },
  {
    family: "canton",
    loadSetup: (): FamilySetup => cantonSetup,
    loadTransaction: () => cantonTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-canton/deviceTransactionConfig"),
    loadMockBridge: () => require("../families/canton/bridge/mock").default,
    loadIsAccountEmpty: () => cantonIsAccountEmpty,
  },
  {
    family: "cardano",
    loadSetup: (): FamilySetup => cardanoSetup,
    loadTransaction: () => cardanoTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-cardano/deviceTransactionConfig"),
    loadAccount: () => import("@ledgerhq/coin-cardano/account"),
    loadMockBridge: () => require("../families/cardano/bridge/mock").default,
  },
  {
    family: "casper",
    loadSetup: () => require("../families/casper/setup"),
    loadTransaction: () => casperTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-casper/deviceTransactionConfig"),
    loadMockBridge: () => require("../families/casper/bridge/mock").default,
  },
  {
    family: "celo",
    loadSetup: (): FamilySetup => require("../families/celo/setup"),
    loadTransaction: () => celoTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-celo/deviceTransactionConfig"),
  },
  {
    family: "concordium",
    loadSetup: (): FamilySetup => concordiumSetup,
    loadTransaction: () => concordiumTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-concordium/deviceTransactionConfig"),
  },
  {
    family: "cosmos",
    loadSetup: (): FamilySetup => cosmosSetup,
    loadTransaction: () => cosmosTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-cosmos/deviceTransactionConfig"),
    loadWalletApiAdapter: () => Promise.resolve(cosmosWalletApiAdapter),
    loadMockBridge: () => require("../families/cosmos/bridge/mock").default,
    loadMockAccount: () => cosmosMockAccount,
    loadIsAccountEmpty: () => cosmosIsAccountEmpty,
    loadGetVotesCount: () => cosmosGetVotesCount,
  },
  {
    family: "evm",
    loadSetup: (): FamilySetup => evmSetup,
    loadTransaction: () => evmTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-evm/deviceTransactionConfig"),
    loadWalletApiAdapter: () => Promise.resolve(evmWalletApiAdapter),
    loadPlatformAdapter: () => Promise.resolve(evmPlatformAdapter),
    loadMockBridge: () => require("../families/evm/bridge/mock").default,
    loadValidateAddress: () => evmValidateAddress,
    loadSigner: () => evmAlpacaSigner,
    loadIsEditableOperation: () => evmIsEditableOperation,
    loadIsStuckOperation: () => evmIsStuckOperation,
    loadGetStuckAccountAndOperation: () => evmGetStuckAccountAndOperation,
  },
  {
    family: "filecoin",
    loadSetup: (): FamilySetup => filecoinSetup,
    loadTransaction: () => filecoinTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-filecoin/deviceTransactionConfig"),
  },
  {
    family: "hedera",
    loadSetup: (): FamilySetup => hederaSetup,
    loadTransaction: () => hederaTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-hedera/deviceTransactionConfig"),
  },
  {
    family: "icon",
    loadSetup: (): FamilySetup => iconSetup,
    loadTransaction: () => iconTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-icon/deviceTransactionConfig"),
    loadAccount: () => import("@ledgerhq/coin-icon/account"),
    loadMockBridge: () => require("../families/icon/bridge/mock").default,
  },
  {
    family: "internet_computer",
    loadSetup: (): FamilySetup => icSetup,
    loadTransaction: () => icTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-internet_computer/deviceTransactionConfig"),
  },
  {
    family: "kaspa",
    loadSetup: (): FamilySetup => require("../families/kaspa/setup"),
    loadTransaction: () => require("@ledgerhq/coin-kaspa/transaction").default,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-kaspa/deviceTransactionConfig"),
  },
  {
    family: "mina",
    loadSetup: (): FamilySetup => minaSetup,
    loadTransaction: () => minaTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-mina/deviceTransactionConfig"),
  },
  {
    family: "multiversx",
    loadSetup: (): FamilySetup => multiversxSetup,
    loadTransaction: () => multiversxTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-multiversx/deviceTransactionConfig"),
    loadMockBridge: () => require("../families/multiversx/bridge/mock").default,
  },
  {
    family: "near",
    loadSetup: (): FamilySetup => nearSetup,
    loadTransaction: () => nearTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-near/deviceTransactionConfig"),
    loadAccount: () => import("@ledgerhq/coin-near/account"),
  },
  {
    family: "polkadot",
    loadSetup: (): FamilySetup => polkadotSetup,
    loadTransaction: () => polkadotTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-polkadot/deviceTransactionConfig"),
    loadWalletApiAdapter: () => Promise.resolve(polkadotWalletApiAdapter),
    loadPlatformAdapter: () => Promise.resolve(polkadotPlatformAdapter),
    loadMockBridge: () => require("../families/polkadot/bridge/mock").default,
  },
  {
    family: "solana",
    loadSetup: (): FamilySetup => solanaSetup,
    loadTransaction: () => solanaTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-solana/deviceTransactionConfig"),
    loadWalletApiAdapter: () => Promise.resolve(solanaWalletApiAdapter),
    loadMockBridge: () => require("../families/solana/bridge/mock").default,
    loadValidateAddress: () => solanaValidateAddress,
    loadSigner: () => solanaAlpacaSigner,
  },
  {
    family: "stacks",
    loadSetup: (): FamilySetup => stacksSetup,
    loadTransaction: () => stacksTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-stacks/deviceTransactionConfig"),
  },
  {
    family: "stellar",
    loadSetup: (): FamilySetup => stellarSetup,
    loadTransaction: () => stellarTransaction,
    loadDeviceTxConfig: () => Promise.resolve(stellarDeviceTxConfig),
    loadMockBridge: () => require("../families/stellar/bridge/mock").default,
    loadValidateAddress: () => stellarValidateAddress,
    loadSigner: () => stellarAlpacaSigner,
  },
  {
    family: "sui",
    loadSetup: (): FamilySetup => require("../families/sui/setup"),
    loadTransaction: () => suiTransaction,
  },
  {
    family: "tezos",
    loadSetup: (): FamilySetup => tezosSetup,
    loadTransaction: () => tezosTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-tezos/deviceTransactionConfig"),
    loadMockBridge: () => require("../families/tezos/bridge/mock").default,
    loadGetVotesCount: () => tezosGetVotesCount,
    loadValidateAddress: () => tezosValidateAddress,
    loadSigner: () => tezosAlpacaSigner,
  },
  {
    family: "ton",
    loadSetup: (): FamilySetup => tonSetup,
    loadTransaction: () => tonTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-ton/deviceTransactionConfig"),
  },
  {
    family: "tron",
    loadSetup: (): FamilySetup => tronSetup,
    loadTransaction: () => tronTransaction,
    loadDeviceTxConfig: () => import("@ledgerhq/coin-tron/deviceTransactionConfig"),
    loadMockBridge: () => require("../families/tron/bridge/mock").default,
    loadIsAccountEmpty: () => tronIsAccountEmpty,
    loadGetVotesCount: () => tronGetVotesCount,
  },
  {
    family: "vechain",
    loadSetup: (): FamilySetup => vechainSetup,
    loadTransaction: () => vechainTransaction,
    loadAccount: () => import("@ledgerhq/coin-vechain/account"),
    loadMockAccount: () => vechainMockAccount,
    loadIsAccountEmpty: () => vechainIsAccountEmpty,
  },
  {
    family: "xrp",
    loadSetup: (): FamilySetup => xrpSetup,
    loadTransaction: () => xrpTransaction,
    loadDeviceTxConfig: () => Promise.resolve(xrpDeviceTxConfig),
    loadWalletApiAdapter: () => Promise.resolve(xrpWalletApiAdapter),
    loadPlatformAdapter: () => Promise.resolve(xrpPlatformAdapter),
    loadMockBridge: () => require("../families/xrp/bridge/mock").default,
    loadValidateAddress: () => xrpValidateAddress,
    loadSigner: () => xrpAlpacaSigner,
  },
];
