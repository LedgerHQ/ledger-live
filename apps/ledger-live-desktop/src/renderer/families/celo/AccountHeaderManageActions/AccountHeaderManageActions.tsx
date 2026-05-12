import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { isAccountRegistrationPending } from "@ledgerhq/live-common/families/celo/logic";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { IconType } from "../../types";
import { CeloFamily } from "../types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";

const AccountHeaderManageActions: CeloFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source = "Account Page",
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const bridge = useAccountBridge(account, parentAccount);
  const label = useGetStakeLabelLocaleBased();
  const isRegistrationPending = isAccountRegistrationPending(account as CeloAccount);
  const onClick = useCallback(() => {
    if (bridge.isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else {
      if (account.type === "Account") {
        dispatch(
          openModal("MODAL_CELO_MANAGE", {
            account,
            source,
          }),
        );
      }
    }
  }, [account, bridge, dispatch, parentAccount, source]);
  const disabledLabel = isRegistrationPending
    ? `${t("celo.manage.titleWhenPendingRegistration")}`
    : "";
  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: (props: IconType) => <CryptoCurrencyIcon {...props} />,
      disabled: isRegistrationPending,
      label,
      tooltip: disabledLabel,
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
      accountActionsTestId: "stake-button",
    },
  ];
};
export default AccountHeaderManageActions;
