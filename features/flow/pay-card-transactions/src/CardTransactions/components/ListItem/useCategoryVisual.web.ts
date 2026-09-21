import { useMemo, type CSSProperties } from "react";
import {
  Airplane,
  Atm,
  CalendarRefresh,
  Coins,
  Cutlery,
  GameControler,
  Heart,
  Home,
} from "@ledgerhq/lumen-ui-react/symbols";
import type { PayCardTransactionCategory } from "@domain/api-card-management";
import { CATEGORY_COLORS } from "./categoryColors";

export type CategoryVisual = Readonly<{
  Icon: typeof Coins;
  backgroundStyle: CSSProperties;
}>;

const CATEGORY_ICONS = {
  SUBSCRIPTIONS: CalendarRefresh,
  FOOD: Cutlery,
  TRAVEL: Airplane,
  ENTERTAINMENT: GameControler,
  HEALTH: Heart,
  ATM: Atm,
  UTILITIES: Home,
  MISC: Coins,
} satisfies Record<PayCardTransactionCategory, typeof Coins>;

export function useCategoryVisual(category: PayCardTransactionCategory): CategoryVisual {
  return useMemo(() => {
    const { light, dark } = CATEGORY_COLORS[category];

    return {
      Icon: CATEGORY_ICONS[category],
      backgroundStyle: { "--category-bg": light, "--category-bg-dark": dark } as CSSProperties,
    };
  }, [category]);
}
