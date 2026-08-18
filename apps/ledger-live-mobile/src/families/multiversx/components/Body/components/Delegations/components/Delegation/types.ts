import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { DelegationType } from "../../../../../../types";
import type { DrawerPropsType } from "../../../Drawer/types";

export interface DelegationPropsType extends DelegationType {
  last: boolean;
  currency: CryptoCurrency | TokenCurrency;
  onDrawer: (data: DrawerPropsType["data"] | false) => void;
}
