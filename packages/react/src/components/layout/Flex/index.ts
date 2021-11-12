import { flexbox, FlexboxProps as FlexProps } from "styled-system";
import styled from "styled-components";
import Box, { BoxProps } from "../Box";

export type FlexBoxProps = BoxProps & FlexProps;

const FlexBox = styled(Box)<FlexBoxProps>`
  display: flex;
  ${flexbox};
`;

export default FlexBox;
