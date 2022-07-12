import React from "react";
import styled from "styled-components";
import { Button, Icons, Flex, Text } from "@ledgerhq/react-ui";

const Container = styled(Flex).attrs(() => ({
  flexDirection: "column",
  p: 12,
}))`
  width: 48%;
`;

export type StepLeftSideProps = {
  Header: React.ReactNode;
  stepTitle?: string;
  description?: string;
  AsideLeft?: React.ReactNode;
  continueLabel?: string;
  backLabel?: string;
  dataTestId: string;
  hideContinueButton?: boolean;
  continueDisabled?: boolean;
  hideBackButton?: boolean;
  backDisabled?: boolean;
  onClickContinue?: (...args: any) => any;
  onClickBack?: (...args: any) => any;
};

const StepLeftSide = ({
  Header,
  stepTitle,
  description,
  AsideLeft,
  continueLabel = "Continue",
  backLabel = "Back",
  hideContinueButton = false,
  continueDisabled = false,
  backDisabled = false,
  hideBackButton = false,
  dataTestId,
  onClickContinue,
  onClickBack,
}: StepLeftSideProps) => {
  return (
    <Container justifyContent="space-between">
      <Flex flexDirection="column">
        {Header}
        {stepTitle && (
          <Text variant="h3" mb={5}>
            {stepTitle}
          </Text>
        )}
        {description && (
          <Text variant="body" fontWeight="medium" color="palette.neutral.c80">
            {description}
          </Text>
        )}
        {AsideLeft}
      </Flex>
      <Flex flexDirection="column">
        {!hideContinueButton && (
          <Button
            data-test-id={dataTestId}
            disabled={continueDisabled}
            variant="main"
            Icon={Icons.ArrowRightRegular}
            onClick={onClickContinue}
          >
            {continueLabel}
          </Button>
        )}
        {!hideBackButton && (
          <Button disabled={backDisabled} onClick={onClickBack}>
            {backLabel}
          </Button>
        )}
      </Flex>
    </Container>
  );
};

export default StepLeftSide;
