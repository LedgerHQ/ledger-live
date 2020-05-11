import React from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import CoinifyWidget from "./CoinifyWidget";
import { accountsSelector } from "../../reducers/accounts";

const Exchange = () => {
  const accounts = useSelector(accountsSelector);

  return (
    <View style={{ flex: 1, width: "100%", height: "100%" }}>
      <CoinifyWidget account={accounts[0]} />
    </View>
  );
};

export default Exchange;
