import React, { PropsWithChildren } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import StepStatusIcon, { StepStatus } from "./StepStatusIcon";
import AnimatedWrapper from "./AnimatedWrapper";

interface CollapsibleStepProps extends PropsWithChildren {
  isCollapsed: boolean;
  title: string;
  isComplete: boolean;
  hideTitle?: boolean;
  background?: React.JSX.Element;
  doneTitle?: string;
}

const CollapsibleStep = ({
  children,
  isCollapsed,
  title,
  isComplete,
  hideTitle,
  background,
  doneTitle,
}: CollapsibleStepProps) => {
  const status: StepStatus = isComplete ? "completed" : "inactive";

  return (
    <div>
      <AnimatedWrapper isCollapsed={isCollapsed} hasSubtitle={!!doneTitle}>
        {!isCollapsed && !!background && background}
        <Flex flexDirection="column" rowGap="2px">
          <Flex
            flexDirection="row"
            flex={1}
            justifyContent={hideTitle ? "flex-end" : "space-between"}
            alignItems="center"
          >
            {!hideTitle && (
              <Text variant="large" fontWeight="semiBold" data-testid="collapsible-step-title">
                {title}
              </Text>
            )}
            <StepStatusIcon status={status} />
          </Flex>
          {isCollapsed && doneTitle && (
            <Flex flex={1} flexDirection="row" alignItems="center">
              <Text variant="body" color="neutral.c70" data-testid="collapsible-step-done-title">
                {doneTitle}
              </Text>
            </Flex>
          )}
        </Flex>
        {!isCollapsed && children}
      </AnimatedWrapper>
    </div>
  );
};

export default CollapsibleStep;
