import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import {
  fetchTronAccount,
  getChainParameters,
  getTronAccountNetwork,
  triggerConstantContract,
} from "../network";
import { decode58Check } from "../network/format";
import type { AccountTronAPI, ChainParameters } from "../network/types";
import { abiEncodeTrc20Transfer } from "../network/utils";
import type { NetworkInfo, TronMemo } from "../types";
import { ACTIVATION_FEES, STANDARD_FEES_NATIVE, STANDARD_FEES_TRC_20 } from "./constants";

// Byte sizes of the fully signed transaction (raw_data + signature + protobuf wrapping).
// Mirrors bridge/utils.ts:getEstimatedBlockSize. Using craftTransaction's raw_data_hex alone
// would underestimate by ~50% because it doesn't include the signature/outer envelope.
const estimatedTxSize = (intent: TransactionIntent<TronMemo>): number => {
  switch (intent.type) {
    case "send":
      if (intent.asset.type === "trc10") return 285; // TransferAssetContract
      if (intent.asset.type === "trc20") return 350; // TriggerSmartContract
      return 270; // TransferContract
    case "freeze":
    case "unfreeze":
    case "claimReward":
    case "withdrawExpireUnfreeze":
    case "unDelegateResource":
    case "legacyUnfreeze":
      return 260;
    case "vote":
      return 290;
    default:
      throw new Error(`unsupported Tron intent type for fee estimation: ${intent.type}`);
  }
};

const estimateEnergy = async (intent: TransactionIntent<TronMemo>): Promise<number> => {
  if (intent.asset.type !== "trc20" || !intent.asset.assetReference) {
    return 0;
  }
  const response = await triggerConstantContract({
    ownerAddress: decode58Check(intent.sender),
    contractAddress: decode58Check(intent.asset.assetReference),
    functionSelector: "transfer(address,uint256)",
    parameter: abiEncodeTrc20Transfer(
      decode58Check(intent.recipient),
      new BigNumber(intent.amount.toString()),
    ),
  });
  // A reverted simulation reports an unreliable energy_used — surface it.
  if (response.result?.result === false) {
    throw new Error(
      `triggerConstantContract failed: ${response.result.code ?? "unknown"} ${response.result.message ?? ""}`.trim(),
    );
  }
  return response.energy_used ?? 0;
};

const computeBandwidthFee = (
  size: number,
  networkInfo: NetworkInfo,
  params: ChainParameters,
): BigNumber => {
  const freeAvailable = networkInfo.freeNetLimit.minus(networkInfo.freeNetUsed);
  const stakedAvailable = networkInfo.netLimit.minus(networkInfo.netUsed);
  const available = freeAvailable.plus(stakedAvailable);
  const missing = BigNumber.maximum(0, new BigNumber(size).minus(available));
  return missing.multipliedBy(params.transactionFee);
};

const computeEnergyFee = (
  energyNeeded: number,
  networkInfo: NetworkInfo,
  params: ChainParameters,
): BigNumber => {
  const available = networkInfo.energyLimit.minus(networkInfo.energyUsed);
  const missing = BigNumber.maximum(0, new BigNumber(energyNeeded).minus(available));
  return missing.multipliedBy(params.energyFee);
};

const computeActivationFee = (
  intent: TransactionIntent<TronMemo>,
  recipientAccount: AccountTronAPI | undefined,
  params: ChainParameters,
): BigNumber => {
  if (intent.type !== "send") return new BigNumber(0);
  if (recipientAccount) return new BigNumber(0);
  // Only TRX TransferContract triggers the protocol-level activation fee;
  // TRC20/TRC10 transfers to a new recipient are covered by energy/bandwidth.
  if (intent.asset.type !== "native") return new BigNumber(0);
  return new BigNumber(params.createAccountFee).plus(params.createNewAccountFeeInSystemContract);
};

// Pessimistic fallback when on-chain estimation fails — over-estimates rather than failing.
// Native/TRC10 worst case: activation fee (recipient inactive) + standard bandwidth burn.
const fallbackFee = (intent: TransactionIntent<TronMemo>): bigint => {
  if (intent.type === "send" && intent.asset.type === "trc20") {
    return BigInt(STANDARD_FEES_TRC_20.toString());
  }
  return BigInt(ACTIVATION_FEES.plus(STANDARD_FEES_NATIVE).toString());
};

export async function estimateFees(
  transactionIntent: TransactionIntent<TronMemo>,
): Promise<bigint> {
  try {
    const [networkInfo, recipientAccount, chainParams, energyNeeded] = await Promise.all([
      getTronAccountNetwork(transactionIntent.sender),
      // Only native sends need the recipient account for the activation-fee branch.
      transactionIntent.type === "send" && transactionIntent.asset.type === "native"
        ? fetchTronAccount(transactionIntent.recipient).then(accounts => accounts[0])
        : Promise.resolve<AccountTronAPI | undefined>(undefined),
      getChainParameters(),
      estimateEnergy(transactionIntent),
    ]);

    const total = computeBandwidthFee(estimatedTxSize(transactionIntent), networkInfo, chainParams)
      .plus(computeEnergyFee(energyNeeded, networkInfo, chainParams))
      .plus(computeActivationFee(transactionIntent, recipientAccount, chainParams));

    return BigInt(total.integerValue(BigNumber.ROUND_CEIL).toFixed());
  } catch (err) {
    log("tron/estimateFees", "falling back to pessimistic constants", { err });
    return fallbackFee(transactionIntent);
  }
}
