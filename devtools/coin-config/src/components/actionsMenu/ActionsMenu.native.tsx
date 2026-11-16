import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  IconButton,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { MoreHorizontal, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";

export interface ActionsMenuProps {
  readonly onClearAll: () => void;
}

export function ActionsMenu({ onClearAll }: ActionsMenuProps) {
  const menuRef = useBottomSheetRef();

  return (
    <>
      <IconButton
        accessibilityLabel="Actions"
        appearance="gray"
        size="sm"
        icon={MoreHorizontal}
        onPress={() => menuRef.current?.present()}
      />
      <BottomSheet ref={menuRef} snapPoints={null} enableDynamicSizing>
        <BottomSheetView>
          <BottomSheetHeader />
          <ListItem
            onPress={() => {
              menuRef.current?.dismiss();
              onClearAll();
            }}
          >
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
