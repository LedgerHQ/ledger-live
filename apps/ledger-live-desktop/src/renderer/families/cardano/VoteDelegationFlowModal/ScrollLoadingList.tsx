import React, { useCallback, useState, useRef, memo, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";
import { DRep } from "@ledgerhq/coin-cardano/api/api-types";
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
  data: Array<DRep>;
  renderItem: (a: DRep, index: number) => React.ReactNode;
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Number of rows rendered. Grows by `bufferSize` on each scroll-end and is reset only when the
  // search changes, so pages appended by pagination (or a parent re-render) don't collapse the list.
  const [scrollOffset, setScrollOffset] = useState(bufferSize);
  useEffect(() => {
    setScrollOffset(bufferSize);
  }, [search, bufferSize]);

  const handleScroll = useCallback(() => {
    const target = scrollRef.current;
    if (
      target &&
      target.scrollTop + target.offsetHeight >= target.scrollHeight - scrollEndThreshold
    ) {
      fetchPoolsFromNextPage();
      setScrollOffset(prev => Math.min(Math.max(data.length, bufferSize), prev + bufferSize));
    }
  }, [fetchPoolsFromNextPage, data.length, bufferSize, scrollEndThreshold]);

  const debouncedHandleScroll = useMemo(() => debounce(handleScroll, 50), [handleScroll]);

  useEffect(() => {
    return () => {
      debouncedHandleScroll.cancel();
    };
  }, [debouncedHandleScroll]);

  return (
    <ScrollContainer ref={scrollRef} onScroll={debouncedHandleScroll} style={style}>
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
