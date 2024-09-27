import { OrdinalsRowProps } from "./Collection";
import { MediaProps } from "./Media";
import { MappingKeys } from "./Ordinals";

export type InscriptionsItemProps = {
  tokenName: string;
  collectionName: string;
  tokenIcons: OrdinalsRowProps["tokenIcons"];
  media: MediaProps;
  rareSatName?: MappingKeys[];
  onClick: () => void;
};
