import { ProtoNFT } from "@ledgerhq/types-live";

interface SimpleHashResponse {
  readonly next_cursor: string | null;
  readonly nfts: SimpleHashNft[];
}

interface SimpleHashNft {
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

type HookProps = {
  addresses: string[];
  nftsOwned: ProtoNFT[];
  chains: string[];
};

type PartialProtoNFT = Partial<ProtoNFT>;

export type { HookProps, SimpleHashNft, SimpleHashResponse, PartialProtoNFT };
