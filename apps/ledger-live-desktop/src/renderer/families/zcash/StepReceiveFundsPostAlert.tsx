import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isZcashCurrencyId } from "@ledgerhq/live-common/bridge/zcashRouting";
import invariant from "invariant";
import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import { StepProps } from "~/renderer/modals/Receive/Body";
import { ZcashShieldedReceiveBlock } from "./ZcashShieldedReceiveBlock";

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
  const isZcash = isZcashCurrencyId(mainAccount.currency.id);

  return isZcash && shieldedEnabled ? (
    <ZcashShieldedReceiveBlock
      account={mainAccount as ZcashAccount}
      device={device}
      isAddressVerified={isAddressVerified}
      onChangeAddressVerified={onChangeAddressVerified}
      transitionTo={transitionTo}
    />
  ) : null;
};

export default StepReceiveFundsPostAlert;
