import React, { useCallback } from "react";
import { View } from "react-native";
import { Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaanxTopUpParamList } from "../types";

type Props = StackNavigatorProps<
  BaanxTopUpParamList,
  ScreenName.BaanxTopUpValidationError
>;

export function TopUpValidationErrorScreen({ navigation, route }: Props) {
  const error = route.params.error;

  const styles = useStyleSheet(
    t => ({
      root: {
        flex: 1,
        backgroundColor: t.colors.bg.base,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: t.spacings.s16,
      },
      message: { marginTop: t.spacings.s12, textAlign: "center" as const },
      bottom: {
        position: "absolute" as const,
        bottom: t.spacings.s32,
        left: t.spacings.s16,
        right: t.spacings.s16,
      },
    }),
    [],
  );

  const handleClose = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <Text typography="heading2" lx={{ color: "error" }}>
        Top up failed
      </Text>
      <Text typography="body2" lx={{ color: "muted" }} style={styles.message}>
        {error?.message ?? "An unknown error occurred"}
      </Text>
      <View style={styles.bottom}>
        <Button appearance="base" size="lg" onPress={handleClose}>
          Close
        </Button>
      </View>
    </SafeAreaView>
  );
}
