import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { Alert, Button, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import React, { useCallback, useState } from "react";
import DeviceActionModal from "~/components/DeviceActionModal";
import QueuedDrawer from "~/components/QueuedDrawer";
import { Trans, useTranslation } from "~/context/Locale";
import type { NavigationSnapshot } from "../../utils/navigationSnapshot";
import CantonDisclaimer from "../CantonDisclaimer";
import { useCantonReonboardDrawerViewModel } from "./useCantonReonboardDrawerViewModel";

interface CantonReonboardDrawerProps {
  isOpen: boolean;
  currency: CryptoCurrency;
  accountToReonboard: Account;
  restoreState?: NavigationSnapshot;
  onClose: () => void;
}

export default function CantonReonboardDrawer({
  isOpen,
  currency,
  accountToReonboard,
  restoreState,
  onClose,
}: CantonReonboardDrawerProps) {
  const { t } = useTranslation();
  const [hasStarted, setHasStarted] = useState(false);
  const [hasAgreedDisclaimer, setHasAgreedDisclaimer] = useState(false);

  const viewModel = useCantonReonboardDrawerViewModel({
    currency,
    accountToReonboard,
    restoreState,
    onClose,
  });

  const handleStart = useCallback(() => {
    setHasStarted(true);
    viewModel.startOnboarding();
  }, [viewModel]);

  const {
    onboardingStatus,
    error,
    isProcessing,
    showDeviceModal,
    isNetworkProcessing,
    device,
    deviceAction,
    deviceActionRequest,
    retryOnboarding,
    showError,
    statusTranslationKey,
  } = viewModel;

  const isSuccess = onboardingStatus === OnboardStatus.SUCCESS;

  const renderContent = () => {
    if (isNetworkProcessing) {
      return (
        <Flex alignItems="center" justifyContent="center" py={6}>
          <InfiniteLoader size={40} />
          <Text variant="body" color="neutral.c70" mt={4} textAlign="center">
            {t(statusTranslationKey)}
          </Text>
        </Flex>
      );
    }

    return (
      <Flex flexDirection="column" alignItems="stretch">
        <Text variant="body" color="neutral.c80" textAlign="center" mb={4}>
          {hasStarted ? t(statusTranslationKey) : t("canton.onboard.reonboard.description")}
        </Text>

        {isSuccess && (
          <Flex mb={4}>
            <Alert type="success">
              <Trans i18nKey="canton.onboard.reonboard.success" />
            </Alert>
          </Flex>
        )}

        {showError && (
          <Flex mb={4}>
            <Alert type="error">
              <Trans i18nKey="canton.onboard.error" />
            </Alert>
          </Flex>
        )}
      </Flex>
    );
  };

  const renderFooter = () => {
    if (isNetworkProcessing) return null;

    if (isSuccess) {
      return null;
    }

    if (showError) {
      return (
        <Button type="main" onPress={retryOnboarding} disabled={isProcessing}>
          <Trans i18nKey="common.tryAgain" />
        </Button>
      );
    }

    return (
      <Button
        type="main"
        onPress={onboardingStatus === OnboardStatus.ERROR ? retryOnboarding : handleStart}
        disabled={isProcessing}
      >
        <Trans i18nKey={hasStarted ? "common.retry" : "common.confirm"} />
      </Button>
    );
  };

  return (
    <>
      <QueuedDrawer
        isRequestingToBeOpened={isOpen && !showDeviceModal}
        onClose={onClose}
        title={hasAgreedDisclaimer ? t("canton.onboard.reonboard.title") : undefined}
      >
        {hasAgreedDisclaimer ? (
          <Flex flexDirection="column" alignItems="stretch" px={4} pb={6}>
            {renderContent()}
            {renderFooter()}
          </Flex>
        ) : (
          <CantonDisclaimer onAgree={() => setHasAgreedDisclaimer(true)} onCancel={onClose} />
        )}
      </QueuedDrawer>

      {showDeviceModal && device && (
        <DeviceActionModal
          device={device}
          action={deviceAction}
          request={deviceActionRequest}
          preventBackdropClick
          noCloseButton
        />
      )}
    </>
  );
}
