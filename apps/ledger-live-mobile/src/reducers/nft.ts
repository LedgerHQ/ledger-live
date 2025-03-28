import { Action, ReducerMap, handleActions } from "redux-actions";
import type { NftState, State } from "./types";

import type {
  NftStateGalleryFilterDrawerVisiblePayload,
  NftStateGalleryChainFiltersPayload,
  NftPayload,
} from "../actions/types";
import { NftStateActionTypes } from "../actions/types";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";
import { getEnv } from "@ledgerhq/live-env";

const SUPPORTED_NFT_CURRENCIES = getEnv("NFT_CURRENCIES");

export const INITIAL_STATE: NftState = {
  filterDrawerVisible: false,
  galleryChainFilters: SUPPORTED_NFT_CURRENCIES.reduce(
    (filters, chain) => {
      filters[chain as SupportedBlockchain] = true;
      return filters;
    },
    {} as Record<SupportedBlockchain, boolean>,
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
