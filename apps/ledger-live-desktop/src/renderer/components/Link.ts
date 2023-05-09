import styled from "styled-components";
import { space, lineHeight, fontSize, fontWeight, color } from "styled-system";
export const FakeLink = styled.span`
  text-decoration: underline;
  cursor: pointer;
  color: ${p => p.color || p.theme.colors.wallet};
`;
const Link = styled.a`
  ${color};
  ${fontSize};
  ${fontWeight};
  ${space};
  ${lineHeight}
  cursor: pointer;
  color: currentColor;
  text-decoration-skip: ink;
`;
export default Link;
