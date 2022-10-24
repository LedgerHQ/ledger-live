import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { DelegationType } from "../../../../types";
import type { DrawerPropsType } from "../Drawer/types";

export interface UnbondingsPropsType {
  account: ElrondAccount;
  delegations: DelegationType[];
  onDrawer: (props: DrawerPropsType["data"] | false) => void;
}
