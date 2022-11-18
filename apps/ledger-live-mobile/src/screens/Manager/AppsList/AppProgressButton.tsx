import React from "react";

import { useTheme } from "styled-components/native";
import { ProgressLoader } from "@ledgerhq/native-ui";
import { useAppInstallProgress } from "@ledgerhq/live-common/apps/react";
import type { State } from "@ledgerhq/live-common/apps/types";

type Props = {
  state: State;
  name: string;
  installing?: boolean;
  updating?: boolean;
  size?: number;
};

export default function AppProgressButton({
  state,
  name,
  installing,
  updating,
  size = 48,
}: Props) {
  const { colors } = useTheme();
  const progress = useAppInstallProgress(state, name);
  const { currentAppOp } = state;
  const isPrimary = updating || installing;
  const isCurrentAppOp = currentAppOp?.name === name;

  const mainColor = isPrimary ? colors.primary.c80 : colors.error.c100;
  const secondaryColor = isPrimary ? colors.primary.c30 : colors.error.c30;

  return (
    <ProgressLoader
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onPress={() => {}}
      progress={progress}
      infinite={!progress && isCurrentAppOp}
      radius={size / 2}
      strokeWidth={2}
      mainColor={mainColor}
      secondaryColor={secondaryColor}
    />
  );
}
