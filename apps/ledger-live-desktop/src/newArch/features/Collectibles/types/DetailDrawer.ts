import { Account, ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";
import { ReactNode } from "react";
import { CollectibleType } from "./Collectibles";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";

export type ExternalViewerButtonProps = {
  nft: ProtoNFT | SimpleHashNft;
  account: Account;
  metadata: NFTMetadata | SimpleHashNft["extra_metadata"];
};

export type CopyableFieldProps = {
  value: string;
  children?: React.ReactNode;
};

export type PanAndZoomProps = {
  onClose: () => void;
  tokenId: ProtoNFT["tokenId"];
  useFallback: boolean;
  setUseFallback: (useFallback: boolean) => void;
  contentType: string | undefined;
  mediaType: string | undefined;
  imageUri: string | undefined;
  collectibleName: string | null;
};

export type PanAndZoomBodyProps = PanAndZoomProps;

export type HeaderTextProps = {
  isLoading: boolean;
  text: string | null;
  id?: string;
};

type BaseDetailFieldProps = {
  label: string;
  hasSeparatorTop?: boolean;
  hasSeparatorBottom?: boolean;
  isHorizontal?: boolean;
  id?: string;
};

type DetailFieldValueProps = {
  value: string | null;
  isCopyable?: boolean;
  isLoading: boolean;
  isHash?: boolean;
};

type DetailFieldNoValueProps = {
  value?: string | null;
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
  id?: string;
};
export type DetailsArray = Detail[];

export type DetailDrawerBaseProps = {
  collectionName: string | null;
  collectibleName: string | null;
  tags: Tag[] | undefined;
  details: DetailsArray;
  isOpened: boolean;
  areFieldsLoading: boolean;
  tokenId: string;
  contentType: string | undefined;
  isPanAndZoomOpen: boolean;
  previewUri: string | undefined;
  originalUri: string | undefined;
  useFallback: boolean;
  mediaType: string | undefined;
  setUseFallback: (useFallback: boolean) => void;
  openCollectiblesPanAndZoom: React.MouseEventHandler<HTMLDivElement>;
  closeCollectiblesPanAndZoom: () => void;
  handleRequestClose: () => void;
};

export type DetailDrawerProps = DetailDrawerBaseProps & {
  collectibleType: CollectibleType;
  children?: ReactNode;
};
