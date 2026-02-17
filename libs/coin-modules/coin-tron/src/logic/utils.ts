import { createHash } from "crypto";
import BigNumber from "bignumber.js";
import get from "lodash/get";
import TronWeb from "tronweb";
import coinConfig from "../config";
import { TronResources, UnFrozenInfo } from "../types";

export function createTronWeb(trongridUrl?: string): TronWeb {
  if (!trongridUrl) {
    trongridUrl = coinConfig.getCoinConfig().explorer.url;
  }

  const HttpProvider = TronWeb.providers.HttpProvider;
  const fullNode = new HttpProvider(trongridUrl);
  const solidityNode = new HttpProvider(trongridUrl);
  const eventServer = new HttpProvider(trongridUrl);
  return new TronWeb(fullNode, solidityNode, eventServer);
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
    txID: createHash("sha256")
      .update(new Uint8Array(Buffer.from(rawTx, "hex")))
      .digest("hex"),
    raw_data: convertTxFromRaw(transaction),
    raw_data_hex: rawTx,
  };
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
  const contractType = convertNumberToContractType(contract.getType());
  const value = contractType.convertFunction?.(contract);
  if (!value) {
    throw new Error(
      `Missing deserializer for this contract: "${contract.getParameter().getTypeUrl()}"`,
    );
  }

  return {
    type: contractType.name,
    parameter: {
      value,
      type_url: contract.getParameter().getTypeUrl(),
    },
  };
}

type TransferValue = { owner_address: string };
type TrxTransferValue = TransferValue & {
  amount: number;
  to_address: string;
};
function convertTransferContractFromRaw(contract: any): TrxTransferValue {
  const { TransferContract } = (globalThis as unknown as any).TronWebProto;
  const transferContract = TransferContract.deserializeBinary(contract.getParameter().getValue());

  // Expected address format in Contract are in Hex and not in Base58,
  // despite what (tron API portal may say)[https://developers.tron.network/reference/createtransaction]
  return {
    amount: transferContract.getAmount(),
    owner_address: convertBufferToHex(transferContract.getOwnerAddress()),
    to_address: convertBufferToHex(transferContract.getToAddress()),
  };
}

type Trc10TransferValue = TransferValue & {
  amount: number;
  asset_name: string;
  to_address: string;
};
function convertTransferAssetContractFromRaw(contract: any): Trc10TransferValue {
  const { TransferAssetContract } = (globalThis as unknown as any).TronWebProto;
  const transferContract = TransferAssetContract.deserializeBinary(
    contract.getParameter().getValue(),
  );

  // Expected address format in Contract are in Hex and not in Base58,
  // despite what (tron API portal may say)[https://developers.tron.network/reference/transferasset]
  return {
    amount: transferContract.getAmount(),
    asset_name: convertBufferToString(transferContract.getAssetName()),
    owner_address: convertBufferToHex(transferContract.getOwnerAddress()),
    to_address: convertBufferToHex(transferContract.getToAddress()),
  };
}

type Trc20TransferValue = TransferValue & {
  data: string;
  contract_address: string;
};
function convertTriggerSmartContractFromRaw(contract: any): Trc20TransferValue {
  const { TriggerSmartContract } = (globalThis as unknown as any).TronWebProto;
  const transferContract = TriggerSmartContract.deserializeBinary(
    contract.getParameter().getValue(),
  );

  // Expected address format in Contract are in Hex and not in Base58,
  // despite what (tron API portal may say)[https://developers.tron.network/reference/triggersmartcontract]
  return {
    data: convertBufferToHex(transferContract.getData()),
    owner_address: convertBufferToHex(transferContract.getOwnerAddress()),
    contract_address: convertBufferToHex(transferContract.getContractAddress()),
  };
}

type ContractInfo = {
  name: string;
  convertFunction?: (contract: any) => TrxTransferValue | Trc10TransferValue | Trc20TransferValue;
};
/**
 * @see https://github.com/tronprotocol/protocol/blob/master/core/Tron.proto#L338
 */
