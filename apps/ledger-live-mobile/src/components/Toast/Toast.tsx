import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { useEffect, useState } from "react";

type Props = Omit<ToastData, "id"> & { id: string; onClose(): void };

export function Toast({ onClose, ...props }: Props) {
  const { pushToast, dismissToast, toasts } = useToasts();
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
    pushToast({
      ...props,
    });
    setHasPushedToast(true);
    return () => {
      dismissToast(props.id);
      onClose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);

  return null;
}
