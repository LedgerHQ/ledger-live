import React, { useCallback, useMemo } from "react";
import { TouchableOpacity } from "react-native";

import type { App } from "@ledgerhq/types-live";
import type { Action, State } from "@ledgerhq/live-common/apps/index";
import styled from "styled-components/native";
import { IconsLegacy, Box } from "@ledgerhq/native-ui";

type Props = {
  app: App;
  state: State;
  dispatch: (_: Action) => void;
};

const ButtonContainer = styled(Box).attrs({
  width: 48,
  height: 48,
  borderRadius: 50,
  alignItems: "center",
  justifyContent: "center",
})``;

export default function AppUpdateButton({ app, state, dispatch: dispatchProps }: Props) {
  const { name } = app;
  const { installed } = state;

  const canUpdate = useMemo(
    () => installed.some(({ name, updated }) => name === app.name && !updated),
    [installed, app.name],
  );

  const updateApp = useCallback(() => {
    if (!canUpdate) return;
    dispatchProps({ type: "install", name });
  }, [canUpdate, dispatchProps, name]);

  return (
    <TouchableOpacity onPress={updateApp} testID={`app-${name}-canUpdate`}>
      <ButtonContainer backgroundColor="primary.c80">
        <IconsLegacy.RefreshMedium size={18} color="neutral.c00" />
      </ButtonContainer>
    </TouchableOpacity>
  );
}
