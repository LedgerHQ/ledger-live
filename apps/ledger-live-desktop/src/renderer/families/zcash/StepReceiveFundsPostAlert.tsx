import { getMainAccount } from "@ledgerhq/live-common/account/index";
import invariant from "invariant";
import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import { StepProps } from "~/renderer/modals/Receive/Body";
import { ZcashShieldedReceiveBlock } from "./ZcashShieldedReceiveBlock";

/** With shielded Zcash on, the receive step also offers the account's shielded address. */
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
  if (!shieldedEnabled) return null;

  return (
    <ZcashShieldedReceiveBlock
      account={mainAccount as ZcashAccount}
      device={device}
      isAddressVerified={isAddressVerified}
      onChangeAddressVerified={onChangeAddressVerified}
      transitionTo={transitionTo}
    />
  );
};

export default StepReceiveFundsPostAlert;
