import { useCallback } from "react";
import invariant from "invariant";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import {
  hasExternalController,
  hasExternalStash,
  hasPendingOperationType,
} from "@ledgerhq/live-common/families/polkadot/logic";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
type Props = {
  account: Account;
  parentAccount: Account | undefined | null;
};
const AccountHeaderManageActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { polkadotResources } = account;
  invariant(polkadotResources, "polkadot account expected");
  const hasBondedBalance = polkadotResources.lockedBalance && polkadotResources.lockedBalance.gt(0);
  const hasPendingBondOperation = hasPendingOperationType(account, "BOND");
  const onClick = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else if (hasBondedBalance || hasPendingBondOperation) {
      dispatch(
        openModal("MODAL_POLKADOT_MANAGE", {
          account,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_POLKADOT_REWARDS_INFO", {
          account,
        }),
      );
    }
  }, [account, hasBondedBalance, hasPendingBondOperation, dispatch, parentAccount]);
  const _hasExternalController = hasExternalController(account);
  const _hasExternalStash = hasExternalStash(account);
  const manageEnabled = !(
    _hasExternalController ||
    _hasExternalStash ||
    (!hasBondedBalance && hasPendingBondOperation)
  );
  const disabledLabel = manageEnabled
    ? ""
    : `${t(
        _hasExternalController
          ? "polkadot.nomination.externalControllerTooltip"
          : _hasExternalStash
          ? "polkadot.nomination.externalStashTooltip"
          : "polkadot.nomination.hasPendingBondOperation",
      )}`;
  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      disabled: !manageEnabled,
      label: t("account.stake"),
      tooltip: disabledLabel,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};
export default AccountHeaderManageActions;
