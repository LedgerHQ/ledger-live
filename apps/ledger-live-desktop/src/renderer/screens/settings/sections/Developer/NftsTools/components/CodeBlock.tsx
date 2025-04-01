import React from "react";
import styled from "styled-components";

export const CodeBlock = ({ code }: { code: string }) => {
  return (
    <Pre>
      <code>{code}</code>
    </Pre>
  );
};

const Pre = styled.pre`
  background-color: ${p => p.theme.colors.opacityDefault.c10};
  color: ${p => p.theme.colors.neutral.c80};
  padding: 4px 8px;
  border-radius: 8px;
  overflow-x: auto;
`;