const CONTRACT_TYPE: Record<number, ContractInfo> = {
  0: { name: "AccountCreateContract" },
  1: { name: "TransferContract", convertFunction: convertTransferContractFromRaw }, // Transfer TRX
  2: { name: "TransferAssetContract", convertFunction: convertTransferAssetContractFromRaw }, // Transfer TRC-10
  3: { name: "VoteAssetContract" },
  4: { name: "VoteWitnessContract" },
  5: { name: "WitnessCreateContract" },
  6: { name: "AssetIssueContract" },
  8: { name: "WitnessUpdateContract" },
  9: { name: "ParticipateAssetIssueContract" },
  10: { name: "AccountUpdateContract" },
  11: { name: "FreezeBalanceContract" },
  12: { name: "UnfreezeBalanceContract" },
  13: { name: "WithdrawBalanceContract" },
  14: { name: "UnfreezeAssetContract" },
  15: { name: "UpdateAssetContract" },
  16: { name: "ProposalCreateContract" },
  17: { name: "ProposalApproveContract" },
  18: { name: "ProposalDeleteContract" },
  19: { name: "SetAccountIdContract" },
  20: { name: "CustomContract" },
  30: { name: "CreateSmartContract" },
  31: { name: "TriggerSmartContract", convertFunction: convertTriggerSmartContractFromRaw }, // Transfer TRC-20
  32: { name: "GetContract" },
  33: { name: "UpdateSettingContract" },
  41: { name: "ExchangeCreateContract" },
  42: { name: "ExchangeInjectContract" },
  43: { name: "ExchangeWithdrawContract" },
  44: { name: "ExchangeTransactionContract" },
  45: { name: "UpdateEnergyLimitContract" },
  46: { name: "AccountPermissionUpdateContract" },
  48: { name: "ClearABIContract" },
  49: { name: "UpdateBrokerageContract" },
  51: { name: "ShieldedTransferContract" },
  52: { name: "MarketSellAssetContract" },
  53: { name: "MarketCancelOrderContract" },
  54: { name: "FreezeBalanceV2Contract" },
  55: { name: "UnfreezeBalanceV2Contract" },
  56: { name: "WithdrawExpireUnfreezeContract" },
  57: { name: "DelegateResourceContract" },
  58: { name: "UnDelegateResourceContract" },
  59: { name: "CancelAllUnfreezeV2Contract" },
};
const convertNumberToContractType = (value: number): ContractInfo => CONTRACT_TYPE[value];

function convertBufferToHex(address: Buffer): string {
  return (TronWeb.utils.bytes.byteArray2hexStr(address) as string).toLowerCase();
}

function convertBufferToString(address: Buffer): string {
  return TronWeb.utils.bytes.bytesToString(address);
}

export type AccountInfo = {
  account_resource?: {
    delegated_frozenV2_balance_for_energy?: number;
    frozen_balance_for_energy?: {
      frozen_balance: number;
      expire_time: number;
    };
  };
  delegated_frozenV2_balance_for_bandwidth?: number;
  frozen?: {
    frozen_balance: number;
    expire_time: number;
  }[];
  frozenV2?: {
    type?: "ENERGY" | "TRON_POWER" | string;
    amount?: number;
  }[];
  latest_withdraw_time?: number;
  unfrozenV2?: {
    type?: "ENERGY" | string;
    unfreeze_amount: number;
    unfreeze_expire_time: number;
  }[];
  votes?: {
    vote_address: string;
    vote_count: number;
  }[];
};
export function getTronResources(
  acc: AccountInfo,
): Omit<
  TronResources,
  "energy" | "bandwidth" | "unwithdrawnReward" | "lastVotedDate" | "cacheTransactionInfoById"
