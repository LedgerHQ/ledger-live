import React, { useState, useCallback } from "react";
import { Button, Flex, Divider, Text, Input, Icons, BoxedIcon } from "@ledgerhq/react-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTranslation } from "react-i18next";
import { DeviceNameInvalid } from "@ledgerhq/errors";
import Label from "~/renderer/components/Label";
import TranslatedError from "~/renderer/components/TranslatedError";
import Box from "~/renderer/components/Box";
import { getDeviceModel } from "@ledgerhq/devices";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/hw/actions/renameDevice";
import renameDevice from "@ledgerhq/live-common/hw/renameDevice";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import styled from "styled-components";

const action = createAction(renameDevice);
const MAX_DEVICE_NAME = 20;

type Props = {
  onClose: () => void;
  deviceName: string;
  onSetName: (name: string) => void;
  device: Device;
};

const TextEllipsis = styled.div`
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EditDeviceName: React.FC<Props> = ({ onClose, deviceName, onSetName, device }: Props) => {
  const { t } = useTranslation();
  const productName = device ? getDeviceModel(device.modelId).productName : null;
  const [name, setName] = useState<string>(deviceName);
  const [completed, setCompleted] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined | null>(null);
  const [running, setRunning] = useState(false);
  const disableButton = running || (!completed && (deviceName === name || !name.trim() || error));

  const onCloseDrawer = useCallback(() => {
    onClose();
    setRunning(false);
  }, [onClose]);

  const onChangeText = useCallback((name: string) => {
    // eslint-disable-next-line no-control-regex
    const invalidCharacters = name.replace(/[\x00-\x7F]*/g, "");
    const maybeError = invalidCharacters
      ? new DeviceNameInvalid("", { invalidCharacters })
      : undefined;

    setError(maybeError);
    setName(name.slice(0, MAX_DEVICE_NAME));
  }, []);

  const onSubmit = useCallback(async () => {
    setRunning(true);
    if (deviceName !== name) {
      setName(name.trim());
    } else {
      onClose();
    }
  }, [deviceName, name, onClose]);

  const onSuccess = useCallback(() => {
    setCompleted(true);
    setRunning(false);
    onSetName(name);
  }, [onSetName, name]);

  const remainingCharacters = MAX_DEVICE_NAME - name.length;

  return (
    <Flex
      flexDirection="column"
      rowGap={5}
      height="100%"
      overflowY="hidden"
      width="100%"
      flex={1}
      data-test-id="device-rename-container"
    >
      <Flex flex={1} flexDirection="column" justifyContent="space-between" overflowY="hidden">
        {completed ? (
          <Flex
            flex={1}
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            data-test-id="language-installed"
          >
            <BoxedIcon
              Icon={Icons.CheckAloneMedium}
              iconColor="success.c100"
              size={64}
              iconSize={24}
            />
            <Text
              variant="large"
              alignSelf="stretch"
              mx={16}
              mt={10}
              textAlign="center"
              fontSize={22}
            >
              <TextEllipsis>
                {t("deviceRename.renamed", {
                  productName,
                  name,
                })}
              </TextEllipsis>
            </Text>
          </Flex>
        ) : running ? (
          <Flex flex={1} alignItems="center" justifyContent="center" p={2}>
            <DeviceAction
              device={device}
              request={name}
              action={action}
              onClose={onClose}
              onResult={onSuccess}
            />
          </Flex>
        ) : (
          <Flex px={5} flexDirection="column">
            <Text alignSelf="center" variant="h3Inter" mb={3}>
              {t("deviceRename.title", { productName })}
            </Text>
            <Box flow={1} mb={5} p={5}>
              <Label mb={10} htmlFor="currentDeviceName">
                {t("deviceRename.chooseName")}
              </Label>
              <Input
                data-test-id="current-device-name-input"
                onChange={onChangeText}
                value={name}
                placeholder={t("deviceRename.placeholder")}
                error={error && <TranslatedError error={error} field="title" noLink />}
                info={t("deviceRename.remainingCharacters", { remainingCharacters })}
              />
            </Box>
          </Flex>
        )}
        {(!running || completed) && (
          <Flex flexDirection="column" rowGap={8}>
            <Divider variant="light" />
            <Flex alignSelf="end" px={12} pb={8}>
              <Button
                variant="main"
                onClick={completed ? onCloseDrawer : onSubmit}
                disabled={disableButton}
              >
                {completed ? t(`common.close`) : t(`common.continue`)}
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(EditDeviceName);
