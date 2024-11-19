import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { ContentCardItem, ContentCardProps } from "~/contentCards/cards/types";
import Bullet from "~/contentCards/layouts/carousel/pagination/bullets";
import { getItemStatus } from "~/contentCards/layouts/carousel/pagination/utils";
import { WidthFactor } from "../../types";

type Props<P extends ContentCardProps> = {
  items: ContentCardItem<P>[];
  carouselIndex: number;
};

const Pagination = <P extends ContentCardProps>({ items, carouselIndex }: Props<P>) => {
  const hasHalfWidth = items[0].props.carouselWidthFactor === WidthFactor.Half;
  const isSmallCard = carouselIndex === items.length - 2 && hasHalfWidth;
  return (
    <Flex
      alignSelf="center"
      flexDirection="row"
      columnGap={4}
      justifyContent="center"
      width={250}
      overflow="hidden"
    >
      {items.map((item, index) => (
        <Bullet
          key={item.props.metadata.id}
          type={getItemStatus(index, isSmallCard ? carouselIndex + 1 : carouselIndex)}
        />
      ))}
    </Flex>
  );
};

export default Pagination;
