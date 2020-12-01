// @flow
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useRefreshAccountsOrdering } from "../../actions/general";
import { setOrderAccounts } from "../../actions/settings";
import { orderAccountsSelector } from "../../reducers/settings";
import Check from "../../icons/Check";
import LText from "../../components/LText";
import Touchable from "../../components/Touchable";
import colors from "../../colors";

type Props = {
  id: string,
};

export default function OrderOption({ id }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const orderAccounts = useSelector(orderAccountsSelector);
  const refreshAccountsOrdering = useRefreshAccountsOrdering();

  const onPress = useCallback(() => {
    dispatch(setOrderAccounts(`${id}`));
    refreshAccountsOrdering();
  }, [dispatch, id, refreshAccountsOrdering]);

  const selected = orderAccounts === id;
  return (
    <Touchable
      event="AccountOrderOption"
      eventProperties={{ accountOrderId: id }}
      style={[styles.root, selected && styles.rootSelected]}
      onPress={onPress}
    >
      <LText semiBold style={styles.label}>
        {t(`orderOption.choices.${id}`)}
      </LText>
      {selected ? <Check color={colors.live} size={16} /> : null}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    marginVertical: 4,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rootSelected: {
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  order: {
    fontSize: 14,
    color: colors.grey,
    marginRight: 8,
  },
});
