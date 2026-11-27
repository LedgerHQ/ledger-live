import { getManageAssetsAction } from "../manageAssetsAction";

describe("getManageAssetsAction", () => {
  it("gives XRP its Manage assets action", () => {
    expect(getManageAssetsAction("xrp")).toEqual(
      expect.objectContaining({ canManage: expect.any(Function), open: expect.any(Function) }),
    );
  });

  it("gives a family without one no action", () => {
    expect(getManageAssetsAction("bitcoin")).toBeUndefined();
    expect(getManageAssetsAction("ethereum")).toBeUndefined();
  });
});
