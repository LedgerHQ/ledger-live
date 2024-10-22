import { Action, ReducerMap, handleActions } from "redux-actions";
import type { NftState, State } from "./types";

import type {
  NftStateGalleryFilterDrawerVisiblePayload,
  NftStateGalleryChainFiltersPayload,
  NftPayload,
} from "../actions/types";
import { NftStateActionTypes } from "../actions/types";
import { SUPPORTED_BLOCKCHAINS_LIVE, SupportedBlockchainsType } from "@ledgerhq/live-nft/supported";

export const INITIAL_STATE: NftState = {
  filterDrawerVisible: false,
  galleryChainFilters: SUPPORTED_BLOCKCHAINS_LIVE.reduce(
    (filters, chain) => {
      filters[chain] = true;
      return filters;
    },
    {} as Record<SupportedBlockchainsType, boolean>,
  ),
};

const handlers: ReducerMap<NftState, NftPayload> = {
  [NftStateActionTypes.SET_GALLERY_FILTER_DRAWER_VISIBLE]: (state, action) => ({
    ...state,
    filterDrawerVisible: (action as Action<NftStateGalleryFilterDrawerVisiblePayload>).payload,
  }),
  [NftStateActionTypes.SET_GALLERY_CHAIN_FILTER]: (state, action) => {
    const a = action as Action<NftStateGalleryChainFiltersPayload>;
    return {
      ...state,
      galleryChainFilters: {
        ...state.galleryChainFilters,
        [a.payload[0]]: a.payload[1],
      },
    };
  },
};

export const galleryChainFiltersSelector = (state: State) => state.nft.galleryChainFilters;
export const galleryFilterDrawerVisibleSelector = (state: State) => state.nft.filterDrawerVisible;

export default handleActions<NftState, NftPayload>(handlers, INITIAL_STATE);
