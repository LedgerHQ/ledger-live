import {
  NftRowProps,
  OrdinalsRowProps,
  RareSatsRowProps,
  RowProps as Props,
} from "../types/Collection";

export function isNFTRow(props: Props): props is Props & NftRowProps {
  return "media" in props;
}

export function isOrdinalsRow(props: Props): props is Props & OrdinalsRowProps {
  return "collectionName" in props;
}

export function isRareSatsRow(props: Props): props is Props & RareSatsRowProps {
  return "tokenIcons" in props;
}
