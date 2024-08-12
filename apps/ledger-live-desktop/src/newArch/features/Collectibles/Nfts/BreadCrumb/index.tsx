import React, { memo } from "react";
import useBreadCrumbModel from "./useBreadCrumbModel";
import { NftBreadcrumbProps } from "../../types/Nfts";
import LabelWithMeta from "./LabelWithMeta";
import { Separator, TextLink, AngleDown } from "LLD/components/BreadCrumb/common";
import Button from "~/renderer/components/Button";
import DropDownSelector from "~/renderer/components/DropDownSelector";
import { CollectionName } from "../../components";
import { Icons } from "@ledgerhq/react-ui";

function View({
  activeItem,
  items,
  collectionAddress,
  onCollectionSelected,
  onSeeAll,
}: NftBreadcrumbProps) {
  return (
    <>
      <TextLink>
        <Button onClick={onSeeAll}>{"NFT"}</Button>
      </TextLink>
      {collectionAddress ? (
        <>
          <Separator />
          <DropDownSelector
            items={items}
            value={activeItem}
            controlled
            renderItem={LabelWithMeta}
            onChange={onCollectionSelected}
          >
            {({ isOpen }) => (
              <TextLink>
                <Button>
                  <CollectionName
                    nft={activeItem?.content}
                    fallback={activeItem?.content?.contract}
                  />
                </Button>
                <AngleDown>
                  {isOpen ? <Icons.ChevronUp size={"XS"} /> : <Icons.ChevronDown size={"XS"} />}
                </AngleDown>
              </TextLink>
            )}
          </DropDownSelector>
        </>
      ) : null}
    </>
  );
}

const NftBreadCrumb: React.FC = () => {
  return <View {...useBreadCrumbModel()} />;
};

export default memo(NftBreadCrumb);
