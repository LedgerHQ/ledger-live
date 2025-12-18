import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text } from "@ledgerhq/native-ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  openSync: () => void;
  skipSync: () => void;
};

function SkipLedgerSyncDrawer({ isOpen, handleClose, openSync, skipSync }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <>
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
        <Flex maxHeight={"90%"}>
          <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={22}>
            <Flex justifyContent="center" alignItems="center" flexDirection="column" rowGap={6}>
              <Text
                variant="h4"
                textAlign="center"
                lineHeight="32.4px"
                testID="sync-onboarding-drawer-skip-title"
                style={{ letterSpacing: -0.72, fontWeight: 600 }}
                color="neutral.c100"
              >
                {t("syncOnboarding.syncStep.skip.title")}
              </Text>
              <Text
                variant="bodyLineHeight"
                textAlign="center"
                color="neutral.c80"
                alignSelf={"center"}
                maxWidth={330}
                numberOfLines={4}
                testID="sync-onboarding-drawer-skip-description"
                style={{ letterSpacing: 0 }}
              >
                {t("syncOnboarding.syncStep.skip.description")}{" "}
                <Text variant="bodyLineHeight" style={{ fontStyle: "italic" }} color="neutral.c80">
                  {t("syncOnboarding.syncStep.skip.descriptionEmphasis")}
                </Text>
              </Text>
            </Flex>
            <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={32}>
              <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={16}>
                <Button
                  type="main"
                  alignSelf={"stretch"}
                  minWidth={"100%"}
                  size="large"
                  onPress={skipSync}
                  accessibilityRole="button"
                  testID="sync-onboarding-drawer-skipCTA"
                >
                  {t("syncOnboarding.syncStep.skip.skipCTA")}
                </Button>
                <Button
                  type={"default"}
                  border={"1px solid"}
                  borderColor={"neutral.c50"}
                  alignSelf={"stretch"}
                  minWidth={"100%"}
                  size="large"
                  onPress={openSync}
                  accessibilityRole="button"
                  testID="sync-onboarding-drawer-syncCTA"
                >
                  {t("syncOnboarding.syncStep.skip.syncCTA")}
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </QueuedDrawer>
    </>
  );
}

export default SkipLedgerSyncDrawer;
