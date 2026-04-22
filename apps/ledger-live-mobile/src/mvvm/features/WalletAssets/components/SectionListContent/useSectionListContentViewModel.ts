import { Asset } from "~/types/asset";
import {
  type AssetListItemViewModelResult,
  usePrecomputedAssetListData,
} from "LLM/components/AssetListItem/usePrecomputedAssetListData";

const EMPTY_ASSETS: Asset[] = [];

interface SectionListContentViewModelResult {
  precomputedData: Map<string, AssetListItemViewModelResult>;
}

export function useSectionListContentViewModel(
  assets: Asset[],
  skip: boolean,
): SectionListContentViewModelResult {
  const precomputedData = usePrecomputedAssetListData(skip ? EMPTY_ASSETS : assets);
  return { precomputedData };
}
