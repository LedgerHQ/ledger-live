import React, { useCallback, useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { Box, SearchInput, Text } from "@ledgerhq/native-ui";
import { FlatList, View } from "react-native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import BigNumber from "bignumber.js";

import type { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import type {
  EnhancedProviderType,
  onSelectType,
  PickValidatorPropsType,
} from "./types";

import { TrackScreen } from "../../../../../../../analytics";
import { ScreenName } from "../../../../../../../const";
import { nominate } from "../../../../../helpers";
import { ledger } from "../../../../../constants";

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

  const providers = useMemo(() => {
    const needle = search.toLowerCase();

    const filter = (validator: ElrondProvider) => {
      const [foundByContract, foundByName] = [
        validator.contract.toLowerCase().includes(needle),
        validator.identity.name
          ? validator.identity.name.toLowerCase().includes(needle)
          : false,
      ];

      return foundByName || foundByContract;
    };

    const disable = (validator: ElrondProvider): EnhancedProviderType => {
      const [alpha, beta] = [
        validator.maxDelegationCap,
        validator.totalActiveStake,
      ];
      const delegative = alpha !== "0" && validator.withDelegationCap;
      const difference = new BigNumber(alpha).minus(beta);
      const minimum = nominate("1");

      return Object.assign(validator, {
        disabled: delegative && difference.isLessThan(minimum),
      });
    };

    const sort = (validator: EnhancedProviderType) =>
      validator.contract === ledger ? -1 : 1;
    const items = validators.sort(sort).map(disable);

    return search ? items.filter(filter) : items;
  }, [validators, search]);

  /*
   * Upon selecting an item, navigate to the next panel of the stack and pass along the necessary data.
   */

  const onSelect = useCallback(
    (validator: onSelectType["validator"]) => {
      if (validator) {
        navigation.navigate(ScreenName.ElrondDelegationValidator, {
          account,
          validators: providers,
          transaction: bridge.updateTransaction(transaction, {
            recipient: validator.contract,
          }),
        });
      }
    },
    [navigation, bridge, account, transaction, providers],
  );

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="DelegationFlow" name="SelectValidator" />

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
            {"title" ?? <Trans i18nKey="delegation.validator" />}
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
        renderItem={props => (
          <Item account={account} onSelect={onSelect} {...props} />
        )}
      />
    </View>
  );
};

export default PickValidator;
