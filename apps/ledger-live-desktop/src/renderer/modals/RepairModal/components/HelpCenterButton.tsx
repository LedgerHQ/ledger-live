import React, { useCallback } from "react";
import { TFunction } from "i18next";
import Button from "~/renderer/components/Button";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { colors } from "~/renderer/styles/theme";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

type Props = {
  t: TFunction;
};

const HelpCenterButton = ({ t }: Props) => {
  const localizedUrl = useLocalizedUrl(urls.troubleshootingUSB);
  const handleClick = useCallback(() => {
    openURL(localizedUrl);
  }, [localizedUrl]);

  return (
    <Button onClick={handleClick} textColor={colors.wallet}>
      {t("common.help")}
    </Button>
  );
};

export default HelpCenterButton;
