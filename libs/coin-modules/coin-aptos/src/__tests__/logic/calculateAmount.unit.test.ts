import BigNumber from "bignumber.js";
import { calculateAmount } from "../../logic/calculateAmount";

describe("calculateAmount", () => {
  it("should calculate the correct amount when the address is the sender", () => {
    const address = "0x11";
    const sender = "0x11";
    const amount_in = new BigNumber(50);
    const amount_out = new BigNumber(100);

    const result = calculateAmount(sender, address, amount_in, amount_out);

    // LL negates the amount for SEND transactions during output
    expect(result).toEqual(new BigNumber(50)); // -(50 - 100 - 10)
  });

  it("should calculate the correct amount when the address is not the sender", () => {
    const address = "0x11";
    const sender = "0x12";
    const amount_in = new BigNumber(100);
    const amount_out = new BigNumber(50);

    const result = calculateAmount(sender, address, amount_in, amount_out);

    expect(result).toEqual(new BigNumber(50)); // 100 - 50
  });

  it("should handle transactions with zero amounts", () => {
    const address = "0x11";
    const sender = "0x11";
    const amount_in = new BigNumber(0);
    const amount_out = new BigNumber(0);

    const result = calculateAmount(sender, address, amount_in, amount_out);

    // LL negates the amount for SEND transactions during output
    expect(result).toEqual(new BigNumber(0)); // -(0 - 0 - 10)
  });

  it("should get negative numbers (for send tx with deposit to account)", () => {
    const address = "0x11";
    const sender = "0x11";
    const amount_in = new BigNumber(100);
    const amount_out = new BigNumber(0);

    const result = calculateAmount(sender, address, amount_in, amount_out);

    // LL negates the amount for SEND transactions during output
    expect(result).toEqual(new BigNumber(100).negated()); // 100 - 10
  });
});
