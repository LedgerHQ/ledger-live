import React from "react";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";

export default function ValidatorImage({ label, size }: Readonly<{ label: string; size: number }>) {
  return (
    <Circle crop size={size}>
      <FirstLetterIcon label={label} round size={size} fontSize={24} />
    </Circle>
  );
}

export function makeValidatorImage(label: string) {
  return function DrawerValidatorImage({ size }: Readonly<{ size: number }>) {
    return <ValidatorImage label={label} size={size} />;
  };
}
