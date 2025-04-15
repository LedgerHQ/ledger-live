import { MoveStructId } from "@aptos-labs/ts-sdk";
import BigNumber from "bignumber.js";

export const LOAD_LIMIT = 10;

export enum TX_STATUS {
  PENDING = "pending",
  FAIL = "fail",
  SUCCESS = "success",
}

export const WRITE_RESOURCE = "write_resource";

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
  "0x1::delegation_pool::withdraw",
];

export const APTOS_ASSET_ID: MoveStructId = "0x1::aptos_coin::AptosCoin";

export const APTOS_COIN_CHANGE: MoveStructId = `0x1::coin::CoinStore<${APTOS_ASSET_ID}>`;

export const APTOS_FUNGIBLE_STORE: MoveStructId = "0x1::fungible_asset::FungibleStore";

export const APTOS_OBJECT_CORE: MoveStructId = "0x1::object::ObjectCore";

export enum DIRECTION {
  IN = "IN",
  OUT = "OUT",
  UNKNOWN = "UNKNOWN",
}

export const SUPPORTED_TOKEN_TYPES = ["coin", "fungible_asset"];

export const APTOS_DELEGATION_RESERVE = 0.01;

export const MIN_COINS_ON_SHARES_POOL = BigNumber(11); // In octas
