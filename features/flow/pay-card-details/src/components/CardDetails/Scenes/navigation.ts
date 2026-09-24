import { useState } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import type { CardTransactionItem } from "@features/flow-pay-card-transactions";

export type CardDetailsRoute =
  | { name: "overview" }
  | { name: "freeze" }
  | { name: "more" }
  | { name: "addToWallet" }
  | { name: "transaction"; transaction: PayCardTransaction }
  | { name: "assetDetails"; asset: CardAssetRow }
  | { name: "assetWithdraw"; asset: CardAssetRow }
  | { name: "assetsManage" }
  | { name: "assetTransaction"; transaction: CardTransactionItem };

export type CardDetailsNavigation = Readonly<{
  route: CardDetailsRoute;
  goTo: (route: CardDetailsRoute) => void;
  goBack: () => void;
  reset: () => void;
}>;

const OVERVIEW: CardDetailsRoute = { name: "overview" };

export function useCardDetailsNavigation(): CardDetailsNavigation {
  const [stack, setStack] = useState<readonly CardDetailsRoute[]>([OVERVIEW]);
  const route = stack[stack.length - 1] ?? OVERVIEW;

  const goTo = (next: CardDetailsRoute) => setStack(current => [...current, next]);
  const goBack = () => setStack(current => (current.length > 1 ? current.slice(0, -1) : current));
  const reset = () => setStack([OVERVIEW]);

  return { route, goTo, goBack, reset };
}
