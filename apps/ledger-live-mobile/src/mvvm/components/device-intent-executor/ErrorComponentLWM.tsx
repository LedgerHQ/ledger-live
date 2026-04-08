/**
 * NOTE: this is a work in progress. It does not yet follow mvvm architecture and has no tests,
 * the point for now it to allow manual testing of the DeviceIntentExecutor component.
 *
 * Initial shared error component for the DeviceIntentExecutor on LWM.
 *
 * TODO (final version):
 * - Use Lumen UI components instead of Native UI components
 * - Error-type-specific rendering and messaging
 * - Contextual recovery actions beyond simple retry
 * - Integration with error analytics
 * - MVVM architecture
 * - Tests
 */
import React from "react";
import { Text, Flex, Button, Icons } from "@ledgerhq/native-ui";
import type { ErrorComponent } from "@ledgerhq/device-intent";

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

const ErrorComponentLWM: ErrorComponent = ({ error, onRetry }) => (
  <Flex alignItems="center" justifyContent="center" p={6}>
    <Icons.Warning color="error.c60" size="L" />
    <Text variant="h5" textAlign="center" mt={4} mb={2}>
      {"Something went wrong"}
    </Text>
    <Text variant="body" color="neutral.c70" textAlign="center" mb={6}>
      {formatError(error)}
    </Text>
    <Button type="main" onPress={onRetry}>
      {"Retry"}
    </Button>
  </Flex>
);

export default ErrorComponentLWM;
