import React, { HTMLAttributes } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  min-height: 20px;
`;

type SummarySectionProps = {
  children: React.ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const SummarySection = ({ children, ...rest }: SummarySectionProps) => (
  <Container {...rest}>{children}</Container>
);

export default SummarySection;
