import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import Solana from "../src/Solana";

import axios from "axios";

const SPECULOS_APDU_PORT = 9999;
const SPECULOS_REST_API_ENDPOINT = "http://0.0.0.0:5000";

async function runSmokeTest() {
  const speculosTransport = await SpeculosTransport.open({
    apduPort: SPECULOS_APDU_PORT,
  });

  try {
    const solana = new Solana(speculosTransport);

    // app config
    const appConfig = await solana.getAppConfiguration();
    console.log("app config", appConfig);

    // address
    const addressResult = await solana.getAddress("44'/501'/0'/0'/0'");
    console.log("address", {
      address: addressResult.address.toString("hex"),
    });

    // sign transaction
    const txBuffer = Buffer.from(
      "010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030301020200010c020000002a00000000000000",
      "hex"
    );
    const signaturePromise = solana.signTransaction("44'/501'", txBuffer);

    await approveTransaction();

    const signatureResult = await signaturePromise;

    console.log("sign transaction", {
      signature: signatureResult.signature.toString("hex"),
    });
  } finally {
    speculosTransport.close();
  }
}

function approveTransaction() {
  return axios.post(
    `${SPECULOS_REST_API_ENDPOINT}/automation`,
    approveTransactionFlow
  );
}

const approveTransactionFlow = {
  version: 1,
  rules: [
    {
      text: "Transfer",
      //conditions: [["seen", false]],
      actions: [
        ["button", 2, true],
        ["button", 2, false],
        ["button", 2, true],
        ["button", 2, false],
        ["button", 2, true],
        ["button", 2, false],
        ["button", 2, true],
        ["button", 2, false],
        ["button", 1, true],
        ["button", 2, true],
        ["button", 1, false],
        ["button", 2, false],
        //["setbool", "seen", true],
      ],
    },
  ],
};

runSmokeTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
