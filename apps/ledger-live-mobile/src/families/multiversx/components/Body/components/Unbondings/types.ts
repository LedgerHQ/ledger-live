import type { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import type { DelegationType } from "../../../../types";
import type { DrawerPropsType } from "../Drawer/types";

export interface UnbondingsPropsType {
  account: MultiversXAccount;
  delegations: DelegationType[];
  onDrawer: (props: DrawerPropsType["data"] | false) => void;
}
