"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/utils.js
var require_utils = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toCommandProperties = exports.toCommandValue = void 0;
    function toCommandValue(input) {
      if (input === null || input === void 0) {
        return "";
      } else if (typeof input === "string" || input instanceof String) {
        return input;
      }
      return JSON.stringify(input);
    }
    exports.toCommandValue = toCommandValue;
    function toCommandProperties(annotationProperties) {
      if (!Object.keys(annotationProperties).length) {
        return {};
      }
      return {
        title: annotationProperties.title,
        file: annotationProperties.file,
        line: annotationProperties.startLine,
        endLine: annotationProperties.endLine,
        col: annotationProperties.startColumn,
        endColumn: annotationProperties.endColumn
      };
    }
    exports.toCommandProperties = toCommandProperties;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/command.js
var require_command = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/command.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.issue = exports.issueCommand = void 0;
    var os = __importStar(require("os"));
    var utils_1 = require_utils();
    function issueCommand(command, properties, message) {
      const cmd = new Command(command, properties, message);
      process.stdout.write(cmd.toString() + os.EOL);
    }
    exports.issueCommand = issueCommand;
    function issue(name, message = "") {
      issueCommand(name, {}, message);
    }
    exports.issue = issue;
    var CMD_STRING = "::";
    var Command = class {
      constructor(command, properties, message) {
        if (!command) {
          command = "missing.command";
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
      }
      toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
          cmdStr += " ";
          let first = true;
          for (const key in this.properties) {
            if (this.properties.hasOwnProperty(key)) {
              const val = this.properties[key];
              if (val) {
                if (first) {
                  first = false;
                } else {
                  cmdStr += ",";
                }
                cmdStr += `${key}=${escapeProperty(val)}`;
              }
            }
          }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
      }
    };
    function escapeData(s) {
      return utils_1.toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
    }
    function escapeProperty(s) {
      return utils_1.toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
    }
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/rng.js
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    import_crypto.default.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
var import_crypto, rnds8Pool, poolPtr;
var init_rng = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/rng.js"() {
    "use strict";
    import_crypto = __toESM(require("crypto"));
    rnds8Pool = new Uint8Array(256);
    poolPtr = rnds8Pool.length;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/regex.js
var regex_default;
var init_regex = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/regex.js"() {
    "use strict";
    regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/validate.js
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
var validate_default;
var init_validate = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/validate.js"() {
    "use strict";
    init_regex();
    validate_default = validate;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/stringify.js
function stringify(arr, offset = 0) {
  const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  if (!validate_default(uuid)) {
    throw TypeError("Stringified UUID is invalid");
  }
  return uuid;
}
var byteToHex, stringify_default;
var init_stringify = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/stringify.js"() {
    "use strict";
    init_validate();
    byteToHex = [];
    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 256).toString(16).substr(1));
    }
    stringify_default = stringify;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v1.js
function v1(options, buf, offset) {
  let i = buf && offset || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || rng)();
    if (node == null) {
      node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }
    if (clockseq == null) {
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
    }
  }
  let msecs = options.msecs !== void 0 ? options.msecs : Date.now();
  let nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
  if (dt < 0 && options.clockseq === void 0) {
    clockseq = clockseq + 1 & 16383;
  }
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
    nsecs = 0;
  }
  if (nsecs >= 1e4) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }
  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;
  msecs += 122192928e5;
  const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
  b[i++] = tl >>> 24 & 255;
  b[i++] = tl >>> 16 & 255;
  b[i++] = tl >>> 8 & 255;
  b[i++] = tl & 255;
  const tmh = msecs / 4294967296 * 1e4 & 268435455;
  b[i++] = tmh >>> 8 & 255;
  b[i++] = tmh & 255;
  b[i++] = tmh >>> 24 & 15 | 16;
  b[i++] = tmh >>> 16 & 255;
  b[i++] = clockseq >>> 8 | 128;
  b[i++] = clockseq & 255;
  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }
  return buf || stringify_default(b);
}
var _nodeId, _clockseq, _lastMSecs, _lastNSecs, v1_default;
var init_v1 = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v1.js"() {
    "use strict";
    init_rng();
    init_stringify();
    _lastMSecs = 0;
    _lastNSecs = 0;
    v1_default = v1;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/parse.js
function parse(uuid) {
  if (!validate_default(uuid)) {
    throw TypeError("Invalid UUID");
  }
  let v;
  const arr = new Uint8Array(16);
  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 255;
  arr[2] = v >>> 8 & 255;
  arr[3] = v & 255;
  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 255;
  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 255;
  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 255;
  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
  arr[11] = v / 4294967296 & 255;
  arr[12] = v >>> 24 & 255;
  arr[13] = v >>> 16 & 255;
  arr[14] = v >>> 8 & 255;
  arr[15] = v & 255;
  return arr;
}
var parse_default;
var init_parse = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/parse.js"() {
    "use strict";
    init_validate();
    parse_default = parse;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v35.js
function stringToBytes(str) {
  str = unescape(encodeURIComponent(str));
  const bytes = [];
  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}
function v35_default(name, version2, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    if (typeof value === "string") {
      value = stringToBytes(value);
    }
    if (typeof namespace === "string") {
      namespace = parse_default(namespace);
    }
    if (namespace.length !== 16) {
      throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
    }
    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 15 | version2;
    bytes[8] = bytes[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }
      return buf;
    }
    return stringify_default(bytes);
  }
  try {
    generateUUID.name = name;
  } catch (err) {
  }
  generateUUID.DNS = DNS;
  generateUUID.URL = URL2;
  return generateUUID;
}
var DNS, URL2;
var init_v35 = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v35.js"() {
    "use strict";
    init_stringify();
    init_parse();
    DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    URL2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/md5.js
function md5(bytes) {
  if (Array.isArray(bytes)) {
    bytes = Buffer.from(bytes);
  } else if (typeof bytes === "string") {
    bytes = Buffer.from(bytes, "utf8");
  }
  return import_crypto2.default.createHash("md5").update(bytes).digest();
}
var import_crypto2, md5_default;
var init_md5 = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/md5.js"() {
    "use strict";
    import_crypto2 = __toESM(require("crypto"));
    md5_default = md5;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v3.js
var v3, v3_default;
var init_v3 = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v3.js"() {
    "use strict";
    init_v35();
    init_md5();
    v3 = v35_default("v3", 48, md5_default);
    v3_default = v3;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v4.js
function v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return stringify_default(rnds);
}
var v4_default;
var init_v4 = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v4.js"() {
    "use strict";
    init_rng();
    init_stringify();
    v4_default = v4;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/sha1.js
function sha1(bytes) {
  if (Array.isArray(bytes)) {
    bytes = Buffer.from(bytes);
  } else if (typeof bytes === "string") {
    bytes = Buffer.from(bytes, "utf8");
  }
  return import_crypto3.default.createHash("sha1").update(bytes).digest();
}
var import_crypto3, sha1_default;
var init_sha1 = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/sha1.js"() {
    "use strict";
    import_crypto3 = __toESM(require("crypto"));
    sha1_default = sha1;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v5.js
var v5, v5_default;
var init_v5 = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v5.js"() {
    "use strict";
    init_v35();
    init_sha1();
    v5 = v35_default("v5", 80, sha1_default);
    v5_default = v5;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/nil.js
var nil_default;
var init_nil = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/nil.js"() {
    "use strict";
    nil_default = "00000000-0000-0000-0000-000000000000";
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/version.js
function version(uuid) {
  if (!validate_default(uuid)) {
    throw TypeError("Invalid UUID");
  }
  return parseInt(uuid.substr(14, 1), 16);
}
var version_default;
var init_version = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/version.js"() {
    "use strict";
    init_validate();
    version_default = version;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/index.js
var esm_node_exports = {};
__export(esm_node_exports, {
  NIL: () => nil_default,
  parse: () => parse_default,
  stringify: () => stringify_default,
  v1: () => v1_default,
  v3: () => v3_default,
  v4: () => v4_default,
  v5: () => v5_default,
  validate: () => validate_default,
  version: () => version_default
});
var init_esm_node = __esm({
  "../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/index.js"() {
    "use strict";
    init_v1();
    init_v3();
    init_v4();
    init_v5();
    init_nil();
    init_version();
    init_validate();
    init_stringify();
    init_parse();
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/file-command.js
var require_file_command = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/file-command.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prepareKeyValueMessage = exports.issueFileCommand = void 0;
    var fs2 = __importStar(require("fs"));
    var os = __importStar(require("os"));
    var uuid_1 = (init_esm_node(), __toCommonJS(esm_node_exports));
    var utils_1 = require_utils();
    function issueFileCommand(command, message) {
      const filePath = process.env[`GITHUB_${command}`];
      if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
      }
      if (!fs2.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
      }
      fs2.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: "utf8"
      });
    }
    exports.issueFileCommand = issueFileCommand;
    function prepareKeyValueMessage(key, value) {
      const delimiter = `ghadelimiter_${uuid_1.v4()}`;
      const convertedValue = utils_1.toCommandValue(value);
      if (key.includes(delimiter)) {
        throw new Error(`Unexpected input: name should not contain the delimiter "${delimiter}"`);
      }
      if (convertedValue.includes(delimiter)) {
        throw new Error(`Unexpected input: value should not contain the delimiter "${delimiter}"`);
      }
      return `${key}<<${delimiter}${os.EOL}${convertedValue}${os.EOL}${delimiter}`;
    }
    exports.prepareKeyValueMessage = prepareKeyValueMessage;
  }
});

// ../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/proxy.js
var require_proxy = __commonJS({
  "../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/proxy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkBypass = exports.getProxyUrl = void 0;
    function getProxyUrl(reqUrl) {
      const usingSsl = reqUrl.protocol === "https:";
      if (checkBypass(reqUrl)) {
        return void 0;
      }
      const proxyVar = (() => {
        if (usingSsl) {
          return process.env["https_proxy"] || process.env["HTTPS_PROXY"];
        } else {
          return process.env["http_proxy"] || process.env["HTTP_PROXY"];
        }
      })();
      if (proxyVar) {
        return new URL(proxyVar);
      } else {
        return void 0;
      }
    }
    exports.getProxyUrl = getProxyUrl;
    function checkBypass(reqUrl) {
      if (!reqUrl.hostname) {
        return false;
      }
      const noProxy = process.env["no_proxy"] || process.env["NO_PROXY"] || "";
      if (!noProxy) {
        return false;
      }
      let reqPort;
      if (reqUrl.port) {
        reqPort = Number(reqUrl.port);
      } else if (reqUrl.protocol === "http:") {
        reqPort = 80;
      } else if (reqUrl.protocol === "https:") {
        reqPort = 443;
      }
      const upperReqHosts = [reqUrl.hostname.toUpperCase()];
      if (typeof reqPort === "number") {
        upperReqHosts.push(`${upperReqHosts[0]}:${reqPort}`);
      }
      for (const upperNoProxyItem of noProxy.split(",").map((x) => x.trim().toUpperCase()).filter((x) => x)) {
        if (upperReqHosts.some((x) => x === upperNoProxyItem)) {
          return true;
        }
      }
      return false;
    }
    exports.checkBypass = checkBypass;
  }
});

// ../../../node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/lib/tunnel.js
var require_tunnel = __commonJS({
  "../../../node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/lib/tunnel.js"(exports) {
    "use strict";
    var net = require("net");
    var tls = require("tls");
    var http = require("http");
    var https = require("https");
    var events = require("events");
    var assert = require("assert");
    var util = require("util");
    exports.httpOverHttp = httpOverHttp;
    exports.httpsOverHttp = httpsOverHttp;
    exports.httpOverHttps = httpOverHttps;
    exports.httpsOverHttps = httpsOverHttps;
    function httpOverHttp(options) {
      var agent = new TunnelingAgent(options);
      agent.request = http.request;
      return agent;
    }
    function httpsOverHttp(options) {
      var agent = new TunnelingAgent(options);
      agent.request = http.request;
      agent.createSocket = createSecureSocket;
      agent.defaultPort = 443;
      return agent;
    }
    function httpOverHttps(options) {
      var agent = new TunnelingAgent(options);
      agent.request = https.request;
      return agent;
    }
    function httpsOverHttps(options) {
      var agent = new TunnelingAgent(options);
      agent.request = https.request;
      agent.createSocket = createSecureSocket;
      agent.defaultPort = 443;
      return agent;
    }
    function TunnelingAgent(options) {
      var self = this;
      self.options = options || {};
      self.proxyOptions = self.options.proxy || {};
      self.maxSockets = self.options.maxSockets || http.Agent.defaultMaxSockets;
      self.requests = [];
      self.sockets = [];
      self.on("free", function onFree(socket, host, port, localAddress) {
        var options2 = toOptions(host, port, localAddress);
        for (var i = 0, len = self.requests.length; i < len; ++i) {
          var pending = self.requests[i];
          if (pending.host === options2.host && pending.port === options2.port) {
            self.requests.splice(i, 1);
            pending.request.onSocket(socket);
            return;
          }
        }
        socket.destroy();
        self.removeSocket(socket);
      });
    }
    util.inherits(TunnelingAgent, events.EventEmitter);
    TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
      var self = this;
      var options = mergeOptions({ request: req }, self.options, toOptions(host, port, localAddress));
      if (self.sockets.length >= this.maxSockets) {
        self.requests.push(options);
        return;
      }
      self.createSocket(options, function(socket) {
        socket.on("free", onFree);
        socket.on("close", onCloseOrRemove);
        socket.on("agentRemove", onCloseOrRemove);
        req.onSocket(socket);
        function onFree() {
          self.emit("free", socket, options);
        }
        function onCloseOrRemove(err) {
          self.removeSocket(socket);
          socket.removeListener("free", onFree);
          socket.removeListener("close", onCloseOrRemove);
          socket.removeListener("agentRemove", onCloseOrRemove);
        }
      });
    };
    TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
      var self = this;
      var placeholder = {};
      self.sockets.push(placeholder);
      var connectOptions = mergeOptions({}, self.proxyOptions, {
        method: "CONNECT",
        path: options.host + ":" + options.port,
        agent: false,
        headers: {
          host: options.host + ":" + options.port
        }
      });
      if (options.localAddress) {
        connectOptions.localAddress = options.localAddress;
      }
      if (connectOptions.proxyAuth) {
        connectOptions.headers = connectOptions.headers || {};
        connectOptions.headers["Proxy-Authorization"] = "Basic " + new Buffer(connectOptions.proxyAuth).toString("base64");
      }
      debug("making CONNECT request");
      var connectReq = self.request(connectOptions);
      connectReq.useChunkedEncodingByDefault = false;
      connectReq.once("response", onResponse);
      connectReq.once("upgrade", onUpgrade);
      connectReq.once("connect", onConnect);
      connectReq.once("error", onError);
      connectReq.end();
      function onResponse(res) {
        res.upgrade = true;
      }
      function onUpgrade(res, socket, head) {
        process.nextTick(function() {
          onConnect(res, socket, head);
        });
      }
      function onConnect(res, socket, head) {
        connectReq.removeAllListeners();
        socket.removeAllListeners();
        if (res.statusCode !== 200) {
          debug(
            "tunneling socket could not be established, statusCode=%d",
            res.statusCode
          );
          socket.destroy();
          var error = new Error("tunneling socket could not be established, statusCode=" + res.statusCode);
          error.code = "ECONNRESET";
          options.request.emit("error", error);
          self.removeSocket(placeholder);
          return;
        }
        if (head.length > 0) {
          debug("got illegal response body from proxy");
          socket.destroy();
          var error = new Error("got illegal response body from proxy");
          error.code = "ECONNRESET";
          options.request.emit("error", error);
          self.removeSocket(placeholder);
          return;
        }
        debug("tunneling connection has established");
        self.sockets[self.sockets.indexOf(placeholder)] = socket;
        return cb(socket);
      }
      function onError(cause) {
        connectReq.removeAllListeners();
        debug(
          "tunneling socket could not be established, cause=%s\n",
          cause.message,
          cause.stack
        );
        var error = new Error("tunneling socket could not be established, cause=" + cause.message);
        error.code = "ECONNRESET";
        options.request.emit("error", error);
        self.removeSocket(placeholder);
      }
    };
    TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
      var pos = this.sockets.indexOf(socket);
      if (pos === -1) {
        return;
      }
      this.sockets.splice(pos, 1);
      var pending = this.requests.shift();
      if (pending) {
        this.createSocket(pending, function(socket2) {
          pending.request.onSocket(socket2);
        });
      }
    };
    function createSecureSocket(options, cb) {
      var self = this;
      TunnelingAgent.prototype.createSocket.call(self, options, function(socket) {
        var hostHeader = options.request.getHeader("host");
        var tlsOptions = mergeOptions({}, self.options, {
          socket,
          servername: hostHeader ? hostHeader.replace(/:.*$/, "") : options.host
        });
        var secureSocket = tls.connect(0, tlsOptions);
        self.sockets[self.sockets.indexOf(socket)] = secureSocket;
        cb(secureSocket);
      });
    }
    function toOptions(host, port, localAddress) {
      if (typeof host === "string") {
        return {
          host,
          port,
          localAddress
        };
      }
      return host;
    }
    function mergeOptions(target) {
      for (var i = 1, len = arguments.length; i < len; ++i) {
        var overrides = arguments[i];
        if (typeof overrides === "object") {
          var keys = Object.keys(overrides);
          for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
            var k = keys[j];
            if (overrides[k] !== void 0) {
              target[k] = overrides[k];
            }
          }
        }
      }
      return target;
    }
    var debug;
    if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
      debug = function() {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] === "string") {
          args[0] = "TUNNEL: " + args[0];
        } else {
          args.unshift("TUNNEL:");
        }
        console.error.apply(console, args);
      };
    } else {
      debug = function() {
      };
    }
    exports.debug = debug;
  }
});

// ../../../node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/index.js
var require_tunnel2 = __commonJS({
  "../../../node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/index.js"(exports, module2) {
    "use strict";
    module2.exports = require_tunnel();
  }
});

// ../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/index.js
var require_lib = __commonJS({
  "../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HttpClient = exports.isHttps = exports.HttpClientResponse = exports.HttpClientError = exports.getProxyUrl = exports.MediaTypes = exports.Headers = exports.HttpCodes = void 0;
    var http = __importStar(require("http"));
    var https = __importStar(require("https"));
    var pm = __importStar(require_proxy());
    var tunnel = __importStar(require_tunnel2());
    var HttpCodes;
    (function(HttpCodes2) {
      HttpCodes2[HttpCodes2["OK"] = 200] = "OK";
      HttpCodes2[HttpCodes2["MultipleChoices"] = 300] = "MultipleChoices";
      HttpCodes2[HttpCodes2["MovedPermanently"] = 301] = "MovedPermanently";
      HttpCodes2[HttpCodes2["ResourceMoved"] = 302] = "ResourceMoved";
      HttpCodes2[HttpCodes2["SeeOther"] = 303] = "SeeOther";
      HttpCodes2[HttpCodes2["NotModified"] = 304] = "NotModified";
      HttpCodes2[HttpCodes2["UseProxy"] = 305] = "UseProxy";
      HttpCodes2[HttpCodes2["SwitchProxy"] = 306] = "SwitchProxy";
      HttpCodes2[HttpCodes2["TemporaryRedirect"] = 307] = "TemporaryRedirect";
      HttpCodes2[HttpCodes2["PermanentRedirect"] = 308] = "PermanentRedirect";
      HttpCodes2[HttpCodes2["BadRequest"] = 400] = "BadRequest";
      HttpCodes2[HttpCodes2["Unauthorized"] = 401] = "Unauthorized";
      HttpCodes2[HttpCodes2["PaymentRequired"] = 402] = "PaymentRequired";
      HttpCodes2[HttpCodes2["Forbidden"] = 403] = "Forbidden";
      HttpCodes2[HttpCodes2["NotFound"] = 404] = "NotFound";
      HttpCodes2[HttpCodes2["MethodNotAllowed"] = 405] = "MethodNotAllowed";
      HttpCodes2[HttpCodes2["NotAcceptable"] = 406] = "NotAcceptable";
      HttpCodes2[HttpCodes2["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
      HttpCodes2[HttpCodes2["RequestTimeout"] = 408] = "RequestTimeout";
      HttpCodes2[HttpCodes2["Conflict"] = 409] = "Conflict";
      HttpCodes2[HttpCodes2["Gone"] = 410] = "Gone";
      HttpCodes2[HttpCodes2["TooManyRequests"] = 429] = "TooManyRequests";
      HttpCodes2[HttpCodes2["InternalServerError"] = 500] = "InternalServerError";
      HttpCodes2[HttpCodes2["NotImplemented"] = 501] = "NotImplemented";
      HttpCodes2[HttpCodes2["BadGateway"] = 502] = "BadGateway";
      HttpCodes2[HttpCodes2["ServiceUnavailable"] = 503] = "ServiceUnavailable";
      HttpCodes2[HttpCodes2["GatewayTimeout"] = 504] = "GatewayTimeout";
    })(HttpCodes = exports.HttpCodes || (exports.HttpCodes = {}));
    var Headers;
    (function(Headers2) {
      Headers2["Accept"] = "accept";
      Headers2["ContentType"] = "content-type";
    })(Headers = exports.Headers || (exports.Headers = {}));
    var MediaTypes;
    (function(MediaTypes2) {
      MediaTypes2["ApplicationJson"] = "application/json";
    })(MediaTypes = exports.MediaTypes || (exports.MediaTypes = {}));
    function getProxyUrl(serverUrl) {
      const proxyUrl = pm.getProxyUrl(new URL(serverUrl));
      return proxyUrl ? proxyUrl.href : "";
    }
    exports.getProxyUrl = getProxyUrl;
    var HttpRedirectCodes = [
      HttpCodes.MovedPermanently,
      HttpCodes.ResourceMoved,
      HttpCodes.SeeOther,
      HttpCodes.TemporaryRedirect,
      HttpCodes.PermanentRedirect
    ];
    var HttpResponseRetryCodes = [
      HttpCodes.BadGateway,
      HttpCodes.ServiceUnavailable,
      HttpCodes.GatewayTimeout
    ];
    var RetryableHttpVerbs = ["OPTIONS", "GET", "DELETE", "HEAD"];
    var ExponentialBackoffCeiling = 10;
    var ExponentialBackoffTimeSlice = 5;
    var HttpClientError = class _HttpClientError extends Error {
      constructor(message, statusCode) {
        super(message);
        this.name = "HttpClientError";
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, _HttpClientError.prototype);
      }
    };
    exports.HttpClientError = HttpClientError;
    var HttpClientResponse = class {
      constructor(message) {
        this.message = message;
      }
      readBody() {
        return __awaiter(this, void 0, void 0, function* () {
          return new Promise((resolve2) => __awaiter(this, void 0, void 0, function* () {
            let output = Buffer.alloc(0);
            this.message.on("data", (chunk) => {
              output = Buffer.concat([output, chunk]);
            });
            this.message.on("end", () => {
              resolve2(output.toString());
            });
          }));
        });
      }
    };
    exports.HttpClientResponse = HttpClientResponse;
    function isHttps(requestUrl) {
      const parsedUrl = new URL(requestUrl);
      return parsedUrl.protocol === "https:";
    }
    exports.isHttps = isHttps;
    var HttpClient = class {
      constructor(userAgent, handlers, requestOptions) {
        this._ignoreSslError = false;
        this._allowRedirects = true;
        this._allowRedirectDowngrade = false;
        this._maxRedirects = 50;
        this._allowRetries = false;
        this._maxRetries = 1;
        this._keepAlive = false;
        this._disposed = false;
        this.userAgent = userAgent;
        this.handlers = handlers || [];
        this.requestOptions = requestOptions;
        if (requestOptions) {
          if (requestOptions.ignoreSslError != null) {
            this._ignoreSslError = requestOptions.ignoreSslError;
          }
          this._socketTimeout = requestOptions.socketTimeout;
          if (requestOptions.allowRedirects != null) {
            this._allowRedirects = requestOptions.allowRedirects;
          }
          if (requestOptions.allowRedirectDowngrade != null) {
            this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade;
          }
          if (requestOptions.maxRedirects != null) {
            this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
          }
          if (requestOptions.keepAlive != null) {
            this._keepAlive = requestOptions.keepAlive;
          }
          if (requestOptions.allowRetries != null) {
            this._allowRetries = requestOptions.allowRetries;
          }
          if (requestOptions.maxRetries != null) {
            this._maxRetries = requestOptions.maxRetries;
          }
        }
      }
      options(requestUrl, additionalHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.request("OPTIONS", requestUrl, null, additionalHeaders || {});
        });
      }
      get(requestUrl, additionalHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.request("GET", requestUrl, null, additionalHeaders || {});
        });
      }
      del(requestUrl, additionalHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.request("DELETE", requestUrl, null, additionalHeaders || {});
        });
      }
      post(requestUrl, data, additionalHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.request("POST", requestUrl, data, additionalHeaders || {});
        });
      }
      patch(requestUrl, data, additionalHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.request("PATCH", requestUrl, data, additionalHeaders || {});
        });
      }
      put(requestUrl, data, additionalHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.request("PUT", requestUrl, data, additionalHeaders || {});
        });
      }
      head(requestUrl, additionalHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.request("HEAD", requestUrl, null, additionalHeaders || {});
        });
      }
      sendStream(verb, requestUrl, stream, additionalHeaders) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.request(verb, requestUrl, stream, additionalHeaders);
        });
      }
      /**
       * Gets a typed object from an endpoint
       * Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
       */
      getJson(requestUrl, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
          const res = yield this.get(requestUrl, additionalHeaders);
          return this._processResponse(res, this.requestOptions);
        });
      }
      postJson(requestUrl, obj, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const data = JSON.stringify(obj, null, 2);
          additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
          additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
          const res = yield this.post(requestUrl, data, additionalHeaders);
          return this._processResponse(res, this.requestOptions);
        });
      }
      putJson(requestUrl, obj, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const data = JSON.stringify(obj, null, 2);
          additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
          additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
          const res = yield this.put(requestUrl, data, additionalHeaders);
          return this._processResponse(res, this.requestOptions);
        });
      }
      patchJson(requestUrl, obj, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const data = JSON.stringify(obj, null, 2);
          additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
          additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
          const res = yield this.patch(requestUrl, data, additionalHeaders);
          return this._processResponse(res, this.requestOptions);
        });
      }
      /**
       * Makes a raw http request.
       * All other methods such as get, post, patch, and request ultimately call this.
       * Prefer get, del, post and patch
       */
      request(verb, requestUrl, data, headers) {
        return __awaiter(this, void 0, void 0, function* () {
          if (this._disposed) {
            throw new Error("Client has already been disposed.");
          }
          const parsedUrl = new URL(requestUrl);
          let info = this._prepareRequest(verb, parsedUrl, headers);
          const maxTries = this._allowRetries && RetryableHttpVerbs.includes(verb) ? this._maxRetries + 1 : 1;
          let numTries = 0;
          let response;
          do {
            response = yield this.requestRaw(info, data);
            if (response && response.message && response.message.statusCode === HttpCodes.Unauthorized) {
              let authenticationHandler;
              for (const handler of this.handlers) {
                if (handler.canHandleAuthentication(response)) {
                  authenticationHandler = handler;
                  break;
                }
              }
              if (authenticationHandler) {
                return authenticationHandler.handleAuthentication(this, info, data);
              } else {
                return response;
              }
            }
            let redirectsRemaining = this._maxRedirects;
            while (response.message.statusCode && HttpRedirectCodes.includes(response.message.statusCode) && this._allowRedirects && redirectsRemaining > 0) {
              const redirectUrl = response.message.headers["location"];
              if (!redirectUrl) {
                break;
              }
              const parsedRedirectUrl = new URL(redirectUrl);
              if (parsedUrl.protocol === "https:" && parsedUrl.protocol !== parsedRedirectUrl.protocol && !this._allowRedirectDowngrade) {
                throw new Error("Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.");
              }
              yield response.readBody();
              if (parsedRedirectUrl.hostname !== parsedUrl.hostname) {
                for (const header in headers) {
                  if (header.toLowerCase() === "authorization") {
                    delete headers[header];
                  }
                }
              }
              info = this._prepareRequest(verb, parsedRedirectUrl, headers);
              response = yield this.requestRaw(info, data);
              redirectsRemaining--;
            }
            if (!response.message.statusCode || !HttpResponseRetryCodes.includes(response.message.statusCode)) {
              return response;
            }
            numTries += 1;
            if (numTries < maxTries) {
              yield response.readBody();
              yield this._performExponentialBackoff(numTries);
            }
          } while (numTries < maxTries);
          return response;
        });
      }
      /**
       * Needs to be called if keepAlive is set to true in request options.
       */
      dispose() {
        if (this._agent) {
          this._agent.destroy();
        }
        this._disposed = true;
      }
      /**
       * Raw request.
       * @param info
       * @param data
       */
      requestRaw(info, data) {
        return __awaiter(this, void 0, void 0, function* () {
          return new Promise((resolve2, reject) => {
            function callbackForResult(err, res) {
              if (err) {
                reject(err);
              } else if (!res) {
                reject(new Error("Unknown error"));
              } else {
                resolve2(res);
              }
            }
            this.requestRawWithCallback(info, data, callbackForResult);
          });
        });
      }
      /**
       * Raw request with callback.
       * @param info
       * @param data
       * @param onResult
       */
      requestRawWithCallback(info, data, onResult) {
        if (typeof data === "string") {
          if (!info.options.headers) {
            info.options.headers = {};
          }
          info.options.headers["Content-Length"] = Buffer.byteLength(data, "utf8");
        }
        let callbackCalled = false;
        function handleResult(err, res) {
          if (!callbackCalled) {
            callbackCalled = true;
            onResult(err, res);
          }
        }
        const req = info.httpModule.request(info.options, (msg) => {
          const res = new HttpClientResponse(msg);
          handleResult(void 0, res);
        });
        let socket;
        req.on("socket", (sock) => {
          socket = sock;
        });
        req.setTimeout(this._socketTimeout || 3 * 6e4, () => {
          if (socket) {
            socket.end();
          }
          handleResult(new Error(`Request timeout: ${info.options.path}`));
        });
        req.on("error", function(err) {
          handleResult(err);
        });
        if (data && typeof data === "string") {
          req.write(data, "utf8");
        }
        if (data && typeof data !== "string") {
          data.on("close", function() {
            req.end();
          });
          data.pipe(req);
        } else {
          req.end();
        }
      }
      /**
       * Gets an http agent. This function is useful when you need an http agent that handles
       * routing through a proxy server - depending upon the url and proxy environment variables.
       * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
       */
      getAgent(serverUrl) {
        const parsedUrl = new URL(serverUrl);
        return this._getAgent(parsedUrl);
      }
      _prepareRequest(method, requestUrl, headers) {
        const info = {};
        info.parsedUrl = requestUrl;
        const usingSsl = info.parsedUrl.protocol === "https:";
        info.httpModule = usingSsl ? https : http;
        const defaultPort = usingSsl ? 443 : 80;
        info.options = {};
        info.options.host = info.parsedUrl.hostname;
        info.options.port = info.parsedUrl.port ? parseInt(info.parsedUrl.port) : defaultPort;
        info.options.path = (info.parsedUrl.pathname || "") + (info.parsedUrl.search || "");
        info.options.method = method;
        info.options.headers = this._mergeHeaders(headers);
        if (this.userAgent != null) {
          info.options.headers["user-agent"] = this.userAgent;
        }
        info.options.agent = this._getAgent(info.parsedUrl);
        if (this.handlers) {
          for (const handler of this.handlers) {
            handler.prepareRequest(info.options);
          }
        }
        return info;
      }
      _mergeHeaders(headers) {
        if (this.requestOptions && this.requestOptions.headers) {
          return Object.assign({}, lowercaseKeys(this.requestOptions.headers), lowercaseKeys(headers || {}));
        }
        return lowercaseKeys(headers || {});
      }
      _getExistingOrDefaultHeader(additionalHeaders, header, _default) {
        let clientHeader;
        if (this.requestOptions && this.requestOptions.headers) {
          clientHeader = lowercaseKeys(this.requestOptions.headers)[header];
        }
        return additionalHeaders[header] || clientHeader || _default;
      }
      _getAgent(parsedUrl) {
        let agent;
        const proxyUrl = pm.getProxyUrl(parsedUrl);
        const useProxy = proxyUrl && proxyUrl.hostname;
        if (this._keepAlive && useProxy) {
          agent = this._proxyAgent;
        }
        if (this._keepAlive && !useProxy) {
          agent = this._agent;
        }
        if (agent) {
          return agent;
        }
        const usingSsl = parsedUrl.protocol === "https:";
        let maxSockets = 100;
        if (this.requestOptions) {
          maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
        }
        if (proxyUrl && proxyUrl.hostname) {
          const agentOptions = {
            maxSockets,
            keepAlive: this._keepAlive,
            proxy: Object.assign(Object.assign({}, (proxyUrl.username || proxyUrl.password) && {
              proxyAuth: `${proxyUrl.username}:${proxyUrl.password}`
            }), { host: proxyUrl.hostname, port: proxyUrl.port })
          };
          let tunnelAgent;
          const overHttps = proxyUrl.protocol === "https:";
          if (usingSsl) {
            tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
          } else {
            tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
          }
          agent = tunnelAgent(agentOptions);
          this._proxyAgent = agent;
        }
        if (this._keepAlive && !agent) {
          const options = { keepAlive: this._keepAlive, maxSockets };
          agent = usingSsl ? new https.Agent(options) : new http.Agent(options);
          this._agent = agent;
        }
        if (!agent) {
          agent = usingSsl ? https.globalAgent : http.globalAgent;
        }
        if (usingSsl && this._ignoreSslError) {
          agent.options = Object.assign(agent.options || {}, {
            rejectUnauthorized: false
          });
        }
        return agent;
      }
      _performExponentialBackoff(retryNumber) {
        return __awaiter(this, void 0, void 0, function* () {
          retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber);
          const ms = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber);
          return new Promise((resolve2) => setTimeout(() => resolve2(), ms));
        });
      }
      _processResponse(res, options) {
        return __awaiter(this, void 0, void 0, function* () {
          return new Promise((resolve2, reject) => __awaiter(this, void 0, void 0, function* () {
            const statusCode = res.message.statusCode || 0;
            const response = {
              statusCode,
              result: null,
              headers: {}
            };
            if (statusCode === HttpCodes.NotFound) {
              resolve2(response);
            }
            function dateTimeDeserializer(key, value) {
              if (typeof value === "string") {
                const a = new Date(value);
                if (!isNaN(a.valueOf())) {
                  return a;
                }
              }
              return value;
            }
            let obj;
            let contents;
            try {
              contents = yield res.readBody();
              if (contents && contents.length > 0) {
                if (options && options.deserializeDates) {
                  obj = JSON.parse(contents, dateTimeDeserializer);
                } else {
                  obj = JSON.parse(contents);
                }
                response.result = obj;
              }
              response.headers = res.message.headers;
            } catch (err) {
            }
            if (statusCode > 299) {
              let msg;
              if (obj && obj.message) {
                msg = obj.message;
              } else if (contents && contents.length > 0) {
                msg = contents;
              } else {
                msg = `Failed request: (${statusCode})`;
              }
              const err = new HttpClientError(msg, statusCode);
              err.result = response.result;
              reject(err);
            } else {
              resolve2(response);
            }
          }));
        });
      }
    };
    exports.HttpClient = HttpClient;
    var lowercaseKeys = (obj) => Object.keys(obj).reduce((c, k) => (c[k.toLowerCase()] = obj[k], c), {});
  }
});

