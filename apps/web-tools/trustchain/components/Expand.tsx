import React from "react";
import styled from "styled-components";

const Details = styled.details`
  margin-top: 20px;
`;

const Summary = styled.summary`
  cursor: pointer;
  font-weight: bold;
`;
export default function Expand({
  title,
  children,
  expanded,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  expanded?: boolean;
}) {
  return (
    <Details open={expanded}>
      <Summary>{title}</Summary>
      {children}
    </Details>
  );
}
