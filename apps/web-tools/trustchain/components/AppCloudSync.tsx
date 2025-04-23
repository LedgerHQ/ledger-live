import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useTrustchainSDK } from "../context";
import { CloudSyncSDK, UpdateEvent } from "@ledgerhq/live-wallet/cloudsync/index";
import walletsync, {
  DistantState as LiveData, // LiveData includes accounts, accountNames, and conversation
  liveSlug,
} from "@ledgerhq/live-wallet/walletsync/index";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { Actionable } from "./Actionable";
import { JsonEditor } from "./JsonEditor";
import useEnv from "../useEnv";

// Import conversation helpers (assuming conversationDataManager.ts is in the same directory or adjust path)
import {
  addMessageToDoc,
  createInitialDoc,
  getSortedMessages,
  ConversationDoc, // Type for the conversation part
  MessageDescriptor,
} from "@ledgerhq/live-wallet/walletsync/modules/conversation"; // Adjust path if needed

const liveSchema = walletsync.schema; // This schema should validate the full LiveData including the optional conversation

// Define Props, adding conversationId and conversationName for initialization
interface AppWalletSyncProps {
  trustchain: Trustchain;
  setTrustchain: (t: Trustchain | null) => void;
  memberCredentials: MemberCredentials;
  conversationId: string; // Needed to initialize a conversation if it doesn't exist
  conversationName: string; // Needed to initialize a conversation if it doesn't exist
  data: LiveData | null;
  setData: (d: LiveData | null) => void;
  version: number;
  setVersion: (n: number) => void;
  forceReadOnlyData?: LiveData | null;
  readOnly?: boolean;
  takeControl?: () => void;
}

