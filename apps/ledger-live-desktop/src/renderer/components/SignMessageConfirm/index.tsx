import styled from "styled-components";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { Account, AccountLike, AnyMessage, MessageProperties } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import SignMessageConfirmField from "./SignMessageConfirmField";
import Spinner from "~/renderer/components/BigSpinner";
import useTheme from "~/renderer/hooks/useTheme";
import { Flex } from "@ledgerhq/react-ui";
import Text from "~/renderer/components/Text";
import { SubTitle, Title } from "~/renderer/components/DeviceAction/rendering";
import Box from "~/renderer/components/Box";
import { getLLDCoinFamily } from "~/renderer/families";
import FormattedVal from "~/renderer/components/FormattedVal";
import { getTokenUnit } from "~/renderer/utils";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { getProductName } from "~/newArch/utils/getProductName";

const FieldText = styled(Text).attrs(() => ({
  ml: 1,
  ff: "Inter|Medium",
  color: "palette.text.shade80",
  fontSize: 3,
}))`
  word-break: break-all;
  text-align: right;
`;

export type FieldComponentProps = {
  field: DeviceTransactionField;
  tokenUnit: Unit | undefined;
};

const TextField = ({ field, tokenUnit }: FieldComponentProps) => {
  return field.type === "text" ? (
    <SignMessageConfirmField label={field.label}>
      {tokenUnit ? (
        <FormattedVal
          color={"palette.text.shade80"}
          val={Number(field.value)}
          unit={tokenUnit}
          fontSize={3}
          disableRounding
          alwaysShowValue
          showCode
          inline
        />
      ) : (
        <FieldText>{field.value}</FieldText>
      )}
    </SignMessageConfirmField>
  ) : null;
};

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

const SignMessageConfirm = ({ device, account, parentAccount, signMessageRequested }: Props) => {
  const type = useTheme().colors.palette.type;
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, parentAccount);
  const { currency } = mainAccount;
  const { colors } = useTheme();
  const [messageFields, setMessageFields] = useState<MessageProperties | null>(null);
  const wording = getProductName(device.modelId);

  useEffect(() => {
    if (signMessageRequested.standard === "EIP712") {
      const specific = getLLDCoinFamily(currency.family);
      specific?.message?.getMessageProperties(signMessageRequested).then(setMessageFields);
    }
  }, [currency, mainAccount, signMessageRequested]);

  if (!device) return null;

  let fields: DeviceTransactionField[] = [];
  if (messageFields && signMessageRequested.standard !== "EIP712") {
    fields = messageFields.map(field => ({
      ...field,
      type: "text",
      value: Array.isArray(field.value) ? field.value.join(",\n") : field.value,
    }));
  }

  const f = fields?.find(f => f.label === "Token");
  const contractAddress = f && "value" in f && typeof f.value === "string" ? f.value : undefined;

  return (
    <Container>
      {!signMessageRequested.message ? (
        <Spinner size={30} />
      ) : (
        <>
          <Box style={{ width: "100%", rowGap: 10 }} mb={20}>
            {fields.map((field, i) => (
              <TextField
                key={i}
                field={field}
                tokenUnit={getTokenUnit(field.label, mainAccount, contractAddress)}
              />
            ))}
          </Box>

          {renderVerifyUnwrapped({ modelId: device.modelId, type })}
          {signMessageRequested.standard === "EIP712" ? (
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
          ) : null}
        </>
      )}
    </Container>
  );
};

const Footer = styled(Flex)`
  flex-direction: column;
  justify-content: center;
  align-content: center;
  align-items: center;
  row-gap: 16px;
`;

export default SignMessageConfirm;
