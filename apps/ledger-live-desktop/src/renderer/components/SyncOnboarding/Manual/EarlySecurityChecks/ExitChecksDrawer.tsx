import React from "react";
import { Button, Flex, IconsLegacy, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import DrawerFooter from "./DrawerFooter";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import ErrorDisplay from "../../../ErrorDisplay";
import { createCustomErrorClass } from "@ledgerhq/errors";

export type Props = {
  onClose: () => void;
  onClickExit: () => void;
};

const ExitError = createCustomErrorClass("ExitEarlySecurityChecksWarning");
const error = new ExitError();

const ExitChecksDrawer: React.FC<Props> = ({ onClose, onClickExit }) => {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="space-between" height="100%">
      <ErrorDisplay
        error={error}
        Icon={({ size }) => <IconsLegacy.InfoAltFillMedium size={size} color={"primary.c80"} />}
      />
      <DrawerFooter>
        <Link mr={8} size="large" type="shade" onClick={onClickExit}>
          {t("syncOnboarding.manual.softwareCheckContent.exitWarningDrawer.cancelCheckCTA")}
        </Link>
        <Button size="large" variant="main" onClick={onClose}>
          {t("syncOnboarding.manual.softwareCheckContent.exitWarningDrawer.resumeCheckCTA")}
        </Button>
      </DrawerFooter>
    </Flex>
  );
};

export default withV3StyleProvider(ExitChecksDrawer);
