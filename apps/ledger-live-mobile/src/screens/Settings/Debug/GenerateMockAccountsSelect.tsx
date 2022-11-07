import React, { useCallback, useState } from "react";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { useNavigation } from "@react-navigation/native";
import { Alert, ScrollView } from "react-native";
import { Button, Checkbox, Flex, Text } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import SettingsRow from "../../../components/SettingsRow";
import accountModel from "../../../logic/accountModel";
import { saveAccounts } from "../../../db";
import { useReboot } from "../../../context/Reboot";
import { ScreenName } from "../../../const";
import CurrencyIcon from "../../../components/CurrencyIcon";
import { SettingsNavigatorStackParamList } from "../../../components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";

async function injectMockAccountsInDB(currencies: CryptoCurrency[]) {
  await saveAccounts({
    active: currencies.map(currency =>
      accountModel.encode(
        genAccount(String(Math.random()), {
          currency,
        }),
      ),
    ),
  });
}

const currencies = listSupportedCurrencies().sort((a, b) =>
  a.name.localeCompare(b.name),
);

export const GenerateMockAccountSelectScreen = () => {
  const reboot = useReboot();
  const [checkedCurrencies, setCheckedCurrencies] = useState(
    {} as Record<string, boolean>,
  );

  const handleItemPressed = useCallback(
    ({ id }) => {
      setCheckedCurrencies({
        ...checkedCurrencies,
        [id]: !checkedCurrencies[id],
      });
    },
    [checkedCurrencies, setCheckedCurrencies],
  );

  const handlePressContinue = useCallback(() => {
    const selectedCurrencies = currencies.filter(
      ({ id }) => checkedCurrencies[id],
    );
    Alert.alert(
      "This will erase existing accounts",
      "Continue?",
      [
        {
          text: "Ok",
          onPress: () => {
            injectMockAccountsInDB(selectedCurrencies);
            reboot();
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        { text: "Cancel", onPress: () => {} },
      ],
      { cancelable: true },
    );
  }, [checkedCurrencies, reboot]);

  const insets = useSafeAreaInsets();

  return (
    <Flex flex={1} px={2} pb={insets.bottom}>
      <ScrollView>
        {currencies.map(currency => {
          const { id, name } = currency;
          return (
            <Flex p={3}>
              <Checkbox
                onChange={() => handleItemPressed({ id })}
                checked={checkedCurrencies[id]}
                label={
                  <Flex flexDirection="row" alignItems="center" pt={2}>
                    <CurrencyIcon circle size={20} currency={currency} />
                    <Text style={{ marginLeft: 5 }}>{name}</Text>
                  </Flex>
                }
              />
            </Flex>
          );
        })}
      </ScrollView>
      <Button
        disabled={!Object.values(checkedCurrencies).some(a => a)}
        mx={4}
        onPress={handlePressContinue}
        type="main"
      >
        Generate accounts
      </Button>
    </Flex>
  );
};

export default function GenerateMockAccount() {
  const navigation =
    useNavigation<
      StackNavigatorNavigation<
        SettingsNavigatorStackParamList,
        ScreenName.DebugMockGenerateAccounts
      >
    >();

  return (
    <SettingsRow
      title="Generate mock accounts"
      desc="Select for which currencies you want to generate an account"
      onPress={() => navigation.navigate(ScreenName.DebugMockGenerateAccounts)}
    />
  );
}
