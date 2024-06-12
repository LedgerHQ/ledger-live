import { submit } from "../network";

export async function broadcast(signature: string): Promise<string> {
  const submittedPayment = await submit(signature);

  if (
    submittedPayment.engine_result !== "tesSUCCESS" &&
    submittedPayment.engine_result !== "terQUEUED"
  ) {
    throw new Error(submittedPayment.engine_result_message);
  }

  const { hash } = submittedPayment.tx_json;
  return hash;
}
