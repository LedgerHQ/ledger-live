import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { isAccountRegistrationPending } from "@ledgerhq/live-common/families/celo/logic";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { IconType } from "../../types";
import { CeloFamily } from "../types";
import Icon from "./Icon";

const AccountHeaderManageActions: CeloFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source = "Account Page",
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isRegistrationPending = isAccountRegistrationPending(account as CeloAccount);
  const onClick = useCallback(() => {
    if (isAccountEmpty(account)) {
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
  }, [account, dispatch, parentAccount, source]);
  const disabledLabel = isRegistrationPending
    ? `${t("celo.manage.titleWhenPendingRegistration")}`
    : "";
  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: (props: IconType) => <Icon {...props} isDisabled={isRegistrationPending} />,
      disabled: isRegistrationPending,
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
