import { useTranslation } from "react-i18next";
import { renderError } from "~/renderer/components/DeviceAction/rendering";

export type ErrorDisplayProps = {
  error: Error;
  onRetry?: () => void;
  withExportLogs?: boolean;
  list?: boolean;
  supportLink?: string;
  warning?: boolean;
};

const ErrorDisplay = ({
  error,
  onRetry,
  withExportLogs,
  list,
  supportLink,
  warning,
}: ErrorDisplayProps) => {
  const { t } = useTranslation();

  return renderError({ t, error, onRetry, withExportLogs, list, supportLink, warning });
};

export default ErrorDisplay;
