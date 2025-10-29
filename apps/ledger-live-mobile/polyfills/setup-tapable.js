/**
 * Setup tapable polyfill globally
 * This must be imported before any Re.Pack code runs
 */

// CRITICAL: Also polyfill TextEncoder/TextDecoder before any other code runs
// Some libraries (like @stricahq/cbors) access these at module evaluation time
if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  try {
    const textEncoding = require('text-encoding-polyfill');
    global.TextEncoder = textEncoding.TextEncoder;
    global.TextDecoder = textEncoding.TextDecoder;
    console.log('[Polyfills] Installed TextEncoder/TextDecoder polyfills for React Native');
  } catch (error) {
    console.warn('[Polyfills] Failed to load text-encoding-polyfill:', error);
  }
}

// Polyfill WebAssembly for @noble libraries
// Hermes doesn't support WebAssembly, so we provide a stub that throws
// This will cause libraries to catch the error and fall back to their JavaScript implementations
if (typeof global.WebAssembly === 'undefined') {
  const wasmNotSupported = () => {
    throw new Error('WebAssembly is not supported in this environment');
  };
  
  global.WebAssembly = {
    compile: wasmNotSupported,
    instantiate: wasmNotSupported,
    validate: () => false,
    Module: function() { throw new Error('WebAssembly.Module is not supported'); },
    Instance: function() { throw new Error('WebAssembly.Instance is not supported'); },
    Memory: function() { throw new Error('WebAssembly.Memory is not supported'); },
    Table: function() { throw new Error('WebAssembly.Table is not supported'); },
    CompileError: Error,
    LinkError: Error,
    RuntimeError: Error,
  };
  console.log('[Polyfills] Installed WebAssembly stub for React Native (throws to trigger JS fallback)');
}

// Define a minimal Hook base class
class Hook {
  constructor(args = []) {
    this._args = args;
    this._taps = [];
    this.interceptors = [];
  }

  tap(options, fn) {
    const tapInfo = this._parseTapOptions(options, fn);
    this._insert(tapInfo);
  }

  tapAsync(options, fn) {
    const tapInfo = this._parseTapOptions(options, fn);
    tapInfo.type = 'async';
    this._insert(tapInfo);
  }

  tapPromise(options, fn) {
    const tapInfo = this._parseTapOptions(options, fn);
    tapInfo.type = 'promise';
    this._insert(tapInfo);
  }

  _parseTapOptions(options, fn) {
    if (typeof options === 'string') {
      return { name: options, fn, type: 'sync' };
    }
    return { ...options, fn, type: options.type || 'sync' };
  }

  _insert(tapInfo) {
    this._taps.push(tapInfo);
  }

  isUsed() {
    return this._taps.length > 0;
  }

  intercept(interceptor) {
    this.interceptors.push(interceptor);
  }

  _callInterceptor(method, ...args) {
    for (const interceptor of this.interceptors) {
      if (interceptor[method]) {
        interceptor[method](...args);
      }
    }
  }
}

class SyncHook extends Hook {
  call(...args) {
    this._callInterceptor('call', ...args);
    for (const tap of this._taps) {
      tap.fn(...args);
    }
  }
}

class SyncBailHook extends Hook {
  call(...args) {
    this._callInterceptor('call', ...args);
    for (const tap of this._taps) {
      const result = tap.fn(...args);
      if (result !== undefined) {
        return result;
      }
    }
  }
}

class SyncWaterfallHook extends Hook {
  call(...args) {
    this._callInterceptor('call', ...args);
    let current = args[0];
    for (const tap of this._taps) {
      current = tap.fn(current, ...args.slice(1));
    }
    return current;
  }
}

class AsyncSeriesHook extends Hook {
  async promise(...args) {
    this._callInterceptor('call', ...args);
    for (const tap of this._taps) {
      if (tap.type === 'promise') {
        await tap.fn(...args);
      } else if (tap.type === 'async') {
        await new Promise((resolve, reject) => {
          tap.fn(...args, (err) => (err ? reject(err) : resolve()));
        });
      } else {
        tap.fn(...args);
      }
    }
  }

  tapPromise(options, fn) {
    super.tapPromise(options, fn);
    return () => {
      const tapInfo = this._taps.find(
        t => t.name === (typeof options === 'string' ? options : options.name)
      );
      if (tapInfo) {
        this._taps = this._taps.filter(t => t !== tapInfo);
      }
    };
  }
}

