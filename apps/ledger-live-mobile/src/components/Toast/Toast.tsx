import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { useEffect } from "react";
import { v4 as uuidV4 } from "uuid";

type Props = Omit<ToastData, "id"> & { id?: string };

export function Toast(props: Props) {
  const { pushToast, dismissToast } = useToasts();

  useEffect(() => {
    const id = props.id ?? uuidV4();
    pushToast({
      ...props,
      id,
    });
    return () => dismissToast(id);
  }, [pushToast, dismissToast, props]);

  return null;
}
