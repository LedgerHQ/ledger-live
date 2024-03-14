export type OrdinalStandard = "raresats" | "inscriptions";

export type OrdinalMetadata = {
  ordinal_details?: OrdinalDetails;
  image_original_url?: string;
  utxo_details?: UtxoDetails;
};

export type OrdinalDetails = {
  inscription_id: string;
  inscription_number: number;
  sat_number: number;
  sat_name: string;
  sat_rarity: string;
  location: string;
  output_value: number;
  content_type: string;
  content_length: number;
};

export type UtxoDetails = {
  distinct_rare_sats: number;
  satributes: { [key: string]: { count: number; display_name: string; description: string } };
  block_number: string;
  value: number;
  sat_ranges: {
    distinct_rare_sats: number;
    starting_sat: number;
    value: number;
    year: number;
    subranges: { sat_types: string[]; value: number }[];
  }[];
};
export type OrdinalContract = {
  type: string;
  name: string;
};

export type Ordinal = {
  id: string;
  name: string;
  amount: number;
  contract: OrdinalContract;
  contract_address: string;
  standard: OrdinalStandard;
  metadata: OrdinalMetadata;
};
