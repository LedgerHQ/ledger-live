import {
  buildMainAccountByIdMap,
  lookupParentAccountFromMap,
} from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { ETH_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import { getCryptoAccountAddress } from "../getCryptoAccountAddress";

describe("getCryptoAccountAddress", () => {
  it("returns the account fresh address for Account rows", () => {
    expect(getCryptoAccountAddress(ETH_ACCOUNT, jest.fn())).toBe(ETH_ACCOUNT.freshAddress);
  });

  it("returns the parent account fresh address for TokenAccount rows", () => {
    const parent = ETH_ACCOUNT_WITH_USDC;
    const token = parent.subAccounts![0];
    const mainById = buildMainAccountByIdMap([parent]);
    const lookup = jest.fn((id: string) => lookupParentAccountFromMap(mainById, id));

    expect(getCryptoAccountAddress(token, lookup)).toBe(parent.freshAddress);
    expect(lookup).toHaveBeenCalledWith(token.parentId);
  });
});
