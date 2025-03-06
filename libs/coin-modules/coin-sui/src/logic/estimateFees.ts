// import { loadSui } from "./loadSui";
import { fakeSignExtrinsic } from "./signTransaction";
import suiAPI from "../network";
import { CoreTransaction } from "../types";

export async function estimateFees(sender: string, transaction: any): Promise<bigint> {
  console.log("estimateFees", transaction);
  // await loadSui();

  // const fakeSignedTx = await fakeSignExtrinsic(unsigned, registry);
  const { fees, gasBudget } = await suiAPI.paymentInfo(sender, transaction);
  // if (payment) {
  //   //
  // }
  // return BigInt(payment?.partialFee);
  return BigInt(gasBudget);
}
