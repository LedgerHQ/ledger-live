import { createHash } from "crypto";
import TronWeb from "tronweb";
import coinConfig from "../config";

const getBaseApiUrl = () => coinConfig.getCoinConfig().explorer.url;

/**
 * Returns a signed transaction for later used with {@link broadcast} function.
 * @param tx 
 * @param signature 
 * @returns 
 */
export function combine(tx: string, signature: string): string {
  return `${tx.length.toString(16).padStart(4, "0")}${tx}${signature}`;
}

/**
 * Convert `raw_data_hex` value from {@link https://developers.tron.network/reference/createtransaction|createTransaction API} to `raw_data` value.
 * The function try to find the correct Protobuf deserialization to use for inner (Contract)[] object.
 * @param rawTx 
 * @returns 
 */
export async function decodeTransaction(rawTx: string): Promise<{
  txID: string;
  raw_data: Record<string, any>;
  raw_data_hex: string;
}> {
  const { Transaction } = (globalThis as unknown as any).TronWebProto;
  const transaction = Transaction.raw.deserializeBinary(Buffer.from(rawTx, "hex"));

  return {
    txID: createHash("sha256").update(Buffer.from(rawTx, "hex")).digest("hex"),
    raw_data: convertTxFromRaw(transaction),
    raw_data_hex: rawTx,
  };
}

export function createTronWeb(): TronWeb {
  const HttpProvider = TronWeb.providers.HttpProvider;
  const fullNode = new HttpProvider(getBaseApiUrl());
  const solidityNode = new HttpProvider(getBaseApiUrl());
  const eventServer = new HttpProvider(getBaseApiUrl());
  return new TronWeb(fullNode, solidityNode, eventServer);
}

/**
 * @see https://github.com/tronprotocol/protocol/blob/master/core/Tron.proto#L431
 * @param tx
 */
function convertTxFromRaw(tx: any) {
  let transactionRawData: any = {
    ref_block_bytes: convertBufferToHex(tx.getRefBlockBytes()),
    ref_block_hash: convertBufferToHex(tx.getRefBlockHash()),
    expiration: tx.getExpiration(),
    contract: tx.getContractList().map(convertContractFromRaw),
    timestamp: tx.getTimestamp(),
  };

  if (tx.getRefBlockNum()) {
    transactionRawData = {
      ...transactionRawData,
      ref_block_num: tx.getRefBlockNum(),
    };
  }

  if (tx.getFeeLimit()) {
    transactionRawData = {
      ...transactionRawData,
      fee_limit: tx.getFeeLimit(),
    };
  }

  if (tx.getData()) {
    transactionRawData = {
      ...transactionRawData,
      data: tx.getData(),
    };
  }

  if (tx.getScripts()) {
    transactionRawData = {
      ...transactionRawData,
      scripts: tx.getScripts(),
    };
  }

  return transactionRawData;
}

/**
 * @see https://github.com/tronprotocol/protocol/blob/master/core/contract/balance_contract.proto#L32
 * @param contract
 */
function convertContractFromRaw(contract: any) {
  return {
    type: convertNumberToContractType(contract.getType()),
    parameter: {
      value: convertTransferContractFromRaw(contract),
      type_url: contract.getParameter().getTypeUrl(),
    },
    // provider: contract.getProvider(),
    // Permission_id: contract.getPermissionId(),
  };
}

function convertTransferContractFromRaw(contract: any) {
  const { TransferContract } = (globalThis as unknown as any).TronWebProto;
  const transferContract = TransferContract.deserializeBinary(contract.getParameter().getValue());

  // Expected address format in Contract are in Hex and not in Base58, despite what (tron API portal may say)[https://developers.tron.network/reference/createtransaction]
  return {
    amount: transferContract.getAmount(),
    owner_address: convertBufferToHex(transferContract.getOwnerAddress()),
    to_address: convertBufferToHex(transferContract.getToAddress()),
  };
}

/**
 * @see https://github.com/tronprotocol/protocol/blob/master/core/Tron.proto#L338
 */
const CONTRACT_TYPE: Record<number, string> = {
  0: "AccountCreateContract",
  1: "TransferContract",
  2: "TransferAssetContract",
  3: "VoteAssetContract",
  4: "VoteWitnessContract",
  5: "WitnessCreateContract",
  6: "AssetIssueContract",
  8: "WitnessUpdateContract",
  9: "ParticipateAssetIssueContract",
  10: "AccountUpdateContract",
  11: "FreezeBalanceContract",
  12: "UnfreezeBalanceContract",
  13: "WithdrawBalanceContract",
  14: "UnfreezeAssetContract",
  15: "UpdateAssetContract",
  16: "ProposalCreateContract",
  17: "ProposalApproveContract",
  18: "ProposalDeleteContract",
  19: "SetAccountIdContract",
  20: "CustomContract",
  30: "CreateSmartContract",
  31: "TriggerSmartContract",
  32: "GetContract",
  33: "UpdateSettingContract",
  41: "ExchangeCreateContract",
  42: "ExchangeInjectContract",
  43: "ExchangeWithdrawContract",
  44: "ExchangeTransactionContract",
  45: "UpdateEnergyLimitContract",
  46: "AccountPermissionUpdateContract",
  48: "ClearABIContract",
  49: "UpdateBrokerageContract",
  51: "ShieldedTransferContract",
  52: "MarketSellAssetContract",
  53: "MarketCancelOrderContract",
  54: "FreezeBalanceV2Contract",
  55: "UnfreezeBalanceV2Contract",
  56: "WithdrawExpireUnfreezeContract",
  57: "DelegateResourceContract",
  58: "UnDelegateResourceContract",
  59: "CancelAllUnfreezeV2Contract",
};
const convertNumberToContractType = (value: number): string => CONTRACT_TYPE[value];

/**
 * Convert for instance: "41FD49EDA0F23FF7EC1D03B52C3A45991C24CD440E" to "TZ4UXDV5ZhNW7fb2AMSbgfAEZ7hWsnYS2g"
 * @param address
 */
function convertHexToBase58(address: string): string {
  return TronWeb.address.fromHex(address);
}

function convertBufferToHex(address: Buffer): string {
  return (TronWeb.utils.bytes.byteArray2hexStr(address) as string).toLowerCase();
}
