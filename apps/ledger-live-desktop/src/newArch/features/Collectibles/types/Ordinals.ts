import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { mappingKeysWithIconAndName } from "../Ordinals/components/Icons";
import { IconProps } from "./Collection";

export type MappingKeys = keyof typeof mappingKeysWithIconAndName;

type Icon = ({ size, color, style }: IconProps) => JSX.Element;

export interface RareSat {
  displayed_names: string;
  icons?: Icon[];
  year: string;
  count: string;
  names: MappingKeys[];
  isMultipleRow: boolean;
}
export interface SimpleHashNftWithIcons extends SimpleHashNft {
  icons?: Icon[];
}
