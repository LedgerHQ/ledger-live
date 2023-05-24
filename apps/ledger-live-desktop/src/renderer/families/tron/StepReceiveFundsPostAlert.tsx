import { getMainAccount } from "@ledgerhq/live-common/account/index";
import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Alert from "~/renderer/components/Alert";
import { StepProps } from "~/renderer/modals/Receive/Body";
import { urls } from "~/config/urls";

const AlertBoxContainer = styled.div`
  margin-top: 20px;
`;

const StepReceiveFunds = (props: StepProps) => {
  const { account, parentAccount } = props;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  invariant(account && mainAccount, "No account given");

  return (
    <>
      {mainAccount.operationsCount === 0 ? (
        <AlertBoxContainer>
          <Alert type="warning" learnMoreUrl={urls.errors.TronSendTrc20ToNewAccountForbidden}>
            <Trans i18nKey="tron.receive.newAddressTRC20" />
          </Alert>
        </AlertBoxContainer>
      ) : null}
    </>
  );
};
export default StepReceiveFunds;
