import { useState } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";

export type CardDetailsRoute =
  | { name: "overview" }
  | { name: "freeze" }
  | { name: "more" }
  | { name: "addToWallet" }
  | { name: "transaction"; transaction: PayCardTransaction }
  | { name: "assetDetails" }
  | { name: "assetWithdraw" };

export type CardDetailsNavigation = Readonly<{
  route: CardDetailsRoute;
  goTo: (route: CardDetailsRoute) => void;
  goBack: () => void;
}>;

const OVERVIEW: CardDetailsRoute = { name: "overview" };

export function useCardDetailsNavigation(): CardDetailsNavigation {
  const [route, setRoute] = useState<CardDetailsRoute>(OVERVIEW);

  const goTo = (next: CardDetailsRoute) => setRoute(next);
  const goBack = () => setRoute(OVERVIEW);

  return { route, goTo, goBack };
}
