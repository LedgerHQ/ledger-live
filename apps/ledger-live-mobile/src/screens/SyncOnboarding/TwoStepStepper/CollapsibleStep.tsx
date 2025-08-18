import React, { PropsWithChildren } from "react";
import CircledCheckSolidMedium from "@ledgerhq/icons-ui/nativeLegacy/CircledCheckSolidMedium";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";

export type CollapsibleStepStatus = "complete" | "unfinished";

interface CollapsibleStepProps extends PropsWithChildren {
  status: CollapsibleStepStatus;
  title?: string;
  isCollapsed: boolean;
  isFirst?: boolean;
  hideTitle?: boolean;
  background?: React.JSX.Element | null;
}

interface CenterCircleProps {
  status: CollapsibleStepStatus;
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

const CollapsibleCard = styled(Flex)`
  background: ${p => p.theme.colors.neutral.c20};
  padding: 16px;
  border-radius: 12px;
`;

const StatusIcon = (props: CenterCircleProps) => {
  const { colors } = useTheme();
  return (
    <CenterCircle {...props}>
      {props.status === "complete" && (
        <CircledCheckSolidMedium color={colors.success.c70} size={20} />
      )}
    </CenterCircle>
  );
};

const CollapsibleStep = ({
  status,
  title,
  isCollapsed,
  children,
  isFirst,
  hideTitle,
  background: Background,
}: CollapsibleStepProps) => {
  if (isCollapsed) {
    return (
      <CollapsibleCard
        justifyContent="space-between"
        flexDirection="row"
        marginTop={isFirst ? "16px" : "8px"}
        alignItems="center"
      >
        <Text fontSize="16px" fontWeight="bold">
          {title}
        </Text>
        <StatusIcon status={status} />
      </CollapsibleCard>
    );
  }

  return (
    <CollapsibleCard marginTop={isFirst ? "16px" : "8px"}>
      {!!Background && Background}

      {hideTitle ? (
        <StatusIcon status={status} isAbsolute={hideTitle} />
      ) : (
        <Flex justifyContent="space-between" alignItems="center" flexDirection="row">
          <Text variant="h5" fontWeight="semiBold">
            {title}
          </Text>
          <StatusIcon status={status} />
        </Flex>
      )}
      {children}
    </CollapsibleCard>
  );
};

export default CollapsibleStep;
