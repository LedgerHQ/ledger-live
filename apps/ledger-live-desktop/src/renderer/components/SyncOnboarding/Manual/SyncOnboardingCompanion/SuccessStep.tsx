import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui/index";
import { useTranslation } from "react-i18next";

const SuccessStep = ({ deviceName }: { deviceName: string }) => {
  const { t } = useTranslation();

  return (
    <Flex
      paddingTop={24}
      paddingBottom={45}
      paddingX={16}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      rowGap={24}
      flex="1 0 0"
      alignSelf="stretch"
    >
      <Flex
        width={72}
        height={72}
        borderRadius={100}
        bg="opacityDefault.c05"
        alignItems="center"
        justifyContent="center"
      >
        <Icons.CheckmarkCircleFill color="success.c70" size="L" />
      </Flex>
      <Text fontSize="large" fontWeight="semiBold" textAlign="center">
        {t("syncOnboarding.manual.successStepTitle", { deviceName })}
      </Text>
    </Flex>
  );
};

export default SuccessStep;
