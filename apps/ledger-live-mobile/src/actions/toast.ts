import { useDispatch } from "~/context/store";
import { createAction } from "redux-actions";
import { Payload } from "~/reducers/toast";

const pushToastAction = createAction<Payload>("pushToast");
const dismissToastAction = createAction<Payload>("dismissToast");

export const useToastsActions = () => {
  const dispatch = useDispatch();

  const pushToast = (toast: Payload) => dispatch(pushToastAction(toast));
  const dismissToast = (id: Payload) => dispatch(dismissToastAction(id));

  return { pushToast, dismissToast };
};
