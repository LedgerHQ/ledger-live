import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  IconButton,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { MoreHorizontal, Share, Download, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useFlagMenuViewModel, type FlagMenuViewProps } from "./useFlagMenuViewModel";

function FlagMenuView({ menuRef, openMenu, onExport, onImport, onReset }: FlagMenuViewProps) {
  return (
    <>
      <IconButton
        accessibilityLabel="Actions"
        appearance="gray"
        size="sm"
        icon={MoreHorizontal}
        onPress={openMenu}
      />
      <BottomSheet ref={menuRef} snapPoints={null} enableDynamicSizing>
        <BottomSheetView>
          <BottomSheetHeader />
          <ListItem onPress={onExport}>
            <ListItemLeading>
              <Share size={24} />
              <ListItemContent>
                <ListItemTitle>Export flags</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
          <ListItem onPress={onImport}>
            <ListItemLeading>
              <Download size={24} />
              <ListItemContent>
                <ListItemTitle>Import flags</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
          <ListItem onPress={onReset}>
            <ListItemLeading>
              <Trash size={24} color="error" />
              <ListItemContent>
                <ListItemTitle lx={{ color: "error" }}>Reset all overrides</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

export const FlagMenu = () => <FlagMenuView {...useFlagMenuViewModel()} />;
