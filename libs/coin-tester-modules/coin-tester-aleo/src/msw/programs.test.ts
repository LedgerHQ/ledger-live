import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import { INDEXED_PROGRAMS, SENDER_ABSENT_FROM_FUTURE } from "./programs";

describe("INDEXED_PROGRAMS", () => {
  it("puts credits.aleo/transfer_public's sender at future argument 0", () => {
    expect(INDEXED_PROGRAMS[PROGRAM_ID.CREDITS].transfer_public).toStrictEqual({
      senderArgIndex: 0,
      recipientInputIndex: 0,
      amountInputIndex: 1,
      amountSuffix: "u64",
    });
  });

  it("reads transfer_private_to_public's receiver and amount behind the spent record, with no sender", () => {
    expect(INDEXED_PROGRAMS[PROGRAM_ID.CREDITS].transfer_private_to_public).toStrictEqual({
      senderArgIndex: SENDER_ABSENT_FROM_FUTURE,
      recipientInputIndex: 1,
      amountInputIndex: 2,
      amountSuffix: "u64",
    });
  });

  it("indexes no program but credits.aleo", () => {
    expect(Object.keys(INDEXED_PROGRAMS)).toStrictEqual([PROGRAM_ID.CREDITS]);
  });
});
