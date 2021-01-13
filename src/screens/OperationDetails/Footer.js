/* @flow */
import React, { memo } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import ExternalLink from "../../icons/ExternalLink";
import Button from "../../components/Button";

type Props = {
  url: ?string,
  urlWhatIsThis: ?string,
};

function Footer({ url, urlWhatIsThis }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.footer,
        { borderColor: colors.lightFog, backgroundColor: colors.background },
      ]}
    >
      {urlWhatIsThis ? (
        <Button
          event="WhatIsThisOperation"
          type="lightSecondary"
          title={<Trans i18nKey="operationDetails.whatIsThis" />}
          IconLeft={ExternalLink}
          onPress={() => Linking.openURL(urlWhatIsThis)}
        />
      ) : null}
      {url ? (
        <Button
          event="OperationDetailViewInExplorer"
          type="primary"
          title={<Trans i18nKey="operationDetails.viewInExplorer" />}
          onPress={() => Linking.openURL(url)}
        />
      ) : null}
    </View>
  );
}

export default memo<Props>(Footer);

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    padding: 16,
  },
});
