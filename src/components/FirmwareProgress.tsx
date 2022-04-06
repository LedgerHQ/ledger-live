import React, { memo } from "react";
import { ProgressLoader, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";

type Props = {
  progress?: number,
};

function FirmwareProgress({ progress }: Props) {
  return (
    <ProgressLoader
      progress={progress}
      infinite={!progress}
      radius={32}
      strokeWidth={8}
    >
      <Text color="primary.c80" variant="paragraph" fontWeight="semiBold">
        {progress ? `${Math.round(progress * 100)}%`: ""}
      </Text>
    </ProgressLoader>
  );
}


export default memo<Props>(FirmwareProgress);
