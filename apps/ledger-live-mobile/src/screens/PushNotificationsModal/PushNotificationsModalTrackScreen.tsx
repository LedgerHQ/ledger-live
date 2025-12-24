import * as React from "react";
import { TrackScreen } from "~/analytics";
import useNotifications from "~/logic/notifications";
import type { NotificationsState } from "~/reducers/types";

export function PushNotificationsModalTrackScreen({
  type,
}: {
  type: NotificationsState["notificationsModalType"];
}) {
  const { pushNotificationsOldRoute } = useNotifications();

  let screenName = "";

  switch (type) {
    case "market_starred": {
      screenName = "Notification Prompt 2 - Graph";
      break;
    }
    // case "send": {
    // }
    // case "receive": {
    // }
    // case "buy": {
    // }
    // case "swap": {
    // }
    // case "stake": {
    // }
    case "generic":
    default: {
      screenName = "Notification Prompt 1 - Notif";
      break;
    }
  }

  return (
    <TrackScreen
      category="Notification Prompt"
      name={screenName}
      source={pushNotificationsOldRoute}
      type={"drawer"}
    />
  );
}
