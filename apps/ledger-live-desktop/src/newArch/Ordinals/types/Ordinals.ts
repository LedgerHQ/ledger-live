export type OrdinalStandard = "raresats" | "inscriptions";

export type OrdinalMetadata = { ordinal_details: OrdinalDetails; image_original_url: string };

export type OrdinalDetails = {
  inscription_id: string;
  inscription_number: number;
  sat_number: number;
  sat_name: string;
  sat_rarity: string;
  location: string;
  output_value: number;
};

export type Ordinal = {
  id: string;
  amount: number;
  contract: string;
  standard: OrdinalStandard;
  metadata: OrdinalMetadata;
};