class AsyncSeriesBailHook extends Hook {
  async promise(...args) {
    this._callInterceptor('call', ...args);
    for (const tap of this._taps) {
      let result;
      if (tap.type === 'promise') {
        result = await tap.fn(...args);
      } else if (tap.type === 'async') {
        result = await new Promise((resolve, reject) => {
          tap.fn(...args, (err, res) => (err ? reject(err) : resolve(res)));
        });
      } else {
        result = tap.fn(...args);
      }
      if (result !== undefined) {
        return result;
      }
    }
  }

  tapPromise(options, fn) {
    super.tapPromise(options, fn);
    return () => {
      const tapInfo = this._taps.find(
        t => t.name === (typeof options === 'string' ? options : options.name)
      );
      if (tapInfo) {
        this._taps = this._taps.filter(t => t !== tapInfo);
      }
    };
  }
}

class AsyncSeriesWaterfallHook extends Hook {
  async promise(...args) {
    this._callInterceptor('call', ...args);
    let current = args[0];
    for (const tap of this._taps) {
      if (tap.type === 'promise') {
        current = await tap.fn(current, ...args.slice(1));
      } else if (tap.type === 'async') {
        current = await new Promise((resolve, reject) => {
          tap.fn(current, ...args.slice(1), (err, res) =>
            err ? reject(err) : resolve(res)
          );
        });
      } else {
        current = tap.fn(current, ...args.slice(1));
      }
    }
    return current;
  }

  tapPromise(options, fn) {
    super.tapPromise(options, fn);
    return () => {
      const tapInfo = this._taps.find(
        t => t.name === (typeof options === 'string' ? options : options.name)
      );
      if (tapInfo) {
        this._taps = this._taps.filter(t => t !== tapInfo);
      }
    };
  }
}

class AsyncParallelHook extends Hook {
  async promise(...args) {
    this._callInterceptor('call', ...args);
    const promises = this._taps.map(tap => {
      if (tap.type === 'promise') {
        return tap.fn(...args);
      } else if (tap.type === 'async') {
        return new Promise((resolve, reject) => {
          tap.fn(...args, err => (err ? reject(err) : resolve()));
        });
      } else {
        return Promise.resolve(tap.fn(...args));
      }
    });
    await Promise.all(promises);
  }

  tapPromise(options, fn) {
    super.tapPromise(options, fn);
    return () => {
      const tapInfo = this._taps.find(
        t => t.name === (typeof options === 'string' ? options : options.name)
      );
      if (tapInfo) {
        this._taps = this._taps.filter(t => t !== tapInfo);
      }
    };
  }
}

class AsyncParallelBailHook extends Hook {
  async promise(...args) {
    this._callInterceptor('call', ...args);
    const promises = this._taps.map(tap => {
      if (tap.type === 'promise') {
        return tap.fn(...args);
      } else if (tap.type === 'async') {
        return new Promise((resolve, reject) => {
          tap.fn(...args, (err, res) => (err ? reject(err) : resolve(res)));
        });
      } else {
        return Promise.resolve(tap.fn(...args));
      }
    });
    const results = await Promise.all(promises);
    for (const result of results) {
      if (result !== undefined) {
        return result;
      }
    }
  }

  tapPromise(options, fn) {
    super.tapPromise(options, fn);
    return () => {
      const tapInfo = this._taps.find(
        t => t.name === (typeof options === 'string' ? options : options.name)
      );
      if (tapInfo) {
        this._taps = this._taps.filter(t => t !== tapInfo);
      }
    };
  }
}

// Install the polyfill globally
if (typeof global !== 'undefined') {
  global.TapablePolyfill = {
    Hook,
    SyncHook,
    SyncBailHook,
    SyncWaterfallHook,
    AsyncSeriesHook,
    AsyncSeriesBailHook,
    AsyncSeriesWaterfallHook,
    AsyncParallelHook,
    AsyncParallelBailHook,
  };
  
  console.log('[Tapable Polyfill] Installed tapable polyfill for React Native');
}

// Also export for CommonJS compatibility
module.exports = {
  Hook,
  SyncHook,
  SyncBailHook,
  SyncWaterfallHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
  AsyncParallelHook,
  AsyncParallelBailHook,
};
