import React from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ProgressCircle from "~/renderer/components/ProgressCircle";
import { Title } from "~/renderer/components/DeviceAction/rendering";

type Props = {
  progress: number;
  installing?: string;
};

function Installing({ progress, installing }: Props) {
  const { t } = useTranslation();
  return (
    <Box my={5} alignItems="center">
      <Box mb={5}>
        <ProgressCircle progress={progress || 0} size={58} hideProgress={true} />
      </Box>
      <Title>{installing ? t(`manager.modal.steps.${installing}`) : null}</Title>
      <Text mt={2} ff="Inter|Regular" textAlign="center" color="palette.text.shade100">
        {t("manager.modal.mcuPin")}
      </Text>
    </Box>
  );
}

export default Installing;
