import React, { memo } from "react";
import { Icons, Flex, ProgressLoader, Text, InfiniteLoader } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

export enum ItemState {
  Installed,
  Skipped,
  Active,
  Idle,
}

type Props = {
  appName: string;
  itemProgress?: number;
  productName: string;
  state: ItemState;
  i: number;
};

const AppInstallItem = ({ appName, state, itemProgress, productName, i }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Flex key={appName} flexDirection={"row"} alignItems="center" mb={6}>
      <Flex
        alignItems="center"
        justifyContent="center"
        borderRadius={9999}
        size={40}
        bg={colors.neutral.c30}
      >
        {state === ItemState.Active ? (
          !itemProgress || itemProgress === 1 ? (
            <InfiniteLoader size={20} />
          ) : (
            <ProgressLoader
              progress={itemProgress * 100}
              showPercentage={false}
              radius={10}
              stroke={2}
            />
          )
        ) : state === ItemState.Installed ? (
          <Icons.CheckAloneMedium size={20} color={"success.c100"} />
        ) : state === ItemState.Skipped ? (
          <Icons.InfoAltMedium size={20} color={"neutral.c100"} />
        ) : (
          <Text color="neutral.c100" variant="body">
            {i + 1}
          </Text>
        )}
      </Flex>
      <Flex flexDirection="column">
        <Text ml={3} fontSize={3}>
          {appName}
        </Text>
        {state === ItemState.Skipped ? (
          <Text ml={3} color="neutral.c70" fontSize={2}>
            {t("onboardingAppInstall.progress.skipped", { productName })}
          </Text>
        ) : null}
      </Flex>
    </Flex>
  );
};

export default memo(AppInstallItem);
