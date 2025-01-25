import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { FlashList } from "@shopify/flash-list";
import QueuedDrawer from "~/components/QueuedDrawer";
import AccountsList from "./AccountsList";
import NetworkHeader from "./NetworkHeader";
import AccountHeader from "./AccountHeader";
import NetworkItem from "./NetworkItem";
import useSelectAccountModalViewModel, { Params } from "./useSelectAccountModalViewModel";

type Props = {
  isOpened: boolean;
} & Params;

const currencyKeyExtractor = (item: CryptoCurrency) => item.id;

const noop = () => {};

const renderCurrencyItem = ({
  item,
  extraData = noop,
}: {
  item: CryptoCurrency;
  extraData?: (currency: CryptoCurrency) => void;
}) => {
  return <NetworkItem currency={item} onPress={extraData} />;
};

const MODAL_HEIGHT = Dimensions.get("screen").height * 0.5;

export default function SelectAccountModal({ isOpened, ...params }: Props) {
  const {
    selectedCurrency,
    sortedCurrencies,
    resetSelectedCurrency,
    onPressCurrencyItem,
    handleClose,
    setSelectedAccount,
    onAddAccount,
  } = useSelectAccountModalViewModel(params);

  return (
    <QueuedDrawer
      containerStyle={styles.drawerContainer}
      CustomHeader={selectedCurrency ? AccountHeader(resetSelectedCurrency) : NetworkHeader}
      isRequestingToBeOpened={isOpened}
      onClose={handleClose}
    >
      <Flex minHeight={MODAL_HEIGHT}>
        {selectedCurrency ? (
          <AccountsList
            currency={selectedCurrency}
            onPressItem={setSelectedAccount}
            onAddAccount={onAddAccount}
          />
        ) : (
          <FlashList
            contentContainerStyle={styles.list}
            testID="web3hub-select-network"
            keyExtractor={currencyKeyExtractor}
            renderItem={renderCurrencyItem}
            estimatedItemSize={60}
            data={sortedCurrencies}
            extraData={onPressCurrencyItem}
          />
        )}
      </Flex>
    </QueuedDrawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  list: {
    paddingBottom: 16,
  },
});
