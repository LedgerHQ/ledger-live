import React from "react";
import Clipboard from "@react-native-community/clipboard";
import { Trans } from "react-i18next";
import { Icons, Text } from "@ledgerhq/native-ui";
import { StyleSheet, View } from "react-native";
import Button from "../../../../components/Button";
import RecipientInput from "../../../../components/RecipientInput";

type Props = {
  value: string;
  onChange: (_: string) => void;
  validation: boolean;
  onNext: () => void;
};

function StakeToAccountInput({ onChange, value, onNext, validation }: Props) {
  return (
    <View style={styles.container}>
      <RecipientInput
        onPaste={async () => {
          const pastedText = await Clipboard.getString();
          onChange(pastedText);
        }}
        onChangeText={onChange}
        value={value}
      />
      {value !== "" ? (
        <View style={styles.validContainer}>
          <View
            style={
              validation
                ? styles.iconContainerValid
                : styles.iconContainerInvalid
            }
          >
            <Icons.CheckTickMedium color="#131214" />
          </View>
          <Text style={validation ? styles.valid : styles.invalid}>
            {validation ? "Valid account ID" : "Invalid account ID"}
          </Text>
        </View>
      ) : null}
      <View style={styles.spacer} />
      <View style={styles.buttonContainer}>
        <Button
          disabled={!validation}
          event="Hedera StepStakingStartedContinueBtn"
          onPress={onNext}
          title={<Trans i18nKey="hedera.common.continue" />}
          type="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    height: "100%",
    paddingHorizontal: 16,
  },
  validContainer: {
    display: "flex",
    flexDirection: "row",
    marginTop: 9,
    justifyContent: "flex-start",
  },
  iconContainerValid: {
    width: 18,
    height: 18,
    backgroundColor: "#6EB260",
    borderRadius: 100,
    marginRight: 6,
  },
  iconContainerInvalid: {
    width: 18,
    height: 18,
    backgroundColor: "#C9595A",
    borderRadius: 100,
    marginRight: 6,
  },
  valid: {
    color: "#6EB260",
  },
  invalid: {
    color: "#C9595A",
  },
  spacer: {
    flexGrow: 1,
    flexShrink: 0,
  },
  buttonContainer: {
    marginBottom: 24,
  },
});

export default StakeToAccountInput;