// ../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/auth.js
var require_auth = __commonJS({
  "../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/auth.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PersonalAccessTokenCredentialHandler = exports.BearerCredentialHandler = exports.BasicCredentialHandler = void 0;
    var BasicCredentialHandler = class {
      constructor(username, password) {
        this.username = username;
        this.password = password;
      }
      prepareRequest(options) {
        if (!options.headers) {
          throw Error("The request has no headers");
        }
        options.headers["Authorization"] = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`;
      }
      // This handler cannot handle 401
      canHandleAuthentication() {
        return false;
      }
      handleAuthentication() {
        return __awaiter(this, void 0, void 0, function* () {
          throw new Error("not implemented");
        });
      }
    };
    exports.BasicCredentialHandler = BasicCredentialHandler;
    var BearerCredentialHandler = class {
      constructor(token) {
        this.token = token;
      }
      // currently implements pre-authorization
      // TODO: support preAuth = false where it hooks on 401
      prepareRequest(options) {
        if (!options.headers) {
          throw Error("The request has no headers");
        }
        options.headers["Authorization"] = `Bearer ${this.token}`;
      }
      // This handler cannot handle 401
      canHandleAuthentication() {
        return false;
      }
      handleAuthentication() {
        return __awaiter(this, void 0, void 0, function* () {
          throw new Error("not implemented");
        });
      }
    };
    exports.BearerCredentialHandler = BearerCredentialHandler;
    var PersonalAccessTokenCredentialHandler = class {
      constructor(token) {
        this.token = token;
      }
      // currently implements pre-authorization
      // TODO: support preAuth = false where it hooks on 401
      prepareRequest(options) {
        if (!options.headers) {
          throw Error("The request has no headers");
        }
        options.headers["Authorization"] = `Basic ${Buffer.from(`PAT:${this.token}`).toString("base64")}`;
      }
      // This handler cannot handle 401
      canHandleAuthentication() {
        return false;
      }
      handleAuthentication() {
        return __awaiter(this, void 0, void 0, function* () {
          throw new Error("not implemented");
        });
      }
    };
    exports.PersonalAccessTokenCredentialHandler = PersonalAccessTokenCredentialHandler;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/oidc-utils.js
var require_oidc_utils = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/oidc-utils.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OidcClient = void 0;
    var http_client_1 = require_lib();
    var auth_1 = require_auth();
    var core_1 = require_core();
    var OidcClient = class _OidcClient {
      static createHttpClient(allowRetry = true, maxRetry = 10) {
        const requestOptions = {
          allowRetries: allowRetry,
          maxRetries: maxRetry
        };
        return new http_client_1.HttpClient("actions/oidc-client", [new auth_1.BearerCredentialHandler(_OidcClient.getRequestToken())], requestOptions);
      }
      static getRequestToken() {
        const token = process.env["ACTIONS_ID_TOKEN_REQUEST_TOKEN"];
        if (!token) {
          throw new Error("Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable");
        }
        return token;
      }
      static getIDTokenUrl() {
        const runtimeUrl = process.env["ACTIONS_ID_TOKEN_REQUEST_URL"];
        if (!runtimeUrl) {
          throw new Error("Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable");
        }
        return runtimeUrl;
      }
      static getCall(id_token_url) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          const httpclient = _OidcClient.createHttpClient();
          const res = yield httpclient.getJson(id_token_url).catch((error) => {
            throw new Error(`Failed to get ID Token. 
 
        Error Code : ${error.statusCode}
 
        Error Message: ${error.result.message}`);
          });
          const id_token = (_a = res.result) === null || _a === void 0 ? void 0 : _a.value;
          if (!id_token) {
            throw new Error("Response json body do not have ID Token field");
          }
          return id_token;
        });
      }
      static getIDToken(audience) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let id_token_url = _OidcClient.getIDTokenUrl();
            if (audience) {
              const encodedAudience = encodeURIComponent(audience);
              id_token_url = `${id_token_url}&audience=${encodedAudience}`;
            }
            core_1.debug(`ID token url is ${id_token_url}`);
            const id_token = yield _OidcClient.getCall(id_token_url);
            core_1.setSecret(id_token);
            return id_token;
          } catch (error) {
            throw new Error(`Error message: ${error.message}`);
          }
        });
      }
    };
    exports.OidcClient = OidcClient;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/summary.js
var require_summary = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/summary.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summary = exports.markdownSummary = exports.SUMMARY_DOCS_URL = exports.SUMMARY_ENV_VAR = void 0;
    var os_1 = require("os");
    var fs_1 = require("fs");
    var { access, appendFile, writeFile } = fs_1.promises;
    exports.SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";
    exports.SUMMARY_DOCS_URL = "https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary";
    var Summary = class {
      constructor() {
        this._buffer = "";
      }
      /**
       * Finds the summary file path from the environment, rejects if env var is not found or file does not exist
       * Also checks r/w permissions.
       *
       * @returns step summary file path
       */
      filePath() {
        return __awaiter(this, void 0, void 0, function* () {
          if (this._filePath) {
            return this._filePath;
          }
          const pathFromEnv = process.env[exports.SUMMARY_ENV_VAR];
          if (!pathFromEnv) {
            throw new Error(`Unable to find environment variable for $${exports.SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
          }
          try {
            yield access(pathFromEnv, fs_1.constants.R_OK | fs_1.constants.W_OK);
          } catch (_a) {
            throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
          }
          this._filePath = pathFromEnv;
          return this._filePath;
        });
      }
      /**
       * Wraps content in an HTML tag, adding any HTML attributes
       *
       * @param {string} tag HTML tag to wrap
       * @param {string | null} content content within the tag
       * @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
       *
       * @returns {string} content wrapped in HTML element
       */
      wrap(tag, content, attrs = {}) {
        const htmlAttrs = Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join("");
        if (!content) {
          return `<${tag}${htmlAttrs}>`;
        }
        return `<${tag}${htmlAttrs}>${content}</${tag}>`;
      }
      /**
       * Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
       *
       * @param {SummaryWriteOptions} [options] (optional) options for write operation
       *
       * @returns {Promise<Summary>} summary instance
       */
      write(options) {
        return __awaiter(this, void 0, void 0, function* () {
          const overwrite = !!(options === null || options === void 0 ? void 0 : options.overwrite);
          const filePath = yield this.filePath();
          const writeFunc = overwrite ? writeFile : appendFile;
          yield writeFunc(filePath, this._buffer, { encoding: "utf8" });
          return this.emptyBuffer();
        });
      }
      /**
       * Clears the summary buffer and wipes the summary file
       *
       * @returns {Summary} summary instance
       */
      clear() {
        return __awaiter(this, void 0, void 0, function* () {
          return this.emptyBuffer().write({ overwrite: true });
        });
      }
      /**
       * Returns the current summary buffer as a string
       *
       * @returns {string} string of summary buffer
       */
      stringify() {
        return this._buffer;
      }
      /**
       * If the summary buffer is empty
       *
       * @returns {boolen} true if the buffer is empty
       */
      isEmptyBuffer() {
        return this._buffer.length === 0;
      }
      /**
       * Resets the summary buffer without writing to summary file
       *
       * @returns {Summary} summary instance
       */
      emptyBuffer() {
        this._buffer = "";
        return this;
      }
      /**
       * Adds raw text to the summary buffer
       *
       * @param {string} text content to add
       * @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
       *
       * @returns {Summary} summary instance
       */
      addRaw(text, addEOL = false) {
        this._buffer += text;
        return addEOL ? this.addEOL() : this;
      }
      /**
       * Adds the operating system-specific end-of-line marker to the buffer
       *
       * @returns {Summary} summary instance
       */
      addEOL() {
        return this.addRaw(os_1.EOL);
      }
      /**
       * Adds an HTML codeblock to the summary buffer
       *
       * @param {string} code content to render within fenced code block
       * @param {string} lang (optional) language to syntax highlight code
       *
       * @returns {Summary} summary instance
       */
      addCodeBlock(code, lang) {
        const attrs = Object.assign({}, lang && { lang });
        const element = this.wrap("pre", this.wrap("code", code), attrs);
        return this.addRaw(element).addEOL();
      }
      /**
       * Adds an HTML list to the summary buffer
       *
       * @param {string[]} items list of items to render
       * @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
       *
       * @returns {Summary} summary instance
       */
      addList(items, ordered = false) {
        const tag = ordered ? "ol" : "ul";
        const listItems = items.map((item) => this.wrap("li", item)).join("");
        const element = this.wrap(tag, listItems);
        return this.addRaw(element).addEOL();
      }
      /**
       * Adds an HTML table to the summary buffer
       *
       * @param {SummaryTableCell[]} rows table rows
       *
       * @returns {Summary} summary instance
       */
      addTable(rows) {
        const tableBody = rows.map((row) => {
          const cells = row.map((cell) => {
            if (typeof cell === "string") {
              return this.wrap("td", cell);
            }
            const { header, data, colspan, rowspan } = cell;
            const tag = header ? "th" : "td";
            const attrs = Object.assign(Object.assign({}, colspan && { colspan }), rowspan && { rowspan });
            return this.wrap(tag, data, attrs);
          }).join("");
          return this.wrap("tr", cells);
        }).join("");
        const element = this.wrap("table", tableBody);
        return this.addRaw(element).addEOL();
      }
      /**
       * Adds a collapsable HTML details element to the summary buffer
       *
       * @param {string} label text for the closed state
       * @param {string} content collapsable content
       *
       * @returns {Summary} summary instance
       */
      addDetails(label, content) {
        const element = this.wrap("details", this.wrap("summary", label) + content);
        return this.addRaw(element).addEOL();
      }
      /**
       * Adds an HTML image tag to the summary buffer
       *
       * @param {string} src path to the image you to embed
       * @param {string} alt text description of the image
       * @param {SummaryImageOptions} options (optional) addition image attributes
       *
       * @returns {Summary} summary instance
       */
      addImage(src, alt, options) {
        const { width, height } = options || {};
        const attrs = Object.assign(Object.assign({}, width && { width }), height && { height });
        const element = this.wrap("img", null, Object.assign({ src, alt }, attrs));
        return this.addRaw(element).addEOL();
      }
      /**
       * Adds an HTML section heading element
       *
       * @param {string} text heading text
       * @param {number | string} [level=1] (optional) the heading level, default: 1
       *
       * @returns {Summary} summary instance
       */
      addHeading(text, level) {
        const tag = `h${level}`;
        const allowedTag = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag) ? tag : "h1";
        const element = this.wrap(allowedTag, text);
        return this.addRaw(element).addEOL();
      }
      /**
       * Adds an HTML thematic break (<hr>) to the summary buffer
       *
       * @returns {Summary} summary instance
       */
      addSeparator() {
        const element = this.wrap("hr", null);
        return this.addRaw(element).addEOL();
      }
      /**
       * Adds an HTML line break (<br>) to the summary buffer
       *
       * @returns {Summary} summary instance
       */
      addBreak() {
        const element = this.wrap("br", null);
        return this.addRaw(element).addEOL();
      }
      /**
       * Adds an HTML blockquote to the summary buffer
       *
       * @param {string} text quote text
       * @param {string} cite (optional) citation url
       *
       * @returns {Summary} summary instance
       */
      addQuote(text, cite) {
        const attrs = Object.assign({}, cite && { cite });
        const element = this.wrap("blockquote", text, attrs);
        return this.addRaw(element).addEOL();
      }
      /**
       * Adds an HTML anchor tag to the summary buffer
       *
       * @param {string} text link text/content
       * @param {string} href hyperlink
       *
       * @returns {Summary} summary instance
       */
      addLink(text, href) {
        const element = this.wrap("a", text, { href });
        return this.addRaw(element).addEOL();
      }
    };
    var _summary = new Summary();
    exports.markdownSummary = _summary;
    exports.summary = _summary;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/path-utils.js
var require_path_utils = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/path-utils.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toPlatformPath = exports.toWin32Path = exports.toPosixPath = void 0;
    var path2 = __importStar(require("path"));
    function toPosixPath(pth) {
      return pth.replace(/[\\]/g, "/");
    }
    exports.toPosixPath = toPosixPath;
    function toWin32Path(pth) {
      return pth.replace(/[/]/g, "\\");
    }
    exports.toWin32Path = toWin32Path;
    function toPlatformPath(pth) {
      return pth.replace(/[/\\]/g, path2.sep);
    }
    exports.toPlatformPath = toPlatformPath;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/core.js
var require_core = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.0/node_modules/@actions/core/lib/core.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getIDToken = exports.getState = exports.saveState = exports.group = exports.endGroup = exports.startGroup = exports.info = exports.notice = exports.warning = exports.error = exports.debug = exports.isDebug = exports.setFailed = exports.setCommandEcho = exports.setOutput = exports.getBooleanInput = exports.getMultilineInput = exports.getInput = exports.addPath = exports.setSecret = exports.exportVariable = exports.ExitCode = void 0;
    var command_1 = require_command();
    var file_command_1 = require_file_command();
    var utils_1 = require_utils();
    var os = __importStar(require("os"));
    var path2 = __importStar(require("path"));
    var oidc_utils_1 = require_oidc_utils();
    var ExitCode;
    (function(ExitCode2) {
      ExitCode2[ExitCode2["Success"] = 0] = "Success";
      ExitCode2[ExitCode2["Failure"] = 1] = "Failure";
    })(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
    function exportVariable(name, val) {
      const convertedVal = utils_1.toCommandValue(val);
      process.env[name] = convertedVal;
      const filePath = process.env["GITHUB_ENV"] || "";
      if (filePath) {
        return file_command_1.issueFileCommand("ENV", file_command_1.prepareKeyValueMessage(name, val));
      }
      command_1.issueCommand("set-env", { name }, convertedVal);
    }
    exports.exportVariable = exportVariable;
    function setSecret(secret) {
      command_1.issueCommand("add-mask", {}, secret);
    }
    exports.setSecret = setSecret;
    function addPath(inputPath) {
      const filePath = process.env["GITHUB_PATH"] || "";
      if (filePath) {
        file_command_1.issueFileCommand("PATH", inputPath);
      } else {
        command_1.issueCommand("add-path", {}, inputPath);
      }
      process.env["PATH"] = `${inputPath}${path2.delimiter}${process.env["PATH"]}`;
    }
    exports.addPath = addPath;
    function getInput2(name, options) {
      const val = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
      if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
      }
      if (options && options.trimWhitespace === false) {
        return val;
      }
      return val.trim();
    }
    exports.getInput = getInput2;
    function getMultilineInput(name, options) {
      const inputs = getInput2(name, options).split("\n").filter((x) => x !== "");
      if (options && options.trimWhitespace === false) {
        return inputs;
      }
      return inputs.map((input) => input.trim());
    }
    exports.getMultilineInput = getMultilineInput;
    function getBooleanInput(name, options) {
      const trueValue = ["true", "True", "TRUE"];
      const falseValue = ["false", "False", "FALSE"];
      const val = getInput2(name, options);
      if (trueValue.includes(val))
        return true;
      if (falseValue.includes(val))
        return false;
      throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}
Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
    }
    exports.getBooleanInput = getBooleanInput;
    function setOutput2(name, value) {
      const filePath = process.env["GITHUB_OUTPUT"] || "";
      if (filePath) {
        return file_command_1.issueFileCommand("OUTPUT", file_command_1.prepareKeyValueMessage(name, value));
      }
      process.stdout.write(os.EOL);
      command_1.issueCommand("set-output", { name }, utils_1.toCommandValue(value));
    }
    exports.setOutput = setOutput2;
    function setCommandEcho(enabled) {
      command_1.issue("echo", enabled ? "on" : "off");
    }
    exports.setCommandEcho = setCommandEcho;
    function setFailed2(message) {
      process.exitCode = ExitCode.Failure;
      error(message);
    }
    exports.setFailed = setFailed2;
    function isDebug() {
      return process.env["RUNNER_DEBUG"] === "1";
    }
    exports.isDebug = isDebug;
    function debug(message) {
      command_1.issueCommand("debug", {}, message);
    }
    exports.debug = debug;
    function error(message, properties = {}) {
      command_1.issueCommand("error", utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
    }
    exports.error = error;
    function warning(message, properties = {}) {
      command_1.issueCommand("warning", utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
    }
    exports.warning = warning;
    function notice(message, properties = {}) {
      command_1.issueCommand("notice", utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
    }
    exports.notice = notice;
    function info(message) {
      process.stdout.write(message + os.EOL);
    }
    exports.info = info;
    function startGroup(name) {
      command_1.issue("group", name);
    }
    exports.startGroup = startGroup;
    function endGroup() {
      command_1.issue("endgroup");
    }
    exports.endGroup = endGroup;
    function group(name, fn) {
      return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
          result = yield fn();
        } finally {
          endGroup();
        }
        return result;
      });
    }
    exports.group = group;
    function saveState(name, value) {
      const filePath = process.env["GITHUB_STATE"] || "";
      if (filePath) {
        return file_command_1.issueFileCommand("STATE", file_command_1.prepareKeyValueMessage(name, value));
      }
      command_1.issueCommand("save-state", { name }, utils_1.toCommandValue(value));
    }
    exports.saveState = saveState;
    function getState(name) {
      return process.env[`STATE_${name}`] || "";
    }
    exports.getState = getState;
    function getIDToken(aud) {
      return __awaiter(this, void 0, void 0, function* () {
        return yield oidc_utils_1.OidcClient.getIDToken(aud);
      });
    }
    exports.getIDToken = getIDToken;
    var summary_1 = require_summary();
    Object.defineProperty(exports, "summary", { enumerable: true, get: function() {
      return summary_1.summary;
    } });
    var summary_2 = require_summary();
    Object.defineProperty(exports, "markdownSummary", { enumerable: true, get: function() {
      return summary_2.markdownSummary;
    } });
    var path_utils_1 = require_path_utils();
    Object.defineProperty(exports, "toPosixPath", { enumerable: true, get: function() {
      return path_utils_1.toPosixPath;
    } });
    Object.defineProperty(exports, "toWin32Path", { enumerable: true, get: function() {
      return path_utils_1.toWin32Path;
    } });
    Object.defineProperty(exports, "toPlatformPath", { enumerable: true, get: function() {
      return path_utils_1.toPlatformPath;
    } });
  }
});

// ../../../node_modules/.pnpm/delayed-stream@1.0.0/node_modules/delayed-stream/lib/delayed_stream.js
var require_delayed_stream = __commonJS({
  "../../../node_modules/.pnpm/delayed-stream@1.0.0/node_modules/delayed-stream/lib/delayed_stream.js"(exports, module2) {
    "use strict";
    var Stream = require("stream").Stream;
    var util = require("util");
    module2.exports = DelayedStream;
    function DelayedStream() {
      this.source = null;
      this.dataSize = 0;
      this.maxDataSize = 1024 * 1024;
      this.pauseStream = true;
      this._maxDataSizeExceeded = false;
      this._released = false;
      this._bufferedEvents = [];
    }
    util.inherits(DelayedStream, Stream);
    DelayedStream.create = function(source, options) {
      var delayedStream = new this();
      options = options || {};
      for (var option in options) {
        delayedStream[option] = options[option];
      }
      delayedStream.source = source;
      var realEmit = source.emit;
      source.emit = function() {
        delayedStream._handleEmit(arguments);
        return realEmit.apply(source, arguments);
      };
      source.on("error", function() {
      });
      if (delayedStream.pauseStream) {
        source.pause();
      }
      return delayedStream;
    };
    Object.defineProperty(DelayedStream.prototype, "readable", {
      configurable: true,
      enumerable: true,
      get: function() {
        return this.source.readable;
      }
    });
    DelayedStream.prototype.setEncoding = function() {
      return this.source.setEncoding.apply(this.source, arguments);
    };
    DelayedStream.prototype.resume = function() {
      if (!this._released) {
        this.release();
      }
      this.source.resume();
    };
    DelayedStream.prototype.pause = function() {
      this.source.pause();
    };
    DelayedStream.prototype.release = function() {
      this._released = true;
      this._bufferedEvents.forEach(function(args) {
        this.emit.apply(this, args);
      }.bind(this));
      this._bufferedEvents = [];
    };
    DelayedStream.prototype.pipe = function() {
      var r = Stream.prototype.pipe.apply(this, arguments);
      this.resume();
      return r;
    };
    DelayedStream.prototype._handleEmit = function(args) {
      if (this._released) {
        this.emit.apply(this, args);
        return;
      }
      if (args[0] === "data") {
        this.dataSize += args[1].length;
        this._checkIfMaxDataSizeExceeded();
      }
      this._bufferedEvents.push(args);
    };
    DelayedStream.prototype._checkIfMaxDataSizeExceeded = function() {
      if (this._maxDataSizeExceeded) {
        return;
      }
      if (this.dataSize <= this.maxDataSize) {
        return;
      }
      this._maxDataSizeExceeded = true;
      var message = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this.emit("error", new Error(message));
    };
  }
});

