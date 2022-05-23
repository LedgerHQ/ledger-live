import React, { useCallback, memo } from "react";
import { useTheme } from "styled-components/native";
import { Unit, AccountLike } from "@ledgerhq/live-common/lib/types";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { ValueChange } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { Flex, Text, Transitions } from "@ledgerhq/native-ui";

import Delta from "./Delta";
import getWindowDimensions from "../logic/getWindowDimensions";
import Graph from "./Graph";

const { width } = getWindowDimensions();

type HeaderTitleProps = {
  valueChange: ValueChange;
  cryptoCurrencyUnit: Unit;
};

const GraphCardHeader = ({
  cryptoCurrencyUnit,
  valueChange,
}: HeaderTitleProps) => {
  return (
    <Flex flexDirection={"row"} px={6} justifyContent={"space-between"}>
      <Flex>
        <Flex flexDirection={"row"}>
          <Text variant={"large"} fontWeight={"medium"} color={"neutral.c70"}>
            {`0 ${cryptoCurrencyUnit.code}`}
          </Text>
        </Flex>
        <Text
          fontFamily="Inter"
          fontWeight="semiBold"
          fontSize="30px"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          $0.00
        </Text>
        <Flex flexDirection="row" alignItems="center">
          <Delta percent valueChange={valueChange} />
          <Flex ml={2}>
            <Delta unit={cryptoCurrencyUnit} valueChange={valueChange} />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

type Props = {
  account: AccountLike;
  valueChange: ValueChange;
};

function ReadOnlyAccountGraphCard({ account, valueChange }: Props) {
  const { colors } = useTheme();
  const mapCryptoValue = useCallback(d => d.value || 0, []);

  const data = [
    {
      date: new Date("2020-09-01T09:39:44.627Z"),
      value: 1085050,
    },
    {
      date: new Date("2020-09-03T12:36:11.640Z"),
      value: 459613,
    },
    {
      date: new Date("2020-09-06T02:27:14.080Z"),
      value: 385910,
    },
    {
      date: new Date("2020-09-07T14:39:55.933Z"),
      value: 830111,
    },
    {
      date: new Date("2020-09-08T02:17:11.836Z"),
      value: 769029,
    },
    {
      date: new Date("2020-09-09T10:59:20.890Z"),
      value: 880261,
    },
    {
      date: new Date("2020-09-09T12:12:13.294Z"),
      value: 1195249,
    },
    {
      date: new Date("2020-09-10T07:54:53.153Z"),
      value: 1940611,
    },
    {
      date: new Date("2020-09-11T07:39:42.168Z"),
      value: 2466750,
    },
    {
      date: new Date("2020-09-11T14:38:03.176Z"),
      value: 68887,
    },
    {
      date: new Date("2020-09-13T10:31:16.727Z"),
      value: 60196,
    },
    {
      date: new Date("2020-09-18T22:05:41.025Z"),
      value: 1543341,
    },
    {
      date: new Date("2020-09-24T06:13:23.958Z"),
      value: 1372378,
    },
    {
      date: new Date("2020-09-27T03:34:51.048Z"),
      value: 1891065,
    },
    {
      date: new Date("2020-09-27T12:06:14.927Z"),
      value: 2089097,
    },
    {
      date: new Date("2020-09-29T22:08:41.554Z"),
      value: 1482601,
    },
    {
      date: new Date("2020-10-08T17:18:03.224Z"),
      value: 508307,
    },
    {
      date: new Date("2020-10-11T20:08:46.037Z"),
      value: 1453607,
    },
  ];

  return (
    <Flex
      flexDirection="column"
      bg="neutral.c30"
      mt={20}
      py={6}
      borderRadius={8}
    >
      <GraphCardHeader
        cryptoCurrencyUnit={getAccountUnit(account)}
        valueChange={valueChange}
      />
      <Flex height={120} alignItems="center" justifyContent="center">
        <Transitions.Fade duration={400} status="entering">
          {/** @ts-expect-error import js issue */}
          <Graph
            isInteractive={false}
            isLoading={false}
            height={120}
            width={width - 32}
            color={colors.neutral.c50}
            data={data}
            mapValue={mapCryptoValue}
            onItemHover={() => {}}
            verticalRangeRatio={10}
          />
        </Transitions.Fade>
      </Flex>
    </Flex>
  );
}

export default memo(ReadOnlyAccountGraphCard);
