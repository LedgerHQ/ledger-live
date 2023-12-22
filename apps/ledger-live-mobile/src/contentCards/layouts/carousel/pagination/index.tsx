import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { ContentCardItem, ContentCardProps } from "~/contentCards/cards/types";
import Bullet from "~/contentCards/layouts/carousel/pagination/bullets";
import { getItemStatus } from "~/contentCards/layouts/carousel/pagination/utils";

type Props<P extends ContentCardProps> = {
  items: ContentCardItem<P>[];
  carouselIndex: number;
};

const Pagination = <P extends ContentCardProps>({ items, carouselIndex }: Props<P>) => (
  <Flex
    alignSelf="center"
    flexDirection="row"
    columnGap={4}
    justifyContent="center"
    width={250}
    overflow="hidden"
  >
    {items.map((item, index) => (
      <Bullet key={item.props.metadata.id} type={getItemStatus(index, carouselIndex)} />
    ))}
  </Flex>
);

export default Pagination;
