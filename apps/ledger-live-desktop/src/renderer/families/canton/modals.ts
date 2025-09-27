import type { MakeModalsType } from "~/renderer/modals/types";
import OnboardModal, { type UserProps } from "./OnboardModal";

export type ModalsData = {
  MODAL_CANTON_ONBOARD_ACCOUNT: UserProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_CANTON_ONBOARD_ACCOUNT: OnboardModal,
};

export default modals;
