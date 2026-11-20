import { useCallback, useEffect, useRef, useState } from "react";

export type ReplaceableSignRequestEntry<Request> = Readonly<{
  requestId: number;
  request: Request;
}>;

export type UseReplaceableSignRequestsParams<TransactionRequest, MessageRequest> = Readonly<{
  onReplaceTransaction: (previous: TransactionRequest) => void;
  onReplaceMessage: (previous: MessageRequest) => void;
}>;

export type UseReplaceableSignRequestsResult<TransactionRequest, MessageRequest> = Readonly<{
  deviceIntentSignEntry: ReplaceableSignRequestEntry<TransactionRequest> | null;
  requestDeviceIntentSign: (request: TransactionRequest) => void;
  clearDeviceIntentSignRequest: (requestId: number) => void;
  deviceIntentSignMessageEntry: ReplaceableSignRequestEntry<MessageRequest> | null;
  requestDeviceIntentSignMessage: (request: MessageRequest) => void;
  clearDeviceIntentSignMessageRequest: (requestId: number) => void;
  clearAllDeviceIntentSignRequests: () => void;
}>;

export function useReplaceableSignRequests<TransactionRequest, MessageRequest>({
  onReplaceTransaction,
  onReplaceMessage,
}: UseReplaceableSignRequestsParams<
  TransactionRequest,
  MessageRequest
>): UseReplaceableSignRequestsResult<TransactionRequest, MessageRequest> {
  const signRequestIdRef = useRef(0);
  const onReplaceTransactionRef = useRef(onReplaceTransaction);
  const onReplaceMessageRef = useRef(onReplaceMessage);

  useEffect(() => {
    onReplaceTransactionRef.current = onReplaceTransaction;
    onReplaceMessageRef.current = onReplaceMessage;
  }, [onReplaceTransaction, onReplaceMessage]);

  const activeSignEntryRef = useRef<ReplaceableSignRequestEntry<TransactionRequest> | null>(null);
  const [deviceIntentSignEntry, setDeviceIntentSignEntry] =
    useState<ReplaceableSignRequestEntry<TransactionRequest> | null>(null);

  const requestDeviceIntentSign = useCallback((request: TransactionRequest) => {
    if (activeSignEntryRef.current) {
      onReplaceTransactionRef.current(activeSignEntryRef.current.request);
    }
    signRequestIdRef.current += 1;
    const entry: ReplaceableSignRequestEntry<TransactionRequest> = {
      requestId: signRequestIdRef.current,
      request,
    };
    activeSignEntryRef.current = entry;
    setDeviceIntentSignEntry(entry);
  }, []);

  const clearDeviceIntentSignRequest = useCallback((requestId: number) => {
    if (activeSignEntryRef.current?.requestId !== requestId) return;
    activeSignEntryRef.current = null;
    setDeviceIntentSignEntry(null);
  }, []);

  const activeSignMessageEntryRef = useRef<ReplaceableSignRequestEntry<MessageRequest> | null>(
    null,
  );
  const [deviceIntentSignMessageEntry, setDeviceIntentSignMessageEntry] =
    useState<ReplaceableSignRequestEntry<MessageRequest> | null>(null);

  const requestDeviceIntentSignMessage = useCallback((request: MessageRequest) => {
    if (activeSignMessageEntryRef.current) {
      onReplaceMessageRef.current(activeSignMessageEntryRef.current.request);
    }
    signRequestIdRef.current += 1;
    const entry: ReplaceableSignRequestEntry<MessageRequest> = {
      requestId: signRequestIdRef.current,
      request,
    };
    activeSignMessageEntryRef.current = entry;
    setDeviceIntentSignMessageEntry(entry);
  }, []);

  const clearDeviceIntentSignMessageRequest = useCallback((requestId: number) => {
    if (activeSignMessageEntryRef.current?.requestId !== requestId) return;
    activeSignMessageEntryRef.current = null;
    setDeviceIntentSignMessageEntry(null);
  }, []);

  const clearAllDeviceIntentSignRequests = useCallback(() => {
    activeSignEntryRef.current = null;
    activeSignMessageEntryRef.current = null;
    setDeviceIntentSignEntry(null);
    setDeviceIntentSignMessageEntry(null);
  }, []);

  return {
    deviceIntentSignEntry,
    requestDeviceIntentSign,
    clearDeviceIntentSignRequest,
    deviceIntentSignMessageEntry,
    requestDeviceIntentSignMessage,
    clearDeviceIntentSignMessageRequest,
    clearAllDeviceIntentSignRequests,
  };
}
