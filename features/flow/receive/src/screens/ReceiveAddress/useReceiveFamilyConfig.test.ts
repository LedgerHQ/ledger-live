import { renderHook } from "@testing-library/react";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { DEFAULT_RECEIVE_FAMILY_CONFIG } from "../../logic/resolveReceiveFamilyConfig";
import { mockReceiveFamilyConfigInput } from "../../types.mock";
import { useReceiveFamilyConfig } from "./useReceiveFamilyConfig";

const account = mockReceiveFamilyConfigInput().account;
const asset = {
  id: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
  type: "CryptoCurrency" as const,
};
const getFamilyConfig = () => ({ unsupportedDeviceModelIds: [DeviceModelId.NANO_S] });

describe("useReceiveFamilyConfig", () => {
  it("should give the defaults when the family has no config", () => {
    const { result } = renderHook(() =>
      useReceiveFamilyConfig({
        getFamilyConfig: undefined,
        account: undefined,
        asset: undefined,
        receive: undefined,
        accountStatus: undefined,
      }),
    );

    expect(result.current).toBe(DEFAULT_RECEIVE_FAMILY_CONFIG);
  });

  it("should be unknown until the asset is loaded, then give the family's config", () => {
    const { result, rerender } = renderHook(
      ({ loadedAsset }: { loadedAsset?: typeof asset }) =>
        useReceiveFamilyConfig({
          getFamilyConfig,
          account,
          asset: loadedAsset,
          receive: undefined,
          accountStatus: undefined,
        }),
      { initialProps: {} },
    );

    expect(result.current).toBeUndefined();
    rerender({ loadedAsset: asset });
    expect(result.current).toEqual({
      ...DEFAULT_RECEIVE_FAMILY_CONFIG,
      unsupportedDeviceModelIds: [DeviceModelId.NANO_S],
    });
  });
});
