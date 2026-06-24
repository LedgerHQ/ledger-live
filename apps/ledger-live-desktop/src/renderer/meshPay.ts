export const API_KEY =
  "sk_sand_cl3d2hmz.upjwjscl4c2hwid82p63jy46rbk3rtub53k4cu8smpnph8njbyw6pa1xa9mkeru7";
export const CLIENT_ID = "15b8f948-1baf-4afa-41d7-08dec305ca4b";
export const LINK_TOKEN_URL = "https://sandbox-integration-api.meshconnect.com/api/v1/linktoken";

type MeshLinkTokenResponse = {
  content?: {
    linkToken?: string;
  };
  linkToken?: string;
};

export async function fetchMeshPayLinkToken() {
  if (!CLIENT_ID || !API_KEY) {
    throw new Error("MESH_PAY_CLIENT_ID and MESH_PAY_API_KEY must be configured");
  }

  const response = await fetch(LINK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": CLIENT_ID,
      "X-Client-Secret": API_KEY,
    },
    body: JSON.stringify({
      userId: "ledger-live-desktop-sandbox-user",
      restrictMultipleAccounts: true,
      transferOptions: {
        transferType: "deposit",
        toAddresses: [
          {
            networkId: "e3c7fdd8-b1fc-4e51-85ae-bb276e075611",
            symbol: "ETH",
            address: "0x0000000000000000000000000000000000000000",
          },
        ],
      },
    }),
  });

  console.log("[MESH LINK response]", response);
  if (!response.ok) {
    const errorPayload = await response.text();
    console.error("[MESH LINK token error payload]", errorPayload);
    throw new Error(`Mesh link token request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as MeshLinkTokenResponse;
  const linkToken = payload.content?.linkToken ?? payload.linkToken;

  if (!linkToken) {
    throw new Error("Mesh link token response did not include a linkToken");
  }

  return linkToken;
}
