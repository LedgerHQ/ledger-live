export const ALEO_LOCAL_NODE = "http://127.0.0.1:3030";

export const ALEO_NETWORK_TYPE = "testnet";

export const ALEO_LOCAL_SDK = `http://127.0.0.1:3031/network/${ALEO_NETWORK_TYPE}`;

// Not localhost: MSW passes 127.0.0.1 through, so unhandled node routes would silently hit the devnode.
export const ALEO_FAKE_NODE = "http://aleo-node.test";
