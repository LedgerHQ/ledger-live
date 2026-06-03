import React from "react";
import { useTranslation } from "react-i18next";

type LineChartErrorProps = Readonly<{
  height: number;
  message?: string;
}>;

export function LineChartError({ height, message }: LineChartErrorProps) {
  const { t } = useTranslation();
  return (
    <div
      data-testid="line-chart-error"
      role="alert"
      className="flex w-full items-center justify-center"
      style={{ height }}
    >
      <span className="body-2 text-muted">{message ?? t("lineChart.error")}</span>
    </div>
  );
}
