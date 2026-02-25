import React from "react";
import useManifestsListViewModel from "LLM/features/Web3Hub/components/ManifestsList/useManifestsListViewModel";
import Disclaimer, { useDisclaimerViewModel } from "LLM/features/Web3Hub/components/Disclaimer";
import { MainProps } from "LLM/features/Web3Hub/types";
import HorizontalList from "../HorizontalList";

type Props = {
  title: string;
  categoryId: string;
  navigation: MainProps["navigation"];
  testID?: string;
};

const ManifestsCategoryList = ({ title, categoryId, navigation, testID }: Props) => {
  const { data, isLoading, onEndReached } = useManifestsListViewModel(categoryId);

  const disclaimer = useDisclaimerViewModel(navigation);

  return data && data.length > 0 ? (
    <>
      <Disclaimer disclaimer={disclaimer} />
      <HorizontalList
        title={title}
        data={data}
        onPressItem={disclaimer.onPressItem}
        isLoading={isLoading}
        onEndReached={onEndReached}
        testID={testID}
      />
    </>
  ) : null;
};

export default ManifestsCategoryList;
