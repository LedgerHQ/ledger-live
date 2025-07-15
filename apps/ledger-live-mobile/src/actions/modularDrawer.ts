import { createAction } from "redux-actions";
import { ModularDrawerActionTypes } from "./types";
import type {
  ModularDrawerSetDrawerOpenPayload,
  ModularDrawerSetStepPayload,
  ModularDrawerSetSelectedAssetPayload,
  ModularDrawerSetSelectedNetworkPayload,
} from "./types";

export const setModularDrawerOpen = createAction<ModularDrawerSetDrawerOpenPayload>(
  ModularDrawerActionTypes.MODULAR_DRAWER_SET_DRAWER_OPEN,
);

export const setModularDrawerStep = createAction<ModularDrawerSetStepPayload>(
  ModularDrawerActionTypes.MODULAR_DRAWER_SET_STEP,
);

export const setModularDrawerSelectedAsset = createAction<ModularDrawerSetSelectedAssetPayload>(
  ModularDrawerActionTypes.MODULAR_DRAWER_SET_SELECTED_ASSET,
);

export const setModularDrawerSelectedNetwork = createAction<ModularDrawerSetSelectedNetworkPayload>(
  ModularDrawerActionTypes.MODULAR_DRAWER_SET_SELECTED_NETWORK,
);
