import {
  testnetAddress as address,
  testnetViewKey as viewKey,
} from "./__tests__/fixtures/api.fixture";
import { composeAccountKey, splitAccountKey } from "./accountKey";

describe("accountKey", () => {
  it("composes the address and the view key with a dot", () => {
    expect(composeAccountKey({ address, viewKey })).toBe(`${address}.${viewKey}`);
  });

  it("keeps the address alone without a view key", () => {
    expect(composeAccountKey({ address })).toBe(address);
  });

  it("splits back what it composes", () => {
    expect(splitAccountKey(composeAccountKey({ address, viewKey }))).toEqual({ address, viewKey });
    expect(splitAccountKey(address)).toEqual({ address });
  });
});
