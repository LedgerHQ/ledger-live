import { MakeModalsType } from "~/renderer/modals/types";
import { Data as ExportKeyProps } from "./ZCashExportKeyFlowModal/Body";
import MODAL_BITCOIN_FULL_NODE from "./FullNode";
import MODAL_ZCASH_EXPORT_KEY from "./ZCashExportKeyFlowModal";

export type ModalsData = {
  MODAL_BITCOIN_FULL_NODE:
    | undefined
    | {
        skipNodeSetup?: boolean;
      };
  MODAL_ZCASH_EXPORT_KEY: ExportKeyProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_BITCOIN_FULL_NODE,
  MODAL_ZCASH_EXPORT_KEY,
};

export default modals;
