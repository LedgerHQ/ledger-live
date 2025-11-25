// ~/renderer/screens/dashboard/ConcordiumAccounts.tsx
import React from "react";
import { Text, Button } from "@ledgerhq/react-ui/index";
import Box from "~/renderer/components/Box";
import {
  useConcordiumAccountsScan,
  formatMicroCcd,
  removeSavedConcordiumAccount,
} from "./useConcordiumAccountScan";

type Props = {
  network: "Mainnet" | "Testnet";
};

export default function ConcordiumAccounts({ network }: Props) {
  const { accounts, isLoading, error, refresh } = useConcordiumAccountsScan(network);

  const handleRemoveAccount = (address: string) => {
    removeSavedConcordiumAccount(address);
    refresh();
  };

  return (
    <Box mt={6}>
      <Box horizontal justifyContent="space-between" alignItems="center" mb={2}>
        <Text variant="subtitle">Concordium Accounts ({network})</Text>
        <Button small variant="shade" onClick={refresh} disabled={isLoading}>
          {isLoading ? "Loading…" : "Refresh"}
        </Button>
      </Box>

      {isLoading && accounts.length === 0 && (
        <Box p={3} borderRadius={8} style={{ backgroundColor: "#050811" }}>
          <Text fontSize={12} color="neutral.c80">
            Loading accounts…
          </Text>
        </Box>
      )}

      {error && (
        <Box
          p={3}
          borderRadius={8}
          style={{ backgroundColor: "#1a0a0a", border: "1px solid #4d1a1a" }}
        >
          <Text fontSize={12} color="error.c60">
            Error: {error.message}
          </Text>
          <Button small variant="shade" onClick={refresh} mt={2}>
            Retry
          </Button>
        </Box>
      )}

      {!isLoading && !error && accounts.length === 0 && (
        <Box
          p={4}
          borderRadius={8}
          style={{ backgroundColor: "#050811", border: "1px solid #283347" }}
        >
          <Text fontSize={12} color="neutral.c80" textAlign="center">
            No saved accounts yet. Create or recover an account to get started.
          </Text>
        </Box>
      )}

      {accounts.map((acc: any) => (
        <Box
          key={`${acc.address}-${acc.createdAt}`}
          mb={2}
          p={3}
          borderRadius={8}
          style={{ backgroundColor: "#050811", border: "1px solid #283347" }}
        >
          {/* Header row with address and remove button */}
          <Box horizontal justifyContent="space-between" alignItems="flex-start">
            <Box flex={1} mr={2}>
              <Text
                fontSize={12}
                color="wallet"
                fontFamily="monospace"
                style={{ wordBreak: "break-all" }}
              >
                {acc.address}
              </Text>
            </Box>
            <Button
              small
              variant="shade"
              onClick={() => handleRemoveAccount(acc.address)}
              style={{ minWidth: "auto", padding: "4px 8px" }}
            >
              ✕
            </Button>
          </Box>

          {/* Transaction hash */}
          {acc.txHash && (
            <Text fontSize={10} color="neutral.c60" mt={1}>
              tx:{" "}
              <span style={{ fontFamily: "monospace" }}>
                {acc.txHash.slice(0, 16)}…{acc.txHash.slice(-8)}
              </span>
            </Text>
          )}

          {/* Account info from chain */}
          {acc.info ? (
            <Box
              mt={2}
              p={2}
              borderRadius={6}
              style={{ backgroundColor: "#0a1a0f", border: "1px solid #1a4d2e" }}
            >
              <Box horizontal justifyContent="space-between" alignItems="center">
                <Text fontSize={10} color="neutral.c60">
                  Balance
                </Text>
                <Text fontSize={13} color="success.c60" fontWeight="semiBold">
                  {formatMicroCcd(acc.info.accountAmount?.microCcdAmount ?? "0")} CCD
                </Text>
              </Box>

              <Box horizontal justifyContent="space-between" mt={1}>
                <Text fontSize={10} color="neutral.c60">
                  Nonce
                </Text>
                <Text fontSize={10} color="neutral.c80" fontFamily="monospace">
                  {acc.info.accountNonce?.value ?? "—"}
                </Text>
              </Box>

              <Box horizontal justifyContent="space-between" mt={1}>
                <Text fontSize={10} color="neutral.c60">
                  Account Index
                </Text>
                <Text fontSize={10} color="neutral.c80" fontFamily="monospace">
                  {acc.info.accountIndex ?? "—"}
                </Text>
              </Box>
            </Box>
          ) : acc.info === null ? (
            <Box
              mt={2}
              p={2}
              borderRadius={6}
              style={{ backgroundColor: "#1a0f0a", border: "1px solid #4d2e1a" }}
            >
              <Text fontSize={10} color="warning.c60">
                ⏳ Account not found on-chain yet
              </Text>
              <Text fontSize={9} color="neutral.c60" mt={1}>
                This may be pending confirmation. Try refreshing in a few moments.
              </Text>
            </Box>
          ) : null}

          {/* Created timestamp */}
          <Text fontSize={9} color="neutral.c50" mt={2}>
            Added {new Date(acc.createdAt).toLocaleString()}
          </Text>
        </Box>
      ))}

      {/* Summary footer */}
      {accounts.length > 0 && (
        <Box
          mt={3}
          p={2}
          borderRadius={6}
          horizontal
          justifyContent="space-between"
          style={{ backgroundColor: "#0a0f18" }}
        >
          <Text fontSize={10} color="neutral.c60">
            Total accounts: {accounts.length}
          </Text>
          <Text fontSize={10} color="neutral.c60">
            On-chain: {accounts.filter((a: any) => a.info !== null).length}
          </Text>
        </Box>
      )}
    </Box>
  );
}
