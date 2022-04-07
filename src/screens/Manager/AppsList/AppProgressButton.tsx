import React from "react";

import type { State } from "@ledgerhq/live-common/lib/apps";
import styled, { useTheme } from "styled-components/native";

import { Box, ProgressLoader, Icons } from "@ledgerhq/native-ui";

import { useAppInstallProgress } from "@ledgerhq/live-common/lib/apps/react";

type Props = {
  state: State,
  name: string,
  installing: boolean,
  updating: boolean,
  size: number,
};

const StopIcon = styled(Box).attrs((p: {size: number; color: string}) => ({
  width: p.size,
  height: p.size,
  borderRadius: p.size / 20,
  backgroundColor: p.color,
}))``;

export default function AppProgressButton({
  state,
  name,
  installing,
  updating,
  size = 48,
}: Props) {
  const { colors } = useTheme();
  const progress = useAppInstallProgress(state, name);

  const color = updating || installing ? colors.primary.c80 : colors.error.c100;

  return (
    <ProgressLoader
      onPress={() => {}}
      progress={progress}
      infinite={!installing && !updating}
      radius={size / 2}
      strokeWidth={2}
      mainColor={color}
    >
      {installing || updating ? (
        <StopIcon size={size / 4.8} color={color} />
      ) : (
        <Icons.TrashMedium size={size * 0.375} color={color} />
      )}
    </ProgressLoader>
  );
}
