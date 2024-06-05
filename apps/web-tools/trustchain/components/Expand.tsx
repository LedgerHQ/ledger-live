import React from "react";
import styled from "styled-components";

const Details = styled.details`
  margin-top: 20px;
`;

const Summary = styled.summary`
  cursor: pointer;
  font-weight: bold;
`;
export default function Expand({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Details>
      <Summary>{title}</Summary>
      {children}
    </Details>
  );
}
