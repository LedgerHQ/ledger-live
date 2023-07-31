import React from "react";
import { Button, Flex, IconsLegacy, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import DrawerFooter from "./DrawerFooter";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import ErrorDisplay from "../../../ErrorDisplay";
import { createCustomErrorClass } from "@ledgerhq/errors";
import { useHistory } from "react-router";
import { DeviceBlocker } from "../../../DeviceAction/DeviceBlocker";
import { setDrawer } from "~/renderer/drawers/Provider";
import { openURL } from "~/renderer/linking";
import { useSelector } from "react-redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { urls } from "~/config/urls";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";

export type Props = {
  productName: string;
};

const DeviceNotGenuineError = createCustomErrorClass("DeviceNotGenuineError");

const analyticsDrawerName = "Error: this Ledger Stax is not genuine";

const GenuineCheckErrorDrawer: React.FC<Props> = ({ productName }) => {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const history = useHistory();
  const supportUrl =
    locale in urls.contactSupportWebview
      ? urls.contactSupportWebview[locale as keyof typeof urls.contactSupportWebview]
      : urls.contactSupportWebview.en;

  const displayedError = { ...new DeviceNotGenuineError(), productName };

  const exit = () => {
    setDrawer();
    history.push("/onboarding/select-device");
  };

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="space-between" height="100%">
      <TrackPage category={analyticsDrawerName} type="drawer" refreshSource={false} />
      <Flex px={13} flex={1}>
        <ErrorDisplay
          error={displayedError}
          Icon={({ size }) => <IconsLegacy.WarningSolidMedium size={size} color={"warning.c70"} />}
        />
      </Flex>
      <DrawerFooter>
        <Link mr={8} size="large" type="shade" onClick={exit}>
          {t("syncOnboarding.manual.softwareCheckContent.genuineCheckErrorDrawer.quitSetupCTA")}
        </Link>
        <Button
          size="large"
          variant="main"
          onClick={() => {
            track("button_clicked", {
              button: "Contact Ledger support",
              drawer: analyticsDrawerName,
            });
            openURL(supportUrl);
          }}
          Icon={IconsLegacy.ExternalLinkMedium}
        >
          {t(
            "syncOnboarding.manual.softwareCheckContent.genuineCheckErrorDrawer.contactSupportCTA",
          )}
        </Button>
      </DrawerFooter>
      <DeviceBlocker />
    </Flex>
  );
};

export default withV3StyleProvider(GenuineCheckErrorDrawer);
