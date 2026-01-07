import type { MakeModalsType } from "~/renderer/modals/types";
import OnboardModal, { type UserProps } from "./OnboardModal";
import TooManyUtxosModal from "./TooManyUtxosModal";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";

export type ModalsData = {
  MODAL_CANTON_ONBOARD_ACCOUNT: UserProps;
  MODAL_CANTON_TOO_MANY_UTXOS: { account: CantonAccount };
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_CANTON_ONBOARD_ACCOUNT: OnboardModal,
  MODAL_CANTON_TOO_MANY_UTXOS: TooManyUtxosModal,
};

export default modals;
