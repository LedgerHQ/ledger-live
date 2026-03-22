import BigNumber from "bignumber.js";
import { openModal } from "~/renderer/actions/modals";
import { AleoCustomModal } from "./constants";
import type { AleoFamily } from "./types";

const openSendFlow: NonNullable<AleoFamily["openSendFlow"]> = (dispatch, params) => {
  dispatch(
    openModal(AleoCustomModal.SEND, {
      ...params,
      amount: typeof params?.amount === "string" ? new BigNumber(params.amount) : params?.amount,
    }),
  );
};

export default openSendFlow;
