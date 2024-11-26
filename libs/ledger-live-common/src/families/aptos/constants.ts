export const LOAD_LIMIT = 10;

export enum TX_TYPE {
  REGISTER = "register",
  TRANSFER = "transfer",
  RECEIVE = "receive",
  ALLOW_RECEIVE_NFT = "opt_in_direct_transfer",
  FAUCET = "faucet",
  SWAP = "swap",
  ADD_LIQUIDITY = "add_liquidity",
  REGISTER_POOL_AND_ADD_LIQUIDITY = "register_pool_and_add_liquidity",
  REMOVE_LIQUIDITY = "remove_liquidity",
  TRANSFER_NFT = "transfer_with_opt_in",
  RECEIVE_NFT = "receive_nft",
  OFFER_NFT = "offer_script",
  CANCEL_OFFER_NFT = "cancel_offer_script",
  BUY_NFT = "buy",
  LIST_NFT = "list",
  SELL_NFT = "fill",
  EDIT_NFT = "edit",
  DELIST_NFT = "delist",
  DELETE_NFT = "delete_nft",
  CLAIM_NFT = "claim_script",

  STAKE_APTOS = "stake_aptos",
  INSTANT_UNSTAKE_APTOS = "instant_unstake",
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  CLAIM_THL = "claim_thl_rewards",

  APPROVE = "approve",
  CONTRACT_ADDRESS_CREATED = "contract_address_created",

  UNKNOWN = "unknown",
}

export enum TX_STATUS {
  PENDING = "pending",
  FAIL = "fail",
  SUCCESS = "success",
}

export const TRANSFER_TYPES = ["transfer", "transfer_coins"];

export const APTOS_TRANSFER_FUNCTION_ADDRESS = "0x1::aptos_account::transfer";
export const APTOS_OBJECT_TRANSFER = "0x1::object::transfer";

export enum DIRECTION {
  IN = "IN",
  OUT = "OUT",
  UNKNOWN = "UNKNOWN",
}
