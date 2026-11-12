import { verifyTypedData } from "ethers";

const PREDICTIONS_BINDING_ACTION = "Confirm account ownership";

const PREDICTIONS_BINDING_NOTICE =
  "MoonPay Trade will operate a trading wallet for this account. Every trade and withdrawal needs your signature.";

type TypedDataField = { name: string; type: string };

/** An EIP-712 message, in the JSON form the Ethereum app signs. */
export type PredictionsTypedData = {
  domain: { name: string; version: string; chainId: number };
  types: { EIP712Domain: TypedDataField[]; [type: string]: TypedDataField[] };
  primaryType: string;
  message: Record<string, unknown>;
};

export type PredictionsBindingAnswer = {
  typedData: PredictionsTypedData;
  /** 0x-prefixed hex. */
  signature: string;
};

/**
 * The binding message is built here, never by the live app, so the "Confirm account ownership"
 * prompt can only sign this message.
 */
export function getBindingTypedData(address: string): PredictionsTypedData {
  return {
    domain: { name: "Ledger Predictions", version: "1", chainId: 137 },
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
      ],
      ConfirmAccountOwnership: [
        { name: "action", type: "string" },
        { name: "account", type: "address" },
        { name: "notice", type: "string" },
      ],
    },
    primaryType: "ConfirmAccountOwnership",
    message: {
      action: PREDICTIONS_BINDING_ACTION,
      account: address,
      notice: PREDICTIONS_BINDING_NOTICE,
    },
  };
}

export function isBindingSigner(
  address: string,
  typedData: PredictionsTypedData,
  signature: string,
): boolean {
  const { EIP712Domain: _domainType, ...types } = typedData.types;
  try {
    const signer = verifyTypedData(typedData.domain, types, typedData.message, signature);
    return signer.toLowerCase() === address.toLowerCase();
  } catch {
    // A signature that can't be recovered proves nothing, like one from another account.
    return false;
  }
}
