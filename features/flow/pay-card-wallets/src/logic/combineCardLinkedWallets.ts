import type { PayCardInternalWallet, PayCardLinkedWallet } from "@domain/api-card-management";
import type {
  CardLinkedWalletBalance,
  CardLinkedWallets,
  ResolveWalletCounterValue,
} from "../types";

export type CombineCardLinkedWalletsParams = Readonly<{
  linked: readonly PayCardLinkedWallet[];
  internal: readonly PayCardInternalWallet[];
  resolveCounterValue: ResolveWalletCounterValue;
}>;

export function combineCardLinkedWallets({
  linked,
  internal,
  resolveCounterValue,
}: CombineCardLinkedWalletsParams): CardLinkedWallets {
  const balanceById = new Map(internal.map(wallet => [wallet.id, wallet.balance]));

  const counterValueFor = (ledgerId: string | undefined, balance: string | null): number | null => {
    // An unmapped asset and an unread balance are both "nothing to price", not "worth zero".
    if (ledgerId === undefined || balance === null) return null;

    const resolved = resolveCounterValue(ledgerId, balance);
    return resolved === null || !Number.isFinite(resolved) ? null : resolved;
  };

  const wallets: CardLinkedWalletBalance[] = linked
    // `linked` is the cache entry: never sort it in place.
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map(({ id, address, currency, network, priority, ledgerId }) => {
      const balance = balanceById.get(id) ?? null;

      return {
        id,
        address,
        currency,
        network,
        priority,
        ledgerId,
        balance,
        counterValue: counterValueFor(ledgerId, balance),
      };
    });

  const total = wallets.reduce((sum, { counterValue }) => sum + (counterValue ?? 0), 0);

  return {
    wallets,
    total,
    isPartialTotal: wallets.some(({ counterValue }) => counterValue === null),
  };
}
