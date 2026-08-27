import type { CardProps as PayCardProps } from "@features/flow-pay-card";
import type { FormattedValue } from "@features/flow-pay-card-details";

export interface CardViewModel {
  readonly title: string;
  readonly formatCountervalue: (value: number) => FormattedValue;
  readonly balanceLabel: string;
  readonly oauthConfig: PayCardProps["oauthConfig"];
}
