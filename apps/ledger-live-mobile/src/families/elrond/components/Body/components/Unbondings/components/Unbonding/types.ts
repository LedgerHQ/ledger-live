import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type { ValidatorType } from "../../../../../../types";
import type { DrawerPropsType } from "../../../Drawer/types";

export interface UnbondingPropsType {
  last: boolean;
  amount: string;
  seconds: number;
  validator?: ValidatorType;
  currency: CryptoCurrency | TokenCurrency;
  onDrawer: (data: DrawerPropsType["data"] | false) => void;
}
