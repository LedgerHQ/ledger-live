import React from "react";
import { Button, Flex, IconsLegacy, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import DrawerFooter from "./DrawerFooter";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import ErrorDisplay from "../../../ErrorDisplay";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useHistory } from "react-router";
import { DeviceBlocker } from "../../../DeviceAction/DeviceBlocker";
import { setDrawer } from "~/renderer/drawers/Provider";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { ErrorBody } from "~/renderer/components/ErrorBody";
import { FirmwareNotRecognized } from "@ledgerhq/errors";

export type Props = {
  error: Error;
  onClickRetry: () => void;
  closeable?: boolean;
};

const ErrorIcon = ({ size }: { size?: number }) => (
  <IconsLegacy.InfoAltFillMedium size={size} color={"primary.c80"} />
);

const ErrorDrawer: React.FC<Props> = ({ error, onClickRetry, closeable = false }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const isNotFoundEntityError =
    error.message === "not found entity" || error instanceof FirmwareNotRecognized;
  const providerNumber = useEnv("FORCE_PROVIDER");

  const drawerAnalyticsName = `Error: ${
    isNotFoundEntityError ? "couldn't check if the device was genuine" : (error as Error).name
  }`;

  const goToExperimentalSettings = () => {
    setDrawer();
    history.push("/settings/experimental");
  };

  const exit = () => {
    setDrawer();
    history.push("/onboarding/select-device");
  };

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="space-between" height="100%">
      <TrackPage category={drawerAnalyticsName} type="drawer" refreshSource={false} />
      <Flex px={13} flex={1}>
        {isNotFoundEntityError ? (
          <Flex flex={1} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
            <ErrorBody
              Icon={ErrorIcon}
              title={t(
                "syncOnboarding.manual.softwareCheckContent.genuineCheckErrorDrawer.notFoundEntityError.title",
              )}
              description={t(
                "syncOnboarding.manual.softwareCheckContent.genuineCheckErrorDrawer.notFoundEntityError.description",
                { providerNumber },
              )}
            />
          </Flex>
        ) : (
          <ErrorDisplay error={error} Icon={ErrorIcon} />
        )}
      </Flex>
      <DrawerFooter>
        <Link
          mr={8}
          size="large"
          type="shade"
          onClick={() => {
            track("button_clicked2", { button: "Quit setup", drawer: drawerAnalyticsName });
            exit();
          }}
        >
          {t("syncOnboarding.manual.softwareCheckContent.genuineCheckErrorDrawer.quitSetupCTA")}
        </Link>
        {isNotFoundEntityError ? (
          <Button
            size="large"
            variant="main"
            onClick={() => {
              track("button_clicked2", { button: "Go to settings", drawer: drawerAnalyticsName });
              goToExperimentalSettings();
            }}
          >
            {t(
              "syncOnboarding.manual.softwareCheckContent.genuineCheckErrorDrawer.goToSettingsCTA",
            )}
          </Button>
        ) : (
          <Button
            size="large"
            variant="main"
            onClick={() => {
              track("button_clicked2", { button: "Retry", drawer: drawerAnalyticsName });
              onClickRetry();
            }}
          >
            {t("common.tryAgain")}
          </Button>
        )}
      </DrawerFooter>
      {closeable ? null : <DeviceBlocker />}
    </Flex>
  );
};

export default withV3StyleProvider(ErrorDrawer);
