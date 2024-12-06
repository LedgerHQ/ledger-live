import React, { useCallback } from "react";
import { FlashList } from "@shopify/flash-list";
import useAccountListViewModel, { type Props } from "./useAccountListViewModel";
import RowLayout from "./components/RowLayout";
import { Asset } from "~/types/asset";
import { Account } from "@ledgerhq/types-live";

type ViewProps = ReturnType<typeof useAccountListViewModel>;

const View: React.FC<ViewProps> = ({ assetsToDisplay, displayType, accounts }) => {
  const renderItem = useCallback(
    ({ item }: { item: Asset | Account }) => <RowLayout displayType={displayType} item={item} />,
    [displayType],
  );
  const shouldDisplayAssets = displayType === "Assets";

  return (
    <FlashList
      estimatedItemSize={150}
      renderItem={renderItem}
      data={shouldDisplayAssets ? assetsToDisplay : accounts}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  );
};

const AccountListView: React.FC<Props> = props => {
  const viewModel = useAccountListViewModel(props);
  return <View {...viewModel} />;
};

export default AccountListView;
