import React from "react";
import Text from "~/renderer/components/Text";
import { Skeleton } from "LLD/Collectibles/components/index";
import { HeaderTextProps } from "LLD/Collectibles/types/DetailDrawer";

const CollectionNameComponent: React.FC<HeaderTextProps> = ({ isLoading, text }) => (
  <Text ff="Inter|SemiBold" fontSize={5} lineHeight="18px" color="neutral.c70" pb={2}>
    <Skeleton show={isLoading} width={100} barHeight={10} minHeight={24}>
      {text || "-"}
    </Skeleton>
  </Text>
);

export const CollectionName = CollectionNameComponent;
