import { getSignatureRequestGroupId, handlers } from "./server";

jest.mock("@ledgerhq/wallet-api-server", () => ({
  customWrapper: jest.fn(handler => handler),
}));

type CancelHandler = (params: unknown) => { cancelled: number };

function getCancelHandler(cancelSignatures: (requestGroupId: string) => number): CancelHandler {
  // @ts-expect-error customWrapper is mocked to return the raw handler
  return handlers({ cancelSignatures })["custom.signature.cancel"];
}

describe("getSignatureRequestGroupId", () => {
  it("reads the request group from the meta", () => {
    expect(getSignatureRequestGroupId({ requestGroupId: "topic-1", other: 1 })).toBe("topic-1");
  });

  it.each([undefined, null, "topic-1", {}, { requestGroupId: "" }, { requestGroupId: 1 }])(
    "has no request group for %p",
    meta => {
      expect(getSignatureRequestGroupId(meta)).toBeUndefined();
    },
  );
});

describe("custom.signature.cancel handler", () => {
  it("cancels the sign requests of the group and returns how many there were", () => {
    const cancelSignatures = jest.fn().mockReturnValue(2);

    const result = getCancelHandler(cancelSignatures)({ requestGroupId: "topic-1" });

    expect(cancelSignatures).toHaveBeenCalledWith("topic-1");
    expect(result).toEqual({ cancelled: 2 });
  });

  it.each([undefined, {}, { requestGroupId: "" }])(
    "rejects a call without a request group (%p)",
    params => {
      const cancelSignatures = jest.fn();

      expect(() => getCancelHandler(cancelSignatures)(params)).toThrow(
        "custom.signature.cancel expects a non-empty requestGroupId",
      );
      expect(cancelSignatures).not.toHaveBeenCalled();
    },
  );
});
