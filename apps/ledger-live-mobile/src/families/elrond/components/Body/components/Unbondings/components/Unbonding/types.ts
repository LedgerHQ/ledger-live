import type { MultiversxProvider } from "@ledgerhq/live-common/families/elrond/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DrawerPropsType } from "../../../Drawer/types";

export interface UnbondingPropsType {
  last: boolean;
  amount: string;
  seconds: number;
  validator?: MultiversxProvider;
  currency: CryptoCurrency | TokenCurrency;
  onDrawer: (data: DrawerPropsType["data"] | false) => void;
}
