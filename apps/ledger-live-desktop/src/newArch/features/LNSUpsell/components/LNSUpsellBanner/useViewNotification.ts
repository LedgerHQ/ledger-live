import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { OFFLINE_SEEN_DELAY } from "LLD/features/DynamicContent/utils/constants";
import type { LNSBannerLocation, LNSBannerVariant } from "LLD/features/LNSUpsell/types";
import { anonymousUserNotificationsSelector } from "~/renderer/reducers/settings";
import { updateAnonymousUserNotifications } from "~/renderer/actions/settings";

export function useViewNotification(location: LNSBannerLocation, variant: LNSBannerVariant) {
  const dispatch = useDispatch();
  const viewed = useSelector(anonymousUserNotificationsSelector).LNSUpsell;

  useEffect(() => {
    if (variant !== "notification" || location !== "notification_center" || viewed) return;

    const viewedAt = Date.now();
    setTimeout(
      () => dispatch(updateAnonymousUserNotifications({ notifications: { LNSUpsell: viewedAt } })),
      OFFLINE_SEEN_DELAY,
    );
  }, [variant, location, viewed, dispatch]);
}
