import React, { useState, useCallback } from "react";
import { Button, Flex, Drawer, Divider, Text, Input, Icons, BoxedIcon } from "@ledgerhq/react-ui";
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
const action = createAction(renameDevice);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  deviceName: string;
  onSuccess: () => void;
  onSetName: (name: string) => void;
  device: Device;
};

const EditDeviceName: React.FC<Props> = ({
  isOpen,
  onClose,
  deviceName,
  onSetName,
  device,
}: Props) => {
  const { t } = useTranslation();
  const productName = device ? getDeviceModel(device.modelId).productName : null;
  const [name, setName] = useState<string>(deviceName);
  const [completed, setCompleted] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined | null>(null);
  const [running, setRunning] = useState(false);
  const disableButton = running || (!running && deviceName === name);

  const onCloseDrawer = useCallback(() => {
    onClose();
    setRunning(false);
    if (completed) onSetName(name);
  }, [completed, name, onClose, onSetName]);

  const onChangeText = useCallback((name: string) => {
    // eslint-disable-next-line no-control-regex
    const invalidCharacters = name.replace(/[\x00-\x7F]*/g, "");
    const maybeError = invalidCharacters
      ? new DeviceNameInvalid("", { invalidCharacters })
      : undefined;

    setError(maybeError);
    setName(name);
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
  }, []);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onCloseDrawer}
      extraContainerProps={{ p: 0 }}
      title={t("deviceRename.title", { productName })}
      big
    >
      <Flex flex={1} flexDirection="column" justifyContent="space-between">
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
              fontSize={24}
            >
              {t("deviceRename.renamed", {
                productName,
                name,
              })}
            </Text>
          </Flex>
        ) : running ? (
          <DeviceAction
            device={device}
            request={name}
            action={action}
            onClose={onClose}
            onResult={onSuccess}
          />
        ) : (
          <Flex px={12} flexDirection="column">
            <Box flow={1} mb={5}>
              <Label htmlFor="currentDeviceName">{t("deviceRename.chooseName")}</Label>
              <Input
                autoFocus
                data-test-id="current-device-name-input"
                onChange={onChangeText}
                value={name}
                placeholder={t("deviceRename.placeholder")}
                error={error && <TranslatedError error={error} field="title" noLink />}
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
    </Drawer>
  );
};

export default EditDeviceName;
