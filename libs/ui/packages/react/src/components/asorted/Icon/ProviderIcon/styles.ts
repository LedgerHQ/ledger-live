import styled from "../../../styled";

export const sizes = {
  XXS: 16,
  XS: 24,
  S: 32,
  M: 40,
  L: 48,
  XL: 56,
};

export type IconSizes = keyof typeof sizes;

type StyledIconProps = {
  size: IconSizes;
};

export const Icon = styled.img<StyledIconProps>`
  border-radius: 8px;
  width: ${({ size }) => sizes[size]}px;
  height: ${({ size }) => sizes[size]}px;
`;
