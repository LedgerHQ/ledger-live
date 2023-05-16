import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_STELLAR_ADD_ASSET from "./AddAssetModal";

export type ModalsData = {
  MODAL_STELLAR_ADD_ASSET: undefined; // FIXME type me
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_STELLAR_ADD_ASSET,
};

export default modals;
