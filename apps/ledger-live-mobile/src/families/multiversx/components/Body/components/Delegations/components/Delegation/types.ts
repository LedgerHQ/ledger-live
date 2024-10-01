import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DelegationType } from "../../../../../../types";
import type { DrawerPropsType } from "../../../Drawer/types";

export interface DelegationPropsType extends DelegationType {
  last: boolean;
  currency: CryptoCurrency | TokenCurrency;
  onDrawer: (data: DrawerPropsType["data"] | false) => void;
}
