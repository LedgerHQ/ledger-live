import type {
  CraftedTransaction,
  FeeEstimation,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  GAS,
  GAS_PRICE,
  TRANSACTION_OPTIONS_TX_HASH_SIGN,
  TRANSACTION_VERSION_DEFAULT,
  MULTIVERSX_STAKING_POOL,
  MIN_GAS_LIMIT,
} from "../../constants";
import type { MultiversXProtocolTransaction } from "../../types";
import type { MultiversXNetworkApi } from "../../network/api";
import { isValidAddress } from "../validateAddress";

// MultiversX transaction `data` must be base64-encoded, and hex amounts must be
// even-length so the protocol parses them correctly (see src/encode.ts).
function toEvenHex(amount: bigint): string {
  const hex = amount.toString(16);
  return hex.length % 2 === 0 ? hex : `0${hex}`;
}

function encodeData(payload: string): string {
  return Buffer.from(payload).toString("base64");
}

function buildESDTTransferData(tokenIdentifier: string, amount: bigint): string {
  const hexId = Buffer.from(tokenIdentifier).toString("hex");
  return encodeData(`ESDTTransfer@${hexId}@${toEvenHex(amount)}`);
}

function buildDelegateData(): string {
  return encodeData("delegate");
}

function buildReDelegateData(): string {
  return encodeData("reDelegateRewards");
}

function buildUnDelegateData(amount: bigint): string {
  return encodeData(`unDelegate@${toEvenHex(amount)}`);
}

function buildClaimRewardsData(): string {
  return encodeData("claimRewards");
}

function buildWithdrawData(): string {
  return encodeData("withdraw");
}

/**
 * Craft a MultiversX unsigned transaction from a TransactionIntent or StakingTransactionIntent.
 *
 * Returns a JSON-serialized MultiversXProtocolTransaction (version 2, options 0b0001).
 */
export async function craftTransaction(
  api: MultiversXNetworkApi,
  intent: TransactionIntent | StakingTransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isValidAddress(intent.sender)) {
    throw new Error(`Invalid sender address: ${intent.sender}`);
  }

  // Fetch nonce and chainID together — chainID is read from the network config
  // rather than hardcoded so crafting works on any network (mainnet/devnet/testnet).
  const [nonce, { chainID }] = await Promise.all([
    api.getAccountNonce(intent.sender),
    api.getNetworkConfig(),
  ]);

  // Staking intents leave `value` at 0 (except delegate) and only override the
  // receiver/data/gasLimit; native and ESDT transfers set `value` explicitly.
  let receiver = intent.recipient;
  let value = "0";
  let data: string | undefined;
  let gasLimit: number;

  const assetType = intent.asset.type;

  // Staking intents — identified by type field
  const txType = (intent as StakingTransactionIntent).type ?? "";

  if (txType === "delegate" || txType === "stake.createAccount") {
    // delegate targets a specific provider contract — recipient is required (as in
    // validateIntent); the guard below rejects a missing/invalid recipient.
    value = String(intent.amount);
    data = buildDelegateData();
    gasLimit = GAS.DELEGATE;
  } else if (txType === "reDelegateRewards") {
    receiver = intent.recipient || MULTIVERSX_STAKING_POOL;
    data = buildReDelegateData();
    gasLimit = GAS.DELEGATE;
  } else if (txType === "unDelegate" || txType === "stake.undelegate") {
    data = buildUnDelegateData(intent.amount);
    gasLimit = GAS.DELEGATE;
  } else if (txType === "claimRewards") {
    receiver = intent.recipient || MULTIVERSX_STAKING_POOL;
    data = buildClaimRewardsData();
    gasLimit = GAS.CLAIM;
  } else if (txType === "withdraw" || txType === "stake.withdraw") {
    // withdraw is recipient-optional in validateIntent (like claim/reDelegate), so
    // default the receiver to the staking pool to avoid failing the guard below.
    receiver = intent.recipient || MULTIVERSX_STAKING_POOL;
    data = buildWithdrawData();
    gasLimit = GAS.DELEGATE;
  } else if (assetType === "native") {
    // Native EGLD transfer
    value = String(intent.amount);
    gasLimit = MIN_GAS_LIMIT;
  } else if (
    assetType === "esdt" &&
    "assetReference" in intent.asset &&
    intent.asset.assetReference
  ) {
    // ESDT transfer
    const tokenIdentifier = intent.asset.assetReference;
    data = buildESDTTransferData(tokenIdentifier, intent.amount);
    gasLimit = GAS.ESDT_TRANSFER;
  } else {
    throw new Error(`Unsupported asset type: ${assetType}`);
  }

  // Reject a missing/invalid receiver before producing an unsigned tx — send and
  // unDelegate take the recipient verbatim, so a bad address would otherwise
  // serialize into a malformed transaction rejected on broadcast.
  if (!receiver || !isValidAddress(receiver)) {
    throw new Error(`Invalid recipient address: ${receiver}`);
  }

  const providedGasLimit = customFees?.parameters?.gasLimit;
  const effectiveGasLimit =
    typeof providedGasLimit === "bigint" ? Number(providedGasLimit.toString()) : gasLimit;

  const tx: MultiversXProtocolTransaction = {
    nonce,
    value,
    receiver,
    sender: intent.sender,
    gasPrice: GAS_PRICE,
    gasLimit: effectiveGasLimit,
    chainID,
    version: TRANSACTION_VERSION_DEFAULT,
    options: TRANSACTION_OPTIONS_TX_HASH_SIGN,
    ...(data ? { data } : {}),
  };

  return {
    transaction: JSON.stringify(tx),
    details: {
      gasLimit: effectiveGasLimit,
      estimatedFee: String(customFees?.value ?? BigInt(effectiveGasLimit) * BigInt(GAS_PRICE)),
    },
  };
}
