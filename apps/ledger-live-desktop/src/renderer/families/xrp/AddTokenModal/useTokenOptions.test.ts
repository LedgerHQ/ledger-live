import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { filterTokenOptions } from "./useTokenOptions";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: jest.fn(),
}));
const mockGetXrpEnabledTokenStandards = jest.mocked(getXrpEnabledTokenStandards);

const makeToken = (id: string, tokenType: string, parentCurrencyId = "ripple_testnet") =>
  ({ id, tokenType, parentCurrencyId }) as TokenCurrency;

const rlusd = makeToken("ripple_testnet/iou/rlusd", "iou");
const usdc = makeToken("ripple_testnet/iou/usdc", "iou");
const mpt = makeToken("ripple_testnet/mpt/test", "mpt");
const mainnetToken = makeToken("ripple/iou/rlusd", "iou", "ripple");

const makeAccount = (subAccounts: Account["subAccounts"] = []) =>
  ({ currency: { id: "ripple_testnet" }, subAccounts }) as Account;

describe("filterTokenOptions", () => {
  beforeEach(() => {
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou", "mpt"]);
  });

  it("keeps only the tokens of the account's network", () => {
    expect(filterTokenOptions([rlusd, mainnetToken], makeAccount())).toEqual([rlusd]);
  });

  it("keeps only the tokens whose standard is enabled", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou"]);

    expect(filterTokenOptions([rlusd, mpt], makeAccount())).toEqual([rlusd]);
  });

  it("lists nothing when no standard is enabled", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);

    expect(filterTokenOptions([rlusd, mpt], makeAccount())).toEqual([]);
  });

  it("drops a held token but lists a removed one again", () => {
    const account = makeAccount([
      { token: rlusd, xrpResources: { isLocked: false } },
      { token: usdc },
    ] as unknown as Account["subAccounts"]);

    expect(filterTokenOptions([rlusd, usdc], account)).toEqual([usdc]);
  });
});
