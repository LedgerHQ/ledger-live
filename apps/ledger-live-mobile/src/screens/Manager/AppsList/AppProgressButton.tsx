import React from "react";

import { useTheme } from "styled-components/native";
import { ProgressLoader, Icons } from "@ledgerhq/native-ui";
import { useAppInstallProgress } from "@ledgerhq/live-common/lib/apps/react";

type Props = {
  state: State;
  name: string;
  installing: boolean;
  updating: boolean;
  size: number;
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
  const isPrimary = updating || installing;

  const color = isPrimary
    ? progress
      ? colors.primary.c80
      : colors.neutral.c80
    : colors.error.c100;
  const secondaryColor =
    isPrimary && progress ? colors.primary.c40 : colors.neutral.c50;

  return (
    <ProgressLoader
      onPress={() => {}}
      progress={progress}
      infinite={!progress}
      radius={size / 2}
      strokeWidth={2}
      mainColor={color}
      secondaryColor={secondaryColor}
    />
  );
}
