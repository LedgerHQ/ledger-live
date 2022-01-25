import React from "react";
import FlexBox from "../../layout/Flex";

export type Props = {
  /* Content displayed on the left side of the header. */
  left?: React.ReactNode;
  /* Content displayed on the right side of the header. */
  right?: React.ReactNode;
  /* Content displayed in the middle part - vertically centered. */
  children?: React.ReactNode;
} & React.ComponentProps<typeof FlexBox>;

export default function ({ left, right, children, ...rest }: Props): JSX.Element {
  return (
    <FlexBox justifyContent="space-between" {...rest}>
      {left}
      <FlexBox justify-content="center">{children}</FlexBox>
      {right}
    </FlexBox>
  );
}
