import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { openModal } from "~/renderer/actions/modals";
import IconTransfer from "~/renderer/icons/Transfer";
import IconCoins from "~/renderer/icons/Coins";
import type { AleoFamily } from "./types";
import { AleoCustomModal } from "./constants";
import { getAleoCurrencyConfig } from "./shared/utils";

const AccountHeaderActions: AleoFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const bridge = useAccountBridge(account, parentAccount);
  const isSelfTransferDisabled = bridge.isAccountEmpty(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const isStakingEnabled = !!getAleoCurrencyConfig(mainAccount.currency)?.enableStaking;
  const showStakingAction = isStakingEnabled && account.type === "Account";

  const onClick = () => {
    dispatch(openModal(AleoCustomModal.SELF_TRANSFER, { account, parentAccount }));
  };

  const onManage = () => {
    if (bridge.isAccountEmpty(mainAccount)) {
      dispatch(openModal("MODAL_NO_FUNDS_STAKE", { account: mainAccount }));
      return;
    }

    const hasBondedPosition = !!(mainAccount as AleoAccount).aleoResources?.bondedValidator;

    dispatch(
      openModal(hasBondedPosition ? AleoCustomModal.MANAGE : AleoCustomModal.BOND_PUBLIC, {
        account: mainAccount,
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
    ...(showStakingAction
      ? [
          {
            key: "AleoBond",
            onClick: onManage,
            icon: IconCoins,
            label: t("aleo.manage.headerAction"),
            event: "button_clicked2",
            eventProperties: { button: "aleo-manage" },
            accountActionsTestId: "stake-button",
          },
        ]
      : []),
  ];
};

export default AccountHeaderActions;
