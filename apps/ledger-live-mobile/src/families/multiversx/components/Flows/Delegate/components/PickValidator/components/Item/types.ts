import type { ListRenderItemInfo } from "react-native";
import type {
  MultiversXAccount,
  MultiversXProvider,
} from "@ledgerhq/live-common/families/multiversx/types";
import type { onSelectType } from "../../types";

export interface ItemPropsType extends ListRenderItemInfo<MultiversXProvider> {
  account: MultiversXAccount;
  onSelect: (validator: onSelectType["validator"]) => onSelectType["return"];
}
