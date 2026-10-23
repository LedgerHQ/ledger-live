import { useState } from "react";

/** What the Networks tab, and the network of the Write tab, hold. */
export interface NetworkFormViewModel {
  readonly network: string;
  readonly setNetwork: (value: string) => void;
  readonly address: string;
  readonly setAddress: (value: string) => void;
  readonly cursor: string;
  readonly setCursor: (value: string) => void;
  /** A chain is named, so its last block and validators can be asked for. */
  readonly canQueryNetwork: boolean;
  /** A chain and an address are named, so the address can be checked or its sequence read. */
  readonly canQueryAddress: boolean;
  /** The request fields of the calls on a chain. */
  readonly networkFields: {
    readonly network: string;
    readonly address: string;
    readonly cursor: string;
  };
}

export function useNetworkForm(): NetworkFormViewModel {
  const [network, setNetwork] = useState("ethereum");
  const [address, setAddress] = useState("");
  const [cursor, setCursor] = useState("");

  const named = network.trim() !== "";
  return {
    network,
    setNetwork,
    address,
    setAddress,
    cursor,
    setCursor,
    canQueryNetwork: named,
    canQueryAddress: named && address.trim() !== "",
    networkFields: { network: network.trim(), address: address.trim(), cursor: cursor.trim() },
  };
}
