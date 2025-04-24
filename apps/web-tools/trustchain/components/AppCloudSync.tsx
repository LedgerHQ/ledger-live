import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useTrustchainSDK } from "../context";
import { CloudSyncSDK, UpdateEvent } from "@ledgerhq/live-wallet/cloudsync/index";
import walletsync, {
  DistantState as LiveData, // LiveData type should already include the optional 'file'
  liveSlug,
} from "@ledgerhq/live-wallet/walletsync/index";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { Actionable } from "./Actionable";
import { JsonEditor } from "./JsonEditor";
import useEnv from "../useEnv";

// Conversation Helpers
import {
  addMessageToDoc,
  createInitialDoc as createInitialConversationDoc, // Rename for clarity
  getSortedMessages,
  ConversationDoc,
  MessageDescriptor,
} from "@ledgerhq/live-wallet/walletsync/modules/conversation"; // Adjust path

// *** File Helpers (Imported) ***
import {
  updateFileInDoc,
  createInitialFileDoc,
  getFileData,
  encodeFileAsBase64,
  decodeBase64ToFile,
  FileDoc,
  FileDescriptor,
} from "@ledgerhq/live-wallet/walletsync/modules/file"; // Adjust path

const liveSchema = walletsync.schema; // Assume this schema validates the full LiveData (accounts, conv, file, etc.)

