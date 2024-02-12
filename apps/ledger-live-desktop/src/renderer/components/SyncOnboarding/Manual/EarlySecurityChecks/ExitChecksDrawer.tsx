import React from "react";
import { Button, Flex, IconsLegacy, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import DrawerFooter from "./DrawerFooter";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { ErrorBody } from "~/renderer/components/ErrorBody";

export type Props = {
  onClose: () => void;
  onClickExit: () => void;
};

const ErrorIcon = ({ size }: { size?: number }) => (
  <IconsLegacy.InfoAltFillMedium size={size} color={"primary.c80"} />
);

const analyticsDrawerName = "Are you sure you want to exit setup";

const ExitChecksDrawer: React.FC<Props> = ({ onClose, onClickExit }) => {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="space-between" height="100%">
      <TrackPage category={analyticsDrawerName} type="drawer" refreshSource={false} />
      <Flex flex={1} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
        <ErrorBody
          Icon={ErrorIcon}
          title={t("syncOnboarding.manual.softwareCheckContent.exitWarningDrawer.title")}
          description={t(
            "syncOnboarding.manual.softwareCheckContent.exitWarningDrawer.description",
          )}
        />
      </Flex>
      <DrawerFooter>
        <Link
          mr={8}
          size="large"
          type="shade"
          onClick={() => {
            track("button_clicked2", { button: "Cancel check", drawer: analyticsDrawerName });
            onClickExit();
          }}
        >
          {t("syncOnboarding.manual.softwareCheckContent.exitWarningDrawer.cancelCheckCTA")}
        </Link>
        <Button
          size="large"
          variant="main"
          onClick={() => {
            track("button_clicked2", { button: "Resume check", drawer: analyticsDrawerName });
            onClose();
          }}
        >
          {t("syncOnboarding.manual.softwareCheckContent.exitWarningDrawer.resumeCheckCTA")}
        </Button>
      </DrawerFooter>
    </Flex>
  );
};

export default withV3StyleProvider(ExitChecksDrawer);
