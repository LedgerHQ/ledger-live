import {
  SequenceNumberTooOldError,
  SequenceNumberTooNewError,
  TransactionExpiredError,
} from "../errors";

describe("APTOS errors", () => {
  it("should create the SequenceNumberTooOldError error", () => {
    const error = new SequenceNumberTooOldError();

    expect(error).toBeInstanceOf(Error);
  });

  it("should create the SequenceNumberTooNewError error", () => {
    const error = new SequenceNumberTooNewError();

    expect(error).toBeInstanceOf(Error);
  });

  it("should create the TransactionExpiredError error", () => {
    const error = new TransactionExpiredError();

    expect(error).toBeInstanceOf(Error);
  });
});
