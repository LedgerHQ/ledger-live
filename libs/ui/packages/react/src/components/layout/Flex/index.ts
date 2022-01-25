import baseStyled, { BaseStyledProps } from "../../styled";

export type FlexBoxProps = BaseStyledProps;

const FlexBox = baseStyled.div.attrs<FlexBoxProps, FlexBoxProps>({ display: "flex" })``;

export default FlexBox;
