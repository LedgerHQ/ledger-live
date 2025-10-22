import type { MoveStructId } from "@aptos-labs/ts-sdk";
import BigNumber from "bignumber.js";

export const ESTIMATE_GAS_MUL = new BigNumber(1.1); // define buffer for gas estimation change here, if needed
export const ESTIMATE_GAS_MUL_FOR_STAKING = new BigNumber(3); // gas multiplier for staking operations

export const LOAD_LIMIT = 10;

export enum TX_STATUS {
  PENDING = "pending",
  FAIL = "fail",
  SUCCESS = "success",
}

export const WRITE_RESOURCE = "write_resource";

export const APTOS_NON_HARDENED_DERIVATION_PATH_REGEX = /^44'\/637'\/[0-9]+'\/[0-9]+\/[0-9]+$/;
export const APTOS_NON_HARDENED_DERIVATION_PATH = "44'/637'/0'/0/0";
export const APTOS_HARDENED_DERIVATION_PATH = "44'/637'/0'/0'/0'";

export const COIN_TRANSFER_TYPES: MoveStructId[] = [
  "0x1::aptos_account::transfer",
  "0x1::aptos_account::transfer_coins",
  "0x1::coin::transfer",
];

export const FA_TRANSFER_TYPES: MoveStructId[] = ["0x1::primary_fungible_store::transfer"];

export const BATCH_TRANSFER_TYPES: MoveStructId[] = [
  "0x1::aptos_account::batch_transfer",
  "0x1::aptos_account::batch_transfer_coins",
];

export const DELEGATION_POOL_TYPES: MoveStructId[] = [
  "0x1::delegation_pool::add_stake",
  "0x1::delegation_pool::reactivate_stake",
  "0x1::delegation_pool::unlock",
  "0x1::delegation_pool::withdraw",
];

export const ADD_STAKE_EVENTS = [
  "0x1::stake::AddStake",
  "0x1::stake::AddStakeEvent",
  "0x1::delegation_pool::AddStake",
  "0x1::delegation_pool::AddStakeEvent",
];

export const REACTIVATE_STAKE_EVENTS = [
  "0x1::stake::ReactivateStake",
  "0x1::stake::ReactivateStakeEvent",
  "0x1::delegation_pool::ReactivateStake",
  "0x1::delegation_pool::ReactivateStakeEvent",
];

export const UNLOCK_STAKE_EVENTS = [
  "0x1::stake::UnlockStake",
  "0x1::stake::UnlockStakeEvent",
  "0x1::delegation_pool::UnlockStake",
  "0x1::delegation_pool::UnlockStakeEvent",
];

export const WITHDRAW_STAKE_EVENTS = [
  "0x1::stake::WithdrawStake",
  "0x1::stake::WithdrawStakeEvent",
  "0x1::delegation_pool::WithdrawStake",
  "0x1::delegation_pool::WithdrawStakeEvent",
];

export const STAKING_EVENTS = ADD_STAKE_EVENTS.concat(
  REACTIVATE_STAKE_EVENTS,
  UNLOCK_STAKE_EVENTS,
  WITHDRAW_STAKE_EVENTS,
);

export const APTOS_ASSET_ID: MoveStructId = "0x1::aptos_coin::AptosCoin";

export const APTOS_COIN_CHANGE: MoveStructId = `0x1::coin::CoinStore<${APTOS_ASSET_ID}>`;

export const APTOS_FUNGIBLE_STORE: MoveStructId = "0x1::fungible_asset::FungibleStore";
export const APTOS_ASSET_FUNGIBLE_ID: string = "0xa";

export const APTOS_OBJECT_CORE: MoveStructId = "0x1::object::ObjectCore";

export enum OP_TYPE {
  IN = "IN",
  OUT = "OUT",
  STAKE = "STAKE",
  UNSTAKE = "UNSTAKE",
  WITHDRAW = "WITHDRAW",
  UNKNOWN = "UNKNOWN",
}

export const SUPPORTED_TOKEN_TYPES = ["coin", "fungible_asset"];

export const STAKING_TX_MODES = ["stake", "unstake", "restake", "withdraw"];

export const APTOS_PRECISION = 8;
export const APTOS_MINIMUM_RESTAKE = BigNumber(1);
export const APTOS_MINIMUM_RESTAKE_IN_OCTAS = APTOS_MINIMUM_RESTAKE.shiftedBy(APTOS_PRECISION);
export const APTOS_DELEGATION_RESERVE = BigNumber(0.05);
export const APTOS_DELEGATION_RESERVE_IN_OCTAS =
  APTOS_DELEGATION_RESERVE.shiftedBy(APTOS_PRECISION);
export const MIN_COINS_ON_SHARES_POOL = BigNumber(11);
export const MIN_COINS_ON_SHARES_POOL_IN_OCTAS =
  MIN_COINS_ON_SHARES_POOL.shiftedBy(APTOS_PRECISION);
export const MIN_AMOUNT_TO_UNSTAKE = BigNumber(10);
export const MIN_AMOUNT_TO_UNSTAKE_IN_OCTAS = MIN_AMOUNT_TO_UNSTAKE.shiftedBy(APTOS_PRECISION);

export const APTOS_EXPLORER_ACCOUNT_URL = "https://explorer.aptoslabs.com/account";

export enum TOKEN_TYPE {
  COIN = "coin",
  FUNGIBLE_ASSET = "fungible_asset",
}

export const DEFAULT_GAS = new BigNumber(200);
export const DEFAULT_GAS_PRICE = new BigNumber(100);
