import type { MultiversxAccount } from "@ledgerhq/live-common/families/Multiversx/types";
import type { DelegationType } from "../../../../types";
import type { DrawerPropsType } from "../Drawer/types";

export interface UnbondingsPropsType {
  account: MultiversxAccount;
  delegations: DelegationType[];
  onDrawer: (props: DrawerPropsType["data"] | false) => void;
}
