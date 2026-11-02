import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { isFirstBondPending } from "@ledgerhq/live-common/families/aleo/utils";
import { openModal } from "~/renderer/actions/modals";
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
  const mainAccount = getMainAccount(account, parentAccount) as AleoAccount;
  const isStakingEnabled = !!getAleoCurrencyConfig(mainAccount.currency)?.enableStaking;
  const showStakingAction = isStakingEnabled && account.type === "Account";

  const hasBondedPosition = !!mainAccount.aleoResources?.bondedValidator;
  const hasFirstBondPending = isFirstBondPending(mainAccount);

  const onManage = () => {
    if (bridge.isAccountEmpty(mainAccount)) {
      dispatch(openModal("MODAL_NO_FUNDS_STAKE", { account: mainAccount }));
      return;
    }

    dispatch(
      openModal(hasBondedPosition ? AleoCustomModal.MANAGE : AleoCustomModal.BOND_PUBLIC, {
        account: mainAccount,
      }),
    );
  };

  return [
    ...(showStakingAction
      ? [
          {
            key: "AleoBond",
            onClick: onManage,
            icon: IconCoins,
            disabled: hasFirstBondPending,
            tooltip: hasFirstBondPending ? t("aleo.stake.bondPendingTooltip") : undefined,
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
