import invariant from "invariant";
import React from "react";
import styled from "styled-components";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import type {
  AleoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/aleo/types";
import Text from "~/renderer/components/Text";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import type { FieldComponentProps } from "../types";
import type { AleoFamily } from "./types";

const AddressText = styled(Text).attrs(() => ({
  ml: 1,
  ff: "Inter|Medium",
  color: "neutral.c80",
  fontSize: 3,
}))`
  text-align: right;
  max-width: 50%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: normal;
`;

type AleoFieldComponentProps = FieldComponentProps<AleoAccount, Transaction, TransactionStatus>;

const AleoAddressField = ({ field }: AleoFieldComponentProps) => {
  invariant(field.type === "address", "AleoAddressField invalid");

  return (
    <TransactionConfirmField label={field.label}>
      <AddressText title={field.address}>{shortAddressPreview(field.address)}</AddressText>
    </TransactionConfirmField>
  );
};

const transactionConfirmFields: AleoFamily["transactionConfirmFields"] = {
  fieldComponents: {
    address: AleoAddressField,
  },
};

export default transactionConfirmFields;
