import React, { useEffect, useMemo, useState } from "react";
import { Flex, Text, Alert, Tag, Divider } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { ChainwatchAccount, ChainwatchNetwork } from "@ledgerhq/types-live";
import { SafeAreaView } from "react-native-safe-area-context";
import NavigationScrollView from "~/components/NavigationScrollView";
import styled from "styled-components/native";
import { useSelector } from "react-redux";
import { notificationsSelector } from "~/reducers/settings";
import { getSupportedChainsAccounts } from "@ledgerhq/live-common/transactionsAlerts/index";
import getOrCreateUser from "../../../../user";

export const TagEnabled = styled(Tag).attrs({
  bg: "success.c50",
  uppercase: false,
  type: "color",
  mr: 2,
})``;

export const TagDisabled = styled(Tag).attrs({
  bg: "error.c50",
  uppercase: false,
  type: "color",
  mr: 2,
})``;

export default function DebugTransactionsAlerts() {
  const featureTransactionsAlerts = useFeature("transactionsAlerts");
  const notifications = useSelector(notificationsSelector);
  const chainwatchBaseUrl = featureTransactionsAlerts?.params?.chainwatchBaseUrl;
  const supportedChains: ChainwatchNetwork[] = useMemo(
    () => featureTransactionsAlerts?.params?.networks || [],
    [featureTransactionsAlerts?.params],
  );

  const [chainsData, setChainsData] = useState<Record<string, ChainwatchAccount | undefined>>({});

  useEffect(() => {
    if (chainwatchBaseUrl) {
      getOrCreateUser().then(({ user }) => {
        getSupportedChainsAccounts(user.id, chainwatchBaseUrl, supportedChains).then(
          (results: (ChainwatchAccount | undefined)[]) => {
            const data: Record<string, ChainwatchAccount | undefined> = {};
            for (let i = 0; i < results.length; i++) {
              const chainId = supportedChains[i].ledgerLiveId;
              data[chainId] = results[i];
            }
            setChainsData(data);
          },
        );
      });
    }
  }, [chainwatchBaseUrl, supportedChains]);

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <NavigationScrollView>
        <Flex px={16}>
          <Alert type="info">
            <Text>See your addresses that are registered in chainwatch</Text>
          </Alert>
          <Flex flexDirection="column" alignItems="flex-start" flexWrap="wrap" mt={4}>
            {featureTransactionsAlerts?.enabled ? (
              <TagEnabled mx={2}>Feature Flag On</TagEnabled>
            ) : (
              <TagDisabled mx={2}>Feature Flag Off</TagDisabled>
            )}
            {notifications?.transactionsAlertsCategory ? (
              <TagEnabled mx={2} mt={3}>
                Transactions Alerts Notifications Settings On
              </TagEnabled>
            ) : (
              <TagDisabled mx={2} mt={3}>
                Transactions Alerts Notifications Settings Off
              </TagDisabled>
            )}
          </Flex>
          <Text my={3}>Chainwatch url :</Text>
          <Tag uppercase={false} type="color" alignSelf={"flex-start"}>
            {chainwatchBaseUrl}
          </Tag>
          <Divider />
          <Text my={3}>Supported chains :</Text>
          {Object.entries(chainsData).map(([chainId, chainData]) => (
            <Flex mt={3} key={chainId}>
              <Text fontWeight="bold">{chainId}</Text>
              <Flex mt={3} backgroundColor="neutral.c30" p={2}>
                {chainData ? (
                  <Text selectable>{JSON.stringify(chainData, null, 2)}</Text>
                ) : (
                  <Text>Nothing registered</Text>
                )}
              </Flex>
            </Flex>
          ))}
        </Flex>
      </NavigationScrollView>
    </SafeAreaView>
  );
}
