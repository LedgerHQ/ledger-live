import { createAction } from "redux-actions";
import { LargeMoverActionTypes } from "~/reducers/largeMover";

export const setTutorial = createAction<boolean>(LargeMoverActionTypes.SET_TUTORIAL);
