import React, { useCallback } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

import type { SendFlowLayoutProps } from "./types";
import { SendHeader } from "./SendHeader";
import { useSendFlowActions } from "../context/SendFlowContext";
import { useCurrentSendFlowStep } from "../hooks/useCurrentSendFlowStep";
import type { SendFlowNavigationProp } from "../types";

export function SendFlowLayoutView({ headerRight, headerContent, children }: SendFlowLayoutProps) {
  const navigation = useNavigation<SendFlowNavigationProp>();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { close } = useSendFlowActions();
  const [, currentStepConfig] = useCurrentSendFlowStep();
  const isBottomSheet = currentStepConfig?.bottomSheet === true;

  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
      headerContent: {
        marginTop: theme.spacings.s12,
        paddingHorizontal: theme.spacings.s16,
      },
      bodyContent: {
        paddingVertical: theme.spacings.s24,
        paddingHorizontal: theme.spacings.s16,
        flex: 1,
      },
      bottomSheetContainer: {
        flex: 1,
      },
      bottomSheetContent: {
        flex: 1,
        paddingBottom: bottomInset + theme.spacings.s24,
      },
      bottomSheetBodyContent: {
        paddingHorizontal: theme.spacings.s16,
        paddingBottom: theme.spacings.s24,
        flex: 1,
      },
    }),
    [bottomInset],
  );

  const handleBottomSheetClose = useCallback(() => {
    if (!navigation.isFocused()) {
      return;
    }

    if (currentStepConfig?.onBottomSheetClose) {
      currentStepConfig.onBottomSheetClose({ navigation, close });
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    close();
  }, [close, currentStepConfig, navigation]);

  if (isBottomSheet) {
    return (
      <View style={styles.bottomSheetContainer}>
        <QueuedDrawerBottomSheet
          isRequestingToBeOpened
          snapPoints="medium"
          onClose={handleBottomSheetClose}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <BottomSheetHeader density="compact" />
            {headerContent ? <View style={styles.headerContent}>{headerContent}</View> : null}
            <View style={styles.bottomSheetBodyContent}>{children}</View>
          </BottomSheetView>
        </QueuedDrawerBottomSheet>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <SendHeader headerRight={headerRight} />
      {headerContent ? <View style={styles.headerContent}>{headerContent}</View> : null}
      <View style={styles.bodyContent}>{children}</View>
    </SafeAreaView>
  );
}
