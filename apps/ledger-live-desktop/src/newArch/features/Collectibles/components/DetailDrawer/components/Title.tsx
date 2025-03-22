import React from "react";
import { HeaderTextProps } from "LLD/features/Collectibles/types/DetailDrawer";
import Text from "~/renderer/components/Text";
import { Skeleton } from "LLD/features/Collectibles/components/index";

const styles: React.CSSProperties = {
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  display: "-webkit-box",
  wordWrap: "break-word",
  hyphens: "auto",
};

const TitleComponent: React.FC<HeaderTextProps> = ({ isLoading, text, id }) => (
  <Text
    ff="Inter|SemiBold"
    fontSize={7}
    lineHeight="29px"
    color="palette.text.shade100"
    style={styles}
    uppercase
    data-testid={id}
  >
    <Skeleton show={isLoading} width={100} barHeight={10} minHeight={24}>
      {text}
    </Skeleton>
  </Text>
);

export const Title = TitleComponent;
