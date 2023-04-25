import { getMainAccount } from "@ledgerhq/live-common/account/index";
import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Alert from "~/renderer/components/Alert";
import { StepProps } from "~/renderer/modals/Receive/Body";

const AlertBoxContainer = styled.div`
  margin-top: 20px;
`;

const StepReceiveFunds = (props: StepProps) => {
  const { account, parentAccount } = props;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  invariant(account && mainAccount, "No account given");

  return (
    <>
      {mainAccount.currency.id === "dash" ? (
        <AlertBoxContainer>
          <Alert type="warning">
            <Trans i18nKey="currentAddress.dashStakingWarning" />
          </Alert>
        </AlertBoxContainer>
      ) : null}
      {mainAccount.derivationMode === "taproot" ? (
        <AlertBoxContainer>
          <Alert type="warning">
            <Trans i18nKey="currentAddress.taprootWarning" />
          </Alert>
        </AlertBoxContainer>
      ) : null}
    </>
  );
};
export default StepReceiveFunds;
