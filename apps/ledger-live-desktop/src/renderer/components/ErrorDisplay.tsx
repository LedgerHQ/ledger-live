import { useTranslation } from "react-i18next";
import { renderError } from "~/renderer/components/DeviceAction/rendering";
import { DmkError } from "@ledgerhq/live-dmk-desktop";

export type ErrorDisplayProps = {
  error: DmkError | Error;
  onRetry?: () => void;
  withExportLogs?: boolean;
  list?: boolean;
  supportLink?: string;
  warning?: boolean;
  Icon?: (props: { color?: string | undefined; size?: number | undefined }) => React.JSX.Element;
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

  const eName = (error as { name?: string })?.name;
  const managerAppName =
    eName === "ManagerNotEnoughSpace" || eName === "OutdatedApp" || eName === "UpdateYourApp"
      ? (error as unknown as { managerAppName: string }).managerAppName
      : undefined;

  return renderError({
    t,
    error,
    onRetry,
    managerAppName,
    requireFirmwareUpdate: eName === "LatestFirmwareVersionRequired",
    withExportLogs,
    list,
    supportLink,
    warning,
    Icon,
  });
};

export default ErrorDisplay;
