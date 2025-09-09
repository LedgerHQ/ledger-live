import type { MakeModalsType } from "~/renderer/modals/types";
import { Account } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import OnboardModal from "./OnboardModal";

export type ModalsData = {
  MODAL_CANTON_ONBOARD_ACCOUNT: {
    currency: CryptoCurrency;
    device: Device;
    selectedAccounts: Account[];
    editedNames: Record<string, string>;
  };
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_CANTON_ONBOARD_ACCOUNT: OnboardModal,
};

export default modals;
