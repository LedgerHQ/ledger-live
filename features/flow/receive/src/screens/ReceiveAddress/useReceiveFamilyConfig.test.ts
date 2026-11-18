import { renderHook } from "@testing-library/react";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountStatus } from "@domain/entity-account-status/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { DEFAULT_RECEIVE_FAMILY_CONFIG } from "../../logic/resolveReceiveFamilyConfig";
import { useReceiveFamilyConfig } from "./useReceiveFamilyConfig";

const descriptor = mockAddressAccountDescriptor();
const asset = {
  id: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
  type: "CryptoCurrency" as const,
};

describe("useReceiveFamilyConfig", () => {
  it("should use the defaults when the app gives no family config", () => {
    const { result } = renderHook(() =>
      useReceiveFamilyConfig({
        getFamilyConfig: undefined,
        descriptor,
        asset,
        receive: undefined,
        accountStatus: undefined,
      }),
    );

    expect(result.current).toEqual(DEFAULT_RECEIVE_FAMILY_CONFIG);
  });

  it("should use the defaults until the account and the asset are known", () => {
    const getFamilyConfig = jest.fn(() => ({ notices: ["utxo" as const] }));
    const { result } = renderHook(() =>
      useReceiveFamilyConfig({
        getFamilyConfig,
        descriptor: undefined,
        asset,
        receive: undefined,
        accountStatus: undefined,
      }),
    );

    expect(result.current).toEqual(DEFAULT_RECEIVE_FAMILY_CONFIG);
    expect(getFamilyConfig).not.toHaveBeenCalled();
  });

  it("should merge the family config over the defaults with the account data read so far", () => {
    const accountStatus = mockAccountStatus({ used: false });
    const getFamilyConfig = jest.fn(() => ({ notices: ["tronInactiveAccount" as const] }));
    const { result } = renderHook(() =>
      useReceiveFamilyConfig({
        getFamilyConfig,
        descriptor,
        asset,
        receive: undefined,
        accountStatus,
      }),
    );

    expect(result.current).toEqual({
      ...DEFAULT_RECEIVE_FAMILY_CONFIG,
      notices: ["tronInactiveAccount"],
    });
    expect(getFamilyConfig).toHaveBeenCalledWith({
      descriptor,
      asset,
      receive: undefined,
      accountStatus,
    });
  });
});
