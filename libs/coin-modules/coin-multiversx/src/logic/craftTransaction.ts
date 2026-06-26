import type {
  CraftedTransaction,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { isStakingTransactionIntent } from "@ledgerhq/coin-module-framework/utils";

import {
  CHAIN_ID,
  GAS,
  GAS_PRICE,
  MIN_GAS_LIMIT,
  TRANSACTION_OPTIONS_TX_HASH_SIGN,
  TRANSACTION_VERSION_DEFAULT,
} from "../constants";
import { isValidAddress } from "../logic";
import type { CraftTransactionInput, MultiversXTransactionMode } from "../types";

/**
 * Encodes an ESDT transfer data field.
 * Format: ESDTTransfer@{tokenIdentifierHex}@{amountHex}
 * @param tokenIdentifier - The ESDT token identifier (e.g., "USDC-abc123")
 * @param amount - The amount to transfer as bigint
 * @returns Base64-encoded data string
 */
function encodeEsdtTransferData(tokenIdentifier: string, amount: bigint): string {
  const tokenHex = Buffer.from(tokenIdentifier).toString("hex");

  let amountHex = amount.toString(16);

  if (amountHex.length % 2 !== 0) {
    amountHex = "0" + amountHex;
  }

  if (amountHex === "" || amountHex === "0") {
    amountHex = "00";
  }

  const dataString = `ESDTTransfer@${tokenHex}@${amountHex}`;

  return Buffer.from(dataString).toString("base64");
}

/**
 * Encodes unDelegate data field with amount in hex.
 * Format: unDelegate@{amountHex}
 * CRITICAL: Hex amount MUST have even length per MultiversX protocol.
 * Note: Zero amount (0n) produces "unDelegate@00" which is valid.
 * @param amount - The amount to undelegate as bigint
 * @returns Base64-encoded data string
 */
function encodeUnDelegateData(amount: bigint): string {
  let amountHex = amount.toString(16);
  if (amountHex.length % 2 !== 0) {
    amountHex = "0" + amountHex;
  }

  if (amountHex === "" || amountHex === "0") {
    amountHex = "00";
  }
  return Buffer.from(`unDelegate@${amountHex}`).toString("base64");
}

/**
 * Intent `type` strings accepted for staking, mapped to MultiversX transaction modes.
 * Handles the various naming conventions used by callers (e.g. "undelegate" vs "unDelegate").
 */
const STAKING_TYPE_TO_MODE = new Map<string, MultiversXTransactionMode>([
  ["delegate", "delegate"],
  ["undelegate", "unDelegate"],
  ["unDelegate", "unDelegate"],
  ["claimRewards", "claimRewards"],
  ["claim_rewards", "claimRewards"],
  ["withdraw", "withdraw"],
  ["reDelegateRewards", "reDelegateRewards"],
  ["redelegate_rewards", "reDelegateRewards"],
  ["redelegateRewards", "reDelegateRewards"],
]);

/**
 * Whether the given intent `type` is a staking operation MultiversX supports.
 * Used by validateIntent to surface a user-facing error before crafting.
 */
export function isSupportedStakingType(type: string): boolean {
  return STAKING_TYPE_TO_MODE.has(type);
}

/**
 * Whether a transaction intent is a staking operation.
 *
 * The generic framework only tags `intentType: "staking"` for modes its
 * `isDelegationMode` recognizes (which, for MultiversX, is just delegate/withdraw),
 * so — like Solana's `isSolanaStakingTransactionIntent` — we also treat any intent
 * whose `type` is a supported staking type as staking. This covers unDelegate,
 * claimRewards and reDelegateRewards, whose names the framework doesn't classify.
 */
export function isStakingIntent(intent: TransactionIntent): boolean {
  return isStakingTransactionIntent(intent) || isSupportedStakingType(intent.type);
}

/**
 * Maps a staking intent `type` to its MultiversX transaction mode.
 * @throws Error if the staking type is not supported
 */
export function mapStakingTypeToMode(type: string): MultiversXTransactionMode {
  const mode = STAKING_TYPE_TO_MODE.get(type);
  if (!mode) {
    throw new Error(`craftTransaction failed: unsupported staking type "${type}"`);
  }
  return mode;
}

/**
 * Whether an address is a MultiversX validator/delegation contract (erd1qqqq...).
 */
export function isValidatorContract(address: string): boolean {
  return typeof address === "string" && address.startsWith("erd1qqqq");
}

/**
 * Gets the default gas limit for a transaction mode.
 * @param mode - The transaction mode
 * @param isEsdtTransfer - Whether this is an ESDT token transfer
 * @returns The default gas limit
 * @internal Exported for use in API layer to avoid code duplication
 */
export function getDefaultGasLimit(
  mode: MultiversXTransactionMode,
  isEsdtTransfer: boolean,
): number {
  if (isEsdtTransfer) {
    return GAS.ESDT_TRANSFER;
  }

  if (
    mode === "delegate" ||
    mode === "unDelegate" ||
    mode === "withdraw" ||
    mode === "reDelegateRewards"
  ) {
    return GAS.DELEGATE;
  }
  if (mode === "claimRewards") {
    return GAS.CLAIM;
  }

  // Native EGLD transfer
  return MIN_GAS_LIMIT;
}

/**
 * Crafts an unsigned transaction for native EGLD, ESDT token transfer, or delegation operations.
 * Builds a MultiversXProtocolTransaction structure ready for hardware wallet signing.
 *
 * Supported modes:
 * - "send": Native EGLD or ESDT token transfer
 * - "delegate": Delegate EGLD to a validator
 * - "unDelegate": Undelegate EGLD from a validator
 * - "withdraw": Withdraw unbonded EGLD
 * - "claimRewards": Claim staking rewards
 * - "reDelegateRewards": Re-delegate rewards to validator
 *
 * @param input - Transaction input parameters
 * @returns Crafted transaction with serialized JSON transaction string
 * @throws Error if input validation fails (invalid address, negative amount/nonce)
 */
export function craftTransaction(input: CraftTransactionInput): CraftedTransaction {
  const { sender, recipient, amount, nonce, gasLimit, mode, tokenIdentifier, chainID } = input;

  if (!isValidAddress(sender)) {
    throw new Error("craftTransaction failed: invalid sender address format");
  }
  if (!isValidAddress(recipient)) {
    throw new Error("craftTransaction failed: invalid recipient address format");
  }
  if (amount < 0n) {
    throw new Error("craftTransaction failed: amount cannot be negative");
  }
  if (nonce < 0) {
    throw new Error("craftTransaction failed: nonce cannot be negative");
  }

  const isEsdtTransfer = tokenIdentifier !== undefined && tokenIdentifier.length > 0;

  let value: string;
  let data: string | undefined;

  switch (mode) {
    case "delegate":
      value = amount.toString();
      data = Buffer.from("delegate").toString("base64");
      break;

    case "unDelegate":
      value = "0";
      data = encodeUnDelegateData(amount);
      break;

    case "withdraw":
      value = "0";
      data = Buffer.from("withdraw").toString("base64");
      break;

    case "claimRewards":
      value = "0";
      data = Buffer.from("claimRewards").toString("base64");
      break;

    case "reDelegateRewards":
      value = "0";
      data = Buffer.from("reDelegateRewards").toString("base64");
      break;

    case "send":
    default:
      if (isEsdtTransfer) {
        if (!tokenIdentifier || tokenIdentifier.length === 0) {
          throw new Error(
            "craftTransaction failed: tokenIdentifier is required for ESDT transfers",
          );
        }
        value = "0";
        data = encodeEsdtTransferData(tokenIdentifier, amount);
      } else {
        value = amount.toString();
        data = undefined;
      }
      break;
  }

  const transaction: Record<string, unknown> = {
    nonce,
    value,
    receiver: recipient,
    sender,
    gasPrice: GAS_PRICE,
    gasLimit: gasLimit ?? getDefaultGasLimit(mode, isEsdtTransfer),
    chainID: chainID ?? CHAIN_ID,
    version: TRANSACTION_VERSION_DEFAULT,
    options: TRANSACTION_OPTIONS_TX_HASH_SIGN,
  };

  if (data !== undefined) {
    transaction.data = data;
  }

  const serialized = JSON.stringify(transaction);

  return {
    transaction: serialized,
  };
}
