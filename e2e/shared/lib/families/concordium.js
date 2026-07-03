"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendConcordium = void 0;
exports.getCcdAccountAddress = getCcdAccountAddress;
const DeviceLabels_1 = require("../enum/DeviceLabels");
const runCli_1 = require("../runCli");
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
exports.sendConcordium = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    await (0, speculos_1.getSendEvents)(tx);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
const CCD_TESTNET_WALLET_PROXY_URL = "https://ccd-wallet-proxy-testnet.coin.ledger-test.com";
const CCD_WALLET_PROXY_TIMEOUT_MS = 10_000;
// Concordium addresses are not derived from BIP32 paths — they come from on-chain
// credential deployment. Resolve via wallet-proxy from the device-exported public key.
async function resolveCcdAddressFromPublicKey(publicKey) {
    const res = await fetch(`${CCD_TESTNET_WALLET_PROXY_URL}/v0/keyAccounts/${publicKey}`, {
        signal: AbortSignal.timeout(CCD_WALLET_PROXY_TIMEOUT_MS),
    });
    if (!res.ok) {
        throw new Error(`[CCD] Wallet-proxy error ${res.status} ${res.statusText} for public key ${publicKey.slice(0, 16)}...`);
    }
    const accounts = await res.json();
    if (!accounts?.length) {
        throw new Error(`No on-chain accounts found for public key ${publicKey}`);
    }
    return accounts[0].address;
}
async function getCcdAccountAddress(account) {
    const { publicKey } = await (0, runCli_1.runCliGetAddress)({
        currency: account.currency.speculosApp.name,
        path: account.accountPath,
    });
    return resolveCcdAddressFromPublicKey(publicKey);
}
//# sourceMappingURL=concordium.js.map