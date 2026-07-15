import { Divider } from "@ledgerhq/lumen-ui-rnative";
import { FlatList, type ListRenderItem } from "react-native";
import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps } from "../../types";
import { FlagRow } from "../flagRow/FlagRow.native";
import { FlagEditorBottomSheet } from "../FlagEditorBottomSheet/FlagEditorBottomSheet.native";
import { ToolBar } from "../toolBar/ToolBar.native";
import { useFlagListViewModel, type FlagListViewProps } from "./useFlagListViewModel.native";

const keyExtractor = (id: FeatureId) => id;
const renderItem: ListRenderItem<FeatureId> = ({ item }) => <FlagRow id={item} />;

function FlagListView({ toolBarProps, sortedFlagIds }: FlagListViewProps) {
  return (
    <>
      <ToolBar {...toolBarProps} />
      <FlatList
        style={{ flex: 1 }}
        windowSize={5}
        data={sortedFlagIds}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={Divider}
      />
      <FlagEditorBottomSheet />
    </>
  );
}

export const FlagList = (props: FeatureFlagsToolProps) => (
  <FlagListView {...useFlagListViewModel(props)} />
);
