import React from "react";
import { Image } from "react-native";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";

type Props = {
  size?: number;
  imgUrl?: string;
  name?: string;
};

const ValidatorImage = ({ imgUrl, size = 64, name }: Props) => (
  <Circle crop size={size}>
    {imgUrl && <Image style={{ width: size, height: size }} source={{ uri: imgUrl }} />}
    {!imgUrl && <FirstLetterIcon label={name ?? "-"} round size={size} fontSize={24} />}
  </Circle>
);

export default ValidatorImage;
