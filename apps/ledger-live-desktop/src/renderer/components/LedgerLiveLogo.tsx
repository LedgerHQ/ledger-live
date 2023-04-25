import React, { PureComponent } from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";

type Props = {
  icon: React.ReactNode;
  width?: number;
  height?: number;
} & React.ComponentProps<typeof LiveLogoContainer>;

class LedgerLiveLogo extends PureComponent<Props> {
  render() {
    const { icon, ...p } = this.props;
    return (
      <LiveLogoContainer {...p} data-test-id="logo">
        {icon}
      </LiveLogoContainer>
    );
  }
}
const LiveLogoContainer = styled(Box).attrs(() => ({
  borderRadius: "4px",
  alignItems: "center",
  justifyContent: "center",
}))<{
  width?: number;
  height?: number;
}>`
  color: ${p => p.theme.colors.palette.secondary.main};
  background-color: ${p => p.theme.colors.palette.primary.contrastText};
  box-shadow: 0 2px 24px 0 #00000014;
  width: ${p => (p.width ? p.width : "80px")};
  height: ${p => (p.height ? p.height : "80px")};
`;
export default LedgerLiveLogo;
