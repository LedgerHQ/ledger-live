global.Buffer = require("buffer").Buffer;
process.browser = true; // for readable-stream/lib/_stream_writable.js

require("ReactFeatureFlags").warnAboutDeprecatedLifecycles = false;
