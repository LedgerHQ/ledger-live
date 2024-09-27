import { NftRowProps, OrdinalsRowProps, RowProps as Props } from "../types/Collection";

export function isNFTRow(props: Props): props is Props & NftRowProps {
  return "media" in props && !("collectionName" in props);
}

export function isOrdinalsRow(props: Props): props is Props & OrdinalsRowProps {
  return "rareSatName" in props;
}
