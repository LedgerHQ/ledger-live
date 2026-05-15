import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, Text, Button, Alert } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { Trans, useTranslation } from "~/context/Locale";
import { useSendFlowData } from "~/mvvm/features/Send/context/SendFlowContext";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";

export function AleoPrivateSyncScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { state } = useSendFlowData();
  const [isSyncing, setIsSyncing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Simulate sync progress (TODO: Replace with actual private sync hook)
  useEffect(() => {
    let mounted = true;
    let currentProgress = 0;

    const interval = setInterval(() => {
      if (!mounted) return;

      currentProgress += 10;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsSyncing(false);
        // Auto-advance to amount screen after sync completes
        setTimeout(() => {
          if (mounted) {
            navigation.navigate(ScreenName.SendFlowAmount);
          }
        }, 500);
      }
    }, 300);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [navigation]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsSyncing(true);
    setProgress(0);
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <Flex flex={1} justifyContent="center" alignItems="center" px={6}>
          <Alert type="error" title={t("aleo.privateSync.errorTitle")}>
            {error.message}
          </Alert>
          <Button type="main" size="large" onPress={handleRetry} mt={4}>
            <Trans i18nKey="aleo.privateSync.retry" />
          </Button>
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <Flex flex={1} justifyContent="center" alignItems="center" px={6}>
        <ActivityIndicator size="large" color={colors.primary} />

        <Text variant="h4" fontWeight="semiBold" textAlign="center" mt={6} mb={2}>
          <Trans i18nKey="aleo.privateSync.title" />
        </Text>

        <Text variant="body" color="neutral.c70" textAlign="center" mb={6}>
          <Trans i18nKey="aleo.privateSync.description" />
        </Text>

        <Flex
          width="100%"
          height={8}
          backgroundColor="neutral.c40"
          borderRadius={4}
          overflow="hidden"
        >
          <Flex width={`${progress}%`} height="100%" backgroundColor="primary.c80" />
        </Flex>

        <Text variant="small" color="neutral.c70" mt={2}>
          {progress}%
        </Text>

        <Flex mt={8} px={4}>
          <Text variant="body" color="neutral.c80" textAlign="center" mb={2}>
            <Trans i18nKey="aleo.privateSync.why.title" />
          </Text>
          <Text variant="small" color="neutral.c70" textAlign="center">
            <Trans i18nKey="aleo.privateSync.why.description" />
          </Text>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
