// ~/renderer/screens/dashboard/concordium/SendForm.tsx
import React, { useCallback, useState } from "react";
import { Text, Button } from "@ledgerhq/react-ui/index";
import Box from "~/renderer/components/Box";
import {
  useConcordiumAccountsScan,
  removeSavedConcordiumAccount,
} from "./useConcordiumAccountScan";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import { parseCcdToMicroCcd, formatMicroCcd } from "./utils";

// Send form component
export function SendForm({
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
