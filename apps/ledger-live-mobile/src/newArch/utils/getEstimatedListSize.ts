import { Dimensions, ScaledSize } from "react-native";

export const ESTIMATED_ITEM_SIZE = 150;
export const FALLBACK_DIMENSION = 500;

interface EstimatedListSizeParams {
  limit?: number;
  screenDimensions?: ScaledSize;
  itemSize?: number;
  fallbackDimension?: number;
}

export function getEstimatedListSize({
  limit,
  screenDimensions = Dimensions.get("screen"),
  itemSize = ESTIMATED_ITEM_SIZE,
  fallbackDimension = FALLBACK_DIMENSION,
}: EstimatedListSizeParams = {}) {
  return {
    height: limit ? limit * itemSize : screenDimensions?.height ?? fallbackDimension,
    width: screenDimensions?.width ?? fallbackDimension,
  };
}
