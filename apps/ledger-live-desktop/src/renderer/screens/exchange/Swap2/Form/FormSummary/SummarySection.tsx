import React from "react";
import styled from "styled-components";

const Container = styled.div`
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
