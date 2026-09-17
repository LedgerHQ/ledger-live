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

  const counterValueFor = (
    wallet: Readonly<{ currency: string; network: string; ledgerId?: string }>,
    balance: string,
  ): number | null => {
    const resolved = resolveCounterValue(wallet, balance);
    return resolved === null || !Number.isFinite(resolved) ? null : resolved;
  };

  const wallets: CardLinkedWalletBalance[] = linked
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map(({ id, address, currency, network, priority, ledgerId }) => {
      const balance = balanceById.get(id) ?? null;
      const priced =
        ledgerId === undefined ? { currency, network } : { currency, network, ledgerId };

      return {
        id,
        address,
        currency,
        network,
        priority,
        ...(ledgerId === undefined ? {} : { ledgerId }),
        balance,
        counterValue: balance === null ? null : counterValueFor(priced, balance),
      };
    });

  const total = wallets.reduce((sum, { counterValue }) => sum + (counterValue ?? 0), 0);

  return {
    wallets,
    total,
    isPartialTotal: wallets.some(({ counterValue }) => counterValue === null),
  };
}
