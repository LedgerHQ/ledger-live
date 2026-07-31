import { useCallback, useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { MoreVertical } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { useTranslation } from "~/context/Locale";

export function useContactDetailNavigationViewModel(onOpenActionsMenu?: () => void) {
  const navigation = useNavigation<NativeStackNavigationProp<MyWalletNavigatorStackParamList>>();
  const { t } = useTranslation();

  const renderTrailing = useCallback(
    () => (
      <IconButton
        appearance="no-background"
        size="md"
        icon={MoreVertical}
        accessibilityLabel={t("contacts.detailActions.menuAccessibilityLabel")}
        onPress={onOpenActionsMenu}
        testID="contacts-detail-actions-trigger"
      />
    ),
    [onOpenActionsMenu, t],
  );

  useLayoutEffect(() => {
    const opts: Partial<LumenNativeStackNavigationOptions> = {
      lumenNavBar: onOpenActionsMenu ? { renderTrailing } : {},
    };

    navigation.setOptions(opts);
  }, [navigation, onOpenActionsMenu, renderTrailing]);
}
