// @flow
import React from "react";
import { TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import { useIsFocused } from "@react-navigation/native";
import TabIcon from "../../components/TabIcon";
import PortfolioIcon from "../../icons/Portfolio";
import { scrollToTop } from "../../navigation/utils";
import { accountsSelector } from "../../reducers/accounts";

export default function PortfolioTabIcon(props: Props) {
  const accounts = useSelector(accountsSelector);
  const isFocused = useIsFocused();

  if (!isFocused || accounts.length === 0) {
    return <TabIcon Icon={PortfolioIcon} i18nKey="tabs.portfolio" {...props} />;
  }

  return (
    <TouchableOpacity onPress={scrollToTop}>
      <TabIcon Icon={PortfolioIcon} i18nKey="tabs.portfolio" {...props} />
    </TouchableOpacity>
  );
}
