import React from "react";
import { StyleSheet } from "react-native";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  type IconProps,
  ListItem,
  Spot,
  Text,
  useTheme,
} from "@ledgerhq/lumen-ui-rnative";
import { PenEdit, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";

// Spot paints custom icons with the neutral color of its "icon" appearance and injects it
// through `style`, so the destructive color has to override that style on the symbol itself.
function TrashDestructive({ style, ...props }: IconProps) {
  const { theme } = useTheme();
  return (
    <Trash {...props} style={StyleSheet.flatten([style, { color: theme.colors.text.error }])} />
  );
}

export type ContactDetailActionsMenuProps = Readonly<{
  isOpen: boolean;
  canDelete: boolean;
  bottomInset?: number;
  onEdit: () => void;
  onDelete: () => void;
}>;

export function ContactDetailActionsMenu({
  isOpen,
  canDelete,
  bottomInset = 0,
  onEdit,
  onDelete,
}: ContactDetailActionsMenuProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {isOpen ? (
        <Box testID="contacts-detail-actions-menu">
          <BottomSheetHeader />
          <Box lx={{ paddingHorizontal: "s8" }}>
            <ListItem onPress={onEdit} testID="contacts-detail-edit-action">
              <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s12" }}>
                <Spot appearance="icon" icon={PenEdit} size={40} />
                <Text typography="body1SemiBold" lx={{ color: "base" }}>
                  {t("contacts.detailActions.editName")}
                </Text>
              </Box>
            </ListItem>
            {canDelete ? (
              <ListItem onPress={onDelete} testID="contacts-detail-delete-action">
                <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s12" }}>
                  <Spot appearance="icon" icon={TrashDestructive} size={40} />
                  <Text typography="body1SemiBold" lx={{ color: "error" }}>
                    {t("contacts.detailActions.deleteContact")}
                  </Text>
                </Box>
              </ListItem>
            ) : null}
          </Box>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
