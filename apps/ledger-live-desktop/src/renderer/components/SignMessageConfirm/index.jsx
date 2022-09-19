// @flow

import invariant from "invariant";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  isEIP712Message,
  getNanoDisplayedInfosFor712,
} from "@ledgerhq/live-common/families/ethereum/hw-signMessage";
import type { AccountLike } from "@ledgerhq/types-live";
import type { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import type { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
import type { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import useTheme from "~/renderer/hooks/useTheme";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import SignMessageConfirmField from "./SignMessageConfirmField";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

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
  account: AccountLike,
  field: DeviceTransactionField,
};

export type FieldComponent = React$ComponentType<FieldComponentProps>;

const TextField = ({ field }: FieldComponentProps) => {
  invariant(field.type === "text", "TextField invalid");
  return (
    <SignMessageConfirmField label={field.label}>
      <FieldText>{field.value}</FieldText>
    </SignMessageConfirmField>
  );
};

const Container: ThemedComponent<*> = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  pb: 4,
}))``;

type Props = {
  device: Device,
  account: AccountLike,
  signMessageRequested: TypedMessageData | MessageData,
};

const SignMessageConfirm = ({ device, account, signMessageRequested }: Props) => {
  const type = useTheme("colors.palette.type");
  const { t } = useTranslation();

  if (!device) return null;
  const inferredNanoFields = (() => {
    try {
      if (account.currency.family === "ethereum") {
        const parsedMessage =
          typeof signMessageRequested.message === "string"
            ? JSON.parse(signMessageRequested.message)
            : signMessageRequested.message;

        return isEIP712Message(signMessageRequested.message)
          ? getNanoDisplayedInfosFor712(parsedMessage)
          : null;
      }
      throw new Error();
    } catch (e) {
      return null;
    }
  })();

  let fields = [];
  if (Array.isArray(inferredNanoFields)) {
    fields = inferredNanoFields.map(field => ({
      ...field,
      type: "text",
      value: Array.isArray(field.value) ? field.value.join(",\n") : field.value,
    }));
  } else {
    const { hashes, message } = signMessageRequested;
    if (hashes && hashes.domainHash) {
      fields.push({
        type: "text",
        label: t("SignMessageConfirm.domainHash"),
        // $FlowFixMe
        value: hashes.domainHash,
      });
    }
    if (hashes && hashes.messageHash) {
      fields.push({
        type: "text",
        label: t("SignMessageConfirm.messageHash"),
        // $FlowFixMe
        value: hashes.messageHash,
      });
    }
    if (hashes && hashes.stringHash) {
      fields.push({
        type: "text",
        label: t("SignMessageConfirm.stringHash"),
        // $FlowFixMe
        value: hashes.stringHash,
      });
    }
    fields.push({
      type: "text",
      label: t("SignMessageConfirm.message"),
      value: message,
    });
  }

  return (
    <Container>
      <Box style={{ width: "100%" }} px={30} mb={20}>
        {fields.map((field, i) => {
          return <TextField key={i} field={field} account={account} />;
        })}
      </Box>

      {renderVerifyUnwrapped({ modelId: device.modelId, type })}
    </Container>
  );
};

export default SignMessageConfirm;
