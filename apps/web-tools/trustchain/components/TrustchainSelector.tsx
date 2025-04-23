import React, { useState, useEffect, useCallback } from "react";
import {
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { useTrustchainSDK } from "../context"; // Assuming this context provides the SDK

// Props definition remains the same
interface TrustchainSelectorProps {
  deviceId: string;
  memberCredentials: MemberCredentials | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
}

export function TrustchainSelector({
  deviceId,
  memberCredentials,
  setTrustchain,
  callbacks,
}: TrustchainSelectorProps) {
  const sdk = useTrustchainSDK();
  const [trustchains, setTrustchains] = useState<Trustchain[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>("");
  // State to track if the user has initiated a fetch at least once
  const [fetchInitiated, setFetchInitiated] = useState<boolean>(false);

  // Effect to RESET state if critical inputs like deviceId or memberCredentials change.
  // This ensures stale data isn't shown if inputs change after a fetch.
  useEffect(() => {
    // Clear previous results and selection if inputs change
    setTrustchains([]);
    setSelectedValue("");
    setError(null);
    setIsLoading(false); // Cancel loading if props change mid-fetch
    setFetchInitiated(false); // Reset fetch status
    // Notify parent that selection is cleared due to input change
    setTrustchain(null);
    // Note: We only reset here, fetch is now manual via button.
  }, [deviceId, memberCredentials, setTrustchain]); // setTrustchain dependency might be optional depending on stability guarantees

  // Handler for the fetch button click, wrapped in useCallback
  const handleFetchClick = useCallback(async () => {
    // Prevent fetch if required data is missing or already loading
    if (!memberCredentials || !deviceId || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrustchains([]); // Clear previous results
    setSelectedValue(""); // Reset selection
    setFetchInitiated(true); // Mark that a fetch attempt has been made
    // Reset parent state immediately before fetching new ones
    setTrustchain(null);

    try {
      const result = await sdk.getTrustchains(deviceId, memberCredentials, callbacks);
      setTrustchains(result);
      // Optional: auto-select first item if needed after fetch
      // if (result.length > 0) {
      //   setSelectedValue(result[0].rootId);
      //   setTrustchain(result[0]);
      // }
    } catch (err: any) {
      console.error("Failed to fetch trustchains:", err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
    // useCallback dependencies: Include everything needed within the fetch logic
    // sdk & callbacks might be stable from context/props, but including them is safer.
  }, [deviceId, memberCredentials, isLoading, sdk, callbacks, setTrustchain]); // Added relevant dependencies

  // Handler for when the select value changes (no changes needed here)
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRootId = event.target.value;
    setSelectedValue(selectedRootId);

    if (selectedRootId === "") {
      setTrustchain(null);
    } else {
      const selectedTrustchain = trustchains.find(tc => tc.rootId === selectedRootId);
      setTrustchain(selectedTrustchain || null);
    }
  };

  // Display function for option text (no changes needed here)
  const displayTrustchain = (trustchain: Trustchain) => trustchain.rootId;

  // Determine if the select dropdown should be disabled
  const isSelectDisabled = isLoading || trustchains.length === 0;

  return (
    <div>
      {/* Button to trigger the fetch */}
      <button
        onClick={handleFetchClick}
        disabled={!memberCredentials || isLoading}
        type="button" // Good practice for buttons not submitting forms
        data-tooltip-id="tooltip" // Keep tooltip attributes if needed
        data-tooltip-content={
          !memberCredentials ? "Member credentials required to load" :
          isLoading ? "Loading..." :
          "Load available Trustchains for this device"
        }
      >
        {isLoading ? "Loading..." : "Load Trustchains"}
      </button>

      {/* Display error message right below the button if fetch fails */}
      {error && <p style={{ color: 'red', fontSize: 'small', marginTop: '4px' }}>Error: {error.message}</p>}

      {/* Separator/Spacing */}
      <div style={{ marginTop: '10px' }}>
        <label htmlFor={`trustchain-select-${deviceId}`}>Select Trustchain:</label>
        <select
          id={`trustchain-select-${deviceId}`}
          value={selectedValue}
          onChange={handleSelectChange}
          disabled={isSelectDisabled} // Disable if loading or no options available
          data-tooltip-id="tooltip"
          data-tooltip-content={
            isLoading ? "Loading..." :
            isSelectDisabled ? (fetchInitiated ? "No Trustchains found." : "Click 'Load Trustchains' first.") :
            "Select an existing Trustchain"
          }
        >
          {/* Default option text adapts based on state */}
          <option value="">
            {isLoading ? "Loading..." :
             fetchInitiated && trustchains.length === 0 ? "-- No Trustchains found --" :
             "-- Select a Trustchain --"
            }
          </option>
          {trustchains.map((trustchain) => (
            <option key={trustchain.rootId} value={trustchain.rootId}>
              {displayTrustchain(trustchain)}
            </option>
          ))}
        </select>

        {/* Optional: Explicit message when fetch is done but yields no results */}
        {fetchInitiated && !isLoading && error === null && trustchains.length === 0 && (
           <p style={{ fontSize: 'small', marginTop: '4px' }}>No trustchains found for this device/member.</p>
        )}
      </div>

      {/* Display message if credentials aren't available */}
      {!memberCredentials && (
         <p style={{ color: 'orange', fontSize: 'small', marginTop: '4px' }}>
            Member credentials are required to load Trustchains.
         </p>
      )}

      {/* Tooltip component setup needed elsewhere in your app */}
    </div>
  );
}