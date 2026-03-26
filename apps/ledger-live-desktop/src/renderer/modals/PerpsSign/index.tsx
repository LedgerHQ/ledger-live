import { PerpsSignResult } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Flex } from "@ledgerhq/react-ui";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import Animation from "~/renderer/animations";
import { AnimationWrapper, Title, SubTitle } from "~/renderer/components/DeviceAction/rendering";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { getProductName } from "LLD/utils/getProductName";
import useTheme from "~/renderer/hooks/useTheme";
import Text from "~/renderer/components/Text";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";

export type Data = {
  device: Device;
  sign: () => Promise<PerpsSignResult>;
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

function PerpsSignBody({
  data,
  onClose,
}: {
  data: Data;
  onClose: (() => void) | undefined;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [error, setError] = useState<Error | null>(null);
  const { device } = data;
  const productName = getProductName(device.modelId);

  useEffect(() => {
    let cancelled = false;

    data
      .sign()
      .then(result => {
        if (cancelled) return;
        data.onSuccess(result);
        onClose?.();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        data.onError(e);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (!error) {
      data.onCancel();
    }
    onClose?.();
  };

  return (
    <ModalBody
      onClose={handleClose}
      render={() => (
        <Box alignItems="center" py={20} px={20}>
          {error ? (
            <Flex flexDirection="column" alignItems="center" py={20}>
              <ErrorDisplay error={error} />
            </Flex>
          ) : (
            <>
              <DeviceBlocker />
              <AnimationWrapper>
                <Animation animation={getDeviceAnimation(device.modelId, theme, "sign")} />
              </AnimationWrapper>
              {device.deviceName ? (
                <DeviceNameTag>{device.deviceName}</DeviceNameTag>
              ) : null}
              <Flex flexDirection="column" alignItems="center" rowGap={8} mt={4}>
                <Title>
                  {t("SignMessageConfirm.title", { wording: productName })}
                </Title>
                <SubTitle>
                  {t("SignMessageConfirm.description")}
                </SubTitle>
              </Flex>
            </>
          )}
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
