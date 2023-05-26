import baseStyled, { BaseStyledProps } from "../../styled";

const FlexBox = baseStyled.div.attrs<BaseStyledProps, BaseStyledProps>({ display: "flex" })``;
export type FlexBoxProps = BaseStyledProps & React.HTMLAttributes<HTMLDivElement>;

export default FlexBox;
