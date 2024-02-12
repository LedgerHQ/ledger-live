import React from "react";
import { ImageSourcePropType } from "react-native";
import Illustration from "~/images/illustration/Illustration";
import DiscoverCard from "../Discover/DiscoverCard";

type Props = {
  title: string;
  subTitle: string;
  onPress: () => void;
  imageSource: ImageSourcePropType;
  hasMarginBottom?: boolean;
  testID?: string;
};
export default function AddAccountsModalCard({
  title,
  subTitle,
  onPress,
  imageSource,
  hasMarginBottom = false,
  testID,
}: Props) {
  return (
    <DiscoverCard
      title={title}
      titleProps={{ variant: "large" }}
      subTitle={subTitle}
      subTitleProps={{ variant: "paragraph" }}
      onPress={onPress}
      cardProps={{
        mx: 0,
        mb: hasMarginBottom ? "16px" : 0,
      }}
      Image={<Illustration size={130} darkSource={imageSource} lightSource={imageSource} />}
      testID={testID}
    />
  );
}
