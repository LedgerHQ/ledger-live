import React, { useCallback, useState } from "react";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { useNavigation } from "@react-navigation/native";
import { Alert as Confirm, ScrollView } from "react-native";
import { Button, Checkbox, Flex, Text, Alert } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import SettingsRow from "~/components/SettingsRow";
import { reboot } from "~/actions/appstate";
import { useDispatch } from "~/context/hooks";
import { replaceAccounts } from "~/actions/accounts";
import { ScreenName } from "~/const";
import CurrencyIcon from "~/components/CurrencyIcon";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import TextInput from "~/components/TextInput";

type ID = CryptoCurrencyId | "LBRY" | "groestcoin" | "osmo";

type Props = {
  title: string;
  desc: string;
  iconLeft: React.ReactNode;
};

const generateMockAccounts = (currencies: CryptoCurrency[], tokens: string): Account[] => {
  const tokenIds = tokens.split(",").map(t => t.toLowerCase().trim());

  return currencies.map(currency =>
    genAccount(String(Math.random()), {
      currency,
      tokenIds,
    }),
  );
};

const currencies = listSupportedCurrencies().sort((a, b) => a.name.localeCompare(b.name));

export const GenerateMockAccountSelectScreen = () => {
  const dispatch = useDispatch();
  const [tokens, setTokens] = useState<string>("");

  const [checkedCurrencies, setCheckedCurrencies] = useState<Record<string, boolean>>({});

  const handleItemPressed = useCallback(
    ({ id }: { id: ID }) => {
      setCheckedCurrencies({
        ...checkedCurrencies,
        [id]: !checkedCurrencies[id],
      });
    },
    [checkedCurrencies, setCheckedCurrencies],
  );

  const handlePressContinue = useCallback(() => {
    const selectedCurrencies = currencies.filter(({ id }) => checkedCurrencies[id]);

    const onPress = () => {
      const mockAccounts = generateMockAccounts(selectedCurrencies, tokens);

      dispatch(replaceAccounts(mockAccounts));

      dispatch(reboot());
    };

    Confirm.alert(
      "This will erase existing accounts",
      "Continue?",
      [
        {
          text: "Ok",
          onPress,
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        { text: "Cancel", onPress: () => {} },
      ],
      { cancelable: true },
    );
  }, [checkedCurrencies, dispatch, tokens]);

  const insets = useSafeAreaInsets();
  return (
    <Flex flex={1} px={2} pb={insets.bottom}>
      <Flex p={3}>
        <Flex pb={3}>
          <Alert
            type={"info"}
            title={"Currencies will also have token balance for valid ids below."}
          />
        </Flex>
        <TextInput
          value={tokens}
          maxLength={100}
          onChangeText={setTokens}
          placeholder={"token1, token2"}
        />
      </Flex>
      <ScrollView>
        {currencies.map(currency => {
          const { id, name } = currency;
          return (
            <Flex p={2} key={id}>
              <Checkbox
                onChange={() => handleItemPressed({ id })}
                checked={checkedCurrencies[id]}
                label={
                  <Flex flexDirection="row" alignItems="center" pt={2}>
                    <CurrencyIcon size={32} currency={currency} />
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
        Generate Accounts
      </Button>
    </Flex>
  );
};

export default function GenerateMockAccount({ title, desc, iconLeft }: Props) {
  const navigation =
    useNavigation<
      StackNavigatorNavigation<
        SettingsNavigatorStackParamList,
        ScreenName.DebugMockGenerateAccounts
      >
    >();

  return (
    <SettingsRow
      title={title}
      desc={desc}
      iconLeft={iconLeft}
      onPress={() => navigation.navigate(ScreenName.DebugMockGenerateAccounts)}
    />
  );
}
