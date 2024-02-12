import { createAction } from "redux-actions";
import {
  NftStateActionTypes,
  NftStateGalleryFilterDrawerVisiblePayload,
  NftStateGalleryChainFiltersPayload,
} from "./types";

export const setGalleryChainFilter = createAction<NftStateGalleryChainFiltersPayload>(
  NftStateActionTypes.SET_GALLERY_CHAIN_FILTER,
);

export const setGalleryFilterDrawerVisible =
  createAction<NftStateGalleryFilterDrawerVisiblePayload>(
    NftStateActionTypes.SET_GALLERY_FILTER_DRAWER_VISIBLE,
  );
