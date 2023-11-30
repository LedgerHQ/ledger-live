import { Flex } from "@ledgerhq/native-ui";
import { useRef, useState } from "react";
import { Dimensions, ScrollView } from "react-native";
import Bullet from "./bullets";

type Props = {
  elements: React.ReactNode[];

  //
  gap?: number;
};

/**
 *
 */
const Carousel = ({ elements, gap = 6 }: Props) => {
  const ref = useRef<ScrollView>(null);

  const [index, setIndex] = useState(1);

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / event.nativeEvent.layoutMeasurement.width);

    if (newIndex !== index) {
      setIndex(newIndex);
    }
  };

  return (
    <Flex rowGap={8}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={true}
        onScroll={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {elements.map((item, index) => (
          <Flex key={index} width={Dimensions.get("screen").width} position={"relative"} px={gap}>
            {item}
          </Flex>
        ))}
      </ScrollView>

      <Flex flexDirection="row" columnGap={4} justifyContent="center">
        {elements.map((_, _index) => (
          <Bullet
            type={_index === index ? "active" : Math.abs(_index - index) === 1 ? "nearby" : "far"}
          />
        ))}
      </Flex>
    </Flex>
  );
};

export default Carousel;
