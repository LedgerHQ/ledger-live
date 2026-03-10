import { Networks, Transaction as StellarSdkTransaction } from "@stellar/stellar-sdk";
import { combine } from "./combine";

jest.mock("@stellar/stellar-sdk", () => ({
  Networks: {
    PUBLIC: "PUBLIC",
  },
  Transaction: jest.fn().mockImplementation(() => ({
    addSignature: jest.fn(),
    toXDR: jest.fn().mockReturnValue("signed-xdr"),
  })),
}));

describe("combine", () => {
  it("creates a transaction, adds signature and returns xdr", () => {
    const result = combine("unsigned-xdr", "signature", "public-key");

    expect(StellarSdkTransaction).toHaveBeenCalledWith("unsigned-xdr", Networks.PUBLIC);

    const txInstance = (StellarSdkTransaction as unknown as jest.Mock).mock.results[0].value;
    expect(txInstance.addSignature).toHaveBeenCalledWith("public-key", "signature");
    expect(result).toBe("signed-xdr");
  });
});
