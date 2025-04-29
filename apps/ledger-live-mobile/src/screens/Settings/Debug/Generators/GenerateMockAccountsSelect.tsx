import React, { useCallback, useState } from "react";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { useNavigation } from "@react-navigation/native";
import { Alert as Confirm, ScrollView } from "react-native";
import { Button, Checkbox, Flex, Text, Alert } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import SettingsRow from "~/components/SettingsRow";
import accountModel from "~/logic/accountModel";
import { saveAccounts } from "../../../../db";
import { useReboot } from "~/context/Reboot";
import { ScreenName } from "~/const";
import CurrencyIcon from "~/components/CurrencyIcon";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import TextInput from "~/components/TextInput";
import {
  initialState as liveWalletInitialState,
  accountUserDataExportSelector,
} from "@ledgerhq/live-wallet/store";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { getEnv } from "@ledgerhq/live-env";

type ID = CryptoCurrencyId | "LBRY" | "groestcoin" | "osmo";
type ScreenProps = StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.DebugMockGenerateAccounts
>;

type Props = {
  withNft?: boolean;
  title: string;
  desc: string;
  iconLeft: React.ReactNode;
};

const NUMBER_OF_ACCOUNTS_FOR_NFTS = 3;

const CURRENCIES_FOR_NFT = getEnv("NFT_CURRENCIES");

async function injectMockAccountsInDB(
  currencies: CryptoCurrency[],
  tokens: string,
  withNft = false,
) {
  const tokenIds = tokens.split(",").map(t => t.toLowerCase().trim());

  const localCurrencies: CryptoCurrency[] = withNft
    ? currencies.flatMap(currency => Array(NUMBER_OF_ACCOUNTS_FOR_NFTS + 1).fill(currency))
    : currencies;

  await saveAccounts({
    active: localCurrencies.map(currency => {
      const account = genAccount(String(Math.random()), {
        currency,
        tokenIds,
        withNft,
      });
      const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
      return accountModel.encode([account, userData]);
    }),
  });
}

const currencies = listSupportedCurrencies().sort((a, b) => a.name.localeCompare(b.name));

export const GenerateMockAccountSelectScreen = ({ route }: ScreenProps) => {
  const reboot = useReboot();
  const [tokens, setTokens] = useState<string>("");

  const { withNft } = route.params ?? {};

  const currenciesFiltered = withNft
    ? currencies.filter(currency => CURRENCIES_FOR_NFT.includes(currency.id))
    : currencies;

  const featureFlagsProvider = useFeatureFlags();

  const disableSimpleHash = useCallback(() => {
    featureFlagsProvider.overrideFeature("nftsFromSimplehash", { enabled: false });
  }, [featureFlagsProvider]);

  const [checkedCurrencies, setCheckedCurrencies] = useState({} as Record<string, boolean>);

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
    const selectedCurrencies = currenciesFiltered.filter(({ id }) => checkedCurrencies[id]);

    const onPress = () => {
      injectMockAccountsInDB(selectedCurrencies, tokens, withNft).then(() => {
        if (withNft) disableSimpleHash();
        reboot();
      });
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
  }, [checkedCurrencies, currenciesFiltered, disableSimpleHash, reboot, tokens, withNft]);

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
        {currenciesFiltered.map(currency => {
          const { id, name } = currency;
          return (
            <Flex p={2} key={id}>
              <Checkbox
                onChange={() => handleItemPressed({ id })}
                checked={checkedCurrencies[id]}
                label={
                  <Flex flexDirection="row" alignItems="center" pt={2}>
                    <CurrencyIcon circle size={32} currency={currency} />
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

export default function GenerateMockAccount({ withNft = false, title, desc, iconLeft }: Props) {
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
      onPress={() =>
        navigation.navigate(ScreenName.DebugMockGenerateAccounts, {
          withNft,
        })
      }
    />
  );
}
