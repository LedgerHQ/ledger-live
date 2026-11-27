import { CryptoOrTokenCurrencyIdSchema, type CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { ReceiveFamilyConfigInput } from "./types";

type MockReceiveFamilyConfigInputOverrides<A> = Partial<
  Omit<ReceiveFamilyConfigInput<A>, "asset">
> & {
  asset?: Readonly<{ id: string; type?: CryptoOrTokenCurrency["type"] }>;
};

export function mockReceiveFamilyConfigInput<A = unknown>({
  asset,
  ...overrides
}: MockReceiveFamilyConfigInputOverrides<A> = {}): ReceiveFamilyConfigInput<A> {
  return {
    featureFlags: {},
    ...overrides,
    asset: {
      id: CryptoOrTokenCurrencyIdSchema.parse(asset?.id ?? "bitcoin"),
      type: asset?.type ?? "CryptoCurrency",
    },
  };
}
