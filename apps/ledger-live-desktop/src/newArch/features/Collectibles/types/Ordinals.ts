import { mappingKeysWithIconAndName } from "../Ordinals/components/Icons";
import { IconProps } from "./Collection";

export type MappingKeys = keyof typeof mappingKeysWithIconAndName;

export type RareSat = {
  count: string;
  display_name: string | string[];
  year: string;
  utxo_size: string;
  icons?: { [key: string]: ({ size, color, style }: IconProps) => JSX.Element };
  name: string;
  isDoubleRow?: boolean;
};
