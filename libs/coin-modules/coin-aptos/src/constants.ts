import { MoveStructId } from "@aptos-labs/ts-sdk";
import BigNumber from "bignumber.js";

export const DEFAULT_GAS = new BigNumber(200);
export const DEFAULT_GAS_PRICE = new BigNumber(100);
export const ESTIMATE_GAS_MUL = new BigNumber(1.0); // define buffer for gas estimation change here, if needed

export const LOAD_LIMIT = 10;

export enum TX_STATUS {
  PENDING = "pending",
  FAIL = "fail",
  SUCCESS = "success",
}

export const WRITE_RESOURCE = "write_resource";

export const TRANSFER_TYPES: MoveStructId[] = [
  "0x1::aptos_account::transfer",
  "0x1::aptos_account::transfer_coins",
  "0x1::coin::transfer",
];
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

export enum DIRECTION {
  IN = "IN",
  OUT = "OUT",
  UNKNOWN = "UNKNOWN",
}
