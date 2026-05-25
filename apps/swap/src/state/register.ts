import { registerSlice } from "@shared/mobile-host-runtime";
import swapReducer, { SWAP_SLICE_NAME } from "./swapSlice";

registerSlice({ name: SWAP_SLICE_NAME, reducer: swapReducer });
