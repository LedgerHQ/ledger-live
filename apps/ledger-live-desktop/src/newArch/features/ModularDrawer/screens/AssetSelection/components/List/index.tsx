import React from "react";
import { useRightBalanceModule } from "../../modules/useRightBalanceModule";
import { BaseSelectAssetList } from "./BaseList";
import { ElementsCombinaition, SelectAssetProps } from "./types";

function SelectAssetListWithRightBalance(props: SelectAssetProps) {
  const assetsForList = useRightBalanceModule(props.assetsToDisplay);
  return <BaseSelectAssetList {...props} assetTypes={assetsForList} />;
}

function SelectAssetListWithoutBalance(props: SelectAssetProps) {
  return <BaseSelectAssetList {...props} assetTypes={props.assetsToDisplay} />;
}

export const SelectAssetList = (props: SelectAssetProps) => {
  const { rightElement, leftElement } = props.assetsConfiguration ?? {
    rightElement: "balance",
    leftElement: "undefined",
  };

  const combinaition: ElementsCombinaition = `${leftElement}|${rightElement}`;

  // Mapping of combinations to components this will evolve once we have all the elements implemented
  const combinationMapping: Record<ElementsCombinaition, React.FC<SelectAssetProps>> = {
    "apy|balance": SelectAssetListWithRightBalance,
    "apy|marketTrend": SelectAssetListWithoutBalance,
    "apy|undefined": SelectAssetListWithoutBalance,
    "priceVariation|balance": SelectAssetListWithRightBalance,
    "priceVariation|marketTrend": SelectAssetListWithoutBalance,
    "priceVariation|undefined": SelectAssetListWithoutBalance,
    "undefined|balance": SelectAssetListWithRightBalance,
    "undefined|marketTrend": SelectAssetListWithoutBalance,
    "undefined|undefined": SelectAssetListWithoutBalance,
  };

  const Component = combinationMapping[combinaition];

  return <Component {...props} />;
};
