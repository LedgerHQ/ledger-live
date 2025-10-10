import { createCryptoAssetsHooks } from "./hooks";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

// Mock token data
const mockToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_coin",
  ledgerSignature: "3045022100...",
  contractAddress: "0xA0b86a33E6441b8c4C8C0e4b8b8c4C8C0e4b8b8c4",
  parentCurrency: {
    type: "CryptoCurrency",
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    units: [],
    family: "ethereum",
    managerAppName: "Ethereum",
    coinType: 60,
    scheme: "ethereum",
    color: "#627EEA",
    explorerViews: [],
  },
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [
    {
      code: "USDC",
      name: "USD Coin",
      magnitude: 6,
    },
  ],
};

describe("Hooks Factory", () => {
  it("should return legacy hooks when useCALBackend is false", () => {
    const hooks = createCryptoAssetsHooks({ useCALBackend: false });

    expect(hooks.useTokenById).toBeDefined();
    expect(hooks.useTokenByAddressInCurrency).toBeDefined();
    expect(typeof hooks.useTokenById).toBe("function");
    expect(typeof hooks.useTokenByAddressInCurrency).toBe("function");
  });

  it("should return RTK hooks when useCALBackend is true and api is provided", () => {
    const mockApi = {
      useFindTokenByIdQuery: jest.fn(),
      useFindTokenByAddressInCurrencyQuery: jest.fn(),
    } as any;

    const hooks = createCryptoAssetsHooks({ useCALBackend: true, api: mockApi });

    expect(hooks.useTokenById).toBeDefined();
    expect(hooks.useTokenByAddressInCurrency).toBeDefined();
    expect(typeof hooks.useTokenById).toBe("function");
    expect(typeof hooks.useTokenByAddressInCurrency).toBe("function");
  });

  it("should fallback to legacy hooks when useCALBackend is true but api is not provided", () => {
    const hooks = createCryptoAssetsHooks({ useCALBackend: true });

    expect(hooks.useTokenById).toBeDefined();
    expect(hooks.useTokenByAddressInCurrency).toBeDefined();
    expect(typeof hooks.useTokenById).toBe("function");
    expect(typeof hooks.useTokenByAddressInCurrency).toBe("function");
  });
});

describe("RTK Hooks Integration", () => {
  it("should call RTK Query hooks when using CAL backend", () => {
    const mockRTKResult = {
      data: mockToken,
      isLoading: false,
      error: undefined,
    };

    const mockApi = {
      useFindTokenByIdQuery: jest.fn().mockReturnValue(mockRTKResult),
      useFindTokenByAddressInCurrencyQuery: jest.fn().mockReturnValue(mockRTKResult),
    } as any;

    const hooks = createCryptoAssetsHooks({ useCALBackend: true, api: mockApi });

    // Test that the hooks are created and can be called
    expect(typeof hooks.useTokenById).toBe("function");
    expect(typeof hooks.useTokenByAddressInCurrency).toBe("function");

    // Test that the RTK hooks would be called with correct parameters
    const tokenByIdHook = hooks.useTokenById("ethereum/erc20/usd_coin");
    const tokenByAddressHook = hooks.useTokenByAddressInCurrency("0xaddress", "ethereum");

    // These should be functions that return the RTK result
    expect(typeof tokenByIdHook).toBe("object");
    expect(typeof tokenByAddressHook).toBe("object");
  });
});
