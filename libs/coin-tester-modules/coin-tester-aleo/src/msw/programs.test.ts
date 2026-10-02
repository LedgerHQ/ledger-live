import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import { TOKEN_PROGRAM_ID, TRANSFER_TOKEN_PUBLIC_BASE_FEE } from "../fixtures";
import { INDEXED_PROGRAMS } from "./programs";

describe("INDEXED_PROGRAMS", () => {
  it("puts credits.aleo/transfer_public's sender at future argument 0", () => {
    expect(INDEXED_PROGRAMS[PROGRAM_ID.CREDITS].transfer_public).toStrictEqual({
      senderArgIndex: 0,
      recipientInputIndex: 0,
      amountInputIndex: 1,
      amountSuffix: "u64",
      baseFee: expect.any(Number),
    });
  });

  it("puts the stablecoin transfer_public's sender at future argument 2, not 0", () => {
    const descriptor = INDEXED_PROGRAMS[TOKEN_PROGRAM_ID].transfer_public;
    expect(descriptor.senderArgIndex).toBe(2);
    expect(descriptor.recipientInputIndex).toBe(0);
    expect(descriptor.amountInputIndex).toBe(1);
    expect(descriptor.amountSuffix).toBe("u128");
    expect(descriptor.baseFee).toBe(TRANSFER_TOKEN_PUBLIC_BASE_FEE);
  });

  it("also describes mint_public, with the same sender position as transfer_public", () => {
    const descriptor = INDEXED_PROGRAMS[TOKEN_PROGRAM_ID].mint_public;
    expect(descriptor.senderArgIndex).toBe(2);
    expect(descriptor.amountSuffix).toBe("u128");
  });
});
