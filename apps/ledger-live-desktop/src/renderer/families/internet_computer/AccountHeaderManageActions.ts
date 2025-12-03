import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  ICPAccount,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { TokenAccount } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";

type Props = {
  account: ICPAccount | TokenAccount;
  parentAccount: ICPAccount | undefined | null;
  source?: string;
};

const AccountHeaderManageActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onClickManageNeurons = useCallback(
    (refresh: boolean = false) => {
      if (account.type !== "Account") return;
      dispatch(
        openModal("MODAL_ICP_LIST_NEURONS", {
          account,
          refresh,
        }),
      );
    },
    [account, dispatch],
  );
  const onClickStakeIcp = useCallback(() => {
    if (parentAccount) return;
    if (account.type !== "Account") return;
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        account,
        disableBacks: ["amount"],
        transaction: {
          ...initTx,
          type: "create_neuron",
        },
        onConfirmationHandler: (optimisticOperation: InternetComputerOperation) => {
          const updatedAccount =
            optimisticOperation.type !== "NONE"
              ? addPendingOperation(account, optimisticOperation)
              : account;

          dispatch(updateAccountWithUpdater(account.id, () => updatedAccount));
          dispatch(
            openModal("MODAL_ICP_LIST_NEURONS", {
              account,
              refresh: false,
              lastManageAction: "create_neuron",
              stepId: "confirmation",
            }),
          );
        },
      }),
    );
  }, [account, dispatch, parentAccount]);

  if (parentAccount) return null;
  return [
    {
      key: "stake-icp",
      onClick: onClickStakeIcp,
      icon: IconCoins,
      label: t("internetComputer.headerManageActions.stakeICP.title"),
      tooltip: t("internetComputer.headerManageActions.stakeICP.tooltip"),
      event: "stake_icp_button_clicked",
      eventProperties: {
        button: "stake_icp_button",
      },
      accountActionsTestId: "stake-icp-button-icp",
    },
    {
      key: "manage-neurons",
      onClick: () => onClickManageNeurons(),
      icon: IconCoins,
      label: t("internetComputer.headerManageActions.manageNeurons.title"),
      tooltip: t("internetComputer.headerManageActions.manageNeurons.tooltip"),
      event: "manage_neurons_dashboard_clicked",
      eventProperties: {
        button: "manage_neurons_button",
      },
      accountActionsTestId: "manage-neurons-button-icp",
    },
  ];
};

export default AccountHeaderManageActions;
