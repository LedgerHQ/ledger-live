import React from "react";
import { View } from "react-native";

const QRCode = ({ size }) => (
  <View
    data-testid={"mocked-qrcode"}
    style={{ width: size, height: size, backgroundColor: "gray" }}
  >
    {"MOCKED QR CODE"}
  </View>
);

export default QRCode;
