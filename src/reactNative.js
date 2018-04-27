// @flow
import * as icons from "./data/icons/reactNative";
import type { CryptoCurrency } from "./types";
import iconNameById from "./iconNameById";

type Icon = React$ComponentType<{ size: number, color: string }>;

export function getCryptoCurrencyIcon(currency: CryptoCurrency): ?Icon {
  return icons[iconNameById(currency.id)];
}
