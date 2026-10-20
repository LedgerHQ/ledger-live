import { recoverV2 } from "./recoverV2";

describe("recoverV2", () => {
  it("defaults to disabled", () => {
    expect(recoverV2.parse(undefined)).toEqual({ enabled: false });
  });

  it("keeps a boolean enabled value", () => {
    expect(recoverV2.parse({ enabled: true })).toEqual({ enabled: true });
    expect(recoverV2.parse({ enabled: false })).toEqual({ enabled: false });
  });
});
