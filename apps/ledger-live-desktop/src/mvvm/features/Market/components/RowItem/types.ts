import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";

export type MarketActionType = "buy" | "swap" | "stake" | "sell";

export type MarketAction = {
  type: MarketActionType;
  label: string;
  onClick: (e: React.SyntheticEvent<HTMLButtonElement>) => void;
};

export type RowItemContainerProps = {
  currency: MarketCurrencyData;
  counterCurrency?: string;
  style: React.CSSProperties;
  locale: string;
  isStarred: boolean;
  toggleStar: () => void;
  range?: string;
};

export type RowItemViewProps = {
  style: React.CSSProperties;
  currency: MarketCurrencyData;
  counterCurrency?: string;
  locale: string;
  isStarred: boolean;
  hasActions: boolean;
  actions: MarketAction[];
  currentPriceChangePercentage: number | undefined;
  onCurrencyClick: () => void;
  onStarClick: (e: React.MouseEvent<HTMLDivElement>) => void;
};
