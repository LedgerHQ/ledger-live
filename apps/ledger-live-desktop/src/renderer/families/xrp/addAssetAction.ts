import { openModal } from "~/renderer/actions/modals";
import type { XrpFamily } from "./types";

const addAssetAction: NonNullable<XrpFamily["addAssetAction"]> = ({ account, dispatch, token }) => {
  dispatch(openModal("MODAL_XRP_ADD_TOKEN", { account, token }));
};

export default addAssetAction;
