import React from "react";
import { Box, Button, IconButton, Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";
import SafeAreaView from "~/components/SafeAreaView";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { NotificationsOptInIllustration } from "./components/NotificationsOptInIllustration";
import type { NotificationsOptInViewModel } from "./useNotificationsOptInViewModel";

type Props = {
  viewModel: NotificationsOptInViewModel;
};

export function NotificationsOptInView({ viewModel }: Props) {
  const { t } = useTranslation();

  const isError = viewModel.state === "error";

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <SafeAreaView isFlex>
        <TrackScreen
          category="Drawer push notification opt-in"
          source="onboarding"
          repromptDelay={viewModel.nextRepromptDelay}
          dismissedCount={viewModel.dismissedCount}
        />
        <Box lx={{ flex: 1, paddingBottom: "s24" }}>
          <Box lx={{ alignItems: "flex-start", paddingHorizontal: "s4", paddingTop: "s8" }}>
            <IconButton
              icon={ArrowLeft}
              appearance="no-background"
              size="md"
              onPress={viewModel.onBack}
              accessibilityLabel={t("common.back")}
              testID="notifications-opt-in-back"
            />
          </Box>

          <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {isError
                ? t("notifications.optInScreen.errorTitle")
                : t("notifications.optInScreen.title")}
            </Text>
            <Text typography="body2" lx={{ color: "muted", marginTop: "s8" }}>
              {isError
                ? t("notifications.optInScreen.errorDescription")
                : t("notifications.optInScreen.description")}
            </Text>
          </Box>

          {isError ? (
            <>
              <Box lx={{ flex: 1 }} />
              <Box lx={{ paddingHorizontal: "s16", gap: "s16" }}>
                <Button
                  appearance="gray"
                  size="lg"
                  isFull
                  onPress={viewModel.onContinue}
                  testID="notifications-opt-in-continue"
                >
                  {t("common.continue")}
                </Button>
              </Box>
            </>
          ) : (
            <Box lx={{ flex: 1 }} testID="notifications-opt-in-illustration">
              <NotificationsOptInIllustration />
              <Box style={{ marginTop: "auto" }} lx={{ paddingHorizontal: "s16", gap: "s32" }}>
                <Button
                  appearance="base"
                  size="lg"
                  isFull
                  disabled={viewModel.isAllowNotificationsDisabled}
                  onPress={viewModel.onAllowNotifications}
                  testID="notifications-opt-in-allow"
                >
                  {t("notifications.prompt.allow")}
                </Button>
                <Box lx={{ alignItems: "center", justifyContent: "center" }}>
                  <Pressable
                    onPress={viewModel.onMaybeLater}
                    accessibilityRole="button"
                    testID="notifications-opt-in-later"
                    lx={{ alignItems: "center" }}
                  >
                    <Text typography="body1SemiBold" lx={{ color: "base" }}>
                      {t("notifications.prompt.later")}
                    </Text>
                  </Pressable>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </SafeAreaView>
    </Box>
  );
}
