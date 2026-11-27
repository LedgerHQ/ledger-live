import { ZeroAddress } from "ethers";
import type { PredictionsSignedTypedData, PredictionsTypedData } from "./typedData";

const PREDICTIONS_BINDING_ACTION = "Confirm account ownership";

const PREDICTIONS_BINDING_NOTICE =
  "MoonPay Trade will operate a trading wallet for this account. Every trade and withdrawal needs your signature.";

export type PredictionsBindingAnswer = PredictionsSignedTypedData;

/**
 * The binding message is built here, never by the live app, so the "Confirm account ownership"
 * prompt can only sign this message.
 */
export function getBindingTypedData(address: string): PredictionsTypedData {
  return {
    domain: {
      name: "Ledger Predictions",
      version: "1",
      chainId: 137,
      verifyingContract: ZeroAddress,
    },
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
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
