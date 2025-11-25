// ~/renderer/screens/dashboard/ConcordiumAccounts.tsx
import React, { useCallback, useState } from "react";
import { Text, Button } from "@ledgerhq/react-ui/index";
import Box from "~/renderer/components/Box";
import {
  useConcordiumAccountsScan,
  removeSavedConcordiumAccount,
} from "./useConcordiumAccountScan";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";

type Props = {
  network: "Mainnet" | "Testnet";
  seedPhrase: string;
};

// Helper to safely extract value from protobuf-style objects
function extractValue(obj: any): string {
  if (obj === null || obj === undefined) {
    return "—";
  }
  if (typeof obj === "object" && "value" in obj) {
    return extractValue(obj.value);
  }
  if (typeof obj === "object" && "microCcdAmount" in obj) {
    return extractValue(obj.microCcdAmount);
  }
  if (typeof obj === "object" && "@type" in obj && "value" in obj) {
    return String(obj.value);
  }
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  return String(obj);
}

// Format microCCD to CCD
function formatMicroCcd(microCcd: any): string {
  try {
    const valueStr = extractValue(microCcd);
    const value = BigInt(valueStr);
    const ccd = Number(value) / 1_000_000;
    return ccd.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  } catch (e) {
    console.warn("[Concordium] Failed to format microCcd:", microCcd, e);
    return "—";
  }
}

// Parse CCD to microCCD
function parseCcdToMicroCcd(ccd: string): bigint {
  const num = parseFloat(ccd);
  if (isNaN(num) || num < 0) {
    throw new Error("Invalid CCD amount");
  }
  return BigInt(Math.floor(num * 1_000_000));
}

// Send form component
function SendForm({
  senderAddress,
  accountIndex,
  network,
  seedPhrase,
  onSuccess,
  onCancel,
  maxAmount,
}: {
  senderAddress: string;
  accountIndex: number;
  network: "Mainnet" | "Testnet";
  seedPhrase: string;
  onSuccess: () => void;
  onCancel: () => void;
  maxAmount: string;
}) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    setError(null);
    setTxHash(null);

    if (!recipientAddress.trim()) {
      setError("Recipient address is required");
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    try {
      setIsSubmitting(true);

      const microCcdAmount = parseCcdToMicroCcd(amount);
      console.log("[Concordium] Sending transfer via preload:", {
        from: senderAddress,
        to: recipientAddress,
        amount: microCcdAmount.toString(),
        network,
        memo: memo || undefined,
      });

      // ⚠️ Type any because TS doesn't know about window.grpc in renderer
      const raw = await (window as any).api.grpc.sendSimpleTransfer({
        seedPhrase, // string
        network, // "Mainnet" | "Testnet"
        identityProviderIndex: 0,
        identityIndex: 0,
        credNumber: 0,
        // nodeAddress: "127.0.0.1", // replace with real node
        // nodePort: 20000, // replace with real port
        fromAddressBase58: senderAddress, //  /
        toAddressBase58: recipientAddress,
        amountMicroCcd: microCcdAmount.toString(),
        expiryMs: 6 * 60 * 1000,
      });
      console.log(raw);
      const { txHash } = JSON.parse(raw);
      console.log("[Concordium] Transfer submitted, txHash:", txHash);
      setTxHash(txHash);

      // Clear form
      setRecipientAddress("");
      setAmount("");
      setMemo("");

      onSuccess();
    } catch (e) {
      console.error("[Concordium] Transfer failed:", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  }, [recipientAddress, amount, memo, senderAddress, onSuccess]);
  const handleSetMax = useCallback(() => {
    const maxNum = parseFloat(formatMicroCcd(maxAmount).replace(/,/g, ""));
    const safeMax = Math.max(0, maxNum - 0.01);
    setAmount(safeMax.toFixed(6));
  }, [maxAmount]);

  return (
    <Box
      mt={3}
      p={3}
      borderRadius={6}
      style={{ backgroundColor: "#0a0f18", border: "1px solid #2a3445" }}
    >
      <Box horizontal justifyContent="space-between" alignItems="center" mb={2}>
        <Text fontSize={11} color="neutral.c80" fontWeight="semiBold">
          Send CCD
        </Text>
        <Button
          small
          variant="shade"
          onClick={onCancel}
          style={{ minWidth: "auto", padding: "4px 8px" }}
        >
          ✕
        </Button>
      </Box>

      {/* Recipient */}
      <Box mb={2}>
        <Text fontSize={10} color="neutral.c60" mb={1}>
          Recipient Address
        </Text>
        <input
          type="text"
          value={recipientAddress}
          onChange={e => setRecipientAddress(e.target.value)}
          placeholder="Enter Concordium address"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #283347",
            backgroundColor: "#050811",
            color: "#fff",
            fontSize: 12,
            fontFamily: "monospace",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </Box>

      {/* Amount */}
      <Box mb={2}>
        <Box horizontal justifyContent="space-between" alignItems="center" mb={1}>
          <Text fontSize={10} color="neutral.c60">
            Amount (CCD)
          </Text>
          <Text
            fontSize={10}
            color="primary.c80"
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={handleSetMax}
          >
            Max
          </Text>
        </Box>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.000001"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #283347",
            backgroundColor: "#050811",
            color: "#fff",
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </Box>

      {/* Memo (optional) */}
      <Box mb={3}>
        <Text fontSize={10} color="neutral.c60" mb={1}>
          Memo (optional)
        </Text>
        <input
          type="text"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="Optional message"
          disabled={isSubmitting}
          maxLength={256}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #283347",
            backgroundColor: "#050811",
            color: "#fff",
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </Box>

      {/* Error message */}
      {error && (
        <Box
          mb={2}
          p={2}
          borderRadius={4}
          style={{ backgroundColor: "#1a0a0a", border: "1px solid #4d1a1a" }}
        >
          <Text fontSize={10} color="error.c60">
            {error}
          </Text>
        </Box>
      )}

      {/* Success message */}
      {txHash && (
        <Box
          mb={2}
          p={2}
          borderRadius={4}
          style={{ backgroundColor: "#0a1a0f", border: "1px solid #1a4d2e" }}
        >
          <Text fontSize={10} color="success.c60" mb={1}>
            ✓ Transfer submitted!
          </Text>
          <Text fontSize={10} color="neutral.c80" fontFamily="monospace">
            {txHash.slice(0, 16)}…{txHash.slice(-8)}
            <CopyWithFeedback text={txHash} />
          </Text>
        </Box>
      )}

      {/* Submit button */}
      <Button
        variant="main"
        onClick={handleSend}
        disabled={isSubmitting || !recipientAddress || !amount}
        style={{ width: "100%" }}
      >
        {isSubmitting ? "Sending…" : "Send CCD"}
      </Button>
    </Box>
  );
}

