export { TopologyChangeError } from "@ledgerhq/coin-canton";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { Dispatch } from "redux";
import { closeModal, openModal } from "~/renderer/reducers/modals";
import type { ModalData } from "~/renderer/modals/types";
import type { TransferProposalAction } from "../PendingTransferProposals/types";
import { isCantonCurrency } from "../utils/currency";

export type ModalSnapshot = {
  type: "modal";
  modalName: keyof ModalData;
  modalData: ModalData[keyof ModalData];
};

export type TransferProposalSnapshot = {
  type: "transfer-proposal";
  handler: (contractId: string, action: TransferProposalAction) => void;
  props: {
    action: TransferProposalAction;
    contractId: string;
  };
};

export type NavigationSnapshot = ModalSnapshot | TransferProposalSnapshot;

type ReonboardingModalConfig = {
  currency: CryptoCurrency;
  device: Device | null;
  accounts: Account[];
  mainAccount: Account;
  navigationSnapshot?: NavigationSnapshot;
};

function openReonboardingModal(dispatch: Dispatch, config: ReonboardingModalConfig): void {
  const { currency, device, accounts, mainAccount, navigationSnapshot } = config;

  if (navigationSnapshot?.type === "modal") {
    dispatch(closeModal(navigationSnapshot.modalName));
  }

  dispatch(
    openModal("MODAL_CANTON_ONBOARD_ACCOUNT", {
      currency,
      device,
      selectedAccounts: [],
      existingAccounts: accounts,
      editedNames: {},
      isReonboarding: true,
      accountToReonboard: mainAccount,
      navigationSnapshot,
    }),
  );
}

export function handleTopologyChangeError(
  dispatch: Dispatch,
  config: ReonboardingModalConfig,
): boolean {
  if (!config.device || !isCantonCurrency(config.currency)) {
    return false;
  }

  openReonboardingModal(dispatch, {
    ...config,
    currency: config.currency,
  });

  return true;
}
