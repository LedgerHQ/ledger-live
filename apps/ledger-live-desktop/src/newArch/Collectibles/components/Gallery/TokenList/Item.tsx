import { Account } from "@ledgerhq/types-live";
import React, { memo } from "react";
import { Layout, LayoutKey } from "~/newArch/Collectibles/types/Layouts";
import RowItem from "./RowItem";
import CardItem from "./CardItem";
import Card from "~/renderer/components/Box/Card";
import styled from "styled-components";
import { Skeleton } from "../../Skeleton";
import { Media } from "../../Media";
import Box from "~/renderer/components/Box";
import { Flex } from "@ledgerhq/react-ui";

const Wrapper = styled(Card)`
  &.disabled {
    pointer-events: none;
  }

  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color ease-in-out 200ms;
  :hover {
    border-color: ${p => p.theme.colors.palette.text.shade20};
  }
  :active {
    border-color: ${p => p.theme.colors.palette.text.shade20};
    background: ${p => p.theme.colors.palette.action.hover};
  }
`;

type Props = {
  id: string;
  previewUri: string;
  mode: LayoutKey;
  account: Account;
  isLoading: boolean;
  withContextMenu: boolean;
  onHideCollection?: () => void;
};

const Item = ({
  id,
  previewUri,
  mode,
  account,
  withContextMenu,
  isLoading,
  onHideCollection,
}: Props) => {
  const isGridLayout = mode === Layout.GRID;
  const Component = isGridLayout ? CardItem : RowItem;

  return (
    <Wrapper
      px={3}
      py={isGridLayout ? 3 : 2}
      className={(isLoading || process.env.ALWAYS_SHOW_SKELETONS) ?? "disabled"}
      horizontal={!isGridLayout}
      alignItems={!isGridLayout ?? "center"}
      onClick={() => {}}
    >
      <Skeleton width={40} minHeight={40} full={isGridLayout} show={isLoading}>
        <Flex flexDirection={isGridLayout ? "column" : "row"}>
          <Media
            isLoading={isLoading}
            useFallback={false}
            contentType="image"
            mediaFormat="preview"
            uri={previewUri}
            mediaType="preview"
            size={isGridLayout ? undefined : 40}
            backgroundSize={isGridLayout ? undefined : "700%"}
          />
          <Box ml={isGridLayout ? 0 : 2}>
            <Component />
          </Box>
        </Flex>
      </Skeleton>
    </Wrapper>
  );
};

export default memo<Props>(Item);
