import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";

export type MarketRowItemContainerProps = {
  currency?: MarketCurrencyData | null;
  counterCurrency?: string;
  style: React.CSSProperties;
  loading: boolean;
  locale: string;
  isStarred: boolean;
  toggleStar: () => void;
  range?: string;
};

export type MarketRowItemViewProps = {
  style: React.CSSProperties;
  loading: boolean;
  currency?: MarketCurrencyData | null;
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
