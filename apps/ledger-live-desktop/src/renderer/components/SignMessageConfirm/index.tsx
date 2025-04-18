import styled from "styled-components";
import { useTranslation } from "react-i18next";
import React from "react";
import { Account, AccountLike, AnyMessage } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import { SubTitle, Title } from "~/renderer/components/DeviceAction/rendering";
import Spinner from "~/renderer/components/BigSpinner";
import useTheme from "~/renderer/hooks/useTheme";
import { Flex } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";

export type FieldComponentProps = {
  field: DeviceTransactionField;
  tokenUnit: Unit | undefined;
};

export type FieldComponent = React.ComponentType<FieldComponentProps>;

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  pb: 4,
}))``;

type Props = {
  device: Device;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  signMessageRequested: AnyMessage;
};

const getProductName = (modelId: DeviceModelId) =>
  getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;

const SignMessageConfirm = ({ device, signMessageRequested }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = colors.palette.type;
  const wording = getProductName(device.modelId);

  if (!device) return null;

  return (
    <Container>
      {!signMessageRequested.message ? (
        <Spinner size={30} />
      ) : (
        <>
          <AnimationWrapper>
            <Animation animation={getDeviceAnimation(device.modelId, theme, "openApp")} />
          </AnimationWrapper>
          <Footer>
            <Title
              fontWeight="semiBold"
              style={{ color: colors.neutral.c100 }}
              textAlign="center"
              fontSize={20}
            >
              {t("SignMessageConfirm.title", { wording })}
            </Title>
            <SubTitle
              variant="bodyLineHeight"
              color="palette.text.shade100"
              textAlign="center"
              fontSize={14}
            >
              {t("SignMessageConfirm.description")}
            </SubTitle>
          </Footer>
        </>
      )}
    </Container>
  );
};

export const AnimationWrapper = styled.div`
  width: 600px;
  max-width: 100%;
  padding-bottom: 20px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Footer = styled(Flex)`
  flex-direction: column;
  justify-content: center;
  align-content: center;
  align-items: center;
  row-gap: 16px;
`;

export default SignMessageConfirm;
