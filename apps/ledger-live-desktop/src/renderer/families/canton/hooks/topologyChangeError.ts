export { TopologyChangeError } from "@ledgerhq/coin-canton";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { Dispatch } from "redux";
import { closeModal, openModal } from "~/renderer/actions/modals";
import type { ModalData } from "~/renderer/modals/types";
import { setDrawer } from "~/renderer/drawers/Provider";
import CantonReonboardDrawer from "../AddAccountDrawer/CantonReonboardDrawer";
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

type ReonboardingConfig = {
  currency: CryptoCurrency;
  device: Device | null;
  mainAccount: Account;
  useModularDrawer: boolean;
  navigationSnapshot?: NavigationSnapshot;
};

function openReonboardingDrawer(dispatch: Dispatch, config: ReonboardingConfig): void {
  const { currency, mainAccount, navigationSnapshot } = config;

  if (navigationSnapshot?.type === "modal") {
    dispatch(closeModal(navigationSnapshot.modalName));
  }

  setDrawer(CantonReonboardDrawer, {
    currency,
    accountToReonboard: mainAccount,
    navigationSnapshot,
  });
}

function openReonboardingModal(dispatch: Dispatch, config: ReonboardingConfig): void {
  const { currency, mainAccount, navigationSnapshot } = config;

  if (navigationSnapshot?.type === "modal") {
    dispatch(closeModal(navigationSnapshot.modalName));
  }

  dispatch(
    openModal("MODAL_CANTON_ONBOARD_ACCOUNT", {
      currency,
      selectedAccounts: [],
      editedNames: {},
      isReonboarding: true,
      accountToReonboard: mainAccount,
      navigationSnapshot,
    }),
  );
}

export function handleTopologyChangeError(
  dispatch: Dispatch,
  config: ReonboardingConfig,
): boolean {
  if (!config.device || !isCantonCurrency(config.currency)) {
    return false;
  }

  if (config.useModularDrawer) {
    openReonboardingDrawer(dispatch, config);
  } else {
    openReonboardingModal(dispatch, config);
  }

  return true;
}
