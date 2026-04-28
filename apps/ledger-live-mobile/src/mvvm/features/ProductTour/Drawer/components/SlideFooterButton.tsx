import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { useSlideFooterButtonViewModel } from "../hooks/useSlideFooterButtonViewModel";

export const SlideFooterButton = ({ closeDrawer }: { closeDrawer: () => void }) => {
  const { handleCTA, handleContinue } = useSlideFooterButtonViewModel(closeDrawer);
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full" }}>
      <Button appearance="base" size="lg" onPress={handleContinue}>
        {t("common.continue")}
      </Button>
      <Button appearance="gray" size="lg" onPress={handleCTA} lx={{ marginTop: "s16" }}>
        {t("common.learnMore")}
      </Button>
    </Box>
  );
};
