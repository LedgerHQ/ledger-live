import { NavigatorName, ScreenName } from "~/const";
import { countTrailingAssetAccountRoutes } from "../assetAccountChain";

const entry = { name: NavigatorName.Main };
const asset = {
  name: NavigatorName.AssetDetail,
  state: { index: 0, routes: [{ name: ScreenName.AssetDetail }] },
};
const account = {
  name: NavigatorName.Accounts,
  state: {
    index: 0,
    routes: [
      {
        name: ScreenName.Account,
        state: { index: 0, routes: [{ name: ScreenName.AccountDetail }] },
      },
    ],
  },
};

describe("countTrailingAssetAccountRoutes", () => {
  it("returns 0 when the focused route is not an asset or account page", () => {
    expect(countTrailingAssetAccountRoutes({ index: 0, routes: [entry] })).toBe(0);
  });

  it("counts the asset and account pages stacked on top of the entry point", () => {
    const routes = [entry, asset, account, asset];
    expect(countTrailingAssetAccountRoutes({ index: 3, routes })).toBe(3);
  });

  it("stops at the first route that is neither an asset nor an account page", () => {
    const routes = [asset, entry, account, asset];
    expect(countTrailingAssetAccountRoutes({ index: 3, routes })).toBe(2);
  });

  it("counts an account opened at the root of the stack", () => {
    const routes = [entry, asset, { name: ScreenName.Account }];
    expect(countTrailingAssetAccountRoutes({ index: 2, routes })).toBe(2);
  });

  it("counts an accounts stack whose focused screen is not an account as the entry point", () => {
    const accountsList = {
      name: NavigatorName.Accounts,
      state: { index: 0, routes: [{ name: ScreenName.Accounts }] },
    };
    expect(countTrailingAssetAccountRoutes({ index: 1, routes: [accountsList, asset] })).toBe(1);
  });

  it("counts from the focused route", () => {
    const routes = [entry, asset, account];
    expect(countTrailingAssetAccountRoutes({ index: 0, routes })).toBe(0);
  });
});
