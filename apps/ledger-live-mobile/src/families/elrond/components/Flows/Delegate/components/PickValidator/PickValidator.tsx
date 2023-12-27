import React, { useCallback, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { Box, SearchInput, Text } from "@ledgerhq/native-ui";
import { FlatList, View } from "react-native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

import { useSearchValidators } from "@ledgerhq/live-common/families/elrond/react";

import type { onSelectType, PickValidatorPropsType } from "./types";

import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";

import Item from "./components/Item";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const PickValidator = (props: PickValidatorPropsType) => {
  const [search, setSearch] = useState("");

  const { route, navigation } = props;
  const { account, validators, transaction } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const bridge = getAccountBridge(account);

  /*
   * Filter out the providers, by the search query, and disabled them if not enough delegation cap available.
   */
  const providers = useSearchValidators(validators, search);

  /*
   * Upon selecting an item, navigate to the next panel of the stack and pass along the necessary data.
   */

  const onSelect = useCallback(
    (validator: onSelectType["validator"]) => {
      if (validator) {
        navigation.navigate(ScreenName.ElrondDelegationValidator, {
          account,
          validators,
          transaction: bridge.updateTransaction(transaction, {
            recipient: validator.contract,
          }),
        });
      }
    },
    [navigation, bridge, account, transaction, validators],
  );

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="DelegationFlow"
        name="SelectValidator"
        flow="stake"
        action="delegate"
        currency="egld"
      />

      <Box mx={6} mt={3} mb={4}>
        <SearchInput
          returnKeyType="search"
          maxLength={50}
          onChange={setSearch}
          placeholder={t("common.search")}
          value={search}
          numberOfLines={1}
        />
      </Box>

      <View style={styles.header}>
        <View style={styles.validatorHead}>
          <Text
            style={styles.validatorHeadText}
            color="smoke"
            numberOfLines={1}
            fontWeight="semiBold"
          >
            <Trans i18nKey="delegation.validator" />
          </Text>

          <View style={styles.validatorHeadContainer}>
            <Text
              style={styles.validatorHeadText}
              color="smoke"
              numberOfLines={1}
              fontWeight="semiBold"
            >
              <Trans i18nKey="elrond.delegation.totalStake" />
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={providers}
        keyExtractor={validator => validator.contract}
        renderItem={props => <Item account={account} onSelect={onSelect} {...props} />}
      />
    </View>
  );
};

export default PickValidator;
