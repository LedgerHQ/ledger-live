import { openModal } from "~/renderer/actions/modals";
import type { HederaFamily } from "./types";

const addAssetAction: NonNullable<HederaFamily["addAssetAction"]> = ({ account, dispatch }) => {
  dispatch(openModal("MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION", { account, receiveTokenMode: true }));
};

export default addAssetAction;
