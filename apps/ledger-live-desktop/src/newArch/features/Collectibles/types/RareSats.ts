import { IconProps } from "./Collection";
import { MappingKeys } from "./Ordinals";

export type Satributes = {
  [key in MappingKeys]?: {
    count: number;
    display_name: string | string[];
    description?: string;
    icon?: string;
  };
};

export type Subrange = {
  starting_sat: number;
  value: number;
  sat_types: string[];
};

export type SatRange = {
  starting_sat: number;
  value: number;
  distinct_rare_sats: number;
  year: string;
  subranges: Subrange[];
};

export type UtxoDetails = {
  distinct_rare_sats: number;
  satributes: Satributes;
  sat_ranges: SatRange[];
  block_number: number;
  value: number;
  script_pub_key: {
    asm: string;
    desc: string;
    hex: string;
    address: string;
    type: string;
  };
};

export type Icons = Record<string, ({ size, color, style }: IconProps) => JSX.Element>;

export type ExtraMetadata = {
  attributes: {
    trait_type: string;
    value: string;
    display_type: string;
  }[];
  utxo_details: UtxoDetails;
  image_original_url: string | null;
  animation_original_url: string | null;
  metadata_original_url: string | null;
};
