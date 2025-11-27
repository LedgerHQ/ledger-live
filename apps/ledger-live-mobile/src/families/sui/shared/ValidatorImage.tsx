import { Image } from "react-native";
import React from "react";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";

type Props = {
  size?: number;
  name: string;
  url?: string;
};

const ValidatorImage = ({ size = 64, url, name }: Props) => {
  return (
    <Circle crop size={size}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} />
      ) : (
        <FirstLetterIcon label={name ?? "-"} round size={size} fontSize={24} />
      )}
    </Circle>
  );
};

export default ValidatorImage;
