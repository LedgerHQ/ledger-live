import { openModal } from "~/renderer/actions/modals";
import type { AlgorandFamily } from "./types";

const addAssetAction: NonNullable<AlgorandFamily["addAssetAction"]> = ({ account, dispatch }) => {
  dispatch(openModal("MODAL_ALGORAND_OPT_IN", { account }));
};

export default addAssetAction;
