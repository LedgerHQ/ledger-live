import React from "react";
import styled from "styled-components";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
const Container: ThemedComponent<{}> = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  min-height: 20px;
`;
type SummarySectionProps = {
  children: React.ReactNode;
};
const SummarySection = ({ children }: SummarySectionProps) => <Container>{children}</Container>;
export default SummarySection;
