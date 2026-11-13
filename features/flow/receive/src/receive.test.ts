import { getReceivePackageName } from "./receive";

describe("getReceivePackageName", () => {
  it("returns the package name", () => {
    expect(getReceivePackageName()).toBe("@features/flow-receive");
  });
});
