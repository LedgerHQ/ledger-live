import type { ListRenderItemInfo } from "react-native";
import type {
  ElrondAccount,
  ElrondProvider,
} from "@ledgerhq/live-common/families/elrond/types";
import type { onSelectType } from "../../types";

export interface ItemPropsType extends ListRenderItemInfo<ElrondProvider> {
  account: ElrondAccount;
  onSelect: (validator: onSelectType["validator"]) => onSelectType["return"];
}
