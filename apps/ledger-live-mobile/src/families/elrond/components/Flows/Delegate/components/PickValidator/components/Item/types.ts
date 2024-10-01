import type { ListRenderItemInfo } from "react-native";
import type {
  MultiversxAccount,
  MultiversxProvider,
} from "@ledgerhq/live-common/families/multiversx/types";
import type { onSelectType } from "../../types";

export interface ItemPropsType extends ListRenderItemInfo<MultiversxProvider> {
  account: MultiversxAccount;
  onSelect: (validator: onSelectType["validator"]) => onSelectType["return"];
}
