import { NFTMedias } from "@ledgerhq/types-live";

type BaseProps = {
  tokenId?: string;
  full?: boolean;
  size?: number;
  maxHeight?: number;
  maxWidth?: number;
  objectFit?: "cover" | "contain" | "fill" | "scale-down" | "none";
  squareWithDefault?: boolean;
};

type BaseMediaProps = BaseProps & {
  uri: string | undefined;
  mediaType: string | undefined;
  setUseFallback: (a: boolean) => void;
};

export type ImageProps = BaseMediaProps & {
  collectibleName?: string | null | undefined;
  onClick?: (e: React.MouseEvent) => void;
  isFallback: boolean;
};

export type VideoProps = BaseMediaProps;

export type PlaceholderProps = Pick<BaseProps, "tokenId" | "full"> & {
  collectibleName?: string | null | undefined;
};
// TODO Figure out if we really need this once we know who creates/processes the media.

export type MediaProps = BaseMediaProps & {
  useFallback: boolean;
  contentType: string | undefined;
  collectibleName?: string | null | undefined;
  mediaFormat?: keyof NFTMedias;
  onClick?: (e: React.MouseEvent) => void;
};
