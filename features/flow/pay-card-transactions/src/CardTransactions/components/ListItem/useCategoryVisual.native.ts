import { useMemo } from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative";
import {
  Airplane,
  Atm,
  CalendarRefresh,
  Coins,
  Cutlery,
  GameControler,
  Heart,
  Home,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PayCardTransactionCategory } from "@domain/api-card-management";
import { CATEGORY_COLORS } from "./categoryColors";

export type CategoryVisual = Readonly<{
  Icon: typeof Coins;
  backgroundColor: string;
  iconColor: "black" | "white";
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
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  return useMemo(() => {
    const { light, dark } = CATEGORY_COLORS[category];

    return {
      Icon: CATEGORY_ICONS[category],
      backgroundColor: isDark ? dark : light,
      iconColor: isDark ? "black" : "white",
    };
  }, [category, isDark]);
}
