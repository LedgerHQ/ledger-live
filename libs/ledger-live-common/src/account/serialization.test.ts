import { getCryptoCurrencyById, setSupportedCurrencies } from "../currencies";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { toAccountRaw, fromAccountRaw } from "./serialization";
import { setWalletAPIVersion } from "../wallet-api/version";
import { WALLET_API_VERSION } from "../wallet-api/constants";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import solanaSplTokenData from "../__fixtures__/solana-spl-epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v.json";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies(["solana"]);
const Solana = getCryptoCurrencyById("solana");

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const USDC = solanaSplTokenData as TokenCurrency;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStoreForCoinFramework({
  findTokenById: async (id: string) => {
    if (id === "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v") {
      return USDC;
    }

    return undefined;
  },
  findTokenByAddressInCurrency: async (_: string, __: string) => undefined,
  getTokensSyncHash: async (_: string) => "0",
} as unknown as CryptoAssetsStore);

describe("serialization", () => {
  test("TokenAccount extra fields should be serialized/deserialized", async () => {
    const acc: any = genAccount("mocked-account-1", { currency: Solana });
    const tokenAcc: any = genTokenAccount(1, acc, USDC);
    tokenAcc.state = "initialized";
    acc.subAccounts = [tokenAcc];

    const accRaw: any = toAccountRaw(acc);
    expect(accRaw.subAccounts?.[0]?.state).toBe("initialized");

    const deserializedAcc: any = await fromAccountRaw(accRaw);
    expect(deserializedAcc.subAccounts?.[0]?.state).toBe("initialized");
  });
});
