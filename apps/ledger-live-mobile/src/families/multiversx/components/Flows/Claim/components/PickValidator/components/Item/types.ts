import type { ListRenderItemInfo } from "react-native";
import type { Unit } from "@ledgerhq/ledger-wallet-framework/types";
import type { DelegationType } from "../../../../../../../types";
import type { onSelectType } from "../../types";

export interface ItemPropsType extends ListRenderItemInfo<DelegationType> {
  unit: Unit;
  onSelect: (
    validator: onSelectType["validator"],
    value: onSelectType["value"],
  ) => onSelectType["return"];
}
