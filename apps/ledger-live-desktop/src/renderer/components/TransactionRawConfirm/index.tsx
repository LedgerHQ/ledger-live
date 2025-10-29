import React from "react";
import styled from "styled-components";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import Animation from "~/renderer/animations";
import Box from "~/renderer/components/Box";
import useTheme from "~/renderer/hooks/useTheme";
import ConfirmFooter from "./ConfirmFooter";
import { getDeviceAnimation } from "../DeviceAction/animations";
import { DeviceBlocker } from "../DeviceAction/DeviceBlocker";
import ConfirmAlert from "./ConfirmAlert";
import ConfirmTitle from "./ConfirmTitle";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  pb: 4,
}))``;

type Props = {
  device: Device;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  transaction: string;
  manifestId?: string | null;
  manifestName?: string | null;
};
const TransactionConfirm = ({
  device,
  account,
  parentAccount,
  transaction,
  manifestId,
  manifestName,
}: Props) => {
  const type = useTheme().colors.palette.type;

  if (!device) return null;

  return (
    <Container style={{ paddingBottom: 0 }}>
      <Container paddingX={26}>
        <DeviceBlocker />
        <Animation animation={getDeviceAnimation(device.modelId, type, "verify")} />
        <ConfirmTitle account={account} parentAccount={parentAccount} transaction={transaction} />
        <ConfirmAlert transaction={transaction} />
      </Container>
      <ConfirmFooter
        transaction={transaction}
        manifestId={manifestId}
        manifestName={manifestName}
      />
    </Container>
  );
};
export default TransactionConfirm;
