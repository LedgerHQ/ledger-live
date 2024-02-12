import React, { memo, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { PolkadotValidator } from "@ledgerhq/live-common/families/polkadot/types";
import { useTheme } from "styled-components/native";
import CheckBox from "~/components/CheckBox";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";
import FirstLetterIcon from "~/components/FirstLetterIcon";

type Props = {
  item: PolkadotValidator;
  disabled: boolean;
  onSelect: (item: PolkadotValidator, selected: boolean) => void;
  onClick: (address: string) => void;
  selected: boolean;
};

function Item({ item, selected, disabled, onSelect, onClick }: Props) {
  const { colors } = useTheme();
  const { identity, address, commission, nominatorsCount, isOversubscribed, isElected } = item;
  const onPress = useCallback(() => {
    onSelect(item, selected);
  }, [onSelect, item, selected]);
  const isDisabled = disabled && !selected;
  const formattedCommission = useMemo(
    () => (commission ? `${commission.multipliedBy(100).toNumber()} %` : "-"),
    [commission],
  );
  return (
    <View
      style={[
        styles.wrapper,
        isDisabled
          ? {
              backgroundColor: colors.neutral.c40,
            }
          : {},
      ]}
    >
      <Touchable
        style={[styles.iconWrapper]}
        onPress={() => onClick(address)}
        event="PolkadotNominateSelectValidatorsOpenExplorer"
      >
        <FirstLetterIcon label={identity || "-"} round size={32} />
      </Touchable>

      <View style={styles.nameWrapper}>
        <Touchable
          onPress={() => onClick(address)}
          event="PolkadotNominateSelectValidatorsOpenExplorer"
        >
          <LText
            semiBold
            style={[styles.nameText]}
            color={isDisabled ? colors.neutral.c70 : colors.primary.c90}
            numberOfLines={1}
          >
            {identity || address || ""}
          </LText>
        </Touchable>

        {isElected ? (
          <LText
            style={[styles.valueLabel]}
            color={isOversubscribed ? colors.warning.c50 : colors.neutral.c70}
          >
            {isOversubscribed ? (
              <Trans
                i18nKey="polkadot.nomination.oversubscribed"
                values={{
                  nominatorsCount,
                }}
              />
            ) : (
              <Trans
                i18nKey="polkadot.nomination.nominatorsCount"
                values={{
                  nominatorsCount,
                }}
              />
            )}
          </LText>
        ) : (
          <LText style={styles.valueLabel} color={colors.neutral.c70}>
            <Trans i18nKey="polkadot.nomination.waiting" />
          </LText>
        )}
      </View>

      <View style={styles.valueWrapper}>
        <LText semiBold style={styles.valueText} color={colors.neutral.c100}>
          {formattedCommission}
        </LText>

        <LText style={styles.valueLabel} color={colors.neutral.c70}>
          <Trans i18nKey="polkadot.nomination.commission" />
        </LText>
      </View>

      <CheckBox onChange={onPress} isChecked={selected} disabled={isDisabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconWrapper: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nameWrapper: {
    flexDirection: "column",
    flex: 1,
    paddingRight: 16,
  },
  nameText: {
    fontSize: 15,
  },
  disabledWrapper: {
    opacity: 0.5,
  },
  valueWrapper: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  valueText: {
    fontSize: 14,
  },
  valueLabel: {
    fontSize: 13,
  },
});

export default memo<Props>(Item);
