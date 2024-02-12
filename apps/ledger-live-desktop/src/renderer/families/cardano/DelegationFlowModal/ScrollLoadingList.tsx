import React, { useCallback, useState, useRef, memo, useEffect } from "react";
import debounce from "lodash/debounce";
import { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import BigSpinner from "~/renderer/components/BigSpinner";

const ScrollContainer = styled(Box).attrs(p => ({
  vertical: true,
  pl: p.theme.overflow.trackSize,
  mb: -40,
}))`
  ${p => p.theme.overflow.yAuto};
`;

type ScrollLoadingListProps = {
  data: Array<StakePool>;
  renderItem: (a: StakePool, index: number) => React.ReactNode;
  noResultPlaceholder: React.ReactNode | undefined | null;
  scrollEndThreshold?: number;
  bufferSize?: number;
  style?: React.CSSProperties;
  fetchPoolsFromNextPage: () => void;
  search: string;
  isPaginating: boolean;
};

const ScrollLoadingList = ({
  data,
  renderItem,
  noResultPlaceholder,
  scrollEndThreshold = 200,
  bufferSize = 20,
  style,
  fetchPoolsFromNextPage,
  search,
  isPaginating,
}: ScrollLoadingListProps) => {
  const scrollRef = useRef<HTMLInputElement | null>(null);
  const [scrollOffset, setScrollOffset] = useState(bufferSize);
  useEffect(() => {
    // $FlowFixMe
    if (search !== "") {
      setScrollOffset(bufferSize);
    } else {
      setScrollOffset(data.length - 20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, scrollRef, bufferSize]);

  const handleScroll = useCallback(async () => {
    const target = scrollRef && scrollRef.current;
    if (
      target &&
      // $FlowFixMe
      target.scrollTop + target.offsetHeight >= target.scrollHeight - scrollEndThreshold
    ) {
      fetchPoolsFromNextPage();
      setScrollOffset(Math.min(data.length, scrollOffset + bufferSize));
    }
  }, [
    setScrollOffset,
    fetchPoolsFromNextPage,
    scrollOffset,
    data.length,
    bufferSize,
    scrollEndThreshold,
  ]);
  return (
    <ScrollContainer ref={scrollRef} onScroll={debounce(handleScroll, 50)} style={style}>
      {data.length > bufferSize
        ? data.slice(0, scrollOffset).map(renderItem)
        : data.map(renderItem)}
      {isPaginating ? (
        <Box flex={1} py={4} alignItems="center" justifyContent="center">
          <BigSpinner size={30} />
        </Box>
      ) : null}
      {data.length <= 0 && noResultPlaceholder}
    </ScrollContainer>
  );
};

export default memo<ScrollLoadingListProps>(ScrollLoadingList);
