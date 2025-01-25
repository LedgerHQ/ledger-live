import { MediaProps } from "./Media";
import { MappingKeys } from "./Ordinals";

export type NftRowProps = {
  media: MediaProps;
  tokenName: string;
  numberOfNfts: number;
  onClick: () => void;
};

export interface IconProps {
  size: "S" | "XS" | "M" | "L" | "XL" | undefined;
  color: string;
  style?: React.CSSProperties;
}

export type OrdinalsRowProps = {
  media: MediaProps;
  tokenName: string;
  collectionName: string;
  tokenIcons: Array<({ size, color, style }: IconProps) => JSX.Element>;
  rareSatName: MappingKeys[];
  onClick: () => void;
};

export type RareSatsRowProps = {
  tokenIcons: Array<({ size, color, style }: IconProps) => JSX.Element>;
  tokenName: string[];
  numberOfSats: number[];
  yearOfCreation: number[];
  utxoSize: number;
  onClick: () => void;
};

export type RowProps = {
  isLoading: boolean;
} & (NftRowProps | OrdinalsRowProps | RareSatsRowProps);

export type TableHeaderActionsProps = {
  element: React.ReactNode;
  action: () => void;
};

export enum TableHeaderTitleKey {
  NFTCollections = "NFT.collections.title",
  Inscriptions = "Inscriptions",
  RareSats = "ordinals.rareSats.title",
}

export type TableHeaderProps = {
  titleKey: TableHeaderTitleKey;
  actions?: TableHeaderActionsProps[];
};
