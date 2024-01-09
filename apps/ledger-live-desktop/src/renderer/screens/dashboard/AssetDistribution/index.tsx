import React, { useState, useRef, useLayoutEffect } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import IconAngleDown from "~/renderer/icons/AngleDown";
import Row from "./Row";
import Header from "./Header";
import { useDistribution } from "~/renderer/actions/general";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";

export default function AssetDistribution() {
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);

  const distribution = useDistribution({
    hideEmptyTokenAccount,
  });
  const cardRef = useRef(null);
  const [showAll, setShowAll] = useState(false);
  const [isVisible, setVisible] = useState(false);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  useLayoutEffect(() => {
    const scrollArea = document.getElementById("scroll-area");
    if (!cardRef.current) {
      return;
    }
    const callback = (entries: { isIntersecting: boolean }[]) => {
      if (entries[0] && entries[0].isIntersecting) {
        setVisible(true);
      }
    };
    const observer = new IntersectionObserver(callback, {
      threshold: 0.0,
      root: scrollArea,
      rootMargin: "-48px",
    });
    observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  const {
    showFirst: initialRowCount,
    list,
    list: { length: totalRowCount },
  } = distribution;
  const almostAll = initialRowCount + 3 > totalRowCount;
  const filteredList = list.filter(elem => !blacklistedTokenIds.includes(elem.currency.id));

  const subList = showAll || almostAll ? filteredList : filteredList.slice(0, initialRowCount);

  return filteredList.length ? (
    <TableContainer>
      <TableHeader
        title={
          <Trans
            i18nKey="distribution.header"
            values={{
              count: filteredList.length,
            }}
          />
        }
      />
      <Box p={0}>
        <Header />
        <div ref={cardRef}>
          {subList.map(item => (
            <Row key={item.currency.id} item={item} isVisible={isVisible} />
          ))}
        </div>
        {!almostAll && (
          <SeeAllButton expanded={showAll} onClick={() => setShowAll(state => !state)}>
            <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
              <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
            </Text>
            <IconAngleDown size={16} />
          </SeeAllButton>
        )}
      </Box>
    </TableContainer>
  ) : null;
}
const SeeAllButton = styled.div<{
  expanded: boolean;
}>`
  margin-top: 15px;
  display: flex;
  color: ${p => p.theme.colors.wallet};
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${p => p.theme.colors.palette.divider};
  height: 40px;
  cursor: pointer;

  &:hover ${Text} {
    text-decoration: underline;
  }

  > :nth-child(2) {
    margin-left: 8px;
    transform: rotate(${p => (p.expanded ? "180deg" : "0deg")});
  }
`;
