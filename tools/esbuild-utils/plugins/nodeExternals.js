const path = require("path");
const filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/; // Must not start with "/" or "./" or "../"

module.exports = {
  name: "Node Externals Plugin",
  setup(build) {
    build.onResolve({ filter }, (args) => {
      // Only externalize true Node.js built-in modules and Electron modules
      // Everything else should be bundled since we removed all native modules
      const electronModules = ['electron'];
      const nodeBuiltins = [
        'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console', 
        'constants', 'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 
        'https', 'module', 'net', 'os', 'path', 'process', 'querystring', 
        'readline', 'repl', 'stream', 'timers', 'tls', 'tty', 'url', 'util', 
        'v8', 'vm', 'worker_threads', 'zlib'
      ];
      
      if (electronModules.includes(args.path) || nodeBuiltins.includes(args.path) || args.path.startsWith('node:')) {
        return {
          path: args.path,
          external: true,
        };
      }
      
      // Bundle everything else (npm modules, workspace modules, etc.)
      return;
    });
  },
};
