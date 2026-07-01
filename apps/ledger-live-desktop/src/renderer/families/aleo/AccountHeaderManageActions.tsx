import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/actions/modals";
import IconTransfer from "~/renderer/icons/Transfer";
import IconCoins from "~/renderer/icons/Coins";
import type { AleoFamily } from "./types";
import { AleoCustomModal } from "./constants";

const AccountHeaderActions: AleoFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const bridge = useAccountBridge(account, parentAccount);
  const isSelfTransferDisabled = bridge.isAccountEmpty(account);

  const onClick = () => {
    dispatch(openModal(AleoCustomModal.SELF_TRANSFER, { account, parentAccount }));
  };

  const onManage = () => {
    const mainAccount = getMainAccount(account, parentAccount);
    dispatch(
      openModal(AleoCustomModal.MANAGE, {
        account: mainAccount,
        parentAccount: parentAccount ?? undefined,
      }),
    );
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
    {
      key: "AleoBond",
      onClick: onManage,
      icon: IconCoins,
      disabled: isSelfTransferDisabled,
      label: t("aleo.manage.headerAction"),
      event: "button_clicked2",
      eventProperties: { button: "aleo-manage" },
      accountActionsTestId: "stake-button",
    },
  ];
};

export default AccountHeaderActions;
