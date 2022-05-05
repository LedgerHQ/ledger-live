import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import styled from "styled-components/native";

const Container = styled(Pressable)`
  background-color: ${p => p.theme.colors.constant.overlay};
`;

export default function NavigationOverlay() {
  const navigation = useNavigation();

  return (
    <Container
      style={[StyleSheet.absoluteFill]}
      onPress={() => {
        navigation.canGoBack() && navigation.goBack();
      }}
    />
  );
}
