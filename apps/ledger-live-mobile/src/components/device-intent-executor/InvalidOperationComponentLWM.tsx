import React from "react";
import { Text, Flex, Button, Icons } from "@ledgerhq/native-ui";
import type { InvalidOperationComponent } from "@ledgerhq/device-intent";

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

const InvalidOperationComponentLWM: InvalidOperationComponent = ({ error, onClose }) => (
  <Flex alignItems="center" justifyContent="center" p={6}>
    <Icons.Warning color="error.c60" size="L" />
    <Text variant="h5" textAlign="center" mt={4} mb={2}>
      Executor entered an invalid state
    </Text>
    <Text variant="body" color="neutral.c70" textAlign="center" mb={2}>
      The flow changed while a job was still running. Close the executor and restart it.
    </Text>
    <Text variant="body" color="neutral.c70" textAlign="center" mb={6}>
      {formatError(error)}
    </Text>
    <Button type="main" onPress={onClose}>
      Close Executor
    </Button>
  </Flex>
);

export default InvalidOperationComponentLWM;
