import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_BITCOIN_FULL_NODE from "./FullNode";

export type ModalsData = {
  MODAL_BITCOIN_FULL_NODE:
    | undefined
    | {
        skipNodeSetup?: boolean;
      };
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_BITCOIN_FULL_NODE,
};

export default modals;
