import { getBalance } from "./getBalance";
import { fetchAccount } from "../network";
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";
import { getAssetIdFromAsset } from "./utils";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";

jest.mock("../network", () => ({
  fetchAccount: jest.fn(),
}));

jest.mock("@ledgerhq/cryptoassets/tokens", () => ({
  findTokenById: jest.fn(),
}));

jest.mock("./utils", () => ({
  getAssetIdFromAsset: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/currencies/parseCurrencyUnit", () => ({
  parseCurrencyUnit: jest.fn(),
}));

describe("getBalance", () => {
  it("returns native balance when no assets are present", async () => {
    (fetchAccount as jest.Mock).mockResolvedValue({
      balance: 100000000,
      spendableBalance: 99999990,
      assets: [],
    });

    const result = await getBalance("test-address");

    expect(result).toEqual([
      {
        value: BigInt(100000000),
        asset: { type: "native" },
        locked: BigInt(10),
      },
    ]);
  });

  it("returns native and asset balances when assets are present", async () => {
    (fetchAccount as jest.Mock).mockResolvedValue({
      balance: 100000000,
      spendableBalance: 99999990,
      assets: [
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "issuer-address",
          balance: "50.1234567",
        },
      ],
    });

    (getAssetIdFromAsset as jest.Mock).mockReturnValue("USDC-issuer-address");
    (findTokenById as jest.Mock).mockReturnValue({
      units: [{ code: "USDC", magnitude: 7 }],
    });
    (parseCurrencyUnit as jest.Mock).mockReturnValue({
      toString: () => "50.1234567",
    });

    const result = await getBalance("test-address");

    expect(result).toEqual([
      {
        value: BigInt(100000000),
        asset: { type: "native" },
        locked: BigInt(10),
      },
      {
        value: BigInt(50),
        asset: {
          type: "credit_alphanum4",
          assetReference: "USDC",
          assetOwner: "issuer-address",
        },
      },
    ]);

    expect(fetchAccount).toHaveBeenCalledWith("test-address");
    expect(getAssetIdFromAsset).toHaveBeenCalledWith({
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      asset_issuer: "issuer-address",
      balance: "50.1234567",
    });
    expect(findTokenById).toHaveBeenCalledWith("stellar/asset/USDC-issuer-address");
    expect(parseCurrencyUnit).toHaveBeenCalledWith({ code: "USDC", magnitude: 7 }, "50.1234567");
  });

  it("handles assets without matching tokens gracefully", async () => {
    (fetchAccount as jest.Mock).mockResolvedValue({
      balance: 100000000,
      spendableBalance: 99999990,
      assets: [
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDT",
          asset_issuer: "issuer-address",
          balance: "25.0000000",
        },
      ],
    });

    (getAssetIdFromAsset as jest.Mock).mockReturnValue("USDT-issuer-address");
    (findTokenById as jest.Mock).mockReturnValue(null);

    const result = await getBalance("test-address");

    expect(result).toEqual([
      {
        value: BigInt(100000000),
        asset: { type: "native" },
        locked: BigInt(10),
      },
      {
        value: BigInt(0),
        asset: {
          type: "credit_alphanum4",
          assetReference: "USDT",
          assetOwner: "issuer-address",
        },
      },
    ]);

    expect(fetchAccount).toHaveBeenCalledWith("test-address");
    expect(getAssetIdFromAsset).toHaveBeenCalledWith({
      asset_type: "credit_alphanum4",
      asset_code: "USDT",
      asset_issuer: "issuer-address",
      balance: "25.0000000",
    });
    expect(findTokenById).toHaveBeenCalledWith("stellar/asset/USDT-issuer-address");
  });
});