// ../../../node_modules/.pnpm/combined-stream@1.0.8/node_modules/combined-stream/lib/combined_stream.js
var require_combined_stream = __commonJS({
  "../../../node_modules/.pnpm/combined-stream@1.0.8/node_modules/combined-stream/lib/combined_stream.js"(exports, module2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream").Stream;
    var DelayedStream = require_delayed_stream();
    module2.exports = CombinedStream;
    function CombinedStream() {
      this.writable = false;
      this.readable = true;
      this.dataSize = 0;
      this.maxDataSize = 2 * 1024 * 1024;
      this.pauseStreams = true;
      this._released = false;
      this._streams = [];
      this._currentStream = null;
      this._insideLoop = false;
      this._pendingNext = false;
    }
    util.inherits(CombinedStream, Stream);
    CombinedStream.create = function(options) {
      var combinedStream = new this();
      options = options || {};
      for (var option in options) {
        combinedStream[option] = options[option];
      }
      return combinedStream;
    };
    CombinedStream.isStreamLike = function(stream) {
      return typeof stream !== "function" && typeof stream !== "string" && typeof stream !== "boolean" && typeof stream !== "number" && !Buffer.isBuffer(stream);
    };
    CombinedStream.prototype.append = function(stream) {
      var isStreamLike = CombinedStream.isStreamLike(stream);
      if (isStreamLike) {
        if (!(stream instanceof DelayedStream)) {
          var newStream = DelayedStream.create(stream, {
            maxDataSize: Infinity,
            pauseStream: this.pauseStreams
          });
          stream.on("data", this._checkDataSize.bind(this));
          stream = newStream;
        }
        this._handleErrors(stream);
        if (this.pauseStreams) {
          stream.pause();
        }
      }
      this._streams.push(stream);
      return this;
    };
    CombinedStream.prototype.pipe = function(dest, options) {
      Stream.prototype.pipe.call(this, dest, options);
      this.resume();
      return dest;
    };
    CombinedStream.prototype._getNext = function() {
      this._currentStream = null;
      if (this._insideLoop) {
        this._pendingNext = true;
        return;
      }
      this._insideLoop = true;
      try {
        do {
          this._pendingNext = false;
          this._realGetNext();
        } while (this._pendingNext);
      } finally {
        this._insideLoop = false;
      }
    };
    CombinedStream.prototype._realGetNext = function() {
      var stream = this._streams.shift();
      if (typeof stream == "undefined") {
        this.end();
        return;
      }
      if (typeof stream !== "function") {
        this._pipeNext(stream);
        return;
      }
      var getStream = stream;
      getStream(function(stream2) {
        var isStreamLike = CombinedStream.isStreamLike(stream2);
        if (isStreamLike) {
          stream2.on("data", this._checkDataSize.bind(this));
          this._handleErrors(stream2);
        }
        this._pipeNext(stream2);
      }.bind(this));
    };
    CombinedStream.prototype._pipeNext = function(stream) {
      this._currentStream = stream;
      var isStreamLike = CombinedStream.isStreamLike(stream);
      if (isStreamLike) {
        stream.on("end", this._getNext.bind(this));
        stream.pipe(this, { end: false });
        return;
      }
      var value = stream;
      this.write(value);
      this._getNext();
    };
    CombinedStream.prototype._handleErrors = function(stream) {
      var self = this;
      stream.on("error", function(err) {
        self._emitError(err);
      });
    };
    CombinedStream.prototype.write = function(data) {
      this.emit("data", data);
    };
    CombinedStream.prototype.pause = function() {
      if (!this.pauseStreams) {
        return;
      }
      if (this.pauseStreams && this._currentStream && typeof this._currentStream.pause == "function")
        this._currentStream.pause();
      this.emit("pause");
    };
    CombinedStream.prototype.resume = function() {
      if (!this._released) {
        this._released = true;
        this.writable = true;
        this._getNext();
      }
      if (this.pauseStreams && this._currentStream && typeof this._currentStream.resume == "function")
        this._currentStream.resume();
      this.emit("resume");
    };
    CombinedStream.prototype.end = function() {
      this._reset();
      this.emit("end");
    };
    CombinedStream.prototype.destroy = function() {
      this._reset();
      this.emit("close");
    };
    CombinedStream.prototype._reset = function() {
      this.writable = false;
      this._streams = [];
      this._currentStream = null;
    };
    CombinedStream.prototype._checkDataSize = function() {
      this._updateDataSize();
      if (this.dataSize <= this.maxDataSize) {
        return;
      }
      var message = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this._emitError(new Error(message));
    };
    CombinedStream.prototype._updateDataSize = function() {
      this.dataSize = 0;
      var self = this;
      this._streams.forEach(function(stream) {
        if (!stream.dataSize) {
          return;
        }
        self.dataSize += stream.dataSize;
      });
      if (this._currentStream && this._currentStream.dataSize) {
        this.dataSize += this._currentStream.dataSize;
      }
    };
    CombinedStream.prototype._emitError = function(err) {
      this._reset();
      this.emit("error", err);
    };
  }
});

