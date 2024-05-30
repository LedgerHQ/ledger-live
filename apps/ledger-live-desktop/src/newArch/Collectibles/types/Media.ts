import { NFTMedias, NFTMetadata } from "@ledgerhq/types-live";

type BaseProps = {
  metadata?: NFTMetadata;
  tokenId?: string;
  full?: boolean;
  size?: number;
  maxHeight?: number;
  maxWidth?: number;
  objectFit?: "cover" | "contain" | "fill" | "scale-down" | "none";
  squareWithDefault: boolean;
};

export type ImageProps = BaseProps & {
  collectibleName?: string | null | undefined;
  uri: string;
  mediaType: string | undefined;
  onClick?: (e: React.MouseEvent) => void;
  setUseFallback: (a: boolean) => void;
  isFallback: boolean;
};

export type VideoProps = BaseProps & {
  uri: string;
  mediaType: string | undefined;
  setUseFallback: (a: boolean) => void;
};

export type PlaceholderProps = Pick<BaseProps, "tokenId" | "full"> & {
  collectibleName?: string | null | undefined;
};
// TODO Figure out if we really need this once we know who creates/processes the media.

export type MediaProps = BaseProps & {
  useFallback: boolean;
  contentType: string | undefined;
  uri: string | undefined;
  mediaType: string | undefined;
  setUseFallback: (a: boolean) => void;
  collectibleName?: string | null | undefined;
  mediaFormat?: keyof NFTMedias;
  onClick?: (e: React.MouseEvent) => void;
};
