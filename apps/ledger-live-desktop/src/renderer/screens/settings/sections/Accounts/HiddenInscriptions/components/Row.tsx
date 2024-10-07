import React from "react";
import { HiddenNftCollectionRowContainer, IconContainer } from "./styledComponents";
import { Flex, Icons } from "@ledgerhq/react-ui";
import { Media } from "LLD/features/Collectibles/components";
import Skeleton from "~/renderer/components/Nft/Skeleton";
import Text from "~/renderer/components/Text";
import { useRowModel } from "./useRowModel";

type Props = {
  inscriptionId: string;
  unHideInscription: () => void;
};

type ViewProps = ReturnType<typeof useRowModel>;

function View({ unHideInscription, isLoading, previewUri, inscriptionName }: ViewProps) {
  return (
    <HiddenNftCollectionRowContainer>
      <Flex flex={1}>
        <Skeleton show={isLoading} minHeight={32} width={132}>
          <Flex flex={1} alignItems="center">
            <Media
              mediaFormat="preview"
              isLoading={isLoading}
              useFallback={true}
              contentType="image"
              mediaType="image"
              uri={previewUri}
              size={32}
            />
            <Text
              style={{
                marginLeft: 10,
                flex: 1,
              }}
              ff="Inter|Medium"
              color="palette.text.shade100"
              fontSize={3}
            >
              {inscriptionName}
            </Text>
          </Flex>
        </Skeleton>
      </Flex>
      <IconContainer onClick={unHideInscription}>
        <Icons.Close size="S" />
      </IconContainer>
    </HiddenNftCollectionRowContainer>
  );
}

export const Row = ({ inscriptionId, unHideInscription }: Props) => {
  return <View {...useRowModel({ inscriptionId, unHideInscription })} />;
};
