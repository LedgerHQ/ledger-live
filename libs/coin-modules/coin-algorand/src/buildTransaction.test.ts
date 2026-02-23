import { makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { encodeToBroadcast } from "./buildTransaction";

describe("buildTransaction", () => {
  describe("encodeToBroadcast", () => {
    it("only takes the first 64 bytes as signature", () => {
      const transaction = makePaymentTxnWithSuggestedParamsFromObject({
        sender: "RGX5XA7DWZOZ5SLG4WQSNIFKIG4CNX4VOH23YCEX56523DQEAL3QL56XZM",
        receiver: "5QS7ANKWSK5XI2ZNWN34BA5KQLSZ3FEI2DTSJQIW5IZZZISD3VEHM5ZT2M",
        amount: 0,
        suggestedParams: {
          firstValid: 0,
          lastValid: 0,
          fee: 0,
          minFee: 0,
        },
      });
      const signatureWith66Bytes = Buffer.concat([Buffer.alloc(64), Buffer.from("9000", "hex")]);
      const signatureWith64Bytes = Buffer.alloc(64);

      expect(encodeToBroadcast(transaction, signatureWith66Bytes)).toEqual(
        encodeToBroadcast(transaction, signatureWith64Bytes),
      );
    });
  });
});
