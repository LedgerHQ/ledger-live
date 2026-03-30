import { PerpsSignResult } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Flex } from "@ledgerhq/react-ui";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import Animation from "~/renderer/animations";
import { AnimationWrapper, Title, SubTitle } from "~/renderer/components/DeviceAction/rendering";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import DeviceAction from "~/renderer/components/DeviceAction";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { getProductName } from "LLD/utils/getProductName";
import useTheme from "~/renderer/hooks/useTheme";
import Text from "~/renderer/components/Text";

export type Data = {
  appName: string | undefined;
  appOptions?: {
    requireLatestFirmware: boolean;
    allowPartialDependencies: boolean;
    skipAppInstallIfNotFound: boolean;
  };
  signFactory: (device: Device) => Promise<PerpsSignResult>;
  onSuccess: (result: PerpsSignResult) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
};

const DeviceNameTag = styled(Text).attrs({
  ff: "Inter|SemiBold",
  fontSize: 2,
  color: "neutral.c70",
})`
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  margin-top: 8px;
  margin-bottom: 4px;
`;

function SigningPhase({
  device,
  signFactory,
  onSuccess,
  onError,
  onCancel,
  onClose,
}: {
  device: Device;
  signFactory: (device: Device) => Promise<PerpsSignResult>;
  onSuccess: (result: PerpsSignResult) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
  onClose: (() => void) | undefined;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const productName = getProductName(device.modelId);

  useEffect(() => {
    let cancelled = false;

    signFactory(device)
      .then(result => {
        if (cancelled) return;
        onSuccess(result);
        onClose?.();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        onError(e);
        onClose?.();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = () => {
    onCancel();
    onClose?.();
  };

  return (
    <ModalBody
      onClose={handleClose}
      render={() => (
        <Box alignItems="center" py={20} px={20}>
          <DeviceBlocker />
          <AnimationWrapper>
            <Animation animation={getDeviceAnimation(device.modelId, theme, "sign")} />
          </AnimationWrapper>
          {device.deviceName ? <DeviceNameTag>{device.deviceName}</DeviceNameTag> : null}
          <Flex flexDirection="column" alignItems="center" rowGap={8} mt={4}>
            <Title>{t("SignMessageConfirm.title", { wording: productName })}</Title>
            <SubTitle>{t("SignMessageConfirm.description")}</SubTitle>
          </Flex>
        </Box>
      )}
    />
  );
}

function PerpsSignBody({ data, onClose }: { data: Data; onClose: (() => void) | undefined }) {
  const [device, setDevice] = useState<Device | null>(null);
  const action = useConnectAppAction();
  const request = useMemo(
    () => ({
      appName: data.appName,
      requireLatestFirmware: data.appOptions?.requireLatestFirmware,
      allowPartialDependencies: data.appOptions?.allowPartialDependencies,
      skipAppInstallIfNotFound: data.appOptions?.skipAppInstallIfNotFound,
    }),
    [data.appName, data.appOptions],
  );

  if (device) {
    return (
      <SigningPhase
        device={device}
        signFactory={data.signFactory}
        onSuccess={data.onSuccess}
        onError={data.onError}
        onCancel={data.onCancel}
        onClose={onClose}
      />
    );
  }

  return (
    <ModalBody
      onClose={() => {
        data.onCancel();
        onClose?.();
      }}
      render={() => (
        <Box alignItems="center" px={32}>
          <DeviceAction
            action={action}
            request={request}
            onResult={(result: AppResult) => {
              setDevice(result.device);
            }}
          />
        </Box>
      )}
    />
  );
}

export default function PerpsSign() {
  return (
    <Modal
      name="MODAL_PERPS_SIGNING"
      centered
      preventBackdropClick
      render={({ data, onClose }) => <PerpsSignBody data={data} onClose={onClose} />}
    />
  );
}
