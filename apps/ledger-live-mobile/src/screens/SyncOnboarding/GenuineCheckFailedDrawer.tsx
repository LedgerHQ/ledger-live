import React from "react";
import { BoxedIcon, Button, Flex, Text } from "@ledgerhq/native-ui";
import { WarningSolidMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "../../components/QueuedDrawer";
import { TrackScreen } from "../../analytics";
import GenericErrorView from "../../components/GenericErrorView";

export type Props = {
  isOpen: boolean;
  onRetry?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  productName: string;
  error?: Error | null;
};

/**
 * Drawer displayed on a failed genuine check during the sync onboarding
 *
 * The failed genuine check can come from an error that happened during the genuine check
 * or if the user cancelled/did not allow the genuine check.
 *
 * If `error` is set, displays the associated `GenericErrorView` with the translated message defined in common.json
 *
 * Otherwise displays an error message informing the user that they cancelled the genuine check
 */
const GenuineCheckFailedDrawer = ({
  isOpen,
  onRetry,
  onSkip,
  onClose,
  productName,
  error,
}: Props) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      preventBackdropClick
      noCloseButton
    >
      <TrackScreen
        category="Failed Stax hardware check"
        type="drawer"
        refreshSource={false}
      />
      {error ? (
        <>
          <Flex p={3}>
            <GenericErrorView error={error} />
          </Flex>
          <Button type="main" mt={4} mb={4} onPress={onRetry}>
            {t("common.retry")}
          </Button>
          <Button onPress={onSkip}>{t("common.skip")}</Button>
        </>
      ) : (
        <>
          <Flex
            justifyContent="center"
            alignItems="center"
            flex={1}
            mt={9}
            mb={6}
          >
            <BoxedIcon
              Icon={<WarningSolidMedium color="warning.c80" size={24} />}
              variant="circle"
              backgroundColor="neutral.c30"
              borderColor="transparent"
              size={48}
            />
          </Flex>
          <Text
            textAlign="center"
            variant="h4"
            fontWeight="semiBold"
            mb={4}
            mt={8}
          >
            {t(
              "syncOnboarding.softwareChecksSteps.genuineCheckCancelledDrawer.title",
            )}
          </Text>
          <Text
            textAlign="center"
            variant="bodyLineHeight"
            mb={8}
            color="neutral.c80"
          >
            {t(
              "syncOnboarding.softwareChecksSteps.genuineCheckCancelledDrawer.description",
              { productName },
            )}
          </Text>
          <Button type="main" mb={4} onPress={onRetry}>
            {t(
              "syncOnboarding.softwareChecksSteps.genuineCheckCancelledDrawer.retryCta",
            )}
          </Button>
          <Button onPress={onSkip}>
            {t(
              "syncOnboarding.softwareChecksSteps.genuineCheckCancelledDrawer.skipCta",
            )}
          </Button>
        </>
      )}
    </QueuedDrawer>
  );
};

export default GenuineCheckFailedDrawer;
