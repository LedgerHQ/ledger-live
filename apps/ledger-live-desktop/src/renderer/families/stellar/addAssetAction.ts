import { openModal } from "~/renderer/actions/modals";
import type { StellarFamily } from "./types";

const addAssetAction: NonNullable<StellarFamily["addAssetAction"]> = ({ account, dispatch }) => {
  dispatch(openModal("MODAL_STELLAR_ADD_ASSET", { account }));
};

export default addAssetAction;
