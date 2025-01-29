import { ManagerNotEnoughSpaceError, UpdateYourApp } from "@ledgerhq/errors";
import { LatestFirmwareVersionRequired, OutdatedApp } from "@ledgerhq/live-common/errors";
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

  const managerAppName =
    error instanceof ManagerNotEnoughSpaceError ||
    (error as unknown) instanceof OutdatedApp ||
    (error as unknown) instanceof UpdateYourApp
      ? (error as unknown as { managerAppName: string }).managerAppName
      : undefined;

  return renderError({
    t,
    error,
    onRetry,
    managerAppName,
    requireFirmwareUpdate: error instanceof LatestFirmwareVersionRequired,
    withExportLogs,
    list,
    supportLink,
    warning,
    Icon,
  });
};

export default ErrorDisplay;
