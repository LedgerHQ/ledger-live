import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { setNotificationsDrawerSource, setNotificationsModalOpen } from "~/actions/notifications";
import { notificationsModalOpenSelector } from "~/reducers/notifications";
import { type NotificationsPromptSource } from "LLM/features/NotificationsPrompt";

export function useNotificationsPromptDrawerScheduler() {
  const dispatch = useDispatch();
  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const eventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openDrawer = useCallback(
    (source: NotificationsPromptSource, timer = 0) => {
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
      }

      eventTimeoutRef.current = setTimeout(() => {
        eventTimeoutRef.current = null;
        dispatch(setNotificationsModalOpen(true));
        dispatch(setNotificationsDrawerSource(source));
      }, timer);
    },
    [dispatch],
  );

  const isDrawerPending = useCallback(() => {
    return isPushNotificationsModalOpen || eventTimeoutRef.current !== null;
  }, [isPushNotificationsModalOpen]);

  useEffect(() => {
    return () => {
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    openDrawer,
    isDrawerPending,
  };
}
