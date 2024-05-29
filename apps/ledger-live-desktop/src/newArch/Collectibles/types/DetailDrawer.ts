import { Account, ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";
import { ReactElement, ReactNode } from "react";

export type ExternalViewerButtonProps = {
  nft: ProtoNFT;
  account: Account;
  metadata: NFTMetadata;
};

export type CopyableFieldProps = {
  value: string;
  children?: React.ReactNode;
};

export type NftPanAndZoomProps = {
  onClose: () => void;
  metadata: NFTMetadata;
  tokenId: string;
};

export type NftPanAndZoomBodyProps = {
  metadata: NFTMetadata;
  tokenId: string;
};

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

export type tagProps = {
  tags: Record<"key" | "value", string>[] | undefined;
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

type DetailDrawerBaseProps = {
  children: ReactElement | ReactElement[];
  collectionName: string;
  title: string;
  tags: Record<"key" | "value", string>[] | undefined;
  details: DetailsArray;
  isOpened: boolean;
  areFieldsLoading: boolean;
  metadata: NFTMetadata;
  protoNft: ProtoNFT;
  contentType: string | undefined;
  isPanAndZoomOpen: boolean;
  openCollectiblesPanAndZoom: React.MouseEventHandler<HTMLDivElement>;
  closeCollectiblesPanAndZoom: () => void;
  handleRequestClose: () => void;
};

export type DetailDrawerProps = DetailDrawerBaseProps & {
  children: ReactNode;
};
