import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { SubAccount } from "@ledgerhq/types-live";
import {
  hasExternalController,
  hasExternalStash,
  hasPendingOperationType,
} from "@ledgerhq/live-common/families/polkadot/logic";
import { isAccountEmpty, getMainAccount } from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";

type Props = {
  account: PolkadotAccount | SubAccount;
  parentAccount: PolkadotAccount | undefined | null;
  source?: string;
};

const AccountHeaderManageActions = ({ account, parentAccount, source = "Account Page" }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
  const { polkadotResources } = mainAccount;
  const hasBondedBalance = polkadotResources.lockedBalance && polkadotResources.lockedBalance.gt(0);
  const hasPendingBondOperation = hasPendingOperationType(mainAccount, "BOND");

  const onClick = useCallback(() => {
    if (isAccountEmpty(mainAccount)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account: mainAccount,
        }),
      );
    } else if (hasBondedBalance || hasPendingBondOperation) {
      dispatch(
        openModal("MODAL_POLKADOT_MANAGE", {
          account: mainAccount,
          source,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_POLKADOT_REWARDS_INFO", {
          account: mainAccount,
        }),
      );
    }
  }, [mainAccount, hasBondedBalance, hasPendingBondOperation, dispatch, source]);

  const _hasExternalController = hasExternalController(mainAccount);
  const _hasExternalStash = hasExternalStash(mainAccount);
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
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};

export default AccountHeaderManageActions;
