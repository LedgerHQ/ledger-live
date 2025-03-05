import type {
  MultiversXAccount,
  MultiversXProvider,
} from "@ledgerhq/live-common/families/multiversx/types";
import type { DelegationType } from "../../../../types";
import type { DrawerPropsType } from "../Drawer/types";

export interface DelegationsPropsType {
  onDrawer: (data: DrawerPropsType["data"] | false) => void;
  delegations: DelegationType[];
  validators: MultiversXProvider[];
  account: MultiversXAccount;
}
