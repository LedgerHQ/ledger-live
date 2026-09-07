import { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/types";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-module-framework/utils";
import type { TrongridTxInfo } from "../../types";
import { Block } from "../types";

export function fromTrongridTxInfoToOperation(
  trongridTxInfo: TrongridTxInfo,
  block: Block,
  userAddress: string,
): Operation {
  const type = inferOperationType(trongridTxInfo, userAddress);
  const value = fromBigNumberToBigInt(trongridTxInfo.value, BigInt(0));
  const asset = inferAssetInfo(trongridTxInfo, userAddress);

  const operation: Operation = {
    id: trongridTxInfo.txID,
    tx: {
      hash: trongridTxInfo.txID,
      block: {
        height: block.height,
        hash: block.hash,
        time: block.time || new Date(0),
      },
      fees: fromBigNumberToBigInt(trongridTxInfo.fee, BigInt(0)),
      feesPayer: trongridTxInfo.feesPayer ?? trongridTxInfo.from,
      date: trongridTxInfo.date,
      failed: trongridTxInfo.hasFailed,
    },
    type,
    value,
    senders: [trongridTxInfo.from],
    recipients: trongridTxInfo.to ? [trongridTxInfo.to] : [],
    asset,
  };

  // The generic coin framework reads `ledgerOpType` from `details` to type the token
  // sub-account operation; the amount already comes from `value`.
  if (asset.type !== "native") {
    operation.details = { ledgerOpType: type };
  }

  // `familyExtra` is the framework's family-agnostic passthrough onto `Operation.extra`: the staking
  // amounts and votes the Tron operation-details screens render (frozenAmount, unfreezeAmount, votes,
  // unDelegatedAmount, receiverAddress). Without it synced staking history shows 0.
  if (trongridTxInfo.extra) {
    operation.details = { ...operation.details, familyExtra: trongridTxInfo.extra };
  }

  // `memo` is a framework-reserved `details` key: the generic layer copies it onto `Operation.extra.memo`,
  // so the sender's note round-trips into synced history.
  if (trongridTxInfo.memo) {
    operation.details = { ...operation.details, memo: trongridTxInfo.memo };
  }

  return operation;
}

/**
 * The contract type is what distinguishes a staking operation from a transfer; the sender/recipient
 * heuristic alone types every one of them as a plain send, which would cost synced history its
 * Freeze / Unfreeze / Vote / Reward labels.
 */
function inferOperationType(trongridTxInfo: TrongridTxInfo, userAddress: string): string {
  switch (trongridTxInfo.type) {
    case "VoteWitnessContract":
      return "VOTE";
    case "WithdrawBalanceContract":
      return "REWARD";
    case "FreezeBalanceContract":
    case "FreezeBalanceV2Contract":
      return "FREEZE";
    case "UnfreezeBalanceV2Contract":
      return "UNFREEZE";
    case "UnfreezeBalanceContract":
      return "LEGACY_UNFREEZE";
    case "WithdrawExpireUnfreezeContract":
      return "WITHDRAW_EXPIRE_UNFREEZE";
    case "UnDelegateResourceContract":
      return "UNDELEGATE_RESOURCE";
    case "ContractApproval":
      return "APPROVE";
    case "ExchangeTransactionContract":
      return "OUT";
    default:
      return inferTransferDirection(trongridTxInfo, userAddress);
  }
}

function inferTransferDirection(trongridTxInfo: TrongridTxInfo, userAddress: string): string {
  switch (true) {
    // Sending to yourself is legal on Tron and is typed `OUT` — the account is the sender, and
    // `UNKNOWN` would render the row without a direction.
    case trongridTxInfo.from === userAddress && trongridTxInfo.to !== undefined:
      return "OUT";
    case trongridTxInfo.to === userAddress && trongridTxInfo.from !== userAddress:
      return "IN";
    default:
      return "UNKNOWN";
  }
}

export function inferAssetInfo(trongridTxInfo: TrongridTxInfo, userAddress?: string): AssetInfo {
  // `assetOwner` identifies the account holding the token sub-account. It is only
  // meaningful when listing operations for a specific address (account sync); the
  // block-level operations path leaves it undefined.
  const owner = userAddress ? { assetOwner: userAddress } : {};
  switch (true) {
    case trongridTxInfo.tokenType === "trc10":
      return {
        type: "trc10",
        // if tokenType is trc10, tokenId is always defined
        assetReference: trongridTxInfo.tokenId as string,
        ...owner,
      };
    case trongridTxInfo.tokenType === "trc20":
      return {
        type: "trc20",
        // if tokenType is trc20, contractAddress is always defined
        assetReference: trongridTxInfo.tokenAddress as string,
        ...owner,
      };
    default:
      return { type: "native" };
  }
}
