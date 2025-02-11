// import { loadSui } from "./loadSui";
import { fakeSignExtrinsic } from "./signTransaction";
import suiAPI from "../network";
import { CoreTransaction } from "../types";

export async function estimateFees({ unsigned }: CoreTransaction): Promise<bigint> {
  console.log("estimateFees", unsigned);
  // await loadSui();

  // const fakeSignedTx = await fakeSignExtrinsic(unsigned, registry);
  // const payment = await suiAPI.paymentInfo(fakeSignedTx);
  // if (payment) {
  //   //
  // }
  // return BigInt(payment?.partialFee);
  return BigInt(0);
}
