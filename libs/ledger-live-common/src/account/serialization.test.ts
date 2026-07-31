import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { toAccountRaw, fromAccountRaw } from "./serialization";
import { setWalletAPIVersion } from "../wallet-api/version";
import { WALLET_API_VERSION } from "../wallet-api/constants";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import solanaSplTokenData from "../__fixtures__/solana-spl-epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v.json";
import { TokenCurrency } from "@domain/entity-currency-token";

setWalletAPIVersion(WALLET_API_VERSION);

const Solana = getCryptoCurrencyById("solana");

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const USDC = solanaSplTokenData as TokenCurrency;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStore({
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

    const accRaw: any = await toAccountRaw(acc);
    expect(accRaw.subAccounts?.[0]?.state).toBe("initialized");

    const deserializedAcc: any = await fromAccountRaw(accRaw);
    expect(deserializedAcc.subAccounts?.[0]?.state).toBe("initialized");
  });

  test("account readiness should be serialized/deserialized", async () => {
    const acc: any = genAccount("mocked-account-readiness", { currency: Solana });
    acc.readiness = { ready: false, reason: "unrevealed" };

    const accRaw: any = await toAccountRaw(acc);
    expect(accRaw.readiness).toEqual({ ready: false, reason: "unrevealed" });

    const deserializedAcc: any = await fromAccountRaw(accRaw);
    expect(deserializedAcc.readiness).toEqual({ ready: false, reason: "unrevealed" });
  });

  test("account without readiness stays undefined through serialization", async () => {
    const acc: any = genAccount("mocked-account-no-readiness", { currency: Solana });
    delete acc.readiness;

    const accRaw: any = await toAccountRaw(acc);
    expect(accRaw.readiness).toBeUndefined();

    const deserializedAcc: any = await fromAccountRaw(accRaw);
    expect(deserializedAcc.readiness).toBeUndefined();
  });
});