export function AppWalletSync({
  trustchain,
  memberCredentials,
  conversationId, // Added prop
  conversationName, // Added prop
  version,
  setVersion,
  data,
  setData,
  forceReadOnlyData,
  readOnly,
  takeControl,
}: AppWalletSyncProps) { // Use updated props interface
  const trustchainSdk = useTrustchainSDK();
  const cloudSyncApiBaseUrl = useEnv("CLOUD_SYNC_API_STAGING");

  const [json, setJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // State for the conversation input
  const [newMessage, setNewMessage] = useState("");
  const [author, setAuthor] = useState("User"); // Default author

  // Effect to update JSON editor when the main data changes
  useEffect(() => {
    setJson(data ? JSON.stringify(data, null, 2) : "");
  }, [data]);

  // Effect to handle forced read-only data
  useEffect(() => {
    if (forceReadOnlyData) {
      // No need to stringify here, just set the data object
      setData(forceReadOnlyData);
    }
  }, [forceReadOnlyData, setData]);

  const onJsonEditorChange = useCallback(
    (value: string) => {
      setJson(value); // Update the raw JSON state
      try {
        if (!value.trim()) {
          setData(null); // Clear main data if editor is empty
          setError(null);
          return;
        }
        const parsedData = JSON.parse(value);
        // Validate the entire LiveData structure
        liveSchema.parse(parsedData);
        setData(parsedData); // Update the main data state
        setError(null);
      } catch (e) {
        setError("Invalid LiveData JSON: " + String(e));
        // Keep invalid JSON in editor, but show error
      }
    },
    [setData], // liveSchema is constant, no need to list
  );

  const versionRef = useRef(version);
  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const getCurrentVersion = useCallback(() => versionRef.current, []);

  // saveNewUpdate already works with LiveData, no changes needed here
  const saveNewUpdate = useCallback(
    async (event: UpdateEvent<LiveData>) => {
      switch (event.type) {
        case "new-data":
          console.log("Sync: Received new LiveData version", event.version);
          setVersion(event.version);
          setData(event.data); // Updates the whole LiveData object
          setError(null);
          // JSON editor updates via useEffect [data]
          break;
        case "pushed-data":
          console.log("Sync: Pushed LiveData confirmed, new version", event.version);
          setVersion(event.version);
          break;
        case "deleted-data":
          console.log("Sync: Received delete instruction for LiveData");
          setVersion(0);
          setData(null);
          setError(null);
           // JSON editor updates via useEffect [data]
          break;
      }
    },
    [setVersion, setData], // Removed setJson dependency
  );

  // CloudSyncSDK setup remains the same, already configured for LiveData
  const walletSyncSdk = useMemo(() => {
    return new CloudSyncSDK({ // Generic type remains LiveData
      apiBaseUrl: cloudSyncApiBaseUrl,
      slug: liveSlug,
      schema: walletsync.schema, // Use the main schema
      trustchainSdk,
      getCurrentVersion,
      saveNewUpdate,
      // If your `walletsync` object doesn't export a `dataManager` for LiveData merging,
      // you might need to create one or rely on last-write-wins or manual resolution.
      // For conversations within LiveData, a custom merge strategy might be needed
      // if conflicts are common. For now, we assume simple updates or rely on the default.
    });
  }, [cloudSyncApiBaseUrl, trustchainSdk, getCurrentVersion, saveNewUpdate]);

  const onPull = useCallback(async () => {
    setError(null);
     try {
        console.log("Pulling LiveData...");
        await walletSyncSdk.pull(trustchain, memberCredentials);
        console.log("Pull finished.");
     } catch(e) {
        console.error("Pull failed:", e);
        setError(`Pull failed: ${e instanceof Error ? e.message : String(e)}`);
     }
  }, [trustchain, memberCredentials, walletSyncSdk]);

  // onPush pushes the entire LiveData object, which is correct
  const onPush = useCallback(async () => {
    setError(null);
    if (!data) {
        setError("Cannot push null data.");
        console.warn("Attempted to push null data.");
        return;
    }
    try {
        console.log("Pushing LiveData...", data);
        await walletSyncSdk.push(trustchain, memberCredentials, data);
        console.log("Push finished.");
    } catch(e) {
        console.error("Push failed:", e);
        setError(`Push failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [trustchain, memberCredentials, walletSyncSdk, data]);

  // Modify random data generation to preserve existing conversation
  const onGenRandomAccountData = useCallback(() => {
    setError(null);
    const accountNames: Record<string, string> = {};
    const accounts = Array(Math.floor(5 * Math.random()))
      .fill(0)
      .map(() => {
        const account = genAccount(Math.random().toString());
        let name = getDefaultAccountName(account);
        if (Math.random() > 0.5) {
          name = "Renamed " + name;
        }
        accountNames[account.id] = name;
        return {
          id: account.id,
          currencyId: account.currency.id,
          index: account.index,
          seedIdentifier: account.seedIdentifier,
          derivationMode: account.derivationMode,
          freshAddress: account.freshAddress,
        };
      });

    // Preserve existing conversation if it exists in the current data state
    const existingConversation = data?.conversation;

    // Create the new LiveData object
    const updatedData: LiveData = {
      // Keep existing non-account data if desired (or start fresh)
      // ...data, // uncomment to keep other potential top-level fields
      accounts,
      accountNames,
      // Add back the existing conversation, or undefined if it didn't exist
      ...(existingConversation && { conversation: existingConversation }),
    };

    setData(updatedData); // Update the main state
    console.log("Generated random account data, preserved conversation.");
    // JSON editor updates via useEffect [data]
  }, [setData, data]); // Added data dependency

  const onDestroy = useCallback(async () => {
     setError(null);
     try {
        console.log("Destroying LiveData...");
        await walletSyncSdk.destroy(trustchain, memberCredentials);
        console.log("Destroy finished.");
     } catch (e) {
        console.error("Destroy failed:", e);
        setError(`Destroy failed: ${e instanceof Error ? e.message : String(e)}`);
     }
  }, [trustchain, memberCredentials, walletSyncSdk]);

  const [onUnsubscribe, setSubscription] = useState<null | (() => void)>(null);

  // onListen uses the existing SDK configured for LiveData, no changes needed here.
  const onListen = useCallback(async () => {
    setError(null);
    console.log("Starting listener for LiveData...");
     if (onUnsubscribe) {
        console.log("Already listening.");
        return;
    }
    await new Promise((success, failure) => {
      let pending = false;
      async function poll() {
         if (pending) return;
         pending = true;
         console.log("Listener triggered: Polling for LiveData updates...");
        try {
          await walletSyncSdk.pull(trustchain, memberCredentials);
        } catch(e) {
             console.error("Listener poll failed:", e);
             setError(`Listener poll failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          pending = false;
        }
      }

      poll(); // Initial poll

      const subscription = walletSyncSdk
        .listenNotifications(trustchain, memberCredentials)
        .subscribe({
          next: (notification) => {
             console.log("Received notification:", notification);
            poll();
          },
          complete: () => {
            console.log("Listener subscription completed.");
            setSubscription(null);
            success(null);
          },
          error: (err) => {
             console.error("Listener subscription error:", err);
             setError(`Listener failed: ${err instanceof Error ? err.message : String(err)}`);
             setSubscription(null);
             failure(err);
          },
        });

      const stopListening = () => {
         console.log("Stopping listener...");
         subscription.unsubscribe();
         setSubscription(null);
         success(null);
      };
      setSubscription(() => stopListening);
    });
  }, [trustchain, memberCredentials, walletSyncSdk, onUnsubscribe]); // Added onUnsubscribe

  // --- Conversation Specific Logic ---

  // Memoized calculation for sorted messages
  const sortedMessages = useMemo(() => {
    // Access the conversation part of the LiveData
    const conversationDoc = data?.conversation;
    return conversationDoc ? getSortedMessages(conversationDoc) : [];
  }, [data]); // Depends on the main data object

  // Callback to add a message to the conversation within LiveData
  const onAddMessage = useCallback(() => {
    if (!newMessage.trim() || !author.trim()) {
      setError("Author and message cannot be empty.");
      return;
    }
    setError(null);

    // Get the current conversation doc from LiveData, or create one if needed
    const currentConversationDoc: ConversationDoc =
      data?.conversation ?? createInitialDoc(conversationId, conversationName);

    try {
      // Add the message using the helper function
      const updatedConversationDoc = addMessageToDoc(
        currentConversationDoc,
        newMessage,
        author,
      );

      // Construct the *new* LiveData object
      const updatedLiveData: LiveData = {
        ...(data ?? {}), // Preserve existing accounts, names, etc.
        conversation: updatedConversationDoc, // Set the updated conversation part
      };

      setData(updatedLiveData); // Update the main LiveData state
      setNewMessage(""); // Clear the input field
      console.log("Added message locally to LiveData. Ready to push.");
    } catch (e) {
      console.error("Failed to add message:", e);
      setError(`Failed to add message: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [data, setData, newMessage, author, conversationId, conversationName]); // Dependencies

  // --- Render ---

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Level Info & Controls */}
      <div>
        <h2>WalletSync Demo (LiveData)</h2>
        <p>Sync Version: {version}</p>
        {readOnly ? (
          <div>
            <p>
              Sync was enabled elsewhere. This view is read-only.{" "}
              <button onClick={() => takeControl && takeControl()}>Take Control Back</button>
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "10px",
              paddingBottom: "10px",
              borderBottom: "1px solid #eee",
            }}
          >
            <Actionable action={onPull} buttonTitle="Pull" inputs={[]} />
            <Actionable action={onPush} buttonTitle="Push" inputs={[]} />
            <Actionable action={onGenRandomAccountData} buttonTitle="🎲 Add Accounts" inputs={[]} />
            <Actionable action={onDestroy} buttonTitle="Destroy" inputs={[]} />
            {!onUnsubscribe ? (
              <Actionable action={onListen} buttonTitle="Listen" inputs={[]} />
            ) : (
              <button onClick={onUnsubscribe}>Stop Listening</button>
            )}
          </div>
        )}
      </div>

      {/* Conversation Section */}
      {!readOnly && ( // Don't show input section in read-only mode
        <div style={{ border: "1px solid #007bff", padding: "15px", borderRadius: "5px" }}>
          <h3>Conversation</h3>
          {/* Message Display */}
          <div style={{ marginBottom: "15px" }}>
            {sortedMessages.length === 0 ? (
              <p>No messages yet.</p>
            ) : (
              <ul style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", listStyle: "none", marginBottom:"10px", backgroundColor: "#f9f9f9" }}>
                {sortedMessages.map((msg) => (
                   <li key={`${msg.author}-${msg.date}-${msg.message}`} style={{marginBottom: "5px", paddingBottom: "5px", borderBottom: "1px dashed #eee"}}>
                    <strong>{msg.author}</strong> ({new Date(msg.date).toLocaleString()}):<br/>
                    <span style={{whiteSpace: "pre-wrap"}}>{msg.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Add Message Form */}
          <div>
            <h4>Add Message</h4>
             <div style={{display: "flex", gap: "10px", marginBottom: "5px"}}>
                <label>
                  Author:
                  <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} style={{marginLeft: "5px"}}/>
                </label>
             </div>
             <div style={{display: "flex", gap: "10px", alignItems:"flex-start"}}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter message..."
                  rows={3}
                  style={{ flexGrow: 1, padding: "5px" }}
                />
                <button onClick={onAddMessage} disabled={!newMessage.trim() || !author.trim()}>Send</button>
             </div>
          </div>
        </div>
      )}

      {/* Optional: Display messages also in read-only mode */}
      {readOnly && data?.conversation && (
         <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "5px", backgroundColor: "#f0f0f0" }}>
           <h3>Conversation (Read-Only)</h3>
           <ul style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", listStyle: "none", marginBottom:"10px", backgroundColor: "#fff" }}>
                {sortedMessages.map((msg) => (
                   <li key={`${msg.author}-${msg.date}-${msg.message}`} style={{marginBottom: "5px", paddingBottom: "5px", borderBottom: "1px dashed #eee"}}>
                    <strong>{msg.author}</strong> ({new Date(msg.date).toLocaleString()}):<br/>
                    <span style={{whiteSpace: "pre-wrap"}}>{msg.message}</span>
                  </li>
                ))}
              </ul>
         </div>
      )}


      {/* Error Display */}
      {error && <div style={{ color: "red", marginTop: "10px", whiteSpace: "pre-wrap", border: "1px solid red", padding: "10px", backgroundColor: "#ffebeb" }}>Error: {error}</div>}

      {/* Full LiveData JSON Editor */}
      <div style={{ marginTop: "15px" }}>
        <h4>Debug: Full LiveData (JSON)</h4>
        <JsonEditor value={json} onChange={onJsonEditorChange} readOnly={readOnly} />
      </div>
    </div>
  );
}
