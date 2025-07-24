import { createAction } from "redux-actions";
import { Payload } from "~/reducers/toast";

export const pushToast = createAction<Payload>("pushToast");
export const dismissToast = createAction<Payload>("dismissToast");
