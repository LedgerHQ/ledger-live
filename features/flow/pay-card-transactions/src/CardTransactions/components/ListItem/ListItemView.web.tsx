import React from "react";
import {
  ListItem as LumenListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import {
  Airplane,
  Atm,
  CalendarRefresh,
  Cutlery,
  GameControler,
  Heart,
  Home,
  Coins,
} from "@ledgerhq/lumen-ui-react/symbols";
import type { PayCardTransactionCategory } from "@domain/api-card-management";
import type { ListItemViewProps } from "./types";

// colors are not in the design system
const CATEGORY_VISUALS = {
  SUBSCRIPTIONS: {
    icon: CalendarRefresh,
    backgroundClassName: "bg-[#a65332] dark:bg-[#f2b79c]",
  },
  FOOD: { icon: Cutlery, backgroundClassName: "bg-[#4f7f3e] dark:bg-[#aed29d]" },
  TRAVEL: { icon: Airplane, backgroundClassName: "bg-[#4f7f3e] dark:bg-[#aed29d]" },
  ENTERTAINMENT: {
    icon: GameControler,
    backgroundClassName: "bg-[#a65332] dark:bg-[#f2b79c]",
  },
  HEALTH: { icon: Heart, backgroundClassName: "bg-[#75427d] dark:bg-[#d4a7db]" },
  ATM: { icon: Atm, backgroundClassName: "bg-[#75427d] dark:bg-[#d4a7db]" },
  UTILITIES: { icon: Home, backgroundClassName: "bg-[#a23f4d] dark:bg-[#efa5ab]" },
  MISC: { icon: Coins, backgroundClassName: "bg-[#a8502d] dark:bg-[#edae8e]" },
} satisfies Record<PayCardTransactionCategory, { icon: typeof Coins; backgroundClassName: string }>;

export function ListItemView({
  id,
  merchant,
  category,
  categoryLabel,
  fiatAmount,
  assetAmount,
  dateLabel,
}: ListItemViewProps) {
  const { icon: CategoryIcon, backgroundClassName } = CATEGORY_VISUALS[category];

  return (
    <LumenListItem className="px-0" data-testid={`card-transactions-item-${id}`}>
      <ListItemLeading>
        <div
          className={`flex size-48 shrink-0 items-center justify-center rounded-full text-white dark:text-black ${backgroundClassName}`}
        >
          <CategoryIcon aria-hidden size={24} />
          <span className="sr-only">{categoryLabel}</span>
        </div>
        <ListItemContent>
          <ListItemTitle>{merchant}</ListItemTitle>
          <ListItemDescription>{dateLabel}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          <ListItemTitle>{fiatAmount}</ListItemTitle>
          {assetAmount ? <ListItemDescription>{assetAmount}</ListItemDescription> : null}
        </ListItemContent>
      </ListItemTrailing>
    </LumenListItem>
  );
}
