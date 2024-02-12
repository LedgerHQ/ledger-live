import React, { useCallback, useState, useRef, memo, useEffect } from "react";
import debounce from "lodash/debounce";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
const ScrollContainer = styled(Box).attrs(p => ({
  pl: p.theme.overflow.trackSize,
  mb: -40,
}))`
  ${p => p.theme.overflow.yAuto};
`;
type ScrollLoadingListProps<D> = {
  data: Array<D>;
  renderItem: (a: D, index: number) => React.ReactNode;
  noResultPlaceholder?: React.ReactNode | null;
  scrollEndThreshold?: number;
  bufferSize?: number;
  style?: React.CSSProperties;
};
function ScrollLoadingList<D>({
  data,
  renderItem,
  noResultPlaceholder,
  scrollEndThreshold = 200,
  bufferSize = 20,
  style,
}: ScrollLoadingListProps<D>) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollOffset, setScrollOffset] = useState(bufferSize);

  /**
   * We are reseting scroll after each change of data
   * to the top position
   */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollOffset(bufferSize);
  }, [data, scrollRef, bufferSize]);
  const handleScroll = useCallback(() => {
    const target = scrollRef && scrollRef.current;
    if (
      // the offset was off when :
      // - do a first search with few results and scroll on the bottom of it
      // - then do one more search but with no result
      // - and redo a research with a result, no items will be display in the scrollContainer
      // we don't allow the value 0 to be able to set the offset to prevent this
      target &&
      target.scrollTop + target.offsetHeight >= target.scrollHeight - scrollEndThreshold
    )
      setScrollOffset(Math.min(data.length, scrollOffset + bufferSize));
  }, [setScrollOffset, scrollOffset, data.length, bufferSize, scrollEndThreshold]);
  return (
    <ScrollContainer ref={scrollRef} onScroll={debounce(handleScroll, 50)} style={style}>
      {data.slice(0, scrollOffset).map(renderItem)}
      {data.length <= 0 && noResultPlaceholder}
    </ScrollContainer>
  );
}
export default memo<ScrollLoadingListProps<unknown>>(ScrollLoadingList) as typeof ScrollLoadingList;
