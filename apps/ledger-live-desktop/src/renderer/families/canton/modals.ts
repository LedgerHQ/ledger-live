import type { MakeModalsType } from "~/renderer/modals/types";
import OnboardModal, { type UserProps } from "./OnboardModal";
import TooManyUtxosModal from "./TooManyUtxosModal";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";

// TODO: Remove MODAL_CANTON_ONBOARD_ACCOUNT when both `lldNetworkBasedAddAccount`
// and `lldModularDrawer` feature flags are permanently enabled.
// - StepImport.tsx uses this modal when `lldNetworkBasedAddAccount` is disabled.
// - topologyChangeError.ts uses this modal when `lldModularDrawer` is disabled.
// New onboarding flows use the MAD drawer (CantonOnboard) and reonboarding uses
// CantonReonboardDrawer via setDrawer().
export type ModalsData = {
  MODAL_CANTON_ONBOARD_ACCOUNT: UserProps;
  MODAL_CANTON_TOO_MANY_UTXOS: { account: CantonAccount };
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_CANTON_ONBOARD_ACCOUNT: OnboardModal,
  MODAL_CANTON_TOO_MANY_UTXOS: TooManyUtxosModal,
};

export default modals;
