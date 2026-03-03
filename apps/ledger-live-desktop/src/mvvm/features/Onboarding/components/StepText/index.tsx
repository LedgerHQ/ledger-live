import React from "react";
import styled from "styled-components";
import { VerticalTimeline } from "@ledgerhq/react-ui";

const StyledStepText = styled(VerticalTimeline.BodyText)`
  white-space: pre-wrap;
`;

// Cast so TypeScript accepts children (styled-components polymorphic types omit it with React 19)
export default StyledStepText as React.ComponentType<
  React.ComponentProps<typeof StyledStepText> & { children?: React.ReactNode }
>;
