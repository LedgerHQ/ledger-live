import React, { memo } from "react";
import { ProgressLoader, Text } from "@ledgerhq/native-ui";

type Props = {
  progress?: number,
};

function DeviceActionProgress({ progress }: Props) {
  return (
    <ProgressLoader
      progress={progress}
      infinite={!progress || progress === 1}
      radius={32}
      strokeWidth={8}
    >
      <Text color="primary.c80" variant="paragraph" fontWeight="semiBold">
        {progress && progress < 1 ? `${Math.round(progress * 100)}%`: ""}
      </Text>
    </ProgressLoader>
  );
}


export default memo<Props>(DeviceActionProgress);
