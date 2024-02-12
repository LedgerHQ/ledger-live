import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_STELLAR_ADD_ASSET from "./AddAssetModal";
import { Data as AddAssetData } from "./AddAssetModal/Body";

export type ModalsData = {
  MODAL_STELLAR_ADD_ASSET: AddAssetData;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_STELLAR_ADD_ASSET,
};

export default modals;