// ../../../node_modules/.pnpm/mime-db@1.52.0/node_modules/mime-db/db.json
var require_db = __commonJS({
  "../../../node_modules/.pnpm/mime-db@1.52.0/node_modules/mime-db/db.json"(exports, module2) {
    module2.exports = {
      "application/1d-interleaved-parityfec": {
        source: "iana"
      },
      "application/3gpdash-qoe-report+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/3gpp-ims+xml": {
        source: "iana",
        compressible: true
      },
      "application/3gpphal+json": {
        source: "iana",
        compressible: true
      },
      "application/3gpphalforms+json": {
        source: "iana",
        compressible: true
      },
      "application/a2l": {
        source: "iana"
      },
      "application/ace+cbor": {
        source: "iana"
      },
      "application/activemessage": {
        source: "iana"
      },
      "application/activity+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-directory+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcost+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcostparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointprop+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointpropparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-error+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamcontrol+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamparams+json": {
        source: "iana",
        compressible: true
      },
      "application/aml": {
        source: "iana"
      },
      "application/andrew-inset": {
        source: "iana",
        extensions: ["ez"]
      },
      "application/applefile": {
        source: "iana"
      },
      "application/applixware": {
        source: "apache",
        extensions: ["aw"]
      },
      "application/at+jwt": {
        source: "iana"
      },
      "application/atf": {
        source: "iana"
      },
      "application/atfx": {
        source: "iana"
      },
      "application/atom+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atom"]
      },
      "application/atomcat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomcat"]
      },
      "application/atomdeleted+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomdeleted"]
      },
      "application/atomicmail": {
        source: "iana"
      },
      "application/atomsvc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomsvc"]
      },
      "application/atsc-dwd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dwd"]
      },
      "application/atsc-dynamic-event-message": {
        source: "iana"
      },
      "application/atsc-held+xml": {
        source: "iana",
        compressible: true,
        extensions: ["held"]
      },
      "application/atsc-rdt+json": {
        source: "iana",
        compressible: true
      },
      "application/atsc-rsat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsat"]
      },
      "application/atxml": {
        source: "iana"
      },
      "application/auth-policy+xml": {
        source: "iana",
        compressible: true
      },
      "application/bacnet-xdd+zip": {
        source: "iana",
        compressible: false
      },
      "application/batch-smtp": {
        source: "iana"
      },
      "application/bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/beep+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/calendar+json": {
        source: "iana",
        compressible: true
      },
      "application/calendar+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xcs"]
      },
      "application/call-completion": {
        source: "iana"
      },
      "application/cals-1840": {
        source: "iana"
      },
      "application/captive+json": {
        source: "iana",
        compressible: true
      },
      "application/cbor": {
        source: "iana"
      },
      "application/cbor-seq": {
        source: "iana"
      },
      "application/cccex": {
        source: "iana"
      },
      "application/ccmp+xml": {
        source: "iana",
        compressible: true
      },
      "application/ccxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ccxml"]
      },
      "application/cdfx+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdfx"]
      },
      "application/cdmi-capability": {
        source: "iana",
        extensions: ["cdmia"]
      },
      "application/cdmi-container": {
        source: "iana",
        extensions: ["cdmic"]
      },
      "application/cdmi-domain": {
        source: "iana",
        extensions: ["cdmid"]
      },
      "application/cdmi-object": {
        source: "iana",
        extensions: ["cdmio"]
      },
      "application/cdmi-queue": {
        source: "iana",
        extensions: ["cdmiq"]
      },
      "application/cdni": {
        source: "iana"
      },
      "application/cea": {
        source: "iana"
      },
      "application/cea-2018+xml": {
        source: "iana",
        compressible: true
      },
      "application/cellml+xml": {
        source: "iana",
        compressible: true
      },
      "application/cfw": {
        source: "iana"
      },
      "application/city+json": {
        source: "iana",
        compressible: true
      },
      "application/clr": {
        source: "iana"
      },
      "application/clue+xml": {
        source: "iana",
        compressible: true
      },
      "application/clue_info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cms": {
        source: "iana"
      },
      "application/cnrp+xml": {
        source: "iana",
        compressible: true
      },
      "application/coap-group+json": {
        source: "iana",
        compressible: true
      },
      "application/coap-payload": {
        source: "iana"
      },
      "application/commonground": {
        source: "iana"
      },
      "application/conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cose": {
        source: "iana"
      },
      "application/cose-key": {
        source: "iana"
      },
      "application/cose-key-set": {
        source: "iana"
      },
      "application/cpl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cpl"]
      },
      "application/csrattrs": {
        source: "iana"
      },
      "application/csta+xml": {
        source: "iana",
        compressible: true
      },
      "application/cstadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/csvm+json": {
        source: "iana",
        compressible: true
      },
      "application/cu-seeme": {
        source: "apache",
        extensions: ["cu"]
      },
      "application/cwt": {
        source: "iana"
      },
      "application/cybercash": {
        source: "iana"
      },
      "application/dart": {
        compressible: true
      },
      "application/dash+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpd"]
      },
      "application/dash-patch+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpp"]
      },
      "application/dashdelta": {
        source: "iana"
      },
      "application/davmount+xml": {
        source: "iana",
        compressible: true,
        extensions: ["davmount"]
      },
      "application/dca-rft": {
        source: "iana"
      },
      "application/dcd": {
        source: "iana"
      },
      "application/dec-dx": {
        source: "iana"
      },
      "application/dialog-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/dicom": {
        source: "iana"
      },
      "application/dicom+json": {
        source: "iana",
        compressible: true
      },
      "application/dicom+xml": {
        source: "iana",
        compressible: true
      },
      "application/dii": {
        source: "iana"
      },
      "application/dit": {
        source: "iana"
      },
      "application/dns": {
        source: "iana"
      },
      "application/dns+json": {
        source: "iana",
        compressible: true
      },
      "application/dns-message": {
        source: "iana"
      },
      "application/docbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dbk"]
      },
      "application/dots+cbor": {
        source: "iana"
      },
      "application/dskpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/dssc+der": {
        source: "iana",
        extensions: ["dssc"]
      },
      "application/dssc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdssc"]
      },
      "application/dvcs": {
        source: "iana"
      },
      "application/ecmascript": {
        source: "iana",
        compressible: true,
        extensions: ["es", "ecma"]
      },
      "application/edi-consent": {
        source: "iana"
      },
      "application/edi-x12": {
        source: "iana",
        compressible: false
      },
      "application/edifact": {
        source: "iana",
        compressible: false
      },
      "application/efi": {
        source: "iana"
      },
      "application/elm+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/elm+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.cap+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/emergencycalldata.comment+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.control+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.deviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.ecall.msd": {
        source: "iana"
      },
      "application/emergencycalldata.providerinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.serviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.subscriberinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.veds+xml": {
        source: "iana",
        compressible: true
      },
      "application/emma+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emma"]
      },
      "application/emotionml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emotionml"]
      },
      "application/encaprtp": {
        source: "iana"
      },
      "application/epp+xml": {
        source: "iana",
        compressible: true
      },
      "application/epub+zip": {
        source: "iana",
        compressible: false,
        extensions: ["epub"]
      },
      "application/eshop": {
        source: "iana"
      },
      "application/exi": {
        source: "iana",
        extensions: ["exi"]
      },
      "application/expect-ct-report+json": {
        source: "iana",
        compressible: true
      },
      "application/express": {
        source: "iana",
        extensions: ["exp"]
      },
      "application/fastinfoset": {
        source: "iana"
      },
      "application/fastsoap": {
        source: "iana"
      },
      "application/fdt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fdt"]
      },
      "application/fhir+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fhir+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fido.trusted-apps+json": {
        compressible: true
      },
      "application/fits": {
        source: "iana"
      },
      "application/flexfec": {
        source: "iana"
      },
      "application/font-sfnt": {
        source: "iana"
      },
      "application/font-tdpfr": {
        source: "iana",
        extensions: ["pfr"]
      },
      "application/font-woff": {
        source: "iana",
        compressible: false
      },
      "application/framework-attributes+xml": {
        source: "iana",
        compressible: true
      },
      "application/geo+json": {
        source: "iana",
        compressible: true,
        extensions: ["geojson"]
      },
      "application/geo+json-seq": {
        source: "iana"
      },
      "application/geopackage+sqlite3": {
        source: "iana"
      },
      "application/geoxacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/gltf-buffer": {
        source: "iana"
      },
      "application/gml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["gml"]
      },
      "application/gpx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["gpx"]
      },
      "application/gxf": {
        source: "apache",
        extensions: ["gxf"]
      },
      "application/gzip": {
        source: "iana",
        compressible: false,
        extensions: ["gz"]
      },
      "application/h224": {
        source: "iana"
      },
      "application/held+xml": {
        source: "iana",
        compressible: true
      },
      "application/hjson": {
        extensions: ["hjson"]
      },
      "application/http": {
        source: "iana"
      },
      "application/hyperstudio": {
        source: "iana",
        extensions: ["stk"]
      },
      "application/ibe-key-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pkg-reply+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pp-data": {
        source: "iana"
      },
      "application/iges": {
        source: "iana"
      },
      "application/im-iscomposing+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/index": {
        source: "iana"
      },
      "application/index.cmd": {
        source: "iana"
      },
      "application/index.obj": {
        source: "iana"
      },
      "application/index.response": {
        source: "iana"
      },
      "application/index.vnd": {
        source: "iana"
      },
      "application/inkml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ink", "inkml"]
      },
      "application/iotp": {
        source: "iana"
      },
      "application/ipfix": {
        source: "iana",
        extensions: ["ipfix"]
      },
      "application/ipp": {
        source: "iana"
      },
      "application/isup": {
        source: "iana"
      },
      "application/its+xml": {
        source: "iana",
        compressible: true,
        extensions: ["its"]
      },
      "application/java-archive": {
        source: "apache",
        compressible: false,
        extensions: ["jar", "war", "ear"]
      },
      "application/java-serialized-object": {
        source: "apache",
        compressible: false,
        extensions: ["ser"]
      },
      "application/java-vm": {
        source: "apache",
        compressible: false,
        extensions: ["class"]
      },
      "application/javascript": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["js", "mjs"]
      },
      "application/jf2feed+json": {
        source: "iana",
        compressible: true
      },
      "application/jose": {
        source: "iana"
      },
      "application/jose+json": {
        source: "iana",
        compressible: true
      },
      "application/jrd+json": {
        source: "iana",
        compressible: true
      },
      "application/jscalendar+json": {
        source: "iana",
        compressible: true
      },
      "application/json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["json", "map"]
      },
      "application/json-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/json-seq": {
        source: "iana"
      },
      "application/json5": {
        extensions: ["json5"]
      },
      "application/jsonml+json": {
        source: "apache",
        compressible: true,
        extensions: ["jsonml"]
      },
      "application/jwk+json": {
        source: "iana",
        compressible: true
      },
      "application/jwk-set+json": {
        source: "iana",
        compressible: true
      },
      "application/jwt": {
        source: "iana"
      },
      "application/kpml-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/kpml-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/ld+json": {
        source: "iana",
        compressible: true,
        extensions: ["jsonld"]
      },
      "application/lgr+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lgr"]
      },
      "application/link-format": {
        source: "iana"
      },
      "application/load-control+xml": {
        source: "iana",
        compressible: true
      },
      "application/lost+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lostxml"]
      },
      "application/lostsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/lpf+zip": {
        source: "iana",
        compressible: false
      },
      "application/lxf": {
        source: "iana"
      },
      "application/mac-binhex40": {
        source: "iana",
        extensions: ["hqx"]
      },
      "application/mac-compactpro": {
        source: "apache",
        extensions: ["cpt"]
      },
      "application/macwriteii": {
        source: "iana"
      },
      "application/mads+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mads"]
      },
      "application/manifest+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["webmanifest"]
      },
      "application/marc": {
        source: "iana",
        extensions: ["mrc"]
      },
      "application/marcxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mrcx"]
      },
      "application/mathematica": {
        source: "iana",
        extensions: ["ma", "nb", "mb"]
      },
      "application/mathml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mathml"]
      },
      "application/mathml-content+xml": {
        source: "iana",
        compressible: true
      },
      "application/mathml-presentation+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-associated-procedure-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-deregister+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-envelope+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-protection-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-reception-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-schedule+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-user-service-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbox": {
        source: "iana",
        extensions: ["mbox"]
      },
      "application/media-policy-dataset+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpf"]
      },
      "application/media_control+xml": {
        source: "iana",
        compressible: true
      },
      "application/mediaservercontrol+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mscml"]
      },
      "application/merge-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/metalink+xml": {
        source: "apache",
        compressible: true,
        extensions: ["metalink"]
      },
      "application/metalink4+xml": {
        source: "iana",
        compressible: true,
        extensions: ["meta4"]
      },
      "application/mets+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mets"]
      },
      "application/mf4": {
        source: "iana"
      },
      "application/mikey": {
        source: "iana"
      },
      "application/mipc": {
        source: "iana"
      },
      "application/missing-blocks+cbor-seq": {
        source: "iana"
      },
      "application/mmt-aei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["maei"]
      },
      "application/mmt-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musd"]
      },
      "application/mods+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mods"]
      },
      "application/moss-keys": {
        source: "iana"
      },
      "application/moss-signature": {
        source: "iana"
      },
      "application/mosskey-data": {
        source: "iana"
      },
      "application/mosskey-request": {
        source: "iana"
      },
      "application/mp21": {
        source: "iana",
        extensions: ["m21", "mp21"]
      },
      "application/mp4": {
        source: "iana",
        extensions: ["mp4s", "m4p"]
      },
      "application/mpeg4-generic": {
        source: "iana"
      },
      "application/mpeg4-iod": {
        source: "iana"
      },
      "application/mpeg4-iod-xmt": {
        source: "iana"
      },
      "application/mrb-consumer+xml": {
        source: "iana",
        compressible: true
      },
      "application/mrb-publish+xml": {
        source: "iana",
        compressible: true
      },
      "application/msc-ivr+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msc-mixer+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msword": {
        source: "iana",
        compressible: false,
        extensions: ["doc", "dot"]
      },
      "application/mud+json": {
        source: "iana",
        compressible: true
      },
      "application/multipart-core": {
        source: "iana"
      },
      "application/mxf": {
        source: "iana",
        extensions: ["mxf"]
      },
      "application/n-quads": {
        source: "iana",
        extensions: ["nq"]
      },
      "application/n-triples": {
        source: "iana",
        extensions: ["nt"]
      },
      "application/nasdata": {
        source: "iana"
      },
      "application/news-checkgroups": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-groupinfo": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-transmission": {
        source: "iana"
      },
      "application/nlsml+xml": {
        source: "iana",
        compressible: true
      },
      "application/node": {
        source: "iana",
        extensions: ["cjs"]
      },
      "application/nss": {
        source: "iana"
      },
      "application/oauth-authz-req+jwt": {
        source: "iana"
      },
      "application/oblivious-dns-message": {
        source: "iana"
      },
      "application/ocsp-request": {
        source: "iana"
      },
      "application/ocsp-response": {
        source: "iana"
      },
      "application/octet-stream": {
        source: "iana",
        compressible: false,
        extensions: ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"]
      },
      "application/oda": {
        source: "iana",
        extensions: ["oda"]
      },
      "application/odm+xml": {
        source: "iana",
        compressible: true
      },
      "application/odx": {
        source: "iana"
      },
      "application/oebps-package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["opf"]
      },
      "application/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogx"]
      },
      "application/omdoc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["omdoc"]
      },
      "application/onenote": {
        source: "apache",
        extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"]
      },
      "application/opc-nodeset+xml": {
        source: "iana",
        compressible: true
      },
      "application/oscore": {
        source: "iana"
      },
      "application/oxps": {
        source: "iana",
        extensions: ["oxps"]
      },
      "application/p21": {
        source: "iana"
      },
      "application/p21+zip": {
        source: "iana",
        compressible: false
      },
      "application/p2p-overlay+xml": {
        source: "iana",
        compressible: true,
        extensions: ["relo"]
      },
      "application/parityfec": {
        source: "iana"
      },
      "application/passport": {
        source: "iana"
      },
      "application/patch-ops-error+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xer"]
      },
      "application/pdf": {
        source: "iana",
        compressible: false,
        extensions: ["pdf"]
      },
      "application/pdx": {
        source: "iana"
      },
      "application/pem-certificate-chain": {
        source: "iana"
      },
      "application/pgp-encrypted": {
        source: "iana",
        compressible: false,
        extensions: ["pgp"]
      },
      "application/pgp-keys": {
        source: "iana",
        extensions: ["asc"]
      },
      "application/pgp-signature": {
        source: "iana",
        extensions: ["asc", "sig"]
      },
      "application/pics-rules": {
        source: "apache",
        extensions: ["prf"]
      },
      "application/pidf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pidf-diff+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pkcs10": {
        source: "iana",
        extensions: ["p10"]
      },
      "application/pkcs12": {
        source: "iana"
      },
      "application/pkcs7-mime": {
        source: "iana",
        extensions: ["p7m", "p7c"]
      },
      "application/pkcs7-signature": {
        source: "iana",
        extensions: ["p7s"]
      },
      "application/pkcs8": {
        source: "iana",
        extensions: ["p8"]
      },
      "application/pkcs8-encrypted": {
        source: "iana"
      },
      "application/pkix-attr-cert": {
        source: "iana",
        extensions: ["ac"]
      },
      "application/pkix-cert": {
        source: "iana",
        extensions: ["cer"]
      },
      "application/pkix-crl": {
        source: "iana",
        extensions: ["crl"]
      },
      "application/pkix-pkipath": {
        source: "iana",
        extensions: ["pkipath"]
      },
      "application/pkixcmp": {
        source: "iana",
        extensions: ["pki"]
      },
      "application/pls+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pls"]
      },
      "application/poc-settings+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/postscript": {
        source: "iana",
        compressible: true,
        extensions: ["ai", "eps", "ps"]
      },
      "application/ppsp-tracker+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+xml": {
        source: "iana",
        compressible: true
      },
      "application/provenance+xml": {
        source: "iana",
        compressible: true,
        extensions: ["provx"]
      },
      "application/prs.alvestrand.titrax-sheet": {
        source: "iana"
      },
      "application/prs.cww": {
        source: "iana",
        extensions: ["cww"]
      },
      "application/prs.cyn": {
        source: "iana",
        charset: "7-BIT"
      },
      "application/prs.hpub+zip": {
        source: "iana",
        compressible: false
      },
      "application/prs.nprend": {
        source: "iana"
      },
      "application/prs.plucker": {
        source: "iana"
      },
      "application/prs.rdf-xml-crypt": {
        source: "iana"
      },
      "application/prs.xsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/pskc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pskcxml"]
      },
      "application/pvd+json": {
        source: "iana",
        compressible: true
      },
      "application/qsig": {
        source: "iana"
      },
      "application/raml+yaml": {
        compressible: true,
        extensions: ["raml"]
      },
      "application/raptorfec": {
        source: "iana"
      },
      "application/rdap+json": {
        source: "iana",
        compressible: true
      },
      "application/rdf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rdf", "owl"]
      },
      "application/reginfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rif"]
      },
      "application/relax-ng-compact-syntax": {
        source: "iana",
        extensions: ["rnc"]
      },
      "application/remote-printing": {
        source: "iana"
      },
      "application/reputon+json": {
        source: "iana",
        compressible: true
      },
      "application/resource-lists+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rl"]
      },
      "application/resource-lists-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rld"]
      },
      "application/rfc+xml": {
        source: "iana",
        compressible: true
      },
      "application/riscos": {
        source: "iana"
      },
      "application/rlmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/rls-services+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rs"]
      },
      "application/route-apd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rapd"]
      },
      "application/route-s-tsid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sls"]
      },
      "application/route-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rusd"]
      },
      "application/rpki-ghostbusters": {
        source: "iana",
        extensions: ["gbr"]
      },
      "application/rpki-manifest": {
        source: "iana",
        extensions: ["mft"]
      },
      "application/rpki-publication": {
        source: "iana"
      },
      "application/rpki-roa": {
        source: "iana",
        extensions: ["roa"]
      },
      "application/rpki-updown": {
        source: "iana"
      },
      "application/rsd+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rsd"]
      },
      "application/rss+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rss"]
      },
      "application/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "application/rtploopback": {
        source: "iana"
      },
      "application/rtx": {
        source: "iana"
      },
      "application/samlassertion+xml": {
        source: "iana",
        compressible: true
      },
      "application/samlmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/sarif+json": {
        source: "iana",
        compressible: true
      },
      "application/sarif-external-properties+json": {
        source: "iana",
        compressible: true
      },
      "application/sbe": {
        source: "iana"
      },
      "application/sbml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sbml"]
      },
      "application/scaip+xml": {
        source: "iana",
        compressible: true
      },
      "application/scim+json": {
        source: "iana",
        compressible: true
      },
      "application/scvp-cv-request": {
        source: "iana",
        extensions: ["scq"]
      },
      "application/scvp-cv-response": {
        source: "iana",
        extensions: ["scs"]
      },
      "application/scvp-vp-request": {
        source: "iana",
        extensions: ["spq"]
      },
      "application/scvp-vp-response": {
        source: "iana",
        extensions: ["spp"]
      },
      "application/sdp": {
        source: "iana",
        extensions: ["sdp"]
      },
      "application/secevent+jwt": {
        source: "iana"
      },
      "application/senml+cbor": {
        source: "iana"
      },
      "application/senml+json": {
        source: "iana",
        compressible: true
      },
      "application/senml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["senmlx"]
      },
      "application/senml-etch+cbor": {
        source: "iana"
      },
      "application/senml-etch+json": {
        source: "iana",
        compressible: true
      },
      "application/senml-exi": {
        source: "iana"
      },
      "application/sensml+cbor": {
        source: "iana"
      },
      "application/sensml+json": {
        source: "iana",
        compressible: true
      },
      "application/sensml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sensmlx"]
      },
      "application/sensml-exi": {
        source: "iana"
      },
      "application/sep+xml": {
        source: "iana",
        compressible: true
      },
      "application/sep-exi": {
        source: "iana"
      },
      "application/session-info": {
        source: "iana"
      },
      "application/set-payment": {
        source: "iana"
      },
      "application/set-payment-initiation": {
        source: "iana",
        extensions: ["setpay"]
      },
      "application/set-registration": {
        source: "iana"
      },
      "application/set-registration-initiation": {
        source: "iana",
        extensions: ["setreg"]
      },
      "application/sgml": {
        source: "iana"
      },
      "application/sgml-open-catalog": {
        source: "iana"
      },
      "application/shf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["shf"]
      },
      "application/sieve": {
        source: "iana",
        extensions: ["siv", "sieve"]
      },
      "application/simple-filter+xml": {
        source: "iana",
        compressible: true
      },
      "application/simple-message-summary": {
        source: "iana"
      },
      "application/simplesymbolcontainer": {
        source: "iana"
      },
      "application/sipc": {
        source: "iana"
      },
      "application/slate": {
        source: "iana"
      },
      "application/smil": {
        source: "iana"
      },
      "application/smil+xml": {
        source: "iana",
        compressible: true,
        extensions: ["smi", "smil"]
      },
      "application/smpte336m": {
        source: "iana"
      },
      "application/soap+fastinfoset": {
        source: "iana"
      },
      "application/soap+xml": {
        source: "iana",
        compressible: true
      },
      "application/sparql-query": {
        source: "iana",
        extensions: ["rq"]
      },
      "application/sparql-results+xml": {
        source: "iana",
        compressible: true,
        extensions: ["srx"]
      },
      "application/spdx+json": {
        source: "iana",
        compressible: true
      },
      "application/spirits-event+xml": {
        source: "iana",
        compressible: true
      },
      "application/sql": {
        source: "iana"
      },
      "application/srgs": {
        source: "iana",
        extensions: ["gram"]
      },
      "application/srgs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["grxml"]
      },
      "application/sru+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sru"]
      },
      "application/ssdl+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ssdl"]
      },
      "application/ssml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ssml"]
      },
      "application/stix+json": {
        source: "iana",
        compressible: true
      },
      "application/swid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["swidtag"]
      },
      "application/tamp-apex-update": {
        source: "iana"
      },
      "application/tamp-apex-update-confirm": {
        source: "iana"
      },
      "application/tamp-community-update": {
        source: "iana"
      },
      "application/tamp-community-update-confirm": {
        source: "iana"
      },
      "application/tamp-error": {
        source: "iana"
      },
      "application/tamp-sequence-adjust": {
        source: "iana"
      },
      "application/tamp-sequence-adjust-confirm": {
        source: "iana"
      },
      "application/tamp-status-query": {
        source: "iana"
      },
      "application/tamp-status-response": {
        source: "iana"
      },
      "application/tamp-update": {
        source: "iana"
      },
      "application/tamp-update-confirm": {
        source: "iana"
      },
      "application/tar": {
        compressible: true
      },
      "application/taxii+json": {
        source: "iana",
        compressible: true
      },
      "application/td+json": {
        source: "iana",
        compressible: true
      },
      "application/tei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tei", "teicorpus"]
      },
      "application/tetra_isi": {
        source: "iana"
      },
      "application/thraud+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tfi"]
      },
      "application/timestamp-query": {
        source: "iana"
      },
      "application/timestamp-reply": {
        source: "iana"
      },
      "application/timestamped-data": {
        source: "iana",
        extensions: ["tsd"]
      },
      "application/tlsrpt+gzip": {
        source: "iana"
      },
      "application/tlsrpt+json": {
        source: "iana",
        compressible: true
      },
      "application/tnauthlist": {
        source: "iana"
      },
      "application/token-introspection+jwt": {
        source: "iana"
      },
      "application/toml": {
        compressible: true,
        extensions: ["toml"]
      },
      "application/trickle-ice-sdpfrag": {
        source: "iana"
      },
      "application/trig": {
        source: "iana",
        extensions: ["trig"]
      },
      "application/ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ttml"]
      },
      "application/tve-trigger": {
        source: "iana"
      },
      "application/tzif": {
        source: "iana"
      },
      "application/tzif-leap": {
        source: "iana"
      },
      "application/ubjson": {
        compressible: false,
        extensions: ["ubj"]
      },
      "application/ulpfec": {
        source: "iana"
      },
      "application/urc-grpsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/urc-ressheet+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsheet"]
      },
      "application/urc-targetdesc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["td"]
      },
      "application/urc-uisocketdesc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vcard+json": {
        source: "iana",
        compressible: true
      },
      "application/vcard+xml": {
        source: "iana",
        compressible: true
      },
      "application/vemmi": {
        source: "iana"
      },
      "application/vividence.scriptfile": {
        source: "apache"
      },
      "application/vnd.1000minds.decision-model+xml": {
        source: "iana",
        compressible: true,
        extensions: ["1km"]
      },
      "application/vnd.3gpp-prose+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-prose-pc3ch+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-v2x-local-service-information": {
        source: "iana"
      },
      "application/vnd.3gpp.5gnas": {
        source: "iana"
      },
      "application/vnd.3gpp.access-transfer-events+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.bsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gmop+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gtpc": {
        source: "iana"
      },
      "application/vnd.3gpp.interworking-data": {
        source: "iana"
      },
      "application/vnd.3gpp.lpp": {
        source: "iana"
      },
      "application/vnd.3gpp.mc-signalling-ear": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-payload": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-signalling": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-floor-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-signed+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-init-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-transmission-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mid-call+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ngap": {
        source: "iana"
      },
      "application/vnd.3gpp.pfcp": {
        source: "iana"
      },
      "application/vnd.3gpp.pic-bw-large": {
        source: "iana",
        extensions: ["plb"]
      },
      "application/vnd.3gpp.pic-bw-small": {
        source: "iana",
        extensions: ["psb"]
      },
      "application/vnd.3gpp.pic-bw-var": {
        source: "iana",
        extensions: ["pvb"]
      },
      "application/vnd.3gpp.s1ap": {
        source: "iana"
      },
      "application/vnd.3gpp.sms": {
        source: "iana"
      },
      "application/vnd.3gpp.sms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-ext+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.state-and-event-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ussd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.bcmcsinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.sms": {
        source: "iana"
      },
      "application/vnd.3gpp2.tcap": {
        source: "iana",
        extensions: ["tcap"]
      },
      "application/vnd.3lightssoftware.imagescal": {
        source: "iana"
      },
      "application/vnd.3m.post-it-notes": {
        source: "iana",
        extensions: ["pwn"]
      },
      "application/vnd.accpac.simply.aso": {
        source: "iana",
        extensions: ["aso"]
      },
      "application/vnd.accpac.simply.imp": {
        source: "iana",
        extensions: ["imp"]
      },
      "application/vnd.acucobol": {
        source: "iana",
        extensions: ["acu"]
      },
      "application/vnd.acucorp": {
        source: "iana",
        extensions: ["atc", "acutc"]
      },
      "application/vnd.adobe.air-application-installer-package+zip": {
        source: "apache",
        compressible: false,
        extensions: ["air"]
      },
      "application/vnd.adobe.flash.movie": {
        source: "iana"
      },
      "application/vnd.adobe.formscentral.fcdt": {
        source: "iana",
        extensions: ["fcdt"]
      },
      "application/vnd.adobe.fxp": {
        source: "iana",
        extensions: ["fxp", "fxpl"]
      },
      "application/vnd.adobe.partial-upload": {
        source: "iana"
      },
      "application/vnd.adobe.xdp+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdp"]
      },
      "application/vnd.adobe.xfdf": {
        source: "iana",
        extensions: ["xfdf"]
      },
      "application/vnd.aether.imp": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata-pagedef": {
        source: "iana"
      },
      "application/vnd.afpc.cmoca-cmresource": {
        source: "iana"
      },
      "application/vnd.afpc.foca-charset": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codedfont": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codepage": {
        source: "iana"
      },
      "application/vnd.afpc.modca": {
        source: "iana"
      },
      "application/vnd.afpc.modca-cmtable": {
        source: "iana"
      },
      "application/vnd.afpc.modca-formdef": {
        source: "iana"
      },
      "application/vnd.afpc.modca-mediummap": {
        source: "iana"
      },
      "application/vnd.afpc.modca-objectcontainer": {
        source: "iana"
      },
      "application/vnd.afpc.modca-overlay": {
        source: "iana"
      },
      "application/vnd.afpc.modca-pagesegment": {
        source: "iana"
      },
      "application/vnd.age": {
        source: "iana",
        extensions: ["age"]
      },
      "application/vnd.ah-barcode": {
        source: "iana"
      },
      "application/vnd.ahead.space": {
        source: "iana",
        extensions: ["ahead"]
      },
      "application/vnd.airzip.filesecure.azf": {
        source: "iana",
        extensions: ["azf"]
      },
      "application/vnd.airzip.filesecure.azs": {
        source: "iana",
        extensions: ["azs"]
      },
      "application/vnd.amadeus+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.amazon.ebook": {
        source: "apache",
        extensions: ["azw"]
      },
      "application/vnd.amazon.mobi8-ebook": {
        source: "iana"
      },
      "application/vnd.americandynamics.acc": {
        source: "iana",
        extensions: ["acc"]
      },
      "application/vnd.amiga.ami": {
        source: "iana",
        extensions: ["ami"]
      },
      "application/vnd.amundsen.maze+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.android.ota": {
        source: "iana"
      },
      "application/vnd.android.package-archive": {
        source: "apache",
        compressible: false,
        extensions: ["apk"]
      },
      "application/vnd.anki": {
        source: "iana"
      },
      "application/vnd.anser-web-certificate-issue-initiation": {
        source: "iana",
        extensions: ["cii"]
      },
      "application/vnd.anser-web-funds-transfer-initiation": {
        source: "apache",
        extensions: ["fti"]
      },
      "application/vnd.antix.game-component": {
        source: "iana",
        extensions: ["atx"]
      },
      "application/vnd.apache.arrow.file": {
        source: "iana"
      },
      "application/vnd.apache.arrow.stream": {
        source: "iana"
      },
      "application/vnd.apache.thrift.binary": {
        source: "iana"
      },
      "application/vnd.apache.thrift.compact": {
        source: "iana"
      },
      "application/vnd.apache.thrift.json": {
        source: "iana"
      },
      "application/vnd.api+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.aplextor.warrp+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apothekende.reservation+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apple.installer+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpkg"]
      },
      "application/vnd.apple.keynote": {
        source: "iana",
        extensions: ["key"]
      },
      "application/vnd.apple.mpegurl": {
        source: "iana",
        extensions: ["m3u8"]
      },
      "application/vnd.apple.numbers": {
        source: "iana",
        extensions: ["numbers"]
      },
      "application/vnd.apple.pages": {
        source: "iana",
        extensions: ["pages"]
      },
      "application/vnd.apple.pkpass": {
        compressible: false,
        extensions: ["pkpass"]
      },
      "application/vnd.arastra.swi": {
        source: "iana"
      },
      "application/vnd.aristanetworks.swi": {
        source: "iana",
        extensions: ["swi"]
      },
      "application/vnd.artisan+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.artsquare": {
        source: "iana"
      },
      "application/vnd.astraea-software.iota": {
        source: "iana",
        extensions: ["iota"]
      },
      "application/vnd.audiograph": {
        source: "iana",
        extensions: ["aep"]
      },
      "application/vnd.autopackage": {
        source: "iana"
      },
      "application/vnd.avalon+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.avistar+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.balsamiq.bmml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["bmml"]
      },
      "application/vnd.balsamiq.bmpr": {
        source: "iana"
      },
      "application/vnd.banana-accounting": {
        source: "iana"
      },
      "application/vnd.bbf.usp.error": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bekitzur-stech+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bint.med-content": {
        source: "iana"
      },
      "application/vnd.biopax.rdf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.blink-idb-value-wrapper": {
        source: "iana"
      },
      "application/vnd.blueice.multipass": {
        source: "iana",
        extensions: ["mpm"]
      },
      "application/vnd.bluetooth.ep.oob": {
        source: "iana"
      },
      "application/vnd.bluetooth.le.oob": {
        source: "iana"
      },
      "application/vnd.bmi": {
        source: "iana",
        extensions: ["bmi"]
      },
      "application/vnd.bpf": {
        source: "iana"
      },
      "application/vnd.bpf3": {
        source: "iana"
      },
      "application/vnd.businessobjects": {
        source: "iana",
        extensions: ["rep"]
      },
      "application/vnd.byu.uapi+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cab-jscript": {
        source: "iana"
      },
      "application/vnd.canon-cpdl": {
        source: "iana"
      },
      "application/vnd.canon-lips": {
        source: "iana"
      },
      "application/vnd.capasystems-pg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cendio.thinlinc.clientconf": {
        source: "iana"
      },
      "application/vnd.century-systems.tcp_stream": {
        source: "iana"
      },
      "application/vnd.chemdraw+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdxml"]
      },
      "application/vnd.chess-pgn": {
        source: "iana"
      },
      "application/vnd.chipnuts.karaoke-mmd": {
        source: "iana",
        extensions: ["mmd"]
      },
      "application/vnd.ciedi": {
        source: "iana"
      },
      "application/vnd.cinderella": {
        source: "iana",
        extensions: ["cdy"]
      },
      "application/vnd.cirpack.isdn-ext": {
        source: "iana"
      },
      "application/vnd.citationstyles.style+xml": {
        source: "iana",
        compressible: true,
        extensions: ["csl"]
      },
      "application/vnd.claymore": {
        source: "iana",
        extensions: ["cla"]
      },
      "application/vnd.cloanto.rp9": {
        source: "iana",
        extensions: ["rp9"]
      },
      "application/vnd.clonk.c4group": {
        source: "iana",
        extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"]
      },
      "application/vnd.cluetrust.cartomobile-config": {
        source: "iana",
        extensions: ["c11amc"]
      },
      "application/vnd.cluetrust.cartomobile-config-pkg": {
        source: "iana",
        extensions: ["c11amz"]
      },
      "application/vnd.coffeescript": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet-template": {
        source: "iana"
      },
      "application/vnd.collection+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.doc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.next+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.comicbook+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.comicbook-rar": {
        source: "iana"
      },
      "application/vnd.commerce-battelle": {
        source: "iana"
      },
      "application/vnd.commonspace": {
        source: "iana",
        extensions: ["csp"]
      },
      "application/vnd.contact.cmsg": {
        source: "iana",
        extensions: ["cdbcmsg"]
      },
      "application/vnd.coreos.ignition+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cosmocaller": {
        source: "iana",
        extensions: ["cmc"]
      },
      "application/vnd.crick.clicker": {
        source: "iana",
        extensions: ["clkx"]
      },
      "application/vnd.crick.clicker.keyboard": {
        source: "iana",
        extensions: ["clkk"]
      },
      "application/vnd.crick.clicker.palette": {
        source: "iana",
        extensions: ["clkp"]
      },
      "application/vnd.crick.clicker.template": {
        source: "iana",
        extensions: ["clkt"]
      },
      "application/vnd.crick.clicker.wordbank": {
        source: "iana",
        extensions: ["clkw"]
      },
      "application/vnd.criticaltools.wbs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wbs"]
      },
      "application/vnd.cryptii.pipe+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.crypto-shade-file": {
        source: "iana"
      },
      "application/vnd.cryptomator.encrypted": {
        source: "iana"
      },
      "application/vnd.cryptomator.vault": {
        source: "iana"
      },
      "application/vnd.ctc-posml": {
        source: "iana",
        extensions: ["pml"]
      },
      "application/vnd.ctct.ws+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cups-pdf": {
        source: "iana"
      },
      "application/vnd.cups-postscript": {
        source: "iana"
      },
      "application/vnd.cups-ppd": {
        source: "iana",
        extensions: ["ppd"]
      },
      "application/vnd.cups-raster": {
        source: "iana"
      },
      "application/vnd.cups-raw": {
        source: "iana"
      },
      "application/vnd.curl": {
        source: "iana"
      },
      "application/vnd.curl.car": {
        source: "apache",
        extensions: ["car"]
      },
      "application/vnd.curl.pcurl": {
        source: "apache",
        extensions: ["pcurl"]
      },
      "application/vnd.cyan.dean.root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cybank": {
        source: "iana"
      },
      "application/vnd.cyclonedx+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cyclonedx+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.d2l.coursepackage1p0+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.d3m-dataset": {
        source: "iana"
      },
      "application/vnd.d3m-problem": {
        source: "iana"
      },
      "application/vnd.dart": {
        source: "iana",
        compressible: true,
        extensions: ["dart"]
      },
      "application/vnd.data-vision.rdz": {
        source: "iana",
        extensions: ["rdz"]
      },
      "application/vnd.datapackage+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dataresource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dbf": {
        source: "iana",
        extensions: ["dbf"]
      },
      "application/vnd.debian.binary-package": {
        source: "iana"
      },
      "application/vnd.dece.data": {
        source: "iana",
        extensions: ["uvf", "uvvf", "uvd", "uvvd"]
      },
      "application/vnd.dece.ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uvt", "uvvt"]
      },
      "application/vnd.dece.unspecified": {
        source: "iana",
        extensions: ["uvx", "uvvx"]
      },
      "application/vnd.dece.zip": {
        source: "iana",
        extensions: ["uvz", "uvvz"]
      },
      "application/vnd.denovo.fcselayout-link": {
        source: "iana",
        extensions: ["fe_launch"]
      },
      "application/vnd.desmume.movie": {
        source: "iana"
      },
      "application/vnd.dir-bi.plate-dl-nosuffix": {
        source: "iana"
      },
      "application/vnd.dm.delegation+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dna": {
        source: "iana",
        extensions: ["dna"]
      },
      "application/vnd.document+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dolby.mlp": {
        source: "apache",
        extensions: ["mlp"]
      },
      "application/vnd.dolby.mobile.1": {
        source: "iana"
      },
      "application/vnd.dolby.mobile.2": {
        source: "iana"
      },
      "application/vnd.doremir.scorecloud-binary-document": {
        source: "iana"
      },
      "application/vnd.dpgraph": {
        source: "iana",
        extensions: ["dpg"]
      },
      "application/vnd.dreamfactory": {
        source: "iana",
        extensions: ["dfac"]
      },
      "application/vnd.drive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ds-keypoint": {
        source: "apache",
        extensions: ["kpxx"]
      },
      "application/vnd.dtg.local": {
        source: "iana"
      },
      "application/vnd.dtg.local.flash": {
        source: "iana"
      },
      "application/vnd.dtg.local.html": {
        source: "iana"
      },
      "application/vnd.dvb.ait": {
        source: "iana",
        extensions: ["ait"]
      },
      "application/vnd.dvb.dvbisl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.dvbj": {
        source: "iana"
      },
      "application/vnd.dvb.esgcontainer": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcdftnotifaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess2": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgpdd": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcroaming": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-base": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-enhancement": {
        source: "iana"
      },
      "application/vnd.dvb.notif-aggregate-root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-container+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-generic+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-msglist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-init+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.pfr": {
        source: "iana"
      },
      "application/vnd.dvb.service": {
        source: "iana",
        extensions: ["svc"]
      },
      "application/vnd.dxr": {
        source: "iana"
      },
      "application/vnd.dynageo": {
        source: "iana",
        extensions: ["geo"]
      },
      "application/vnd.dzr": {
        source: "iana"
      },
      "application/vnd.easykaraoke.cdgdownload": {
        source: "iana"
      },
      "application/vnd.ecdis-update": {
        source: "iana"
      },
      "application/vnd.ecip.rlp": {
        source: "iana"
      },
      "application/vnd.eclipse.ditto+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ecowin.chart": {
        source: "iana",
        extensions: ["mag"]
      },
      "application/vnd.ecowin.filerequest": {
        source: "iana"
      },
      "application/vnd.ecowin.fileupdate": {
        source: "iana"
      },
      "application/vnd.ecowin.series": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesrequest": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesupdate": {
        source: "iana"
      },
      "application/vnd.efi.img": {
        source: "iana"
      },
      "application/vnd.efi.iso": {
        source: "iana"
      },
      "application/vnd.emclient.accessrequest+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.enliven": {
        source: "iana",
        extensions: ["nml"]
      },
      "application/vnd.enphase.envoy": {
        source: "iana"
      },
      "application/vnd.eprints.data+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.epson.esf": {
        source: "iana",
        extensions: ["esf"]
      },
      "application/vnd.epson.msf": {
        source: "iana",
        extensions: ["msf"]
      },
      "application/vnd.epson.quickanime": {
        source: "iana",
        extensions: ["qam"]
      },
      "application/vnd.epson.salt": {
        source: "iana",
        extensions: ["slt"]
      },
      "application/vnd.epson.ssf": {
        source: "iana",
        extensions: ["ssf"]
      },
      "application/vnd.ericsson.quickcall": {
        source: "iana"
      },
      "application/vnd.espass-espass+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.eszigno3+xml": {
        source: "iana",
        compressible: true,
        extensions: ["es3", "et3"]
      },
      "application/vnd.etsi.aoc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.asic-e+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.asic-s+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.cug+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvcommand+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-bc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-cod+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-npvr+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvservice+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mcid+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mheg5": {
        source: "iana"
      },
      "application/vnd.etsi.overload-control-policy-dataset+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.pstn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.sci+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.simservs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.timestamp-token": {
        source: "iana"
      },
      "application/vnd.etsi.tsl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.tsl.der": {
        source: "iana"
      },
      "application/vnd.eu.kasparian.car+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.eudora.data": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.profile": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.settings": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.theme": {
        source: "iana"
      },
      "application/vnd.exstream-empower+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.exstream-package": {
        source: "iana"
      },
      "application/vnd.ezpix-album": {
        source: "iana",
        extensions: ["ez2"]
      },
      "application/vnd.ezpix-package": {
        source: "iana",
        extensions: ["ez3"]
      },
      "application/vnd.f-secure.mobile": {
        source: "iana"
      },
      "application/vnd.familysearch.gedcom+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.fastcopy-disk-image": {
        source: "iana"
      },
      "application/vnd.fdf": {
        source: "iana",
        extensions: ["fdf"]
      },
      "application/vnd.fdsn.mseed": {
        source: "iana",
        extensions: ["mseed"]
      },
      "application/vnd.fdsn.seed": {
        source: "iana",
        extensions: ["seed", "dataless"]
      },
      "application/vnd.ffsns": {
        source: "iana"
      },
      "application/vnd.ficlab.flb+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.filmit.zfc": {
        source: "iana"
      },
      "application/vnd.fints": {
        source: "iana"
      },
      "application/vnd.firemonkeys.cloudcell": {
        source: "iana"
      },
      "application/vnd.flographit": {
        source: "iana",
        extensions: ["gph"]
      },
      "application/vnd.fluxtime.clip": {
        source: "iana",
        extensions: ["ftc"]
      },
      "application/vnd.font-fontforge-sfd": {
        source: "iana"
      },
      "application/vnd.framemaker": {
        source: "iana",
        extensions: ["fm", "frame", "maker", "book"]
      },
      "application/vnd.frogans.fnc": {
        source: "iana",
        extensions: ["fnc"]
      },
      "application/vnd.frogans.ltf": {
        source: "iana",
        extensions: ["ltf"]
      },
      "application/vnd.fsc.weblaunch": {
        source: "iana",
        extensions: ["fsc"]
      },
      "application/vnd.fujifilm.fb.docuworks": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.binder": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.jfi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fujitsu.oasys": {
        source: "iana",
        extensions: ["oas"]
      },
      "application/vnd.fujitsu.oasys2": {
        source: "iana",
        extensions: ["oa2"]
      },
      "application/vnd.fujitsu.oasys3": {
        source: "iana",
        extensions: ["oa3"]
      },
      "application/vnd.fujitsu.oasysgp": {
        source: "iana",
        extensions: ["fg5"]
      },
      "application/vnd.fujitsu.oasysprs": {
        source: "iana",
        extensions: ["bh2"]
      },
      "application/vnd.fujixerox.art-ex": {
        source: "iana"
      },
      "application/vnd.fujixerox.art4": {
        source: "iana"
      },
      "application/vnd.fujixerox.ddd": {
        source: "iana",
        extensions: ["ddd"]
      },
      "application/vnd.fujixerox.docuworks": {
        source: "iana",
        extensions: ["xdw"]
      },
      "application/vnd.fujixerox.docuworks.binder": {
        source: "iana",
        extensions: ["xbd"]
      },
      "application/vnd.fujixerox.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujixerox.hbpl": {
        source: "iana"
      },
      "application/vnd.fut-misnet": {
        source: "iana"
      },
      "application/vnd.futoin+cbor": {
        source: "iana"
      },
      "application/vnd.futoin+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fuzzysheet": {
        source: "iana",
        extensions: ["fzs"]
      },
      "application/vnd.genomatix.tuxedo": {
        source: "iana",
        extensions: ["txd"]
      },
      "application/vnd.gentics.grd+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geo+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geocube+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geogebra.file": {
        source: "iana",
        extensions: ["ggb"]
      },
      "application/vnd.geogebra.slides": {
        source: "iana"
      },
      "application/vnd.geogebra.tool": {
        source: "iana",
        extensions: ["ggt"]
      },
      "application/vnd.geometry-explorer": {
        source: "iana",
        extensions: ["gex", "gre"]
      },
      "application/vnd.geonext": {
        source: "iana",
        extensions: ["gxt"]
      },
      "application/vnd.geoplan": {
        source: "iana",
        extensions: ["g2w"]
      },
      "application/vnd.geospace": {
        source: "iana",
        extensions: ["g3w"]
      },
      "application/vnd.gerber": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt-response": {
        source: "iana"
      },
      "application/vnd.gmx": {
        source: "iana",
        extensions: ["gmx"]
      },
      "application/vnd.google-apps.document": {
        compressible: false,
        extensions: ["gdoc"]
      },
      "application/vnd.google-apps.presentation": {
        compressible: false,
        extensions: ["gslides"]
      },
      "application/vnd.google-apps.spreadsheet": {
        compressible: false,
        extensions: ["gsheet"]
      },
      "application/vnd.google-earth.kml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["kml"]
      },
      "application/vnd.google-earth.kmz": {
        source: "iana",
        compressible: false,
        extensions: ["kmz"]
      },
      "application/vnd.gov.sk.e-form+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.gov.sk.e-form+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.gov.sk.xmldatacontainer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.grafeq": {
        source: "iana",
        extensions: ["gqf", "gqs"]
      },
      "application/vnd.gridmp": {
        source: "iana"
      },
      "application/vnd.groove-account": {
        source: "iana",
        extensions: ["gac"]
      },
      "application/vnd.groove-help": {
        source: "iana",
        extensions: ["ghf"]
      },
      "application/vnd.groove-identity-message": {
        source: "iana",
        extensions: ["gim"]
      },
      "application/vnd.groove-injector": {
        source: "iana",
        extensions: ["grv"]
      },
      "application/vnd.groove-tool-message": {
        source: "iana",
        extensions: ["gtm"]
      },
      "application/vnd.groove-tool-template": {
        source: "iana",
        extensions: ["tpl"]
      },
      "application/vnd.groove-vcard": {
        source: "iana",
        extensions: ["vcg"]
      },
      "application/vnd.hal+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hal+xml": {
        source: "iana",
        compressible: true,
        extensions: ["hal"]
      },
      "application/vnd.handheld-entertainment+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zmm"]
      },
      "application/vnd.hbci": {
        source: "iana",
        extensions: ["hbci"]
      },
      "application/vnd.hc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hcl-bireports": {
        source: "iana"
      },
      "application/vnd.hdt": {
        source: "iana"
      },
      "application/vnd.heroku+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hhe.lesson-player": {
        source: "iana",
        extensions: ["les"]
      },
      "application/vnd.hl7cda+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.hl7v2+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.hp-hpgl": {
        source: "iana",
        extensions: ["hpgl"]
      },
      "application/vnd.hp-hpid": {
        source: "iana",
        extensions: ["hpid"]
      },
      "application/vnd.hp-hps": {
        source: "iana",
        extensions: ["hps"]
      },
      "application/vnd.hp-jlyt": {
        source: "iana",
        extensions: ["jlt"]
      },
      "application/vnd.hp-pcl": {
        source: "iana",
        extensions: ["pcl"]
      },
      "application/vnd.hp-pclxl": {
        source: "iana",
        extensions: ["pclxl"]
      },
      "application/vnd.httphone": {
        source: "iana"
      },
      "application/vnd.hydrostatix.sof-data": {
        source: "iana",
        extensions: ["sfd-hdstx"]
      },
      "application/vnd.hyper+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyper-item+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyperdrive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hzn-3d-crossword": {
        source: "iana"
      },
      "application/vnd.ibm.afplinedata": {
        source: "iana"
      },
      "application/vnd.ibm.electronic-media": {
        source: "iana"
      },
      "application/vnd.ibm.minipay": {
        source: "iana",
        extensions: ["mpy"]
      },
      "application/vnd.ibm.modcap": {
        source: "iana",
        extensions: ["afp", "listafp", "list3820"]
      },
      "application/vnd.ibm.rights-management": {
        source: "iana",
        extensions: ["irm"]
      },
      "application/vnd.ibm.secure-container": {
        source: "iana",
        extensions: ["sc"]
      },
      "application/vnd.iccprofile": {
        source: "iana",
        extensions: ["icc", "icm"]
      },
      "application/vnd.ieee.1905": {
        source: "iana"
      },
      "application/vnd.igloader": {
        source: "iana",
        extensions: ["igl"]
      },
      "application/vnd.imagemeter.folder+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.imagemeter.image+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.immervision-ivp": {
        source: "iana",
        extensions: ["ivp"]
      },
      "application/vnd.immervision-ivu": {
        source: "iana",
        extensions: ["ivu"]
      },
      "application/vnd.ims.imsccv1p1": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p2": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p3": {
        source: "iana"
      },
      "application/vnd.ims.lis.v2.result+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy.id+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings.simple+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informedcontrol.rms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informix-visionary": {
        source: "iana"
      },
      "application/vnd.infotech.project": {
        source: "iana"
      },
      "application/vnd.infotech.project+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.innopath.wamp.notification": {
        source: "iana"
      },
      "application/vnd.insors.igm": {
        source: "iana",
        extensions: ["igm"]
      },
      "application/vnd.intercon.formnet": {
        source: "iana",
        extensions: ["xpw", "xpx"]
      },
      "application/vnd.intergeo": {
        source: "iana",
        extensions: ["i2g"]
      },
      "application/vnd.intertrust.digibox": {
        source: "iana"
      },
      "application/vnd.intertrust.nncp": {
        source: "iana"
      },
      "application/vnd.intu.qbo": {
        source: "iana",
        extensions: ["qbo"]
      },
      "application/vnd.intu.qfx": {
        source: "iana",
        extensions: ["qfx"]
      },
      "application/vnd.iptc.g2.catalogitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.conceptitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.knowledgeitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.packageitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.planningitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ipunplugged.rcprofile": {
        source: "iana",
        extensions: ["rcprofile"]
      },
      "application/vnd.irepository.package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["irp"]
      },
      "application/vnd.is-xpr": {
        source: "iana",
        extensions: ["xpr"]
      },
      "application/vnd.isac.fcs": {
        source: "iana",
        extensions: ["fcs"]
      },
      "application/vnd.iso11783-10+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.jam": {
        source: "iana",
        extensions: ["jam"]
      },
      "application/vnd.japannet-directory-service": {
        source: "iana"
      },
      "application/vnd.japannet-jpnstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-payment-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-registration": {
        source: "iana"
      },
      "application/vnd.japannet-registration-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-setstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-verification": {
        source: "iana"
      },
      "application/vnd.japannet-verification-wakeup": {
        source: "iana"
      },
      "application/vnd.jcp.javame.midlet-rms": {
        source: "iana",
        extensions: ["rms"]
      },
      "application/vnd.jisp": {
        source: "iana",
        extensions: ["jisp"]
      },
      "application/vnd.joost.joda-archive": {
        source: "iana",
        extensions: ["joda"]
      },
      "application/vnd.jsk.isdn-ngn": {
        source: "iana"
      },
      "application/vnd.kahootz": {
        source: "iana",
        extensions: ["ktz", "ktr"]
      },
      "application/vnd.kde.karbon": {
        source: "iana",
        extensions: ["karbon"]
      },
      "application/vnd.kde.kchart": {
        source: "iana",
        extensions: ["chrt"]
      },
      "application/vnd.kde.kformula": {
        source: "iana",
        extensions: ["kfo"]
      },
      "application/vnd.kde.kivio": {
        source: "iana",
        extensions: ["flw"]
      },
      "application/vnd.kde.kontour": {
        source: "iana",
        extensions: ["kon"]
      },
      "application/vnd.kde.kpresenter": {
        source: "iana",
        extensions: ["kpr", "kpt"]
      },
      "application/vnd.kde.kspread": {
        source: "iana",
        extensions: ["ksp"]
      },
      "application/vnd.kde.kword": {
        source: "iana",
        extensions: ["kwd", "kwt"]
      },
      "application/vnd.kenameaapp": {
        source: "iana",
        extensions: ["htke"]
      },
      "application/vnd.kidspiration": {
        source: "iana",
        extensions: ["kia"]
      },
      "application/vnd.kinar": {
        source: "iana",
        extensions: ["kne", "knp"]
      },
      "application/vnd.koan": {
        source: "iana",
        extensions: ["skp", "skd", "skt", "skm"]
      },
      "application/vnd.kodak-descriptor": {
        source: "iana",
        extensions: ["sse"]
      },
      "application/vnd.las": {
        source: "iana"
      },
      "application/vnd.las.las+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.las.las+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lasxml"]
      },
      "application/vnd.laszip": {
        source: "iana"
      },
      "application/vnd.leap+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.liberty-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.llamagraphics.life-balance.desktop": {
        source: "iana",
        extensions: ["lbd"]
      },
      "application/vnd.llamagraphics.life-balance.exchange+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lbe"]
      },
      "application/vnd.logipipe.circuit+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.loom": {
        source: "iana"
      },
      "application/vnd.lotus-1-2-3": {
        source: "iana",
        extensions: ["123"]
      },
      "application/vnd.lotus-approach": {
        source: "iana",
        extensions: ["apr"]
      },
      "application/vnd.lotus-freelance": {
        source: "iana",
        extensions: ["pre"]
      },
      "application/vnd.lotus-notes": {
        source: "iana",
        extensions: ["nsf"]
      },
      "application/vnd.lotus-organizer": {
        source: "iana",
        extensions: ["org"]
      },
      "application/vnd.lotus-screencam": {
        source: "iana",
        extensions: ["scm"]
      },
      "application/vnd.lotus-wordpro": {
        source: "iana",
        extensions: ["lwp"]
      },
      "application/vnd.macports.portpkg": {
        source: "iana",
        extensions: ["portpkg"]
      },
      "application/vnd.mapbox-vector-tile": {
        source: "iana",
        extensions: ["mvt"]
      },
      "application/vnd.marlin.drm.actiontoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.conftoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.license+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.mdcf": {
        source: "iana"
      },
      "application/vnd.mason+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.maxar.archive.3tz+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.maxmind.maxmind-db": {
        source: "iana"
      },
      "application/vnd.mcd": {
        source: "iana",
        extensions: ["mcd"]
      },
      "application/vnd.medcalcdata": {
        source: "iana",
        extensions: ["mc1"]
      },
      "application/vnd.mediastation.cdkey": {
        source: "iana",
        extensions: ["cdkey"]
      },
      "application/vnd.meridian-slingshot": {
        source: "iana"
      },
      "application/vnd.mfer": {
        source: "iana",
        extensions: ["mwf"]
      },
      "application/vnd.mfmp": {
        source: "iana",
        extensions: ["mfm"]
      },
      "application/vnd.micro+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.micrografx.flo": {
        source: "iana",
        extensions: ["flo"]
      },
      "application/vnd.micrografx.igx": {
        source: "iana",
        extensions: ["igx"]
      },
      "application/vnd.microsoft.portable-executable": {
        source: "iana"
      },
      "application/vnd.microsoft.windows.thumbnail-cache": {
        source: "iana"
      },
      "application/vnd.miele+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.mif": {
        source: "iana",
        extensions: ["mif"]
      },
      "application/vnd.minisoft-hp3000-save": {
        source: "iana"
      },
      "application/vnd.mitsubishi.misty-guard.trustweb": {
        source: "iana"
      },
      "application/vnd.mobius.daf": {
        source: "iana",
        extensions: ["daf"]
      },
      "application/vnd.mobius.dis": {
        source: "iana",
        extensions: ["dis"]
      },
      "application/vnd.mobius.mbk": {
        source: "iana",
        extensions: ["mbk"]
      },
      "application/vnd.mobius.mqy": {
        source: "iana",
        extensions: ["mqy"]
      },
      "application/vnd.mobius.msl": {
        source: "iana",
        extensions: ["msl"]
      },
      "application/vnd.mobius.plc": {
        source: "iana",
        extensions: ["plc"]
      },
      "application/vnd.mobius.txf": {
        source: "iana",
        extensions: ["txf"]
      },
      "application/vnd.mophun.application": {
        source: "iana",
        extensions: ["mpn"]
      },
      "application/vnd.mophun.certificate": {
        source: "iana",
        extensions: ["mpc"]
      },
      "application/vnd.motorola.flexsuite": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.adsi": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.fis": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.gotap": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.kmr": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.ttc": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.wem": {
        source: "iana"
      },
      "application/vnd.motorola.iprm": {
        source: "iana"
      },
      "application/vnd.mozilla.xul+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xul"]
      },
      "application/vnd.ms-3mfdocument": {
        source: "iana"
      },
      "application/vnd.ms-artgalry": {
        source: "iana",
        extensions: ["cil"]
      },
      "application/vnd.ms-asf": {
        source: "iana"
      },
      "application/vnd.ms-cab-compressed": {
        source: "iana",
        extensions: ["cab"]
      },
      "application/vnd.ms-color.iccprofile": {
        source: "apache"
      },
      "application/vnd.ms-excel": {
        source: "iana",
        compressible: false,
        extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"]
      },
      "application/vnd.ms-excel.addin.macroenabled.12": {
        source: "iana",
        extensions: ["xlam"]
      },
      "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
        source: "iana",
        extensions: ["xlsb"]
      },
      "application/vnd.ms-excel.sheet.macroenabled.12": {
        source: "iana",
        extensions: ["xlsm"]
      },
      "application/vnd.ms-excel.template.macroenabled.12": {
        source: "iana",
        extensions: ["xltm"]
      },
      "application/vnd.ms-fontobject": {
        source: "iana",
        compressible: true,
        extensions: ["eot"]
      },
      "application/vnd.ms-htmlhelp": {
        source: "iana",
        extensions: ["chm"]
      },
      "application/vnd.ms-ims": {
        source: "iana",
        extensions: ["ims"]
      },
      "application/vnd.ms-lrm": {
        source: "iana",
        extensions: ["lrm"]
      },
      "application/vnd.ms-office.activex+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-officetheme": {
        source: "iana",
        extensions: ["thmx"]
      },
      "application/vnd.ms-opentype": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-outlook": {
        compressible: false,
        extensions: ["msg"]
      },
      "application/vnd.ms-package.obfuscated-opentype": {
        source: "apache"
      },
      "application/vnd.ms-pki.seccat": {
        source: "apache",
        extensions: ["cat"]
      },
      "application/vnd.ms-pki.stl": {
        source: "apache",
        extensions: ["stl"]
      },
      "application/vnd.ms-playready.initiator+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-powerpoint": {
        source: "iana",
        compressible: false,
        extensions: ["ppt", "pps", "pot"]
      },
      "application/vnd.ms-powerpoint.addin.macroenabled.12": {
        source: "iana",
        extensions: ["ppam"]
      },
      "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
        source: "iana",
        extensions: ["pptm"]
      },
      "application/vnd.ms-powerpoint.slide.macroenabled.12": {
        source: "iana",
        extensions: ["sldm"]
      },
      "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
        source: "iana",
        extensions: ["ppsm"]
      },
      "application/vnd.ms-powerpoint.template.macroenabled.12": {
        source: "iana",
        extensions: ["potm"]
      },
      "application/vnd.ms-printdevicecapabilities+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-printing.printticket+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-printschematicket+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-project": {
        source: "iana",
        extensions: ["mpp", "mpt"]
      },
      "application/vnd.ms-tnef": {
        source: "iana"
      },
      "application/vnd.ms-windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.nwprinting.oob": {
        source: "iana"
      },
      "application/vnd.ms-windows.printerpairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.wsd.oob": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-resp": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-resp": {
        source: "iana"
      },
      "application/vnd.ms-word.document.macroenabled.12": {
        source: "iana",
        extensions: ["docm"]
      },
      "application/vnd.ms-word.template.macroenabled.12": {
        source: "iana",
        extensions: ["dotm"]
      },
      "application/vnd.ms-works": {
        source: "iana",
        extensions: ["wps", "wks", "wcm", "wdb"]
      },
      "application/vnd.ms-wpl": {
        source: "iana",
        extensions: ["wpl"]
      },
      "application/vnd.ms-xpsdocument": {
        source: "iana",
        compressible: false,
        extensions: ["xps"]
      },
      "application/vnd.msa-disk-image": {
        source: "iana"
      },
      "application/vnd.mseq": {
        source: "iana",
        extensions: ["mseq"]
      },
      "application/vnd.msign": {
        source: "iana"
      },
      "application/vnd.multiad.creator": {
        source: "iana"
      },
      "application/vnd.multiad.creator.cif": {
        source: "iana"
      },
      "application/vnd.music-niff": {
        source: "iana"
      },
      "application/vnd.musician": {
        source: "iana",
        extensions: ["mus"]
      },
      "application/vnd.muvee.style": {
        source: "iana",
        extensions: ["msty"]
      },
      "application/vnd.mynfc": {
        source: "iana",
        extensions: ["taglet"]
      },
      "application/vnd.nacamar.ybrid+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ncd.control": {
        source: "iana"
      },
      "application/vnd.ncd.reference": {
        source: "iana"
      },
      "application/vnd.nearst.inv+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nebumind.line": {
        source: "iana"
      },
      "application/vnd.nervana": {
        source: "iana"
      },
      "application/vnd.netfpx": {
        source: "iana"
      },
      "application/vnd.neurolanguage.nlu": {
        source: "iana",
        extensions: ["nlu"]
      },
      "application/vnd.nimn": {
        source: "iana"
      },
      "application/vnd.nintendo.nitro.rom": {
        source: "iana"
      },
      "application/vnd.nintendo.snes.rom": {
        source: "iana"
      },
      "application/vnd.nitf": {
        source: "iana",
        extensions: ["ntf", "nitf"]
      },
      "application/vnd.noblenet-directory": {
        source: "iana",
        extensions: ["nnd"]
      },
      "application/vnd.noblenet-sealer": {
        source: "iana",
        extensions: ["nns"]
      },
      "application/vnd.noblenet-web": {
        source: "iana",
        extensions: ["nnw"]
      },
      "application/vnd.nokia.catalogs": {
        source: "iana"
      },
      "application/vnd.nokia.conml+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.conml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.iptv.config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.isds-radio-presets": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.landmarkcollection+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.n-gage.ac+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ac"]
      },
      "application/vnd.nokia.n-gage.data": {
        source: "iana",
        extensions: ["ngdat"]
      },
      "application/vnd.nokia.n-gage.symbian.install": {
        source: "iana",
        extensions: ["n-gage"]
      },
      "application/vnd.nokia.ncd": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.radio-preset": {
        source: "iana",
        extensions: ["rpst"]
      },
      "application/vnd.nokia.radio-presets": {
        source: "iana",
        extensions: ["rpss"]
      },
      "application/vnd.novadigm.edm": {
        source: "iana",
        extensions: ["edm"]
      },
      "application/vnd.novadigm.edx": {
        source: "iana",
        extensions: ["edx"]
      },
      "application/vnd.novadigm.ext": {
        source: "iana",
        extensions: ["ext"]
      },
      "application/vnd.ntt-local.content-share": {
        source: "iana"
      },
      "application/vnd.ntt-local.file-transfer": {
        source: "iana"
      },
      "application/vnd.ntt-local.ogw_remote-access": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_remote": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_tcp_stream": {
        source: "iana"
      },
      "application/vnd.oasis.opendocument.chart": {
        source: "iana",
        extensions: ["odc"]
      },
      "application/vnd.oasis.opendocument.chart-template": {
        source: "iana",
        extensions: ["otc"]
      },
      "application/vnd.oasis.opendocument.database": {
        source: "iana",
        extensions: ["odb"]
      },
      "application/vnd.oasis.opendocument.formula": {
        source: "iana",
        extensions: ["odf"]
      },
      "application/vnd.oasis.opendocument.formula-template": {
        source: "iana",
        extensions: ["odft"]
      },
      "application/vnd.oasis.opendocument.graphics": {
        source: "iana",
        compressible: false,
        extensions: ["odg"]
      },
      "application/vnd.oasis.opendocument.graphics-template": {
        source: "iana",
        extensions: ["otg"]
      },
      "application/vnd.oasis.opendocument.image": {
        source: "iana",
        extensions: ["odi"]
      },
      "application/vnd.oasis.opendocument.image-template": {
        source: "iana",
        extensions: ["oti"]
      },
      "application/vnd.oasis.opendocument.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["odp"]
      },
      "application/vnd.oasis.opendocument.presentation-template": {
        source: "iana",
        extensions: ["otp"]
      },
      "application/vnd.oasis.opendocument.spreadsheet": {
        source: "iana",
        compressible: false,
        extensions: ["ods"]
      },
      "application/vnd.oasis.opendocument.spreadsheet-template": {
        source: "iana",
        extensions: ["ots"]
      },
      "application/vnd.oasis.opendocument.text": {
        source: "iana",
        compressible: false,
        extensions: ["odt"]
      },
      "application/vnd.oasis.opendocument.text-master": {
        source: "iana",
        extensions: ["odm"]
      },
      "application/vnd.oasis.opendocument.text-template": {
        source: "iana",
        extensions: ["ott"]
      },
      "application/vnd.oasis.opendocument.text-web": {
        source: "iana",
        extensions: ["oth"]
      },
      "application/vnd.obn": {
        source: "iana"
      },
      "application/vnd.ocf+cbor": {
        source: "iana"
      },
      "application/vnd.oci.image.manifest.v1+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oftn.l10n+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessdownload+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessstreaming+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.cspg-hexbinary": {
        source: "iana"
      },
      "application/vnd.oipf.dae.svg+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.dae.xhtml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.mippvcontrolmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.pae.gem": {
        source: "iana"
      },
      "application/vnd.oipf.spdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.spdlist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.ueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.userprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.olpc-sugar": {
        source: "iana",
        extensions: ["xo"]
      },
      "application/vnd.oma-scws-config": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-request": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-response": {
        source: "iana"
      },
      "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.drm-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.imd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.ltkm": {
        source: "iana"
      },
      "application/vnd.oma.bcast.notification+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.provisioningtrigger": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgboot": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgdd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sgdu": {
        source: "iana"
      },
      "application/vnd.oma.bcast.simple-symbol-container": {
        source: "iana"
      },
      "application/vnd.oma.bcast.smartcard-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sprov+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.stkm": {
        source: "iana"
      },
      "application/vnd.oma.cab-address-book+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-feature-handler+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-pcc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-subs-invite+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-user-prefs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.dcd": {
        source: "iana"
      },
      "application/vnd.oma.dcdc": {
        source: "iana"
      },
      "application/vnd.oma.dd2+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dd2"]
      },
      "application/vnd.oma.drm.risd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.group-usage-list+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+cbor": {
        source: "iana"
      },
      "application/vnd.oma.lwm2m+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+tlv": {
        source: "iana"
      },
      "application/vnd.oma.pal+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.detailed-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.final-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.groups+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.invocation-descriptor+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.optimized-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.push": {
        source: "iana"
      },
      "application/vnd.oma.scidm.messages+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.xcap-directory+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.omads-email+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-file+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-folder+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omaloc-supl-init": {
        source: "iana"
      },
      "application/vnd.onepager": {
        source: "iana"
      },
      "application/vnd.onepagertamp": {
        source: "iana"
      },
      "application/vnd.onepagertamx": {
        source: "iana"
      },
      "application/vnd.onepagertat": {
        source: "iana"
      },
      "application/vnd.onepagertatp": {
        source: "iana"
      },
      "application/vnd.onepagertatx": {
        source: "iana"
      },
      "application/vnd.openblox.game+xml": {
        source: "iana",
        compressible: true,
        extensions: ["obgx"]
      },
      "application/vnd.openblox.game-binary": {
        source: "iana"
      },
      "application/vnd.openeye.oeb": {
        source: "iana"
      },
      "application/vnd.openofficeorg.extension": {
        source: "apache",
        extensions: ["oxt"]
      },
      "application/vnd.openstreetmap.data+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osm"]
      },
      "application/vnd.opentimestamps.ots": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawing+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["pptx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide": {
        source: "iana",
        extensions: ["sldx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
        source: "iana",
        extensions: ["ppsx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template": {
        source: "iana",
        extensions: ["potx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        source: "iana",
        compressible: false,
        extensions: ["xlsx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
        source: "iana",
        extensions: ["xltx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.theme+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.vmldrawing": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        source: "iana",
        compressible: false,
        extensions: ["docx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
        source: "iana",
        extensions: ["dotx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.core-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.relationships+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oracle.resource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.orange.indata": {
        source: "iana"
      },
      "application/vnd.osa.netdeploy": {
        source: "iana"
      },
      "application/vnd.osgeo.mapguide.package": {
        source: "iana",
        extensions: ["mgp"]
      },
      "application/vnd.osgi.bundle": {
        source: "iana"
      },
      "application/vnd.osgi.dp": {
        source: "iana",
        extensions: ["dp"]
      },
      "application/vnd.osgi.subsystem": {
        source: "iana",
        extensions: ["esa"]
      },
      "application/vnd.otps.ct-kip+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oxli.countgraph": {
        source: "iana"
      },
      "application/vnd.pagerduty+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.palm": {
        source: "iana",
        extensions: ["pdb", "pqa", "oprc"]
      },
      "application/vnd.panoply": {
        source: "iana"
      },
      "application/vnd.paos.xml": {
        source: "iana"
      },
      "application/vnd.patentdive": {
        source: "iana"
      },
      "application/vnd.patientecommsdoc": {
        source: "iana"
      },
      "application/vnd.pawaafile": {
        source: "iana",
        extensions: ["paw"]
      },
      "application/vnd.pcos": {
        source: "iana"
      },
      "application/vnd.pg.format": {
        source: "iana",
        extensions: ["str"]
      },
      "application/vnd.pg.osasli": {
        source: "iana",
        extensions: ["ei6"]
      },
      "application/vnd.piaccess.application-licence": {
        source: "iana"
      },
      "application/vnd.picsel": {
        source: "iana",
        extensions: ["efif"]
      },
      "application/vnd.pmi.widget": {
        source: "iana",
        extensions: ["wg"]
      },
      "application/vnd.poc.group-advertisement+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.pocketlearn": {
        source: "iana",
        extensions: ["plf"]
      },
      "application/vnd.powerbuilder6": {
        source: "iana",
        extensions: ["pbd"]
      },
      "application/vnd.powerbuilder6-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder7": {
        source: "iana"
      },
      "application/vnd.powerbuilder7-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder75": {
        source: "iana"
      },
      "application/vnd.powerbuilder75-s": {
        source: "iana"
      },
      "application/vnd.preminet": {
        source: "iana"
      },
      "application/vnd.previewsystems.box": {
        source: "iana",
        extensions: ["box"]
      },
      "application/vnd.proteus.magazine": {
        source: "iana",
        extensions: ["mgz"]
      },
      "application/vnd.psfs": {
        source: "iana"
      },
      "application/vnd.publishare-delta-tree": {
        source: "iana",
        extensions: ["qps"]
      },
      "application/vnd.pvi.ptid1": {
        source: "iana",
        extensions: ["ptid"]
      },
      "application/vnd.pwg-multiplexed": {
        source: "iana"
      },
      "application/vnd.pwg-xhtml-print+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.qualcomm.brew-app-res": {
        source: "iana"
      },
      "application/vnd.quarantainenet": {
        source: "iana"
      },
      "application/vnd.quark.quarkxpress": {
        source: "iana",
        extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"]
      },
      "application/vnd.quobject-quoxdocument": {
        source: "iana"
      },
      "application/vnd.radisys.moml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-stream+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-base+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-detect+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-group+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-speech+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-transform+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rainstor.data": {
        source: "iana"
      },
      "application/vnd.rapid": {
        source: "iana"
      },
      "application/vnd.rar": {
        source: "iana",
        extensions: ["rar"]
      },
      "application/vnd.realvnc.bed": {
        source: "iana",
        extensions: ["bed"]
      },
      "application/vnd.recordare.musicxml": {
        source: "iana",
        extensions: ["mxl"]
      },
      "application/vnd.recordare.musicxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musicxml"]
      },
      "application/vnd.renlearn.rlprint": {
        source: "iana"
      },
      "application/vnd.resilient.logic": {
        source: "iana"
      },
      "application/vnd.restful+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rig.cryptonote": {
        source: "iana",
        extensions: ["cryptonote"]
      },
      "application/vnd.rim.cod": {
        source: "apache",
        extensions: ["cod"]
      },
      "application/vnd.rn-realmedia": {
        source: "apache",
        extensions: ["rm"]
      },
      "application/vnd.rn-realmedia-vbr": {
        source: "apache",
        extensions: ["rmvb"]
      },
      "application/vnd.route66.link66+xml": {
        source: "iana",
        compressible: true,
        extensions: ["link66"]
      },
      "application/vnd.rs-274x": {
        source: "iana"
      },
      "application/vnd.ruckus.download": {
        source: "iana"
      },
      "application/vnd.s3sms": {
        source: "iana"
      },
      "application/vnd.sailingtracker.track": {
        source: "iana",
        extensions: ["st"]
      },
      "application/vnd.sar": {
        source: "iana"
      },
      "application/vnd.sbm.cid": {
        source: "iana"
      },
      "application/vnd.sbm.mid2": {
        source: "iana"
      },
      "application/vnd.scribus": {
        source: "iana"
      },
      "application/vnd.sealed.3df": {
        source: "iana"
      },
      "application/vnd.sealed.csf": {
        source: "iana"
      },
      "application/vnd.sealed.doc": {
        source: "iana"
      },
      "application/vnd.sealed.eml": {
        source: "iana"
      },
      "application/vnd.sealed.mht": {
        source: "iana"
      },
      "application/vnd.sealed.net": {
        source: "iana"
      },
      "application/vnd.sealed.ppt": {
        source: "iana"
      },
      "application/vnd.sealed.tiff": {
        source: "iana"
      },
      "application/vnd.sealed.xls": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.html": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.pdf": {
        source: "iana"
      },
      "application/vnd.seemail": {
        source: "iana",
        extensions: ["see"]
      },
      "application/vnd.seis+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.sema": {
        source: "iana",
        extensions: ["sema"]
      },
      "application/vnd.semd": {
        source: "iana",
        extensions: ["semd"]
      },
      "application/vnd.semf": {
        source: "iana",
        extensions: ["semf"]
      },
      "application/vnd.shade-save-file": {
        source: "iana"
      },
      "application/vnd.shana.informed.formdata": {
        source: "iana",
        extensions: ["ifm"]
      },
      "application/vnd.shana.informed.formtemplate": {
        source: "iana",
        extensions: ["itp"]
      },
      "application/vnd.shana.informed.interchange": {
        source: "iana",
        extensions: ["iif"]
      },
      "application/vnd.shana.informed.package": {
        source: "iana",
        extensions: ["ipk"]
      },
      "application/vnd.shootproof+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shopkick+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shp": {
        source: "iana"
      },
      "application/vnd.shx": {
        source: "iana"
      },
      "application/vnd.sigrok.session": {
        source: "iana"
      },
      "application/vnd.simtech-mindmapper": {
        source: "iana",
        extensions: ["twd", "twds"]
      },
      "application/vnd.siren+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.smaf": {
        source: "iana",
        extensions: ["mmf"]
      },
      "application/vnd.smart.notebook": {
        source: "iana"
      },
      "application/vnd.smart.teacher": {
        source: "iana",
        extensions: ["teacher"]
      },
      "application/vnd.snesdev-page-table": {
        source: "iana"
      },
      "application/vnd.software602.filler.form+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fo"]
      },
      "application/vnd.software602.filler.form-xml-zip": {
        source: "iana"
      },
      "application/vnd.solent.sdkm+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sdkm", "sdkd"]
      },
      "application/vnd.spotfire.dxp": {
        source: "iana",
        extensions: ["dxp"]
      },
      "application/vnd.spotfire.sfs": {
        source: "iana",
        extensions: ["sfs"]
      },
      "application/vnd.sqlite3": {
        source: "iana"
      },
      "application/vnd.sss-cod": {
        source: "iana"
      },
      "application/vnd.sss-dtf": {
        source: "iana"
      },
      "application/vnd.sss-ntf": {
        source: "iana"
      },
      "application/vnd.stardivision.calc": {
        source: "apache",
        extensions: ["sdc"]
      },
      "application/vnd.stardivision.draw": {
        source: "apache",
        extensions: ["sda"]
      },
      "application/vnd.stardivision.impress": {
        source: "apache",
        extensions: ["sdd"]
      },
      "application/vnd.stardivision.math": {
        source: "apache",
        extensions: ["smf"]
      },
      "application/vnd.stardivision.writer": {
        source: "apache",
        extensions: ["sdw", "vor"]
      },
      "application/vnd.stardivision.writer-global": {
        source: "apache",
        extensions: ["sgl"]
      },
      "application/vnd.stepmania.package": {
        source: "iana",
        extensions: ["smzip"]
      },
      "application/vnd.stepmania.stepchart": {
        source: "iana",
        extensions: ["sm"]
      },
      "application/vnd.street-stream": {
        source: "iana"
      },
      "application/vnd.sun.wadl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wadl"]
      },
      "application/vnd.sun.xml.calc": {
        source: "apache",
        extensions: ["sxc"]
      },
      "application/vnd.sun.xml.calc.template": {
        source: "apache",
        extensions: ["stc"]
      },
      "application/vnd.sun.xml.draw": {
        source: "apache",
        extensions: ["sxd"]
      },
      "application/vnd.sun.xml.draw.template": {
        source: "apache",
        extensions: ["std"]
      },
      "application/vnd.sun.xml.impress": {
        source: "apache",
        extensions: ["sxi"]
      },
      "application/vnd.sun.xml.impress.template": {
        source: "apache",
        extensions: ["sti"]
      },
      "application/vnd.sun.xml.math": {
        source: "apache",
        extensions: ["sxm"]
      },
      "application/vnd.sun.xml.writer": {
        source: "apache",
        extensions: ["sxw"]
      },
      "application/vnd.sun.xml.writer.global": {
        source: "apache",
        extensions: ["sxg"]
      },
      "application/vnd.sun.xml.writer.template": {
        source: "apache",
        extensions: ["stw"]
      },
      "application/vnd.sus-calendar": {
        source: "iana",
        extensions: ["sus", "susp"]
      },
      "application/vnd.svd": {
        source: "iana",
        extensions: ["svd"]
      },
      "application/vnd.swiftview-ics": {
        source: "iana"
      },
      "application/vnd.sycle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.syft+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.symbian.install": {
        source: "apache",
        extensions: ["sis", "sisx"]
      },
      "application/vnd.syncml+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xsm"]
      },
      "application/vnd.syncml.dm+wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["bdm"]
      },
      "application/vnd.syncml.dm+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xdm"]
      },
      "application/vnd.syncml.dm.notification": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["ddf"]
      },
      "application/vnd.syncml.dmtnds+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmtnds+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.syncml.ds.notification": {
        source: "iana"
      },
      "application/vnd.tableschema+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tao.intent-module-archive": {
        source: "iana",
        extensions: ["tao"]
      },
      "application/vnd.tcpdump.pcap": {
        source: "iana",
        extensions: ["pcap", "cap", "dmp"]
      },
      "application/vnd.think-cell.ppttc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tmd.mediaflex.api+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tml": {
        source: "iana"
      },
      "application/vnd.tmobile-livetv": {
        source: "iana",
        extensions: ["tmo"]
      },
      "application/vnd.tri.onesource": {
        source: "iana"
      },
      "application/vnd.trid.tpt": {
        source: "iana",
        extensions: ["tpt"]
      },
      "application/vnd.triscape.mxs": {
        source: "iana",
        extensions: ["mxs"]
      },
      "application/vnd.trueapp": {
        source: "iana",
        extensions: ["tra"]
      },
      "application/vnd.truedoc": {
        source: "iana"
      },
      "application/vnd.ubisoft.webplayer": {
        source: "iana"
      },
      "application/vnd.ufdl": {
        source: "iana",
        extensions: ["ufd", "ufdl"]
      },
      "application/vnd.uiq.theme": {
        source: "iana",
        extensions: ["utz"]
      },
      "application/vnd.umajin": {
        source: "iana",
        extensions: ["umj"]
      },
      "application/vnd.unity": {
        source: "iana",
        extensions: ["unityweb"]
      },
      "application/vnd.uoml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uoml"]
      },
      "application/vnd.uplanet.alert": {
        source: "iana"
      },
      "application/vnd.uplanet.alert-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.channel": {
        source: "iana"
      },
      "application/vnd.uplanet.channel-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.list": {
        source: "iana"
      },
      "application/vnd.uplanet.list-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.signal": {
        source: "iana"
      },
      "application/vnd.uri-map": {
        source: "iana"
      },
      "application/vnd.valve.source.material": {
        source: "iana"
      },
      "application/vnd.vcx": {
        source: "iana",
        extensions: ["vcx"]
      },
      "application/vnd.vd-study": {
        source: "iana"
      },
      "application/vnd.vectorworks": {
        source: "iana"
      },
      "application/vnd.vel+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.verimatrix.vcas": {
        source: "iana"
      },
      "application/vnd.veritone.aion+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.veryant.thin": {
        source: "iana"
      },
      "application/vnd.ves.encrypted": {
        source: "iana"
      },
      "application/vnd.vidsoft.vidconference": {
        source: "iana"
      },
      "application/vnd.visio": {
        source: "iana",
        extensions: ["vsd", "vst", "vss", "vsw"]
      },
      "application/vnd.visionary": {
        source: "iana",
        extensions: ["vis"]
      },
      "application/vnd.vividence.scriptfile": {
        source: "iana"
      },
      "application/vnd.vsf": {
        source: "iana",
        extensions: ["vsf"]
      },
      "application/vnd.wap.sic": {
        source: "iana"
      },
      "application/vnd.wap.slc": {
        source: "iana"
      },
      "application/vnd.wap.wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["wbxml"]
      },
      "application/vnd.wap.wmlc": {
        source: "iana",
        extensions: ["wmlc"]
      },
      "application/vnd.wap.wmlscriptc": {
        source: "iana",
        extensions: ["wmlsc"]
      },
      "application/vnd.webturbo": {
        source: "iana",
        extensions: ["wtb"]
      },
      "application/vnd.wfa.dpp": {
        source: "iana"
      },
      "application/vnd.wfa.p2p": {
        source: "iana"
      },
      "application/vnd.wfa.wsc": {
        source: "iana"
      },
      "application/vnd.windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.wmc": {
        source: "iana"
      },
      "application/vnd.wmf.bootstrap": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica.package": {
        source: "iana"
      },
      "application/vnd.wolfram.player": {
        source: "iana",
        extensions: ["nbp"]
      },
      "application/vnd.wordperfect": {
        source: "iana",
        extensions: ["wpd"]
      },
      "application/vnd.wqd": {
        source: "iana",
        extensions: ["wqd"]
      },
      "application/vnd.wrq-hp3000-labelled": {
        source: "iana"
      },
      "application/vnd.wt.stf": {
        source: "iana",
        extensions: ["stf"]
      },
      "application/vnd.wv.csp+wbxml": {
        source: "iana"
      },
      "application/vnd.wv.csp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.wv.ssp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xacml+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xara": {
        source: "iana",
        extensions: ["xar"]
      },
      "application/vnd.xfdl": {
        source: "iana",
        extensions: ["xfdl"]
      },
      "application/vnd.xfdl.webform": {
        source: "iana"
      },
      "application/vnd.xmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xmpie.cpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.dpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.plan": {
        source: "iana"
      },
      "application/vnd.xmpie.ppkg": {
        source: "iana"
      },
      "application/vnd.xmpie.xlim": {
        source: "iana"
      },
      "application/vnd.yamaha.hv-dic": {
        source: "iana",
        extensions: ["hvd"]
      },
      "application/vnd.yamaha.hv-script": {
        source: "iana",
        extensions: ["hvs"]
      },
      "application/vnd.yamaha.hv-voice": {
        source: "iana",
        extensions: ["hvp"]
      },
      "application/vnd.yamaha.openscoreformat": {
        source: "iana",
        extensions: ["osf"]
      },
      "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osfpvg"]
      },
      "application/vnd.yamaha.remote-setup": {
        source: "iana"
      },
      "application/vnd.yamaha.smaf-audio": {
        source: "iana",
        extensions: ["saf"]
      },
      "application/vnd.yamaha.smaf-phrase": {
        source: "iana",
        extensions: ["spf"]
      },
      "application/vnd.yamaha.through-ngn": {
        source: "iana"
      },
      "application/vnd.yamaha.tunnel-udpencap": {
        source: "iana"
      },
      "application/vnd.yaoweme": {
        source: "iana"
      },
      "application/vnd.yellowriver-custom-menu": {
        source: "iana",
        extensions: ["cmp"]
      },
      "application/vnd.youtube.yt": {
        source: "iana"
      },
      "application/vnd.zul": {
        source: "iana",
        extensions: ["zir", "zirz"]
      },
      "application/vnd.zzazz.deck+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zaz"]
      },
      "application/voicexml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["vxml"]
      },
      "application/voucher-cms+json": {
        source: "iana",
        compressible: true
      },
      "application/vq-rtcpxr": {
        source: "iana"
      },
      "application/wasm": {
        source: "iana",
        compressible: true,
        extensions: ["wasm"]
      },
      "application/watcherinfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wif"]
      },
      "application/webpush-options+json": {
        source: "iana",
        compressible: true
      },
      "application/whoispp-query": {
        source: "iana"
      },
      "application/whoispp-response": {
        source: "iana"
      },
      "application/widget": {
        source: "iana",
        extensions: ["wgt"]
      },
      "application/winhlp": {
        source: "apache",
        extensions: ["hlp"]
      },
      "application/wita": {
        source: "iana"
      },
      "application/wordperfect5.1": {
        source: "iana"
      },
      "application/wsdl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wsdl"]
      },
      "application/wspolicy+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wspolicy"]
      },
      "application/x-7z-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["7z"]
      },
      "application/x-abiword": {
        source: "apache",
        extensions: ["abw"]
      },
      "application/x-ace-compressed": {
        source: "apache",
        extensions: ["ace"]
      },
      "application/x-amf": {
        source: "apache"
      },
      "application/x-apple-diskimage": {
        source: "apache",
        extensions: ["dmg"]
      },
      "application/x-arj": {
        compressible: false,
        extensions: ["arj"]
      },
      "application/x-authorware-bin": {
        source: "apache",
        extensions: ["aab", "x32", "u32", "vox"]
      },
      "application/x-authorware-map": {
        source: "apache",
        extensions: ["aam"]
      },
      "application/x-authorware-seg": {
        source: "apache",
        extensions: ["aas"]
      },
      "application/x-bcpio": {
        source: "apache",
        extensions: ["bcpio"]
      },
      "application/x-bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/x-bittorrent": {
        source: "apache",
        extensions: ["torrent"]
      },
      "application/x-blorb": {
        source: "apache",
        extensions: ["blb", "blorb"]
      },
      "application/x-bzip": {
        source: "apache",
        compressible: false,
        extensions: ["bz"]
      },
      "application/x-bzip2": {
        source: "apache",
        compressible: false,
        extensions: ["bz2", "boz"]
      },
      "application/x-cbr": {
        source: "apache",
        extensions: ["cbr", "cba", "cbt", "cbz", "cb7"]
      },
      "application/x-cdlink": {
        source: "apache",
        extensions: ["vcd"]
      },
      "application/x-cfs-compressed": {
        source: "apache",
        extensions: ["cfs"]
      },
      "application/x-chat": {
        source: "apache",
        extensions: ["chat"]
      },
      "application/x-chess-pgn": {
        source: "apache",
        extensions: ["pgn"]
      },
      "application/x-chrome-extension": {
        extensions: ["crx"]
      },
      "application/x-cocoa": {
        source: "nginx",
        extensions: ["cco"]
      },
      "application/x-compress": {
        source: "apache"
      },
      "application/x-conference": {
        source: "apache",
        extensions: ["nsc"]
      },
      "application/x-cpio": {
        source: "apache",
        extensions: ["cpio"]
      },
      "application/x-csh": {
        source: "apache",
        extensions: ["csh"]
      },
      "application/x-deb": {
        compressible: false
      },
      "application/x-debian-package": {
        source: "apache",
        extensions: ["deb", "udeb"]
      },
      "application/x-dgc-compressed": {
        source: "apache",
        extensions: ["dgc"]
      },
      "application/x-director": {
        source: "apache",
        extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"]
      },
      "application/x-doom": {
        source: "apache",
        extensions: ["wad"]
      },
      "application/x-dtbncx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ncx"]
      },
      "application/x-dtbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dtb"]
      },
      "application/x-dtbresource+xml": {
        source: "apache",
        compressible: true,
        extensions: ["res"]
      },
      "application/x-dvi": {
        source: "apache",
        compressible: false,
        extensions: ["dvi"]
      },
      "application/x-envoy": {
        source: "apache",
        extensions: ["evy"]
      },
      "application/x-eva": {
        source: "apache",
        extensions: ["eva"]
      },
      "application/x-font-bdf": {
        source: "apache",
        extensions: ["bdf"]
      },
      "application/x-font-dos": {
        source: "apache"
      },
      "application/x-font-framemaker": {
        source: "apache"
      },
      "application/x-font-ghostscript": {
        source: "apache",
        extensions: ["gsf"]
      },
      "application/x-font-libgrx": {
        source: "apache"
      },
      "application/x-font-linux-psf": {
        source: "apache",
        extensions: ["psf"]
      },
      "application/x-font-pcf": {
        source: "apache",
        extensions: ["pcf"]
      },
      "application/x-font-snf": {
        source: "apache",
        extensions: ["snf"]
      },
      "application/x-font-speedo": {
        source: "apache"
      },
      "application/x-font-sunos-news": {
        source: "apache"
      },
      "application/x-font-type1": {
        source: "apache",
        extensions: ["pfa", "pfb", "pfm", "afm"]
      },
      "application/x-font-vfont": {
        source: "apache"
      },
      "application/x-freearc": {
        source: "apache",
        extensions: ["arc"]
      },
      "application/x-futuresplash": {
        source: "apache",
        extensions: ["spl"]
      },
      "application/x-gca-compressed": {
        source: "apache",
        extensions: ["gca"]
      },
      "application/x-glulx": {
        source: "apache",
        extensions: ["ulx"]
      },
      "application/x-gnumeric": {
        source: "apache",
        extensions: ["gnumeric"]
      },
      "application/x-gramps-xml": {
        source: "apache",
        extensions: ["gramps"]
      },
      "application/x-gtar": {
        source: "apache",
        extensions: ["gtar"]
      },
      "application/x-gzip": {
        source: "apache"
      },
      "application/x-hdf": {
        source: "apache",
        extensions: ["hdf"]
      },
      "application/x-httpd-php": {
        compressible: true,
        extensions: ["php"]
      },
      "application/x-install-instructions": {
        source: "apache",
        extensions: ["install"]
      },
      "application/x-iso9660-image": {
        source: "apache",
        extensions: ["iso"]
      },
      "application/x-iwork-keynote-sffkey": {
        extensions: ["key"]
      },
      "application/x-iwork-numbers-sffnumbers": {
        extensions: ["numbers"]
      },
      "application/x-iwork-pages-sffpages": {
        extensions: ["pages"]
      },
      "application/x-java-archive-diff": {
        source: "nginx",
        extensions: ["jardiff"]
      },
      "application/x-java-jnlp-file": {
        source: "apache",
        compressible: false,
        extensions: ["jnlp"]
      },
      "application/x-javascript": {
        compressible: true
      },
      "application/x-keepass2": {
        extensions: ["kdbx"]
      },
      "application/x-latex": {
        source: "apache",
        compressible: false,
        extensions: ["latex"]
      },
      "application/x-lua-bytecode": {
        extensions: ["luac"]
      },
      "application/x-lzh-compressed": {
        source: "apache",
        extensions: ["lzh", "lha"]
      },
      "application/x-makeself": {
        source: "nginx",
        extensions: ["run"]
      },
      "application/x-mie": {
        source: "apache",
        extensions: ["mie"]
      },
      "application/x-mobipocket-ebook": {
        source: "apache",
        extensions: ["prc", "mobi"]
      },
      "application/x-mpegurl": {
        compressible: false
      },
      "application/x-ms-application": {
        source: "apache",
        extensions: ["application"]
      },
      "application/x-ms-shortcut": {
        source: "apache",
        extensions: ["lnk"]
      },
      "application/x-ms-wmd": {
        source: "apache",
        extensions: ["wmd"]
      },
      "application/x-ms-wmz": {
        source: "apache",
        extensions: ["wmz"]
      },
      "application/x-ms-xbap": {
        source: "apache",
        extensions: ["xbap"]
      },
      "application/x-msaccess": {
        source: "apache",
        extensions: ["mdb"]
      },
      "application/x-msbinder": {
        source: "apache",
        extensions: ["obd"]
      },
      "application/x-mscardfile": {
        source: "apache",
        extensions: ["crd"]
      },
      "application/x-msclip": {
        source: "apache",
        extensions: ["clp"]
      },
      "application/x-msdos-program": {
        extensions: ["exe"]
      },
      "application/x-msdownload": {
        source: "apache",
        extensions: ["exe", "dll", "com", "bat", "msi"]
      },
      "application/x-msmediaview": {
        source: "apache",
        extensions: ["mvb", "m13", "m14"]
      },
      "application/x-msmetafile": {
        source: "apache",
        extensions: ["wmf", "wmz", "emf", "emz"]
      },
      "application/x-msmoney": {
        source: "apache",
        extensions: ["mny"]
      },
      "application/x-mspublisher": {
        source: "apache",
        extensions: ["pub"]
      },
      "application/x-msschedule": {
        source: "apache",
        extensions: ["scd"]
      },
      "application/x-msterminal": {
        source: "apache",
        extensions: ["trm"]
      },
      "application/x-mswrite": {
        source: "apache",
        extensions: ["wri"]
      },
      "application/x-netcdf": {
        source: "apache",
        extensions: ["nc", "cdf"]
      },
      "application/x-ns-proxy-autoconfig": {
        compressible: true,
        extensions: ["pac"]
      },
      "application/x-nzb": {
        source: "apache",
        extensions: ["nzb"]
      },
      "application/x-perl": {
        source: "nginx",
        extensions: ["pl", "pm"]
      },
      "application/x-pilot": {
        source: "nginx",
        extensions: ["prc", "pdb"]
      },
      "application/x-pkcs12": {
        source: "apache",
        compressible: false,
        extensions: ["p12", "pfx"]
      },
      "application/x-pkcs7-certificates": {
        source: "apache",
        extensions: ["p7b", "spc"]
      },
      "application/x-pkcs7-certreqresp": {
        source: "apache",
        extensions: ["p7r"]
      },
      "application/x-pki-message": {
        source: "iana"
      },
      "application/x-rar-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["rar"]
      },
      "application/x-redhat-package-manager": {
        source: "nginx",
        extensions: ["rpm"]
      },
      "application/x-research-info-systems": {
        source: "apache",
        extensions: ["ris"]
      },
      "application/x-sea": {
        source: "nginx",
        extensions: ["sea"]
      },
      "application/x-sh": {
        source: "apache",
        compressible: true,
        extensions: ["sh"]
      },
      "application/x-shar": {
        source: "apache",
        extensions: ["shar"]
      },
      "application/x-shockwave-flash": {
        source: "apache",
        compressible: false,
        extensions: ["swf"]
      },
      "application/x-silverlight-app": {
        source: "apache",
        extensions: ["xap"]
      },
      "application/x-sql": {
        source: "apache",
        extensions: ["sql"]
      },
      "application/x-stuffit": {
        source: "apache",
        compressible: false,
        extensions: ["sit"]
      },
      "application/x-stuffitx": {
        source: "apache",
        extensions: ["sitx"]
      },
      "application/x-subrip": {
        source: "apache",
        extensions: ["srt"]
      },
      "application/x-sv4cpio": {
        source: "apache",
        extensions: ["sv4cpio"]
      },
      "application/x-sv4crc": {
        source: "apache",
        extensions: ["sv4crc"]
      },
      "application/x-t3vm-image": {
        source: "apache",
        extensions: ["t3"]
      },
      "application/x-tads": {
        source: "apache",
        extensions: ["gam"]
      },
      "application/x-tar": {
        source: "apache",
        compressible: true,
        extensions: ["tar"]
      },
      "application/x-tcl": {
        source: "apache",
        extensions: ["tcl", "tk"]
      },
      "application/x-tex": {
        source: "apache",
        extensions: ["tex"]
      },
      "application/x-tex-tfm": {
        source: "apache",
        extensions: ["tfm"]
      },
      "application/x-texinfo": {
        source: "apache",
        extensions: ["texinfo", "texi"]
      },
      "application/x-tgif": {
        source: "apache",
        extensions: ["obj"]
      },
      "application/x-ustar": {
        source: "apache",
        extensions: ["ustar"]
      },
      "application/x-virtualbox-hdd": {
        compressible: true,
        extensions: ["hdd"]
      },
      "application/x-virtualbox-ova": {
        compressible: true,
        extensions: ["ova"]
      },
      "application/x-virtualbox-ovf": {
        compressible: true,
        extensions: ["ovf"]
      },
      "application/x-virtualbox-vbox": {
        compressible: true,
        extensions: ["vbox"]
      },
      "application/x-virtualbox-vbox-extpack": {
        compressible: false,
        extensions: ["vbox-extpack"]
      },
      "application/x-virtualbox-vdi": {
        compressible: true,
        extensions: ["vdi"]
      },
      "application/x-virtualbox-vhd": {
        compressible: true,
        extensions: ["vhd"]
      },
      "application/x-virtualbox-vmdk": {
        compressible: true,
        extensions: ["vmdk"]
      },
      "application/x-wais-source": {
        source: "apache",
        extensions: ["src"]
      },
      "application/x-web-app-manifest+json": {
        compressible: true,
        extensions: ["webapp"]
      },
      "application/x-www-form-urlencoded": {
        source: "iana",
        compressible: true
      },
      "application/x-x509-ca-cert": {
        source: "iana",
        extensions: ["der", "crt", "pem"]
      },
      "application/x-x509-ca-ra-cert": {
        source: "iana"
      },
      "application/x-x509-next-ca-cert": {
        source: "iana"
      },
      "application/x-xfig": {
        source: "apache",
        extensions: ["fig"]
      },
      "application/x-xliff+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/x-xpinstall": {
        source: "apache",
        compressible: false,
        extensions: ["xpi"]
      },
      "application/x-xz": {
        source: "apache",
        extensions: ["xz"]
      },
      "application/x-zmachine": {
        source: "apache",
        extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"]
      },
      "application/x400-bp": {
        source: "iana"
      },
      "application/xacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/xaml+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xaml"]
      },
      "application/xcap-att+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xav"]
      },
      "application/xcap-caps+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xca"]
      },
      "application/xcap-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdf"]
      },
      "application/xcap-el+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xel"]
      },
      "application/xcap-error+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcap-ns+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xns"]
      },
      "application/xcon-conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcon-conference-info-diff+xml": {
        source: "iana",
        compressible: true
      },
      "application/xenc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xenc"]
      },
      "application/xhtml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xhtml", "xht"]
      },
      "application/xhtml-voice+xml": {
        source: "apache",
        compressible: true
      },
      "application/xliff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml", "xsl", "xsd", "rng"]
      },
      "application/xml-dtd": {
        source: "iana",
        compressible: true,
        extensions: ["dtd"]
      },
      "application/xml-external-parsed-entity": {
        source: "iana"
      },
      "application/xml-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/xmpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/xop+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xop"]
      },
      "application/xproc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xpl"]
      },
      "application/xslt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xsl", "xslt"]
      },
      "application/xspf+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xspf"]
      },
      "application/xv+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mxml", "xhvml", "xvml", "xvm"]
      },
      "application/yang": {
        source: "iana",
        extensions: ["yang"]
      },
      "application/yang-data+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-data+xml": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/yin+xml": {
        source: "iana",
        compressible: true,
        extensions: ["yin"]
      },
      "application/zip": {
        source: "iana",
        compressible: false,
        extensions: ["zip"]
      },
      "application/zlib": {
        source: "iana"
      },
      "application/zstd": {
        source: "iana"
      },
      "audio/1d-interleaved-parityfec": {
        source: "iana"
      },
      "audio/32kadpcm": {
        source: "iana"
      },
      "audio/3gpp": {
        source: "iana",
        compressible: false,
        extensions: ["3gpp"]
      },
      "audio/3gpp2": {
        source: "iana"
      },
      "audio/aac": {
        source: "iana"
      },
      "audio/ac3": {
        source: "iana"
      },
      "audio/adpcm": {
        source: "apache",
        extensions: ["adp"]
      },
      "audio/amr": {
        source: "iana",
        extensions: ["amr"]
      },
      "audio/amr-wb": {
        source: "iana"
      },
      "audio/amr-wb+": {
        source: "iana"
      },
      "audio/aptx": {
        source: "iana"
      },
      "audio/asc": {
        source: "iana"
      },
      "audio/atrac-advanced-lossless": {
        source: "iana"
      },
      "audio/atrac-x": {
        source: "iana"
      },
      "audio/atrac3": {
        source: "iana"
      },
      "audio/basic": {
        source: "iana",
        compressible: false,
        extensions: ["au", "snd"]
      },
      "audio/bv16": {
        source: "iana"
      },
      "audio/bv32": {
        source: "iana"
      },
      "audio/clearmode": {
        source: "iana"
      },
      "audio/cn": {
        source: "iana"
      },
      "audio/dat12": {
        source: "iana"
      },
      "audio/dls": {
        source: "iana"
      },
      "audio/dsr-es201108": {
        source: "iana"
      },
      "audio/dsr-es202050": {
        source: "iana"
      },
      "audio/dsr-es202211": {
        source: "iana"
      },
      "audio/dsr-es202212": {
        source: "iana"
      },
      "audio/dv": {
        source: "iana"
      },
      "audio/dvi4": {
        source: "iana"
      },
      "audio/eac3": {
        source: "iana"
      },
      "audio/encaprtp": {
        source: "iana"
      },
      "audio/evrc": {
        source: "iana"
      },
      "audio/evrc-qcp": {
        source: "iana"
      },
      "audio/evrc0": {
        source: "iana"
      },
      "audio/evrc1": {
        source: "iana"
      },
      "audio/evrcb": {
        source: "iana"
      },
      "audio/evrcb0": {
        source: "iana"
      },
      "audio/evrcb1": {
        source: "iana"
      },
      "audio/evrcnw": {
        source: "iana"
      },
      "audio/evrcnw0": {
        source: "iana"
      },
      "audio/evrcnw1": {
        source: "iana"
      },
      "audio/evrcwb": {
        source: "iana"
      },
      "audio/evrcwb0": {
        source: "iana"
      },
      "audio/evrcwb1": {
        source: "iana"
      },
      "audio/evs": {
        source: "iana"
      },
      "audio/flexfec": {
        source: "iana"
      },
      "audio/fwdred": {
        source: "iana"
      },
      "audio/g711-0": {
        source: "iana"
      },
      "audio/g719": {
        source: "iana"
      },
      "audio/g722": {
        source: "iana"
      },
      "audio/g7221": {
        source: "iana"
      },
      "audio/g723": {
        source: "iana"
      },
      "audio/g726-16": {
        source: "iana"
      },
      "audio/g726-24": {
        source: "iana"
      },
      "audio/g726-32": {
        source: "iana"
      },
      "audio/g726-40": {
        source: "iana"
      },
      "audio/g728": {
        source: "iana"
      },
      "audio/g729": {
        source: "iana"
      },
      "audio/g7291": {
        source: "iana"
      },
      "audio/g729d": {
        source: "iana"
      },
      "audio/g729e": {
        source: "iana"
      },
      "audio/gsm": {
        source: "iana"
      },
      "audio/gsm-efr": {
        source: "iana"
      },
      "audio/gsm-hr-08": {
        source: "iana"
      },
      "audio/ilbc": {
        source: "iana"
      },
      "audio/ip-mr_v2.5": {
        source: "iana"
      },
      "audio/isac": {
        source: "apache"
      },
      "audio/l16": {
        source: "iana"
      },
      "audio/l20": {
        source: "iana"
      },
      "audio/l24": {
        source: "iana",
        compressible: false
      },
      "audio/l8": {
        source: "iana"
      },
      "audio/lpc": {
        source: "iana"
      },
      "audio/melp": {
        source: "iana"
      },
      "audio/melp1200": {
        source: "iana"
      },
      "audio/melp2400": {
        source: "iana"
      },
      "audio/melp600": {
        source: "iana"
      },
      "audio/mhas": {
        source: "iana"
      },
      "audio/midi": {
        source: "apache",
        extensions: ["mid", "midi", "kar", "rmi"]
      },
      "audio/mobile-xmf": {
        source: "iana",
        extensions: ["mxmf"]
      },
      "audio/mp3": {
        compressible: false,
        extensions: ["mp3"]
      },
      "audio/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["m4a", "mp4a"]
      },
      "audio/mp4a-latm": {
        source: "iana"
      },
      "audio/mpa": {
        source: "iana"
      },
      "audio/mpa-robust": {
        source: "iana"
      },
      "audio/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
      },
      "audio/mpeg4-generic": {
        source: "iana"
      },
      "audio/musepack": {
        source: "apache"
      },
      "audio/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["oga", "ogg", "spx", "opus"]
      },
      "audio/opus": {
        source: "iana"
      },
      "audio/parityfec": {
        source: "iana"
      },
      "audio/pcma": {
        source: "iana"
      },
      "audio/pcma-wb": {
        source: "iana"
      },
      "audio/pcmu": {
        source: "iana"
      },
      "audio/pcmu-wb": {
        source: "iana"
      },
      "audio/prs.sid": {
        source: "iana"
      },
      "audio/qcelp": {
        source: "iana"
      },
      "audio/raptorfec": {
        source: "iana"
      },
      "audio/red": {
        source: "iana"
      },
      "audio/rtp-enc-aescm128": {
        source: "iana"
      },
      "audio/rtp-midi": {
        source: "iana"
      },
      "audio/rtploopback": {
        source: "iana"
      },
      "audio/rtx": {
        source: "iana"
      },
      "audio/s3m": {
        source: "apache",
        extensions: ["s3m"]
      },
      "audio/scip": {
        source: "iana"
      },
      "audio/silk": {
        source: "apache",
        extensions: ["sil"]
      },
      "audio/smv": {
        source: "iana"
      },
      "audio/smv-qcp": {
        source: "iana"
      },
      "audio/smv0": {
        source: "iana"
      },
      "audio/sofa": {
        source: "iana"
      },
      "audio/sp-midi": {
        source: "iana"
      },
      "audio/speex": {
        source: "iana"
      },
      "audio/t140c": {
        source: "iana"
      },
      "audio/t38": {
        source: "iana"
      },
      "audio/telephone-event": {
        source: "iana"
      },
      "audio/tetra_acelp": {
        source: "iana"
      },
      "audio/tetra_acelp_bb": {
        source: "iana"
      },
      "audio/tone": {
        source: "iana"
      },
      "audio/tsvcis": {
        source: "iana"
      },
      "audio/uemclip": {
        source: "iana"
      },
      "audio/ulpfec": {
        source: "iana"
      },
      "audio/usac": {
        source: "iana"
      },
      "audio/vdvi": {
        source: "iana"
      },
      "audio/vmr-wb": {
        source: "iana"
      },
      "audio/vnd.3gpp.iufp": {
        source: "iana"
      },
      "audio/vnd.4sb": {
        source: "iana"
      },
      "audio/vnd.audiokoz": {
        source: "iana"
      },
      "audio/vnd.celp": {
        source: "iana"
      },
      "audio/vnd.cisco.nse": {
        source: "iana"
      },
      "audio/vnd.cmles.radio-events": {
        source: "iana"
      },
      "audio/vnd.cns.anp1": {
        source: "iana"
      },
      "audio/vnd.cns.inf1": {
        source: "iana"
      },
      "audio/vnd.dece.audio": {
        source: "iana",
        extensions: ["uva", "uvva"]
      },
      "audio/vnd.digital-winds": {
        source: "iana",
        extensions: ["eol"]
      },
      "audio/vnd.dlna.adts": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.1": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.2": {
        source: "iana"
      },
      "audio/vnd.dolby.mlp": {
        source: "iana"
      },
      "audio/vnd.dolby.mps": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2x": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2z": {
        source: "iana"
      },
      "audio/vnd.dolby.pulse.1": {
        source: "iana"
      },
      "audio/vnd.dra": {
        source: "iana",
        extensions: ["dra"]
      },
      "audio/vnd.dts": {
        source: "iana",
        extensions: ["dts"]
      },
      "audio/vnd.dts.hd": {
        source: "iana",
        extensions: ["dtshd"]
      },
      "audio/vnd.dts.uhd": {
        source: "iana"
      },
      "audio/vnd.dvb.file": {
        source: "iana"
      },
      "audio/vnd.everad.plj": {
        source: "iana"
      },
      "audio/vnd.hns.audio": {
        source: "iana"
      },
      "audio/vnd.lucent.voice": {
        source: "iana",
        extensions: ["lvp"]
      },
      "audio/vnd.ms-playready.media.pya": {
        source: "iana",
        extensions: ["pya"]
      },
      "audio/vnd.nokia.mobile-xmf": {
        source: "iana"
      },
      "audio/vnd.nortel.vbk": {
        source: "iana"
      },
      "audio/vnd.nuera.ecelp4800": {
        source: "iana",
        extensions: ["ecelp4800"]
      },
      "audio/vnd.nuera.ecelp7470": {
        source: "iana",
        extensions: ["ecelp7470"]
      },
      "audio/vnd.nuera.ecelp9600": {
        source: "iana",
        extensions: ["ecelp9600"]
      },
      "audio/vnd.octel.sbc": {
        source: "iana"
      },
      "audio/vnd.presonus.multitrack": {
        source: "iana"
      },
      "audio/vnd.qcelp": {
        source: "iana"
      },
      "audio/vnd.rhetorex.32kadpcm": {
        source: "iana"
      },
      "audio/vnd.rip": {
        source: "iana",
        extensions: ["rip"]
      },
      "audio/vnd.rn-realaudio": {
        compressible: false
      },
      "audio/vnd.sealedmedia.softseal.mpeg": {
        source: "iana"
      },
      "audio/vnd.vmx.cvsd": {
        source: "iana"
      },
      "audio/vnd.wave": {
        compressible: false
      },
      "audio/vorbis": {
        source: "iana",
        compressible: false
      },
      "audio/vorbis-config": {
        source: "iana"
      },
      "audio/wav": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/wave": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/webm": {
        source: "apache",
        compressible: false,
        extensions: ["weba"]
      },
      "audio/x-aac": {
        source: "apache",
        compressible: false,
        extensions: ["aac"]
      },
      "audio/x-aiff": {
        source: "apache",
        extensions: ["aif", "aiff", "aifc"]
      },
      "audio/x-caf": {
        source: "apache",
        compressible: false,
        extensions: ["caf"]
      },
      "audio/x-flac": {
        source: "apache",
        extensions: ["flac"]
      },
      "audio/x-m4a": {
        source: "nginx",
        extensions: ["m4a"]
      },
      "audio/x-matroska": {
        source: "apache",
        extensions: ["mka"]
      },
      "audio/x-mpegurl": {
        source: "apache",
        extensions: ["m3u"]
      },
      "audio/x-ms-wax": {
        source: "apache",
        extensions: ["wax"]
      },
      "audio/x-ms-wma": {
        source: "apache",
        extensions: ["wma"]
      },
      "audio/x-pn-realaudio": {
        source: "apache",
        extensions: ["ram", "ra"]
      },
      "audio/x-pn-realaudio-plugin": {
        source: "apache",
        extensions: ["rmp"]
      },
      "audio/x-realaudio": {
        source: "nginx",
        extensions: ["ra"]
      },
      "audio/x-tta": {
        source: "apache"
      },
      "audio/x-wav": {
        source: "apache",
        extensions: ["wav"]
      },
      "audio/xm": {
        source: "apache",
        extensions: ["xm"]
      },
      "chemical/x-cdx": {
        source: "apache",
        extensions: ["cdx"]
      },
      "chemical/x-cif": {
        source: "apache",
        extensions: ["cif"]
      },
      "chemical/x-cmdf": {
        source: "apache",
        extensions: ["cmdf"]
      },
      "chemical/x-cml": {
        source: "apache",
        extensions: ["cml"]
      },
      "chemical/x-csml": {
        source: "apache",
        extensions: ["csml"]
      },
      "chemical/x-pdb": {
        source: "apache"
      },
      "chemical/x-xyz": {
        source: "apache",
        extensions: ["xyz"]
      },
      "font/collection": {
        source: "iana",
        extensions: ["ttc"]
      },
      "font/otf": {
        source: "iana",
        compressible: true,
        extensions: ["otf"]
      },
      "font/sfnt": {
        source: "iana"
      },
      "font/ttf": {
        source: "iana",
        compressible: true,
        extensions: ["ttf"]
      },
      "font/woff": {
        source: "iana",
        extensions: ["woff"]
      },
      "font/woff2": {
        source: "iana",
        extensions: ["woff2"]
      },
      "image/aces": {
        source: "iana",
        extensions: ["exr"]
      },
      "image/apng": {
        compressible: false,
        extensions: ["apng"]
      },
      "image/avci": {
        source: "iana",
        extensions: ["avci"]
      },
      "image/avcs": {
        source: "iana",
        extensions: ["avcs"]
      },
      "image/avif": {
        source: "iana",
        compressible: false,
        extensions: ["avif"]
      },
      "image/bmp": {
        source: "iana",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/cgm": {
        source: "iana",
        extensions: ["cgm"]
      },
      "image/dicom-rle": {
        source: "iana",
        extensions: ["drle"]
      },
      "image/emf": {
        source: "iana",
        extensions: ["emf"]
      },
      "image/fits": {
        source: "iana",
        extensions: ["fits"]
      },
      "image/g3fax": {
        source: "iana",
        extensions: ["g3"]
      },
      "image/gif": {
        source: "iana",
        compressible: false,
        extensions: ["gif"]
      },
      "image/heic": {
        source: "iana",
        extensions: ["heic"]
      },
      "image/heic-sequence": {
        source: "iana",
        extensions: ["heics"]
      },
      "image/heif": {
        source: "iana",
        extensions: ["heif"]
      },
      "image/heif-sequence": {
        source: "iana",
        extensions: ["heifs"]
      },
      "image/hej2k": {
        source: "iana",
        extensions: ["hej2"]
      },
      "image/hsj2": {
        source: "iana",
        extensions: ["hsj2"]
      },
      "image/ief": {
        source: "iana",
        extensions: ["ief"]
      },
      "image/jls": {
        source: "iana",
        extensions: ["jls"]
      },
      "image/jp2": {
        source: "iana",
        compressible: false,
        extensions: ["jp2", "jpg2"]
      },
      "image/jpeg": {
        source: "iana",
        compressible: false,
        extensions: ["jpeg", "jpg", "jpe"]
      },
      "image/jph": {
        source: "iana",
        extensions: ["jph"]
      },
      "image/jphc": {
        source: "iana",
        extensions: ["jhc"]
      },
      "image/jpm": {
        source: "iana",
        compressible: false,
        extensions: ["jpm"]
      },
      "image/jpx": {
        source: "iana",
        compressible: false,
        extensions: ["jpx", "jpf"]
      },
      "image/jxr": {
        source: "iana",
        extensions: ["jxr"]
      },
      "image/jxra": {
        source: "iana",
        extensions: ["jxra"]
      },
      "image/jxrs": {
        source: "iana",
        extensions: ["jxrs"]
      },
      "image/jxs": {
        source: "iana",
        extensions: ["jxs"]
      },
      "image/jxsc": {
        source: "iana",
        extensions: ["jxsc"]
      },
      "image/jxsi": {
        source: "iana",
        extensions: ["jxsi"]
      },
      "image/jxss": {
        source: "iana",
        extensions: ["jxss"]
      },
      "image/ktx": {
        source: "iana",
        extensions: ["ktx"]
      },
      "image/ktx2": {
        source: "iana",
        extensions: ["ktx2"]
      },
      "image/naplps": {
        source: "iana"
      },
      "image/pjpeg": {
        compressible: false
      },
      "image/png": {
        source: "iana",
        compressible: false,
        extensions: ["png"]
      },
      "image/prs.btif": {
        source: "iana",
        extensions: ["btif"]
      },
      "image/prs.pti": {
        source: "iana",
        extensions: ["pti"]
      },
      "image/pwg-raster": {
        source: "iana"
      },
      "image/sgi": {
        source: "apache",
        extensions: ["sgi"]
      },
      "image/svg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["svg", "svgz"]
      },
      "image/t38": {
        source: "iana",
        extensions: ["t38"]
      },
      "image/tiff": {
        source: "iana",
        compressible: false,
        extensions: ["tif", "tiff"]
      },
      "image/tiff-fx": {
        source: "iana",
        extensions: ["tfx"]
      },
      "image/vnd.adobe.photoshop": {
        source: "iana",
        compressible: true,
        extensions: ["psd"]
      },
      "image/vnd.airzip.accelerator.azv": {
        source: "iana",
        extensions: ["azv"]
      },
      "image/vnd.cns.inf2": {
        source: "iana"
      },
      "image/vnd.dece.graphic": {
        source: "iana",
        extensions: ["uvi", "uvvi", "uvg", "uvvg"]
      },
      "image/vnd.djvu": {
        source: "iana",
        extensions: ["djvu", "djv"]
      },
      "image/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "image/vnd.dwg": {
        source: "iana",
        extensions: ["dwg"]
      },
      "image/vnd.dxf": {
        source: "iana",
        extensions: ["dxf"]
      },
      "image/vnd.fastbidsheet": {
        source: "iana",
        extensions: ["fbs"]
      },
      "image/vnd.fpx": {
        source: "iana",
        extensions: ["fpx"]
      },
      "image/vnd.fst": {
        source: "iana",
        extensions: ["fst"]
      },
      "image/vnd.fujixerox.edmics-mmr": {
        source: "iana",
        extensions: ["mmr"]
      },
      "image/vnd.fujixerox.edmics-rlc": {
        source: "iana",
        extensions: ["rlc"]
      },
      "image/vnd.globalgraphics.pgb": {
        source: "iana"
      },
      "image/vnd.microsoft.icon": {
        source: "iana",
        compressible: true,
        extensions: ["ico"]
      },
      "image/vnd.mix": {
        source: "iana"
      },
      "image/vnd.mozilla.apng": {
        source: "iana"
      },
      "image/vnd.ms-dds": {
        compressible: true,
        extensions: ["dds"]
      },
      "image/vnd.ms-modi": {
        source: "iana",
        extensions: ["mdi"]
      },
      "image/vnd.ms-photo": {
        source: "apache",
        extensions: ["wdp"]
      },
      "image/vnd.net-fpx": {
        source: "iana",
        extensions: ["npx"]
      },
      "image/vnd.pco.b16": {
        source: "iana",
        extensions: ["b16"]
      },
      "image/vnd.radiance": {
        source: "iana"
      },
      "image/vnd.sealed.png": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.gif": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.jpg": {
        source: "iana"
      },
      "image/vnd.svf": {
        source: "iana"
      },
      "image/vnd.tencent.tap": {
        source: "iana",
        extensions: ["tap"]
      },
      "image/vnd.valve.source.texture": {
        source: "iana",
        extensions: ["vtf"]
      },
      "image/vnd.wap.wbmp": {
        source: "iana",
        extensions: ["wbmp"]
      },
      "image/vnd.xiff": {
        source: "iana",
        extensions: ["xif"]
      },
      "image/vnd.zbrush.pcx": {
        source: "iana",
        extensions: ["pcx"]
      },
      "image/webp": {
        source: "apache",
        extensions: ["webp"]
      },
      "image/wmf": {
        source: "iana",
        extensions: ["wmf"]
      },
      "image/x-3ds": {
        source: "apache",
        extensions: ["3ds"]
      },
      "image/x-cmu-raster": {
        source: "apache",
        extensions: ["ras"]
      },
      "image/x-cmx": {
        source: "apache",
        extensions: ["cmx"]
      },
      "image/x-freehand": {
        source: "apache",
        extensions: ["fh", "fhc", "fh4", "fh5", "fh7"]
      },
      "image/x-icon": {
        source: "apache",
        compressible: true,
        extensions: ["ico"]
      },
      "image/x-jng": {
        source: "nginx",
        extensions: ["jng"]
      },
      "image/x-mrsid-image": {
        source: "apache",
        extensions: ["sid"]
      },
      "image/x-ms-bmp": {
        source: "nginx",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/x-pcx": {
        source: "apache",
        extensions: ["pcx"]
      },
      "image/x-pict": {
        source: "apache",
        extensions: ["pic", "pct"]
      },
      "image/x-portable-anymap": {
        source: "apache",
        extensions: ["pnm"]
      },
      "image/x-portable-bitmap": {
        source: "apache",
        extensions: ["pbm"]
      },
      "image/x-portable-graymap": {
        source: "apache",
        extensions: ["pgm"]
      },
      "image/x-portable-pixmap": {
        source: "apache",
        extensions: ["ppm"]
      },
      "image/x-rgb": {
        source: "apache",
        extensions: ["rgb"]
      },
      "image/x-tga": {
        source: "apache",
        extensions: ["tga"]
      },
      "image/x-xbitmap": {
        source: "apache",
        extensions: ["xbm"]
      },
      "image/x-xcf": {
        compressible: false
      },
      "image/x-xpixmap": {
        source: "apache",
        extensions: ["xpm"]
      },
      "image/x-xwindowdump": {
        source: "apache",
        extensions: ["xwd"]
      },
      "message/cpim": {
        source: "iana"
      },
      "message/delivery-status": {
        source: "iana"
      },
      "message/disposition-notification": {
        source: "iana",
        extensions: [
          "disposition-notification"
        ]
      },
      "message/external-body": {
        source: "iana"
      },
      "message/feedback-report": {
        source: "iana"
      },
      "message/global": {
        source: "iana",
        extensions: ["u8msg"]
      },
      "message/global-delivery-status": {
        source: "iana",
        extensions: ["u8dsn"]
      },
      "message/global-disposition-notification": {
        source: "iana",
        extensions: ["u8mdn"]
      },
      "message/global-headers": {
        source: "iana",
        extensions: ["u8hdr"]
      },
      "message/http": {
        source: "iana",
        compressible: false
      },
      "message/imdn+xml": {
        source: "iana",
        compressible: true
      },
      "message/news": {
        source: "iana"
      },
      "message/partial": {
        source: "iana",
        compressible: false
      },
      "message/rfc822": {
        source: "iana",
        compressible: true,
        extensions: ["eml", "mime"]
      },
      "message/s-http": {
        source: "iana"
      },
      "message/sip": {
        source: "iana"
      },
      "message/sipfrag": {
        source: "iana"
      },
      "message/tracking-status": {
        source: "iana"
      },
      "message/vnd.si.simp": {
        source: "iana"
      },
      "message/vnd.wfa.wsc": {
        source: "iana",
        extensions: ["wsc"]
      },
      "model/3mf": {
        source: "iana",
        extensions: ["3mf"]
      },
      "model/e57": {
        source: "iana"
      },
      "model/gltf+json": {
        source: "iana",
        compressible: true,
        extensions: ["gltf"]
      },
      "model/gltf-binary": {
        source: "iana",
        compressible: true,
        extensions: ["glb"]
      },
      "model/iges": {
        source: "iana",
        compressible: false,
        extensions: ["igs", "iges"]
      },
      "model/mesh": {
        source: "iana",
        compressible: false,
        extensions: ["msh", "mesh", "silo"]
      },
      "model/mtl": {
        source: "iana",
        extensions: ["mtl"]
      },
      "model/obj": {
        source: "iana",
        extensions: ["obj"]
      },
      "model/step": {
        source: "iana"
      },
      "model/step+xml": {
        source: "iana",
        compressible: true,
        extensions: ["stpx"]
      },
      "model/step+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpz"]
      },
      "model/step-xml+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpxz"]
      },
      "model/stl": {
        source: "iana",
        extensions: ["stl"]
      },
      "model/vnd.collada+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dae"]
      },
      "model/vnd.dwf": {
        source: "iana",
        extensions: ["dwf"]
      },
      "model/vnd.flatland.3dml": {
        source: "iana"
      },
      "model/vnd.gdl": {
        source: "iana",
        extensions: ["gdl"]
      },
      "model/vnd.gs-gdl": {
        source: "apache"
      },
      "model/vnd.gs.gdl": {
        source: "iana"
      },
      "model/vnd.gtw": {
        source: "iana",
        extensions: ["gtw"]
      },
      "model/vnd.moml+xml": {
        source: "iana",
        compressible: true
      },
      "model/vnd.mts": {
        source: "iana",
        extensions: ["mts"]
      },
      "model/vnd.opengex": {
        source: "iana",
        extensions: ["ogex"]
      },
      "model/vnd.parasolid.transmit.binary": {
        source: "iana",
        extensions: ["x_b"]
      },
      "model/vnd.parasolid.transmit.text": {
        source: "iana",
        extensions: ["x_t"]
      },
      "model/vnd.pytha.pyox": {
        source: "iana"
      },
      "model/vnd.rosette.annotated-data-model": {
        source: "iana"
      },
      "model/vnd.sap.vds": {
        source: "iana",
        extensions: ["vds"]
      },
      "model/vnd.usdz+zip": {
        source: "iana",
        compressible: false,
        extensions: ["usdz"]
      },
      "model/vnd.valve.source.compiled-map": {
        source: "iana",
        extensions: ["bsp"]
      },
      "model/vnd.vtu": {
        source: "iana",
        extensions: ["vtu"]
      },
      "model/vrml": {
        source: "iana",
        compressible: false,
        extensions: ["wrl", "vrml"]
      },
      "model/x3d+binary": {
        source: "apache",
        compressible: false,
        extensions: ["x3db", "x3dbz"]
      },
      "model/x3d+fastinfoset": {
        source: "iana",
        extensions: ["x3db"]
      },
      "model/x3d+vrml": {
        source: "apache",
        compressible: false,
        extensions: ["x3dv", "x3dvz"]
      },
      "model/x3d+xml": {
        source: "iana",
        compressible: true,
        extensions: ["x3d", "x3dz"]
      },
      "model/x3d-vrml": {
        source: "iana",
        extensions: ["x3dv"]
      },
      "multipart/alternative": {
        source: "iana",
        compressible: false
      },
      "multipart/appledouble": {
        source: "iana"
      },
      "multipart/byteranges": {
        source: "iana"
      },
      "multipart/digest": {
        source: "iana"
      },
      "multipart/encrypted": {
        source: "iana",
        compressible: false
      },
      "multipart/form-data": {
        source: "iana",
        compressible: false
      },
      "multipart/header-set": {
        source: "iana"
      },
      "multipart/mixed": {
        source: "iana"
      },
      "multipart/multilingual": {
        source: "iana"
      },
      "multipart/parallel": {
        source: "iana"
      },
      "multipart/related": {
        source: "iana",
        compressible: false
      },
      "multipart/report": {
        source: "iana"
      },
      "multipart/signed": {
        source: "iana",
        compressible: false
      },
      "multipart/vnd.bint.med-plus": {
        source: "iana"
      },
      "multipart/voice-message": {
        source: "iana"
      },
      "multipart/x-mixed-replace": {
        source: "iana"
      },
      "text/1d-interleaved-parityfec": {
        source: "iana"
      },
      "text/cache-manifest": {
        source: "iana",
        compressible: true,
        extensions: ["appcache", "manifest"]
      },
      "text/calendar": {
        source: "iana",
        extensions: ["ics", "ifb"]
      },
      "text/calender": {
        compressible: true
      },
      "text/cmd": {
        compressible: true
      },
      "text/coffeescript": {
        extensions: ["coffee", "litcoffee"]
      },
      "text/cql": {
        source: "iana"
      },
      "text/cql-expression": {
        source: "iana"
      },
      "text/cql-identifier": {
        source: "iana"
      },
      "text/css": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["css"]
      },
      "text/csv": {
        source: "iana",
        compressible: true,
        extensions: ["csv"]
      },
      "text/csv-schema": {
        source: "iana"
      },
      "text/directory": {
        source: "iana"
      },
      "text/dns": {
        source: "iana"
      },
      "text/ecmascript": {
        source: "iana"
      },
      "text/encaprtp": {
        source: "iana"
      },
      "text/enriched": {
        source: "iana"
      },
      "text/fhirpath": {
        source: "iana"
      },
      "text/flexfec": {
        source: "iana"
      },
      "text/fwdred": {
        source: "iana"
      },
      "text/gff3": {
        source: "iana"
      },
      "text/grammar-ref-list": {
        source: "iana"
      },
      "text/html": {
        source: "iana",
        compressible: true,
        extensions: ["html", "htm", "shtml"]
      },
      "text/jade": {
        extensions: ["jade"]
      },
      "text/javascript": {
        source: "iana",
        compressible: true
      },
      "text/jcr-cnd": {
        source: "iana"
      },
      "text/jsx": {
        compressible: true,
        extensions: ["jsx"]
      },
      "text/less": {
        compressible: true,
        extensions: ["less"]
      },
      "text/markdown": {
        source: "iana",
        compressible: true,
        extensions: ["markdown", "md"]
      },
      "text/mathml": {
        source: "nginx",
        extensions: ["mml"]
      },
      "text/mdx": {
        compressible: true,
        extensions: ["mdx"]
      },
      "text/mizar": {
        source: "iana"
      },
      "text/n3": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["n3"]
      },
      "text/parameters": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/parityfec": {
        source: "iana"
      },
      "text/plain": {
        source: "iana",
        compressible: true,
        extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"]
      },
      "text/provenance-notation": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/prs.fallenstein.rst": {
        source: "iana"
      },
      "text/prs.lines.tag": {
        source: "iana",
        extensions: ["dsc"]
      },
      "text/prs.prop.logic": {
        source: "iana"
      },
      "text/raptorfec": {
        source: "iana"
      },
      "text/red": {
        source: "iana"
      },
      "text/rfc822-headers": {
        source: "iana"
      },
      "text/richtext": {
        source: "iana",
        compressible: true,
        extensions: ["rtx"]
      },
      "text/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "text/rtp-enc-aescm128": {
        source: "iana"
      },
      "text/rtploopback": {
        source: "iana"
      },
      "text/rtx": {
        source: "iana"
      },
      "text/sgml": {
        source: "iana",
        extensions: ["sgml", "sgm"]
      },
      "text/shaclc": {
        source: "iana"
      },
      "text/shex": {
        source: "iana",
        extensions: ["shex"]
      },
      "text/slim": {
        extensions: ["slim", "slm"]
      },
      "text/spdx": {
        source: "iana",
        extensions: ["spdx"]
      },
      "text/strings": {
        source: "iana"
      },
      "text/stylus": {
        extensions: ["stylus", "styl"]
      },
      "text/t140": {
        source: "iana"
      },
      "text/tab-separated-values": {
        source: "iana",
        compressible: true,
        extensions: ["tsv"]
      },
      "text/troff": {
        source: "iana",
        extensions: ["t", "tr", "roff", "man", "me", "ms"]
      },
      "text/turtle": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["ttl"]
      },
      "text/ulpfec": {
        source: "iana"
      },
      "text/uri-list": {
        source: "iana",
        compressible: true,
        extensions: ["uri", "uris", "urls"]
      },
      "text/vcard": {
        source: "iana",
        compressible: true,
        extensions: ["vcard"]
      },
      "text/vnd.a": {
        source: "iana"
      },
      "text/vnd.abc": {
        source: "iana"
      },
      "text/vnd.ascii-art": {
        source: "iana"
      },
      "text/vnd.curl": {
        source: "iana",
        extensions: ["curl"]
      },
      "text/vnd.curl.dcurl": {
        source: "apache",
        extensions: ["dcurl"]
      },
      "text/vnd.curl.mcurl": {
        source: "apache",
        extensions: ["mcurl"]
      },
      "text/vnd.curl.scurl": {
        source: "apache",
        extensions: ["scurl"]
      },
      "text/vnd.debian.copyright": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.dmclientscript": {
        source: "iana"
      },
      "text/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "text/vnd.esmertec.theme-descriptor": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.familysearch.gedcom": {
        source: "iana",
        extensions: ["ged"]
      },
      "text/vnd.ficlab.flt": {
        source: "iana"
      },
      "text/vnd.fly": {
        source: "iana",
        extensions: ["fly"]
      },
      "text/vnd.fmi.flexstor": {
        source: "iana",
        extensions: ["flx"]
      },
      "text/vnd.gml": {
        source: "iana"
      },
      "text/vnd.graphviz": {
        source: "iana",
        extensions: ["gv"]
      },
      "text/vnd.hans": {
        source: "iana"
      },
      "text/vnd.hgl": {
        source: "iana"
      },
      "text/vnd.in3d.3dml": {
        source: "iana",
        extensions: ["3dml"]
      },
      "text/vnd.in3d.spot": {
        source: "iana",
        extensions: ["spot"]
      },
      "text/vnd.iptc.newsml": {
        source: "iana"
      },
      "text/vnd.iptc.nitf": {
        source: "iana"
      },
      "text/vnd.latex-z": {
        source: "iana"
      },
      "text/vnd.motorola.reflex": {
        source: "iana"
      },
      "text/vnd.ms-mediapackage": {
        source: "iana"
      },
      "text/vnd.net2phone.commcenter.command": {
        source: "iana"
      },
      "text/vnd.radisys.msml-basic-layout": {
        source: "iana"
      },
      "text/vnd.senx.warpscript": {
        source: "iana"
      },
      "text/vnd.si.uricatalogue": {
        source: "iana"
      },
      "text/vnd.sosi": {
        source: "iana"
      },
      "text/vnd.sun.j2me.app-descriptor": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["jad"]
      },
      "text/vnd.trolltech.linguist": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.wap.si": {
        source: "iana"
      },
      "text/vnd.wap.sl": {
        source: "iana"
      },
      "text/vnd.wap.wml": {
        source: "iana",
        extensions: ["wml"]
      },
      "text/vnd.wap.wmlscript": {
        source: "iana",
        extensions: ["wmls"]
      },
      "text/vtt": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["vtt"]
      },
      "text/x-asm": {
        source: "apache",
        extensions: ["s", "asm"]
      },
      "text/x-c": {
        source: "apache",
        extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"]
      },
      "text/x-component": {
        source: "nginx",
        extensions: ["htc"]
      },
      "text/x-fortran": {
        source: "apache",
        extensions: ["f", "for", "f77", "f90"]
      },
      "text/x-gwt-rpc": {
        compressible: true
      },
      "text/x-handlebars-template": {
        extensions: ["hbs"]
      },
      "text/x-java-source": {
        source: "apache",
        extensions: ["java"]
      },
      "text/x-jquery-tmpl": {
        compressible: true
      },
      "text/x-lua": {
        extensions: ["lua"]
      },
      "text/x-markdown": {
        compressible: true,
        extensions: ["mkd"]
      },
      "text/x-nfo": {
        source: "apache",
        extensions: ["nfo"]
      },
      "text/x-opml": {
        source: "apache",
        extensions: ["opml"]
      },
      "text/x-org": {
        compressible: true,
        extensions: ["org"]
      },
      "text/x-pascal": {
        source: "apache",
        extensions: ["p", "pas"]
      },
      "text/x-processing": {
        compressible: true,
        extensions: ["pde"]
      },
      "text/x-sass": {
        extensions: ["sass"]
      },
      "text/x-scss": {
        extensions: ["scss"]
      },
      "text/x-setext": {
        source: "apache",
        extensions: ["etx"]
      },
      "text/x-sfv": {
        source: "apache",
        extensions: ["sfv"]
      },
      "text/x-suse-ymp": {
        compressible: true,
        extensions: ["ymp"]
      },
      "text/x-uuencode": {
        source: "apache",
        extensions: ["uu"]
      },
      "text/x-vcalendar": {
        source: "apache",
        extensions: ["vcs"]
      },
      "text/x-vcard": {
        source: "apache",
        extensions: ["vcf"]
      },
      "text/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml"]
      },
      "text/xml-external-parsed-entity": {
        source: "iana"
      },
      "text/yaml": {
        compressible: true,
        extensions: ["yaml", "yml"]
      },
      "video/1d-interleaved-parityfec": {
        source: "iana"
      },
      "video/3gpp": {
        source: "iana",
        extensions: ["3gp", "3gpp"]
      },
      "video/3gpp-tt": {
        source: "iana"
      },
      "video/3gpp2": {
        source: "iana",
        extensions: ["3g2"]
      },
      "video/av1": {
        source: "iana"
      },
      "video/bmpeg": {
        source: "iana"
      },
      "video/bt656": {
        source: "iana"
      },
      "video/celb": {
        source: "iana"
      },
      "video/dv": {
        source: "iana"
      },
      "video/encaprtp": {
        source: "iana"
      },
      "video/ffv1": {
        source: "iana"
      },
      "video/flexfec": {
        source: "iana"
      },
      "video/h261": {
        source: "iana",
        extensions: ["h261"]
      },
      "video/h263": {
        source: "iana",
        extensions: ["h263"]
      },
      "video/h263-1998": {
        source: "iana"
      },
      "video/h263-2000": {
        source: "iana"
      },
      "video/h264": {
        source: "iana",
        extensions: ["h264"]
      },
      "video/h264-rcdo": {
        source: "iana"
      },
      "video/h264-svc": {
        source: "iana"
      },
      "video/h265": {
        source: "iana"
      },
      "video/iso.segment": {
        source: "iana",
        extensions: ["m4s"]
      },
      "video/jpeg": {
        source: "iana",
        extensions: ["jpgv"]
      },
      "video/jpeg2000": {
        source: "iana"
      },
      "video/jpm": {
        source: "apache",
        extensions: ["jpm", "jpgm"]
      },
      "video/jxsv": {
        source: "iana"
      },
      "video/mj2": {
        source: "iana",
        extensions: ["mj2", "mjp2"]
      },
      "video/mp1s": {
        source: "iana"
      },
      "video/mp2p": {
        source: "iana"
      },
      "video/mp2t": {
        source: "iana",
        extensions: ["ts"]
      },
      "video/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["mp4", "mp4v", "mpg4"]
      },
      "video/mp4v-es": {
        source: "iana"
      },
      "video/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
      },
      "video/mpeg4-generic": {
        source: "iana"
      },
      "video/mpv": {
        source: "iana"
      },
      "video/nv": {
        source: "iana"
      },
      "video/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogv"]
      },
      "video/parityfec": {
        source: "iana"
      },
      "video/pointer": {
        source: "iana"
      },
      "video/quicktime": {
        source: "iana",
        compressible: false,
        extensions: ["qt", "mov"]
      },
      "video/raptorfec": {
        source: "iana"
      },
      "video/raw": {
        source: "iana"
      },
      "video/rtp-enc-aescm128": {
        source: "iana"
      },
      "video/rtploopback": {
        source: "iana"
      },
      "video/rtx": {
        source: "iana"
      },
      "video/scip": {
        source: "iana"
      },
      "video/smpte291": {
        source: "iana"
      },
      "video/smpte292m": {
        source: "iana"
      },
      "video/ulpfec": {
        source: "iana"
      },
      "video/vc1": {
        source: "iana"
      },
      "video/vc2": {
        source: "iana"
      },
      "video/vnd.cctv": {
        source: "iana"
      },
      "video/vnd.dece.hd": {
        source: "iana",
        extensions: ["uvh", "uvvh"]
      },
      "video/vnd.dece.mobile": {
        source: "iana",
        extensions: ["uvm", "uvvm"]
      },
      "video/vnd.dece.mp4": {
        source: "iana"
      },
      "video/vnd.dece.pd": {
        source: "iana",
        extensions: ["uvp", "uvvp"]
      },
      "video/vnd.dece.sd": {
        source: "iana",
        extensions: ["uvs", "uvvs"]
      },
      "video/vnd.dece.video": {
        source: "iana",
        extensions: ["uvv", "uvvv"]
      },
      "video/vnd.directv.mpeg": {
        source: "iana"
      },
      "video/vnd.directv.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dlna.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dvb.file": {
        source: "iana",
        extensions: ["dvb"]
      },
      "video/vnd.fvt": {
        source: "iana",
        extensions: ["fvt"]
      },
      "video/vnd.hns.video": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsavc": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsmpeg2": {
        source: "iana"
      },
      "video/vnd.motorola.video": {
        source: "iana"
      },
      "video/vnd.motorola.videop": {
        source: "iana"
      },
      "video/vnd.mpegurl": {
        source: "iana",
        extensions: ["mxu", "m4u"]
      },
      "video/vnd.ms-playready.media.pyv": {
        source: "iana",
        extensions: ["pyv"]
      },
      "video/vnd.nokia.interleaved-multimedia": {
        source: "iana"
      },
      "video/vnd.nokia.mp4vr": {
        source: "iana"
      },
      "video/vnd.nokia.videovoip": {
        source: "iana"
      },
      "video/vnd.objectvideo": {
        source: "iana"
      },
      "video/vnd.radgamettools.bink": {
        source: "iana"
      },
      "video/vnd.radgamettools.smacker": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg1": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg4": {
        source: "iana"
      },
      "video/vnd.sealed.swf": {
        source: "iana"
      },
      "video/vnd.sealedmedia.softseal.mov": {
        source: "iana"
      },
      "video/vnd.uvvu.mp4": {
        source: "iana",
        extensions: ["uvu", "uvvu"]
      },
      "video/vnd.vivo": {
        source: "iana",
        extensions: ["viv"]
      },
      "video/vnd.youtube.yt": {
        source: "iana"
      },
      "video/vp8": {
        source: "iana"
      },
      "video/vp9": {
        source: "iana"
      },
      "video/webm": {
        source: "apache",
        compressible: false,
        extensions: ["webm"]
      },
      "video/x-f4v": {
        source: "apache",
        extensions: ["f4v"]
      },
      "video/x-fli": {
        source: "apache",
        extensions: ["fli"]
      },
      "video/x-flv": {
        source: "apache",
        compressible: false,
        extensions: ["flv"]
      },
      "video/x-m4v": {
        source: "apache",
        extensions: ["m4v"]
      },
      "video/x-matroska": {
        source: "apache",
        compressible: false,
        extensions: ["mkv", "mk3d", "mks"]
      },
      "video/x-mng": {
        source: "apache",
        extensions: ["mng"]
      },
      "video/x-ms-asf": {
        source: "apache",
        extensions: ["asf", "asx"]
      },
      "video/x-ms-vob": {
        source: "apache",
        extensions: ["vob"]
      },
      "video/x-ms-wm": {
        source: "apache",
        extensions: ["wm"]
      },
      "video/x-ms-wmv": {
        source: "apache",
        compressible: false,
        extensions: ["wmv"]
      },
      "video/x-ms-wmx": {
        source: "apache",
        extensions: ["wmx"]
      },
      "video/x-ms-wvx": {
        source: "apache",
        extensions: ["wvx"]
      },
      "video/x-msvideo": {
        source: "apache",
        extensions: ["avi"]
      },
      "video/x-sgi-movie": {
        source: "apache",
        extensions: ["movie"]
      },
      "video/x-smv": {
        source: "apache",
        extensions: ["smv"]
      },
      "x-conference/x-cooltalk": {
        source: "apache",
        extensions: ["ice"]
      },
      "x-shader/x-fragment": {
        compressible: true
      },
      "x-shader/x-vertex": {
        compressible: true
      }
    };
  }
});

