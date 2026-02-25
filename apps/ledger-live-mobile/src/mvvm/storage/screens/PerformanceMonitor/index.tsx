import React, { useState, useEffect } from "react";
import { SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { performanceTracker } from "LLM/storage/utils/performance";
import { STORAGE_TYPE } from "LLM/storage/constants";
import FloatingDebugButton from "~/components/FloatingDebugButton";
import { Flex, IconsLegacy, Switch, Text, Divider } from "@ledgerhq/native-ui";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

type PerformanceMetricsSummary = {
  operation: string;
  mmkvAvg: number;
  asyncStorageAvg: number;
  mmkvCount: number;
  asyncStorageCount: number;
  difference: number;
};

export const StoragePerformanceOverlay: React.FC = () => {
  const render = useEnv("STORAGE_PERFORMANCE_OVERLAY");
  const [visible, setVisible] = useState(false);
  const [metrics, setMetrics] = useState<ReturnType<typeof performanceTracker.getMetrics>>([]);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    const subscription = performanceTracker.getMetricsObservable().subscribe(updatedMetrics => {
      setMetrics(updatedMetrics);
    });

    setMetrics(performanceTracker.getMetrics());

    return () => subscription.unsubscribe();
  }, []);

  if (!render) return null;

  const onFloatingButtonPress = () => {
    setVisible(!visible);
  };

  const calculateSummary = (): PerformanceMetricsSummary[] => {
    const operations = [...new Set(metrics.map(m => m.operation))];

    return operations.map(operation => {
      const mmkvMetrics = metrics.filter(
        m => m.operation === operation && m.storageType === STORAGE_TYPE.MMKV && m.success,
      );
      const asyncStorageMetrics = metrics.filter(
        m => m.operation === operation && m.storageType === STORAGE_TYPE.ASYNC_STORAGE && m.success,
      );

      const mmkvAvg = mmkvMetrics.length
        ? mmkvMetrics.reduce((sum, m) => sum + m.duration, 0) / mmkvMetrics.length
        : 0;

      const asyncStorageAvg = asyncStorageMetrics.length
        ? asyncStorageMetrics.reduce((sum, m) => sum + m.duration, 0) / asyncStorageMetrics.length
        : 0;

      const difference =
        asyncStorageAvg && mmkvAvg ? ((asyncStorageAvg - mmkvAvg) / asyncStorageAvg) * 100 : 0;

      return {
        operation,
        mmkvAvg,
        asyncStorageAvg,
        mmkvCount: mmkvMetrics.length,
        asyncStorageCount: asyncStorageMetrics.length,
        difference,
      };
    });
  };

  const summary = calculateSummary();

  return (
    <>
      <FloatingDebugButton onPress={onFloatingButtonPress} Icon={IconsLegacy.StorageMedium} />

      {visible && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="white"
          opacity={0.9}
          zIndex={1}
          p={4}
        >
          <SafeAreaView>
            <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
              <Flex flexDirection="row" alignItems="center" justifyContent="space-between" mb={3}>
                <Text variant="h5">{"Storage Performance"}</Text>
                <TouchableOpacity onPress={() => performanceTracker.clearMetrics()}>
                  <Text color="primary.c80">{"Clear"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <IconsLegacy.CloseMedium size={20} color="neutral.c100" />
                </TouchableOpacity>
              </Flex>
              <Flex flexDirection="row" alignItems="center" justifyContent="space-between" mb={3}>
                <Text>{"Show Raw Data"}</Text>
                <Switch value={showRawData} onChange={setShowRawData} checked={showRawData} />
              </Flex>
              <Divider />
              {showRawData ? (
                <ScrollView>
                  {metrics.map((metric, index) => (
                    <Flex
                      key={index}
                      flexDirection="row"
                      py={2}
                      borderBottomWidth={1}
                      borderColor="neutral.c40"
                    >
                      <Text flex={2}>{metric.operation}</Text>
                      <Text flex={3} color="neutral.c70">
                        {metric.key.substring(0, 15)}
                      </Text>
                      <Text flex={1} textAlign="center">
                        {metric.storageType === STORAGE_TYPE.MMKV ? "MMKV" : "AsyncS"}
                      </Text>
                      <Text flex={1} textAlign="right">
                        {metric.duration.toFixed(2)} {"ms"}
                      </Text>
                    </Flex>
                  ))}
                </ScrollView>
              ) : (
                <ScrollView>
                  <Flex flexDirection="row" py={2} bg="neutral.c30">
                    <Text flex={1} textAlign="center" fontWeight="bold">
                      {"Operation"}
                    </Text>
                    <Text flex={1} textAlign="center" fontWeight="bold">
                      {"MMKV (ms)"}
                    </Text>
                    <Text flex={1} textAlign="center" fontWeight="bold">
                      {"AsyncS (ms)"}
                    </Text>
                    <Text flex={1} textAlign="center" fontWeight="bold">
                      {"Diff (%)"}
                    </Text>
                  </Flex>
                  {summary.map((item, index) => (
                    <Flex
                      key={index}
                      flexDirection="row"
                      py={2}
                      borderBottomWidth={1}
                      borderColor="neutral.c40"
                    >
                      <Text flex={1} textAlign="center">
                        {item.operation}
                      </Text>
                      <Text flex={1} textAlign="center">
                        {item.mmkvAvg.toFixed(2)} ({item.mmkvCount})
                      </Text>
                      <Text flex={1} textAlign="center">
                        {item.asyncStorageAvg.toFixed(2)} ({item.asyncStorageCount})
                      </Text>
                      <Text
                        flex={1}
                        textAlign="center"
                        color={
                          item.difference > 0
                            ? "success.c50"
                            : item.difference < 0
                              ? "error.60"
                              : "neutral.c100"
                        }
                      >
                        {item.difference.toFixed(2)}%
                      </Text>
                    </Flex>
                  ))}
                </ScrollView>
              )}
            </AnimatedFlex>
          </SafeAreaView>
        </Flex>
      )}
    </>
  );
};
