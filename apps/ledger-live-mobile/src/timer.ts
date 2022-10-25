const timer = __DEV__
  ? {
      timeout: (fn: (..._: Array<any>) => any, ms: number) => {
        // hack for a bug in RN https://github.com/facebook/react-native/issues/9030
        const startTime = Date.now();
        const interval = setInterval(() => {
          if (Date.now() - startTime >= ms) {
            clearInterval(interval);
            fn();
          }
        }, 100);
        return () => {
          clearInterval(interval);
        };
      },
    }
  : {
      timeout: (fn: (..._: Array<any>) => any, ms: number) => {
        const timeout = setTimeout(fn, ms);
        return () => clearTimeout(timeout);
      },
    };
export default timer;
