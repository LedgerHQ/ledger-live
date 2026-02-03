import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";

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
  currentPriceChangePercentage: number | undefined;
  earnStakeLabelCoin: string;
  availableOnBuy: boolean;
  availableOnSwap: boolean;
  availableOnStake: boolean;
  buyLabel: string;
  swapLabel: string;
  onCurrencyClick: () => void;
  onStarClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onBuy: (e: React.SyntheticEvent<HTMLButtonElement>) => void;
  onSwap: (e: React.SyntheticEvent<HTMLButtonElement>) => void;
  onStake: (e: React.SyntheticEvent<HTMLButtonElement>) => void;
};
