import type { MultiversXProvider } from "@ledgerhq/live-common/families/multiversx/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DrawerPropsType } from "../../../Drawer/types";

export interface UnbondingPropsType {
  last: boolean;
  amount: string;
  seconds: number;
  validator?: MultiversXProvider;
  currency: CryptoCurrency | TokenCurrency;
  onDrawer: (data: DrawerPropsType["data"] | false) => void;
}
