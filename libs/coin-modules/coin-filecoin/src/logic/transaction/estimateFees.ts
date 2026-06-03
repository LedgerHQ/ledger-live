import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import { abiEncodeTransferParams, encodeTxnParams } from "../../erc20/tokenAccounts";
import { validateAddress } from "../../network/addresses";
import { BroadcastBlockIncl } from "../../types";
import { fetchEstimatedFees } from "../../network/api";

// Inline method numbers from Filecoin spec (mirrors src/bridge/utils.ts Methods enum).
// logic/ must not import from bridge/, so we inline the relevant constants here.
const METHOD_TRANSFER = 0;
const METHOD_INVOKE_EVM = 3844450837;

// Default fallback fee used when token simulation fails due to zero native balance.
// This is a best-effort estimate; the actual fee will be validated at sign time.
const DEFAULT_FEE_FALLBACK: FeeEstimation = {
  value: 100_000n,
  parameters: {
    gasFeeCap: "100000",
    gasLimit: "1000000",
    gasPremium: "1000",
  },
};

export async function estimateFees(
  intent: TransactionIntent,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const senderValidation = validateAddress(intent.sender);
  if (!senderValidation.isValid) {
    throw new Error(`Invalid sender address: ${intent.sender}`);
  }
  const from = senderValidation.parsedAddress.toString();

  const assetType = intent.asset.type;
  let to: string | undefined;
  let methodNum: number;
  let value: string;
  let params: string | undefined;

  if (assetType === "native") {
    const recipientValidation = validateAddress(intent.recipient ?? "");
    to = recipientValidation.isValid ? recipientValidation.parsedAddress.toString() : undefined;
    methodNum = METHOD_TRANSFER;
    value = intent.amount.toString();
  } else if (assetType === "erc20") {
    const asset = intent.asset as { type: "erc20"; assetReference: string };
    const contractAddr = asset.assetReference.toLowerCase();
    const contractValidation = validateAddress(contractAddr);
    if (!contractValidation.isValid) {
      throw new Error(`Invalid ERC-20 contract address: ${contractAddr}`);
    }
    to = contractValidation.parsedAddress.toString();
    methodNum = METHOD_INVOKE_EVM;
    value = "0";

    const recipientEth =
      intent.recipient && intent.recipient.startsWith("0x")
        ? intent.recipient
        : (() => {
            const v = validateAddress(intent.recipient ?? "");
            if (!v.isValid) throw new Error(`Invalid token recipient: ${intent.recipient}`);
            return v.parsedAddress.toString();
          })();

    try {
      const abiEncoded = abiEncodeTransferParams(recipientEth, intent.amount.toString());
      params = encodeTxnParams(abiEncoded);
    } catch (e) {
      log("debug", "[estimateFees] failed to encode token params, using fallback", e);
      return DEFAULT_FEE_FALLBACK;
    }
  } else {
    throw new Error(`Unsupported asset type: ${String(assetType)}`);
  }

  try {
    const fees = await fetchEstimatedFees({
      from,
      ...(to ? { to } : {}),
      methodNum,
      blockIncl: BroadcastBlockIncl,
      value,
      ...(params ? { params } : {}),
    });

    const gasFeeCap = BigInt(fees.gas_fee_cap);
    const gasLimit = BigInt(fees.gas_limit);

    return {
      value: gasFeeCap * gasLimit,
      parameters: {
        gasFeeCap: fees.gas_fee_cap,
        gasLimit: String(fees.gas_limit),
        gasPremium: fees.gas_premium,
      },
    };
  } catch (e) {
    log("debug", "[estimateFees] fee estimation failed, returning fallback", e);
    return DEFAULT_FEE_FALLBACK;
  }
}
