import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

type TappableMaskProps = { onPrevious: () => void; onNext: () => void };

/**
 * TappableMask component to handle touch events for navigating stories.
 * @param param0 {TappableMaskProps} - Props for the TappableMask component.
 * @returns React.JSX.Element
 */
export function TappableMask({ onPrevious, onNext }: Readonly<TappableMaskProps>) {
  const [isTouching, setIsTouching] = useState<boolean>(false);

  const onTouchStart = useCallback(() => {
    setIsTouching(true);
    const timeoutId = setTimeout(() => {
      setIsTouching(false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const onTouchEnd = useCallback(
    (callback: () => void) => () => {
      if (isTouching) {
        callback();
      }
    },
    [isTouching],
  );

  return (
    <View style={styles.container}>
      <View
        style={styles.partition}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd(onPrevious)}
      />
      <View style={styles.partition} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd(onNext)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1,
    marginTop: 120,
    display: "flex",
    flexDirection: "row",
    backgroundColor: "transparent",
  },
  partition: {
    flex: 1,
  },
});