// *** Updated Props Interface ***
interface AppWalletSyncProps {
  trustchain: Trustchain;
  setTrustchain: (t: Trustchain | null) => void;
  memberCredentials: MemberCredentials;
  conversationId: string;
  conversationName: string;
  fileId: string; // Added prop
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
  conversationId,
  conversationName,
  fileId, // Destructure new prop
  version,
  setVersion,
  data,
  setData,
  forceReadOnlyData,
  readOnly,
  takeControl,
}: AppWalletSyncProps) {
  const trustchainSdk = useTrustchainSDK();
  const cloudSyncApiBaseUrl = useEnv("CLOUD_SYNC_API_STAGING");

  const [json, setJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [author, setAuthor] = useState("User");
  const [isFileLoading, setIsFileLoading] = useState(false); // Loading state for file processing

  // Effect to update JSON editor when the main data changes
  useEffect(() => {
    setJson(data ? JSON.stringify(data, null, 2) : "");
  }, [data]);

  // Effect to handle forced read-only data
  useEffect(() => {
    if (forceReadOnlyData) {
      setData(forceReadOnlyData);
    }
  }, [forceReadOnlyData, setData]);

  const onJsonEditorChange = useCallback(
    (value: string) => {
      setJson(value);
      try {
        if (!value.trim()) {
          setData(null);
          setError(null);
          return;
        }
        const parsedData = JSON.parse(value);
        liveSchema.parse(parsedData); // Validate the full structure
        setData(parsedData);
        setError(null);
      } catch (e) {
        setError("Invalid LiveData JSON: " + String(e));
      }
    },
    [setData],
  );

  const versionRef = useRef(version);
  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const getCurrentVersion = useCallback(() => versionRef.current, []);

  // saveNewUpdate remains the same, handles full LiveData
  const saveNewUpdate = useCallback(
    async (event: UpdateEvent<LiveData>) => {
      switch (event.type) {
        case "new-data":
          console.log("Sync: Received new LiveData version", event.version);
          setVersion(event.version);
          setData(event.data); // Updates the whole LiveData object
          setError(null);
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
          break;
      }
    },
    [setVersion, setData],
  );

  // CloudSyncSDK setup remains the same
  const walletSyncSdk = useMemo(() => {
    return new CloudSyncSDK({
      apiBaseUrl: cloudSyncApiBaseUrl,
      slug: liveSlug,
      schema: walletsync.schema, // Use the main schema covering all parts
      trustchainSdk,
      getCurrentVersion,
      saveNewUpdate,
      // NOTE: CloudSyncSDK itself doesn't deeply merge by default.
      // The `walletsync.dataManager` (if it exists and is configured for CloudSyncSDK)
      // OR your `saveNewUpdate` logic handles incoming data.
      // Our `saveNewUpdate` currently replaces the whole `LiveData` object.
      // For more granular merging (e.g., merging messages AND file updates from different sources simultaneously),
      // a custom dataManager for the *entire* LiveData structure would be needed,
      // capable of delegating to conversationManager and fileManager.
      // For now, we assume updates replace the whole structure or are handled sequentially.
    });
  }, [cloudSyncApiBaseUrl, trustchainSdk, getCurrentVersion, saveNewUpdate]);

  // onPull remains the same
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

  // onPush remains the same (pushes entire LiveData)
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

  // Modify random data generation to preserve BOTH conversation AND file
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

    // Preserve existing conversation and file
    const existingConversation = data?.conversation;
    const existingFile = data?.file; // <<< Preserve file

    const updatedData: LiveData = {
      // ...data, // Optionally spread other top-level fields if they exist
      accounts,
      accountNames,
      // Add back existing non-account data
      ...(existingConversation && { conversation: existingConversation }),
      ...(existingFile && { file: existingFile }), // <<< Add back file
    };

    setData(updatedData);
    console.log("Generated random account data, preserved conversation and file.");
  }, [setData, data]); // Added data dependency

  // onDestroy remains the same
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

  // onListen remains the same
  const [onUnsubscribe, setSubscription] = useState<null | (() => void)>(null);
  const onListen = useCallback(async () => {
      // ... (implementation unchanged)
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
  }, [trustchain, memberCredentials, walletSyncSdk, onUnsubscribe]);


  // --- Conversation Specific Logic (Unchanged) ---
  const sortedMessages = useMemo(() => {
    const conversationDoc = data?.conversation;
    return conversationDoc ? getSortedMessages(conversationDoc) : [];
  }, [data]);

  const onAddMessage = useCallback(() => {
    if (!newMessage.trim() || !author.trim()) {
      setError("Author and message cannot be empty.");
      return;
    }
    setError(null);

    const currentConversationDoc: ConversationDoc =
      data?.conversation ?? createInitialConversationDoc(conversationId, conversationName);

    try {
      const updatedConversationDoc = addMessageToDoc(
        currentConversationDoc,
        newMessage,
        author,
      );
      const updatedLiveData: LiveData = {
        ...(data ?? {}), // Preserve other parts (accounts, file etc.)
        conversation: updatedConversationDoc,
      };
      setData(updatedLiveData);
      setNewMessage("");
      console.log("Added message locally to LiveData. Ready to push.");
    } catch (e) {
      console.error("Failed to add message:", e);
      setError(`Failed to add message: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [data, setData, newMessage, author, conversationId, conversationName]);

  // --- *** File Specific Logic *** ---

  // Memoize current file data for display
  const currentFile = useMemo(() => {
      return data?.file ? getFileData(data.file) : null;
  }, [data]);

  // Handle file input change
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const files = event.target.files;
      if (!files || files.length === 0) {
          console.log("No file selected.");
          return;
      }

      const file = files[0];
      setIsFileLoading(true); // Start loading indicator

      try {
          console.log(`Processing file: ${file.name} (${file.type})`);
          // 1. Encode file content to Base64
          const base64Content = await encodeFileAsBase64(file);

          // 2. Get the current FileDoc state or create an initial one
          //    We need the whole FileDoc for updateFileInDoc, which preserves the ID.
          const currentFileDoc : FileDoc = data?.file ?? createInitialFileDoc(fileId);

          // 3. Create the updated FileDoc using the helper
          const updatedFileDoc = updateFileInDoc(
              currentFileDoc, // Pass the current doc (contains the ID)
              file.name,
              file.type || 'application/octet-stream', // Use default MIME if type is missing
              base64Content
          );

          // 4. Construct the new LiveData object, preserving other parts
          const updatedLiveData: LiveData = {
              ...(data ?? {}), // Spread existing data (accounts, conversation, etc.)
              file: updatedFileDoc, // Overwrite/add the file part
          };

          // 5. Update the main state
          setData(updatedLiveData);
          console.log(`File '${file.name}' processed and added to local LiveData. Ready to push.`);

      } catch (err) {
          console.error("Failed to process file:", err);
          setError(`File processing failed: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
          setIsFileLoading(false); // Stop loading indicator
          // Reset file input value so the same file can be selected again if needed
          event.target.value = '';
      }

  }, [data, setData, fileId]); // Dependencies: current data, setter, fileId

  // Handle file download
  const onDownloadFile = useCallback(() => {
      setError(null);
      if (!currentFile || !currentFile.contentBase64) {
          setError("No file data available to download.");
          return;
      }

      try {
          const fileObject = decodeBase64ToFile(
              currentFile.contentBase64,
              currentFile.mimeType,
              currentFile.name
          );

          // Create a temporary URL for the blob
          const url = URL.createObjectURL(fileObject);
          const a = document.createElement('a');
          a.href = url;
          a.download = currentFile.name || 'downloaded_file'; // Use stored name or default
          document.body.appendChild(a); // Append to body to ensure click works
          a.click();
          document.body.removeChild(a); // Clean up link
          URL.revokeObjectURL(url); // Clean up object URL
          console.log("File download initiated for:", currentFile.name);

      } catch (err) {
           console.error("Failed to decode or download file:", err);
           setError(`File download failed: ${err instanceof Error ? err.message : String(err)}`);
      }
  }, [currentFile]); // Depends on the memoized currentFile


  // --- Render ---
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Level Info & Controls (Unchanged) */}
      <div>
          {/* ... existing controls ... */}
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

      {/* --- File Management Section --- */}
      <div style={{ border: "1px solid #28a745", padding: "15px", borderRadius: "5px" }}>
          <h3>File Management</h3>
          {isFileLoading && <p style={{ color: "blue" }}>Processing file...</p>}
          {currentFile ? (
              <div style={{ marginBottom: "10px" }}>
                  <p>Current File: <strong>{currentFile.name}</strong> ({currentFile.mimeType})</p>
                  <p>Last Modified (Sync): {new Date(currentFile.lastModified).toLocaleString()}</p>
                  {!readOnly && ( // Only allow download if not read-only and content exists
                    <button onClick={onDownloadFile} disabled={!currentFile.contentBase64}>
                       Download File
                    </button>
                  )}
                   {readOnly && ( // Optionally show download even in read-only
                     <button onClick={onDownloadFile} disabled={!currentFile.contentBase64}>
                       Download File (Read-Only)
                    </button>
                  )}
              </div>
          ) : (
              <p>No file uploaded yet.</p>
          )}
          {!readOnly && ( // Don't show upload input in read-only mode
             <div>
                <label htmlFor="file-upload">Upload/Replace File:</label>
                <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    disabled={isFileLoading} // Disable while processing
                    style={{marginLeft: "10px"}}
                />
             </div>
          )}
      </div>


      {/* Conversation Section (Unchanged structure, conditionally rendered) */}
       {!readOnly && (
         <div style={{ border: "1px solid #007bff", padding: "15px", borderRadius: "5px" }}>
           {/* ... existing conversation UI ... */}
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
       {readOnly && data?.conversation && (
          <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "5px", backgroundColor: "#f0f0f0" }}>
           {/* ... existing read-only conversation display ... */}
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

      {/* Error Display (Unchanged) */}
      {error && <div style={{ color: "red", marginTop: "10px", whiteSpace: "pre-wrap", border: "1px solid red", padding: "10px", backgroundColor: "#ffebeb" }}>Error: {error}</div>}

      {/* Full LiveData JSON Editor (Unchanged) */}
      <div style={{ marginTop: "15px" }}>
        <h4>Debug: Full LiveData (JSON)</h4>
        <JsonEditor value={json} onChange={onJsonEditorChange} readOnly={readOnly} />
      </div>
    </div>
  );
}