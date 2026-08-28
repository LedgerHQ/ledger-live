import { isUserRefusal } from "../isUserRefusal";

describe("isUserRefusal", () => {
  it.each([
    ["the coin app prompt, normalized by the transaction action", "TransactionRefusedOnDevice"],
    ["a signer that names the refusal itself", "UserRefusedOnDevice"],
    ["the manager allowance prompt, raised while resolving apps", "UserRefusedAllowManager"],
  ])("recognises a decline reported by %s", (_case, name) => {
    expect(isUserRefusal(Object.assign(new Error("refused"), { name }))).toBe(true);
  });

  it("recognises a decline on the Exchange app prompt, which survives only as a title", () => {
    const error = Object.assign(new Error("refused"), {
      name: "CompleteExchangeError",
      title: "userRefused",
    });

    expect(isUserRefusal(error)).toBe(true);
  });

  it.each([
    ["a plain failure", new Error("boom")],
    [
      "an Exchange failure that is not a decline",
      Object.assign(new Error("boom"), { name: "CompleteExchangeError", title: "internalError" }),
    ],
    ["nothing at all", undefined],
    ["a string", "userRefused"],
  ])("does not mistake %s for a decline", (_case, error) => {
    expect(isUserRefusal(error)).toBe(false);
  });
});
