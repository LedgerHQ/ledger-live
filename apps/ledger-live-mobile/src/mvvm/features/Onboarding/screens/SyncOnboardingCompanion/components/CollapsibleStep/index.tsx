import React, { PropsWithChildren } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import StatusIcon, { StepStatus } from "./StatusIcon";

interface CollapsibleStepProps extends PropsWithChildren {
  status: StepStatus;
  title?: string;
  isCollapsed: boolean;
  isFirst?: boolean;
  hideTitle?: boolean;
  background?: React.JSX.Element | null;
  doneSubTitle?: string;
  showDoneSubtitle?: boolean;
}

const CollapsibleCard = styled(Flex)`
  background: ${p => p.theme.colors.neutral.c20};
  padding: 16px;
  border-radius: 12px;
  overflow: hidden;
`;

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
