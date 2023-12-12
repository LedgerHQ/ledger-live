import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import Bullet from "~/contentCards/layouts/carousel/pagination/bullets";
import { getItemStatus } from "~/contentCards/layouts/carousel/pagination/utils";
import { ContentCardItem } from "~/contentCards/layouts/types";

type Props<P> = {
  items: ContentCardItem<{ id: string } & P>[];
  carouselIndex: number;
};

const Pagination = <P,>({ items, carouselIndex }: Props<P>) => (
  <Flex
    alignSelf="center"
    flexDirection="row"
    columnGap={4}
    justifyContent="center"
    width={250}
    overflow="hidden"
  >
    {items.map((item, index) => (
      <Bullet key={item.props.id} type={getItemStatus(index, carouselIndex)} />
    ))}
  </Flex>
);

export default Pagination;
