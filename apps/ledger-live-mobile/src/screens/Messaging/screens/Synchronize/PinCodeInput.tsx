import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import TrackScreen from "~/analytics/TrackScreen";
import { NativeSyntheticEvent, TextInput, TextInputKeyPressEventData } from "react-native";

type Props = {
  handleSendDigits: (input: string) => void;
  nbDigits: number;
};

export default function PinCodeInput({ nbDigits, handleSendDigits }: Props) {
  const { t } = useTranslation();

  // Dynamically create refs based on the number of digits
  const inputRefs = useRef<(TextInput | null)[]>(Array(nbDigits).fill(null));
  const [digits, setDigits] = useState<string[]>(Array(nbDigits).fill(""));

  useEffect(() => {
    if (digits.every(digit => digit)) {
      handleSendDigits(digits.join(""));
    }
  }, [digits, handleSendDigits]);

  const handleChange = (value: string, index: number) => {
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    if (value && index < nbDigits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
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
            ref={el => (inputRefs.current[index] = el)}
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

const DigitInput = forwardRef<TextInput, DigitInputProps>(
  ({ value, onChange, onKeyPress, index }, forwardedRef) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(forwardedRef, () => inputRef.current as TextInput);

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
  color: ${({ theme }) => theme.colors.neutral.c100};
`;
