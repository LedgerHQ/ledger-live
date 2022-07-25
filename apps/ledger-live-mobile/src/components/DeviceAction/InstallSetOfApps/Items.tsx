import React from "react";
import { Trans } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { AppOp } from "@ledgerhq/live-common/apps/types";
import Item from "./Item";

type Props = {
  currentAppOp: AppOp;
  dependencies?: string[];
  installQueue: string[];
  itemProgress: number;
  progress: number;
};

const Items = ({
  currentAppOp,
  dependencies,
  installQueue,
  itemProgress,
  progress,
}: Props) => (
  <Flex mb={2} alignSelf="flex-start">
    <Text mb={5} variant="paragraphLineHeight">
      <Trans
        i18nKey="installSetOfApps.ongoing.progress"
        values={{ progress: Math.round(progress * 100) }}
      />
    </Text>
    {dependencies?.map((appName, i) => (
      <Item
        key={appName}
        i={i}
        appName={appName}
        isActive={currentAppOp.name === appName}
        installed={!installQueue.includes(appName)}
        itemProgress={itemProgress}
      />
    ))}
  </Flex>
);

export default Items;
