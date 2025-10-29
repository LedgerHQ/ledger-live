/**
 * Wrapper for bip32 to ensure proper named exports for React Native
 * 
 * The bip32 package uses getter-based exports which don't work well in Re.Pack bundles.
 * This wrapper re-exports everything from bip32 with direct property assignments.
 */

// Require the actual bip32 package - this triggers the getter evaluation
const bip32 = require('bip32');

// Get the actual BIP32Factory function by accessing it (triggers the getter)
const actualBIP32Factory = bip32.BIP32Factory;

// Re-export with direct assignments (no getters)
exports.BIP32Factory = actualBIP32Factory;
exports.default = actualBIP32Factory;
exports.__esModule = true;

