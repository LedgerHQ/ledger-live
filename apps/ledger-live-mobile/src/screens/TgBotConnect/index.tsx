import { getAccountCurrency, getParentAccount } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { Flex, Text, Button, Switch } from "@ledgerhq/native-ui";
import { getWalletApiIdFromAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { ScreenName } from "~/const";
import { flattenAccountsSelector } from "~/reducers/accounts";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import Config from "react-native-config";

const TG_BOT_API_URL = Config.TG_BOT_API_URL || "http://localhost:3000";

type RouteParams = RouteProp<BaseNavigatorStackParamList, typeof ScreenName.TgBotConnect>;

interface AccountSelection {
  id: string;
  selected: boolean;
}

function formatAccountForBot(account: AccountLike, allAccounts: AccountLike[]) {
  const currency = getAccountCurrency(account);
  let address = "";
  if ("freshAddress" in account && account.freshAddress) {
    address = account.freshAddress;
  } else if (account.type === "TokenAccount") {
    // Token accounts use the parent account's address
    const parent = getParentAccount(account, allAccounts);
    address = parent.freshAddress ?? "";
  }
  return {
    id: getWalletApiIdFromAccountId(account.id),
    currencyId: currency.id,
    name: "name" in account ? account.name : currency.name,
    address,
    balance: account.balance.toString(),
    ticker: currency.ticker,
    type: account.type,
    decimals: currency.units[0].magnitude,
  };
}

export default function TgBotConnectScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { token } = route.params;
  const allAccounts = useSelector(flattenAccountsSelector);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    allAccounts.forEach(acc => {
      // Pre-select main accounts, not token sub-accounts
      initial[acc.id] = acc.type === "Account";
    });
    return initial;
  });

  const selectedAccounts = useMemo(
    () => allAccounts.filter(acc => selections[acc.id]),
    [allAccounts, selections],
  );

  const toggleAccount = useCallback((id: string) => {
    setSelections(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setSending(true);
    setError(null);

    const accounts = selectedAccounts.map(acc => formatAccountForBot(acc, allAccounts));

    try {
      const response = await fetch(`${TG_BOT_API_URL}/api/callback/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          accounts,
          // In production, compute HMAC signature here
          signature: "dev-signature",
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Server error: ${response.status} ${body}`);
      }

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setSending(false);
    }
  }, [selectedAccounts, token, navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderAccount = useCallback(
    ({ item }: { item: AccountLike }) => {
      const currency = getAccountCurrency(item);
      const name = "name" in item ? item.name : currency.name;
      return (
        <Flex
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingY={3}
          paddingX={4}
        >
          <Flex flex={1}>
            <Text variant="body" fontWeight="semiBold">
              {currency.ticker} - {name}
            </Text>
            <Text variant="small" color="neutral.c70">
              Balance: {item.balance.toFixed()} (smallest unit)
            </Text>
          </Flex>
          <Switch
            checked={!!selections[item.id]}
            onChange={() => toggleAccount(item.id)}
          />
        </Flex>
      );
    },
    [selections, toggleAccount],
  );

  return (
    <Flex flex={1} backgroundColor="background.main" padding={4}>
      <Flex paddingY={4}>
        <Text variant="h4" fontWeight="semiBold" textAlign="center">
          Telegram Bot Connection
        </Text>
        <Text variant="body" color="neutral.c80" textAlign="center" marginTop={2}>
          The Telegram Swap Bot is requesting access to your account information.
        </Text>
        <Text variant="small" color="neutral.c60" textAlign="center" marginTop={1}>
          This will share: account names, balances, addresses, and currency types.
        </Text>
      </Flex>

      <Flex flex={1}>
        <Text variant="subtitle" marginBottom={2}>
          Select accounts to share ({selectedAccounts.length} selected):
        </Text>
        <FlatList
          data={allAccounts}
          renderItem={renderAccount}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
        />
      </Flex>

      {error && (
        <Text variant="small" color="error.c50" textAlign="center" marginBottom={2}>
          {error}
        </Text>
      )}

      <Flex flexDirection="row" gap={3} paddingY={4}>
        <Button flex={1} type="shade" onPress={handleCancel}>
          Cancel
        </Button>
        <Button
          flex={1}
          type="main"
          onPress={handleConfirm}
          disabled={selectedAccounts.length === 0 || sending}
        >
          {sending ? "Connecting..." : `Share ${selectedAccounts.length} account(s)`}
        </Button>
      </Flex>
    </Flex>
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
});
