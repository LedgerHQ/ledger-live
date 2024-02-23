import React, { useMemo } from "react";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { Account, AccountLike, TransactionCommon } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import Animation from "~/renderer/animations";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Alert from "~/renderer/components/Alert";
import useTheme from "~/renderer/hooks/useTheme";
import { DeviceBlocker } from "../DeviceAction/DeviceBlocker";
import { getDeviceAnimation } from "../DeviceAction/animations";
import ConfirmApprovalFooter from "./ConfirmFooter";
import { Container, FieldComponent } from ".";

type Props = {
  t: TFunction;
  Footer:
    | React.ComponentType<{
        transaction: TransactionCommon;
      }>
    | undefined;
  device: Device;
  deviceFields: DeviceTransactionField[];
  fieldComponents: Record<string, FieldComponent>;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  recipientWording: string;
  transaction: Transaction;
  status: TransactionStatus;
  manifestId?: string | null;
  manifestName?: string | null;
};

const ConfirmApproval = ({
  t,
  account,
  parentAccount,
  recipientWording,
  Footer,
  device,
  deviceFields: fields,
  fieldComponents,
  transaction,
  status,
  manifestId,
  manifestName,
}: Props) => {
  const type = useTheme().colors.palette.type;

  const amountTransaction: string = useMemo(
    () =>
      (
        fields.find(
          (field: { label: string }) => field.label && field.label === "Amount",
        ) as DeviceTransactionField & { value: string }
      )?.value || "",
    [fields],
  );

  return (
    <Container style={{ paddingBottom: 0 }}>
      <Container paddingX={26}>
        <DeviceBlocker />
        <Animation animation={getDeviceAnimation(device.modelId, type, "verify")} />
        <Text ff={"Inter|Medium"} textAlign={"center"} fontSize={22} marginBottom={12}>
          {t("approve.description")}
        </Text>
        <Alert type="primary" mb={26}>
          <Trans
            i18nKey={
              amountTransaction.includes("Unlimited") ? "approve.unlimited" : "approve.limited"
            }
            values={{
              recipientWording,
            }}
          />
        </Alert>
        <Box
          style={{
            width: "100%",
          }}
          mb={20}
        >
          {fields.map((field, i) => {
            const MaybeComponent = fieldComponents[field.type];
            if (!MaybeComponent) {
              console.log(
                `TransactionConfirm field ${field.type} is not implemented! add a generic implementation in components/TransactionConfirm.js or inside families/*/TransactionConfirmFields.js`,
              );
              return null;
            }
            return (
              <MaybeComponent
                key={i}
                field={field}
                account={account}
                parentAccount={parentAccount}
                transaction={transaction}
                status={status}
              />
            );
          })}
        </Box>
      </Container>
      <ConfirmApprovalFooter
        transaction={transaction}
        Footer={Footer}
        manifestId={manifestId}
        manifestName={manifestName}
      />
    </Container>
  );
};

export default withTranslation()(ConfirmApproval);
