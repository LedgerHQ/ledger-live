import React, { useCallback } from "react";
import { Text, Pressable, Box } from "@ledgerhq/lumen-ui-rnative";
import Delta from "LLM/components/Delta";
import { ValueChange } from "@ledgerhq/types-live";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { useNavigation } from "@react-navigation/native";
import { track } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { useTheme, LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

export const AnalyticPill = ({ valueChange }: { valueChange: ValueChange }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<BaseNavigation>();

  const pressTrack = useCallback(() => {
    track("button_clicked", {
      button: "analytics_page",
      page: "portfolio",
    });
  }, []);

  const handlePress = () => {
    pressTrack();
    navigation.navigate(NavigatorName.Analytics, {
      screen: ScreenName.Analytics,
      params: {
        sourceScreenName: ScreenName.Portfolio,
      },
    });
  };

  return (
    <Pressable
      lx={PressableStyle}
      onPress={handlePress}
      style={({ pressed }) => ({
        backgroundColor: pressed
          ? theme.colors.bg.mutedTransparentPressed
          : theme.colors.bg.mutedTransparent,
      })}
      testID="portfolio-balance-analytics-pill"
    >
      <Box lx={BoxStyle}>
        <Delta
          percent
          show0Delta
          fallbackToPercentPlaceholder
          valueChange={valueChange}
          testID="portfolio-balance-delta"
        />
        <Text typography="body2" lx={{ color: "base" }}>
          {"·"}
        </Text>
        <Text typography="body2" lx={{ color: "base" }}>
          {t("common.today")}
        </Text>
      </Box>
      <ChevronRight size={16} />
    </Pressable>
  );
};

const PressableStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  height: "s40",
  borderRadius: "full",
  paddingHorizontal: "s16",
  gap: "s2",
};

const BoxStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s4",
};
