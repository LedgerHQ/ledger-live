import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import type { MakeModalsType } from "~/renderer/modals/types";
import OnboardModal from "./OnboardModal";

export type ModalsData = {
  MODAL_CANTON_ONBOARD_ACCOUNT: {
    currency: CryptoCurrency | null;
    device: Device | null;
    selectedAccounts: Account[];
    editedNames: {
      [accountId: string]: string;
    };
  };
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_CANTON_ONBOARD_ACCOUNT: OnboardModal as React.ComponentType<
    ModalsData["MODAL_CANTON_ONBOARD_ACCOUNT"]
  >,
};

export default modals;
