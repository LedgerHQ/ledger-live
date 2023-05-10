import React from "react";
import { Text, Tag } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import styled from "styled-components";

const Wrapper = styled.div`
  position: absolute;
  border: 1px solid ${p => p.theme.colors.wallet};
  background: ${p => p.theme.colors.wallet};
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 4px;
  color: white;
  bottom: -12px;
  right: -12px;
`;
const Pro = () => (
  <Wrapper>
    <Text variant="small" style={{fontSize: "8px"}}>
      {"PRO"}
    </Text>
  </Wrapper>
);
export default withV3StyleProvider(Pro);
