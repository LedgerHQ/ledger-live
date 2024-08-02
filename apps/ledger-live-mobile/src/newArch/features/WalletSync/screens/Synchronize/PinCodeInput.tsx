import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import TrackScreen from "~/analytics/TrackScreen";
import { NativeSyntheticEvent, TextInput, TextInputKeyPressEventData } from "react-native";

export default function PinCodeInput() {
  const { t } = useTranslation();
  const inputRefs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];
  const [digits, setDigits] = useState<string[]>(["", "", ""]);

  const handleChange = (value: string, index: number) => {
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    if (value && index < digits.length - 1) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    }
  };

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <TrackScreen category={AnalyticsPage.PinCode} />
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100" textAlign="center">
        {t("walletSync.synchronize.qrCode.pinCode.title")}
      </Text>
      <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" px={8} mt={6}>
        {t("walletSync.synchronize.qrCode.pinCode.desc")}
      </Text>
      <Flex flexDirection="row" justifyContent="center" mt={8} columnGap={12}>
        {digits.map((digit, index) => (
          <DigitInput
            key={index}
            value={digit}
            onChange={value => handleChange(value, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            index={index}
            ref={inputRefs[index]}
          />
        ))}
      </Flex>
    </Flex>
  );
}

interface DigitInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => void;
  index: number;
}

interface TextInputRef {
  focus: () => void;
}

const DigitInput = forwardRef<TextInputRef, DigitInputProps>(
  ({ value, onChange, onKeyPress, index }, forwardedRef) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(forwardedRef, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const handleChange = (text: string) => {
      if (text.length <= 1 && /^\d*$/.test(text)) {
        onChange(text);
      }
    };

    return (
      <NumberContainer
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="numeric"
        maxLength={1}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        isFocused={isFocused}
        onKeyPress={e => onKeyPress(e, index)}
        textAlign="center"
      />
    );
  },
);

const NumberContainer = styled(TextInput)<{ isFocused: boolean }>`
  border-radius: 8px;
  height: 50px;
  width: 50px;
  border: 1px solid
    ${({ theme, isFocused }) => (isFocused ? theme.colors.primary.c80 : theme.colors.neutral.c40)};
`;
