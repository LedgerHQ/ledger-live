import { DerivationPathSchema, NetworkIdSchema } from "@domain/entity-account-descriptor";
import { CryptoOrTokenCurrencyIdSchema, type CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { ReceiveFamilyConfigInput } from "./types";

type MockReceiveFamilyConfigInputOverrides<A> = Partial<
  Omit<ReceiveFamilyConfigInput<A>, "asset" | "account">
> & {
  asset?: Readonly<{ id: string; type?: CryptoOrTokenCurrency["type"] }>;
  account?: Readonly<{ network?: string; path?: string }>;
};

/** A native segwit bitcoin account by default. */
export function mockReceiveFamilyConfigInput<A = unknown>({
  asset,
  account,
  ...overrides
}: MockReceiveFamilyConfigInputOverrides<A> = {}): ReceiveFamilyConfigInput<A> {
  return {
    featureFlags: {},
    ...overrides,
    account: {
      network: NetworkIdSchema.parse(account?.network ?? "bitcoin"),
      path: DerivationPathSchema.parse(account?.path ?? "m/84h/0h/0h"),
    },
    asset: {
      id: CryptoOrTokenCurrencyIdSchema.parse(asset?.id ?? "bitcoin"),
      type: asset?.type ?? "CryptoCurrency",
    },
  };
}
