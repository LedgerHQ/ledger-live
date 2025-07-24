import type { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dismissToast, pushToast } from "~/actions/toast";
import { toastSelector } from "~/reducers/toast";

type Props = Omit<ToastData, "id"> & { id: string; onClose(): void };

export function Toast({ onClose, ...props }: Props) {
  const dispatch = useDispatch();
  const { toasts } = useSelector(toastSelector);

  const [hasPushedToast, setHasPushedToast] = useState(false);

  useEffect(() => {
    if (hasPushedToast) {
      const foundToast = toasts.find(toast => toast.id === props.id);
      if (!foundToast) {
        onClose();
      }
    }
  }, [toasts, props.id, hasPushedToast, onClose]);

  useEffect(() => {
    dispatch(
      pushToast({
        ...props,
      }),
    );
    setHasPushedToast(true);
    return () => {
      dispatch(dismissToast(props.id));
      onClose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);

  return null;
}
