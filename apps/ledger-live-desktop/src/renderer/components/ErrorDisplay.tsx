import React from "react";
import { DeviceActionErrorComponent } from "~/renderer/components/DeviceAction/rendering";

export type ErrorDisplayProps = {
  error: Error;
  onRetry?: () => void;
  withExportLogs?: boolean;
  list?: boolean;
  supportLink?: string;
  warning?: boolean;
  Icon?: (props: { color?: string | undefined; size?: number | undefined }) => JSX.Element;
};

const ErrorDisplay = (props: ErrorDisplayProps) => <DeviceActionErrorComponent {...props} />;

export default ErrorDisplay;
