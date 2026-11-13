import { Transaction, Secp256k1, Hex } from "@vechain/sdk-core";
import broadcast from "./broadcast";
import { getBlockRef } from "../network";
import { getCoinConfig, setCoinConfig, vechainDefaults } from "../config";

describe("Broadcast", () => {
  beforeAll(() => {
    setCoinConfig(() => vechainDefaults.vechain);
  });

  it("throws on insufficient funds", async () => {
    const privateKey = await Secp256k1.generatePrivateKey();
    const body = {
      chainTag: vechainDefaults.vechain.chainTag,
      blockRef: await getBlockRef(getCoinConfig()),
      expiration: 18,
      clauses: [
        {
          to: "0x301850FDb444D5a62edD3B46F74A73107d9Ba914",
          value: "0xde0b6b3a7640000",
          data: "0x",
        },
      ],
      maxFeePerGas: 10460000000000,
      maxPriorityFeePerGas: 460000000000,
      gas: 21000,
      dependsOn: null,
      nonce: "0",
    };
    const signedTransaction = Transaction.of(body).sign(privateKey);
    const rawTx = Hex.of(signedTransaction.signature ?? new Uint8Array())
      .toString()
      .substring(2);

    // NOTE Actual underlying message is "tx rejected: insufficient energy", but not exposed live `live-network`
    await expect(
      broadcast({ signedOperation: { signature: rawTx, rawData: { body } } } as any),
    ).rejects.toThrow(/API HTTP 403/);
  });
});
