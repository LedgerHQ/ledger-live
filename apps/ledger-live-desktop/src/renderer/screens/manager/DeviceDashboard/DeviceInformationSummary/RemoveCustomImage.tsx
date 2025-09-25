import React, { useCallback, useMemo, useState } from "react";
import { Button, Divider, Flex, Icons, Text } from "@ledgerhq/react-ui";
import { useDispatch } from "react-redux";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/hw/actions/customLockScreenRemove";
import removeImage from "@ledgerhq/live-common/hw/customLockScreenRemove";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { useTranslation } from "react-i18next";
import { clearLastSeenCustomImage } from "~/renderer/actions/settings";
import { ImageDoesNotExistOnDevice } from "@ledgerhq/live-common/errors";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

const action = createAction(removeImage);

type Props = { onClose: () => void; onRemoved?: () => void };

const RemoveCustomImage: React.FC<Props> = ({ onClose, onRemoved }) => {
  const request = useMemo(() => ({}), []);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [completed, setCompleted] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [running, setRunning] = useState(true);

  const onRetry = useCallback(() => {
    setError(null);
    setNonce(currentNonce => currentNonce + 1);
  }, []);

  const onSuccess = useCallback(() => {
    setError(null);
    setCompleted(true);
    setRunning(false);
    dispatch(clearLastSeenCustomImage());
    onRemoved && onRemoved();
  }, [dispatch, onRemoved]);

  const onError = useCallback(
    (error: Error) => {
      setError(error);
      if (error instanceof ImageDoesNotExistOnDevice) {
        dispatch(clearLastSeenCustomImage());
      }
    },
    [dispatch],
  );

  const showRetry = error && !(error instanceof ImageDoesNotExistOnDevice);

  return (
    <Flex
      flexDirection="column"
      key={`${nonce}-removeDeviceImage`}
      rowGap={5}
      height="100%"
      overflowY="hidden"
      width="100%"
      flex={1}
      data-testid="device-remove-image-container"
    >
      <Text alignSelf="center" variant="h5Inter" mb={3}>
        {t("removeCustomLockscreen.title")}
      </Text>
      <Flex
        flex={1}
        px={12}
        flexDirection="column"
        justifyContent="space-between"
        overflowY="hidden"
      >
        {completed ? (
          <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center">
            <Flex
              width={72}
              height={72}
              borderRadius={100}
              bg="opacityDefault.c05"
              alignItems="center"
              justifyContent="center"
            >
              <Icons.CheckmarkCircleFill color="success.c70" size="L" />
            </Flex>
            <Text variant="h5Inter" alignSelf="stretch" mt={9} textAlign="center">
              {t("removeCustomLockscreen.success")}
            </Text>
          </Flex>
        ) : running ? (
          <Flex flex={1} alignItems="center" justifyContent="center" p={2}>
            <DeviceAction
              inlineRetry={false}
              request={request}
              action={action}
              onResult={onSuccess}
              onError={onError}
              location={HOOKS_TRACKING_LOCATIONS.managerDashboard}
            />
          </Flex>
        ) : null}
      </Flex>
      {!running || (running && error) || completed ? (
        <Flex flexDirection="column" alignSelf="stretch">
          <Divider />
          <Flex
            px={12}
            alignSelf="stretch"
            flexDirection="row"
            justifyContent="space-between"
            pt={6}
            pb={1}
          >
            {showRetry ? (
              <Button
                data-testid="retry-device-custom-image-removal-button"
                variant="main"
                outline
                onClick={onRetry}
                disabled={!running}
              >
                {t(`common.retry`)}
              </Button>
            ) : (
              <Flex flex={1} />
            )}
            <Button
              variant="main"
              data-testid="close-device-custom-image-removal-button"
              onClick={onClose}
              disabled={running && !error}
            >
              {t(`common.close`)}
            </Button>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
};

export default withV3StyleProvider(RemoveCustomImage);
