import { createAction } from "redux-actions";
import { LargeMoverActionTypes, LargeMoverPayload } from "./types";

export const setTutorial = createAction<boolean>(LargeMoverActionTypes.SET_TUTORIAL);

export const importLargeMoverState = createAction<LargeMoverPayload>(
  LargeMoverActionTypes.LARGE_MOVER_IMPORT,
);
