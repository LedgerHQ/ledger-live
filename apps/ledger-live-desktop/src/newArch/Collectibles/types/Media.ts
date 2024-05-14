import { NFTMedias, NFTMetadata } from "@ledgerhq/types-live";

type BaseProps = {
  metadata: NFTMetadata;
  tokenId?: string;
  full?: boolean;
  size?: number;
  maxHeight?: number;
  maxWidth?: number;
  objectFit?: "cover" | "contain" | "fill" | "scale-down" | "none";
  square?: boolean;
};

export type ImageProps = BaseProps & {
  uri: string;
  mediaType: string;
  onClick?: (e: React.MouseEvent) => void;
  setUseFallback: (a: boolean) => void;
  isFallback: boolean;
};

export type VideoProps = BaseProps & {
  uri: string;
  mediaType: string;
  setUseFallback: (a: boolean) => void;
};

export type PlaceholderProps = Pick<BaseProps, "metadata" | "tokenId" | "full">;
// TODO Figure out if we really need this once we know who creates/processes the media.

export type MediaProps = BaseProps & {
  mediaFormat?: keyof NFTMedias;
  onClick?: (e: React.MouseEvent) => void;
};
