import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  Button,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { Check, FilterSort } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSortButtonViewModel, type SortButtonInput } from "./useSortButtonViewModel";

export function SortButton(props: SortButtonInput) {
  const { sheetRef, openSheet, activeLabel, options, select } = useSortButtonViewModel(props);

  return (
    <>
      <Button size="sm" icon={FilterSort} appearance="no-background" onPress={openSheet}>
        {activeLabel}
      </Button>
      <BottomSheet ref={sheetRef} snapPoints={null} enableDynamicSizing>
        <BottomSheetView>
          <BottomSheetHeader title="Sort by" />
          {options.map(option => (
            <ListItem key={option.key} onPress={() => select(option)}>
              <ListItemLeading>
                <ListItemContent>
                  <ListItemTitle lx={option.isActive ? { color: "active" } : undefined}>
                    {option.label}
                  </ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
              {option.isActive && (
                <ListItemTrailing>
                  <Check size={24} color="active" />
                </ListItemTrailing>
              )}
            </ListItem>
          ))}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
