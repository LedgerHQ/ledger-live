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
  doneSubTitle?: string;
  showDoneSubtitle?: boolean;
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
  overflow: hidden;
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
  doneSubTitle,
  showDoneSubtitle,
}: CollapsibleStepProps) => {
  if (isCollapsed) {
    return (
      <CollapsibleCard marginTop={isFirst ? "16px" : "8px"}>
        <Flex justifyContent="space-between" alignItems="center" flexDirection="row">
          <Text fontSize="16px" fontWeight="bold">
            {title}
          </Text>
          <StatusIcon status={status} />
        </Flex>
        {(showDoneSubtitle || status === "complete") && doneSubTitle && (
          <Text variant="paragraph" color="neutral.c70" mt={3}>
            {doneSubTitle}
          </Text>
        )}
      </CollapsibleCard>
    );
  }

  return (
    <CollapsibleCard marginTop={isFirst ? "16px" : "8px"}>
      {!!Background && Background}

      {hideTitle ? (
        <StatusIcon status={status} isAbsolute={hideTitle} />
      ) : (
        <>
          <Flex justifyContent="space-between" alignItems="center" flexDirection="row">
            <Text fontSize="16px" fontWeight="bold">
              {title}
            </Text>
            <StatusIcon status={status} />
          </Flex>
          {showDoneSubtitle && doneSubTitle && (
            <Text variant="paragraph" color="neutral.c70" mt={3}>
              {doneSubTitle}
            </Text>
          )}
        </>
      )}
      {children}
    </CollapsibleCard>
  );
};

export default CollapsibleStep;
