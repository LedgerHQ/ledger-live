import * as React from "react";
import Illustration from "~/images/illustration/Illustration";
import NotificationsBellDark from "~/images/illustration/Dark/_NotificationsBell.webp";
import NotificationsBellLight from "~/images/illustration/Light/_NotificationsBell.webp";
import NotificationsPerformanceChartDark from "~/images/illustration/Dark/_NotificationsPerformanceChart.webp";
import NotificationsPerformanceChartLight from "~/images/illustration/Light/_NotificationsPerformanceChart.webp";
import type { NotificationPromptTarget } from "../types";
import { isTransactionsAlertsPromptTarget } from "../utils/getNotificationsPromptCopy";

const WIDTH = 300;
const HEIGHT = 141;

export type NotificationsDrawerIllustrationSources = {
  lightSource: typeof NotificationsBellLight;
  darkSource: typeof NotificationsBellDark;
};

export const resolveNotificationsDrawerIllustrationSources = (
  promptTarget?: NotificationPromptTarget,
): NotificationsDrawerIllustrationSources =>
  isTransactionsAlertsPromptTarget(promptTarget)
    ? { lightSource: NotificationsBellLight, darkSource: NotificationsBellDark }
    : {
        lightSource: NotificationsPerformanceChartLight,
        darkSource: NotificationsPerformanceChartDark,
      };

export type NotificationsDrawerIllustrationProps = {
  readonly promptTarget?: NotificationPromptTarget;
};

export function NotificationsDrawerIllustration({
  promptTarget,
}: NotificationsDrawerIllustrationProps) {
  const { lightSource, darkSource } = resolveNotificationsDrawerIllustrationSources(promptTarget);

  return (
    <Illustration lightSource={lightSource} darkSource={darkSource} width={WIDTH} height={HEIGHT} />
  );
}
