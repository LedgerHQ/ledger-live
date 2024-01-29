import { ProtoNFT } from "@ledgerhq/types-live";

export type HookProps = {
  addresses: string;
  nftsOwned: ProtoNFT[];
  chains: string[];
};

export type PartialProtoNFT = Partial<ProtoNFT>;
