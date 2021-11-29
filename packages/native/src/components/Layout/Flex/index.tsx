import baseStyled, { BaseStyledProps } from "../../styled";

export type FlexBoxProps = BaseStyledProps;

// Same as FlexBoxProps, to avoid breaking change
export type Props = BaseStyledProps;

const FlexBox = baseStyled.View<BaseStyledProps>`
  display: flex;
`;

export default FlexBox;
