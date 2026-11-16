import baseStyled, { BaseStyledProps } from "../../styled";

const FlexBox = baseStyled.div.attrs<BaseStyledProps>({
  display: "flex",
  minWidth: 0,
})``;
export type FlexBoxProps = BaseStyledProps & React.HTMLAttributes<HTMLDivElement>;

export default FlexBox;
