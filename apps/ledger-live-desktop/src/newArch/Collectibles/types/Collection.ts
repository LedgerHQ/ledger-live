import { MediaProps } from "./Media";

export type NftRowProps = {
  media: MediaProps;
  tokenName: string;
  numberOfNfts: number;
  onClick: () => void;
};

export type OrdinalsRowProps = {
  media: MediaProps;
  tokenName: string;
  collectionName: string;
  tokenIcons: string[];
  onClick: () => void;
};

export type RareSatsRowProps = {
  tokenIcons: string[];
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
}

export type TableHeaderProps = {
  titleKey: TableHeaderTitleKey;
  actions?: TableHeaderActionsProps[];
};