> {
  const delegatedFrozenBandwidth = get(acc, "delegated_frozenV2_balance_for_bandwidth", undefined);
  const delegatedFrozenEnergy = get(
    acc,
    "account_resource.delegated_frozenV2_balance_for_energy",
    undefined,
  );

  const frozenBalances: { type?: string; amount?: number }[] = get(acc, "frozenV2", []);

  const legacyFrozenBandwidth = get(acc, "frozen[0]", undefined);
  const legacyFrozenEnergy = get(acc, "account_resource.frozen_balance_for_energy", undefined);

  const legacyFrozen = {
    bandwidth: legacyFrozenBandwidth
      ? {
          amount: new BigNumber(legacyFrozenBandwidth.frozen_balance),
          expiredAt: new Date(legacyFrozenBandwidth.expire_time),
        }
      : undefined,
    energy: legacyFrozenEnergy
      ? {
          amount: new BigNumber(legacyFrozenEnergy.frozen_balance),
          expiredAt: new Date(legacyFrozenEnergy.expire_time),
        }
      : undefined,
  };

  const { frozenEnergy, frozenBandwidth } = frozenBalances.reduce(
    (accum, cur) => {
      const amount = new BigNumber(cur?.amount ?? 0);
      if (cur.type === "ENERGY") {
        accum.frozenEnergy = accum.frozenEnergy.plus(amount);
      } else if (cur.type === undefined) {
        accum.frozenBandwidth = accum.frozenBandwidth.plus(amount);
      }
      return accum;
    },
    {
      frozenEnergy: new BigNumber(0),
      frozenBandwidth: new BigNumber(0),
    },
  );

  const unFrozenBalances: {
    type?: string;
    unfreeze_amount: number;
    unfreeze_expire_time: number;
  }[] = get(acc, "unfrozenV2", []);

  const unFrozen: { bandwidth: UnFrozenInfo[]; energy: UnFrozenInfo[] } = unFrozenBalances
    ? unFrozenBalances.reduce(
        (accum, cur) => {
          if (cur && cur.type === "ENERGY") {
            accum.energy.push({
              amount: new BigNumber(cur.unfreeze_amount),
              expireTime: new Date(cur.unfreeze_expire_time),
            });
          } else if (cur) {
            accum.bandwidth.push({
              amount: new BigNumber(cur.unfreeze_amount),
              expireTime: new Date(cur.unfreeze_expire_time),
            });
          }
          return accum;
        },
        { bandwidth: [] as UnFrozenInfo[], energy: [] as UnFrozenInfo[] },
      )
    : { bandwidth: [], energy: [] };

  const frozen = {
    bandwidth: frozenBandwidth.isGreaterThan(0)
      ? {
          amount: frozenBandwidth,
        }
      : undefined,
    energy: frozenEnergy.isGreaterThan(0)
      ? {
          amount: frozenEnergy,
        }
      : undefined,
  };
  const delegatedFrozen = {
    bandwidth: delegatedFrozenBandwidth
      ? {
          amount: new BigNumber(delegatedFrozenBandwidth),
        }
      : undefined,
    energy: delegatedFrozenEnergy
      ? {
          amount: new BigNumber(delegatedFrozenEnergy),
        }
      : undefined,
  };
  const tronPower = new BigNumber(get(frozen, "bandwidth.amount", 0))
    .plus(get(frozen, "energy.amount", 0))
    .plus(get(delegatedFrozen, "bandwidth.amount", 0))
    .plus(get(delegatedFrozen, "energy.amount", 0))
    .plus(get(legacyFrozen, "energy.amount", 0))
    .plus(get(legacyFrozen, "bandwidth.amount", 0))
    .dividedBy(1_000_000)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();

  const votes = get(acc, "votes", []).map((v: any) => ({
    address: v.vote_address,
    voteCount: v.vote_count,
  }));

  const lastWithdrawnRewardDate = acc.latest_withdraw_time
    ? new Date(acc.latest_withdraw_time)
    : undefined;

  return {
    frozen,
    unFrozen,
    delegatedFrozen,
    legacyFrozen,
    votes,
    tronPower,
    lastWithdrawnRewardDate,
  };
}

export function feesToNumber(customFees?: bigint): number | undefined {
  if (
    customFees !== undefined &&
    customFees >= Number.MIN_SAFE_INTEGER &&
    customFees <= Number.MAX_SAFE_INTEGER
  ) {
    return Number(customFees);
  }

  return undefined;
}
