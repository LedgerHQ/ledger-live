/* @flow */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import SafeAreaView from "react-native-safe-area-view";
import MenuTitle from "../../components/MenuTitle";
import OrderOption from "./OrderOption";
import BottomModal from "../../components/BottomModal";
import Button from "../../components/Button";

const forceInset = { bottom: "always" };

const choices = ["balance|desc", "balance|asc", "name|asc", "name|desc"];

type Props = {
  isOpened: boolean,
  onClose: () => void,
};

export default function AccountOrderModal({ onClose, isOpened }: Props) {
  return (
    <BottomModal id="AccountOrderModal" onClose={onClose} isOpened={isOpened}>
      <SafeAreaView forceInset={forceInset}>
        <MenuTitle>
          <Trans i18nKey="common.sortBy" />
        </MenuTitle>
        {choices.map(id => (
          <OrderOption key={id} id={id} />
        ))}
        <View style={styles.buttonContainer}>
          <Button
            event="AccountOrderModalDone"
            type="primary"
            onPress={onClose}
            title={<Trans i18nKey="common.done" />}
          />
        </View>
      </SafeAreaView>
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  buttonContainer: { paddingHorizontal: 16, marginTop: 16 },
});
