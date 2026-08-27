import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { deriveRequestReceiveData } from "../deriveRequestReceiveData";

const ethereum = getCryptoCurrencyById("ethereum");

const usdc = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  parentCurrencyId: ethereum.id,
  contractAddress: "0x0000000000000000000000000000000000000000",
  tokenType: "erc20",
  ticker: "USDC",
  name: "USD Coin",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
});

describe("deriveRequestReceiveData", () => {
  it("should map a native account to matching asset and network primitives", () => {
    const account = genAccount("pay-request-native", { currency: ethereum });

    expect(deriveRequestReceiveData(account, ethereum)).toEqual({
      address: account.freshAddress,
      asset: { name: "Ethereum", ticker: "ETH" },
      network: "Ethereum",
      assetIcon: { ledgerId: "ethereum", ticker: "ETH", network: "ethereum" },
      networkIcon: { ledgerId: "ethereum", ticker: "ETH" },
    });
  });

  it("should keep token copy when the looked-up account is the parent", () => {
    const parentAccount = genAccount("pay-request-parent-only", { currency: ethereum });

    expect(deriveRequestReceiveData(parentAccount, usdc)).toEqual({
      address: parentAccount.freshAddress,
      asset: { name: "USD Coin", ticker: "USDC" },
      network: "Ethereum",
      assetIcon: {
        ledgerId: "ethereum/erc20/usd__coin",
        ticker: "USDC",
        network: "ethereum",
      },
      networkIcon: { ledgerId: "ethereum", ticker: "ETH" },
    });
  });

  it("should use the canton party id when freshAddress is empty", () => {
    const canton = getCryptoCurrencyById("canton_network");
    const account = {
      ...genAccount("pay-request-canton", { currency: canton }),
      derivationMode: "canton" as const,
      freshAddress: "",
      xpub: "canton-party-id",
    };

    expect(deriveRequestReceiveData(account, canton).address).toBe("canton-party-id");
  });
});
