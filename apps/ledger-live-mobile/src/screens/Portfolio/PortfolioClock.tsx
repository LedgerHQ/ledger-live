import React, { useState, useEffect, useRef } from "react";
import { TouchableOpacity, Animated, View, StyleSheet, Platform } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useSelector } from "~/context/hooks";
import { languageSelector } from "~/reducers/settings";

export default function PortfolioClock() {
  const [now, setNow] = useState(() => new Date());
  const [expanded, setExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const language = useSelector(languageSelector);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded, animation]);

  const timeString = new Intl.DateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  const dateString = new Intl.DateTimeFormat(language, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const cardStyle = {
    opacity: animation,
    transform: [
      {
        scaleY: animation,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
        <Text variant="large" fontWeight="semiBold" color="neutral.c100" style={styles.timeLabel}>
          {timeString}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={() => setExpanded(false)}
          activeOpacity={1}
        />
      )}
      <Animated.View
        style={[styles.card, { backgroundColor: colors.background.main }, cardStyle]}
        pointerEvents={expanded ? "auto" : "none"}
      >
        <TouchableOpacity onPress={() => setExpanded(false)} activeOpacity={1}>
          <Text variant="h2" fontWeight="semiBold" color="neutral.c100">
            {timeString}
          </Text>
          <Text variant="body" color="neutral.c70" style={styles.dateText}>
            {dateString}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginRight: 8,
  },
  timeLabel: {
    marginRight: 0,
  },
  card: {
    position: "absolute",
    top: 52,
    right: 0,
    minWidth: 160,
    borderRadius: 12,
    padding: 16,
    zIndex: 100,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  dateText: {
    marginTop: 4,
  },
});
