import { Account, ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";
import { ReactNode } from "react";
import { CollectibleType } from "./Collectibles";

export type ExternalViewerButtonProps = {
  nft: ProtoNFT;
  account: Account;
  metadata: NFTMetadata;
};

export type CopyableFieldProps = {
  value: string;
  children?: React.ReactNode;
};

export type PanAndZoomProps = {
  onClose: () => void;
  tokenId: string;
  useFallback: boolean;
  setUseFallback: (useFallback: boolean) => void;
  contentType: string | undefined;
  mediaType: string | undefined;
  imageUri: string | undefined;
  collectibleName: string | null | undefined;
};

export type PanAndZoomBodyProps = PanAndZoomProps;

export type HeaderTextProps = {
  isLoading: boolean;
  text: string | null | undefined;
};

type BaseDetailFieldProps = {
  label: string;
  hasSeparatorTop?: boolean;
  hasSeparatorBottom?: boolean;
  isHorizontal?: boolean;
};

type DetailFieldValueProps = {
  value: string | null | undefined;
  isCopyable?: boolean;
  isLoading: boolean;
  isHash?: boolean;
};

type DetailFieldNoValueProps = {
  value?: string | null | undefined;
  isCopyable?: never;
  isLoading?: never;
  isHash?: boolean;
};

export type DetailFieldProps = BaseDetailFieldProps &
  (DetailFieldValueProps | DetailFieldNoValueProps);

export type Tag = {
  key: string;
  value: string;
};
export type TagProps = {
  tags: Tag[] | undefined;
  sectionTitle: string;
  status: string;
  isNewDesign?: boolean; // added to prepare for the future migration to the new design
};

type Detail = {
  key: string;
  title: string;
  value: string;
  isCopyable?: boolean;
  isHash?: boolean;
};
export type DetailsArray = Detail[];

export type DetailDrawerBaseProps = {
  collectionName: string | null | undefined;
  tags: Tag[] | undefined;
  details: DetailsArray;
  isOpened: boolean;
  areFieldsLoading: boolean;
  tokenId: string;
  contentType: string | undefined;
  isPanAndZoomOpen: boolean;
  imageUri: string | undefined;
  useFallback: boolean;
  mediaType: string | undefined;
  collectibleName: string | null | undefined;
  setUseFallback: (useFallback: boolean) => void;
  openCollectiblesPanAndZoom: React.MouseEventHandler<HTMLDivElement>;
  closeCollectiblesPanAndZoom: () => void;
  handleRequestClose: () => void;
};

export type DetailDrawerProps = DetailDrawerBaseProps & {
  collectibleType: CollectibleType;
  children?: ReactNode;
};
