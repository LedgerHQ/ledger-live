import { renderHook } from "@testing-library/react";
import { useNftGallerySelector } from "../useNftGallerySelector";
import { Account } from "@ledgerhq/types-live";

describe("useNftGallerySelector", () => {
  const mockAccounts = [
    { freshAddress: "address1", currency: { id: "ethereum" } } as Account,
    { freshAddress: "address2", currency: { id: "polygon" } } as Account,
    { freshAddress: "address3", currency: { id: "solana" } } as Account,
    { freshAddress: "address4", currency: { id: "ethereum" } } as Account,
  ];

  const supportedCurrencies = ["ethereum", "polygon", "solana"];

  it("should return the correct addresses and chains when all currencies are supported", () => {
    const config = { featureFlagEnabled: true };

    const { result } = renderHook(() =>
      useNftGallerySelector({
        accounts: mockAccounts,
        supportedCurrencies,
        config,
      }),
    );

    expect(result.current.addresses).toBe("address1,address2,address3,address4");
    expect(result.current.chains).toEqual(["ethereum", "polygon", "solana"]);
  });

  it("should exclude Solana addresses if featureFlagEnabled is false", () => {
    const config = { featureFlagEnabled: false };

    const { result } = renderHook(() =>
      useNftGallerySelector({
        accounts: mockAccounts,
        supportedCurrencies,
        config,
      }),
    );

    expect(result.current.addresses).toBe("address1,address2,address4");
    expect(result.current.chains).toEqual(["ethereum", "polygon"]);
  });

  it("should return only supported currencies", () => {
    const config = { featureFlagEnabled: true };

    const { result } = renderHook(() =>
      useNftGallerySelector({
        accounts: mockAccounts,
        supportedCurrencies: ["ethereum", "polygon"],
        config,
      }),
    );

    expect(result.current.addresses).toBe("address1,address2,address4");
    expect(result.current.chains).toEqual(["ethereum", "polygon"]);
  });

  it("should handle empty accounts array", () => {
    const config = { featureFlagEnabled: true };

    const { result } = renderHook(() =>
      useNftGallerySelector({
        accounts: [],
        supportedCurrencies,
        config,
      }),
    );

    expect(result.current.addresses).toBe("");
    expect(result.current.chains).toEqual([]);
  });

  it("should return addresses and chains based on the correct feature flag", () => {
    const config = { featureFlagEnabled: true };

    const { result } = renderHook(() =>
      useNftGallerySelector({
        accounts: mockAccounts,
        supportedCurrencies: ["solana", "ethereum"],
        config,
      }),
    );

    expect(result.current.addresses).toBe("address1,address3,address4");
    expect(result.current.chains).toEqual(["ethereum", "solana"]);
  });

  it("should exclude unsupported currencies", () => {
    const config = { featureFlagEnabled: false };

    const { result } = renderHook(() =>
      useNftGallerySelector({
        accounts: mockAccounts,
        supportedCurrencies: ["ethereum"],
        config,
      }),
    );

    expect(result.current.addresses).toBe("address1,address4");
    expect(result.current.chains).toEqual(["ethereum"]);
  });
});
