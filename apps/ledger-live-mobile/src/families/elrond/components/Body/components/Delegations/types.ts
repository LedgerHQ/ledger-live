import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { DelegationType } from "../../../../types";
import type { DrawerPropsType } from "../Drawer/types";

export interface DelegationsPropsType {
  onDrawer: (data: DrawerPropsType["data"] | false) => void;
  delegations: DelegationType[];
  validators: ValidatorType[];
  account: ElrondAccount;
}
