import { renderHook } from "@testing-library/react-native";
import { useSwapLiveAppTranslateUrlParams } from "./useSwapLiveAppTranslateUrlParams";
import * as wallet from "@ledgerhq/live-common/wallet-api/converters";

import { Account } from "@ledgerhq/types-live";

describe("useSwapAppLiveTranslateUrlParams", () => {
  beforeEach(() => {
    jest
      .spyOn(wallet, "accountToWalletAPIAccount")
      .mockReturnValue({ id: "9C920317-772C-45AE-B3A9-026E3EDAD5E4" });
  });

  it("should return an empty object if no params are known", () => {
    const { result } = renderHook(() => useSwapLiveAppTranslateUrlParams({}));
    expect(result).toMatchObject({});
  });

  it("should return `fromAccount` if `defaultAccount` is present", () => {
    const { result } = renderHook(() =>
      useSwapLiveAppTranslateUrlParams({
        defaultAccount: { id: "mock:123456" } as Account,
      }),
    );
    expect(result).toMatchObject({ fromAccount: "9C920317-772C-45AE-B3A9-026E3EDAD5E4" });
  });
});