export default function ConcordiumAccounts({ network, seedPhrase }: Props) {
  const { accounts, isLoading, error, refresh } = useConcordiumAccountsScan(network);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  const handleRemoveAccount = (address: string) => {
    removeSavedConcordiumAccount(address);
    refresh();
  };

  const toggleSendForm = (address: string) => {
    setExpandedAccount(prev => (prev === address ? null : address));
  };

  const closeSendForm = () => {
    setExpandedAccount(null);
  };

  React.useEffect(() => {
    if (accounts.length > 0 && accounts[0].info) {
      console.log(
        "[Concordium] Account info structure:",
        JSON.stringify(accounts[0].info, null, 2),
      );
    }
  }, [accounts]);

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

      {accounts.map((acc, index) => (
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
                <CopyWithFeedback text={acc.address} />
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
                <CopyWithFeedback text={acc.txHash} />
              </span>
            </Text>
          )}

          {/* Account info from chain */}
          {acc.info ? (
            <>
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
                    {formatMicroCcd(acc.info.accountAmount)} CCD
                  </Text>
                </Box>

                <Box horizontal justifyContent="space-between" mt={1}>
                  <Text fontSize={10} color="neutral.c60">
                    Nonce
                  </Text>
                  <Text fontSize={10} color="neutral.c80" fontFamily="monospace">
                    {extractValue(acc.info.accountNonce)}
                  </Text>
                </Box>

                <Box horizontal justifyContent="space-between" mt={1}>
                  <Text fontSize={10} color="neutral.c60">
                    Account Index
                  </Text>
                  <Text fontSize={10} color="neutral.c80" fontFamily="monospace">
                    {extractValue(acc.info.accountIndex)}
                  </Text>
                </Box>
              </Box>

              {/* Send button (only show if form is not expanded) */}
              {expandedAccount !== acc.address && (
                <Box mt={2}>
                  <Button
                    small
                    variant="main"
                    onClick={() => toggleSendForm(acc.address)}
                    style={{ width: "100%" }}
                  >
                    Send CCD
                  </Button>
                </Box>
              )}

              {/* Send form (expanded) */}
              {expandedAccount === acc.address && (
                <SendForm
                  senderAddress={acc.address}
                  accountIndex={index}
                  network={network}
                  seedPhrase={seedPhrase}
                  onSuccess={refresh}
                  onCancel={closeSendForm}
                  maxAmount={extractValue(acc.info.accountAmount)}
                />
              )}
            </>
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
            On-chain: {accounts.filter(a => a.info !== null).length}
          </Text>
        </Box>
      )}
    </Box>
  );
}
