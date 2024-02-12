import { useTranslation } from "react-i18next";
import { renderError } from "~/renderer/components/DeviceAction/rendering";

export type ErrorDisplayProps = {
  error: Error;
  onRetry?: () => void;
  withExportLogs?: boolean;
  list?: boolean;
  supportLink?: string;
  warning?: boolean;
  Icon?: (props: { color?: string | undefined; size?: number | undefined }) => JSX.Element;
};

const ErrorDisplay = ({
  error,
  onRetry,
  withExportLogs,
  list,
  supportLink,
  warning,
  Icon,
}: ErrorDisplayProps) => {
  const { t } = useTranslation();

  return renderError({ t, error, onRetry, withExportLogs, list, supportLink, warning, Icon });
};

export default ErrorDisplay;
