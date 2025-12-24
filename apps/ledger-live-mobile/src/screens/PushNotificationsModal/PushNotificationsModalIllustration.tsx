import * as React from "react";
import type { NotificationsState } from "~/reducers/types";
import Illustration from "~/images/illustration/Illustration";
import PromptNotifGenericDark from "~/images/illustration/Dark/_PromptNotifGeneric.webp";
import PromptNotifGenericLight from "~/images/illustration/Light/_PromptNotifGeneric.webp";
import PromptNotifMarketDark from "~/images/illustration/Dark/_PromptNotifMarket.webp";
import PromptNotifMarketLight from "~/images/illustration/Light/_PromptNotifMarket.webp";

export function PushNotificationsModalIllustration({
  type,
}: {
  type: NotificationsState["notificationsModalType"];
}) {
  switch (type) {
    case "market_starred": {
      return (
        <Illustration
          lightSource={PromptNotifMarketLight}
          darkSource={PromptNotifMarketDark}
          width={300}
          height={141}
        />
      );
    }
    case "generic":
    default: {
      return (
        <Illustration
          lightSource={PromptNotifGenericLight}
          darkSource={PromptNotifGenericDark}
          width={300}
          height={141}
        />
      );
    }
  }
}
