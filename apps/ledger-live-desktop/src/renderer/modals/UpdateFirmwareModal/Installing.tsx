import React from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import { Title } from "~/renderer/components/DeviceAction/rendering";
import { Text, Flex, ProgressLoader } from "@ledgerhq/react-ui";

type Props = {
  progress: number;
  installing?: string;
};

function Installing({ progress, installing }: Props) {
  const { t } = useTranslation();
  const normalProgress = (progress || 0) * 100;

  return (
    <Box my={5} alignItems="center">
      <Flex alignItems="center" justifyContent="center" borderRadius={9999} size={60} mb={5}>
        <ProgressLoader
          stroke={8}
          infinite={!normalProgress}
          progress={normalProgress}
          showPercentage={false}
        />
      </Flex>
      <Title>{installing ? t(`manager.modal.steps.${installing}`) : null}</Title>
      <Text mt={2} ff="Inter|Regular" textAlign="center" color="palette.text.shade100">
        {t("manager.modal.mcuPin")}
      </Text>
    </Box>
  );
}

export default Installing;
