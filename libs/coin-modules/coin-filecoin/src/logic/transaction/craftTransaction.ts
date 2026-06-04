import type {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { Message } from "iso-filecoin/message";
import { abiEncodeTransferParams, encodeTxnParams } from "../../erc20/tokenAccounts";
import { convertAddressFilToEth, validateAddress } from "../../network/addresses";
import { BroadcastBlockIncl } from "../../types";
import { fetchEstimatedFees } from "../../network/api";
import { getNextSequence } from "../account/getNextSequence";

// Inline method numbers from Filecoin spec (mirrors src/bridge/utils.ts Methods enum).
// logic/ must not import from bridge/, so we inline the relevant constants here.
const METHOD_TRANSFER = 0;
const METHOD_INVOKE_EVM = 3844450837;

// Serialisation format (symmetric with combine.ts):
//   Output `transaction` field = JSON.stringify({ cbor, message }) where
//   - cbor: base64-encoded CBOR of the Filecoin Message (what the signer signs)
//   - message: the message fields in Lotus shape (what combine uses to rebuild
//     the BroadcastTransactionRequest without re-deserialising CBOR — iso-filecoin
//     v4 exposes Message.serialize() but no static deserialize equivalent).
export async function craftTransaction(
  intent: TransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const senderValidation = validateAddress(intent.sender);
  if (!senderValidation.isValid) {
    throw new Error(`Invalid sender address: ${intent.sender}`);
  }
  const from = senderValidation.parsedAddress.toString();

  const nonce = await getNextSequence(from);

  let to: string;
  let value: string;
  let method: number;
  let params: string | undefined;

  const assetType = intent.asset.type;

  if (assetType === "native") {
    const recipientValidation = validateAddress(intent.recipient ?? "");
    if (!recipientValidation.isValid) {
      throw new Error(`Invalid recipient address: ${intent.recipient}`);
    }
    to = recipientValidation.parsedAddress.toString();
    value = intent.amount.toString();
    method = METHOD_TRANSFER;
  } else if (assetType === "erc20") {
    const asset = intent.asset as { type: "erc20"; assetReference: string };
    const contractAddr = asset.assetReference.toLowerCase();
    const contractValidation = validateAddress(contractAddr);
    if (!contractValidation.isValid) {
      throw new Error(`Invalid ERC-20 contract address: ${contractAddr}`);
    }
    to = contractValidation.parsedAddress.toString();
    value = "0";
    method = METHOD_INVOKE_EVM;

    const recipientEth =
      intent.recipient && intent.recipient.startsWith("0x")
        ? intent.recipient
        : (() => {
            try {
              return convertAddressFilToEth(intent.recipient ?? "");
            } catch {
              throw new Error(`Invalid token recipient: ${intent.recipient}`);
            }
          })();

    const abiEncoded = abiEncodeTransferParams(recipientEth, intent.amount.toString());
    params = encodeTxnParams(abiEncoded);
  } else {
    throw new Error(`Unsupported asset type: ${String(assetType)}`);
  }

  // Fetch gas estimates (or use custom fees if provided)
  let gasFeeCap: string;
  let gasLimit: number;
  let gasPremium: string;

  if (customFees?.parameters) {
    gasFeeCap = String(customFees.parameters["gasFeeCap"] ?? "0");
    gasLimit = Number(customFees.parameters["gasLimit"] ?? 0);
    gasPremium = String(customFees.parameters["gasPremium"] ?? "0");
  } else {
    const fees = await fetchEstimatedFees({
      from,
      to,
      methodNum: method,
      blockIncl: BroadcastBlockIncl,
      value,
      ...(params ? { params } : {}),
    });
    gasFeeCap = fees.gas_fee_cap;
    gasLimit = fees.gas_limit;
    gasPremium = fees.gas_premium;
  }

  const message = new Message({
    to,
    from,
    nonce: Number(nonce),
    value,
    gasFeeCap,
    gasLimit,
    gasPremium,
    method,
    params,
    version: 0,
  });

  const cbor = Buffer.from(message.serialize()).toString("base64");
  const messageJson = {
    version: message.version ?? 0,
    to: message.to,
    from: message.from,
    nonce: message.nonce,
    value: message.value,
    gasLimit: message.gasLimit,
    gasFeeCap: message.gasFeeCap,
    gasPremium: message.gasPremium,
    method: message.method,
    params: message.params ?? "",
  };

  return {
    transaction: JSON.stringify({ cbor, message: messageJson }),
  };
}
