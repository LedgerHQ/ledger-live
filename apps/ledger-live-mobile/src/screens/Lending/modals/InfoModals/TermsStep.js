// $flow
import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Trans } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { track } from "../../../../analytics";
import BaseInfoModal from "../BaseModal";
import CheckBox from "../../../../components/CheckBox";
import LText from "../../../../components/LText";
import termsImg from "../../../../images/lending-terms.png";
import { ScreenName } from "../../../../const";
import { acceptLendingTerms } from "../../../../logic/terms";
import { urls } from "../../../../config/urls";
import PreventNativeBack from "../../../../components/PreventNativeBack";

type Props = {
  route: { params: { endCallback: () => void } },
};

export default function TermsStep({ route: { params } }: Props) {
  const navigation = useNavigation();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const onTogleAcceptedTerms = useCallback(
    () => setHasAcceptedTerms(!hasAcceptedTerms),
    [hasAcceptedTerms, setHasAcceptedTerms],
  );

  const onTermsClick = useCallback(() => {
    track("Page Lend TC accepted");
    Linking.openURL(urls.compoundTnC);
  }, []);

  const onNext = useCallback(() => {
    if (hasAcceptedTerms)
      acceptLendingTerms().then(() =>
        navigation.push(ScreenName.LendingInfo1, params),
      );
  }, [hasAcceptedTerms, navigation, params]);

  return (
    <BaseInfoModal
      title={<Trans i18nKey="transfer.lending.terms.title" />}
      description={<Trans i18nKey="transfer.lending.terms.description" />}
      badgeLabel={<Trans i18nKey="transfer.lending.terms.label" />}
      illustration={
        <View style={styles.imageContainer}>
          <Image style={styles.image} resizeMode="contain" source={termsImg} />
        </View>
      }
      disabled={!hasAcceptedTerms}
      onNext={onNext}
    >
      <PreventNativeBack />
      <View style={styles.footer}>
        <TouchableOpacity onPress={onTogleAcceptedTerms}>
          <CheckBox isChecked={hasAcceptedTerms} />
        </TouchableOpacity>

        <LText style={styles.switchLabel}>
          <Trans i18nKey="transfer.lending.terms.switchLabel">
            <LText
              onPress={onTermsClick}
              semiBold
              style={styles.conditionsText}
              color="live"
            />
          </Trans>
        </LText>
      </View>
    </BaseInfoModal>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 13,
    paddingRight: 16,
  },
  conditionsText: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
  footer: {
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  imageContainer: { width: "100%", height: "100%", paddingHorizontal: 24 },
  image: { width: "100%", height: "100%" },
});
