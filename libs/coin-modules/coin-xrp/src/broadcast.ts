import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { Transaction } from "./types";
import { submit } from "./api";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation },
}) => {
  const submittedPayment = await submit(signature);

  if (
    submittedPayment.engine_result !== "tesSUCCESS" &&
    submittedPayment.engine_result !== "terQUEUED"
  ) {
    throw new Error(submittedPayment.engine_result_message);
  }

  const { hash } = submittedPayment.tx_json;
  return patchOperationWithHash(operation, hash);
};
