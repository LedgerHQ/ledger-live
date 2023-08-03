import { createAction } from "redux-actions";
import {
  NftStateActionTypes,
  NftStateGalleryFilterDrawerVisiblePayload,
  NftStateGalleryChainFiltersPayload,
  NftStateGallerySpamFilterPayload,
  NftStateGalleryInfoDrawerVisiblePayload,
} from "./types";

export const setGalleryChainFilter = createAction<NftStateGalleryChainFiltersPayload>(
  NftStateActionTypes.SET_GALLERY_CHAIN_FILTER,
);

export const setGalleryFilterDrawerVisible =
  createAction<NftStateGalleryFilterDrawerVisiblePayload>(
    NftStateActionTypes.SET_GALLERY_FILTER_DRAWER_VISIBLE,
  );

export const setInfoDrawerVisible = createAction<NftStateGalleryInfoDrawerVisiblePayload>(
  NftStateActionTypes.SET_INFO_DRAWER_VISIBLE,
);

export const setSpamFilter = createAction<NftStateGallerySpamFilterPayload>(
  NftStateActionTypes.SET_SPAM_FILTER,
);
