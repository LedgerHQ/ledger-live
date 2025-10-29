/**
 * Tapable polyfill exports
 * This file must be compatible with both CommonJS and ES6 imports
 */

// Import the setup module which installs the polyfill globally
require('./setup-tapable.js');

// Re-export everything for ES6 named imports
const polyfill = global.TapablePolyfill || {};

// Named exports for ES6
export const Hook = polyfill.Hook;
export const SyncHook = polyfill.SyncHook;
export const SyncBailHook = polyfill.SyncBailHook;
export const SyncWaterfallHook = polyfill.SyncWaterfallHook;
export const AsyncSeriesHook = polyfill.AsyncSeriesHook;
export const AsyncSeriesBailHook = polyfill.AsyncSeriesBailHook;
export const AsyncSeriesWaterfallHook = polyfill.AsyncSeriesWaterfallHook;
export const AsyncParallelHook = polyfill.AsyncParallelHook;
export const AsyncParallelBailHook = polyfill.AsyncParallelBailHook;

// CommonJS default export
module.exports = polyfill;

// ES6 default export
export default polyfill;
