import styled from "styled-components";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
import { NanoDisplayedInfoFor712 } from "~/renderer/modals/SignMessage/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
// eslint-disable-next-line no-restricted-imports
import { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import { getMessageProperties } from "~/renderer/modals/SignMessage/utils";
import SignMessageConfirmField from "./SignMessageConfirmField";
import Spinner from "~/renderer/components/BigSpinner";
import useTheme from "~/renderer/hooks/useTheme";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";

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
  signMessageRequested: TypedMessageData | MessageData;
};

const SignMessageConfirm = ({ device, account, parentAccount, signMessageRequested }: Props) => {
  const type = useTheme("colors.palette.type");
  const { t } = useTranslation();
  const { currency } = getMainAccount(account, parentAccount);
  const [inferredNanoFields, setInferredNanoFields] = useState<{
    message: string;
    fields?: NanoDisplayedInfoFor712;
  }>();

  useEffect(() => {
    getMessageProperties(currency, signMessageRequested).then(setInferredNanoFields);
  }, [currency, signMessageRequested]);

  if (!device) return null;

  let fields = [];
  if (inferredNanoFields?.fields && Array.isArray(inferredNanoFields.fields)) {
    fields = inferredNanoFields.fields.map(field => ({
      ...field,
      type: "text",
      value: Array.isArray(field.value) ? field.value.join(",\n") : field.value,
    }));
  } else {
    if ((signMessageRequested as TypedMessageData)?.hashes) {
      const { hashes } = signMessageRequested as TypedMessageData;

      if (hashes.domainHash) {
        fields.push({
          type: "text",
          label: t("SignMessageConfirm.domainHash"),
          value: hashes.domainHash,
        });
      }

      if (hashes.messageHash) {
        fields.push({
          type: "text",
          label: t("SignMessageConfirm.messageHash"),
          value: hashes.messageHash,
        });
      }

      if (hashes.stringHash) {
        fields.push({
          type: "text",
          label: t("SignMessageConfirm.stringHash"),
          value: hashes.stringHash,
        });
      }
    }

    fields.push({
      type: "text",
      label: t("SignMessageConfirm.message"),
      value:
        typeof signMessageRequested.message === "object"
          ? JSON.stringify(signMessageRequested.message)
          : signMessageRequested.message,
    });
  }

  return (
    <Container>
      {!inferredNanoFields?.message ? (
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
