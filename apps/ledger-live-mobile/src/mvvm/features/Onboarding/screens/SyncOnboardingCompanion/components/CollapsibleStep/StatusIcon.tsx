import React from "react";
import CircledCheckSolidMedium from "@ledgerhq/icons-ui/nativeLegacy/CircledCheckSolidMedium";
import { Flex } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { View } from "react-native";

export type StepStatus = "complete" | "unfinished";

interface CenterCircleProps {
  status: StepStatus;
  isAbsolute?: boolean;
}

const CenterCircle = styled(Flex)<CenterCircleProps>`
  border-radius: 9999px;
  width: 16px;
  height: 16px;
  ${p => p.status !== "complete" && `background: ${p.theme.colors.primary.c40};`}
  ${p => p.status === "unfinished" && `border: 2px solid ${p.theme.colors.primary.c80};`}
  align-items: center;
  justify-content: center;
  ${p => p.isAbsolute && `position: absolute; right: 16px; top: 16px;`}
`;

const StatusIcon = (props: CenterCircleProps) => {
  const { colors } = useTheme();
  return (
    <CenterCircle {...props} testID="status-icon">
      {props.status === "complete" && (
        <View testID="green-checkmark">
          <CircledCheckSolidMedium color={colors.success.c70} size={20} />
        </View>
      )}
    </CenterCircle>
  );
};

export default StatusIcon;
