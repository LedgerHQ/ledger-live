import { DeviceModelId } from "@ledgerhq/devices";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { createFixtureTransaction } from "../types/bridge.fixture";
import getResolution from "./getResolution";

describe("getResolution", () => {
  it("should return undefined if there's no token information on the transaction", () => {
    const transaction = createFixtureTransaction();
    expect(getResolution(transaction)).toBeUndefined();
  });

  it("should return undefined if mode is different from token.send", () => {
    const transaction = createFixtureTransaction({
      subAccountId: "subAccountId",
      tokenId: "tokenId",
    });
    expect(getResolution(transaction)).toBeUndefined();
  });

  it("should return undefined if there's no subAccountId", () => {
    const transaction = createFixtureTransaction({
      mode: "token.send",
      tokenId: "tokenId",
    });
    expect(getResolution(transaction)).toBeUndefined();
  });

  it("should return undefined if there's no tokenId", () => {
    const transaction = createFixtureTransaction({
      mode: "token.send",
      subAccountId: "subAccountId",
    });
    expect(getResolution(transaction)).toBeUndefined();
  });

  it("should return the correct object", () => {
    const transaction = createFixtureTransaction({
      mode: "token.send",
      subAccountId: "subAccountId",
      tokenId: "tokenId",
    });
    expect(getResolution(transaction)).toEqual({
      deviceModelId: undefined,
      certificateSignatureKind: undefined,
      tokenId: "tokenId",
      tokenAddress: DEFAULT_COIN_TYPE,
    });
  });

  it("should return the correct object when deviceModelId is provided", () => {
    const transaction = createFixtureTransaction({
      mode: "token.send",
      subAccountId: "subAccountId",
      tokenId: "tokenId",
    });
    expect(getResolution(transaction, DeviceModelId.nanoS)).toEqual({
      deviceModelId: "nanoS",
      certificateSignatureKind: undefined,
      tokenId: "tokenId",
      tokenAddress: DEFAULT_COIN_TYPE,
    });
  });

  it("should return the correct object when deviceModelId and certificateSignatureKind is provided", () => {
    const transaction = createFixtureTransaction({
      mode: "token.send",
      subAccountId: "subAccountId",
      tokenId: "tokenId",
    });
    expect(getResolution(transaction, DeviceModelId.europa, "test")).toEqual({
      deviceModelId: "europa",
      certificateSignatureKind: "test",
      tokenId: "tokenId",
      tokenAddress: DEFAULT_COIN_TYPE,
    });
  });
});
