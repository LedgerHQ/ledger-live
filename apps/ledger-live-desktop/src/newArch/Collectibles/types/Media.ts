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
  mediaType: string | undefined;
  setUseFallback: (a: boolean) => void;
};

export type ImageProps = BaseMediaProps & {
  collectibleName?: string | null;
  onClick?: (e: React.MouseEvent) => void;
  isFallback: boolean;
};

export type VideoProps = BaseMediaProps;

export type MediaProps = BaseMediaProps & {
  useFallback: boolean;
  contentType: string | undefined;
  collectibleName?: string | null;
  mediaFormat?: keyof NFTMedias;
  onClick?: (e: React.MouseEvent) => void;
};
