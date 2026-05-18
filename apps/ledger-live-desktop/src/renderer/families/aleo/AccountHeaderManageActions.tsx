import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { openModal } from "~/renderer/actions/modals";
import IconTransfer from "~/renderer/icons/Transfer";
import type { AleoFamily } from "./types";
import { AleoCustomModal } from "./constants";

const AccountHeaderActions: AleoFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const bridge = useAccountBridge(account, parentAccount);

  if (account.type !== "Account") {
    return [];
  }

  const isSelfTransferDisabled = bridge.isAccountEmpty(account);

  const onClick = () => {
    dispatch(openModal(AleoCustomModal.SELF_TRANSFER, { account }));
  };

  return [
    {
      key: "Self transfer",
      onClick: onClick,
      icon: IconTransfer,
      disabled: isSelfTransferDisabled,
      tooltip: isSelfTransferDisabled ? t("aleo.selfTransfer.headerActionTooltip") : undefined,
      label: t("aleo.selfTransfer.headerAction"),
      event: "button_clicked2",
      eventProperties: { button: "aleo-self-transfer" },
      accountActionsTestId: "self-transfer-button",
    },
  ];
};

export default AccountHeaderActions;
