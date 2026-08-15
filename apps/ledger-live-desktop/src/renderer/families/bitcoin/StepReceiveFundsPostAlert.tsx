import { getMainAccount } from "@ledgerhq/live-common/account/index";
import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Alert from "~/renderer/components/Alert";
import { useFeature } from "@features/platform-feature-flags";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { StepProps } from "~/renderer/modals/Receive/Body";
import { ZcashShieldedReceiveBlock } from "./ZcashShieldedReceiveBlock";

const AlertBoxContainer = styled.div`
  margin-top: 20px;
`;

const StepReceiveFundsPostAlert = (props: StepProps) => {
  const {
    account,
    parentAccount,
    device,
    isAddressVerified,
    onChangeAddressVerified,
    transitionTo,
  } = props;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  invariant(account && mainAccount, "No account given");

  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;
  const isZcash = mainAccount.currency.id === "zcash";

  return (
    <>
      {isZcash && shieldedEnabled ? (
        <ZcashShieldedReceiveBlock
          account={mainAccount as ZcashAccount}
          device={device}
          isAddressVerified={isAddressVerified}
          onChangeAddressVerified={onChangeAddressVerified}
          transitionTo={transitionTo}
        />
      ) : null}
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

export default StepReceiveFundsPostAlert;
