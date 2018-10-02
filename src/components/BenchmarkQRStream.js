// @flow
import React from "react";
import { withNavigation } from "react-navigation";
import Button from "./Button";

const BenchmarkQRStream = ({ navigation }: { navigation: * }) => (
  <Button
    type="secondary"
    title="Benchmark QRStream"
    onPress={() => navigation.navigate("BenchmarkQRStream")}
    containerStyle={{ marginTop: 20 }}
  />
);

export default withNavigation(BenchmarkQRStream);
