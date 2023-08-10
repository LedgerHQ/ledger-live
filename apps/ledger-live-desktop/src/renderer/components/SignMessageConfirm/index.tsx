import styled from "styled-components";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { Account, AccountLike, AnyMessage } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import SignMessageConfirmField from "./SignMessageConfirmField";
import Spinner from "~/renderer/components/BigSpinner";
import useTheme from "~/renderer/hooks/useTheme";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import { getLLDCoinFamily } from "~/renderer/families";
import { MessageProperties } from "~/renderer/families/types";

const FieldText = styled(Text).attrs(() => ({
  ml: 1,
  ff: "Inter|Medium",
  color: "palette.text.shade80",
  fontSize: 3,
}))`
  word-break: break-all;
  text-align: right;
  max-width: 50%;
`;

export type FieldComponentProps = {
  account: AccountLike;
  field: DeviceTransactionField;
};

export type FieldComponent = React.ComponentType<FieldComponentProps>;

const TextField = ({ field }: FieldComponentProps) => {
  return field.type === "text" ? (
    <SignMessageConfirmField label={field.label}>
      <FieldText>{field.value}</FieldText>
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
  const [messageFields, setMessageFields] = useState<MessageProperties | null>(null);

  useEffect(() => {
    if (signMessageRequested.standard === "EIP712") {
      const specific = getLLDCoinFamily(currency.family);
      specific?.message?.getMessageProperties(signMessageRequested).then(setMessageFields);
    }
  }, [currency, mainAccount, signMessageRequested]);

  if (!device) return null;

  let fields: DeviceTransactionField[] = [];
  if (messageFields) {
    fields = messageFields.map(field => ({
      ...field,
      type: "text",
      value: Array.isArray(field.value) ? field.value.join(",\n") : field.value,
    }));
  } else {
    if (signMessageRequested.standard === "EIP712") {
      fields.push({
        type: "text",
        label: t("SignMessageConfirm.domainHash"),
        value: signMessageRequested.domainHash,
      });

      fields.push({
        type: "text",
        label: t("SignMessageConfirm.messageHash"),
        value: signMessageRequested.hashStruct,
      });
    } else {
      fields.push({
        type: "text",
        label: t("SignMessageConfirm.message"),
        value: signMessageRequested.message,
      });
    }
  }

  return (
    <Container>
      {!signMessageRequested.message ? (
        <Spinner size={30} />
      ) : (
        <>
          <Box style={{ width: "100%" }} px={30} mb={20}>
            {fields.map((field, i) => {
              return <TextField key={i} field={field} account={account} />;
            })}
          </Box>

          {renderVerifyUnwrapped({ modelId: device.modelId, type })}
        </>
      )}
    </Container>
  );
};

export default SignMessageConfirm;
