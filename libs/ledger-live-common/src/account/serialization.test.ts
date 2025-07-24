import { getCryptoCurrencyById, getTokenById, setSupportedCurrencies } from "../currencies";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { toAccountRaw, fromAccountRaw } from "./serialization";
import { setWalletAPIVersion } from "../wallet-api/version";
import { WALLET_API_VERSION } from "../wallet-api/constants";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { CryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/type";
import solanaSplTokenData from "../__fixtures__/solana-spl-epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v.json";

setWalletAPIVersion(WALLET_API_VERSION);

setSupportedCurrencies(["solana"]);
const Solana = getCryptoCurrencyById("solana");
const USDC = getTokenById("solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v");

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStoreForCoinFramework({
  findTokenById: (id: string) => {
    if (id === "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v") {
      return solanaSplTokenData;
    }

    return undefined;
  },
  findTokenByAddressInCurrency: (_: string, __: string) => undefined,
} as unknown as CryptoAssetsStore);

describe("serialization", () => {
  test("TokenAccount extra fields should be serialized/deserialized", () => {
    const acc: any = genAccount("mocked-account-1", { currency: Solana });
    const tokenAcc: any = genTokenAccount(1, acc, USDC);
    tokenAcc.state = "initialized";
    acc.subAccounts = [tokenAcc];

    const accRaw: any = toAccountRaw(acc);
    expect(accRaw.subAccounts?.[0]?.state).toBe("initialized");

    const deserializedAcc: any = fromAccountRaw(accRaw);
    expect(deserializedAcc.subAccounts?.[0]?.state).toBe("initialized");
  });
});
