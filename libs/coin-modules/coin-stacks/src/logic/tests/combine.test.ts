import { deserializeTransaction } from "@stacks/transactions";
import { applySignatureToTransaction } from "../../common-logic";
import { combine } from "../combine";

jest.mock("@stacks/transactions", () => ({
  deserializeTransaction: jest.fn(),
}));
jest.mock("../../common-logic", () => ({
  applySignatureToTransaction: jest.fn(),
}));

describe("combine", () => {
  it("deserializes, attaches the signature, and re-serializes as a hex string", () => {
    const parsedTx = { auth: { spendingCondition: {} } };
    (deserializeTransaction as jest.Mock).mockReturnValue(parsedTx);
    (applySignatureToTransaction as jest.Mock).mockReturnValue(Buffer.from([1, 2, 3]));

    const result = combine("0xdeadbeef", "SIGNATURE_HEX");

    expect(deserializeTransaction).toHaveBeenCalledWith("deadbeef");
    expect(applySignatureToTransaction).toHaveBeenCalledWith(parsedTx, "SIGNATURE_HEX");
    expect(result).toBe("0x010203");
  });

  it("strips a 0x prefix from the crafted transaction before deserializing", () => {
    (deserializeTransaction as jest.Mock).mockReturnValue({});
    (applySignatureToTransaction as jest.Mock).mockReturnValue(Buffer.from([]));

    combine("deadbeef", "sig");

    expect(deserializeTransaction).toHaveBeenCalledWith("deadbeef");
  });
});