// ../../../node_modules/.pnpm/mime-db@1.52.0/node_modules/mime-db/index.js
var require_mime_db = __commonJS({
  "../../../node_modules/.pnpm/mime-db@1.52.0/node_modules/mime-db/index.js"(exports, module2) {
    "use strict";
    module2.exports = require_db();
  }
});

// ../../../node_modules/.pnpm/mime-types@2.1.35/node_modules/mime-types/index.js
var require_mime_types = __commonJS({
  "../../../node_modules/.pnpm/mime-types@2.1.35/node_modules/mime-types/index.js"(exports) {
    "use strict";
    var db = require_mime_db();
    var extname = require("path").extname;
    var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
    var TEXT_TYPE_REGEXP = /^text\//i;
    exports.charset = charset;
    exports.charsets = { lookup: charset };
    exports.contentType = contentType;
    exports.extension = extension;
    exports.extensions = /* @__PURE__ */ Object.create(null);
    exports.lookup = lookup;
    exports.types = /* @__PURE__ */ Object.create(null);
    populateMaps(exports.extensions, exports.types);
    function charset(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var mime = match && db[match[1].toLowerCase()];
      if (mime && mime.charset) {
        return mime.charset;
      }
      if (match && TEXT_TYPE_REGEXP.test(match[1])) {
        return "UTF-8";
      }
      return false;
    }
    function contentType(str) {
      if (!str || typeof str !== "string") {
        return false;
      }
      var mime = str.indexOf("/") === -1 ? exports.lookup(str) : str;
      if (!mime) {
        return false;
      }
      if (mime.indexOf("charset") === -1) {
        var charset2 = exports.charset(mime);
        if (charset2)
          mime += "; charset=" + charset2.toLowerCase();
      }
      return mime;
    }
    function extension(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var exts = match && exports.extensions[match[1].toLowerCase()];
      if (!exts || !exts.length) {
        return false;
      }
      return exts[0];
    }
    function lookup(path2) {
      if (!path2 || typeof path2 !== "string") {
        return false;
      }
      var extension2 = extname("x." + path2).toLowerCase().substr(1);
      if (!extension2) {
        return false;
      }
      return exports.types[extension2] || false;
    }
    function populateMaps(extensions, types) {
      var preference = ["nginx", "apache", void 0, "iana"];
      Object.keys(db).forEach(function forEachMimeType(type) {
        var mime = db[type];
        var exts = mime.extensions;
        if (!exts || !exts.length) {
          return;
        }
        extensions[type] = exts;
        for (var i = 0; i < exts.length; i++) {
          var extension2 = exts[i];
          if (types[extension2]) {
            var from = preference.indexOf(db[types[extension2]].source);
            var to = preference.indexOf(mime.source);
            if (types[extension2] !== "application/octet-stream" && (from > to || from === to && types[extension2].substr(0, 12) === "application/")) {
              continue;
            }
          }
          types[extension2] = type;
        }
      });
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/defer.js
var require_defer = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/defer.js"(exports, module2) {
    "use strict";
    module2.exports = defer;
    function defer(fn) {
      var nextTick = typeof setImmediate == "function" ? setImmediate : typeof process == "object" && typeof process.nextTick == "function" ? process.nextTick : null;
      if (nextTick) {
        nextTick(fn);
      } else {
        setTimeout(fn, 0);
      }
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/async.js
var require_async = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/async.js"(exports, module2) {
    "use strict";
    var defer = require_defer();
    module2.exports = async;
    function async(callback) {
      var isAsync = false;
      defer(function() {
        isAsync = true;
      });
      return function async_callback(err, result) {
        if (isAsync) {
          callback(err, result);
        } else {
          defer(function nextTick_callback() {
            callback(err, result);
          });
        }
      };
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/abort.js
var require_abort = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/abort.js"(exports, module2) {
    "use strict";
    module2.exports = abort;
    function abort(state) {
      Object.keys(state.jobs).forEach(clean2.bind(state));
      state.jobs = {};
    }
    function clean2(key) {
      if (typeof this.jobs[key] == "function") {
        this.jobs[key]();
      }
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/iterate.js
var require_iterate = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/iterate.js"(exports, module2) {
    "use strict";
    var async = require_async();
    var abort = require_abort();
    module2.exports = iterate;
    function iterate(list, iterator, state, callback) {
      var key = state["keyedList"] ? state["keyedList"][state.index] : state.index;
      state.jobs[key] = runJob(iterator, key, list[key], function(error, output) {
        if (!(key in state.jobs)) {
          return;
        }
        delete state.jobs[key];
        if (error) {
          abort(state);
        } else {
          state.results[key] = output;
        }
        callback(error, state.results);
      });
    }
    function runJob(iterator, key, item, callback) {
      var aborter;
      if (iterator.length == 2) {
        aborter = iterator(item, async(callback));
      } else {
        aborter = iterator(item, key, async(callback));
      }
      return aborter;
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/state.js
var require_state = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/state.js"(exports, module2) {
    "use strict";
    module2.exports = state;
    function state(list, sortMethod) {
      var isNamedList = !Array.isArray(list), initState = {
        index: 0,
        keyedList: isNamedList || sortMethod ? Object.keys(list) : null,
        jobs: {},
        results: isNamedList ? {} : [],
        size: isNamedList ? Object.keys(list).length : list.length
      };
      if (sortMethod) {
        initState.keyedList.sort(isNamedList ? sortMethod : function(a, b) {
          return sortMethod(list[a], list[b]);
        });
      }
      return initState;
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/terminator.js
var require_terminator = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/lib/terminator.js"(exports, module2) {
    "use strict";
    var abort = require_abort();
    var async = require_async();
    module2.exports = terminator;
    function terminator(callback) {
      if (!Object.keys(this.jobs).length) {
        return;
      }
      this.index = this.size;
      abort(this);
      async(callback)(null, this.results);
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/parallel.js
var require_parallel = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/parallel.js"(exports, module2) {
    "use strict";
    var iterate = require_iterate();
    var initState = require_state();
    var terminator = require_terminator();
    module2.exports = parallel;
    function parallel(list, iterator, callback) {
      var state = initState(list);
      while (state.index < (state["keyedList"] || list).length) {
        iterate(list, iterator, state, function(error, result) {
          if (error) {
            callback(error, result);
            return;
          }
          if (Object.keys(state.jobs).length === 0) {
            callback(null, state.results);
            return;
          }
        });
        state.index++;
      }
      return terminator.bind(state, callback);
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/serialOrdered.js
var require_serialOrdered = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/serialOrdered.js"(exports, module2) {
    "use strict";
    var iterate = require_iterate();
    var initState = require_state();
    var terminator = require_terminator();
    module2.exports = serialOrdered;
    module2.exports.ascending = ascending;
    module2.exports.descending = descending;
    function serialOrdered(list, iterator, sortMethod, callback) {
      var state = initState(list, sortMethod);
      iterate(list, iterator, state, function iteratorHandler(error, result) {
        if (error) {
          callback(error, result);
          return;
        }
        state.index++;
        if (state.index < (state["keyedList"] || list).length) {
          iterate(list, iterator, state, iteratorHandler);
          return;
        }
        callback(null, state.results);
      });
      return terminator.bind(state, callback);
    }
    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
    }
    function descending(a, b) {
      return -1 * ascending(a, b);
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/serial.js
var require_serial = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/serial.js"(exports, module2) {
    "use strict";
    var serialOrdered = require_serialOrdered();
    module2.exports = serial;
    function serial(list, iterator, callback) {
      return serialOrdered(list, iterator, null, callback);
    }
  }
});

// ../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/index.js
var require_asynckit = __commonJS({
  "../../../node_modules/.pnpm/asynckit@0.4.0/node_modules/asynckit/index.js"(exports, module2) {
    "use strict";
    module2.exports = {
      parallel: require_parallel(),
      serial: require_serial(),
      serialOrdered: require_serialOrdered()
    };
  }
});

// ../../../node_modules/.pnpm/form-data@4.0.0/node_modules/form-data/lib/populate.js
var require_populate = __commonJS({
  "../../../node_modules/.pnpm/form-data@4.0.0/node_modules/form-data/lib/populate.js"(exports, module2) {
    "use strict";
    module2.exports = function(dst, src) {
      Object.keys(src).forEach(function(prop) {
        dst[prop] = dst[prop] || src[prop];
      });
      return dst;
    };
  }
});

// ../../../node_modules/.pnpm/form-data@4.0.0/node_modules/form-data/lib/form_data.js
var require_form_data = __commonJS({
  "../../../node_modules/.pnpm/form-data@4.0.0/node_modules/form-data/lib/form_data.js"(exports, module2) {
    "use strict";
    var CombinedStream = require_combined_stream();
    var util = require("util");
    var path2 = require("path");
    var http = require("http");
    var https = require("https");
    var parseUrl = require("url").parse;
    var fs2 = require("fs");
    var Stream = require("stream").Stream;
    var mime = require_mime_types();
    var asynckit = require_asynckit();
    var populate = require_populate();
    module2.exports = FormData2;
    util.inherits(FormData2, CombinedStream);
    function FormData2(options) {
      if (!(this instanceof FormData2)) {
        return new FormData2(options);
      }
      this._overheadLength = 0;
      this._valueLength = 0;
      this._valuesToMeasure = [];
      CombinedStream.call(this);
      options = options || {};
      for (var option in options) {
        this[option] = options[option];
      }
    }
    FormData2.LINE_BREAK = "\r\n";
    FormData2.DEFAULT_CONTENT_TYPE = "application/octet-stream";
    FormData2.prototype.append = function(field, value, options) {
      options = options || {};
      if (typeof options == "string") {
        options = { filename: options };
      }
      var append = CombinedStream.prototype.append.bind(this);
      if (typeof value == "number") {
        value = "" + value;
      }
      if (util.isArray(value)) {
        this._error(new Error("Arrays are not supported."));
        return;
      }
      var header = this._multiPartHeader(field, value, options);
      var footer = this._multiPartFooter();
      append(header);
      append(value);
      append(footer);
      this._trackLength(header, value, options);
    };
    FormData2.prototype._trackLength = function(header, value, options) {
      var valueLength = 0;
      if (options.knownLength != null) {
        valueLength += +options.knownLength;
      } else if (Buffer.isBuffer(value)) {
        valueLength = value.length;
      } else if (typeof value === "string") {
        valueLength = Buffer.byteLength(value);
      }
      this._valueLength += valueLength;
      this._overheadLength += Buffer.byteLength(header) + FormData2.LINE_BREAK.length;
      if (!value || !value.path && !(value.readable && value.hasOwnProperty("httpVersion")) && !(value instanceof Stream)) {
        return;
      }
      if (!options.knownLength) {
        this._valuesToMeasure.push(value);
      }
    };
    FormData2.prototype._lengthRetriever = function(value, callback) {
      if (value.hasOwnProperty("fd")) {
        if (value.end != void 0 && value.end != Infinity && value.start != void 0) {
          callback(null, value.end + 1 - (value.start ? value.start : 0));
        } else {
          fs2.stat(value.path, function(err, stat) {
            var fileSize;
            if (err) {
              callback(err);
              return;
            }
            fileSize = stat.size - (value.start ? value.start : 0);
            callback(null, fileSize);
          });
        }
      } else if (value.hasOwnProperty("httpVersion")) {
        callback(null, +value.headers["content-length"]);
      } else if (value.hasOwnProperty("httpModule")) {
        value.on("response", function(response) {
          value.pause();
          callback(null, +response.headers["content-length"]);
        });
        value.resume();
      } else {
        callback("Unknown stream");
      }
    };
    FormData2.prototype._multiPartHeader = function(field, value, options) {
      if (typeof options.header == "string") {
        return options.header;
      }
      var contentDisposition = this._getContentDisposition(value, options);
      var contentType = this._getContentType(value, options);
      var contents = "";
      var headers = {
        // add custom disposition as third element or keep it two elements if not
        "Content-Disposition": ["form-data", 'name="' + field + '"'].concat(contentDisposition || []),
        // if no content type. allow it to be empty array
        "Content-Type": [].concat(contentType || [])
      };
      if (typeof options.header == "object") {
        populate(headers, options.header);
      }
      var header;
      for (var prop in headers) {
        if (!headers.hasOwnProperty(prop))
          continue;
        header = headers[prop];
        if (header == null) {
          continue;
        }
        if (!Array.isArray(header)) {
          header = [header];
        }
        if (header.length) {
          contents += prop + ": " + header.join("; ") + FormData2.LINE_BREAK;
        }
      }
      return "--" + this.getBoundary() + FormData2.LINE_BREAK + contents + FormData2.LINE_BREAK;
    };
    FormData2.prototype._getContentDisposition = function(value, options) {
      var filename, contentDisposition;
      if (typeof options.filepath === "string") {
        filename = path2.normalize(options.filepath).replace(/\\/g, "/");
      } else if (options.filename || value.name || value.path) {
        filename = path2.basename(options.filename || value.name || value.path);
      } else if (value.readable && value.hasOwnProperty("httpVersion")) {
        filename = path2.basename(value.client._httpMessage.path || "");
      }
      if (filename) {
        contentDisposition = 'filename="' + filename + '"';
      }
      return contentDisposition;
    };
    FormData2.prototype._getContentType = function(value, options) {
      var contentType = options.contentType;
      if (!contentType && value.name) {
        contentType = mime.lookup(value.name);
      }
      if (!contentType && value.path) {
        contentType = mime.lookup(value.path);
      }
      if (!contentType && value.readable && value.hasOwnProperty("httpVersion")) {
        contentType = value.headers["content-type"];
      }
      if (!contentType && (options.filepath || options.filename)) {
        contentType = mime.lookup(options.filepath || options.filename);
      }
      if (!contentType && typeof value == "object") {
        contentType = FormData2.DEFAULT_CONTENT_TYPE;
      }
      return contentType;
    };
    FormData2.prototype._multiPartFooter = function() {
      return function(next) {
        var footer = FormData2.LINE_BREAK;
        var lastPart = this._streams.length === 0;
        if (lastPart) {
          footer += this._lastBoundary();
        }
        next(footer);
      }.bind(this);
    };
    FormData2.prototype._lastBoundary = function() {
      return "--" + this.getBoundary() + "--" + FormData2.LINE_BREAK;
    };
    FormData2.prototype.getHeaders = function(userHeaders) {
      var header;
      var formHeaders = {
        "content-type": "multipart/form-data; boundary=" + this.getBoundary()
      };
      for (header in userHeaders) {
        if (userHeaders.hasOwnProperty(header)) {
          formHeaders[header.toLowerCase()] = userHeaders[header];
        }
      }
      return formHeaders;
    };
    FormData2.prototype.setBoundary = function(boundary) {
      this._boundary = boundary;
    };
    FormData2.prototype.getBoundary = function() {
      if (!this._boundary) {
        this._generateBoundary();
      }
      return this._boundary;
    };
    FormData2.prototype.getBuffer = function() {
      var dataBuffer = new Buffer.alloc(0);
      var boundary = this.getBoundary();
      for (var i = 0, len = this._streams.length; i < len; i++) {
        if (typeof this._streams[i] !== "function") {
          if (Buffer.isBuffer(this._streams[i])) {
            dataBuffer = Buffer.concat([dataBuffer, this._streams[i]]);
          } else {
            dataBuffer = Buffer.concat([dataBuffer, Buffer.from(this._streams[i])]);
          }
          if (typeof this._streams[i] !== "string" || this._streams[i].substring(2, boundary.length + 2) !== boundary) {
            dataBuffer = Buffer.concat([dataBuffer, Buffer.from(FormData2.LINE_BREAK)]);
          }
        }
      }
      return Buffer.concat([dataBuffer, Buffer.from(this._lastBoundary())]);
    };
    FormData2.prototype._generateBoundary = function() {
      var boundary = "--------------------------";
      for (var i = 0; i < 24; i++) {
        boundary += Math.floor(Math.random() * 10).toString(16);
      }
      this._boundary = boundary;
    };
    FormData2.prototype.getLengthSync = function() {
      var knownLength = this._overheadLength + this._valueLength;
      if (this._streams.length) {
        knownLength += this._lastBoundary().length;
      }
      if (!this.hasKnownLength()) {
        this._error(new Error("Cannot calculate proper length in synchronous way."));
      }
      return knownLength;
    };
    FormData2.prototype.hasKnownLength = function() {
      var hasKnownLength = true;
      if (this._valuesToMeasure.length) {
        hasKnownLength = false;
      }
      return hasKnownLength;
    };
    FormData2.prototype.getLength = function(cb) {
      var knownLength = this._overheadLength + this._valueLength;
      if (this._streams.length) {
        knownLength += this._lastBoundary().length;
      }
      if (!this._valuesToMeasure.length) {
        process.nextTick(cb.bind(this, null, knownLength));
        return;
      }
      asynckit.parallel(this._valuesToMeasure, this._lengthRetriever, function(err, values) {
        if (err) {
          cb(err);
          return;
        }
        values.forEach(function(length) {
          knownLength += length;
        });
        cb(null, knownLength);
      });
    };
    FormData2.prototype.submit = function(params, cb) {
      var request, options, defaults = { method: "post" };
      if (typeof params == "string") {
        params = parseUrl(params);
        options = populate({
          port: params.port,
          path: params.pathname,
          host: params.hostname,
          protocol: params.protocol
        }, defaults);
      } else {
        options = populate(params, defaults);
        if (!options.port) {
          options.port = options.protocol == "https:" ? 443 : 80;
        }
      }
      options.headers = this.getHeaders(params.headers);
      if (options.protocol == "https:") {
        request = https.request(options);
      } else {
        request = http.request(options);
      }
      this.getLength(function(err, length) {
        if (err && err !== "Unknown stream") {
          this._error(err);
          return;
        }
        if (length) {
          request.setHeader("Content-Length", length);
        }
        this.pipe(request);
        if (cb) {
          var onResponse;
          var callback = function(error, responce) {
            request.removeListener("error", callback);
            request.removeListener("response", onResponse);
            return cb.call(this, error, responce);
          };
          onResponse = callback.bind(this, null);
          request.on("error", callback);
          request.on("response", onResponse);
        }
      }.bind(this));
      return request;
    };
    FormData2.prototype._error = function(err) {
      if (!this.error) {
        this.error = err;
        this.pause();
        this.emit("error", err);
      }
    };
    FormData2.prototype.toString = function() {
      return "[object FormData]";
    };
  }
});

// main.ts
var core = __toESM(require_core());
var fs = __toESM(require("fs"));
var import_form_data = __toESM(require_form_data());
var path = __toESM(require("path"));
function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}
var wait = (ms) => new Promise((resolve2) => setTimeout(resolve2, ms));
var clean = (str) => str.replace("-expected.png", "").replace("-actual.png", "").replace("-diff.png", "");
var isDiff = (str) => str.includes("diff");
var isActual = (str) => str.includes("actual");
var uploadImage = async () => {
  const p = core.getInput("path");
  const os = core.getInput("os").replace("-latest", "");
  const workspace = core.getInput("workspace");
  const fullPath = path.resolve(p);
  const upload = async (file, i = 0) => {
    if (i > 2) {
      return "error";
    }
    const body = new import_form_data.default();
    body.append("type", "file");
    body.append("image", file);
    try {
      const res = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Client-ID 11eb8a62f4c7927`
        },
        // @ts-expect-error correct types are not found. FormData are acceptable
        body
      }).then(handleErrors);
      const link = (await res.json()).data.link;
      if (!link) {
        throw new Error("no link");
      }
      return link;
    } catch (e) {
      await wait(3e3);
      return upload(file, i + 1);
    }
  };
  const getAllFiles = (currentPath) => {
    let results2 = [];
    const dirents = fs.readdirSync(currentPath, { withFileTypes: true });
    dirents.forEach((dirent) => {
      if (dirent.name.toLocaleLowerCase().includes("retry") || dirent.name.endsWith(".zip"))
        return;
      const newPath = path.resolve(currentPath, dirent.name);
      const stat = fs.statSync(newPath);
      if (stat && stat.isDirectory()) {
        results2 = results2.concat(getAllFiles(newPath));
      } else {
        results2.push(newPath);
      }
    });
    return results2;
  };
  let files;
  try {
    files = getAllFiles(fullPath);
  } catch {
    fs.writeFileSync(`${workspace}/images-${os}.json`, JSON.stringify([]));
    return core.setOutput("images", []);
  }
  const resultsP = files.map(async (file) => {
    const img = fs.readFileSync(`${file}`);
    return upload(img);
  });
  const results = await Promise.all(resultsP);
  const formatted = {};
  results.forEach((link, index) => {
    const file = files[index];
    const key = clean(file);
    if (!formatted[key])
      formatted[key] = { actual: {}, diff: {}, expected: {} };
    const subKey = isActual(file) ? "actual" : isDiff(file) ? "diff" : "expected";
    const name = path.parse(file).name;
    formatted[key][subKey] = {
      link,
      name
    };
  });
  const final = JSON.stringify(Object.values(formatted));
  console.log(final);
  fs.writeFileSync(`${workspace}/images-${os}.json`, final);
  core.setOutput("images", final);
};
uploadImage().catch((err) => {
  core.setFailed(err);
});
/*! Bundled license information:

mime-db/index.js:
  (*!
   * mime-db
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015-2022 Douglas Christopher Wilson
   * MIT Licensed
   *)

mime-types/index.js:
  (*!
   * mime-types
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)
*/
