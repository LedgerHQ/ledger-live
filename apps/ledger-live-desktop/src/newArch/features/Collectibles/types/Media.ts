import { NFTMedias } from "@ledgerhq/types-live";
import React, { CSSProperties } from "react";

type BaseProps = {
  tokenId?: string;
  full?: boolean;
  size?: number;
  maxHeight?: number;
  maxWidth?: number;
  objectFit?: CSSProperties["objectFit"];
  squareWithDefault?: boolean;
};

type BaseMediaProps = BaseProps & {
  uri: string | undefined;
  previewUri?: string | undefined;
  originalUri?: string | undefined;
  mediaType: string | undefined;
  setUseFallback?: (useFallback: boolean) => void;
};

export type ImageProps = BaseMediaProps & {
  collectibleName?: string | null;
  onClick?: (event: React.MouseEvent) => void;
  isFallback: boolean;
  isLoading: boolean;
};

export type VideoProps = BaseMediaProps;

export type MediaProps = BaseMediaProps & {
  isLoading: boolean;
  useFallback: boolean;
  contentType: string | undefined;
  collectibleName?: string | null;
  mediaFormat?: keyof NFTMedias;
  onClick?: (event: React.MouseEvent) => void;
};
