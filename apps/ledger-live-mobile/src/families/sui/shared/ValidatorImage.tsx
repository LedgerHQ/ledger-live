import { Image } from "react-native";
import React, { useState } from "react";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";

type Props = {
  size?: number;
  name: string;
  url?: string;
};

const ValidatorImage = ({ size = 64, url, name }: Props) => {
  const [imageError, setImageError] = useState(false);

  if (url && !imageError) {
    return (
      <Circle crop size={size}>
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size }}
          onError={() => setImageError(true)}
        />
      </Circle>
    );
  }

  const displayLabel = name && name.trim() ? name : "?";
  
  return (
    <Circle crop size={size}>
      <FirstLetterIcon label={displayLabel} round size={size} fontSize={24} />
    </Circle>
  );
};

export default ValidatorImage;
