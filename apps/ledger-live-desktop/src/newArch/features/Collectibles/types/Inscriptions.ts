import { MediaProps } from "./Media";

export type InscriptionsItemProps = {
  tokenName: string;
  collectionName: string;
  media: MediaProps;
  nftId: string;
  onClick: () => void;
};
