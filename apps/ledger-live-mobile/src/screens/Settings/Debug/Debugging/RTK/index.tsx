import React, { useState, useCallback } from "react";
import { Text, ScrollView, TextInput } from "react-native";

import FloatingDebugButton from "~/components/FloatingDebugButton";
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { State } from "~/reducers/types";
import { useSelector } from "react-redux";
import useStyles from "./style";
import { useTheme } from "styled-components/native";
import SliceSection from "./SliceSection";
import ApiSection from "./ApiSection";
import { ApiSlice, Section } from "./types";
import Tabs from "./Tabs";
import SectionHeader from "./SectionHeader";

enum Visibility {
  opaque = "opaque",
  transparent = "transparent",
  hidden = "hidden",
}

export default function RtkQueryDevPanel() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [visibility, setVisibility] = useState<Visibility>(Visibility.opaque);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<Section>("api");

  const state = useSelector((s: State) => s);
  const enabled = useSelector((s: State) => s.settings.rtkConsoleEnabled ?? false);

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;
  const isApiSlice = (value: unknown): value is ApiSlice =>
    isRecord(value) && "queries" in value && "mutations" in value;
  const isApiEntry = (entry: [string, unknown]): entry is [string, ApiSlice] =>
    isApiSlice(entry[1]);

  const toggleSection = useCallback((name: string) => {
    setExpandedSections(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const toggleItem = useCallback((key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const onPressDebugButton = useCallback(() => {
    setVisibility(prev => {
      switch (prev) {
        case Visibility.hidden:
          return Visibility.transparent;
        case Visibility.transparent:
          return Visibility.opaque;
        case Visibility.opaque:
        default:
          return Visibility.hidden;
      }
    });
  }, []);

  if (!__DEV__) return null;

  return (
    <>
      {enabled ? (
        <FloatingDebugButton onPress={onPressDebugButton} Icon={IconsLegacy.DashboardMedium} />
      ) : null}
      {enabled && visibility !== Visibility.hidden ? (
        <Flex
          style={[styles.panel, visibility === Visibility.transparent && { opacity: 0.7 }]}
          pointerEvents={visibility === Visibility.opaque ? "auto" : "none"}
        >
          <Text style={styles.header}>
            {view === "api" ? "⚡ RTK Query Dev Panel" : "🧩 RTK Slices Dev Panel"}
          </Text>
          <TextInput
            placeholder={view === "api" ? "Filter endpoints..." : "Filter slices..."}
            placeholderTextColor={colors.neutral.c70}
            style={styles.input}
            value={filter}
            clearButtonMode="always"
            onChangeText={setFilter}
          />
          <Tabs active={view} onChange={setView} />
          <SectionHeader label={view === "api" ? "API" : "Slices"} />
          <ScrollView>
            {view === "api"
              ? Object.entries(state)
                  .filter(isApiEntry)
                  .map(([reducerPath, apiSlice]) => (
                    <ApiSection
                      key={reducerPath}
                      reducerPath={reducerPath}
                      slice={apiSlice as ApiSlice}
                      filter={filter}
                      expanded={!!expandedSections[reducerPath]}
                      toggleApi={toggleSection}
                      expandedItems={expandedItems}
                      toggleItem={toggleItem}
                    />
                  ))
              : Object.entries(state)
                  .filter(([, value]) => !isApiSlice(value))
                  .map(([reducerPath, slice]) => (
                    <SliceSection
                      key={reducerPath}
                      reducerPath={reducerPath}
                      slice={slice}
                      filter={filter}
                      expanded={!!expandedSections[reducerPath]}
                      toggle={toggleSection}
                    />
                  ))}
          </ScrollView>
        </Flex>
      ) : null}
    </>
  );
}
