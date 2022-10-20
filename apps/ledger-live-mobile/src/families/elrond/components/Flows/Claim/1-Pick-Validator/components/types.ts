import type { ListRenderItemInfo } from "react-native";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { DelegationType } from "../../../../../types";
import type { onSelectType } from "../types";

interface ItemPropsType extends ListRenderItemInfo<DelegationType> {
  unit: Unit;
  onSelect: (
    validator: onSelectType["validator"],
    value: onSelectType["value"],
  ) => onSelectType["return"];
}

export type { ItemPropsType };
