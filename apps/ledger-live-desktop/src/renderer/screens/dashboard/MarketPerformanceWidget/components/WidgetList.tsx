import React, { useCallback } from "react";
import { PropsBody, PropsBodyElem } from "../types";
import { Flex, Text } from "@ledgerhq/react-ui";
import styled from "@ledgerhq/react-ui/components/styled";
import FormattedVal from "~/renderer/components/FormattedVal";
import { MissingData } from "./MissingData";
import { fontSizes } from "@ledgerhq/react-ui/styles/theme";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { getChangePercentage } from "~/renderer/screens/dashboard/MarketPerformanceWidget/utils";
import { useHistory } from "react-router-dom";
import { track } from "~/renderer/analytics/segment";

export function WidgetList({ data, order, range, top }: PropsBody) {
  const noData = data.length === 0;

  return (
    <Flex flexDirection="column" flex={1} height={275}>
      {noData ? (
        <MissingData order={order} range={range} top={top} />
      ) : (
        data.map((elem, i) => (
          <WidgetRow key={i} index={i + 1} data={elem} isFirst={i === 0} range={range} />
        ))
      )}
    </Flex>
  );
}

function WidgetRow({ data, index, range }: PropsBodyElem) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const history = useHistory();

  const onCurrencyClick = useCallback(() => {
    track("widget_asset_clicked", {
      asset: data.name,
      page: "Portfolio",
    });

    history.push({
      pathname: `/market/${data.id}`,
    });
  }, [data, history]);

  return (
    <MainContainer justifyContent="space-between" py="6px" onClick={onCurrencyClick}>
      <Flex alignItems="center" flex={1}>
        <Text color="neutral.c80" variant="h5Inter" mr={2}>
          {index}
        </Text>

        <CryptoCurrencyIconWrapper hasImage={!!data.image}>
          {data.image ? (
            <img width="32px" height="32px" src={data.image} alt={"currency logo"} />
          ) : (
            <Text color="neutral.c100" variant="h5Inter" fontSize={12}>
              {data.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </CryptoCurrencyIconWrapper>

        <Flex ml={2} overflow="hidden" flexDirection="column" flex={1} alignItems="left">
          <EllipsisText
            variant="paragraph"
            fontWeight="semiBold"
            color="neutral.c100"
            fontSize={fontSizes.paragraph}
          >
            {data.name}
          </EllipsisText>

          <EllipsisText
            variant="small"
            color="neutral.c60"
            fontWeight="medium"
            fontSize={fontSizes.small}
          >
            {data.ticker.toUpperCase()}
          </EllipsisText>
        </Flex>
      </Flex>

      <Flex flexDirection="column">
        <Text textAlign="right">
          <FormattedVal
            isPercent
            isNegative
            val={Number(parseFloat(String(getChangePercentage(data, range))).toFixed(2))}
            inline
            withIcon
            style={{
              fontSize: fontSizes.paragraph,
              fontWeight: "medium",
            }}
          />
        </Text>
        <EllipsisText
          variant="small"
          textAlign="right"
          color="neutral.c100"
          fontWeight="medium"
          fontSize={fontSizes.small}
        >
          {!data.price
            ? "-"
            : counterValueFormatter({
                value: Number(parseFloat(String(data.price)).toFixed(data.price > 1 ? 2 : 6)),
                currency: counterValueCurrency.ticker,
                locale,
              })}
        </EllipsisText>
      </Flex>
    </MainContainer>
  );
}

const MainContainer = styled(Flex)`
  &:hover {
    background-color: ${p => p.theme.colors.opacityDefault.c05};
    padding: 6px 12px;
    border-radius: 12px;
    transition:
      background-color 0.35s ease,
      padding 0.35s ease;
    cursor: pointer;
  }
`;

const CryptoCurrencyIconWrapper = styled(Flex)<{
  hasImage?: boolean;
}>`
  height: 32px;
  width: 32px;
  position: relative;
  border-radius: 32px;
  overflow: hidden;
  background-color: ${p => (p.hasImage ? "transparent" : p.theme.colors.opacityDefault.c05)};
  img {
    object-fit: cover;
  }
  align-items: center;
  justify-content: center;
`;

const EllipsisText = styled(Text)`
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
