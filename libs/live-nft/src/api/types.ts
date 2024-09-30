export interface SimpleHashResponse {
  readonly next_cursor: string | null;
  readonly nfts: SimpleHashNft[];
}

export interface SimpleHashSpamReportResponse {
  readonly message: string;
}

export interface SimpleHashRefreshResponse {
  readonly message: string;
}

export interface UtxoDetails {
  readonly distinct_rare_sats: number;
  readonly satributes: {
    readonly [key: string]: {
      readonly count: number;
      readonly display_name: string;
      readonly description: string;
      readonly icon: string;
    };
  };
  readonly sat_ranges: {
    readonly starting_sat: number;
    readonly value: number;
    readonly distinct_rare_sats: number;
    readonly year: string;
    readonly subranges: {
      readonly starting_sat: number;
      readonly value: number;
      readonly sat_types: string[];
    }[];
  }[];
  readonly block_number: number;
  readonly value: number;
  readonly script_pub_key: {
    readonly asm: string;
    readonly desc: string;
    readonly hex: string;
    readonly address: string;
    readonly type: string;
  };
}

export interface ordinal_details {
  readonly charms: string | null;
  readonly content_length: number;
  readonly content_type: string;
  readonly inscription_id: string;
  readonly inscription_number: number;
  readonly location: string;
  readonly output_value: number;
  readonly parents: string | null;
  readonly protocol_content: string | null;
  readonly protocol_name: string | null;
  readonly sat_name: string;
  readonly sat_number: number;
  readonly sat_rarity: string;
}

export interface preview {
  readonly blurhash: string;
  readonly image_large_url: string;
  readonly image_medium_url: string;
  readonly image_opengraph_url: string;
  readonly image_small_url: string;
  readonly predominate_color: string;
}

export interface video_properties {
  readonly audio_coding: string;
  readonly duration: number;
  readonly height: number;
  readonly mime_type: string;
  readonly size: number;
  readonly video_coding: string;
  readonly width: number;
}

export interface owner {
  readonly first_acquired_date: string;
  readonly last_acquired_date: string;
  readonly owner_address: string;
  readonly quantity: number;
  readonly quantity_string: string;
}

export interface collection {
  readonly name: string;
  readonly spam_score: number;
  readonly description?: string;
}

export interface firstCreated {
  readonly block_number: number;
  readonly minted_to: string;
  readonly quantity: number;
  readonly quantity_string: string;
  readonly timestamp: string;
  readonly transaction: string;
  readonly transaction_initiator: string;
}

export interface attribute {
  readonly trait_type: string;
  readonly value: string;
  readonly display_type: string;
}

export interface SimpleHashNft {
  readonly nft_id: string;
  readonly chain: string;
  readonly contract_address: string;
  readonly token_id: string;
  readonly image_url: string;
  readonly name: string;
  readonly description: string;
  readonly token_count: number;
  readonly previews?: preview;
  readonly other_url?: string;
  readonly video_url?: string;
  readonly video_properties?: video_properties;
  readonly owners?: owner[];
  readonly collection: collection;
  readonly first_created?: firstCreated;
  readonly contract: {
    readonly type: string;
    readonly name?: string;
  };
  readonly extra_metadata?: {
    readonly ledger_metadata?: {
      readonly ledger_stax_image: string;
    };
    readonly attributes?: attribute[];
    readonly utxo_details?: UtxoDetails;
    readonly ordinal_details?: ordinal_details;
    readonly image_original_url: string;
    readonly animation_original_url: string;
  };
}
