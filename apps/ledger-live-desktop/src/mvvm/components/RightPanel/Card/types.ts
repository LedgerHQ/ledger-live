import type { CardFormatters, CardProps as PayCardProps } from "@features/flow-pay-card";

export interface CardViewModel {
  readonly formatters: Required<CardFormatters>;
  readonly assets: PayCardProps["assets"];
  readonly login: PayCardProps["login"];
  readonly onShowMore: () => void;
}
