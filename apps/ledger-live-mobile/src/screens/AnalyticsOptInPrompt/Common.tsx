import React from "react";
import { ScrollView } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";

export const View = styled(Flex).attrs({
  width: "100%",
})``;

export const Container = styled(Flex).attrs({
  paddingHorizontal: 16,
  flex: 1,
  justifyContent: "space-between",
})``;

export const Titles = styled(Flex).attrs({
  pt: 6,
  width: "100%",
})``;

export const Content = styled(Flex).attrs({
  pt: 6,
  width: "100%",
})``;

export const Bottom = styled(Flex).attrs({
  paddingBottom: 7,
  paddingTop: 0,
  width: "100%",
})``;

export const ScrollableContainer = ({ children }: { children: React.ReactNode }) => (
  <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
    {children}
  </ScrollView>
);
