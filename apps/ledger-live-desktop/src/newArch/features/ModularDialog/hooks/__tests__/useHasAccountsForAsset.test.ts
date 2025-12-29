import { renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { ETH_ACCOUNT } from "../../../__mocks__/accounts.mock";
import { ethereumCurrency } from "../../../__mocks__/useSelectAssetFlow.mock";
import { useHasAccountsForAsset } from "../useHasAccountsForAsset";

describe("useHasAccountsForAsset", () => {
  it("should return true when asset is undefined", () => {
    const { result } = renderHook(() => useHasAccountsForAsset(undefined), {
      ...INITIAL_STATE,
      initialState: {
        accounts: [],
      },
    });

    expect(result.current).toBe(true);
  });

  it("should return true when there are accounts for the asset", () => {
    const { result } = renderHook(() => useHasAccountsForAsset(ethereumCurrency), {
      ...INITIAL_STATE,
      initialState: {
        accounts: [ETH_ACCOUNT],
      },
    });

    expect(result.current).toBe(true);
  });

  it("should return false when there are no accounts for the asset", () => {
    const { result } = renderHook(() => useHasAccountsForAsset(ethereumCurrency), {
      ...INITIAL_STATE,
      initialState: {
        accounts: [],
      },
    });

    expect(result.current).toBe(false);
  });
});
