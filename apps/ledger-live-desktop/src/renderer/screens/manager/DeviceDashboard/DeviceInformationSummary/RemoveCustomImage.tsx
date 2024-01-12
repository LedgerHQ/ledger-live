import React, { useCallback, useMemo, useState } from "react";
import { BoxedIcon, Button, Divider, Flex, IconsLegacy, Text } from "@ledgerhq/react-ui";
import { useDispatch } from "react-redux";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/hw/actions/staxRemoveImage";
import removeImage from "@ledgerhq/live-common/hw/staxRemoveImage";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { clearLastSeenCustomImage } from "~/renderer/actions/settings";
import { ImageDoesNotExistOnDevice } from "@ledgerhq/live-common/errors";

const action = createAction(removeImage);

const TextEllipsis = styled.div`
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

type Props = { onClose?: () => void };

const RemoveCustomImage: React.FC<Props> = ({ onClose }) => {
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
  }, [dispatch]);

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
      data-test-id="device-remove-image-container"
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
          <Flex
            flex={1}
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            data-test-id="custom-image-removed"
          >
            <BoxedIcon
              Icon={IconsLegacy.CheckAloneMedium}
              iconColor="success.c100"
              size={64}
              iconSize={24}
            />
            <Text variant="large" alignSelf="stretch" mt={9} textAlign="center">
              <TextEllipsis>{t("removeCustomLockscreen.success")}</TextEllipsis>
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
            pt={4}
            pb={1}
          >
            {showRetry ? (
              <Button
                data-test-id="retry-device-custom-image-removal-button"
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
              data-test-id="close-device-custom-image-removal-button"
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
