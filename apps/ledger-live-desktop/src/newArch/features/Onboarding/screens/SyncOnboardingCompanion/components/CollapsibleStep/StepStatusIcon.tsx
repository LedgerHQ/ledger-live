import React from "react";
import styled, { useTheme } from "styled-components";
import { Flex, IconsLegacy } from "@ledgerhq/react-ui";

export type StepStatus = "inactive" | "completed";

const CenterCircle = styled(Flex)<{ status: StepStatus }>`
  border-radius: 9999px;
  width: 100%;
  background: ${p => (p.status === "completed" ? "transparent" : p.theme.colors.neutral.c40)};
  border: 2px solid
    ${p => (p.status === "completed" ? p.theme.colors.success.c70 : p.theme.colors.primary.c80)};
  align-items: center;
  justify-content: center;
  position: relative;
`;

const IconWrapper = styled(Flex)`
  height: 16px;
  width: 16px;
`;

export interface StepStatusIconProps {
  status: StepStatus;
}

const Container = styled(Flex)`
  flex-direction: column;
  align-items: center;
`;

function StepStatusIcon({ status, ...props }: Readonly<StepStatusIconProps>) {
  const { colors } = useTheme();

  return (
    <Container {...props}>
      <IconWrapper>
        <CenterCircle status={status}>
          {status === "completed" && (
            <Flex position="absolute" data-testid="sync-onboarding-status-icon">
              <IconsLegacy.CircledCheckSolidMedium color={colors.success.c70} size={20} />
            </Flex>
          )}
        </CenterCircle>
      </IconWrapper>
    </Container>
  );
}

export default React.memo(StepStatusIcon);
