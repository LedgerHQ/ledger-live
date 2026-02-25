import * as React from "react";
import type { NotificationsState } from "~/reducers/types";
import Illustration from "~/images/illustration/Illustration";
import NotificationsBellDark from "~/images/illustration/Dark/_NotificationsBell.webp";
import NotificationsBellLight from "~/images/illustration/Light/_NotificationsBell.webp";
import NotificationsPerformanceChartDark from "~/images/illustration/Dark/_NotificationsPerformanceChart.webp";
import NotificationsPerformanceChartLight from "~/images/illustration/Light/_NotificationsPerformanceChart.webp";

const WIDTH = 300;
const HEIGHT = 141;

export function NotificationsDrawerIllustration({
  type,
}: {
  readonly type: NotificationsState["drawerSource"];
}) {
  if (type === "onboarding") {
    return (
      <Illustration
        lightSource={NotificationsBellLight}
        darkSource={NotificationsBellDark}
        width={WIDTH}
        height={HEIGHT}
      />
    );
  }

  return (
    <Illustration
      lightSource={NotificationsPerformanceChartLight}
      darkSource={NotificationsPerformanceChartDark}
      width={WIDTH}
      height={HEIGHT}
    />
  );
}
