import { openModal } from "~/renderer/actions/modals";
import type { XrpFamily } from "./types";

const addAssetAction: NonNullable<XrpFamily["addAssetAction"]> = ({ account, dispatch }) => {
  dispatch(openModal("MODAL_XRP_ADD_TOKEN", { account }));
};

export default addAssetAction;
