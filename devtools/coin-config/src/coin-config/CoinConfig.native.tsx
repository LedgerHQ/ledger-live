import { useCallback } from "react";
import { FlatList } from "react-native";
import {
  BottomSheet,
  BottomSheetModalProvider,
  Divider,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import type { CoinConfigToolProps } from "../types";
import { KeyEditorBottomSheetContent } from "../components/keyEditorBottomSheet/KeyEditorBottomSheetContent";
import { KeyRow } from "../components/keyRow/KeyRow";
import { ToolBar } from "../components/toolBar/ToolBar";
import { useCoinConfigViewModel } from "./internals/useCoinConfigViewModel";

const keyExtractor = (key: string) => key;

export function CoinConfig(props: Readonly<CoinConfigToolProps>) {
  const viewModel = useCoinConfigViewModel(props);
  const { filteredKeys, getKeyDisplayState, selectedKey, selectKey, clearSelection } = viewModel;
  const editorRef = useBottomSheetRef();

  const openKey = useCallback(
    (key: string) => {
      selectKey(key);
      editorRef.current?.present();
    },
    [selectKey, editorRef],
  );

  return (
    <BottomSheetModalProvider>
      <ToolBar
        search={viewModel.search}
        setSearch={viewModel.setSearch}
        filter={viewModel.filter}
        setFilter={viewModel.setFilter}
        filterOptions={viewModel.filterOptions}
        filteredCount={filteredKeys.length}
        totalCount={viewModel.totalCount}
        overrideCount={viewModel.overrideCount}
        onClearAll={props.clearAllOverrides}
      />
      <FlatList
        style={{ flex: 1 }}
        windowSize={5}
        data={filteredKeys}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => <KeyRow display={getKeyDisplayState(item)} onSelect={openKey} />}
        ItemSeparatorComponent={Divider}
        keyboardShouldPersistTaps="handled"
      />
      <BottomSheet ref={editorRef} snapPoints={["80%"]} onDismiss={clearSelection}>
        {selectedKey && (
          <KeyEditorBottomSheetContent
            key={selectedKey}
            display={getKeyDisplayState(selectedKey)}
            setOverride={props.setOverride}
            clearOverride={props.clearOverride}
          />
        )}
      </BottomSheet>
    </BottomSheetModalProvider>
  );
}
