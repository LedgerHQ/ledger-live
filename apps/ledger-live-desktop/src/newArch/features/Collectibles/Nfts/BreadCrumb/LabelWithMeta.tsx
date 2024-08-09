import React from "react";
import { ProtoNFT } from "@ledgerhq/types-live";
import { DropDownItemType } from "~/renderer/components/DropDownSelector";
import { Check, Item } from "LLD/components/BreadCrumb/common";
import { CollectionName } from "../../components";
import Text from "~/renderer/components/Text";
import { Icons } from "@ledgerhq/react-ui";

type Props = {
  item: DropDownItemType<ProtoNFT>;
  isActive: boolean;
};

const LabelWithMeta: React.FC<Props> = ({ item, isActive }) => {
  return (
    <Item isActive={isActive}>
      <Text ff={`Inter|${isActive ? "SemiBold" : "Regular"}`} fontSize={4}>
        <CollectionName nft={item?.content} fallback={item?.content?.contract} />
      </Text>
      {isActive && (
        <Check>
          <Icons.Check size={"XS"} />
        </Check>
      )}
    </Item>
  );
};

export default LabelWithMeta;
