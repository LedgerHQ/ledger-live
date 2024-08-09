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

export interface SimpleHashNft {
  readonly nft_id: string;
  readonly chain: string;
  readonly contract_address: string;
  readonly token_id: string;
  readonly image_url: string;
  readonly name: string;
  readonly description: string;
  readonly token_count: number;
  readonly collection: {
    readonly name: string;
    readonly spam_score: number;
  };
  readonly contract: {
    readonly type: string;
  };
  readonly extra_metadata?: {
    readonly ledger_metadata?: {
      readonly ledger_stax_image: string;
    };
    readonly image_original_url: string;
    readonly animation_original_url: string;
  };
}
