import type { PayCardInternalWallet, PayCardLinkedWallet } from "@domain/api-card-management";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CardLinkedWalletBalance, CardLinkedWallets } from "../types";

export type CombineCardLinkedWalletsParams = Readonly<{
  linked: readonly PayCardLinkedWallet[];
  internal: readonly PayCardInternalWallet[];
  currencies: ReadonlyMap<string, CryptoOrTokenCurrency>;
}>;

export function combineCardLinkedWallets({
  linked,
  internal,
  currencies,
}: CombineCardLinkedWalletsParams): CardLinkedWallets {
  const internalById = new Map(internal.map(wallet => [wallet.id, wallet]));

  const wallets: CardLinkedWalletBalance[] = linked
    // `linked` is the cache entry: never sort it in place.
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map(({ id, address, currency, network, priority, ledgerId }) => {
      const ledgerCurrency = ledgerId === undefined ? undefined : currencies.get(ledgerId);
      const internalWallet = internalById.get(id);

      return {
        id,
        ...(internalWallet?.addressId === undefined ? {} : { addressId: internalWallet.addressId }),
        address,
        currency,
        network,
        priority,
        // Left off rather than held as `undefined`: an unmapped asset has no `ledgerId` at all.
        ...(ledgerId === undefined ? {} : { ledgerId }),
        ...(ledgerCurrency === undefined ? {} : { ledgerCurrency }),
        balance: internalWallet?.balance ?? null,
      };
    });

  return { wallets };
}
