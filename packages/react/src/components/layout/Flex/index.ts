import { flexbox, SpaceProps, FlexboxProps as FlexProps, compose } from "styled-system";
import styled from "styled-components";
import gapsSystem from "@ui/styles/system/gaps";
import { space } from "styled-system";

export type FlexBoxProps = FlexProps &
  SpaceProps & { columnGap?: string | number; rowGap?: string | number };

const FlexBox = styled.div<FlexBoxProps>`
  display: flex;
  ${flexbox};
  ${space}
  ${compose(gapsSystem, flexbox)}
`;

export default FlexBox;
