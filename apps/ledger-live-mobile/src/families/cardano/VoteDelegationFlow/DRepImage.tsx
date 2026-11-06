import React from "react";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";

type Props = {
  size?: number;
  name?: string;
};

const DRepImage = ({ size = 64, name }: Props) => {
  let label = name ?? "-";
  if (name === "2") {
    label = "Abstain";
  } else if (name === "3") {
    label = "No Confidence";
  }

  return (
    <Circle crop size={size}>
      <FirstLetterIcon label={label} round size={size} fontSize={24} />
    </Circle>
  );
};

export default DRepImage;
