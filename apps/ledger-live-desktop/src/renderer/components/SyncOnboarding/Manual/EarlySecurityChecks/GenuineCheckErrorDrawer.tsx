import React from "react";
import { Button, Flex, Icons, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import DrawerFooter from "./DrawerFooter";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import ErrorDisplay from "../../../ErrorDisplay";
import { createCustomErrorClass } from "@ledgerhq/errors";
import useEnv from "~/renderer/hooks/useEnv";
import { useHistory } from "react-router";
import { DeviceBlocker } from "../../../DeviceAction/DeviceBlocker";
import { setDrawer } from "~/renderer/drawers/Provider";

export type Props = {
  error: Error;
  onClickRetry: () => void;
};

const NotFoundEntityError = createCustomErrorClass("NotFoundEntityError");

const GenuineCheckErrorDrawer: React.FC<Props> = ({ error, onClickRetry }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const isNotFoundEntityError = error.message === "not found entity";
  const forcedProvider = useEnv("FORCE_PROVIDER");

  const displayedError = isNotFoundEntityError
    ? { ...new NotFoundEntityError(), providerNumber: forcedProvider }
    : error;

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
      <Flex px={13} flex={1}>
        <ErrorDisplay
          error={displayedError}
          Icon={({ size }) => <Icons.InfoAltFillMedium size={size} color={"primary.c80"} />}
        />
      </Flex>
      <DrawerFooter>
        <Link mr={8} size="large" type="shade" onClick={exit}>
          {t("syncOnboarding.manual.softwareCheckContent.genuineCheckErrorDrawer.quitSetupCTA")}
        </Link>
        <Button
          size="large"
          variant="main"
          onClick={isNotFoundEntityError ? goToExperimentalSettings : onClickRetry}
        >
          {isNotFoundEntityError
            ? t(
                "syncOnboarding.manual.softwareCheckContent.genuineCheckErrorDrawer.goToSettingsCTA",
              )
            : t("syncOnboarding.manual.softwareCheckContent.genuineCheckErrorDrawer.retryCTA")}
        </Button>
      </DrawerFooter>
      <DeviceBlocker />
    </Flex>
  );
};

export default withV3StyleProvider(GenuineCheckErrorDrawer);
