import { State } from "~/reducers/types";

export const isAppLoadedSelector = (state: State) => state.launchScreen.isAppLoaded;
