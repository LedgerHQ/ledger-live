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

// ../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/utils.js
var require_utils = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.toCommandProperties = exports2.toCommandValue = void 0;
    function toCommandValue(input) {
      if (input === null || input === void 0) {
        return "";
      } else if (typeof input === "string" || input instanceof String) {
        return input;
      }
      return JSON.stringify(input);
    }
    exports2.toCommandValue = toCommandValue;
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
    exports2.toCommandProperties = toCommandProperties;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/command.js
var require_command = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/command.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
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
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
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
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.issue = exports2.issueCommand = void 0;
    var os = __importStar(require("os"));
    var utils_1 = require_utils();
    function issueCommand(command, properties, message) {
      const cmd = new Command(command, properties, message);
      process.stdout.write(cmd.toString() + os.EOL);
    }
    exports2.issueCommand = issueCommand;
    function issue(name, message = "") {
      issueCommand(name, {}, message);
    }
    exports2.issue = issue;
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

// ../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/file-command.js
var require_file_command = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/file-command.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
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
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
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
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.prepareKeyValueMessage = exports2.issueFileCommand = void 0;
    var fs = __importStar(require("fs"));
    var os = __importStar(require("os"));
    var uuid_1 = (init_esm_node(), __toCommonJS(esm_node_exports));
    var utils_1 = require_utils();
    function issueFileCommand(command, message) {
      const filePath = process.env[`GITHUB_${command}`];
      if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
      }
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
      }
      fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: "utf8"
      });
    }
    exports2.issueFileCommand = issueFileCommand;
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
    exports2.prepareKeyValueMessage = prepareKeyValueMessage;
  }
});

// ../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/proxy.js
var require_proxy = __commonJS({
  "../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/proxy.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.checkBypass = exports2.getProxyUrl = void 0;
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
    exports2.getProxyUrl = getProxyUrl;
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
    exports2.checkBypass = checkBypass;
  }
});

// ../../../node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/lib/tunnel.js
var require_tunnel = __commonJS({
  "../../../node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/lib/tunnel.js"(exports2) {
    "use strict";
    var net = require("net");
    var tls = require("tls");
    var http = require("http");
    var https = require("https");
    var events = require("events");
    var assert = require("assert");
    var util = require("util");
    exports2.httpOverHttp = httpOverHttp;
    exports2.httpsOverHttp = httpsOverHttp;
    exports2.httpOverHttps = httpOverHttps;
    exports2.httpsOverHttps = httpsOverHttps;
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
      var self2 = this;
      self2.options = options || {};
      self2.proxyOptions = self2.options.proxy || {};
      self2.maxSockets = self2.options.maxSockets || http.Agent.defaultMaxSockets;
      self2.requests = [];
      self2.sockets = [];
      self2.on("free", function onFree(socket, host, port, localAddress) {
        var options2 = toOptions(host, port, localAddress);
        for (var i = 0, len = self2.requests.length; i < len; ++i) {
          var pending = self2.requests[i];
          if (pending.host === options2.host && pending.port === options2.port) {
            self2.requests.splice(i, 1);
            pending.request.onSocket(socket);
            return;
          }
        }
        socket.destroy();
        self2.removeSocket(socket);
      });
    }
    util.inherits(TunnelingAgent, events.EventEmitter);
    TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
      var self2 = this;
      var options = mergeOptions({ request: req }, self2.options, toOptions(host, port, localAddress));
      if (self2.sockets.length >= this.maxSockets) {
        self2.requests.push(options);
        return;
      }
      self2.createSocket(options, function(socket) {
        socket.on("free", onFree);
        socket.on("close", onCloseOrRemove);
        socket.on("agentRemove", onCloseOrRemove);
        req.onSocket(socket);
        function onFree() {
          self2.emit("free", socket, options);
        }
        function onCloseOrRemove(err) {
          self2.removeSocket(socket);
          socket.removeListener("free", onFree);
          socket.removeListener("close", onCloseOrRemove);
          socket.removeListener("agentRemove", onCloseOrRemove);
        }
      });
    };
    TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
      var self2 = this;
      var placeholder = {};
      self2.sockets.push(placeholder);
      var connectOptions = mergeOptions({}, self2.proxyOptions, {
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
      var connectReq = self2.request(connectOptions);
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
          self2.removeSocket(placeholder);
          return;
        }
        if (head.length > 0) {
          debug("got illegal response body from proxy");
          socket.destroy();
          var error = new Error("got illegal response body from proxy");
          error.code = "ECONNRESET";
          options.request.emit("error", error);
          self2.removeSocket(placeholder);
          return;
        }
        debug("tunneling connection has established");
        self2.sockets[self2.sockets.indexOf(placeholder)] = socket;
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
        self2.removeSocket(placeholder);
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
      var self2 = this;
      TunnelingAgent.prototype.createSocket.call(self2, options, function(socket) {
        var hostHeader = options.request.getHeader("host");
        var tlsOptions = mergeOptions({}, self2.options, {
          socket,
          servername: hostHeader ? hostHeader.replace(/:.*$/, "") : options.host
        });
        var secureSocket = tls.connect(0, tlsOptions);
        self2.sockets[self2.sockets.indexOf(socket)] = secureSocket;
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
    exports2.debug = debug;
  }
});

// ../../../node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/index.js
var require_tunnel2 = __commonJS({
  "../../../node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_tunnel();
  }
});

// ../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/index.js
var require_lib = __commonJS({
  "../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
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
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
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
    var __awaiter = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
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
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.HttpClient = exports2.isHttps = exports2.HttpClientResponse = exports2.HttpClientError = exports2.getProxyUrl = exports2.MediaTypes = exports2.Headers = exports2.HttpCodes = void 0;
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
    })(HttpCodes = exports2.HttpCodes || (exports2.HttpCodes = {}));
    var Headers;
    (function(Headers2) {
      Headers2["Accept"] = "accept";
      Headers2["ContentType"] = "content-type";
    })(Headers = exports2.Headers || (exports2.Headers = {}));
    var MediaTypes;
    (function(MediaTypes2) {
      MediaTypes2["ApplicationJson"] = "application/json";
    })(MediaTypes = exports2.MediaTypes || (exports2.MediaTypes = {}));
    function getProxyUrl(serverUrl) {
      const proxyUrl = pm.getProxyUrl(new URL(serverUrl));
      return proxyUrl ? proxyUrl.href : "";
    }
    exports2.getProxyUrl = getProxyUrl;
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
    exports2.HttpClientError = HttpClientError;
    var HttpClientResponse = class {
      constructor(message) {
        this.message = message;
      }
      readBody() {
        return __awaiter(this, void 0, void 0, function* () {
          return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let output = Buffer.alloc(0);
            this.message.on("data", (chunk) => {
              output = Buffer.concat([output, chunk]);
            });
            this.message.on("end", () => {
              resolve(output.toString());
            });
          }));
        });
      }
    };
    exports2.HttpClientResponse = HttpClientResponse;
    function isHttps(requestUrl) {
      const parsedUrl = new URL(requestUrl);
      return parsedUrl.protocol === "https:";
    }
    exports2.isHttps = isHttps;
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
      postJson(requestUrl, obj2, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const data = JSON.stringify(obj2, null, 2);
          additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
          additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
          const res = yield this.post(requestUrl, data, additionalHeaders);
          return this._processResponse(res, this.requestOptions);
        });
      }
      putJson(requestUrl, obj2, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const data = JSON.stringify(obj2, null, 2);
          additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
          additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
          const res = yield this.put(requestUrl, data, additionalHeaders);
          return this._processResponse(res, this.requestOptions);
        });
      }
      patchJson(requestUrl, obj2, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const data = JSON.stringify(obj2, null, 2);
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
          return new Promise((resolve, reject) => {
            function callbackForResult(err, res) {
              if (err) {
                reject(err);
              } else if (!res) {
                reject(new Error("Unknown error"));
              } else {
                resolve(res);
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
          return new Promise((resolve) => setTimeout(() => resolve(), ms));
        });
      }
      _processResponse(res, options) {
        return __awaiter(this, void 0, void 0, function* () {
          return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const statusCode = res.message.statusCode || 0;
            const response = {
              statusCode,
              result: null,
              headers: {}
            };
            if (statusCode === HttpCodes.NotFound) {
              resolve(response);
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
            let obj2;
            let contents;
            try {
              contents = yield res.readBody();
              if (contents && contents.length > 0) {
                if (options && options.deserializeDates) {
                  obj2 = JSON.parse(contents, dateTimeDeserializer);
                } else {
                  obj2 = JSON.parse(contents);
                }
                response.result = obj2;
              }
              response.headers = res.message.headers;
            } catch (err) {
            }
            if (statusCode > 299) {
              let msg;
              if (obj2 && obj2.message) {
                msg = obj2.message;
              } else if (contents && contents.length > 0) {
                msg = contents;
              } else {
                msg = `Failed request: (${statusCode})`;
              }
              const err = new HttpClientError(msg, statusCode);
              err.result = response.result;
              reject(err);
            } else {
              resolve(response);
            }
          }));
        });
      }
    };
    exports2.HttpClient = HttpClient;
    var lowercaseKeys = (obj2) => Object.keys(obj2).reduce((c, k) => (c[k.toLowerCase()] = obj2[k], c), {});
  }
});

// ../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/auth.js
var require_auth = __commonJS({
  "../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/auth.js"(exports2) {
    "use strict";
    var __awaiter = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
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
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PersonalAccessTokenCredentialHandler = exports2.BearerCredentialHandler = exports2.BasicCredentialHandler = void 0;
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
    exports2.BasicCredentialHandler = BasicCredentialHandler;
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
    exports2.BearerCredentialHandler = BearerCredentialHandler;
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
    exports2.PersonalAccessTokenCredentialHandler = PersonalAccessTokenCredentialHandler;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/oidc-utils.js
var require_oidc_utils = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/oidc-utils.js"(exports2) {
    "use strict";
    var __awaiter = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
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
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.OidcClient = void 0;
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
 
        Error Message: ${error.message}`);
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
    exports2.OidcClient = OidcClient;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/summary.js
var require_summary = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/summary.js"(exports2) {
    "use strict";
    var __awaiter = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
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
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.summary = exports2.markdownSummary = exports2.SUMMARY_DOCS_URL = exports2.SUMMARY_ENV_VAR = void 0;
    var os_1 = require("os");
    var fs_1 = require("fs");
    var { access, appendFile, writeFile } = fs_1.promises;
    exports2.SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";
    exports2.SUMMARY_DOCS_URL = "https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary";
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
          const pathFromEnv = process.env[exports2.SUMMARY_ENV_VAR];
          if (!pathFromEnv) {
            throw new Error(`Unable to find environment variable for $${exports2.SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
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
    exports2.markdownSummary = _summary;
    exports2.summary = _summary;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/path-utils.js
var require_path_utils = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/path-utils.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
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
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
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
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.toPlatformPath = exports2.toWin32Path = exports2.toPosixPath = void 0;
    var path = __importStar(require("path"));
    function toPosixPath(pth) {
      return pth.replace(/[\\]/g, "/");
    }
    exports2.toPosixPath = toPosixPath;
    function toWin32Path(pth) {
      return pth.replace(/[/]/g, "\\");
    }
    exports2.toWin32Path = toWin32Path;
    function toPlatformPath(pth) {
      return pth.replace(/[/\\]/g, path.sep);
    }
    exports2.toPlatformPath = toPlatformPath;
  }
});

// ../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/core.js
var require_core = __commonJS({
  "../../../node_modules/.pnpm/@actions+core@1.10.1/node_modules/@actions/core/lib/core.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
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
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
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
    var __awaiter = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
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
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getIDToken = exports2.getState = exports2.saveState = exports2.group = exports2.endGroup = exports2.startGroup = exports2.info = exports2.notice = exports2.warning = exports2.error = exports2.debug = exports2.isDebug = exports2.setFailed = exports2.setCommandEcho = exports2.setOutput = exports2.getBooleanInput = exports2.getMultilineInput = exports2.getInput = exports2.addPath = exports2.setSecret = exports2.exportVariable = exports2.ExitCode = void 0;
    var command_1 = require_command();
    var file_command_1 = require_file_command();
    var utils_1 = require_utils();
    var os = __importStar(require("os"));
    var path = __importStar(require("path"));
    var oidc_utils_1 = require_oidc_utils();
    var ExitCode;
    (function(ExitCode2) {
      ExitCode2[ExitCode2["Success"] = 0] = "Success";
      ExitCode2[ExitCode2["Failure"] = 1] = "Failure";
    })(ExitCode = exports2.ExitCode || (exports2.ExitCode = {}));
    function exportVariable(name, val) {
      const convertedVal = utils_1.toCommandValue(val);
      process.env[name] = convertedVal;
      const filePath = process.env["GITHUB_ENV"] || "";
      if (filePath) {
        return file_command_1.issueFileCommand("ENV", file_command_1.prepareKeyValueMessage(name, val));
      }
      command_1.issueCommand("set-env", { name }, convertedVal);
    }
    exports2.exportVariable = exportVariable;
    function setSecret(secret) {
      command_1.issueCommand("add-mask", {}, secret);
    }
    exports2.setSecret = setSecret;
    function addPath(inputPath) {
      const filePath = process.env["GITHUB_PATH"] || "";
      if (filePath) {
        file_command_1.issueFileCommand("PATH", inputPath);
      } else {
        command_1.issueCommand("add-path", {}, inputPath);
      }
      process.env["PATH"] = `${inputPath}${path.delimiter}${process.env["PATH"]}`;
    }
    exports2.addPath = addPath;
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
    exports2.getInput = getInput2;
    function getMultilineInput(name, options) {
      const inputs = getInput2(name, options).split("\n").filter((x) => x !== "");
      if (options && options.trimWhitespace === false) {
        return inputs;
      }
      return inputs.map((input) => input.trim());
    }
    exports2.getMultilineInput = getMultilineInput;
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
    exports2.getBooleanInput = getBooleanInput;
    function setOutput(name, value) {
      const filePath = process.env["GITHUB_OUTPUT"] || "";
      if (filePath) {
        return file_command_1.issueFileCommand("OUTPUT", file_command_1.prepareKeyValueMessage(name, value));
      }
      process.stdout.write(os.EOL);
      command_1.issueCommand("set-output", { name }, utils_1.toCommandValue(value));
    }
    exports2.setOutput = setOutput;
    function setCommandEcho(enabled) {
      command_1.issue("echo", enabled ? "on" : "off");
    }
    exports2.setCommandEcho = setCommandEcho;
    function setFailed2(message) {
      process.exitCode = ExitCode.Failure;
      error(message);
    }
    exports2.setFailed = setFailed2;
    function isDebug() {
      return process.env["RUNNER_DEBUG"] === "1";
    }
    exports2.isDebug = isDebug;
    function debug(message) {
      command_1.issueCommand("debug", {}, message);
    }
    exports2.debug = debug;
    function error(message, properties = {}) {
      command_1.issueCommand("error", utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
    }
    exports2.error = error;
    function warning(message, properties = {}) {
      command_1.issueCommand("warning", utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
    }
    exports2.warning = warning;
    function notice(message, properties = {}) {
      command_1.issueCommand("notice", utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
    }
    exports2.notice = notice;
    function info(message) {
      process.stdout.write(message + os.EOL);
    }
    exports2.info = info;
    function startGroup(name) {
      command_1.issue("group", name);
    }
    exports2.startGroup = startGroup;
    function endGroup() {
      command_1.issue("endgroup");
    }
    exports2.endGroup = endGroup;
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
    exports2.group = group;
    function saveState(name, value) {
      const filePath = process.env["GITHUB_STATE"] || "";
      if (filePath) {
        return file_command_1.issueFileCommand("STATE", file_command_1.prepareKeyValueMessage(name, value));
      }
      command_1.issueCommand("save-state", { name }, utils_1.toCommandValue(value));
    }
    exports2.saveState = saveState;
    function getState(name) {
      return process.env[`STATE_${name}`] || "";
    }
    exports2.getState = getState;
    function getIDToken(aud) {
      return __awaiter(this, void 0, void 0, function* () {
        return yield oidc_utils_1.OidcClient.getIDToken(aud);
      });
    }
    exports2.getIDToken = getIDToken;
    var summary_1 = require_summary();
    Object.defineProperty(exports2, "summary", { enumerable: true, get: function() {
      return summary_1.summary;
    } });
    var summary_2 = require_summary();
    Object.defineProperty(exports2, "markdownSummary", { enumerable: true, get: function() {
      return summary_2.markdownSummary;
    } });
    var path_utils_1 = require_path_utils();
    Object.defineProperty(exports2, "toPosixPath", { enumerable: true, get: function() {
      return path_utils_1.toPosixPath;
    } });
    Object.defineProperty(exports2, "toWin32Path", { enumerable: true, get: function() {
      return path_utils_1.toWin32Path;
    } });
    Object.defineProperty(exports2, "toPlatformPath", { enumerable: true, get: function() {
      return path_utils_1.toPlatformPath;
    } });
  }
});

// ../../../node_modules/.pnpm/listenercount@1.0.1/node_modules/listenercount/index.js
var require_listenercount = __commonJS({
  "../../../node_modules/.pnpm/listenercount@1.0.1/node_modules/listenercount/index.js"(exports2, module2) {
    "use strict";
    var listenerCount = require("events").listenerCount;
    listenerCount = listenerCount || function(ee, event) {
      var listeners = ee && ee._events && ee._events[event];
      if (Array.isArray(listeners)) {
        return listeners.length;
      } else if (typeof listeners === "function") {
        return 1;
      } else {
        return 0;
      }
    };
    module2.exports = listenerCount;
  }
});

// ../../../node_modules/.pnpm/buffer-indexof-polyfill@1.0.2/node_modules/buffer-indexof-polyfill/init-buffer.js
var require_init_buffer = __commonJS({
  "../../../node_modules/.pnpm/buffer-indexof-polyfill@1.0.2/node_modules/buffer-indexof-polyfill/init-buffer.js"(exports2, module2) {
    "use strict";
    module2.exports = function initBuffer(val) {
      var nodeVersion = process && process.version ? process.version : "v5.0.0";
      var major = nodeVersion.split(".")[0].replace("v", "");
      return major < 6 ? new Buffer(val) : Buffer.from(val);
    };
  }
});

// ../../../node_modules/.pnpm/buffer-indexof-polyfill@1.0.2/node_modules/buffer-indexof-polyfill/index.js
var require_buffer_indexof_polyfill = __commonJS({
  "../../../node_modules/.pnpm/buffer-indexof-polyfill@1.0.2/node_modules/buffer-indexof-polyfill/index.js"() {
    "use strict";
    var initBuffer = require_init_buffer();
    if (!Buffer.prototype.indexOf) {
      Buffer.prototype.indexOf = function(value, offset) {
        offset = offset || 0;
        if (typeof value === "string" || value instanceof String) {
          value = initBuffer(value);
        } else if (typeof value === "number" || value instanceof Number) {
          value = initBuffer([value]);
        }
        var len = value.length;
        for (var i = offset; i <= this.length - len; i++) {
          var mismatch = false;
          for (var j = 0; j < len; j++) {
            if (this[i + j] != value[j]) {
              mismatch = true;
              break;
            }
          }
          if (!mismatch) {
            return i;
          }
        }
        return -1;
      };
    }
    function bufferLastIndexOf(value, offset) {
      if (typeof value === "string" || value instanceof String) {
        value = initBuffer(value);
      } else if (typeof value === "number" || value instanceof Number) {
        value = initBuffer([value]);
      }
      var len = value.length;
      offset = offset || this.length - len;
      for (var i = offset; i >= 0; i--) {
        var mismatch = false;
        for (var j = 0; j < len; j++) {
          if (this[i + j] != value[j]) {
            mismatch = true;
            break;
          }
        }
        if (!mismatch) {
          return i;
        }
      }
      return -1;
    }
    if (Buffer.prototype.lastIndexOf) {
      if (initBuffer("ABC").lastIndexOf("ABC") === -1)
        Buffer.prototype.lastIndexOf = bufferLastIndexOf;
    } else {
      Buffer.prototype.lastIndexOf = bufferLastIndexOf;
    }
  }
});

// ../../../node_modules/.pnpm/setimmediate@1.0.5/node_modules/setimmediate/setImmediate.js
var require_setImmediate = __commonJS({
  "../../../node_modules/.pnpm/setimmediate@1.0.5/node_modules/setimmediate/setImmediate.js"(exports2) {
    "use strict";
    (function(global2, undefined2) {
      "use strict";
      if (global2.setImmediate) {
        return;
      }
      var nextHandle = 1;
      var tasksByHandle = {};
      var currentlyRunningATask = false;
      var doc = global2.document;
      var registerImmediate;
      function setImmediate2(callback) {
        if (typeof callback !== "function") {
          callback = new Function("" + callback);
        }
        var args = new Array(arguments.length - 1);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
        }
        var task = { callback, args };
        tasksByHandle[nextHandle] = task;
        registerImmediate(nextHandle);
        return nextHandle++;
      }
      function clearImmediate(handle) {
        delete tasksByHandle[handle];
      }
      function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
          case 0:
            callback();
            break;
          case 1:
            callback(args[0]);
            break;
          case 2:
            callback(args[0], args[1]);
            break;
          case 3:
            callback(args[0], args[1], args[2]);
            break;
          default:
            callback.apply(undefined2, args);
            break;
        }
      }
      function runIfPresent(handle) {
        if (currentlyRunningATask) {
          setTimeout(runIfPresent, 0, handle);
        } else {
          var task = tasksByHandle[handle];
          if (task) {
            currentlyRunningATask = true;
            try {
              run(task);
            } finally {
              clearImmediate(handle);
              currentlyRunningATask = false;
            }
          }
        }
      }
      function installNextTickImplementation() {
        registerImmediate = function(handle) {
          process.nextTick(function() {
            runIfPresent(handle);
          });
        };
      }
      function canUsePostMessage() {
        if (global2.postMessage && !global2.importScripts) {
          var postMessageIsAsynchronous = true;
          var oldOnMessage = global2.onmessage;
          global2.onmessage = function() {
            postMessageIsAsynchronous = false;
          };
          global2.postMessage("", "*");
          global2.onmessage = oldOnMessage;
          return postMessageIsAsynchronous;
        }
      }
      function installPostMessageImplementation() {
        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
          if (event.source === global2 && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
            runIfPresent(+event.data.slice(messagePrefix.length));
          }
        };
        if (global2.addEventListener) {
          global2.addEventListener("message", onGlobalMessage, false);
        } else {
          global2.attachEvent("onmessage", onGlobalMessage);
        }
        registerImmediate = function(handle) {
          global2.postMessage(messagePrefix + handle, "*");
        };
      }
      function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
          var handle = event.data;
          runIfPresent(handle);
        };
        registerImmediate = function(handle) {
          channel.port2.postMessage(handle);
        };
      }
      function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
          var script = doc.createElement("script");
          script.onreadystatechange = function() {
            runIfPresent(handle);
            script.onreadystatechange = null;
            html.removeChild(script);
            script = null;
          };
          html.appendChild(script);
        };
      }
      function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
          setTimeout(runIfPresent, 0, handle);
        };
      }
      var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global2);
      attachTo = attachTo && attachTo.setTimeout ? attachTo : global2;
      if ({}.toString.call(global2.process) === "[object process]") {
        installNextTickImplementation();
      } else if (canUsePostMessage()) {
        installPostMessageImplementation();
      } else if (global2.MessageChannel) {
        installMessageChannelImplementation();
      } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        installReadyStateChangeImplementation();
      } else {
        installSetTimeoutImplementation();
      }
      attachTo.setImmediate = setImmediate2;
      attachTo.clearImmediate = clearImmediate;
    })(typeof self === "undefined" ? typeof global === "undefined" ? exports2 : global : self);
  }
});

// ../../../node_modules/.pnpm/traverse@0.3.9/node_modules/traverse/index.js
var require_traverse = __commonJS({
  "../../../node_modules/.pnpm/traverse@0.3.9/node_modules/traverse/index.js"(exports2, module2) {
    "use strict";
    module2.exports = Traverse;
    function Traverse(obj2) {
      if (!(this instanceof Traverse))
        return new Traverse(obj2);
      this.value = obj2;
    }
    Traverse.prototype.get = function(ps) {
      var node = this.value;
      for (var i = 0; i < ps.length; i++) {
        var key = ps[i];
        if (!Object.hasOwnProperty.call(node, key)) {
          node = void 0;
          break;
        }
        node = node[key];
      }
      return node;
    };
    Traverse.prototype.set = function(ps, value) {
      var node = this.value;
      for (var i = 0; i < ps.length - 1; i++) {
        var key = ps[i];
        if (!Object.hasOwnProperty.call(node, key))
          node[key] = {};
        node = node[key];
      }
      node[ps[i]] = value;
      return value;
    };
    Traverse.prototype.map = function(cb) {
      return walk(this.value, cb, true);
    };
    Traverse.prototype.forEach = function(cb) {
      this.value = walk(this.value, cb, false);
      return this.value;
    };
    Traverse.prototype.reduce = function(cb, init) {
      var skip = arguments.length === 1;
      var acc = skip ? this.value : init;
      this.forEach(function(x) {
        if (!this.isRoot || !skip) {
          acc = cb.call(this, acc, x);
        }
      });
      return acc;
    };
    Traverse.prototype.deepEqual = function(obj2) {
      if (arguments.length !== 1) {
        throw new Error(
          "deepEqual requires exactly one object to compare against"
        );
      }
      var equal = true;
      var node = obj2;
      this.forEach(function(y) {
        var notEqual = function() {
          equal = false;
          return void 0;
        }.bind(this);
        if (!this.isRoot) {
          if (typeof node !== "object")
            return notEqual();
          node = node[this.key];
        }
        var x = node;
        this.post(function() {
          node = x;
        });
        var toS = function(o) {
          return Object.prototype.toString.call(o);
        };
        if (this.circular) {
          if (Traverse(obj2).get(this.circular.path) !== x)
            notEqual();
        } else if (typeof x !== typeof y) {
          notEqual();
        } else if (x === null || y === null || x === void 0 || y === void 0) {
          if (x !== y)
            notEqual();
        } else if (x.__proto__ !== y.__proto__) {
          notEqual();
        } else if (x === y) {
        } else if (typeof x === "function") {
          if (x instanceof RegExp) {
            if (x.toString() != y.toString())
              notEqual();
          } else if (x !== y)
            notEqual();
        } else if (typeof x === "object") {
          if (toS(y) === "[object Arguments]" || toS(x) === "[object Arguments]") {
            if (toS(x) !== toS(y)) {
              notEqual();
            }
          } else if (x instanceof Date || y instanceof Date) {
            if (!(x instanceof Date) || !(y instanceof Date) || x.getTime() !== y.getTime()) {
              notEqual();
            }
          } else {
            var kx = Object.keys(x);
            var ky = Object.keys(y);
            if (kx.length !== ky.length)
              return notEqual();
            for (var i = 0; i < kx.length; i++) {
              var k = kx[i];
              if (!Object.hasOwnProperty.call(y, k)) {
                notEqual();
              }
            }
          }
        }
      });
      return equal;
    };
    Traverse.prototype.paths = function() {
      var acc = [];
      this.forEach(function(x) {
        acc.push(this.path);
      });
      return acc;
    };
    Traverse.prototype.nodes = function() {
      var acc = [];
      this.forEach(function(x) {
        acc.push(this.node);
      });
      return acc;
    };
    Traverse.prototype.clone = function() {
      var parents = [], nodes = [];
      return function clone(src) {
        for (var i = 0; i < parents.length; i++) {
          if (parents[i] === src) {
            return nodes[i];
          }
        }
        if (typeof src === "object" && src !== null) {
          var dst = copy(src);
          parents.push(src);
          nodes.push(dst);
          Object.keys(src).forEach(function(key) {
            dst[key] = clone(src[key]);
          });
          parents.pop();
          nodes.pop();
          return dst;
        } else {
          return src;
        }
      }(this.value);
    };
    function walk(root, cb, immutable) {
      var path = [];
      var parents = [];
      var alive = true;
      return function walker(node_) {
        var node = immutable ? copy(node_) : node_;
        var modifiers = {};
        var state = {
          node,
          node_,
          path: [].concat(path),
          parent: parents.slice(-1)[0],
          key: path.slice(-1)[0],
          isRoot: path.length === 0,
          level: path.length,
          circular: null,
          update: function(x) {
            if (!state.isRoot) {
              state.parent.node[state.key] = x;
            }
            state.node = x;
          },
          "delete": function() {
            delete state.parent.node[state.key];
          },
          remove: function() {
            if (Array.isArray(state.parent.node)) {
              state.parent.node.splice(state.key, 1);
            } else {
              delete state.parent.node[state.key];
            }
          },
          before: function(f) {
            modifiers.before = f;
          },
          after: function(f) {
            modifiers.after = f;
          },
          pre: function(f) {
            modifiers.pre = f;
          },
          post: function(f) {
            modifiers.post = f;
          },
          stop: function() {
            alive = false;
          }
        };
        if (!alive)
          return state;
        if (typeof node === "object" && node !== null) {
          state.isLeaf = Object.keys(node).length == 0;
          for (var i = 0; i < parents.length; i++) {
            if (parents[i].node_ === node_) {
              state.circular = parents[i];
              break;
            }
          }
        } else {
          state.isLeaf = true;
        }
        state.notLeaf = !state.isLeaf;
        state.notRoot = !state.isRoot;
        var ret2 = cb.call(state, state.node);
        if (ret2 !== void 0 && state.update)
          state.update(ret2);
        if (modifiers.before)
          modifiers.before.call(state, state.node);
        if (typeof state.node == "object" && state.node !== null && !state.circular) {
          parents.push(state);
          var keys = Object.keys(state.node);
          keys.forEach(function(key, i2) {
            path.push(key);
            if (modifiers.pre)
              modifiers.pre.call(state, state.node[key], key);
            var child = walker(state.node[key]);
            if (immutable && Object.hasOwnProperty.call(state.node, key)) {
              state.node[key] = child.node;
            }
            child.isLast = i2 == keys.length - 1;
            child.isFirst = i2 == 0;
            if (modifiers.post)
              modifiers.post.call(state, child);
            path.pop();
          });
          parents.pop();
        }
        if (modifiers.after)
          modifiers.after.call(state, state.node);
        return state;
      }(root).node;
    }
    Object.keys(Traverse.prototype).forEach(function(key) {
      Traverse[key] = function(obj2) {
        var args = [].slice.call(arguments, 1);
        var t = Traverse(obj2);
        return t[key].apply(t, args);
      };
    });
    function copy(src) {
      if (typeof src === "object" && src !== null) {
        var dst;
        if (Array.isArray(src)) {
          dst = [];
        } else if (src instanceof Date) {
          dst = new Date(src);
        } else if (src instanceof Boolean) {
          dst = new Boolean(src);
        } else if (src instanceof Number) {
          dst = new Number(src);
        } else if (src instanceof String) {
          dst = new String(src);
        } else {
          dst = Object.create(Object.getPrototypeOf(src));
        }
        Object.keys(src).forEach(function(key) {
          dst[key] = src[key];
        });
        return dst;
      } else
        return src;
    }
  }
});

// ../../../node_modules/.pnpm/chainsaw@0.1.0/node_modules/chainsaw/index.js
var require_chainsaw = __commonJS({
  "../../../node_modules/.pnpm/chainsaw@0.1.0/node_modules/chainsaw/index.js"(exports2, module2) {
    "use strict";
    var Traverse = require_traverse();
    var EventEmitter = require("events").EventEmitter;
    module2.exports = Chainsaw;
    function Chainsaw(builder) {
      var saw = Chainsaw.saw(builder, {});
      var r = builder.call(saw.handlers, saw);
      if (r !== void 0)
        saw.handlers = r;
      saw.record();
      return saw.chain();
    }
    Chainsaw.light = function ChainsawLight(builder) {
      var saw = Chainsaw.saw(builder, {});
      var r = builder.call(saw.handlers, saw);
      if (r !== void 0)
        saw.handlers = r;
      return saw.chain();
    };
    Chainsaw.saw = function(builder, handlers) {
      var saw = new EventEmitter();
      saw.handlers = handlers;
      saw.actions = [];
      saw.chain = function() {
        var ch = Traverse(saw.handlers).map(function(node) {
          if (this.isRoot)
            return node;
          var ps = this.path;
          if (typeof node === "function") {
            this.update(function() {
              saw.actions.push({
                path: ps,
                args: [].slice.call(arguments)
              });
              return ch;
            });
          }
        });
        process.nextTick(function() {
          saw.emit("begin");
          saw.next();
        });
        return ch;
      };
      saw.pop = function() {
        return saw.actions.shift();
      };
      saw.next = function() {
        var action = saw.pop();
        if (!action) {
          saw.emit("end");
        } else if (!action.trap) {
          var node = saw.handlers;
          action.path.forEach(function(key) {
            node = node[key];
          });
          node.apply(saw.handlers, action.args);
        }
      };
      saw.nest = function(cb) {
        var args = [].slice.call(arguments, 1);
        var autonext = true;
        if (typeof cb === "boolean") {
          var autonext = cb;
          cb = args.shift();
        }
        var s = Chainsaw.saw(builder, {});
        var r = builder.call(s.handlers, s);
        if (r !== void 0)
          s.handlers = r;
        if ("undefined" !== typeof saw.step) {
          s.record();
        }
        cb.apply(s.chain(), args);
        if (autonext !== false)
          s.on("end", saw.next);
      };
      saw.record = function() {
        upgradeChainsaw(saw);
      };
      ["trap", "down", "jump"].forEach(function(method) {
        saw[method] = function() {
          throw new Error("To use the trap, down and jump features, please call record() first to start recording actions.");
        };
      });
      return saw;
    };
    function upgradeChainsaw(saw) {
      saw.step = 0;
      saw.pop = function() {
        return saw.actions[saw.step++];
      };
      saw.trap = function(name, cb) {
        var ps = Array.isArray(name) ? name : [name];
        saw.actions.push({
          path: ps,
          step: saw.step,
          cb,
          trap: true
        });
      };
      saw.down = function(name) {
        var ps = (Array.isArray(name) ? name : [name]).join("/");
        var i = saw.actions.slice(saw.step).map(function(x) {
          if (x.trap && x.step <= saw.step)
            return false;
          return x.path.join("/") == ps;
        }).indexOf(true);
        if (i >= 0)
          saw.step += i;
        else
          saw.step = saw.actions.length;
        var act = saw.actions[saw.step - 1];
        if (act && act.trap) {
          saw.step = act.step;
          act.cb();
        } else
          saw.next();
      };
      saw.jump = function(step) {
        saw.step = step;
        saw.next();
      };
    }
  }
});

// ../../../node_modules/.pnpm/buffers@0.1.1/node_modules/buffers/index.js
var require_buffers = __commonJS({
  "../../../node_modules/.pnpm/buffers@0.1.1/node_modules/buffers/index.js"(exports2, module2) {
    "use strict";
    module2.exports = Buffers;
    function Buffers(bufs) {
      if (!(this instanceof Buffers))
        return new Buffers(bufs);
      this.buffers = bufs || [];
      this.length = this.buffers.reduce(function(size, buf) {
        return size + buf.length;
      }, 0);
    }
    Buffers.prototype.push = function() {
      for (var i = 0; i < arguments.length; i++) {
        if (!Buffer.isBuffer(arguments[i])) {
          throw new TypeError("Tried to push a non-buffer");
        }
      }
      for (var i = 0; i < arguments.length; i++) {
        var buf = arguments[i];
        this.buffers.push(buf);
        this.length += buf.length;
      }
      return this.length;
    };
    Buffers.prototype.unshift = function() {
      for (var i = 0; i < arguments.length; i++) {
        if (!Buffer.isBuffer(arguments[i])) {
          throw new TypeError("Tried to unshift a non-buffer");
        }
      }
      for (var i = 0; i < arguments.length; i++) {
        var buf = arguments[i];
        this.buffers.unshift(buf);
        this.length += buf.length;
      }
      return this.length;
    };
    Buffers.prototype.copy = function(dst, dStart, start, end) {
      return this.slice(start, end).copy(dst, dStart, 0, end - start);
    };
    Buffers.prototype.splice = function(i, howMany) {
      var buffers = this.buffers;
      var index = i >= 0 ? i : this.length - i;
      var reps = [].slice.call(arguments, 2);
      if (howMany === void 0) {
        howMany = this.length - index;
      } else if (howMany > this.length - index) {
        howMany = this.length - index;
      }
      for (var i = 0; i < reps.length; i++) {
        this.length += reps[i].length;
      }
      var removed = new Buffers();
      var bytes = 0;
      var startBytes = 0;
      for (var ii = 0; ii < buffers.length && startBytes + buffers[ii].length < index; ii++) {
        startBytes += buffers[ii].length;
      }
      if (index - startBytes > 0) {
        var start = index - startBytes;
        if (start + howMany < buffers[ii].length) {
          removed.push(buffers[ii].slice(start, start + howMany));
          var orig = buffers[ii];
          var buf0 = new Buffer(start);
          for (var i = 0; i < start; i++) {
            buf0[i] = orig[i];
          }
          var buf1 = new Buffer(orig.length - start - howMany);
          for (var i = start + howMany; i < orig.length; i++) {
            buf1[i - howMany - start] = orig[i];
          }
          if (reps.length > 0) {
            var reps_ = reps.slice();
            reps_.unshift(buf0);
            reps_.push(buf1);
            buffers.splice.apply(buffers, [ii, 1].concat(reps_));
            ii += reps_.length;
            reps = [];
          } else {
            buffers.splice(ii, 1, buf0, buf1);
            ii += 2;
          }
        } else {
          removed.push(buffers[ii].slice(start));
          buffers[ii] = buffers[ii].slice(0, start);
          ii++;
        }
      }
      if (reps.length > 0) {
        buffers.splice.apply(buffers, [ii, 0].concat(reps));
        ii += reps.length;
      }
      while (removed.length < howMany) {
        var buf = buffers[ii];
        var len = buf.length;
        var take = Math.min(len, howMany - removed.length);
        if (take === len) {
          removed.push(buf);
          buffers.splice(ii, 1);
        } else {
          removed.push(buf.slice(0, take));
          buffers[ii] = buffers[ii].slice(take);
        }
      }
      this.length -= removed.length;
      return removed;
    };
    Buffers.prototype.slice = function(i, j) {
      var buffers = this.buffers;
      if (j === void 0)
        j = this.length;
      if (i === void 0)
        i = 0;
      if (j > this.length)
        j = this.length;
      var startBytes = 0;
      for (var si = 0; si < buffers.length && startBytes + buffers[si].length <= i; si++) {
        startBytes += buffers[si].length;
      }
      var target = new Buffer(j - i);
      var ti = 0;
      for (var ii = si; ti < j - i && ii < buffers.length; ii++) {
        var len = buffers[ii].length;
        var start = ti === 0 ? i - startBytes : 0;
        var end = ti + len >= j - i ? Math.min(start + (j - i) - ti, len) : len;
        buffers[ii].copy(target, ti, start, end);
        ti += end - start;
      }
      return target;
    };
    Buffers.prototype.pos = function(i) {
      if (i < 0 || i >= this.length)
        throw new Error("oob");
      var l2 = i, bi = 0, bu = null;
      for (; ; ) {
        bu = this.buffers[bi];
        if (l2 < bu.length) {
          return { buf: bi, offset: l2 };
        } else {
          l2 -= bu.length;
        }
        bi++;
      }
    };
    Buffers.prototype.get = function get(i) {
      var pos = this.pos(i);
      return this.buffers[pos.buf].get(pos.offset);
    };
    Buffers.prototype.set = function set(i, b) {
      var pos = this.pos(i);
      return this.buffers[pos.buf].set(pos.offset, b);
    };
    Buffers.prototype.indexOf = function(needle, offset) {
      if ("string" === typeof needle) {
        needle = new Buffer(needle);
      } else if (needle instanceof Buffer) {
      } else {
        throw new Error("Invalid type for a search string");
      }
      if (!needle.length) {
        return 0;
      }
      if (!this.length) {
        return -1;
      }
      var i = 0, j = 0, match = 0, mstart, pos = 0;
      if (offset) {
        var p = this.pos(offset);
        i = p.buf;
        j = p.offset;
        pos = offset;
      }
      for (; ; ) {
        while (j >= this.buffers[i].length) {
          j = 0;
          i++;
          if (i >= this.buffers.length) {
            return -1;
          }
        }
        var char = this.buffers[i][j];
        if (char == needle[match]) {
          if (match == 0) {
            mstart = {
              i,
              j,
              pos
            };
          }
          match++;
          if (match == needle.length) {
            return mstart.pos;
          }
        } else if (match != 0) {
          i = mstart.i;
          j = mstart.j;
          pos = mstart.pos;
          match = 0;
        }
        j++;
        pos++;
      }
    };
    Buffers.prototype.toBuffer = function() {
      return this.slice();
    };
    Buffers.prototype.toString = function(encoding, start, end) {
      return this.slice(start, end).toString(encoding);
    };
  }
});

// ../../../node_modules/.pnpm/binary@0.3.0/node_modules/binary/lib/vars.js
var require_vars = __commonJS({
  "../../../node_modules/.pnpm/binary@0.3.0/node_modules/binary/lib/vars.js"(exports2, module2) {
    "use strict";
    module2.exports = function(store) {
      function getset(name, value) {
        var node = vars.store;
        var keys = name.split(".");
        keys.slice(0, -1).forEach(function(k) {
          if (node[k] === void 0)
            node[k] = {};
          node = node[k];
        });
        var key = keys[keys.length - 1];
        if (arguments.length == 1) {
          return node[key];
        } else {
          return node[key] = value;
        }
      }
      var vars = {
        get: function(name) {
          return getset(name);
        },
        set: function(name, value) {
          return getset(name, value);
        },
        store: store || {}
      };
      return vars;
    };
  }
});

// ../../../node_modules/.pnpm/binary@0.3.0/node_modules/binary/index.js
var require_binary = __commonJS({
  "../../../node_modules/.pnpm/binary@0.3.0/node_modules/binary/index.js"(exports2, module2) {
    "use strict";
    var Chainsaw = require_chainsaw();
    var EventEmitter = require("events").EventEmitter;
    var Buffers = require_buffers();
    var Vars = require_vars();
    var Stream = require("stream").Stream;
    exports2 = module2.exports = function(bufOrEm, eventName) {
      if (Buffer.isBuffer(bufOrEm)) {
        return exports2.parse(bufOrEm);
      }
      var s = exports2.stream();
      if (bufOrEm && bufOrEm.pipe) {
        bufOrEm.pipe(s);
      } else if (bufOrEm) {
        bufOrEm.on(eventName || "data", function(buf) {
          s.write(buf);
        });
        bufOrEm.on("end", function() {
          s.end();
        });
      }
      return s;
    };
    exports2.stream = function(input) {
      if (input)
        return exports2.apply(null, arguments);
      var pending = null;
      function getBytes(bytes, cb, skip) {
        pending = {
          bytes,
          skip,
          cb: function(buf) {
            pending = null;
            cb(buf);
          }
        };
        dispatch();
      }
      var offset = null;
      function dispatch() {
        if (!pending) {
          if (caughtEnd)
            done = true;
          return;
        }
        if (typeof pending === "function") {
          pending();
        } else {
          var bytes = offset + pending.bytes;
          if (buffers.length >= bytes) {
            var buf;
            if (offset == null) {
              buf = buffers.splice(0, bytes);
              if (!pending.skip) {
                buf = buf.slice();
              }
            } else {
              if (!pending.skip) {
                buf = buffers.slice(offset, bytes);
              }
              offset = bytes;
            }
            if (pending.skip) {
              pending.cb();
            } else {
              pending.cb(buf);
            }
          }
        }
      }
      function builder(saw) {
        function next() {
          if (!done)
            saw.next();
        }
        var self2 = words(function(bytes, cb) {
          return function(name) {
            getBytes(bytes, function(buf) {
              vars.set(name, cb(buf));
              next();
            });
          };
        });
        self2.tap = function(cb) {
          saw.nest(cb, vars.store);
        };
        self2.into = function(key, cb) {
          if (!vars.get(key))
            vars.set(key, {});
          var parent = vars;
          vars = Vars(parent.get(key));
          saw.nest(function() {
            cb.apply(this, arguments);
            this.tap(function() {
              vars = parent;
            });
          }, vars.store);
        };
        self2.flush = function() {
          vars.store = {};
          next();
        };
        self2.loop = function(cb) {
          var end = false;
          saw.nest(false, function loop() {
            this.vars = vars.store;
            cb.call(this, function() {
              end = true;
              next();
            }, vars.store);
            this.tap(function() {
              if (end)
                saw.next();
              else
                loop.call(this);
            }.bind(this));
          }, vars.store);
        };
        self2.buffer = function(name, bytes) {
          if (typeof bytes === "string") {
            bytes = vars.get(bytes);
          }
          getBytes(bytes, function(buf) {
            vars.set(name, buf);
            next();
          });
        };
        self2.skip = function(bytes) {
          if (typeof bytes === "string") {
            bytes = vars.get(bytes);
          }
          getBytes(bytes, function() {
            next();
          });
        };
        self2.scan = function find(name, search) {
          if (typeof search === "string") {
            search = new Buffer(search);
          } else if (!Buffer.isBuffer(search)) {
            throw new Error("search must be a Buffer or a string");
          }
          var taken = 0;
          pending = function() {
            var pos = buffers.indexOf(search, offset + taken);
            var i = pos - offset - taken;
            if (pos !== -1) {
              pending = null;
              if (offset != null) {
                vars.set(
                  name,
                  buffers.slice(offset, offset + taken + i)
                );
                offset += taken + i + search.length;
              } else {
                vars.set(
                  name,
                  buffers.slice(0, taken + i)
                );
                buffers.splice(0, taken + i + search.length);
              }
              next();
              dispatch();
            } else {
              i = Math.max(buffers.length - search.length - offset - taken, 0);
            }
            taken += i;
          };
          dispatch();
        };
        self2.peek = function(cb) {
          offset = 0;
          saw.nest(function() {
            cb.call(this, vars.store);
            this.tap(function() {
              offset = null;
            });
          });
        };
        return self2;
      }
      ;
      var stream = Chainsaw.light(builder);
      stream.writable = true;
      var buffers = Buffers();
      stream.write = function(buf) {
        buffers.push(buf);
        dispatch();
      };
      var vars = Vars();
      var done = false, caughtEnd = false;
      stream.end = function() {
        caughtEnd = true;
      };
      stream.pipe = Stream.prototype.pipe;
      Object.getOwnPropertyNames(EventEmitter.prototype).forEach(function(name) {
        stream[name] = EventEmitter.prototype[name];
      });
      return stream;
    };
    exports2.parse = function parse2(buffer) {
      var self2 = words(function(bytes, cb) {
        return function(name) {
          if (offset + bytes <= buffer.length) {
            var buf = buffer.slice(offset, offset + bytes);
            offset += bytes;
            vars.set(name, cb(buf));
          } else {
            vars.set(name, null);
          }
          return self2;
        };
      });
      var offset = 0;
      var vars = Vars();
      self2.vars = vars.store;
      self2.tap = function(cb) {
        cb.call(self2, vars.store);
        return self2;
      };
      self2.into = function(key, cb) {
        if (!vars.get(key)) {
          vars.set(key, {});
        }
        var parent = vars;
        vars = Vars(parent.get(key));
        cb.call(self2, vars.store);
        vars = parent;
        return self2;
      };
      self2.loop = function(cb) {
        var end = false;
        var ender = function() {
          end = true;
        };
        while (end === false) {
          cb.call(self2, ender, vars.store);
        }
        return self2;
      };
      self2.buffer = function(name, size) {
        if (typeof size === "string") {
          size = vars.get(size);
        }
        var buf = buffer.slice(offset, Math.min(buffer.length, offset + size));
        offset += size;
        vars.set(name, buf);
        return self2;
      };
      self2.skip = function(bytes) {
        if (typeof bytes === "string") {
          bytes = vars.get(bytes);
        }
        offset += bytes;
        return self2;
      };
      self2.scan = function(name, search) {
        if (typeof search === "string") {
          search = new Buffer(search);
        } else if (!Buffer.isBuffer(search)) {
          throw new Error("search must be a Buffer or a string");
        }
        vars.set(name, null);
        for (var i = 0; i + offset <= buffer.length - search.length + 1; i++) {
          for (var j = 0; j < search.length && buffer[offset + i + j] === search[j]; j++)
            ;
          if (j === search.length)
            break;
        }
        vars.set(name, buffer.slice(offset, offset + i));
        offset += i + search.length;
        return self2;
      };
      self2.peek = function(cb) {
        var was = offset;
        cb.call(self2, vars.store);
        offset = was;
        return self2;
      };
      self2.flush = function() {
        vars.store = {};
        return self2;
      };
      self2.eof = function() {
        return offset >= buffer.length;
      };
      return self2;
    };
    function decodeLEu(bytes) {
      var acc = 0;
      for (var i = 0; i < bytes.length; i++) {
        acc += Math.pow(256, i) * bytes[i];
      }
      return acc;
    }
    function decodeBEu(bytes) {
      var acc = 0;
      for (var i = 0; i < bytes.length; i++) {
        acc += Math.pow(256, bytes.length - i - 1) * bytes[i];
      }
      return acc;
    }
    function decodeBEs(bytes) {
      var val = decodeBEu(bytes);
      if ((bytes[0] & 128) == 128) {
        val -= Math.pow(256, bytes.length);
      }
      return val;
    }
    function decodeLEs(bytes) {
      var val = decodeLEu(bytes);
      if ((bytes[bytes.length - 1] & 128) == 128) {
        val -= Math.pow(256, bytes.length);
      }
      return val;
    }
    function words(decode) {
      var self2 = {};
      [1, 2, 4, 8].forEach(function(bytes) {
        var bits = bytes * 8;
        self2["word" + bits + "le"] = self2["word" + bits + "lu"] = decode(bytes, decodeLEu);
        self2["word" + bits + "ls"] = decode(bytes, decodeLEs);
        self2["word" + bits + "be"] = self2["word" + bits + "bu"] = decode(bytes, decodeBEu);
        self2["word" + bits + "bs"] = decode(bytes, decodeBEs);
      });
      self2.word8 = self2.word8u = self2.word8be;
      self2.word8s = self2.word8bs;
      return self2;
    }
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/es5.js
var require_es5 = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/es5.js"(exports2, module2) {
    "use strict";
    var isES5 = function() {
      "use strict";
      return this === void 0;
    }();
    if (isES5) {
      module2.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5,
        propertyIsWritable: function(obj2, prop) {
          var descriptor = Object.getOwnPropertyDescriptor(obj2, prop);
          return !!(!descriptor || descriptor.writable || descriptor.set);
        }
      };
    } else {
      has = {}.hasOwnProperty;
      str = {}.toString;
      proto = {}.constructor.prototype;
      ObjectKeys = function(o) {
        var ret2 = [];
        for (var key in o) {
          if (has.call(o, key)) {
            ret2.push(key);
          }
        }
        return ret2;
      };
      ObjectGetDescriptor = function(o, key) {
        return { value: o[key] };
      };
      ObjectDefineProperty = function(o, key, desc) {
        o[key] = desc.value;
        return o;
      };
      ObjectFreeze = function(obj2) {
        return obj2;
      };
      ObjectGetPrototypeOf = function(obj2) {
        try {
          return Object(obj2).constructor.prototype;
        } catch (e) {
          return proto;
        }
      };
      ArrayIsArray = function(obj2) {
        try {
          return str.call(obj2) === "[object Array]";
        } catch (e) {
          return false;
        }
      };
      module2.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5,
        propertyIsWritable: function() {
          return true;
        }
      };
    }
    var has;
    var str;
    var proto;
    var ObjectKeys;
    var ObjectGetDescriptor;
    var ObjectDefineProperty;
    var ObjectFreeze;
    var ObjectGetPrototypeOf;
    var ArrayIsArray;
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/util.js
var require_util = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/util.js"(exports, module) {
    "use strict";
    var es5 = require_es5();
    var canEvaluate = typeof navigator == "undefined";
    var errorObj = { e: {} };
    var tryCatchTarget;
    var globalObject = typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : exports !== void 0 ? exports : null;
    function tryCatcher() {
      try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
      } catch (e) {
        errorObj.e = e;
        return errorObj;
      }
    }
    function tryCatch(fn) {
      tryCatchTarget = fn;
      return tryCatcher;
    }
    var inherits = function(Child, Parent) {
      var hasProp = {}.hasOwnProperty;
      function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
          if (hasProp.call(Parent.prototype, propertyName) && propertyName.charAt(propertyName.length - 1) !== "$") {
            this[propertyName + "$"] = Parent.prototype[propertyName];
          }
        }
      }
      T.prototype = Parent.prototype;
      Child.prototype = new T();
      return Child.prototype;
    };
    function isPrimitive(val) {
      return val == null || val === true || val === false || typeof val === "string" || typeof val === "number";
    }
    function isObject(value) {
      return typeof value === "function" || typeof value === "object" && value !== null;
    }
    function maybeWrapAsError(maybeError) {
      if (!isPrimitive(maybeError))
        return maybeError;
      return new Error(safeToString(maybeError));
    }
    function withAppended(target, appendee) {
      var len = target.length;
      var ret2 = new Array(len + 1);
      var i;
      for (i = 0; i < len; ++i) {
        ret2[i] = target[i];
      }
      ret2[i] = appendee;
      return ret2;
    }
    function getDataPropertyOrDefault(obj2, key, defaultValue) {
      if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj2, key);
        if (desc != null) {
          return desc.get == null && desc.set == null ? desc.value : defaultValue;
        }
      } else {
        return {}.hasOwnProperty.call(obj2, key) ? obj2[key] : void 0;
      }
    }
    function notEnumerableProp(obj2, name, value) {
      if (isPrimitive(obj2))
        return obj2;
      var descriptor = {
        value,
        configurable: true,
        enumerable: false,
        writable: true
      };
      es5.defineProperty(obj2, name, descriptor);
      return obj2;
    }
    function thrower(r) {
      throw r;
    }
    var inheritedDataKeys = function() {
      var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
      ];
      var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
          if (excludedPrototypes[i] === val) {
            return true;
          }
        }
        return false;
      };
      if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj2) {
          var ret2 = [];
          var visitedKeys = /* @__PURE__ */ Object.create(null);
          while (obj2 != null && !isExcludedProto(obj2)) {
            var keys;
            try {
              keys = getKeys(obj2);
            } catch (e) {
              return ret2;
            }
            for (var i = 0; i < keys.length; ++i) {
              var key = keys[i];
              if (visitedKeys[key])
                continue;
              visitedKeys[key] = true;
              var desc = Object.getOwnPropertyDescriptor(obj2, key);
              if (desc != null && desc.get == null && desc.set == null) {
                ret2.push(key);
              }
            }
            obj2 = es5.getPrototypeOf(obj2);
          }
          return ret2;
        };
      } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj2) {
          if (isExcludedProto(obj2))
            return [];
          var ret2 = [];
          enumeration:
            for (var key in obj2) {
              if (hasProp.call(obj2, key)) {
                ret2.push(key);
              } else {
                for (var i = 0; i < excludedPrototypes.length; ++i) {
                  if (hasProp.call(excludedPrototypes[i], key)) {
                    continue enumeration;
                  }
                }
                ret2.push(key);
              }
            }
          return ret2;
        };
      }
    }();
    var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
    function isClass(fn) {
      try {
        if (typeof fn === "function") {
          var keys = es5.names(fn.prototype);
          var hasMethods = es5.isES5 && keys.length > 1;
          var hasMethodsOtherThanConstructor = keys.length > 0 && !(keys.length === 1 && keys[0] === "constructor");
          var hasThisAssignmentAndStaticMethods = thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;
          if (hasMethods || hasMethodsOtherThanConstructor || hasThisAssignmentAndStaticMethods) {
            return true;
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    }
    function toFastProperties(obj) {
      function FakeConstructor() {
      }
      FakeConstructor.prototype = obj;
      var l = 8;
      while (l--)
        new FakeConstructor();
      return obj;
      eval(obj);
    }
    var rident = /^[a-z$_][a-z$_0-9]*$/i;
    function isIdentifier(str) {
      return rident.test(str);
    }
    function filledRange(count, prefix, suffix) {
      var ret2 = new Array(count);
      for (var i = 0; i < count; ++i) {
        ret2[i] = prefix + i + suffix;
      }
      return ret2;
    }
    function safeToString(obj2) {
      try {
        return obj2 + "";
      } catch (e) {
        return "[no string representation]";
      }
    }
    function isError(obj2) {
      return obj2 !== null && typeof obj2 === "object" && typeof obj2.message === "string" && typeof obj2.name === "string";
    }
    function markAsOriginatingFromRejection(e) {
      try {
        notEnumerableProp(e, "isOperational", true);
      } catch (ignore) {
      }
    }
    function originatesFromRejection(e) {
      if (e == null)
        return false;
      return e instanceof Error["__BluebirdErrorTypes__"].OperationalError || e["isOperational"] === true;
    }
    function canAttachTrace(obj2) {
      return isError(obj2) && es5.propertyIsWritable(obj2, "stack");
    }
    var ensureErrorObject = function() {
      if (!("stack" in new Error())) {
        return function(value) {
          if (canAttachTrace(value))
            return value;
          try {
            throw new Error(safeToString(value));
          } catch (err) {
            return err;
          }
        };
      } else {
        return function(value) {
          if (canAttachTrace(value))
            return value;
          return new Error(safeToString(value));
        };
      }
    }();
    function classString(obj2) {
      return {}.toString.call(obj2);
    }
    function copyDescriptors(from, to, filter) {
      var keys = es5.names(from);
      for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
          try {
            es5.defineProperty(to, key, es5.getDescriptor(from, key));
          } catch (ignore) {
          }
        }
      }
    }
    var asArray = function(v) {
      if (es5.isArray(v)) {
        return v;
      }
      return null;
    };
    if (typeof Symbol !== "undefined" && Symbol.iterator) {
      ArrayFrom = typeof Array.from === "function" ? function(v) {
        return Array.from(v);
      } : function(v) {
        var ret2 = [];
        var it = v[Symbol.iterator]();
        var itResult;
        while (!(itResult = it.next()).done) {
          ret2.push(itResult.value);
        }
        return ret2;
      };
      asArray = function(v) {
        if (es5.isArray(v)) {
          return v;
        } else if (v != null && typeof v[Symbol.iterator] === "function") {
          return ArrayFrom(v);
        }
        return null;
      };
    }
    var ArrayFrom;
    var isNode = typeof process !== "undefined" && classString(process).toLowerCase() === "[object process]";
    var hasEnvVariables = typeof process !== "undefined" && typeof process.env !== "undefined";
    function env(key) {
      return hasEnvVariables ? process.env[key] : void 0;
    }
    function getNativePromise() {
      if (typeof Promise === "function") {
        try {
          var promise = new Promise(function() {
          });
          if ({}.toString.call(promise) === "[object Promise]") {
            return Promise;
          }
        } catch (e) {
        }
      }
    }
    function domainBind(self2, cb) {
      return self2.bind(cb);
    }
    var ret = {
      isClass,
      isIdentifier,
      inheritedDataKeys,
      getDataPropertyOrDefault,
      thrower,
      isArray: es5.isArray,
      asArray,
      notEnumerableProp,
      isPrimitive,
      isObject,
      isError,
      canEvaluate,
      errorObj,
      tryCatch,
      inherits,
      withAppended,
      maybeWrapAsError,
      toFastProperties,
      filledRange,
      toString: safeToString,
      canAttachTrace,
      ensureErrorObject,
      originatesFromRejection,
      markAsOriginatingFromRejection,
      classString,
      copyDescriptors,
      hasDevTools: typeof chrome !== "undefined" && chrome && typeof chrome.loadTimes === "function",
      isNode,
      hasEnvVariables,
      env,
      global: globalObject,
      getNativePromise,
      domainBind
    };
    ret.isRecentNode = ret.isNode && function() {
      var version2 = process.versions.node.split(".").map(Number);
      return version2[0] === 0 && version2[1] > 10 || version2[0] > 0;
    }();
    if (ret.isNode)
      ret.toFastProperties(process);
    try {
      throw new Error();
    } catch (e) {
      ret.lastLineError = e;
    }
    module.exports = ret;
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/schedule.js
var require_schedule = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/schedule.js"(exports2, module2) {
    "use strict";
    var util = require_util();
    var schedule;
    var noAsyncScheduler = function() {
      throw new Error("No async scheduler available\n\n    See http://goo.gl/MqrFmX\n");
    };
    var NativePromise = util.getNativePromise();
    if (util.isNode && typeof MutationObserver === "undefined") {
      GlobalSetImmediate = global.setImmediate;
      ProcessNextTick = process.nextTick;
      schedule = util.isRecentNode ? function(fn) {
        GlobalSetImmediate.call(global, fn);
      } : function(fn) {
        ProcessNextTick.call(process, fn);
      };
    } else if (typeof NativePromise === "function" && typeof NativePromise.resolve === "function") {
      nativePromise = NativePromise.resolve();
      schedule = function(fn) {
        nativePromise.then(fn);
      };
    } else if (typeof MutationObserver !== "undefined" && !(typeof window !== "undefined" && window.navigator && (window.navigator.standalone || window.cordova))) {
      schedule = function() {
        var div = document.createElement("div");
        var opts = { attributes: true };
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
          div.classList.toggle("foo");
          toggleScheduled = false;
        });
        o2.observe(div2, opts);
        var scheduleToggle = function() {
          if (toggleScheduled)
            return;
          toggleScheduled = true;
          div2.classList.toggle("foo");
        };
        return function schedule2(fn) {
          var o = new MutationObserver(function() {
            o.disconnect();
            fn();
          });
          o.observe(div, opts);
          scheduleToggle();
        };
      }();
    } else if (typeof setImmediate !== "undefined") {
      schedule = function(fn) {
        setImmediate(fn);
      };
    } else if (typeof setTimeout !== "undefined") {
      schedule = function(fn) {
        setTimeout(fn, 0);
      };
    } else {
      schedule = noAsyncScheduler;
    }
    var GlobalSetImmediate;
    var ProcessNextTick;
    var nativePromise;
    module2.exports = schedule;
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/queue.js
var require_queue = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/queue.js"(exports2, module2) {
    "use strict";
    function arrayMove(src, srcIndex, dst, dstIndex, len) {
      for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
      }
    }
    function Queue(capacity) {
      this._capacity = capacity;
      this._length = 0;
      this._front = 0;
    }
    Queue.prototype._willBeOverCapacity = function(size) {
      return this._capacity < size;
    };
    Queue.prototype._pushOne = function(arg) {
      var length = this.length();
      this._checkCapacity(length + 1);
      var i = this._front + length & this._capacity - 1;
      this[i] = arg;
      this._length = length + 1;
    };
    Queue.prototype.push = function(fn, receiver, arg) {
      var length = this.length() + 3;
      if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
      }
      var j = this._front + length - 3;
      this._checkCapacity(length);
      var wrapMask = this._capacity - 1;
      this[j + 0 & wrapMask] = fn;
      this[j + 1 & wrapMask] = receiver;
      this[j + 2 & wrapMask] = arg;
      this._length = length;
    };
    Queue.prototype.shift = function() {
      var front = this._front, ret2 = this[front];
      this[front] = void 0;
      this._front = front + 1 & this._capacity - 1;
      this._length--;
      return ret2;
    };
    Queue.prototype.length = function() {
      return this._length;
    };
    Queue.prototype._checkCapacity = function(size) {
      if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
      }
    };
    Queue.prototype._resizeTo = function(capacity) {
      var oldCapacity = this._capacity;
      this._capacity = capacity;
      var front = this._front;
      var length = this._length;
      var moveItemsCount = front + length & oldCapacity - 1;
      arrayMove(this, 0, this, oldCapacity, moveItemsCount);
    };
    module2.exports = Queue;
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/async.js
var require_async = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/async.js"(exports2, module2) {
    "use strict";
    var firstLineError;
    try {
      throw new Error();
    } catch (e) {
      firstLineError = e;
    }
    var schedule = require_schedule();
    var Queue = require_queue();
    var util = require_util();
    function Async() {
      this._customScheduler = false;
      this._isTickUsed = false;
      this._lateQueue = new Queue(16);
      this._normalQueue = new Queue(16);
      this._haveDrainedQueues = false;
      this._trampolineEnabled = true;
      var self2 = this;
      this.drainQueues = function() {
        self2._drainQueues();
      };
      this._schedule = schedule;
    }
    Async.prototype.setScheduler = function(fn) {
      var prev = this._schedule;
      this._schedule = fn;
      this._customScheduler = true;
      return prev;
    };
    Async.prototype.hasCustomScheduler = function() {
      return this._customScheduler;
    };
    Async.prototype.enableTrampoline = function() {
      this._trampolineEnabled = true;
    };
    Async.prototype.disableTrampolineIfNecessary = function() {
      if (util.hasDevTools) {
        this._trampolineEnabled = false;
      }
    };
    Async.prototype.haveItemsQueued = function() {
      return this._isTickUsed || this._haveDrainedQueues;
    };
    Async.prototype.fatalError = function(e, isNode2) {
      if (isNode2) {
        process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) + "\n");
        process.exit(2);
      } else {
        this.throwLater(e);
      }
    };
    Async.prototype.throwLater = function(fn, arg) {
      if (arguments.length === 1) {
        arg = fn;
        fn = function() {
          throw arg;
        };
      }
      if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
          fn(arg);
        }, 0);
      } else
        try {
          this._schedule(function() {
            fn(arg);
          });
        } catch (e) {
          throw new Error("No async scheduler available\n\n    See http://goo.gl/MqrFmX\n");
        }
    };
    function AsyncInvokeLater(fn, receiver, arg) {
      this._lateQueue.push(fn, receiver, arg);
      this._queueTick();
    }
    function AsyncInvoke(fn, receiver, arg) {
      this._normalQueue.push(fn, receiver, arg);
      this._queueTick();
    }
    function AsyncSettlePromises(promise) {
      this._normalQueue._pushOne(promise);
      this._queueTick();
    }
    if (!util.hasDevTools) {
      Async.prototype.invokeLater = AsyncInvokeLater;
      Async.prototype.invoke = AsyncInvoke;
      Async.prototype.settlePromises = AsyncSettlePromises;
    } else {
      Async.prototype.invokeLater = function(fn, receiver, arg) {
        if (this._trampolineEnabled) {
          AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
          this._schedule(function() {
            setTimeout(function() {
              fn.call(receiver, arg);
            }, 100);
          });
        }
      };
      Async.prototype.invoke = function(fn, receiver, arg) {
        if (this._trampolineEnabled) {
          AsyncInvoke.call(this, fn, receiver, arg);
        } else {
          this._schedule(function() {
            fn.call(receiver, arg);
          });
        }
      };
      Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
          AsyncSettlePromises.call(this, promise);
        } else {
          this._schedule(function() {
            promise._settlePromises();
          });
        }
      };
    }
    Async.prototype._drainQueue = function(queue) {
      while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
          fn._settlePromises();
          continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
      }
    };
    Async.prototype._drainQueues = function() {
      this._drainQueue(this._normalQueue);
      this._reset();
      this._haveDrainedQueues = true;
      this._drainQueue(this._lateQueue);
    };
    Async.prototype._queueTick = function() {
      if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
      }
    };
    Async.prototype._reset = function() {
      this._isTickUsed = false;
    };
    module2.exports = Async;
    module2.exports.firstLineError = firstLineError;
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/errors.js
var require_errors = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/errors.js"(exports2, module2) {
    "use strict";
    var es52 = require_es5();
    var Objectfreeze = es52.freeze;
    var util = require_util();
    var inherits2 = util.inherits;
    var notEnumerableProp2 = util.notEnumerableProp;
    function subError(nameProperty, defaultMessage) {
      function SubError(message) {
        if (!(this instanceof SubError))
          return new SubError(message);
        notEnumerableProp2(
          this,
          "message",
          typeof message === "string" ? message : defaultMessage
        );
        notEnumerableProp2(this, "name", nameProperty);
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, this.constructor);
        } else {
          Error.call(this);
        }
      }
      inherits2(SubError, Error);
      return SubError;
    }
    var _TypeError;
    var _RangeError;
    var Warning = subError("Warning", "warning");
    var CancellationError = subError("CancellationError", "cancellation error");
    var TimeoutError = subError("TimeoutError", "timeout error");
    var AggregateError = subError("AggregateError", "aggregate error");
    try {
      _TypeError = TypeError;
      _RangeError = RangeError;
    } catch (e) {
      _TypeError = subError("TypeError", "type error");
      _RangeError = subError("RangeError", "range error");
    }
    var methods = "join pop push shift unshift slice filter forEach some every map indexOf lastIndexOf reduce reduceRight sort reverse".split(" ");
    for (i = 0; i < methods.length; ++i) {
      if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
      }
    }
    var i;
    es52.defineProperty(AggregateError.prototype, "length", {
      value: 0,
      configurable: false,
      writable: true,
      enumerable: true
    });
    AggregateError.prototype["isOperational"] = true;
    var level = 0;
    AggregateError.prototype.toString = function() {
      var indent = Array(level * 4 + 1).join(" ");
      var ret2 = "\n" + indent + "AggregateError of:\n";
      level++;
      indent = Array(level * 4 + 1).join(" ");
      for (var i2 = 0; i2 < this.length; ++i2) {
        var str = this[i2] === this ? "[Circular AggregateError]" : this[i2] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
          lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret2 += str + "\n";
      }
      level--;
      return ret2;
    };
    function OperationalError(message) {
      if (!(this instanceof OperationalError))
        return new OperationalError(message);
      notEnumerableProp2(this, "name", "OperationalError");
      notEnumerableProp2(this, "message", message);
      this.cause = message;
      this["isOperational"] = true;
      if (message instanceof Error) {
        notEnumerableProp2(this, "message", message.message);
        notEnumerableProp2(this, "stack", message.stack);
      } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
    inherits2(OperationalError, Error);
    var errorTypes = Error["__BluebirdErrorTypes__"];
    if (!errorTypes) {
      errorTypes = Objectfreeze({
        CancellationError,
        TimeoutError,
        OperationalError,
        RejectionError: OperationalError,
        AggregateError
      });
      es52.defineProperty(Error, "__BluebirdErrorTypes__", {
        value: errorTypes,
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
    module2.exports = {
      Error,
      TypeError: _TypeError,
      RangeError: _RangeError,
      CancellationError: errorTypes.CancellationError,
      OperationalError: errorTypes.OperationalError,
      TimeoutError: errorTypes.TimeoutError,
      AggregateError: errorTypes.AggregateError,
      Warning
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/thenables.js
var require_thenables = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/thenables.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, INTERNAL) {
      var util = require_util();
      var errorObj2 = util.errorObj;
      var isObject2 = util.isObject;
      function tryConvertToPromise(obj2, context) {
        if (isObject2(obj2)) {
          if (obj2 instanceof Promise2)
            return obj2;
          var then = getThen(obj2);
          if (then === errorObj2) {
            if (context)
              context._pushContext();
            var ret2 = Promise2.reject(then.e);
            if (context)
              context._popContext();
            return ret2;
          } else if (typeof then === "function") {
            if (isAnyBluebirdPromise(obj2)) {
              var ret2 = new Promise2(INTERNAL);
              obj2._then(
                ret2._fulfill,
                ret2._reject,
                void 0,
                ret2,
                null
              );
              return ret2;
            }
            return doThenable(obj2, then, context);
          }
        }
        return obj2;
      }
      function doGetThen(obj2) {
        return obj2.then;
      }
      function getThen(obj2) {
        try {
          return doGetThen(obj2);
        } catch (e) {
          errorObj2.e = e;
          return errorObj2;
        }
      }
      var hasProp = {}.hasOwnProperty;
      function isAnyBluebirdPromise(obj2) {
        try {
          return hasProp.call(obj2, "_promise0");
        } catch (e) {
          return false;
        }
      }
      function doThenable(x, then, context) {
        var promise = new Promise2(INTERNAL);
        var ret2 = promise;
        if (context)
          context._pushContext();
        promise._captureStackTrace();
        if (context)
          context._popContext();
        var synchronous = true;
        var result = util.tryCatch(then).call(x, resolve, reject);
        synchronous = false;
        if (promise && result === errorObj2) {
          promise._rejectCallback(result.e, true, true);
          promise = null;
        }
        function resolve(value) {
          if (!promise)
            return;
          promise._resolveCallback(value);
          promise = null;
        }
        function reject(reason) {
          if (!promise)
            return;
          promise._rejectCallback(reason, synchronous, true);
          promise = null;
        }
        return ret2;
      }
      return tryConvertToPromise;
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/promise_array.js
var require_promise_array = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/promise_array.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, INTERNAL, tryConvertToPromise, apiRejection, Proxyable) {
      var util = require_util();
      var isArray = util.isArray;
      function toResolutionValue(val) {
        switch (val) {
          case -2:
            return [];
          case -3:
            return {};
        }
      }
      function PromiseArray(values) {
        var promise = this._promise = new Promise2(INTERNAL);
        if (values instanceof Promise2) {
          promise._propagateFrom(values, 3);
        }
        promise._setOnCancel(this);
        this._values = values;
        this._length = 0;
        this._totalResolved = 0;
        this._init(void 0, -2);
      }
      util.inherits(PromiseArray, Proxyable);
      PromiseArray.prototype.length = function() {
        return this._length;
      };
      PromiseArray.prototype.promise = function() {
        return this._promise;
      };
      PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
        var values = tryConvertToPromise(this._values, this._promise);
        if (values instanceof Promise2) {
          values = values._target();
          var bitField = values._bitField;
          ;
          this._values = values;
          if ((bitField & 50397184) === 0) {
            this._promise._setAsyncGuaranteed();
            return values._then(
              init,
              this._reject,
              void 0,
              this,
              resolveValueIfEmpty
            );
          } else if ((bitField & 33554432) !== 0) {
            values = values._value();
          } else if ((bitField & 16777216) !== 0) {
            return this._reject(values._reason());
          } else {
            return this._cancel();
          }
        }
        values = util.asArray(values);
        if (values === null) {
          var err = apiRejection(
            "expecting an array or an iterable object but got " + util.classString(values)
          ).reason();
          this._promise._rejectCallback(err, false);
          return;
        }
        if (values.length === 0) {
          if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
          } else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
          }
          return;
        }
        this._iterate(values);
      };
      PromiseArray.prototype._iterate = function(values) {
        var len = this.getActualLength(values.length);
        this._length = len;
        this._values = this.shouldCopyValues() ? new Array(len) : this._values;
        var result = this._promise;
        var isResolved = false;
        var bitField = null;
        for (var i = 0; i < len; ++i) {
          var maybePromise = tryConvertToPromise(values[i], result);
          if (maybePromise instanceof Promise2) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
          } else {
            bitField = null;
          }
          if (isResolved) {
            if (bitField !== null) {
              maybePromise.suppressUnhandledRejections();
            }
          } else if (bitField !== null) {
            if ((bitField & 50397184) === 0) {
              maybePromise._proxy(this, i);
              this._values[i] = maybePromise;
            } else if ((bitField & 33554432) !== 0) {
              isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if ((bitField & 16777216) !== 0) {
              isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
              isResolved = this._promiseCancelled(i);
            }
          } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
          }
        }
        if (!isResolved)
          result._setAsyncGuaranteed();
      };
      PromiseArray.prototype._isResolved = function() {
        return this._values === null;
      };
      PromiseArray.prototype._resolve = function(value) {
        this._values = null;
        this._promise._fulfill(value);
      };
      PromiseArray.prototype._cancel = function() {
        if (this._isResolved() || !this._promise._isCancellable())
          return;
        this._values = null;
        this._promise._cancel();
      };
      PromiseArray.prototype._reject = function(reason) {
        this._values = null;
        this._promise._rejectCallback(reason, false);
      };
      PromiseArray.prototype._promiseFulfilled = function(value, index) {
        this._values[index] = value;
        var totalResolved = ++this._totalResolved;
        if (totalResolved >= this._length) {
          this._resolve(this._values);
          return true;
        }
        return false;
      };
      PromiseArray.prototype._promiseCancelled = function() {
        this._cancel();
        return true;
      };
      PromiseArray.prototype._promiseRejected = function(reason) {
        this._totalResolved++;
        this._reject(reason);
        return true;
      };
      PromiseArray.prototype._resultCancelled = function() {
        if (this._isResolved())
          return;
        var values = this._values;
        this._cancel();
        if (values instanceof Promise2) {
          values.cancel();
        } else {
          for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise2) {
              values[i].cancel();
            }
          }
        }
      };
      PromiseArray.prototype.shouldCopyValues = function() {
        return true;
      };
      PromiseArray.prototype.getActualLength = function(len) {
        return len;
      };
      return PromiseArray;
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/context.js
var require_context = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/context.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2) {
      var longStackTraces = false;
      var contextStack = [];
      Promise2.prototype._promiseCreated = function() {
      };
      Promise2.prototype._pushContext = function() {
      };
      Promise2.prototype._popContext = function() {
        return null;
      };
      Promise2._peekContext = Promise2.prototype._peekContext = function() {
      };
      function Context() {
        this._trace = new Context.CapturedTrace(peekContext());
      }
      Context.prototype._pushContext = function() {
        if (this._trace !== void 0) {
          this._trace._promiseCreated = null;
          contextStack.push(this._trace);
        }
      };
      Context.prototype._popContext = function() {
        if (this._trace !== void 0) {
          var trace = contextStack.pop();
          var ret2 = trace._promiseCreated;
          trace._promiseCreated = null;
          return ret2;
        }
        return null;
      };
      function createContext() {
        if (longStackTraces)
          return new Context();
      }
      function peekContext() {
        var lastIndex = contextStack.length - 1;
        if (lastIndex >= 0) {
          return contextStack[lastIndex];
        }
        return void 0;
      }
      Context.CapturedTrace = null;
      Context.create = createContext;
      Context.deactivateLongStackTraces = function() {
      };
      Context.activateLongStackTraces = function() {
        var Promise_pushContext = Promise2.prototype._pushContext;
        var Promise_popContext = Promise2.prototype._popContext;
        var Promise_PeekContext = Promise2._peekContext;
        var Promise_peekContext = Promise2.prototype._peekContext;
        var Promise_promiseCreated = Promise2.prototype._promiseCreated;
        Context.deactivateLongStackTraces = function() {
          Promise2.prototype._pushContext = Promise_pushContext;
          Promise2.prototype._popContext = Promise_popContext;
          Promise2._peekContext = Promise_PeekContext;
          Promise2.prototype._peekContext = Promise_peekContext;
          Promise2.prototype._promiseCreated = Promise_promiseCreated;
          longStackTraces = false;
        };
        longStackTraces = true;
        Promise2.prototype._pushContext = Context.prototype._pushContext;
        Promise2.prototype._popContext = Context.prototype._popContext;
        Promise2._peekContext = Promise2.prototype._peekContext = peekContext;
        Promise2.prototype._promiseCreated = function() {
          var ctx = this._peekContext();
          if (ctx && ctx._promiseCreated == null)
            ctx._promiseCreated = this;
        };
      };
      return Context;
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/debuggability.js
var require_debuggability = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/debuggability.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, Context) {
      var getDomain = Promise2._getDomain;
      var async = Promise2._async;
      var Warning = require_errors().Warning;
      var util = require_util();
      var canAttachTrace2 = util.canAttachTrace;
      var unhandledRejectionHandled;
      var possiblyUnhandledRejection;
      var bluebirdFramePattern = /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
      var nodeFramePattern = /\((?:timers\.js):\d+:\d+\)/;
      var parseLinePattern = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/;
      var stackFramePattern = null;
      var formatStack = null;
      var indentStackFrames = false;
      var printWarning;
      var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 && (util.env("BLUEBIRD_DEBUG") || util.env("NODE_ENV") === "development"));
      var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 && (debugging || util.env("BLUEBIRD_WARNINGS")));
      var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 && (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));
      var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 && (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));
      Promise2.prototype.suppressUnhandledRejections = function() {
        var target = this._target();
        target._bitField = target._bitField & ~1048576 | 524288;
      };
      Promise2.prototype._ensurePossibleRejectionHandled = function() {
        if ((this._bitField & 524288) !== 0)
          return;
        this._setRejectionIsUnhandled();
        async.invokeLater(this._notifyUnhandledRejection, this, void 0);
      };
      Promise2.prototype._notifyUnhandledRejectionIsHandled = function() {
        fireRejectionEvent(
          "rejectionHandled",
          unhandledRejectionHandled,
          void 0,
          this
        );
      };
      Promise2.prototype._setReturnedNonUndefined = function() {
        this._bitField = this._bitField | 268435456;
      };
      Promise2.prototype._returnedNonUndefined = function() {
        return (this._bitField & 268435456) !== 0;
      };
      Promise2.prototype._notifyUnhandledRejection = function() {
        if (this._isRejectionUnhandled()) {
          var reason = this._settledValue();
          this._setUnhandledRejectionIsNotified();
          fireRejectionEvent(
            "unhandledRejection",
            possiblyUnhandledRejection,
            reason,
            this
          );
        }
      };
      Promise2.prototype._setUnhandledRejectionIsNotified = function() {
        this._bitField = this._bitField | 262144;
      };
      Promise2.prototype._unsetUnhandledRejectionIsNotified = function() {
        this._bitField = this._bitField & ~262144;
      };
      Promise2.prototype._isUnhandledRejectionNotified = function() {
        return (this._bitField & 262144) > 0;
      };
      Promise2.prototype._setRejectionIsUnhandled = function() {
        this._bitField = this._bitField | 1048576;
      };
      Promise2.prototype._unsetRejectionIsUnhandled = function() {
        this._bitField = this._bitField & ~1048576;
        if (this._isUnhandledRejectionNotified()) {
          this._unsetUnhandledRejectionIsNotified();
          this._notifyUnhandledRejectionIsHandled();
        }
      };
      Promise2.prototype._isRejectionUnhandled = function() {
        return (this._bitField & 1048576) > 0;
      };
      Promise2.prototype._warn = function(message, shouldUseOwnTrace, promise) {
        return warn(message, shouldUseOwnTrace, promise || this);
      };
      Promise2.onPossiblyUnhandledRejection = function(fn) {
        var domain = getDomain();
        possiblyUnhandledRejection = typeof fn === "function" ? domain === null ? fn : util.domainBind(domain, fn) : void 0;
      };
      Promise2.onUnhandledRejectionHandled = function(fn) {
        var domain = getDomain();
        unhandledRejectionHandled = typeof fn === "function" ? domain === null ? fn : util.domainBind(domain, fn) : void 0;
      };
      var disableLongStackTraces = function() {
      };
      Promise2.longStackTraces = function() {
        if (async.haveItemsQueued() && !config.longStackTraces) {
          throw new Error("cannot enable long stack traces after promises have been created\n\n    See http://goo.gl/MqrFmX\n");
        }
        if (!config.longStackTraces && longStackTracesIsSupported()) {
          var Promise_captureStackTrace = Promise2.prototype._captureStackTrace;
          var Promise_attachExtraTrace = Promise2.prototype._attachExtraTrace;
          config.longStackTraces = true;
          disableLongStackTraces = function() {
            if (async.haveItemsQueued() && !config.longStackTraces) {
              throw new Error("cannot enable long stack traces after promises have been created\n\n    See http://goo.gl/MqrFmX\n");
            }
            Promise2.prototype._captureStackTrace = Promise_captureStackTrace;
            Promise2.prototype._attachExtraTrace = Promise_attachExtraTrace;
            Context.deactivateLongStackTraces();
            async.enableTrampoline();
            config.longStackTraces = false;
          };
          Promise2.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
          Promise2.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
          Context.activateLongStackTraces();
          async.disableTrampolineIfNecessary();
        }
      };
      Promise2.hasLongStackTraces = function() {
        return config.longStackTraces && longStackTracesIsSupported();
      };
      var fireDomEvent = function() {
        try {
          if (typeof CustomEvent === "function") {
            var event = new CustomEvent("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event2) {
              var domEvent = new CustomEvent(name.toLowerCase(), {
                detail: event2,
                cancelable: true
              });
              return !util.global.dispatchEvent(domEvent);
            };
          } else if (typeof Event === "function") {
            var event = new Event("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event2) {
              var domEvent = new Event(name.toLowerCase(), {
                cancelable: true
              });
              domEvent.detail = event2;
              return !util.global.dispatchEvent(domEvent);
            };
          } else {
            var event = document.createEvent("CustomEvent");
            event.initCustomEvent("testingtheevent", false, true, {});
            util.global.dispatchEvent(event);
            return function(name, event2) {
              var domEvent = document.createEvent("CustomEvent");
              domEvent.initCustomEvent(
                name.toLowerCase(),
                false,
                true,
                event2
              );
              return !util.global.dispatchEvent(domEvent);
            };
          }
        } catch (e) {
        }
        return function() {
          return false;
        };
      }();
      var fireGlobalEvent = function() {
        if (util.isNode) {
          return function() {
            return process.emit.apply(process, arguments);
          };
        } else {
          if (!util.global) {
            return function() {
              return false;
            };
          }
          return function(name) {
            var methodName = "on" + name.toLowerCase();
            var method = util.global[methodName];
            if (!method)
              return false;
            method.apply(util.global, [].slice.call(arguments, 1));
            return true;
          };
        }
      }();
      function generatePromiseLifecycleEventObject(name, promise) {
        return { promise };
      }
      var eventToObjectGenerator = {
        promiseCreated: generatePromiseLifecycleEventObject,
        promiseFulfilled: generatePromiseLifecycleEventObject,
        promiseRejected: generatePromiseLifecycleEventObject,
        promiseResolved: generatePromiseLifecycleEventObject,
        promiseCancelled: generatePromiseLifecycleEventObject,
        promiseChained: function(name, promise, child) {
          return { promise, child };
        },
        warning: function(name, warning) {
          return { warning };
        },
        unhandledRejection: function(name, reason, promise) {
          return { reason, promise };
        },
        rejectionHandled: generatePromiseLifecycleEventObject
      };
      var activeFireEvent = function(name) {
        var globalEventFired = false;
        try {
          globalEventFired = fireGlobalEvent.apply(null, arguments);
        } catch (e) {
          async.throwLater(e);
          globalEventFired = true;
        }
        var domEventFired = false;
        try {
          domEventFired = fireDomEvent(
            name,
            eventToObjectGenerator[name].apply(null, arguments)
          );
        } catch (e) {
          async.throwLater(e);
          domEventFired = true;
        }
        return domEventFired || globalEventFired;
      };
      Promise2.config = function(opts) {
        opts = Object(opts);
        if ("longStackTraces" in opts) {
          if (opts.longStackTraces) {
            Promise2.longStackTraces();
          } else if (!opts.longStackTraces && Promise2.hasLongStackTraces()) {
            disableLongStackTraces();
          }
        }
        if ("warnings" in opts) {
          var warningsOption = opts.warnings;
          config.warnings = !!warningsOption;
          wForgottenReturn = config.warnings;
          if (util.isObject(warningsOption)) {
            if ("wForgottenReturn" in warningsOption) {
              wForgottenReturn = !!warningsOption.wForgottenReturn;
            }
          }
        }
        if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
          if (async.haveItemsQueued()) {
            throw new Error(
              "cannot enable cancellation after promises are in use"
            );
          }
          Promise2.prototype._clearCancellationData = cancellationClearCancellationData;
          Promise2.prototype._propagateFrom = cancellationPropagateFrom;
          Promise2.prototype._onCancel = cancellationOnCancel;
          Promise2.prototype._setOnCancel = cancellationSetOnCancel;
          Promise2.prototype._attachCancellationCallback = cancellationAttachCancellationCallback;
          Promise2.prototype._execute = cancellationExecute;
          propagateFromFunction = cancellationPropagateFrom;
          config.cancellation = true;
        }
        if ("monitoring" in opts) {
          if (opts.monitoring && !config.monitoring) {
            config.monitoring = true;
            Promise2.prototype._fireEvent = activeFireEvent;
          } else if (!opts.monitoring && config.monitoring) {
            config.monitoring = false;
            Promise2.prototype._fireEvent = defaultFireEvent;
          }
        }
        return Promise2;
      };
      function defaultFireEvent() {
        return false;
      }
      Promise2.prototype._fireEvent = defaultFireEvent;
      Promise2.prototype._execute = function(executor, resolve, reject) {
        try {
          executor(resolve, reject);
        } catch (e) {
          return e;
        }
      };
      Promise2.prototype._onCancel = function() {
      };
      Promise2.prototype._setOnCancel = function(handler) {
        ;
      };
      Promise2.prototype._attachCancellationCallback = function(onCancel) {
        ;
      };
      Promise2.prototype._captureStackTrace = function() {
      };
      Promise2.prototype._attachExtraTrace = function() {
      };
      Promise2.prototype._clearCancellationData = function() {
      };
      Promise2.prototype._propagateFrom = function(parent, flags) {
        ;
        ;
      };
      function cancellationExecute(executor, resolve, reject) {
        var promise = this;
        try {
          executor(resolve, reject, function(onCancel) {
            if (typeof onCancel !== "function") {
              throw new TypeError("onCancel must be a function, got: " + util.toString(onCancel));
            }
            promise._attachCancellationCallback(onCancel);
          });
        } catch (e) {
          return e;
        }
      }
      function cancellationAttachCancellationCallback(onCancel) {
        if (!this._isCancellable())
          return this;
        var previousOnCancel = this._onCancel();
        if (previousOnCancel !== void 0) {
          if (util.isArray(previousOnCancel)) {
            previousOnCancel.push(onCancel);
          } else {
            this._setOnCancel([previousOnCancel, onCancel]);
          }
        } else {
          this._setOnCancel(onCancel);
        }
      }
      function cancellationOnCancel() {
        return this._onCancelField;
      }
      function cancellationSetOnCancel(onCancel) {
        this._onCancelField = onCancel;
      }
      function cancellationClearCancellationData() {
        this._cancellationParent = void 0;
        this._onCancelField = void 0;
      }
      function cancellationPropagateFrom(parent, flags) {
        if ((flags & 1) !== 0) {
          this._cancellationParent = parent;
          var branchesRemainingToCancel = parent._branchesRemainingToCancel;
          if (branchesRemainingToCancel === void 0) {
            branchesRemainingToCancel = 0;
          }
          parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
        }
        if ((flags & 2) !== 0 && parent._isBound()) {
          this._setBoundTo(parent._boundTo);
        }
      }
      function bindingPropagateFrom(parent, flags) {
        if ((flags & 2) !== 0 && parent._isBound()) {
          this._setBoundTo(parent._boundTo);
        }
      }
      var propagateFromFunction = bindingPropagateFrom;
      function boundValueFunction() {
        var ret2 = this._boundTo;
        if (ret2 !== void 0) {
          if (ret2 instanceof Promise2) {
            if (ret2.isFulfilled()) {
              return ret2.value();
            } else {
              return void 0;
            }
          }
        }
        return ret2;
      }
      function longStackTracesCaptureStackTrace() {
        this._trace = new CapturedTrace(this._peekContext());
      }
      function longStackTracesAttachExtraTrace(error, ignoreSelf) {
        if (canAttachTrace2(error)) {
          var trace = this._trace;
          if (trace !== void 0) {
            if (ignoreSelf)
              trace = trace._parent;
          }
          if (trace !== void 0) {
            trace.attachExtraTrace(error);
          } else if (!error.__stackCleaned__) {
            var parsed = parseStackAndMessage(error);
            util.notEnumerableProp(
              error,
              "stack",
              parsed.message + "\n" + parsed.stack.join("\n")
            );
            util.notEnumerableProp(error, "__stackCleaned__", true);
          }
        }
      }
      function checkForgottenReturns(returnValue, promiseCreated, name, promise, parent) {
        if (returnValue === void 0 && promiseCreated !== null && wForgottenReturn) {
          if (parent !== void 0 && parent._returnedNonUndefined())
            return;
          if ((promise._bitField & 65535) === 0)
            return;
          if (name)
            name = name + " ";
          var handlerLine = "";
          var creatorLine = "";
          if (promiseCreated._trace) {
            var traceLines = promiseCreated._trace.stack.split("\n");
            var stack = cleanStack(traceLines);
            for (var i = stack.length - 1; i >= 0; --i) {
              var line = stack[i];
              if (!nodeFramePattern.test(line)) {
                var lineMatches = line.match(parseLinePattern);
                if (lineMatches) {
                  handlerLine = "at " + lineMatches[1] + ":" + lineMatches[2] + ":" + lineMatches[3] + " ";
                }
                break;
              }
            }
            if (stack.length > 0) {
              var firstUserLine = stack[0];
              for (var i = 0; i < traceLines.length; ++i) {
                if (traceLines[i] === firstUserLine) {
                  if (i > 0) {
                    creatorLine = "\n" + traceLines[i - 1];
                  }
                  break;
                }
              }
            }
          }
          var msg = "a promise was created in a " + name + "handler " + handlerLine + "but was not returned from it, see http://goo.gl/rRqMUw" + creatorLine;
          promise._warn(msg, true, promiseCreated);
        }
      }
      function deprecated(name, replacement) {
        var message = name + " is deprecated and will be removed in a future version.";
        if (replacement)
          message += " Use " + replacement + " instead.";
        return warn(message);
      }
      function warn(message, shouldUseOwnTrace, promise) {
        if (!config.warnings)
          return;
        var warning = new Warning(message);
        var ctx;
        if (shouldUseOwnTrace) {
          promise._attachExtraTrace(warning);
        } else if (config.longStackTraces && (ctx = Promise2._peekContext())) {
          ctx.attachExtraTrace(warning);
        } else {
          var parsed = parseStackAndMessage(warning);
          warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
        }
        if (!activeFireEvent("warning", warning)) {
          formatAndLogError(warning, "", true);
        }
      }
      function reconstructStack(message, stacks) {
        for (var i = 0; i < stacks.length - 1; ++i) {
          stacks[i].push("From previous event:");
          stacks[i] = stacks[i].join("\n");
        }
        if (i < stacks.length) {
          stacks[i] = stacks[i].join("\n");
        }
        return message + "\n" + stacks.join("\n");
      }
      function removeDuplicateOrEmptyJumps(stacks) {
        for (var i = 0; i < stacks.length; ++i) {
          if (stacks[i].length === 0 || i + 1 < stacks.length && stacks[i][0] === stacks[i + 1][0]) {
            stacks.splice(i, 1);
            i--;
          }
        }
      }
      function removeCommonRoots(stacks) {
        var current = stacks[0];
        for (var i = 1; i < stacks.length; ++i) {
          var prev = stacks[i];
          var currentLastIndex = current.length - 1;
          var currentLastLine = current[currentLastIndex];
          var commonRootMeetPoint = -1;
          for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
              commonRootMeetPoint = j;
              break;
            }
          }
          for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
              current.pop();
              currentLastIndex--;
            } else {
              break;
            }
          }
          current = prev;
        }
      }
      function cleanStack(stack) {
        var ret2 = [];
        for (var i = 0; i < stack.length; ++i) {
          var line = stack[i];
          var isTraceLine = "    (No stack trace)" === line || stackFramePattern.test(line);
          var isInternalFrame = isTraceLine && shouldIgnore(line);
          if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
              line = "    " + line;
            }
            ret2.push(line);
          }
        }
        return ret2;
      }
      function stackFramesAsArray(error) {
        var stack = error.stack.replace(/\s+$/g, "").split("\n");
        for (var i = 0; i < stack.length; ++i) {
          var line = stack[i];
          if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
          }
        }
        if (i > 0 && error.name != "SyntaxError") {
          stack = stack.slice(i);
        }
        return stack;
      }
      function parseStackAndMessage(error) {
        var stack = error.stack;
        var message = error.toString();
        stack = typeof stack === "string" && stack.length > 0 ? stackFramesAsArray(error) : ["    (No stack trace)"];
        return {
          message,
          stack: error.name == "SyntaxError" ? stack : cleanStack(stack)
        };
      }
      function formatAndLogError(error, title, isSoft) {
        if (typeof console !== "undefined") {
          var message;
          if (util.isObject(error)) {
            var stack = error.stack;
            message = title + formatStack(stack, error);
          } else {
            message = title + String(error);
          }
          if (typeof printWarning === "function") {
            printWarning(message, isSoft);
          } else if (typeof console.log === "function" || typeof console.log === "object") {
            console.log(message);
          }
        }
      }
      function fireRejectionEvent(name, localHandler, reason, promise) {
        var localEventFired = false;
        try {
          if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
              localHandler(promise);
            } else {
              localHandler(reason, promise);
            }
          }
        } catch (e) {
          async.throwLater(e);
        }
        if (name === "unhandledRejection") {
          if (!activeFireEvent(name, reason, promise) && !localEventFired) {
            formatAndLogError(reason, "Unhandled rejection ");
          }
        } else {
          activeFireEvent(name, promise);
        }
      }
      function formatNonError(obj2) {
        var str;
        if (typeof obj2 === "function") {
          str = "[function " + (obj2.name || "anonymous") + "]";
        } else {
          str = obj2 && typeof obj2.toString === "function" ? obj2.toString() : util.toString(obj2);
          var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
          if (ruselessToString.test(str)) {
            try {
              var newStr = JSON.stringify(obj2);
              str = newStr;
            } catch (e) {
            }
          }
          if (str.length === 0) {
            str = "(empty array)";
          }
        }
        return "(<" + snip(str) + ">, no stack trace)";
      }
      function snip(str) {
        var maxChars = 41;
        if (str.length < maxChars) {
          return str;
        }
        return str.substr(0, maxChars - 3) + "...";
      }
      function longStackTracesIsSupported() {
        return typeof captureStackTrace === "function";
      }
      var shouldIgnore = function() {
        return false;
      };
      var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
      function parseLineInfo(line) {
        var matches = line.match(parseLineInfoRegex);
        if (matches) {
          return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
          };
        }
      }
      function setBounds(firstLineError, lastLineError) {
        if (!longStackTracesIsSupported())
          return;
        var firstStackLines = firstLineError.stack.split("\n");
        var lastStackLines = lastLineError.stack.split("\n");
        var firstIndex = -1;
        var lastIndex = -1;
        var firstFileName;
        var lastFileName;
        for (var i = 0; i < firstStackLines.length; ++i) {
          var result = parseLineInfo(firstStackLines[i]);
          if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
          }
        }
        for (var i = 0; i < lastStackLines.length; ++i) {
          var result = parseLineInfo(lastStackLines[i]);
          if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
          }
        }
        if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName || firstFileName !== lastFileName || firstIndex >= lastIndex) {
          return;
        }
        shouldIgnore = function(line) {
          if (bluebirdFramePattern.test(line))
            return true;
          var info = parseLineInfo(line);
          if (info) {
            if (info.fileName === firstFileName && (firstIndex <= info.line && info.line <= lastIndex)) {
              return true;
            }
          }
          return false;
        };
      }
      function CapturedTrace(parent) {
        this._parent = parent;
        this._promisesCreated = 0;
        var length = this._length = 1 + (parent === void 0 ? 0 : parent._length);
        captureStackTrace(this, CapturedTrace);
        if (length > 32)
          this.uncycle();
      }
      util.inherits(CapturedTrace, Error);
      Context.CapturedTrace = CapturedTrace;
      CapturedTrace.prototype.uncycle = function() {
        var length = this._length;
        if (length < 2)
          return;
        var nodes = [];
        var stackToIndex = {};
        for (var i = 0, node = this; node !== void 0; ++i) {
          nodes.push(node);
          node = node._parent;
        }
        length = this._length = i;
        for (var i = length - 1; i >= 0; --i) {
          var stack = nodes[i].stack;
          if (stackToIndex[stack] === void 0) {
            stackToIndex[stack] = i;
          }
        }
        for (var i = 0; i < length; ++i) {
          var currentStack = nodes[i].stack;
          var index = stackToIndex[currentStack];
          if (index !== void 0 && index !== i) {
            if (index > 0) {
              nodes[index - 1]._parent = void 0;
              nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = void 0;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;
            if (index < length - 1) {
              cycleEdgeNode._parent = nodes[index + 1];
              cycleEdgeNode._parent.uncycle();
              cycleEdgeNode._length = cycleEdgeNode._parent._length + 1;
            } else {
              cycleEdgeNode._parent = void 0;
              cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
              nodes[j]._length = currentChildLength;
              currentChildLength++;
            }
            return;
          }
        }
      };
      CapturedTrace.prototype.attachExtraTrace = function(error) {
        if (error.__stackCleaned__)
          return;
        this.uncycle();
        var parsed = parseStackAndMessage(error);
        var message = parsed.message;
        var stacks = [parsed.stack];
        var trace = this;
        while (trace !== void 0) {
          stacks.push(cleanStack(trace.stack.split("\n")));
          trace = trace._parent;
        }
        removeCommonRoots(stacks);
        removeDuplicateOrEmptyJumps(stacks);
        util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
        util.notEnumerableProp(error, "__stackCleaned__", true);
      };
      var captureStackTrace = function stackDetection() {
        var v8stackFramePattern = /^\s*at\s*/;
        var v8stackFormatter = function(stack, error) {
          if (typeof stack === "string")
            return stack;
          if (error.name !== void 0 && error.message !== void 0) {
            return error.toString();
          }
          return formatNonError(error);
        };
        if (typeof Error.stackTraceLimit === "number" && typeof Error.captureStackTrace === "function") {
          Error.stackTraceLimit += 6;
          stackFramePattern = v8stackFramePattern;
          formatStack = v8stackFormatter;
          var captureStackTrace2 = Error.captureStackTrace;
          shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
          };
          return function(receiver, ignoreUntil) {
            Error.stackTraceLimit += 6;
            captureStackTrace2(receiver, ignoreUntil);
            Error.stackTraceLimit -= 6;
          };
        }
        var err = new Error();
        if (typeof err.stack === "string" && err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
          stackFramePattern = /@/;
          formatStack = v8stackFormatter;
          indentStackFrames = true;
          return function captureStackTrace3(o) {
            o.stack = new Error().stack;
          };
        }
        var hasStackAfterThrow;
        try {
          throw new Error();
        } catch (e) {
          hasStackAfterThrow = "stack" in e;
        }
        if (!("stack" in err) && hasStackAfterThrow && typeof Error.stackTraceLimit === "number") {
          stackFramePattern = v8stackFramePattern;
          formatStack = v8stackFormatter;
          return function captureStackTrace3(o) {
            Error.stackTraceLimit += 6;
            try {
              throw new Error();
            } catch (e) {
              o.stack = e.stack;
            }
            Error.stackTraceLimit -= 6;
          };
        }
        formatStack = function(stack, error) {
          if (typeof stack === "string")
            return stack;
          if ((typeof error === "object" || typeof error === "function") && error.name !== void 0 && error.message !== void 0) {
            return error.toString();
          }
          return formatNonError(error);
        };
        return null;
      }([]);
      if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
        printWarning = function(message) {
          console.warn(message);
        };
        if (util.isNode && process.stderr.isTTY) {
          printWarning = function(message, isSoft) {
            var color = isSoft ? "\x1B[33m" : "\x1B[31m";
            console.warn(color + message + "\x1B[0m\n");
          };
        } else if (!util.isNode && typeof new Error().stack === "string") {
          printWarning = function(message, isSoft) {
            console.warn(
              "%c" + message,
              isSoft ? "color: darkorange" : "color: red"
            );
          };
        }
      }
      var config = {
        warnings,
        longStackTraces: false,
        cancellation: false,
        monitoring: false
      };
      if (longStackTraces)
        Promise2.longStackTraces();
      return {
        longStackTraces: function() {
          return config.longStackTraces;
        },
        warnings: function() {
          return config.warnings;
        },
        cancellation: function() {
          return config.cancellation;
        },
        monitoring: function() {
          return config.monitoring;
        },
        propagateFromFunction: function() {
          return propagateFromFunction;
        },
        boundValueFunction: function() {
          return boundValueFunction;
        },
        checkForgottenReturns,
        setBounds,
        warn,
        deprecated,
        CapturedTrace,
        fireDomEvent,
        fireGlobalEvent
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/finally.js
var require_finally = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/finally.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, tryConvertToPromise) {
      var util = require_util();
      var CancellationError = Promise2.CancellationError;
      var errorObj2 = util.errorObj;
      function PassThroughHandlerContext(promise, type, handler) {
        this.promise = promise;
        this.type = type;
        this.handler = handler;
        this.called = false;
        this.cancelPromise = null;
      }
      PassThroughHandlerContext.prototype.isFinallyHandler = function() {
        return this.type === 0;
      };
      function FinallyHandlerCancelReaction(finallyHandler2) {
        this.finallyHandler = finallyHandler2;
      }
      FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
        checkCancel(this.finallyHandler);
      };
      function checkCancel(ctx, reason) {
        if (ctx.cancelPromise != null) {
          if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
          } else {
            ctx.cancelPromise._cancel();
          }
          ctx.cancelPromise = null;
          return true;
        }
        return false;
      }
      function succeed() {
        return finallyHandler.call(this, this.promise._target()._settledValue());
      }
      function fail(reason) {
        if (checkCancel(this, reason))
          return;
        errorObj2.e = reason;
        return errorObj2;
      }
      function finallyHandler(reasonOrValue) {
        var promise = this.promise;
        var handler = this.handler;
        if (!this.called) {
          this.called = true;
          var ret2 = this.isFinallyHandler() ? handler.call(promise._boundValue()) : handler.call(promise._boundValue(), reasonOrValue);
          if (ret2 !== void 0) {
            promise._setReturnedNonUndefined();
            var maybePromise = tryConvertToPromise(ret2, promise);
            if (maybePromise instanceof Promise2) {
              if (this.cancelPromise != null) {
                if (maybePromise._isCancelled()) {
                  var reason = new CancellationError("late cancellation observer");
                  promise._attachExtraTrace(reason);
                  errorObj2.e = reason;
                  return errorObj2;
                } else if (maybePromise.isPending()) {
                  maybePromise._attachCancellationCallback(
                    new FinallyHandlerCancelReaction(this)
                  );
                }
              }
              return maybePromise._then(
                succeed,
                fail,
                void 0,
                this,
                void 0
              );
            }
          }
        }
        if (promise.isRejected()) {
          checkCancel(this);
          errorObj2.e = reasonOrValue;
          return errorObj2;
        } else {
          checkCancel(this);
          return reasonOrValue;
        }
      }
      Promise2.prototype._passThrough = function(handler, type, success, fail2) {
        if (typeof handler !== "function")
          return this.then();
        return this._then(
          success,
          fail2,
          void 0,
          new PassThroughHandlerContext(this, type, handler),
          void 0
        );
      };
      Promise2.prototype.lastly = Promise2.prototype["finally"] = function(handler) {
        return this._passThrough(
          handler,
          0,
          finallyHandler,
          finallyHandler
        );
      };
      Promise2.prototype.tap = function(handler) {
        return this._passThrough(handler, 1, finallyHandler);
      };
      return PassThroughHandlerContext;
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/catch_filter.js
var require_catch_filter = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/catch_filter.js"(exports2, module2) {
    "use strict";
    module2.exports = function(NEXT_FILTER) {
      var util = require_util();
      var getKeys = require_es5().keys;
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      function catchFilter(instances, cb, promise) {
        return function(e) {
          var boundTo = promise._boundValue();
          predicateLoop:
            for (var i = 0; i < instances.length; ++i) {
              var item = instances[i];
              if (item === Error || item != null && item.prototype instanceof Error) {
                if (e instanceof item) {
                  return tryCatch2(cb).call(boundTo, e);
                }
              } else if (typeof item === "function") {
                var matchesPredicate = tryCatch2(item).call(boundTo, e);
                if (matchesPredicate === errorObj2) {
                  return matchesPredicate;
                } else if (matchesPredicate) {
                  return tryCatch2(cb).call(boundTo, e);
                }
              } else if (util.isObject(e)) {
                var keys = getKeys(item);
                for (var j = 0; j < keys.length; ++j) {
                  var key = keys[j];
                  if (item[key] != e[key]) {
                    continue predicateLoop;
                  }
                }
                return tryCatch2(cb).call(boundTo, e);
              }
            }
          return NEXT_FILTER;
        };
      }
      return catchFilter;
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/nodeback.js
var require_nodeback = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/nodeback.js"(exports2, module2) {
    "use strict";
    var util = require_util();
    var maybeWrapAsError2 = util.maybeWrapAsError;
    var errors = require_errors();
    var OperationalError = errors.OperationalError;
    var es52 = require_es5();
    function isUntypedError(obj2) {
      return obj2 instanceof Error && es52.getPrototypeOf(obj2) === Error.prototype;
    }
    var rErrorKey = /^(?:name|message|stack|cause)$/;
    function wrapAsOperationalError(obj2) {
      var ret2;
      if (isUntypedError(obj2)) {
        ret2 = new OperationalError(obj2);
        ret2.name = obj2.name;
        ret2.message = obj2.message;
        ret2.stack = obj2.stack;
        var keys = es52.keys(obj2);
        for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          if (!rErrorKey.test(key)) {
            ret2[key] = obj2[key];
          }
        }
        return ret2;
      }
      util.markAsOriginatingFromRejection(obj2);
      return obj2;
    }
    function nodebackForPromise(promise, multiArgs) {
      return function(err, value) {
        if (promise === null)
          return;
        if (err) {
          var wrapped = wrapAsOperationalError(maybeWrapAsError2(err));
          promise._attachExtraTrace(wrapped);
          promise._reject(wrapped);
        } else if (!multiArgs) {
          promise._fulfill(value);
        } else {
          var $_len = arguments.length;
          var args = new Array(Math.max($_len - 1, 0));
          for (var $_i = 1; $_i < $_len; ++$_i) {
            args[$_i - 1] = arguments[$_i];
          }
          ;
          promise._fulfill(args);
        }
        promise = null;
      };
    }
    module2.exports = nodebackForPromise;
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/method.js
var require_method = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/method.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, INTERNAL, tryConvertToPromise, apiRejection, debug) {
      var util = require_util();
      var tryCatch2 = util.tryCatch;
      Promise2.method = function(fn) {
        if (typeof fn !== "function") {
          throw new Promise2.TypeError("expecting a function but got " + util.classString(fn));
        }
        return function() {
          var ret2 = new Promise2(INTERNAL);
          ret2._captureStackTrace();
          ret2._pushContext();
          var value = tryCatch2(fn).apply(this, arguments);
          var promiseCreated = ret2._popContext();
          debug.checkForgottenReturns(
            value,
            promiseCreated,
            "Promise.method",
            ret2
          );
          ret2._resolveFromSyncValue(value);
          return ret2;
        };
      };
      Promise2.attempt = Promise2["try"] = function(fn) {
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var ret2 = new Promise2(INTERNAL);
        ret2._captureStackTrace();
        ret2._pushContext();
        var value;
        if (arguments.length > 1) {
          debug.deprecated("calling Promise.try with more than 1 argument");
          var arg = arguments[1];
          var ctx = arguments[2];
          value = util.isArray(arg) ? tryCatch2(fn).apply(ctx, arg) : tryCatch2(fn).call(ctx, arg);
        } else {
          value = tryCatch2(fn)();
        }
        var promiseCreated = ret2._popContext();
        debug.checkForgottenReturns(
          value,
          promiseCreated,
          "Promise.try",
          ret2
        );
        ret2._resolveFromSyncValue(value);
        return ret2;
      };
      Promise2.prototype._resolveFromSyncValue = function(value) {
        if (value === util.errorObj) {
          this._rejectCallback(value.e, false);
        } else {
          this._resolveCallback(value, true);
        }
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/bind.js
var require_bind = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/bind.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, INTERNAL, tryConvertToPromise, debug) {
      var calledBind = false;
      var rejectThis = function(_, e) {
        this._reject(e);
      };
      var targetRejected = function(e, context) {
        context.promiseRejectionQueued = true;
        context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
      };
      var bindingResolved = function(thisArg, context) {
        if ((this._bitField & 50397184) === 0) {
          this._resolveCallback(context.target);
        }
      };
      var bindingRejected = function(e, context) {
        if (!context.promiseRejectionQueued)
          this._reject(e);
      };
      Promise2.prototype.bind = function(thisArg) {
        if (!calledBind) {
          calledBind = true;
          Promise2.prototype._propagateFrom = debug.propagateFromFunction();
          Promise2.prototype._boundValue = debug.boundValueFunction();
        }
        var maybePromise = tryConvertToPromise(thisArg);
        var ret2 = new Promise2(INTERNAL);
        ret2._propagateFrom(this, 1);
        var target = this._target();
        ret2._setBoundTo(maybePromise);
        if (maybePromise instanceof Promise2) {
          var context = {
            promiseRejectionQueued: false,
            promise: ret2,
            target,
            bindingPromise: maybePromise
          };
          target._then(INTERNAL, targetRejected, void 0, ret2, context);
          maybePromise._then(
            bindingResolved,
            bindingRejected,
            void 0,
            ret2,
            context
          );
          ret2._setOnCancel(maybePromise);
        } else {
          ret2._resolveCallback(target);
        }
        return ret2;
      };
      Promise2.prototype._setBoundTo = function(obj2) {
        if (obj2 !== void 0) {
          this._bitField = this._bitField | 2097152;
          this._boundTo = obj2;
        } else {
          this._bitField = this._bitField & ~2097152;
        }
      };
      Promise2.prototype._isBound = function() {
        return (this._bitField & 2097152) === 2097152;
      };
      Promise2.bind = function(thisArg, value) {
        return Promise2.resolve(value).bind(thisArg);
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/cancel.js
var require_cancel = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/cancel.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, PromiseArray, apiRejection, debug) {
      var util = require_util();
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      var async = Promise2._async;
      Promise2.prototype["break"] = Promise2.prototype.cancel = function() {
        if (!debug.cancellation())
          return this._warn("cancellation is disabled");
        var promise = this;
        var child = promise;
        while (promise._isCancellable()) {
          if (!promise._cancelBy(child)) {
            if (child._isFollowing()) {
              child._followee().cancel();
            } else {
              child._cancelBranched();
            }
            break;
          }
          var parent = promise._cancellationParent;
          if (parent == null || !parent._isCancellable()) {
            if (promise._isFollowing()) {
              promise._followee().cancel();
            } else {
              promise._cancelBranched();
            }
            break;
          } else {
            if (promise._isFollowing())
              promise._followee().cancel();
            promise._setWillBeCancelled();
            child = promise;
            promise = parent;
          }
        }
      };
      Promise2.prototype._branchHasCancelled = function() {
        this._branchesRemainingToCancel--;
      };
      Promise2.prototype._enoughBranchesHaveCancelled = function() {
        return this._branchesRemainingToCancel === void 0 || this._branchesRemainingToCancel <= 0;
      };
      Promise2.prototype._cancelBy = function(canceller) {
        if (canceller === this) {
          this._branchesRemainingToCancel = 0;
          this._invokeOnCancel();
          return true;
        } else {
          this._branchHasCancelled();
          if (this._enoughBranchesHaveCancelled()) {
            this._invokeOnCancel();
            return true;
          }
        }
        return false;
      };
      Promise2.prototype._cancelBranched = function() {
        if (this._enoughBranchesHaveCancelled()) {
          this._cancel();
        }
      };
      Promise2.prototype._cancel = function() {
        if (!this._isCancellable())
          return;
        this._setCancelled();
        async.invoke(this._cancelPromises, this, void 0);
      };
      Promise2.prototype._cancelPromises = function() {
        if (this._length() > 0)
          this._settlePromises();
      };
      Promise2.prototype._unsetOnCancel = function() {
        this._onCancelField = void 0;
      };
      Promise2.prototype._isCancellable = function() {
        return this.isPending() && !this._isCancelled();
      };
      Promise2.prototype.isCancellable = function() {
        return this.isPending() && !this.isCancelled();
      };
      Promise2.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
        if (util.isArray(onCancelCallback)) {
          for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
          }
        } else if (onCancelCallback !== void 0) {
          if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
              var e = tryCatch2(onCancelCallback).call(this._boundValue());
              if (e === errorObj2) {
                this._attachExtraTrace(e.e);
                async.throwLater(e.e);
              }
            }
          } else {
            onCancelCallback._resultCancelled(this);
          }
        }
      };
      Promise2.prototype._invokeOnCancel = function() {
        var onCancelCallback = this._onCancel();
        this._unsetOnCancel();
        async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
      };
      Promise2.prototype._invokeInternalOnCancel = function() {
        if (this._isCancellable()) {
          this._doInvokeOnCancel(this._onCancel(), true);
          this._unsetOnCancel();
        }
      };
      Promise2.prototype._resultCancelled = function() {
        this.cancel();
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/direct_resolve.js
var require_direct_resolve = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/direct_resolve.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2) {
      function returner() {
        return this.value;
      }
      function thrower2() {
        throw this.reason;
      }
      Promise2.prototype["return"] = Promise2.prototype.thenReturn = function(value) {
        if (value instanceof Promise2)
          value.suppressUnhandledRejections();
        return this._then(
          returner,
          void 0,
          void 0,
          { value },
          void 0
        );
      };
      Promise2.prototype["throw"] = Promise2.prototype.thenThrow = function(reason) {
        return this._then(
          thrower2,
          void 0,
          void 0,
          { reason },
          void 0
        );
      };
      Promise2.prototype.catchThrow = function(reason) {
        if (arguments.length <= 1) {
          return this._then(
            void 0,
            thrower2,
            void 0,
            { reason },
            void 0
          );
        } else {
          var _reason = arguments[1];
          var handler = function() {
            throw _reason;
          };
          return this.caught(reason, handler);
        }
      };
      Promise2.prototype.catchReturn = function(value) {
        if (arguments.length <= 1) {
          if (value instanceof Promise2)
            value.suppressUnhandledRejections();
          return this._then(
            void 0,
            returner,
            void 0,
            { value },
            void 0
          );
        } else {
          var _value = arguments[1];
          if (_value instanceof Promise2)
            _value.suppressUnhandledRejections();
          var handler = function() {
            return _value;
          };
          return this.caught(value, handler);
        }
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/synchronous_inspection.js
var require_synchronous_inspection = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/synchronous_inspection.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2) {
      function PromiseInspection(promise) {
        if (promise !== void 0) {
          promise = promise._target();
          this._bitField = promise._bitField;
          this._settledValueField = promise._isFateSealed() ? promise._settledValue() : void 0;
        } else {
          this._bitField = 0;
          this._settledValueField = void 0;
        }
      }
      PromiseInspection.prototype._settledValue = function() {
        return this._settledValueField;
      };
      var value = PromiseInspection.prototype.value = function() {
        if (!this.isFulfilled()) {
          throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\n\n    See http://goo.gl/MqrFmX\n");
        }
        return this._settledValue();
      };
      var reason = PromiseInspection.prototype.error = PromiseInspection.prototype.reason = function() {
        if (!this.isRejected()) {
          throw new TypeError("cannot get rejection reason of a non-rejected promise\n\n    See http://goo.gl/MqrFmX\n");
        }
        return this._settledValue();
      };
      var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
        return (this._bitField & 33554432) !== 0;
      };
      var isRejected = PromiseInspection.prototype.isRejected = function() {
        return (this._bitField & 16777216) !== 0;
      };
      var isPending = PromiseInspection.prototype.isPending = function() {
        return (this._bitField & 50397184) === 0;
      };
      var isResolved = PromiseInspection.prototype.isResolved = function() {
        return (this._bitField & 50331648) !== 0;
      };
      PromiseInspection.prototype.isCancelled = function() {
        return (this._bitField & 8454144) !== 0;
      };
      Promise2.prototype.__isCancelled = function() {
        return (this._bitField & 65536) === 65536;
      };
      Promise2.prototype._isCancelled = function() {
        return this._target().__isCancelled();
      };
      Promise2.prototype.isCancelled = function() {
        return (this._target()._bitField & 8454144) !== 0;
      };
      Promise2.prototype.isPending = function() {
        return isPending.call(this._target());
      };
      Promise2.prototype.isRejected = function() {
        return isRejected.call(this._target());
      };
      Promise2.prototype.isFulfilled = function() {
        return isFulfilled.call(this._target());
      };
      Promise2.prototype.isResolved = function() {
        return isResolved.call(this._target());
      };
      Promise2.prototype.value = function() {
        return value.call(this._target());
      };
      Promise2.prototype.reason = function() {
        var target = this._target();
        target._unsetRejectionIsUnhandled();
        return reason.call(target);
      };
      Promise2.prototype._value = function() {
        return this._settledValue();
      };
      Promise2.prototype._reason = function() {
        this._unsetRejectionIsUnhandled();
        return this._settledValue();
      };
      Promise2.PromiseInspection = PromiseInspection;
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/join.js
var require_join = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/join.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, PromiseArray, tryConvertToPromise, INTERNAL, async, getDomain) {
      var util = require_util();
      var canEvaluate2 = util.canEvaluate;
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      var reject;
      if (true) {
        if (canEvaluate2) {
          var thenCallback = function(i2) {
            return new Function("value", "holder", "                             \n            'use strict';                                                    \n            holder.pIndex = value;                                           \n            holder.checkFulfillment(this);                                   \n            ".replace(/Index/g, i2));
          };
          var promiseSetter = function(i2) {
            return new Function("promise", "holder", "                           \n            'use strict';                                                    \n            holder.pIndex = promise;                                         \n            ".replace(/Index/g, i2));
          };
          var generateHolderClass = function(total) {
            var props = new Array(total);
            for (var i2 = 0; i2 < props.length; ++i2) {
              props[i2] = "this.p" + (i2 + 1);
            }
            var assignment = props.join(" = ") + " = null;";
            var cancellationCode = "var promise;\n" + props.map(function(prop) {
              return "                                                         \n                promise = " + prop + ";                                      \n                if (promise instanceof Promise) {                            \n                    promise.cancel();                                        \n                }                                                            \n            ";
            }).join("\n");
            var passedArguments = props.join(", ");
            var name = "Holder$" + total;
            var code = "return function(tryCatch, errorObj, Promise, async) {    \n            'use strict';                                                    \n            function [TheName](fn) {                                         \n                [TheProperties]                                              \n                this.fn = fn;                                                \n                this.asyncNeeded = true;                                     \n                this.now = 0;                                                \n            }                                                                \n                                                                             \n            [TheName].prototype._callFunction = function(promise) {          \n                promise._pushContext();                                      \n                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n                promise._popContext();                                       \n                if (ret === errorObj) {                                      \n                    promise._rejectCallback(ret.e, false);                   \n                } else {                                                     \n                    promise._resolveCallback(ret);                           \n                }                                                            \n            };                                                               \n                                                                             \n            [TheName].prototype.checkFulfillment = function(promise) {       \n                var now = ++this.now;                                        \n                if (now === [TheTotal]) {                                    \n                    if (this.asyncNeeded) {                                  \n                        async.invoke(this._callFunction, this, promise);     \n                    } else {                                                 \n                        this._callFunction(promise);                         \n                    }                                                        \n                                                                             \n                }                                                            \n            };                                                               \n                                                                             \n            [TheName].prototype._resultCancelled = function() {              \n                [CancellationCode]                                           \n            };                                                               \n                                                                             \n            return [TheName];                                                \n        }(tryCatch, errorObj, Promise, async);                               \n        ";
            code = code.replace(/\[TheName\]/g, name).replace(/\[TheTotal\]/g, total).replace(/\[ThePassedArguments\]/g, passedArguments).replace(/\[TheProperties\]/g, assignment).replace(/\[CancellationCode\]/g, cancellationCode);
            return new Function("tryCatch", "errorObj", "Promise", "async", code)(tryCatch2, errorObj2, Promise2, async);
          };
          var holderClasses = [];
          var thenCallbacks = [];
          var promiseSetters = [];
          for (var i = 0; i < 8; ++i) {
            holderClasses.push(generateHolderClass(i + 1));
            thenCallbacks.push(thenCallback(i + 1));
            promiseSetters.push(promiseSetter(i + 1));
          }
          reject = function(reason) {
            this._reject(reason);
          };
        }
      }
      Promise2.join = function() {
        var last = arguments.length - 1;
        var fn;
        if (last > 0 && typeof arguments[last] === "function") {
          fn = arguments[last];
          if (true) {
            if (last <= 8 && canEvaluate2) {
              var ret2 = new Promise2(INTERNAL);
              ret2._captureStackTrace();
              var HolderClass = holderClasses[last - 1];
              var holder = new HolderClass(fn);
              var callbacks = thenCallbacks;
              for (var i2 = 0; i2 < last; ++i2) {
                var maybePromise = tryConvertToPromise(arguments[i2], ret2);
                if (maybePromise instanceof Promise2) {
                  maybePromise = maybePromise._target();
                  var bitField = maybePromise._bitField;
                  ;
                  if ((bitField & 50397184) === 0) {
                    maybePromise._then(
                      callbacks[i2],
                      reject,
                      void 0,
                      ret2,
                      holder
                    );
                    promiseSetters[i2](maybePromise, holder);
                    holder.asyncNeeded = false;
                  } else if ((bitField & 33554432) !== 0) {
                    callbacks[i2].call(
                      ret2,
                      maybePromise._value(),
                      holder
                    );
                  } else if ((bitField & 16777216) !== 0) {
                    ret2._reject(maybePromise._reason());
                  } else {
                    ret2._cancel();
                  }
                } else {
                  callbacks[i2].call(ret2, maybePromise, holder);
                }
              }
              if (!ret2._isFateSealed()) {
                if (holder.asyncNeeded) {
                  var domain = getDomain();
                  if (domain !== null) {
                    holder.fn = util.domainBind(domain, holder.fn);
                  }
                }
                ret2._setAsyncGuaranteed();
                ret2._setOnCancel(holder);
              }
              return ret2;
            }
          }
        }
        var $_len = arguments.length;
        var args = new Array($_len);
        for (var $_i = 0; $_i < $_len; ++$_i) {
          args[$_i] = arguments[$_i];
        }
        ;
        if (fn)
          args.pop();
        var ret2 = new PromiseArray(args).promise();
        return fn !== void 0 ? ret2.spread(fn) : ret2;
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/map.js
var require_map = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/map.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug) {
      var getDomain = Promise2._getDomain;
      var util = require_util();
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      var async = Promise2._async;
      function MappingPromiseArray(promises, fn, limit, _filter) {
        this.constructor$(promises);
        this._promise._captureStackTrace();
        var domain = getDomain();
        this._callback = domain === null ? fn : util.domainBind(domain, fn);
        this._preservedValues = _filter === INTERNAL ? new Array(this.length()) : null;
        this._limit = limit;
        this._inFlight = 0;
        this._queue = [];
        async.invoke(this._asyncInit, this, void 0);
      }
      util.inherits(MappingPromiseArray, PromiseArray);
      MappingPromiseArray.prototype._asyncInit = function() {
        this._init$(void 0, -2);
      };
      MappingPromiseArray.prototype._init = function() {
      };
      MappingPromiseArray.prototype._promiseFulfilled = function(value, index) {
        var values = this._values;
        var length = this.length();
        var preservedValues = this._preservedValues;
        var limit = this._limit;
        if (index < 0) {
          index = index * -1 - 1;
          values[index] = value;
          if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved())
              return true;
          }
        } else {
          if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return false;
          }
          if (preservedValues !== null)
            preservedValues[index] = value;
          var promise = this._promise;
          var callback = this._callback;
          var receiver = promise._boundValue();
          promise._pushContext();
          var ret2 = tryCatch2(callback).call(receiver, value, index, length);
          var promiseCreated = promise._popContext();
          debug.checkForgottenReturns(
            ret2,
            promiseCreated,
            preservedValues !== null ? "Promise.filter" : "Promise.map",
            promise
          );
          if (ret2 === errorObj2) {
            this._reject(ret2.e);
            return true;
          }
          var maybePromise = tryConvertToPromise(ret2, this._promise);
          if (maybePromise instanceof Promise2) {
            maybePromise = maybePromise._target();
            var bitField = maybePromise._bitField;
            ;
            if ((bitField & 50397184) === 0) {
              if (limit >= 1)
                this._inFlight++;
              values[index] = maybePromise;
              maybePromise._proxy(this, (index + 1) * -1);
              return false;
            } else if ((bitField & 33554432) !== 0) {
              ret2 = maybePromise._value();
            } else if ((bitField & 16777216) !== 0) {
              this._reject(maybePromise._reason());
              return true;
            } else {
              this._cancel();
              return true;
            }
          }
          values[index] = ret2;
        }
        var totalResolved = ++this._totalResolved;
        if (totalResolved >= length) {
          if (preservedValues !== null) {
            this._filter(values, preservedValues);
          } else {
            this._resolve(values);
          }
          return true;
        }
        return false;
      };
      MappingPromiseArray.prototype._drainQueue = function() {
        var queue = this._queue;
        var limit = this._limit;
        var values = this._values;
        while (queue.length > 0 && this._inFlight < limit) {
          if (this._isResolved())
            return;
          var index = queue.pop();
          this._promiseFulfilled(values[index], index);
        }
      };
      MappingPromiseArray.prototype._filter = function(booleans, values) {
        var len = values.length;
        var ret2 = new Array(len);
        var j = 0;
        for (var i = 0; i < len; ++i) {
          if (booleans[i])
            ret2[j++] = values[i];
        }
        ret2.length = j;
        this._resolve(ret2);
      };
      MappingPromiseArray.prototype.preservedValues = function() {
        return this._preservedValues;
      };
      function map(promises, fn, options, _filter) {
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var limit = 0;
        if (options !== void 0) {
          if (typeof options === "object" && options !== null) {
            if (typeof options.concurrency !== "number") {
              return Promise2.reject(
                new TypeError("'concurrency' must be a number but it is " + util.classString(options.concurrency))
              );
            }
            limit = options.concurrency;
          } else {
            return Promise2.reject(new TypeError(
              "options argument must be an object but it is " + util.classString(options)
            ));
          }
        }
        limit = typeof limit === "number" && isFinite(limit) && limit >= 1 ? limit : 0;
        return new MappingPromiseArray(promises, fn, limit, _filter).promise();
      }
      Promise2.prototype.map = function(fn, options) {
        return map(this, fn, options, null);
      };
      Promise2.map = function(promises, fn, options, _filter) {
        return map(promises, fn, options, _filter);
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/call_get.js
var require_call_get = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/call_get.js"(exports2, module2) {
    "use strict";
    var cr = Object.create;
    if (cr) {
      callerCache = cr(null);
      getterCache = cr(null);
      callerCache[" size"] = getterCache[" size"] = 0;
    }
    var callerCache;
    var getterCache;
    module2.exports = function(Promise2) {
      var util = require_util();
      var canEvaluate2 = util.canEvaluate;
      var isIdentifier2 = util.isIdentifier;
      var getMethodCaller;
      var getGetter;
      if (true) {
        var makeMethodCaller = function(methodName) {
          return new Function("ensureMethod", "                                    \n        return function(obj) {                                               \n            'use strict'                                                     \n            var len = this.length;                                           \n            ensureMethod(obj, 'methodName');                                 \n            switch(len) {                                                    \n                case 1: return obj.methodName(this[0]);                      \n                case 2: return obj.methodName(this[0], this[1]);             \n                case 3: return obj.methodName(this[0], this[1], this[2]);    \n                case 0: return obj.methodName();                             \n                default:                                                     \n                    return obj.methodName.apply(obj, this);                  \n            }                                                                \n        };                                                                   \n        ".replace(/methodName/g, methodName))(ensureMethod);
        };
        var makeGetter = function(propertyName) {
          return new Function("obj", "                                             \n        'use strict';                                                        \n        return obj.propertyName;                                             \n        ".replace("propertyName", propertyName));
        };
        var getCompiled = function(name, compiler, cache) {
          var ret2 = cache[name];
          if (typeof ret2 !== "function") {
            if (!isIdentifier2(name)) {
              return null;
            }
            ret2 = compiler(name);
            cache[name] = ret2;
            cache[" size"]++;
            if (cache[" size"] > 512) {
              var keys = Object.keys(cache);
              for (var i = 0; i < 256; ++i)
                delete cache[keys[i]];
              cache[" size"] = keys.length - 256;
            }
          }
          return ret2;
        };
        getMethodCaller = function(name) {
          return getCompiled(name, makeMethodCaller, callerCache);
        };
        getGetter = function(name) {
          return getCompiled(name, makeGetter, getterCache);
        };
      }
      function ensureMethod(obj2, methodName) {
        var fn;
        if (obj2 != null)
          fn = obj2[methodName];
        if (typeof fn !== "function") {
          var message = "Object " + util.classString(obj2) + " has no method '" + util.toString(methodName) + "'";
          throw new Promise2.TypeError(message);
        }
        return fn;
      }
      function caller(obj2) {
        var methodName = this.pop();
        var fn = ensureMethod(obj2, methodName);
        return fn.apply(obj2, this);
      }
      Promise2.prototype.call = function(methodName) {
        var $_len = arguments.length;
        var args = new Array(Math.max($_len - 1, 0));
        for (var $_i = 1; $_i < $_len; ++$_i) {
          args[$_i - 1] = arguments[$_i];
        }
        ;
        if (true) {
          if (canEvaluate2) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
              return this._then(
                maybeCaller,
                void 0,
                void 0,
                args,
                void 0
              );
            }
          }
        }
        args.push(methodName);
        return this._then(caller, void 0, void 0, args, void 0);
      };
      function namedGetter(obj2) {
        return obj2[this];
      }
      function indexedGetter(obj2) {
        var index = +this;
        if (index < 0)
          index = Math.max(0, index + obj2.length);
        return obj2[index];
      }
      Promise2.prototype.get = function(propertyName) {
        var isIndex = typeof propertyName === "number";
        var getter;
        if (!isIndex) {
          if (canEvaluate2) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
          } else {
            getter = namedGetter;
          }
        } else {
          getter = indexedGetter;
        }
        return this._then(getter, void 0, void 0, propertyName, void 0);
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/using.js
var require_using = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/using.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug) {
      var util = require_util();
      var TypeError2 = require_errors().TypeError;
      var inherits2 = require_util().inherits;
      var errorObj2 = util.errorObj;
      var tryCatch2 = util.tryCatch;
      var NULL = {};
      function thrower2(e) {
        setTimeout(function() {
          throw e;
        }, 0);
      }
      function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable && typeof thenable._isDisposable === "function" && typeof thenable._getDisposer === "function" && thenable._isDisposable()) {
          maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
      }
      function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret2 = new Promise2(INTERNAL);
        function iterator() {
          if (i >= len)
            return ret2._fulfill();
          var maybePromise = castPreservingDisposable(resources[i++]);
          if (maybePromise instanceof Promise2 && maybePromise._isDisposable()) {
            try {
              maybePromise = tryConvertToPromise(
                maybePromise._getDisposer().tryDispose(inspection),
                resources.promise
              );
            } catch (e) {
              return thrower2(e);
            }
            if (maybePromise instanceof Promise2) {
              return maybePromise._then(
                iterator,
                thrower2,
                null,
                null,
                null
              );
            }
          }
          iterator();
        }
        iterator();
        return ret2;
      }
      function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
      }
      Disposer.prototype.data = function() {
        return this._data;
      };
      Disposer.prototype.promise = function() {
        return this._promise;
      };
      Disposer.prototype.resource = function() {
        if (this.promise().isFulfilled()) {
          return this.promise().value();
        }
        return NULL;
      };
      Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== void 0)
          context._pushContext();
        var ret2 = resource !== NULL ? this.doDispose(resource, inspection) : null;
        if (context !== void 0)
          context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret2;
      };
      Disposer.isDisposer = function(d) {
        return d != null && typeof d.resource === "function" && typeof d.tryDispose === "function";
      };
      function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
      }
      inherits2(FunctionDisposer, Disposer);
      FunctionDisposer.prototype.doDispose = function(resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
      };
      function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
          this.resources[this.index]._setDisposable(value);
          return value.promise();
        }
        return value;
      }
      function ResourceList(length) {
        this.length = length;
        this.promise = null;
        this[length - 1] = null;
      }
      ResourceList.prototype._resultCancelled = function() {
        var len = this.length;
        for (var i = 0; i < len; ++i) {
          var item = this[i];
          if (item instanceof Promise2) {
            item.cancel();
          }
        }
      };
      Promise2.using = function() {
        var len = arguments.length;
        if (len < 2)
          return apiRejection(
            "you must pass at least 2 arguments to Promise.using"
          );
        var fn = arguments[len - 1];
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
          input = arguments[0];
          len = input.length;
          spreadArgs = false;
        } else {
          input = arguments;
          len--;
        }
        var resources = new ResourceList(len);
        for (var i = 0; i < len; ++i) {
          var resource = input[i];
          if (Disposer.isDisposer(resource)) {
            var disposer = resource;
            resource = resource.promise();
            resource._setDisposable(disposer);
          } else {
            var maybePromise = tryConvertToPromise(resource);
            if (maybePromise instanceof Promise2) {
              resource = maybePromise._then(maybeUnwrapDisposer, null, null, {
                resources,
                index: i
              }, void 0);
            }
          }
          resources[i] = resource;
        }
        var reflectedResources = new Array(resources.length);
        for (var i = 0; i < reflectedResources.length; ++i) {
          reflectedResources[i] = Promise2.resolve(resources[i]).reflect();
        }
        var resultPromise = Promise2.all(reflectedResources).then(function(inspections) {
          for (var i2 = 0; i2 < inspections.length; ++i2) {
            var inspection = inspections[i2];
            if (inspection.isRejected()) {
              errorObj2.e = inspection.error();
              return errorObj2;
            } else if (!inspection.isFulfilled()) {
              resultPromise.cancel();
              return;
            }
            inspections[i2] = inspection.value();
          }
          promise._pushContext();
          fn = tryCatch2(fn);
          var ret2 = spreadArgs ? fn.apply(void 0, inspections) : fn(inspections);
          var promiseCreated = promise._popContext();
          debug.checkForgottenReturns(
            ret2,
            promiseCreated,
            "Promise.using",
            promise
          );
          return ret2;
        });
        var promise = resultPromise.lastly(function() {
          var inspection = new Promise2.PromiseInspection(resultPromise);
          return dispose(resources, inspection);
        });
        resources.promise = promise;
        promise._setOnCancel(resources);
        return promise;
      };
      Promise2.prototype._setDisposable = function(disposer) {
        this._bitField = this._bitField | 131072;
        this._disposer = disposer;
      };
      Promise2.prototype._isDisposable = function() {
        return (this._bitField & 131072) > 0;
      };
      Promise2.prototype._getDisposer = function() {
        return this._disposer;
      };
      Promise2.prototype._unsetDisposable = function() {
        this._bitField = this._bitField & ~131072;
        this._disposer = void 0;
      };
      Promise2.prototype.disposer = function(fn) {
        if (typeof fn === "function") {
          return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError2();
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/timers.js
var require_timers = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/timers.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, INTERNAL, debug) {
      var util = require_util();
      var TimeoutError = Promise2.TimeoutError;
      function HandleWrapper(handle) {
        this.handle = handle;
      }
      HandleWrapper.prototype._resultCancelled = function() {
        clearTimeout(this.handle);
      };
      var afterValue = function(value) {
        return delay2(+this).thenReturn(value);
      };
      var delay2 = Promise2.delay = function(ms, value) {
        var ret2;
        var handle;
        if (value !== void 0) {
          ret2 = Promise2.resolve(value)._then(afterValue, null, null, ms, void 0);
          if (debug.cancellation() && value instanceof Promise2) {
            ret2._setOnCancel(value);
          }
        } else {
          ret2 = new Promise2(INTERNAL);
          handle = setTimeout(function() {
            ret2._fulfill();
          }, +ms);
          if (debug.cancellation()) {
            ret2._setOnCancel(new HandleWrapper(handle));
          }
          ret2._captureStackTrace();
        }
        ret2._setAsyncGuaranteed();
        return ret2;
      };
      Promise2.prototype.delay = function(ms) {
        return delay2(ms, this);
      };
      var afterTimeout = function(promise, message, parent) {
        var err;
        if (typeof message !== "string") {
          if (message instanceof Error) {
            err = message;
          } else {
            err = new TimeoutError("operation timed out");
          }
        } else {
          err = new TimeoutError(message);
        }
        util.markAsOriginatingFromRejection(err);
        promise._attachExtraTrace(err);
        promise._reject(err);
        if (parent != null) {
          parent.cancel();
        }
      };
      function successClear(value) {
        clearTimeout(this.handle);
        return value;
      }
      function failureClear(reason) {
        clearTimeout(this.handle);
        throw reason;
      }
      Promise2.prototype.timeout = function(ms, message) {
        ms = +ms;
        var ret2, parent;
        var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
          if (ret2.isPending()) {
            afterTimeout(ret2, message, parent);
          }
        }, ms));
        if (debug.cancellation()) {
          parent = this.then();
          ret2 = parent._then(
            successClear,
            failureClear,
            void 0,
            handleWrapper,
            void 0
          );
          ret2._setOnCancel(handleWrapper);
        } else {
          ret2 = this._then(
            successClear,
            failureClear,
            void 0,
            handleWrapper,
            void 0
          );
        }
        return ret2;
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/generators.js
var require_generators = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/generators.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug) {
      var errors = require_errors();
      var TypeError2 = errors.TypeError;
      var util = require_util();
      var errorObj2 = util.errorObj;
      var tryCatch2 = util.tryCatch;
      var yieldHandlers = [];
      function promiseFromYieldHandler(value, yieldHandlers2, traceParent) {
        for (var i = 0; i < yieldHandlers2.length; ++i) {
          traceParent._pushContext();
          var result = tryCatch2(yieldHandlers2[i])(value);
          traceParent._popContext();
          if (result === errorObj2) {
            traceParent._pushContext();
            var ret2 = Promise2.reject(errorObj2.e);
            traceParent._popContext();
            return ret2;
          }
          var maybePromise = tryConvertToPromise(result, traceParent);
          if (maybePromise instanceof Promise2)
            return maybePromise;
        }
        return null;
      }
      function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
        if (debug.cancellation()) {
          var internal = new Promise2(INTERNAL);
          var _finallyPromise = this._finallyPromise = new Promise2(INTERNAL);
          this._promise = internal.lastly(function() {
            return _finallyPromise;
          });
          internal._captureStackTrace();
          internal._setOnCancel(this);
        } else {
          var promise = this._promise = new Promise2(INTERNAL);
          promise._captureStackTrace();
        }
        this._stack = stack;
        this._generatorFunction = generatorFunction;
        this._receiver = receiver;
        this._generator = void 0;
        this._yieldHandlers = typeof yieldHandler === "function" ? [yieldHandler].concat(yieldHandlers) : yieldHandlers;
        this._yieldedPromise = null;
        this._cancellationPhase = false;
      }
      util.inherits(PromiseSpawn, Proxyable);
      PromiseSpawn.prototype._isResolved = function() {
        return this._promise === null;
      };
      PromiseSpawn.prototype._cleanup = function() {
        this._promise = this._generator = null;
        if (debug.cancellation() && this._finallyPromise !== null) {
          this._finallyPromise._fulfill();
          this._finallyPromise = null;
        }
      };
      PromiseSpawn.prototype._promiseCancelled = function() {
        if (this._isResolved())
          return;
        var implementsReturn = typeof this._generator["return"] !== "undefined";
        var result;
        if (!implementsReturn) {
          var reason = new Promise2.CancellationError(
            "generator .return() sentinel"
          );
          Promise2.coroutine.returnSentinel = reason;
          this._promise._attachExtraTrace(reason);
          this._promise._pushContext();
          result = tryCatch2(this._generator["throw"]).call(
            this._generator,
            reason
          );
          this._promise._popContext();
        } else {
          this._promise._pushContext();
          result = tryCatch2(this._generator["return"]).call(
            this._generator,
            void 0
          );
          this._promise._popContext();
        }
        this._cancellationPhase = true;
        this._yieldedPromise = null;
        this._continue(result);
      };
      PromiseSpawn.prototype._promiseFulfilled = function(value) {
        this._yieldedPromise = null;
        this._promise._pushContext();
        var result = tryCatch2(this._generator.next).call(this._generator, value);
        this._promise._popContext();
        this._continue(result);
      };
      PromiseSpawn.prototype._promiseRejected = function(reason) {
        this._yieldedPromise = null;
        this._promise._attachExtraTrace(reason);
        this._promise._pushContext();
        var result = tryCatch2(this._generator["throw"]).call(this._generator, reason);
        this._promise._popContext();
        this._continue(result);
      };
      PromiseSpawn.prototype._resultCancelled = function() {
        if (this._yieldedPromise instanceof Promise2) {
          var promise = this._yieldedPromise;
          this._yieldedPromise = null;
          promise.cancel();
        }
      };
      PromiseSpawn.prototype.promise = function() {
        return this._promise;
      };
      PromiseSpawn.prototype._run = function() {
        this._generator = this._generatorFunction.call(this._receiver);
        this._receiver = this._generatorFunction = void 0;
        this._promiseFulfilled(void 0);
      };
      PromiseSpawn.prototype._continue = function(result) {
        var promise = this._promise;
        if (result === errorObj2) {
          this._cleanup();
          if (this._cancellationPhase) {
            return promise.cancel();
          } else {
            return promise._rejectCallback(result.e, false);
          }
        }
        var value = result.value;
        if (result.done === true) {
          this._cleanup();
          if (this._cancellationPhase) {
            return promise.cancel();
          } else {
            return promise._resolveCallback(value);
          }
        } else {
          var maybePromise = tryConvertToPromise(value, this._promise);
          if (!(maybePromise instanceof Promise2)) {
            maybePromise = promiseFromYieldHandler(
              maybePromise,
              this._yieldHandlers,
              this._promise
            );
            if (maybePromise === null) {
              this._promiseRejected(
                new TypeError2(
                  "A value %s was yielded that could not be treated as a promise\n\n    See http://goo.gl/MqrFmX\n\n".replace("%s", value) + "From coroutine:\n" + this._stack.split("\n").slice(1, -7).join("\n")
                )
              );
              return;
            }
          }
          maybePromise = maybePromise._target();
          var bitField = maybePromise._bitField;
          ;
          if ((bitField & 50397184) === 0) {
            this._yieldedPromise = maybePromise;
            maybePromise._proxy(this, null);
          } else if ((bitField & 33554432) !== 0) {
            Promise2._async.invoke(
              this._promiseFulfilled,
              this,
              maybePromise._value()
            );
          } else if ((bitField & 16777216) !== 0) {
            Promise2._async.invoke(
              this._promiseRejected,
              this,
              maybePromise._reason()
            );
          } else {
            this._promiseCancelled();
          }
        }
      };
      Promise2.coroutine = function(generatorFunction, options) {
        if (typeof generatorFunction !== "function") {
          throw new TypeError2("generatorFunction must be a function\n\n    See http://goo.gl/MqrFmX\n");
        }
        var yieldHandler = Object(options).yieldHandler;
        var PromiseSpawn$ = PromiseSpawn;
        var stack = new Error().stack;
        return function() {
          var generator = generatorFunction.apply(this, arguments);
          var spawn = new PromiseSpawn$(
            void 0,
            void 0,
            yieldHandler,
            stack
          );
          var ret2 = spawn.promise();
          spawn._generator = generator;
          spawn._promiseFulfilled(void 0);
          return ret2;
        };
      };
      Promise2.coroutine.addYieldHandler = function(fn) {
        if (typeof fn !== "function") {
          throw new TypeError2("expecting a function but got " + util.classString(fn));
        }
        yieldHandlers.push(fn);
      };
      Promise2.spawn = function(generatorFunction) {
        debug.deprecated("Promise.spawn()", "Promise.coroutine()");
        if (typeof generatorFunction !== "function") {
          return apiRejection("generatorFunction must be a function\n\n    See http://goo.gl/MqrFmX\n");
        }
        var spawn = new PromiseSpawn(generatorFunction, this);
        var ret2 = spawn.promise();
        spawn._run(Promise2.spawn);
        return ret2;
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/nodeify.js
var require_nodeify = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/nodeify.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2) {
      var util = require_util();
      var async = Promise2._async;
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      function spreadAdapter(val, nodeback) {
        var promise = this;
        if (!util.isArray(val))
          return successAdapter.call(promise, val, nodeback);
        var ret2 = tryCatch2(nodeback).apply(promise._boundValue(), [null].concat(val));
        if (ret2 === errorObj2) {
          async.throwLater(ret2.e);
        }
      }
      function successAdapter(val, nodeback) {
        var promise = this;
        var receiver = promise._boundValue();
        var ret2 = val === void 0 ? tryCatch2(nodeback).call(receiver, null) : tryCatch2(nodeback).call(receiver, null, val);
        if (ret2 === errorObj2) {
          async.throwLater(ret2.e);
        }
      }
      function errorAdapter(reason, nodeback) {
        var promise = this;
        if (!reason) {
          var newReason = new Error(reason + "");
          newReason.cause = reason;
          reason = newReason;
        }
        var ret2 = tryCatch2(nodeback).call(promise._boundValue(), reason);
        if (ret2 === errorObj2) {
          async.throwLater(ret2.e);
        }
      }
      Promise2.prototype.asCallback = Promise2.prototype.nodeify = function(nodeback, options) {
        if (typeof nodeback == "function") {
          var adapter = successAdapter;
          if (options !== void 0 && Object(options).spread) {
            adapter = spreadAdapter;
          }
          this._then(
            adapter,
            errorAdapter,
            void 0,
            this,
            nodeback
          );
        }
        return this;
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/promisify.js
var require_promisify = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/promisify.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, INTERNAL) {
      var THIS = {};
      var util = require_util();
      var nodebackForPromise = require_nodeback();
      var withAppended2 = util.withAppended;
      var maybeWrapAsError2 = util.maybeWrapAsError;
      var canEvaluate2 = util.canEvaluate;
      var TypeError2 = require_errors().TypeError;
      var defaultSuffix = "Async";
      var defaultPromisified = { __isPromisified__: true };
      var noCopyProps = [
        "arity",
        "length",
        "name",
        "arguments",
        "caller",
        "callee",
        "prototype",
        "__isPromisified__"
      ];
      var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");
      var defaultFilter = function(name) {
        return util.isIdentifier(name) && name.charAt(0) !== "_" && name !== "constructor";
      };
      function propsFilter(key) {
        return !noCopyPropsPattern.test(key);
      }
      function isPromisified(fn) {
        try {
          return fn.__isPromisified__ === true;
        } catch (e) {
          return false;
        }
      }
      function hasPromisified(obj2, key, suffix) {
        var val = util.getDataPropertyOrDefault(
          obj2,
          key + suffix,
          defaultPromisified
        );
        return val ? isPromisified(val) : false;
      }
      function checkValid(ret2, suffix, suffixRegexp) {
        for (var i = 0; i < ret2.length; i += 2) {
          var key = ret2[i];
          if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret2.length; j += 2) {
              if (ret2[j] === keyWithoutAsyncSuffix) {
                throw new TypeError2("Cannot promisify an API that has normal methods with '%s'-suffix\n\n    See http://goo.gl/MqrFmX\n".replace("%s", suffix));
              }
            }
          }
        }
      }
      function promisifiableMethods(obj2, suffix, suffixRegexp, filter) {
        var keys = util.inheritedDataKeys(obj2);
        var ret2 = [];
        for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          var value = obj2[key];
          var passesDefaultFilter = filter === defaultFilter ? true : defaultFilter(key, value, obj2);
          if (typeof value === "function" && !isPromisified(value) && !hasPromisified(obj2, key, suffix) && filter(key, value, obj2, passesDefaultFilter)) {
            ret2.push(key, value);
          }
        }
        checkValid(ret2, suffix, suffixRegexp);
        return ret2;
      }
      var escapeIdentRegex = function(str) {
        return str.replace(/([$])/, "\\$");
      };
      var makeNodePromisifiedEval;
      if (true) {
        var switchCaseArgumentOrder = function(likelyArgumentCount) {
          var ret2 = [likelyArgumentCount];
          var min = Math.max(0, likelyArgumentCount - 1 - 3);
          for (var i = likelyArgumentCount - 1; i >= min; --i) {
            ret2.push(i);
          }
          for (var i = likelyArgumentCount + 1; i <= 3; ++i) {
            ret2.push(i);
          }
          return ret2;
        };
        var argumentSequence = function(argumentCount) {
          return util.filledRange(argumentCount, "_arg", "");
        };
        var parameterDeclaration = function(parameterCount2) {
          return util.filledRange(
            Math.max(parameterCount2, 3),
            "_arg",
            ""
          );
        };
        var parameterCount = function(fn) {
          if (typeof fn.length === "number") {
            return Math.max(Math.min(fn.length, 1023 + 1), 0);
          }
          return 0;
        };
        makeNodePromisifiedEval = function(callback, receiver, originalName, fn, _, multiArgs) {
          var newParameterCount = Math.max(0, parameterCount(fn) - 1);
          var argumentOrder = switchCaseArgumentOrder(newParameterCount);
          var shouldProxyThis = typeof callback === "string" || receiver === THIS;
          function generateCallForArgumentCount(count) {
            var args = argumentSequence(count).join(", ");
            var comma = count > 0 ? ", " : "";
            var ret2;
            if (shouldProxyThis) {
              ret2 = "ret = callback.call(this, {{args}}, nodeback); break;\n";
            } else {
              ret2 = receiver === void 0 ? "ret = callback({{args}}, nodeback); break;\n" : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
            }
            return ret2.replace("{{args}}", args).replace(", ", comma);
          }
          function generateArgumentSwitchCase() {
            var ret2 = "";
            for (var i = 0; i < argumentOrder.length; ++i) {
              ret2 += "case " + argumentOrder[i] + ":" + generateCallForArgumentCount(argumentOrder[i]);
            }
            ret2 += "                                                             \n        default:                                                             \n            var args = new Array(len + 1);                                   \n            var i = 0;                                                       \n            for (var i = 0; i < len; ++i) {                                  \n               args[i] = arguments[i];                                       \n            }                                                                \n            args[i] = nodeback;                                              \n            [CodeForCall]                                                    \n            break;                                                           \n        ".replace("[CodeForCall]", shouldProxyThis ? "ret = callback.apply(this, args);\n" : "ret = callback.apply(receiver, args);\n");
            return ret2;
          }
          var getFunctionCode = typeof callback === "string" ? "this != null ? this['" + callback + "'] : fn" : "fn";
          var body = "'use strict';                                                \n        var ret = function (Parameters) {                                    \n            'use strict';                                                    \n            var len = arguments.length;                                      \n            var promise = new Promise(INTERNAL);                             \n            promise._captureStackTrace();                                    \n            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n            var ret;                                                         \n            var callback = tryCatch([GetFunctionCode]);                      \n            switch(len) {                                                    \n                [CodeForSwitchCase]                                          \n            }                                                                \n            if (ret === errorObj) {                                          \n                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n            }                                                                \n            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n            return promise;                                                  \n        };                                                                   \n        notEnumerableProp(ret, '__isPromisified__', true);                   \n        return ret;                                                          \n    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase()).replace("[GetFunctionCode]", getFunctionCode);
          body = body.replace("Parameters", parameterDeclaration(newParameterCount));
          return new Function(
            "Promise",
            "fn",
            "receiver",
            "withAppended",
            "maybeWrapAsError",
            "nodebackForPromise",
            "tryCatch",
            "errorObj",
            "notEnumerableProp",
            "INTERNAL",
            body
          )(
            Promise2,
            fn,
            receiver,
            withAppended2,
            maybeWrapAsError2,
            nodebackForPromise,
            util.tryCatch,
            util.errorObj,
            util.notEnumerableProp,
            INTERNAL
          );
        };
      }
      function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
        var defaultThis = function() {
          return this;
        }();
        var method = callback;
        if (typeof method === "string") {
          callback = fn;
        }
        function promisified() {
          var _receiver = receiver;
          if (receiver === THIS)
            _receiver = this;
          var promise = new Promise2(INTERNAL);
          promise._captureStackTrace();
          var cb = typeof method === "string" && this !== defaultThis ? this[method] : callback;
          var fn2 = nodebackForPromise(promise, multiArgs);
          try {
            cb.apply(_receiver, withAppended2(arguments, fn2));
          } catch (e) {
            promise._rejectCallback(maybeWrapAsError2(e), true, true);
          }
          if (!promise._isFateSealed())
            promise._setAsyncGuaranteed();
          return promise;
        }
        util.notEnumerableProp(promisified, "__isPromisified__", true);
        return promisified;
      }
      var makeNodePromisified = canEvaluate2 ? makeNodePromisifiedEval : makeNodePromisifiedClosure;
      function promisifyAll(obj2, suffix, filter, promisifier, multiArgs) {
        var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
        var methods = promisifiableMethods(obj2, suffix, suffixRegexp, filter);
        for (var i = 0, len = methods.length; i < len; i += 2) {
          var key = methods[i];
          var fn = methods[i + 1];
          var promisifiedKey = key + suffix;
          if (promisifier === makeNodePromisified) {
            obj2[promisifiedKey] = makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
          } else {
            var promisified = promisifier(fn, function() {
              return makeNodePromisified(
                key,
                THIS,
                key,
                fn,
                suffix,
                multiArgs
              );
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj2[promisifiedKey] = promisified;
          }
        }
        util.toFastProperties(obj2);
        return obj2;
      }
      function promisify(callback, receiver, multiArgs) {
        return makeNodePromisified(
          callback,
          receiver,
          void 0,
          callback,
          null,
          multiArgs
        );
      }
      Promise2.promisify = function(fn, options) {
        if (typeof fn !== "function") {
          throw new TypeError2("expecting a function but got " + util.classString(fn));
        }
        if (isPromisified(fn)) {
          return fn;
        }
        options = Object(options);
        var receiver = options.context === void 0 ? THIS : options.context;
        var multiArgs = !!options.multiArgs;
        var ret2 = promisify(fn, receiver, multiArgs);
        util.copyDescriptors(fn, ret2, propsFilter);
        return ret2;
      };
      Promise2.promisifyAll = function(target, options) {
        if (typeof target !== "function" && typeof target !== "object") {
          throw new TypeError2("the target of promisifyAll must be an object or a function\n\n    See http://goo.gl/MqrFmX\n");
        }
        options = Object(options);
        var multiArgs = !!options.multiArgs;
        var suffix = options.suffix;
        if (typeof suffix !== "string")
          suffix = defaultSuffix;
        var filter = options.filter;
        if (typeof filter !== "function")
          filter = defaultFilter;
        var promisifier = options.promisifier;
        if (typeof promisifier !== "function")
          promisifier = makeNodePromisified;
        if (!util.isIdentifier(suffix)) {
          throw new RangeError("suffix must be a valid identifier\n\n    See http://goo.gl/MqrFmX\n");
        }
        var keys = util.inheritedDataKeys(target);
        for (var i = 0; i < keys.length; ++i) {
          var value = target[keys[i]];
          if (keys[i] !== "constructor" && util.isClass(value)) {
            promisifyAll(
              value.prototype,
              suffix,
              filter,
              promisifier,
              multiArgs
            );
            promisifyAll(value, suffix, filter, promisifier, multiArgs);
          }
        }
        return promisifyAll(target, suffix, filter, promisifier, multiArgs);
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/props.js
var require_props = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/props.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, PromiseArray, tryConvertToPromise, apiRejection) {
      var util = require_util();
      var isObject2 = util.isObject;
      var es52 = require_es5();
      var Es6Map;
      if (typeof Map === "function")
        Es6Map = Map;
      var mapToEntries = function() {
        var index = 0;
        var size = 0;
        function extractEntry(value, key) {
          this[index] = value;
          this[index + size] = key;
          index++;
        }
        return function mapToEntries2(map) {
          size = map.size;
          index = 0;
          var ret2 = new Array(map.size * 2);
          map.forEach(extractEntry, ret2);
          return ret2;
        };
      }();
      var entriesToMap = function(entries) {
        var ret2 = new Es6Map();
        var length = entries.length / 2 | 0;
        for (var i = 0; i < length; ++i) {
          var key = entries[length + i];
          var value = entries[i];
          ret2.set(key, value);
        }
        return ret2;
      };
      function PropertiesPromiseArray(obj2) {
        var isMap = false;
        var entries;
        if (Es6Map !== void 0 && obj2 instanceof Es6Map) {
          entries = mapToEntries(obj2);
          isMap = true;
        } else {
          var keys = es52.keys(obj2);
          var len = keys.length;
          entries = new Array(len * 2);
          for (var i = 0; i < len; ++i) {
            var key = keys[i];
            entries[i] = obj2[key];
            entries[i + len] = key;
          }
        }
        this.constructor$(entries);
        this._isMap = isMap;
        this._init$(void 0, -3);
      }
      util.inherits(PropertiesPromiseArray, PromiseArray);
      PropertiesPromiseArray.prototype._init = function() {
      };
      PropertiesPromiseArray.prototype._promiseFulfilled = function(value, index) {
        this._values[index] = value;
        var totalResolved = ++this._totalResolved;
        if (totalResolved >= this._length) {
          var val;
          if (this._isMap) {
            val = entriesToMap(this._values);
          } else {
            val = {};
            var keyOffset = this.length();
            for (var i = 0, len = this.length(); i < len; ++i) {
              val[this._values[i + keyOffset]] = this._values[i];
            }
          }
          this._resolve(val);
          return true;
        }
        return false;
      };
      PropertiesPromiseArray.prototype.shouldCopyValues = function() {
        return false;
      };
      PropertiesPromiseArray.prototype.getActualLength = function(len) {
        return len >> 1;
      };
      function props(promises) {
        var ret2;
        var castValue = tryConvertToPromise(promises);
        if (!isObject2(castValue)) {
          return apiRejection("cannot await properties of a non-object\n\n    See http://goo.gl/MqrFmX\n");
        } else if (castValue instanceof Promise2) {
          ret2 = castValue._then(
            Promise2.props,
            void 0,
            void 0,
            void 0,
            void 0
          );
        } else {
          ret2 = new PropertiesPromiseArray(castValue).promise();
        }
        if (castValue instanceof Promise2) {
          ret2._propagateFrom(castValue, 2);
        }
        return ret2;
      }
      Promise2.prototype.props = function() {
        return props(this);
      };
      Promise2.props = function(promises) {
        return props(promises);
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/race.js
var require_race = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/race.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, INTERNAL, tryConvertToPromise, apiRejection) {
      var util = require_util();
      var raceLater = function(promise) {
        return promise.then(function(array) {
          return race(array, promise);
        });
      };
      function race(promises, parent) {
        var maybePromise = tryConvertToPromise(promises);
        if (maybePromise instanceof Promise2) {
          return raceLater(maybePromise);
        } else {
          promises = util.asArray(promises);
          if (promises === null)
            return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
        }
        var ret2 = new Promise2(INTERNAL);
        if (parent !== void 0) {
          ret2._propagateFrom(parent, 3);
        }
        var fulfill = ret2._fulfill;
        var reject = ret2._reject;
        for (var i = 0, len = promises.length; i < len; ++i) {
          var val = promises[i];
          if (val === void 0 && !(i in promises)) {
            continue;
          }
          Promise2.cast(val)._then(fulfill, reject, void 0, ret2, null);
        }
        return ret2;
      }
      Promise2.race = function(promises) {
        return race(promises, void 0);
      };
      Promise2.prototype.race = function() {
        return race(this, void 0);
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/reduce.js
var require_reduce = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/reduce.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug) {
      var getDomain = Promise2._getDomain;
      var util = require_util();
      var tryCatch2 = util.tryCatch;
      function ReductionPromiseArray(promises, fn, initialValue, _each) {
        this.constructor$(promises);
        var domain = getDomain();
        this._fn = domain === null ? fn : util.domainBind(domain, fn);
        if (initialValue !== void 0) {
          initialValue = Promise2.resolve(initialValue);
          initialValue._attachCancellationCallback(this);
        }
        this._initialValue = initialValue;
        this._currentCancellable = null;
        if (_each === INTERNAL) {
          this._eachValues = Array(this._length);
        } else if (_each === 0) {
          this._eachValues = null;
        } else {
          this._eachValues = void 0;
        }
        this._promise._captureStackTrace();
        this._init$(void 0, -5);
      }
      util.inherits(ReductionPromiseArray, PromiseArray);
      ReductionPromiseArray.prototype._gotAccum = function(accum) {
        if (this._eachValues !== void 0 && this._eachValues !== null && accum !== INTERNAL) {
          this._eachValues.push(accum);
        }
      };
      ReductionPromiseArray.prototype._eachComplete = function(value) {
        if (this._eachValues !== null) {
          this._eachValues.push(value);
        }
        return this._eachValues;
      };
      ReductionPromiseArray.prototype._init = function() {
      };
      ReductionPromiseArray.prototype._resolveEmptyArray = function() {
        this._resolve(this._eachValues !== void 0 ? this._eachValues : this._initialValue);
      };
      ReductionPromiseArray.prototype.shouldCopyValues = function() {
        return false;
      };
      ReductionPromiseArray.prototype._resolve = function(value) {
        this._promise._resolveCallback(value);
        this._values = null;
      };
      ReductionPromiseArray.prototype._resultCancelled = function(sender) {
        if (sender === this._initialValue)
          return this._cancel();
        if (this._isResolved())
          return;
        this._resultCancelled$();
        if (this._currentCancellable instanceof Promise2) {
          this._currentCancellable.cancel();
        }
        if (this._initialValue instanceof Promise2) {
          this._initialValue.cancel();
        }
      };
      ReductionPromiseArray.prototype._iterate = function(values) {
        this._values = values;
        var value;
        var i;
        var length = values.length;
        if (this._initialValue !== void 0) {
          value = this._initialValue;
          i = 0;
        } else {
          value = Promise2.resolve(values[0]);
          i = 1;
        }
        this._currentCancellable = value;
        if (!value.isRejected()) {
          for (; i < length; ++i) {
            var ctx = {
              accum: null,
              value: values[i],
              index: i,
              length,
              array: this
            };
            value = value._then(gotAccum, void 0, void 0, ctx, void 0);
          }
        }
        if (this._eachValues !== void 0) {
          value = value._then(this._eachComplete, void 0, void 0, this, void 0);
        }
        value._then(completed, completed, void 0, value, this);
      };
      Promise2.prototype.reduce = function(fn, initialValue) {
        return reduce(this, fn, initialValue, null);
      };
      Promise2.reduce = function(promises, fn, initialValue, _each) {
        return reduce(promises, fn, initialValue, _each);
      };
      function completed(valueOrReason, array) {
        if (this.isFulfilled()) {
          array._resolve(valueOrReason);
        } else {
          array._reject(valueOrReason);
        }
      }
      function reduce(promises, fn, initialValue, _each) {
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
        return array.promise();
      }
      function gotAccum(accum) {
        this.accum = accum;
        this.array._gotAccum(accum);
        var value = tryConvertToPromise(this.value, this.array._promise);
        if (value instanceof Promise2) {
          this.array._currentCancellable = value;
          return value._then(gotValue, void 0, void 0, this, void 0);
        } else {
          return gotValue.call(this, value);
        }
      }
      function gotValue(value) {
        var array = this.array;
        var promise = array._promise;
        var fn = tryCatch2(array._fn);
        promise._pushContext();
        var ret2;
        if (array._eachValues !== void 0) {
          ret2 = fn.call(promise._boundValue(), value, this.index, this.length);
        } else {
          ret2 = fn.call(
            promise._boundValue(),
            this.accum,
            value,
            this.index,
            this.length
          );
        }
        if (ret2 instanceof Promise2) {
          array._currentCancellable = ret2;
        }
        var promiseCreated = promise._popContext();
        debug.checkForgottenReturns(
          ret2,
          promiseCreated,
          array._eachValues !== void 0 ? "Promise.each" : "Promise.reduce",
          promise
        );
        return ret2;
      }
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/settle.js
var require_settle = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/settle.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, PromiseArray, debug) {
      var PromiseInspection = Promise2.PromiseInspection;
      var util = require_util();
      function SettledPromiseArray(values) {
        this.constructor$(values);
      }
      util.inherits(SettledPromiseArray, PromiseArray);
      SettledPromiseArray.prototype._promiseResolved = function(index, inspection) {
        this._values[index] = inspection;
        var totalResolved = ++this._totalResolved;
        if (totalResolved >= this._length) {
          this._resolve(this._values);
          return true;
        }
        return false;
      };
      SettledPromiseArray.prototype._promiseFulfilled = function(value, index) {
        var ret2 = new PromiseInspection();
        ret2._bitField = 33554432;
        ret2._settledValueField = value;
        return this._promiseResolved(index, ret2);
      };
      SettledPromiseArray.prototype._promiseRejected = function(reason, index) {
        var ret2 = new PromiseInspection();
        ret2._bitField = 16777216;
        ret2._settledValueField = reason;
        return this._promiseResolved(index, ret2);
      };
      Promise2.settle = function(promises) {
        debug.deprecated(".settle()", ".reflect()");
        return new SettledPromiseArray(promises).promise();
      };
      Promise2.prototype.settle = function() {
        return Promise2.settle(this);
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/some.js
var require_some = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/some.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, PromiseArray, apiRejection) {
      var util = require_util();
      var RangeError2 = require_errors().RangeError;
      var AggregateError = require_errors().AggregateError;
      var isArray = util.isArray;
      var CANCELLATION = {};
      function SomePromiseArray(values) {
        this.constructor$(values);
        this._howMany = 0;
        this._unwrap = false;
        this._initialized = false;
      }
      util.inherits(SomePromiseArray, PromiseArray);
      SomePromiseArray.prototype._init = function() {
        if (!this._initialized) {
          return;
        }
        if (this._howMany === 0) {
          this._resolve([]);
          return;
        }
        this._init$(void 0, -5);
        var isArrayResolved = isArray(this._values);
        if (!this._isResolved() && isArrayResolved && this._howMany > this._canPossiblyFulfill()) {
          this._reject(this._getRangeError(this.length()));
        }
      };
      SomePromiseArray.prototype.init = function() {
        this._initialized = true;
        this._init();
      };
      SomePromiseArray.prototype.setUnwrap = function() {
        this._unwrap = true;
      };
      SomePromiseArray.prototype.howMany = function() {
        return this._howMany;
      };
      SomePromiseArray.prototype.setHowMany = function(count) {
        this._howMany = count;
      };
      SomePromiseArray.prototype._promiseFulfilled = function(value) {
        this._addFulfilled(value);
        if (this._fulfilled() === this.howMany()) {
          this._values.length = this.howMany();
          if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
          } else {
            this._resolve(this._values);
          }
          return true;
        }
        return false;
      };
      SomePromiseArray.prototype._promiseRejected = function(reason) {
        this._addRejected(reason);
        return this._checkOutcome();
      };
      SomePromiseArray.prototype._promiseCancelled = function() {
        if (this._values instanceof Promise2 || this._values == null) {
          return this._cancel();
        }
        this._addRejected(CANCELLATION);
        return this._checkOutcome();
      };
      SomePromiseArray.prototype._checkOutcome = function() {
        if (this.howMany() > this._canPossiblyFulfill()) {
          var e = new AggregateError();
          for (var i = this.length(); i < this._values.length; ++i) {
            if (this._values[i] !== CANCELLATION) {
              e.push(this._values[i]);
            }
          }
          if (e.length > 0) {
            this._reject(e);
          } else {
            this._cancel();
          }
          return true;
        }
        return false;
      };
      SomePromiseArray.prototype._fulfilled = function() {
        return this._totalResolved;
      };
      SomePromiseArray.prototype._rejected = function() {
        return this._values.length - this.length();
      };
      SomePromiseArray.prototype._addRejected = function(reason) {
        this._values.push(reason);
      };
      SomePromiseArray.prototype._addFulfilled = function(value) {
        this._values[this._totalResolved++] = value;
      };
      SomePromiseArray.prototype._canPossiblyFulfill = function() {
        return this.length() - this._rejected();
      };
      SomePromiseArray.prototype._getRangeError = function(count) {
        var message = "Input array must contain at least " + this._howMany + " items but contains only " + count + " items";
        return new RangeError2(message);
      };
      SomePromiseArray.prototype._resolveEmptyArray = function() {
        this._reject(this._getRangeError(0));
      };
      function some(promises, howMany) {
        if ((howMany | 0) !== howMany || howMany < 0) {
          return apiRejection("expecting a positive integer\n\n    See http://goo.gl/MqrFmX\n");
        }
        var ret2 = new SomePromiseArray(promises);
        var promise = ret2.promise();
        ret2.setHowMany(howMany);
        ret2.init();
        return promise;
      }
      Promise2.some = function(promises, howMany) {
        return some(promises, howMany);
      };
      Promise2.prototype.some = function(howMany) {
        return some(this, howMany);
      };
      Promise2._SomePromiseArray = SomePromiseArray;
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/filter.js
var require_filter = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/filter.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, INTERNAL) {
      var PromiseMap = Promise2.map;
      Promise2.prototype.filter = function(fn, options) {
        return PromiseMap(this, fn, options, INTERNAL);
      };
      Promise2.filter = function(promises, fn, options) {
        return PromiseMap(promises, fn, options, INTERNAL);
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/each.js
var require_each = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/each.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2, INTERNAL) {
      var PromiseReduce = Promise2.reduce;
      var PromiseAll = Promise2.all;
      function promiseAllThis() {
        return PromiseAll(this);
      }
      function PromiseMapSeries(promises, fn) {
        return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
      }
      Promise2.prototype.each = function(fn) {
        return PromiseReduce(this, fn, INTERNAL, 0)._then(promiseAllThis, void 0, void 0, this, void 0);
      };
      Promise2.prototype.mapSeries = function(fn) {
        return PromiseReduce(this, fn, INTERNAL, INTERNAL);
      };
      Promise2.each = function(promises, fn) {
        return PromiseReduce(promises, fn, INTERNAL, 0)._then(promiseAllThis, void 0, void 0, promises, void 0);
      };
      Promise2.mapSeries = PromiseMapSeries;
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/any.js
var require_any = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/any.js"(exports2, module2) {
    "use strict";
    module2.exports = function(Promise2) {
      var SomePromiseArray = Promise2._SomePromiseArray;
      function any(promises) {
        var ret2 = new SomePromiseArray(promises);
        var promise = ret2.promise();
        ret2.setHowMany(1);
        ret2.setUnwrap();
        ret2.init();
        return promise;
      }
      Promise2.any = function(promises) {
        return any(promises);
      };
      Promise2.prototype.any = function() {
        return any(this);
      };
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/promise.js
var require_promise = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/promise.js"(exports2, module2) {
    "use strict";
    module2.exports = function() {
      var makeSelfResolutionError = function() {
        return new TypeError2("circular promise resolution chain\n\n    See http://goo.gl/MqrFmX\n");
      };
      var reflectHandler = function() {
        return new Promise2.PromiseInspection(this._target());
      };
      var apiRejection = function(msg) {
        return Promise2.reject(new TypeError2(msg));
      };
      function Proxyable() {
      }
      var UNDEFINED_BINDING = {};
      var util = require_util();
      var getDomain;
      if (util.isNode) {
        getDomain = function() {
          var ret2 = process.domain;
          if (ret2 === void 0)
            ret2 = null;
          return ret2;
        };
      } else {
        getDomain = function() {
          return null;
        };
      }
      util.notEnumerableProp(Promise2, "_getDomain", getDomain);
      var es52 = require_es5();
      var Async = require_async();
      var async = new Async();
      es52.defineProperty(Promise2, "_async", { value: async });
      var errors = require_errors();
      var TypeError2 = Promise2.TypeError = errors.TypeError;
      Promise2.RangeError = errors.RangeError;
      var CancellationError = Promise2.CancellationError = errors.CancellationError;
      Promise2.TimeoutError = errors.TimeoutError;
      Promise2.OperationalError = errors.OperationalError;
      Promise2.RejectionError = errors.OperationalError;
      Promise2.AggregateError = errors.AggregateError;
      var INTERNAL = function() {
      };
      var APPLY = {};
      var NEXT_FILTER = {};
      var tryConvertToPromise = require_thenables()(Promise2, INTERNAL);
      var PromiseArray = require_promise_array()(
        Promise2,
        INTERNAL,
        tryConvertToPromise,
        apiRejection,
        Proxyable
      );
      var Context = require_context()(Promise2);
      var createContext = Context.create;
      var debug = require_debuggability()(Promise2, Context);
      var CapturedTrace = debug.CapturedTrace;
      var PassThroughHandlerContext = require_finally()(Promise2, tryConvertToPromise);
      var catchFilter = require_catch_filter()(NEXT_FILTER);
      var nodebackForPromise = require_nodeback();
      var errorObj2 = util.errorObj;
      var tryCatch2 = util.tryCatch;
      function check(self2, executor) {
        if (typeof executor !== "function") {
          throw new TypeError2("expecting a function but got " + util.classString(executor));
        }
        if (self2.constructor !== Promise2) {
          throw new TypeError2("the promise constructor cannot be invoked directly\n\n    See http://goo.gl/MqrFmX\n");
        }
      }
      function Promise2(executor) {
        this._bitField = 0;
        this._fulfillmentHandler0 = void 0;
        this._rejectionHandler0 = void 0;
        this._promise0 = void 0;
        this._receiver0 = void 0;
        if (executor !== INTERNAL) {
          check(this, executor);
          this._resolveFromExecutor(executor);
        }
        this._promiseCreated();
        this._fireEvent("promiseCreated", this);
      }
      Promise2.prototype.toString = function() {
        return "[object Promise]";
      };
      Promise2.prototype.caught = Promise2.prototype["catch"] = function(fn) {
        var len = arguments.length;
        if (len > 1) {
          var catchInstances = new Array(len - 1), j = 0, i;
          for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
              catchInstances[j++] = item;
            } else {
              return apiRejection("expecting an object but got A catch statement predicate " + util.classString(item));
            }
          }
          catchInstances.length = j;
          fn = arguments[i];
          return this.then(void 0, catchFilter(catchInstances, fn, this));
        }
        return this.then(void 0, fn);
      };
      Promise2.prototype.reflect = function() {
        return this._then(
          reflectHandler,
          reflectHandler,
          void 0,
          this,
          void 0
        );
      };
      Promise2.prototype.then = function(didFulfill, didReject) {
        if (debug.warnings() && arguments.length > 0 && typeof didFulfill !== "function" && typeof didReject !== "function") {
          var msg = ".then() only accepts functions but was passed: " + util.classString(didFulfill);
          if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
          }
          this._warn(msg);
        }
        return this._then(didFulfill, didReject, void 0, void 0, void 0);
      };
      Promise2.prototype.done = function(didFulfill, didReject) {
        var promise = this._then(didFulfill, didReject, void 0, void 0, void 0);
        promise._setIsFinal();
      };
      Promise2.prototype.spread = function(fn) {
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        return this.all()._then(fn, void 0, void 0, APPLY, void 0);
      };
      Promise2.prototype.toJSON = function() {
        var ret2 = {
          isFulfilled: false,
          isRejected: false,
          fulfillmentValue: void 0,
          rejectionReason: void 0
        };
        if (this.isFulfilled()) {
          ret2.fulfillmentValue = this.value();
          ret2.isFulfilled = true;
        } else if (this.isRejected()) {
          ret2.rejectionReason = this.reason();
          ret2.isRejected = true;
        }
        return ret2;
      };
      Promise2.prototype.all = function() {
        if (arguments.length > 0) {
          this._warn(".all() was passed arguments but it does not take any");
        }
        return new PromiseArray(this).promise();
      };
      Promise2.prototype.error = function(fn) {
        return this.caught(util.originatesFromRejection, fn);
      };
      Promise2.getNewLibraryCopy = module2.exports;
      Promise2.is = function(val) {
        return val instanceof Promise2;
      };
      Promise2.fromNode = Promise2.fromCallback = function(fn) {
        var ret2 = new Promise2(INTERNAL);
        ret2._captureStackTrace();
        var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs : false;
        var result = tryCatch2(fn)(nodebackForPromise(ret2, multiArgs));
        if (result === errorObj2) {
          ret2._rejectCallback(result.e, true);
        }
        if (!ret2._isFateSealed())
          ret2._setAsyncGuaranteed();
        return ret2;
      };
      Promise2.all = function(promises) {
        return new PromiseArray(promises).promise();
      };
      Promise2.cast = function(obj2) {
        var ret2 = tryConvertToPromise(obj2);
        if (!(ret2 instanceof Promise2)) {
          ret2 = new Promise2(INTERNAL);
          ret2._captureStackTrace();
          ret2._setFulfilled();
          ret2._rejectionHandler0 = obj2;
        }
        return ret2;
      };
      Promise2.resolve = Promise2.fulfilled = Promise2.cast;
      Promise2.reject = Promise2.rejected = function(reason) {
        var ret2 = new Promise2(INTERNAL);
        ret2._captureStackTrace();
        ret2._rejectCallback(reason, true);
        return ret2;
      };
      Promise2.setScheduler = function(fn) {
        if (typeof fn !== "function") {
          throw new TypeError2("expecting a function but got " + util.classString(fn));
        }
        return async.setScheduler(fn);
      };
      Promise2.prototype._then = function(didFulfill, didReject, _, receiver, internalData) {
        var haveInternalData = internalData !== void 0;
        var promise = haveInternalData ? internalData : new Promise2(INTERNAL);
        var target = this._target();
        var bitField = target._bitField;
        if (!haveInternalData) {
          promise._propagateFrom(this, 3);
          promise._captureStackTrace();
          if (receiver === void 0 && (this._bitField & 2097152) !== 0) {
            if (!((bitField & 50397184) === 0)) {
              receiver = this._boundValue();
            } else {
              receiver = target === this ? void 0 : this._boundTo;
            }
          }
          this._fireEvent("promiseChained", this, promise);
        }
        var domain = getDomain();
        if (!((bitField & 50397184) === 0)) {
          var handler, value, settler = target._settlePromiseCtx;
          if ((bitField & 33554432) !== 0) {
            value = target._rejectionHandler0;
            handler = didFulfill;
          } else if ((bitField & 16777216) !== 0) {
            value = target._fulfillmentHandler0;
            handler = didReject;
            target._unsetRejectionIsUnhandled();
          } else {
            settler = target._settlePromiseLateCancellationObserver;
            value = new CancellationError("late cancellation observer");
            target._attachExtraTrace(value);
            handler = didReject;
          }
          async.invoke(settler, target, {
            handler: domain === null ? handler : typeof handler === "function" && util.domainBind(domain, handler),
            promise,
            receiver,
            value
          });
        } else {
          target._addCallbacks(didFulfill, didReject, promise, receiver, domain);
        }
        return promise;
      };
      Promise2.prototype._length = function() {
        return this._bitField & 65535;
      };
      Promise2.prototype._isFateSealed = function() {
        return (this._bitField & 117506048) !== 0;
      };
      Promise2.prototype._isFollowing = function() {
        return (this._bitField & 67108864) === 67108864;
      };
      Promise2.prototype._setLength = function(len) {
        this._bitField = this._bitField & -65536 | len & 65535;
      };
      Promise2.prototype._setFulfilled = function() {
        this._bitField = this._bitField | 33554432;
        this._fireEvent("promiseFulfilled", this);
      };
      Promise2.prototype._setRejected = function() {
        this._bitField = this._bitField | 16777216;
        this._fireEvent("promiseRejected", this);
      };
      Promise2.prototype._setFollowing = function() {
        this._bitField = this._bitField | 67108864;
        this._fireEvent("promiseResolved", this);
      };
      Promise2.prototype._setIsFinal = function() {
        this._bitField = this._bitField | 4194304;
      };
      Promise2.prototype._isFinal = function() {
        return (this._bitField & 4194304) > 0;
      };
      Promise2.prototype._unsetCancelled = function() {
        this._bitField = this._bitField & ~65536;
      };
      Promise2.prototype._setCancelled = function() {
        this._bitField = this._bitField | 65536;
        this._fireEvent("promiseCancelled", this);
      };
      Promise2.prototype._setWillBeCancelled = function() {
        this._bitField = this._bitField | 8388608;
      };
      Promise2.prototype._setAsyncGuaranteed = function() {
        if (async.hasCustomScheduler())
          return;
        this._bitField = this._bitField | 134217728;
      };
      Promise2.prototype._receiverAt = function(index) {
        var ret2 = index === 0 ? this._receiver0 : this[index * 4 - 4 + 3];
        if (ret2 === UNDEFINED_BINDING) {
          return void 0;
        } else if (ret2 === void 0 && this._isBound()) {
          return this._boundValue();
        }
        return ret2;
      };
      Promise2.prototype._promiseAt = function(index) {
        return this[index * 4 - 4 + 2];
      };
      Promise2.prototype._fulfillmentHandlerAt = function(index) {
        return this[index * 4 - 4 + 0];
      };
      Promise2.prototype._rejectionHandlerAt = function(index) {
        return this[index * 4 - 4 + 1];
      };
      Promise2.prototype._boundValue = function() {
      };
      Promise2.prototype._migrateCallback0 = function(follower) {
        var bitField = follower._bitField;
        var fulfill = follower._fulfillmentHandler0;
        var reject = follower._rejectionHandler0;
        var promise = follower._promise0;
        var receiver = follower._receiverAt(0);
        if (receiver === void 0)
          receiver = UNDEFINED_BINDING;
        this._addCallbacks(fulfill, reject, promise, receiver, null);
      };
      Promise2.prototype._migrateCallbackAt = function(follower, index) {
        var fulfill = follower._fulfillmentHandlerAt(index);
        var reject = follower._rejectionHandlerAt(index);
        var promise = follower._promiseAt(index);
        var receiver = follower._receiverAt(index);
        if (receiver === void 0)
          receiver = UNDEFINED_BINDING;
        this._addCallbacks(fulfill, reject, promise, receiver, null);
      };
      Promise2.prototype._addCallbacks = function(fulfill, reject, promise, receiver, domain) {
        var index = this._length();
        if (index >= 65535 - 4) {
          index = 0;
          this._setLength(0);
        }
        if (index === 0) {
          this._promise0 = promise;
          this._receiver0 = receiver;
          if (typeof fulfill === "function") {
            this._fulfillmentHandler0 = domain === null ? fulfill : util.domainBind(domain, fulfill);
          }
          if (typeof reject === "function") {
            this._rejectionHandler0 = domain === null ? reject : util.domainBind(domain, reject);
          }
        } else {
          var base = index * 4 - 4;
          this[base + 2] = promise;
          this[base + 3] = receiver;
          if (typeof fulfill === "function") {
            this[base + 0] = domain === null ? fulfill : util.domainBind(domain, fulfill);
          }
          if (typeof reject === "function") {
            this[base + 1] = domain === null ? reject : util.domainBind(domain, reject);
          }
        }
        this._setLength(index + 1);
        return index;
      };
      Promise2.prototype._proxy = function(proxyable, arg) {
        this._addCallbacks(void 0, void 0, arg, proxyable, null);
      };
      Promise2.prototype._resolveCallback = function(value, shouldBind) {
        if ((this._bitField & 117506048) !== 0)
          return;
        if (value === this)
          return this._rejectCallback(makeSelfResolutionError(), false);
        var maybePromise = tryConvertToPromise(value, this);
        if (!(maybePromise instanceof Promise2))
          return this._fulfill(value);
        if (shouldBind)
          this._propagateFrom(maybePromise, 2);
        var promise = maybePromise._target();
        if (promise === this) {
          this._reject(makeSelfResolutionError());
          return;
        }
        var bitField = promise._bitField;
        if ((bitField & 50397184) === 0) {
          var len = this._length();
          if (len > 0)
            promise._migrateCallback0(this);
          for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
          }
          this._setFollowing();
          this._setLength(0);
          this._setFollowee(promise);
        } else if ((bitField & 33554432) !== 0) {
          this._fulfill(promise._value());
        } else if ((bitField & 16777216) !== 0) {
          this._reject(promise._reason());
        } else {
          var reason = new CancellationError("late cancellation observer");
          promise._attachExtraTrace(reason);
          this._reject(reason);
        }
      };
      Promise2.prototype._rejectCallback = function(reason, synchronous, ignoreNonErrorWarnings) {
        var trace = util.ensureErrorObject(reason);
        var hasStack = trace === reason;
        if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
          var message = "a promise was rejected with a non-error: " + util.classString(reason);
          this._warn(message, true);
        }
        this._attachExtraTrace(trace, synchronous ? hasStack : false);
        this._reject(reason);
      };
      Promise2.prototype._resolveFromExecutor = function(executor) {
        var promise = this;
        this._captureStackTrace();
        this._pushContext();
        var synchronous = true;
        var r = this._execute(executor, function(value) {
          promise._resolveCallback(value);
        }, function(reason) {
          promise._rejectCallback(reason, synchronous);
        });
        synchronous = false;
        this._popContext();
        if (r !== void 0) {
          promise._rejectCallback(r, true);
        }
      };
      Promise2.prototype._settlePromiseFromHandler = function(handler, receiver, value, promise) {
        var bitField = promise._bitField;
        if ((bitField & 65536) !== 0)
          return;
        promise._pushContext();
        var x;
        if (receiver === APPLY) {
          if (!value || typeof value.length !== "number") {
            x = errorObj2;
            x.e = new TypeError2("cannot .spread() a non-array: " + util.classString(value));
          } else {
            x = tryCatch2(handler).apply(this._boundValue(), value);
          }
        } else {
          x = tryCatch2(handler).call(receiver, value);
        }
        var promiseCreated = promise._popContext();
        bitField = promise._bitField;
        if ((bitField & 65536) !== 0)
          return;
        if (x === NEXT_FILTER) {
          promise._reject(value);
        } else if (x === errorObj2) {
          promise._rejectCallback(x.e, false);
        } else {
          debug.checkForgottenReturns(x, promiseCreated, "", promise, this);
          promise._resolveCallback(x);
        }
      };
      Promise2.prototype._target = function() {
        var ret2 = this;
        while (ret2._isFollowing())
          ret2 = ret2._followee();
        return ret2;
      };
      Promise2.prototype._followee = function() {
        return this._rejectionHandler0;
      };
      Promise2.prototype._setFollowee = function(promise) {
        this._rejectionHandler0 = promise;
      };
      Promise2.prototype._settlePromise = function(promise, handler, receiver, value) {
        var isPromise = promise instanceof Promise2;
        var bitField = this._bitField;
        var asyncGuaranteed = (bitField & 134217728) !== 0;
        if ((bitField & 65536) !== 0) {
          if (isPromise)
            promise._invokeInternalOnCancel();
          if (receiver instanceof PassThroughHandlerContext && receiver.isFinallyHandler()) {
            receiver.cancelPromise = promise;
            if (tryCatch2(handler).call(receiver, value) === errorObj2) {
              promise._reject(errorObj2.e);
            }
          } else if (handler === reflectHandler) {
            promise._fulfill(reflectHandler.call(receiver));
          } else if (receiver instanceof Proxyable) {
            receiver._promiseCancelled(promise);
          } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
          } else {
            receiver.cancel();
          }
        } else if (typeof handler === "function") {
          if (!isPromise) {
            handler.call(receiver, value, promise);
          } else {
            if (asyncGuaranteed)
              promise._setAsyncGuaranteed();
            this._settlePromiseFromHandler(handler, receiver, value, promise);
          }
        } else if (receiver instanceof Proxyable) {
          if (!receiver._isResolved()) {
            if ((bitField & 33554432) !== 0) {
              receiver._promiseFulfilled(value, promise);
            } else {
              receiver._promiseRejected(value, promise);
            }
          }
        } else if (isPromise) {
          if (asyncGuaranteed)
            promise._setAsyncGuaranteed();
          if ((bitField & 33554432) !== 0) {
            promise._fulfill(value);
          } else {
            promise._reject(value);
          }
        }
      };
      Promise2.prototype._settlePromiseLateCancellationObserver = function(ctx) {
        var handler = ctx.handler;
        var promise = ctx.promise;
        var receiver = ctx.receiver;
        var value = ctx.value;
        if (typeof handler === "function") {
          if (!(promise instanceof Promise2)) {
            handler.call(receiver, value, promise);
          } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
          }
        } else if (promise instanceof Promise2) {
          promise._reject(value);
        }
      };
      Promise2.prototype._settlePromiseCtx = function(ctx) {
        this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
      };
      Promise2.prototype._settlePromise0 = function(handler, value, bitField) {
        var promise = this._promise0;
        var receiver = this._receiverAt(0);
        this._promise0 = void 0;
        this._receiver0 = void 0;
        this._settlePromise(promise, handler, receiver, value);
      };
      Promise2.prototype._clearCallbackDataAtIndex = function(index) {
        var base = index * 4 - 4;
        this[base + 2] = this[base + 3] = this[base + 0] = this[base + 1] = void 0;
      };
      Promise2.prototype._fulfill = function(value) {
        var bitField = this._bitField;
        if ((bitField & 117506048) >>> 16)
          return;
        if (value === this) {
          var err = makeSelfResolutionError();
          this._attachExtraTrace(err);
          return this._reject(err);
        }
        this._setFulfilled();
        this._rejectionHandler0 = value;
        if ((bitField & 65535) > 0) {
          if ((bitField & 134217728) !== 0) {
            this._settlePromises();
          } else {
            async.settlePromises(this);
          }
        }
      };
      Promise2.prototype._reject = function(reason) {
        var bitField = this._bitField;
        if ((bitField & 117506048) >>> 16)
          return;
        this._setRejected();
        this._fulfillmentHandler0 = reason;
        if (this._isFinal()) {
          return async.fatalError(reason, util.isNode);
        }
        if ((bitField & 65535) > 0) {
          async.settlePromises(this);
        } else {
          this._ensurePossibleRejectionHandled();
        }
      };
      Promise2.prototype._fulfillPromises = function(len, value) {
        for (var i = 1; i < len; i++) {
          var handler = this._fulfillmentHandlerAt(i);
          var promise = this._promiseAt(i);
          var receiver = this._receiverAt(i);
          this._clearCallbackDataAtIndex(i);
          this._settlePromise(promise, handler, receiver, value);
        }
      };
      Promise2.prototype._rejectPromises = function(len, reason) {
        for (var i = 1; i < len; i++) {
          var handler = this._rejectionHandlerAt(i);
          var promise = this._promiseAt(i);
          var receiver = this._receiverAt(i);
          this._clearCallbackDataAtIndex(i);
          this._settlePromise(promise, handler, receiver, reason);
        }
      };
      Promise2.prototype._settlePromises = function() {
        var bitField = this._bitField;
        var len = bitField & 65535;
        if (len > 0) {
          if ((bitField & 16842752) !== 0) {
            var reason = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, reason, bitField);
            this._rejectPromises(len, reason);
          } else {
            var value = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, value, bitField);
            this._fulfillPromises(len, value);
          }
          this._setLength(0);
        }
        this._clearCancellationData();
      };
      Promise2.prototype._settledValue = function() {
        var bitField = this._bitField;
        if ((bitField & 33554432) !== 0) {
          return this._rejectionHandler0;
        } else if ((bitField & 16777216) !== 0) {
          return this._fulfillmentHandler0;
        }
      };
      function deferResolve(v) {
        this.promise._resolveCallback(v);
      }
      function deferReject(v) {
        this.promise._rejectCallback(v, false);
      }
      Promise2.defer = Promise2.pending = function() {
        debug.deprecated("Promise.defer", "new Promise");
        var promise = new Promise2(INTERNAL);
        return {
          promise,
          resolve: deferResolve,
          reject: deferReject
        };
      };
      util.notEnumerableProp(
        Promise2,
        "_makeSelfResolutionError",
        makeSelfResolutionError
      );
      require_method()(
        Promise2,
        INTERNAL,
        tryConvertToPromise,
        apiRejection,
        debug
      );
      require_bind()(Promise2, INTERNAL, tryConvertToPromise, debug);
      require_cancel()(Promise2, PromiseArray, apiRejection, debug);
      require_direct_resolve()(Promise2);
      require_synchronous_inspection()(Promise2);
      require_join()(
        Promise2,
        PromiseArray,
        tryConvertToPromise,
        INTERNAL,
        async,
        getDomain
      );
      Promise2.Promise = Promise2;
      Promise2.version = "3.4.7";
      require_map()(Promise2, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
      require_call_get()(Promise2);
      require_using()(Promise2, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
      require_timers()(Promise2, INTERNAL, debug);
      require_generators()(Promise2, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
      require_nodeify()(Promise2);
      require_promisify()(Promise2, INTERNAL);
      require_props()(Promise2, PromiseArray, tryConvertToPromise, apiRejection);
      require_race()(Promise2, INTERNAL, tryConvertToPromise, apiRejection);
      require_reduce()(Promise2, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
      require_settle()(Promise2, PromiseArray, debug);
      require_some()(Promise2, PromiseArray, apiRejection);
      require_filter()(Promise2, INTERNAL);
      require_each()(Promise2, INTERNAL);
      require_any()(Promise2);
      util.toFastProperties(Promise2);
      util.toFastProperties(Promise2.prototype);
      function fillTypes(value) {
        var p = new Promise2(INTERNAL);
        p._fulfillmentHandler0 = value;
        p._rejectionHandler0 = value;
        p._promise0 = value;
        p._receiver0 = value;
      }
      fillTypes({ a: 1 });
      fillTypes({ b: 2 });
      fillTypes({ c: 3 });
      fillTypes(1);
      fillTypes(function() {
      });
      fillTypes(void 0);
      fillTypes(false);
      fillTypes(new Promise2(INTERNAL));
      debug.setBounds(Async.firstLineError, util.lastLineError);
      return Promise2;
    };
  }
});

// ../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/bluebird.js
var require_bluebird = __commonJS({
  "../../../node_modules/.pnpm/bluebird@3.4.7/node_modules/bluebird/js/release/bluebird.js"(exports2, module2) {
    "use strict";
    var old;
    if (typeof Promise !== "undefined")
      old = Promise;
    function noConflict() {
      try {
        if (Promise === bluebird)
          Promise = old;
      } catch (e) {
      }
      return bluebird;
    }
    var bluebird = require_promise()();
    bluebird.noConflict = noConflict;
    module2.exports = bluebird;
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Buffer.js
var require_Buffer = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Buffer.js"(exports2, module2) {
    "use strict";
    var Buffer2 = require("buffer").Buffer;
    if (Buffer2.from === void 0) {
      Buffer2.from = function(a, b, c) {
        return new Buffer2(a, b, c);
      };
      Buffer2.alloc = Buffer2.from;
    }
    module2.exports = Buffer2;
  }
});

// ../../../node_modules/.pnpm/process-nextick-args@2.0.1/node_modules/process-nextick-args/index.js
var require_process_nextick_args = __commonJS({
  "../../../node_modules/.pnpm/process-nextick-args@2.0.1/node_modules/process-nextick-args/index.js"(exports2, module2) {
    "use strict";
    if (typeof process === "undefined" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.indexOf("v1.8.") !== 0) {
      module2.exports = { nextTick };
    } else {
      module2.exports = process;
    }
    function nextTick(fn, arg1, arg2, arg3) {
      if (typeof fn !== "function") {
        throw new TypeError('"callback" argument must be a function');
      }
      var len = arguments.length;
      var args, i;
      switch (len) {
        case 0:
        case 1:
          return process.nextTick(fn);
        case 2:
          return process.nextTick(function afterTickOne() {
            fn.call(null, arg1);
          });
        case 3:
          return process.nextTick(function afterTickTwo() {
            fn.call(null, arg1, arg2);
          });
        case 4:
          return process.nextTick(function afterTickThree() {
            fn.call(null, arg1, arg2, arg3);
          });
        default:
          args = new Array(len - 1);
          i = 0;
          while (i < args.length) {
            args[i++] = arguments[i];
          }
          return process.nextTick(function afterTick() {
            fn.apply(null, args);
          });
      }
    }
  }
});

// ../../../node_modules/.pnpm/isarray@1.0.0/node_modules/isarray/index.js
var require_isarray = __commonJS({
  "../../../node_modules/.pnpm/isarray@1.0.0/node_modules/isarray/index.js"(exports2, module2) {
    "use strict";
    var toString = {}.toString;
    module2.exports = Array.isArray || function(arr) {
      return toString.call(arr) == "[object Array]";
    };
  }
});

// ../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/internal/streams/stream.js
var require_stream = __commonJS({
  "../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/internal/streams/stream.js"(exports2, module2) {
    "use strict";
    module2.exports = require("stream");
  }
});

// ../../../node_modules/.pnpm/safe-buffer@5.1.2/node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "../../../node_modules/.pnpm/safe-buffer@5.1.2/node_modules/safe-buffer/index.js"(exports2, module2) {
    "use strict";
    var buffer = require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module2.exports = buffer;
    } else {
      copyProps(buffer, exports2);
      exports2.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// ../../../node_modules/.pnpm/core-util-is@1.0.3/node_modules/core-util-is/lib/util.js
var require_util2 = __commonJS({
  "../../../node_modules/.pnpm/core-util-is@1.0.3/node_modules/core-util-is/lib/util.js"(exports2) {
    "use strict";
    function isArray(arg) {
      if (Array.isArray) {
        return Array.isArray(arg);
      }
      return objectToString(arg) === "[object Array]";
    }
    exports2.isArray = isArray;
    function isBoolean(arg) {
      return typeof arg === "boolean";
    }
    exports2.isBoolean = isBoolean;
    function isNull(arg) {
      return arg === null;
    }
    exports2.isNull = isNull;
    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports2.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
      return typeof arg === "number";
    }
    exports2.isNumber = isNumber;
    function isString(arg) {
      return typeof arg === "string";
    }
    exports2.isString = isString;
    function isSymbol(arg) {
      return typeof arg === "symbol";
    }
    exports2.isSymbol = isSymbol;
    function isUndefined(arg) {
      return arg === void 0;
    }
    exports2.isUndefined = isUndefined;
    function isRegExp(re) {
      return objectToString(re) === "[object RegExp]";
    }
    exports2.isRegExp = isRegExp;
    function isObject2(arg) {
      return typeof arg === "object" && arg !== null;
    }
    exports2.isObject = isObject2;
    function isDate(d) {
      return objectToString(d) === "[object Date]";
    }
    exports2.isDate = isDate;
    function isError2(e) {
      return objectToString(e) === "[object Error]" || e instanceof Error;
    }
    exports2.isError = isError2;
    function isFunction(arg) {
      return typeof arg === "function";
    }
    exports2.isFunction = isFunction;
    function isPrimitive2(arg) {
      return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || // ES6 symbol
      typeof arg === "undefined";
    }
    exports2.isPrimitive = isPrimitive2;
    exports2.isBuffer = require("buffer").Buffer.isBuffer;
    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }
  }
});

// ../../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "../../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js"(exports2, module2) {
    "use strict";
    if (typeof Object.create === "function") {
      module2.exports = function inherits2(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module2.exports = function inherits2(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});

// ../../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "../../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits.js"(exports2, module2) {
    "use strict";
    try {
      util = require("util");
      if (typeof util.inherits !== "function")
        throw "";
      module2.exports = util.inherits;
    } catch (e) {
      module2.exports = require_inherits_browser();
    }
    var util;
  }
});

// ../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/internal/streams/BufferList.js
var require_BufferList = __commonJS({
  "../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/internal/streams/BufferList.js"(exports2, module2) {
    "use strict";
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    var Buffer2 = require_safe_buffer().Buffer;
    var util = require("util");
    function copyBuffer(src, target, offset) {
      src.copy(target, offset);
    }
    module2.exports = function() {
      function BufferList() {
        _classCallCheck(this, BufferList);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      BufferList.prototype.push = function push(v) {
        var entry = { data: v, next: null };
        if (this.length > 0)
          this.tail.next = entry;
        else
          this.head = entry;
        this.tail = entry;
        ++this.length;
      };
      BufferList.prototype.unshift = function unshift(v) {
        var entry = { data: v, next: this.head };
        if (this.length === 0)
          this.tail = entry;
        this.head = entry;
        ++this.length;
      };
      BufferList.prototype.shift = function shift() {
        if (this.length === 0)
          return;
        var ret2 = this.head.data;
        if (this.length === 1)
          this.head = this.tail = null;
        else
          this.head = this.head.next;
        --this.length;
        return ret2;
      };
      BufferList.prototype.clear = function clear() {
        this.head = this.tail = null;
        this.length = 0;
      };
      BufferList.prototype.join = function join(s) {
        if (this.length === 0)
          return "";
        var p = this.head;
        var ret2 = "" + p.data;
        while (p = p.next) {
          ret2 += s + p.data;
        }
        return ret2;
      };
      BufferList.prototype.concat = function concat(n) {
        if (this.length === 0)
          return Buffer2.alloc(0);
        var ret2 = Buffer2.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret2, i);
          i += p.data.length;
          p = p.next;
        }
        return ret2;
      };
      return BufferList;
    }();
    if (util && util.inspect && util.inspect.custom) {
      module2.exports.prototype[util.inspect.custom] = function() {
        var obj2 = util.inspect({ length: this.length });
        return this.constructor.name + " " + obj2;
      };
    }
  }
});

// ../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/internal/streams/destroy.js
var require_destroy = __commonJS({
  "../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/internal/streams/destroy.js"(exports2, module2) {
    "use strict";
    var pna = require_process_nextick_args();
    function destroy(err, cb) {
      var _this = this;
      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;
      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err) {
          if (!this._writableState) {
            pna.nextTick(emitErrorNT, this, err);
          } else if (!this._writableState.errorEmitted) {
            this._writableState.errorEmitted = true;
            pna.nextTick(emitErrorNT, this, err);
          }
        }
        return this;
      }
      if (this._readableState) {
        this._readableState.destroyed = true;
      }
      if (this._writableState) {
        this._writableState.destroyed = true;
      }
      this._destroy(err || null, function(err2) {
        if (!cb && err2) {
          if (!_this._writableState) {
            pna.nextTick(emitErrorNT, _this, err2);
          } else if (!_this._writableState.errorEmitted) {
            _this._writableState.errorEmitted = true;
            pna.nextTick(emitErrorNT, _this, err2);
          }
        } else if (cb) {
          cb(err2);
        }
      });
      return this;
    }
    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }
      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finalCalled = false;
        this._writableState.prefinished = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }
    function emitErrorNT(self2, err) {
      self2.emit("error", err);
    }
    module2.exports = {
      destroy,
      undestroy
    };
  }
});

// ../../../node_modules/.pnpm/util-deprecate@1.0.2/node_modules/util-deprecate/node.js
var require_node = __commonJS({
  "../../../node_modules/.pnpm/util-deprecate@1.0.2/node_modules/util-deprecate/node.js"(exports2, module2) {
    "use strict";
    module2.exports = require("util").deprecate;
  }
});

// ../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_writable.js
var require_stream_writable = __commonJS({
  "../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_writable.js"(exports2, module2) {
    "use strict";
    var pna = require_process_nextick_args();
    module2.exports = Writable;
    function CorkedRequest(state) {
      var _this = this;
      this.next = null;
      this.entry = null;
      this.finish = function() {
        onCorkedFinish(_this, state);
      };
    }
    var asyncWrite = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
    var Duplex;
    Writable.WritableState = WritableState;
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    var internalUtil = {
      deprecate: require_node()
    };
    var Stream = require_stream();
    var Buffer2 = require_safe_buffer().Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj2) {
      return Buffer2.isBuffer(obj2) || obj2 instanceof OurUint8Array;
    }
    var destroyImpl = require_destroy();
    util.inherits(Writable, Stream);
    function nop() {
    }
    function WritableState(options, stream) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      var isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex)
        this.objectMode = this.objectMode || !!options.writableObjectMode;
      var hwm = options.highWaterMark;
      var writableHwm = options.writableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      if (hwm || hwm === 0)
        this.highWaterMark = hwm;
      else if (isDuplex && (writableHwm || writableHwm === 0))
        this.highWaterMark = writableHwm;
      else
        this.highWaterMark = defaultHwm;
      this.highWaterMark = Math.floor(this.highWaterMark);
      this.finalCalled = false;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      this.destroyed = false;
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.bufferedRequest = null;
      this.lastBufferedRequest = null;
      this.pendingcb = 0;
      this.prefinished = false;
      this.errorEmitted = false;
      this.bufferedRequestCount = 0;
      this.corkedRequestsFree = new CorkedRequest(this);
    }
    WritableState.prototype.getBuffer = function getBuffer() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    };
    (function() {
      try {
        Object.defineProperty(WritableState.prototype, "buffer", {
          get: internalUtil.deprecate(function() {
            return this.getBuffer();
          }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
        });
      } catch (_) {
      }
    })();
    var realHasInstance;
    if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
      realHasInstance = Function.prototype[Symbol.hasInstance];
      Object.defineProperty(Writable, Symbol.hasInstance, {
        value: function(object) {
          if (realHasInstance.call(this, object))
            return true;
          if (this !== Writable)
            return false;
          return object && object._writableState instanceof WritableState;
        }
      });
    } else {
      realHasInstance = function(object) {
        return object instanceof this;
      };
    }
    function Writable(options) {
      Duplex = Duplex || require_stream_duplex();
      if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
        return new Writable(options);
      }
      this._writableState = new WritableState(options, this);
      this.writable = true;
      if (options) {
        if (typeof options.write === "function")
          this._write = options.write;
        if (typeof options.writev === "function")
          this._writev = options.writev;
        if (typeof options.destroy === "function")
          this._destroy = options.destroy;
        if (typeof options.final === "function")
          this._final = options.final;
      }
      Stream.call(this);
    }
    Writable.prototype.pipe = function() {
      this.emit("error", new Error("Cannot pipe, not readable"));
    };
    function writeAfterEnd(stream, cb) {
      var er = new Error("write after end");
      stream.emit("error", er);
      pna.nextTick(cb, er);
    }
    function validChunk(stream, state, chunk, cb) {
      var valid = true;
      var er = false;
      if (chunk === null) {
        er = new TypeError("May not write null values to stream");
      } else if (typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new TypeError("Invalid non-string/buffer chunk");
      }
      if (er) {
        stream.emit("error", er);
        pna.nextTick(cb, er);
        valid = false;
      }
      return valid;
    }
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state = this._writableState;
      var ret2 = false;
      var isBuf = !state.objectMode && _isUint8Array(chunk);
      if (isBuf && !Buffer2.isBuffer(chunk)) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (isBuf)
        encoding = "buffer";
      else if (!encoding)
        encoding = state.defaultEncoding;
      if (typeof cb !== "function")
        cb = nop;
      if (state.ended)
        writeAfterEnd(this, cb);
      else if (isBuf || validChunk(this, state, chunk, cb)) {
        state.pendingcb++;
        ret2 = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
      }
      return ret2;
    };
    Writable.prototype.cork = function() {
      var state = this._writableState;
      state.corked++;
    };
    Writable.prototype.uncork = function() {
      var state = this._writableState;
      if (state.corked) {
        state.corked--;
        if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest)
          clearBuffer(this, state);
      }
    };
    Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
      if (typeof encoding === "string")
        encoding = encoding.toLowerCase();
      if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1))
        throw new TypeError("Unknown encoding: " + encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    };
    function decodeChunk(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") {
        chunk = Buffer2.from(chunk, encoding);
      }
      return chunk;
    }
    Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function() {
        return this._writableState.highWaterMark;
      }
    });
    function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
      if (!isBuf) {
        var newChunk = decodeChunk(state, chunk, encoding);
        if (chunk !== newChunk) {
          isBuf = true;
          encoding = "buffer";
          chunk = newChunk;
        }
      }
      var len = state.objectMode ? 1 : chunk.length;
      state.length += len;
      var ret2 = state.length < state.highWaterMark;
      if (!ret2)
        state.needDrain = true;
      if (state.writing || state.corked) {
        var last = state.lastBufferedRequest;
        state.lastBufferedRequest = {
          chunk,
          encoding,
          isBuf,
          callback: cb,
          next: null
        };
        if (last) {
          last.next = state.lastBufferedRequest;
        } else {
          state.bufferedRequest = state.lastBufferedRequest;
        }
        state.bufferedRequestCount += 1;
      } else {
        doWrite(stream, state, false, len, chunk, encoding, cb);
      }
      return ret2;
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (writev)
        stream._writev(chunk, state.onwrite);
      else
        stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }
    function onwriteError(stream, state, sync, er, cb) {
      --state.pendingcb;
      if (sync) {
        pna.nextTick(cb, er);
        pna.nextTick(finishMaybe, stream, state);
        stream._writableState.errorEmitted = true;
        stream.emit("error", er);
      } else {
        cb(er);
        stream._writableState.errorEmitted = true;
        stream.emit("error", er);
        finishMaybe(stream, state);
      }
    }
    function onwriteStateUpdate(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }
    function onwrite(stream, er) {
      var state = stream._writableState;
      var sync = state.sync;
      var cb = state.writecb;
      onwriteStateUpdate(state);
      if (er)
        onwriteError(stream, state, sync, er, cb);
      else {
        var finished = needFinish(state);
        if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
          clearBuffer(stream, state);
        }
        if (sync) {
          asyncWrite(afterWrite, stream, state, finished, cb);
        } else {
          afterWrite(stream, state, finished, cb);
        }
      }
    }
    function afterWrite(stream, state, finished, cb) {
      if (!finished)
        onwriteDrain(stream, state);
      state.pendingcb--;
      cb();
      finishMaybe(stream, state);
    }
    function onwriteDrain(stream, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream.emit("drain");
      }
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = true;
      var entry = state.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l2 = state.bufferedRequestCount;
        var buffer = new Array(l2);
        var holder = state.corkedRequestsFree;
        holder.entry = entry;
        var count = 0;
        var allBuffers = true;
        while (entry) {
          buffer[count] = entry;
          if (!entry.isBuf)
            allBuffers = false;
          entry = entry.next;
          count += 1;
        }
        buffer.allBuffers = allBuffers;
        doWrite(stream, state, true, state.length, buffer, "", holder.finish);
        state.pendingcb++;
        state.lastBufferedRequest = null;
        if (holder.next) {
          state.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state.corkedRequestsFree = new CorkedRequest(state);
        }
        state.bufferedRequestCount = 0;
      } else {
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state.objectMode ? 1 : chunk.length;
          doWrite(stream, state, false, len, chunk, encoding, cb);
          entry = entry.next;
          state.bufferedRequestCount--;
          if (state.writing) {
            break;
          }
        }
        if (entry === null)
          state.lastBufferedRequest = null;
      }
      state.bufferedRequest = entry;
      state.bufferProcessing = false;
    }
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new Error("_write() is not implemented"));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (chunk !== null && chunk !== void 0)
        this.write(chunk, encoding);
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }
      if (!state.ending)
        endWritable(this, state, cb);
    };
    function needFinish(state) {
      return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    }
    function callFinal(stream, state) {
      stream._final(function(err) {
        state.pendingcb--;
        if (err) {
          stream.emit("error", err);
        }
        state.prefinished = true;
        stream.emit("prefinish");
        finishMaybe(stream, state);
      });
    }
    function prefinish(stream, state) {
      if (!state.prefinished && !state.finalCalled) {
        if (typeof stream._final === "function") {
          state.pendingcb++;
          state.finalCalled = true;
          pna.nextTick(callFinal, stream, state);
        } else {
          state.prefinished = true;
          stream.emit("prefinish");
        }
      }
    }
    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (need) {
        prefinish(stream, state);
        if (state.pendingcb === 0) {
          state.finished = true;
          stream.emit("finish");
        }
      }
      return need;
    }
    function endWritable(stream, state, cb) {
      state.ending = true;
      finishMaybe(stream, state);
      if (cb) {
        if (state.finished)
          pna.nextTick(cb);
        else
          stream.once("finish", cb);
      }
      state.ended = true;
      stream.writable = false;
    }
    function onCorkedFinish(corkReq, state, err) {
      var entry = corkReq.entry;
      corkReq.entry = null;
      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      state.corkedRequestsFree.next = corkReq;
    }
    Object.defineProperty(Writable.prototype, "destroyed", {
      get: function() {
        if (this._writableState === void 0) {
          return false;
        }
        return this._writableState.destroyed;
      },
      set: function(value) {
        if (!this._writableState) {
          return;
        }
        this._writableState.destroyed = value;
      }
    });
    Writable.prototype.destroy = destroyImpl.destroy;
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function(err, cb) {
      this.end();
      cb(err);
    };
  }
});

// ../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_duplex.js
var require_stream_duplex = __commonJS({
  "../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_duplex.js"(exports2, module2) {
    "use strict";
    var pna = require_process_nextick_args();
    var objectKeys = Object.keys || function(obj2) {
      var keys2 = [];
      for (var key in obj2) {
        keys2.push(key);
      }
      return keys2;
    };
    module2.exports = Duplex;
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    var Readable2 = require_stream_readable();
    var Writable = require_stream_writable();
    util.inherits(Duplex, Readable2);
    {
      keys = objectKeys(Writable.prototype);
      for (v = 0; v < keys.length; v++) {
        method = keys[v];
        if (!Duplex.prototype[method])
          Duplex.prototype[method] = Writable.prototype[method];
      }
    }
    var keys;
    var method;
    var v;
    function Duplex(options) {
      if (!(this instanceof Duplex))
        return new Duplex(options);
      Readable2.call(this, options);
      Writable.call(this, options);
      if (options && options.readable === false)
        this.readable = false;
      if (options && options.writable === false)
        this.writable = false;
      this.allowHalfOpen = true;
      if (options && options.allowHalfOpen === false)
        this.allowHalfOpen = false;
      this.once("end", onend);
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function() {
        return this._writableState.highWaterMark;
      }
    });
    function onend() {
      if (this.allowHalfOpen || this._writableState.ended)
        return;
      pna.nextTick(onEndNT, this);
    }
    function onEndNT(self2) {
      self2.end();
    }
    Object.defineProperty(Duplex.prototype, "destroyed", {
      get: function() {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set: function(value) {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return;
        }
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    });
    Duplex.prototype._destroy = function(err, cb) {
      this.push(null);
      this.end();
      pna.nextTick(cb, err);
    };
  }
});

// ../../../node_modules/.pnpm/string_decoder@1.1.1/node_modules/string_decoder/lib/string_decoder.js
var require_string_decoder = __commonJS({
  "../../../node_modules/.pnpm/string_decoder@1.1.1/node_modules/string_decoder/lib/string_decoder.js"(exports2) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var isEncoding = Buffer2.isEncoding || function(encoding) {
      encoding = "" + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
        case "raw":
          return true;
        default:
          return false;
      }
    };
    function _normalizeEncoding(enc) {
      if (!enc)
        return "utf8";
      var retried;
      while (true) {
        switch (enc) {
          case "utf8":
          case "utf-8":
            return "utf8";
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return "utf16le";
          case "latin1":
          case "binary":
            return "latin1";
          case "base64":
          case "ascii":
          case "hex":
            return enc;
          default:
            if (retried)
              return;
            enc = ("" + enc).toLowerCase();
            retried = true;
        }
      }
    }
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc)))
        throw new Error("Unknown encoding: " + enc);
      return nenc || enc;
    }
    exports2.StringDecoder = StringDecoder;
    function StringDecoder(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
        case "utf16le":
          this.text = utf16Text;
          this.end = utf16End;
          nb = 4;
          break;
        case "utf8":
          this.fillLast = utf8FillLast;
          nb = 4;
          break;
        case "base64":
          this.text = base64Text;
          this.end = base64End;
          nb = 3;
          break;
        default:
          this.write = simpleWrite;
          this.end = simpleEnd;
          return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer2.allocUnsafe(nb);
    }
    StringDecoder.prototype.write = function(buf) {
      if (buf.length === 0)
        return "";
      var r;
      var i;
      if (this.lastNeed) {
        r = this.fillLast(buf);
        if (r === void 0)
          return "";
        i = this.lastNeed;
        this.lastNeed = 0;
      } else {
        i = 0;
      }
      if (i < buf.length)
        return r ? r + this.text(buf, i) : this.text(buf, i);
      return r || "";
    };
    StringDecoder.prototype.end = utf8End;
    StringDecoder.prototype.text = utf8Text;
    StringDecoder.prototype.fillLast = function(buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };
    function utf8CheckByte(byte) {
      if (byte <= 127)
        return 0;
      else if (byte >> 5 === 6)
        return 2;
      else if (byte >> 4 === 14)
        return 3;
      else if (byte >> 3 === 30)
        return 4;
      return byte >> 6 === 2 ? -1 : -2;
    }
    function utf8CheckIncomplete(self2, buf, i) {
      var j = buf.length - 1;
      if (j < i)
        return 0;
      var nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0)
          self2.lastNeed = nb - 1;
        return nb;
      }
      if (--j < i || nb === -2)
        return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0)
          self2.lastNeed = nb - 2;
        return nb;
      }
      if (--j < i || nb === -2)
        return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) {
          if (nb === 2)
            nb = 0;
          else
            self2.lastNeed = nb - 3;
        }
        return nb;
      }
      return 0;
    }
    function utf8CheckExtraBytes(self2, buf, p) {
      if ((buf[0] & 192) !== 128) {
        self2.lastNeed = 0;
        return "\uFFFD";
      }
      if (self2.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 192) !== 128) {
          self2.lastNeed = 1;
          return "\uFFFD";
        }
        if (self2.lastNeed > 2 && buf.length > 2) {
          if ((buf[2] & 192) !== 128) {
            self2.lastNeed = 2;
            return "\uFFFD";
          }
        }
      }
    }
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed;
      var r = utf8CheckExtraBytes(this, buf, p);
      if (r !== void 0)
        return r;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p, 0, buf.length);
      this.lastNeed -= buf.length;
    }
    function utf8Text(buf, i) {
      var total = utf8CheckIncomplete(this, buf, i);
      if (!this.lastNeed)
        return buf.toString("utf8", i);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString("utf8", i, end);
    }
    function utf8End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed)
        return r + "\uFFFD";
      return r;
    }
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 === 0) {
        var r = buf.toString("utf16le", i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 55296 && c <= 56319) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r.slice(0, -1);
          }
        }
        return r;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString("utf16le", i, buf.length - 1);
    }
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString("utf16le", 0, end);
      }
      return r;
    }
    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      if (n === 0)
        return buf.toString("base64", i);
      this.lastNeed = 3 - n;
      this.lastTotal = 3;
      if (n === 1) {
        this.lastChar[0] = buf[buf.length - 1];
      } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString("base64", i, buf.length - n);
    }
    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed)
        return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
      return r;
    }
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }
    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : "";
    }
  }
});

// ../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_readable.js
var require_stream_readable = __commonJS({
  "../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_readable.js"(exports2, module2) {
    "use strict";
    var pna = require_process_nextick_args();
    module2.exports = Readable2;
    var isArray = require_isarray();
    var Duplex;
    Readable2.ReadableState = ReadableState;
    var EE = require("events").EventEmitter;
    var EElistenerCount = function(emitter, type) {
      return emitter.listeners(type).length;
    };
    var Stream = require_stream();
    var Buffer2 = require_safe_buffer().Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj2) {
      return Buffer2.isBuffer(obj2) || obj2 instanceof OurUint8Array;
    }
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    var debugUtil = require("util");
    var debug = void 0;
    if (debugUtil && debugUtil.debuglog) {
      debug = debugUtil.debuglog("stream");
    } else {
      debug = function() {
      };
    }
    var BufferList = require_BufferList();
    var destroyImpl = require_destroy();
    var StringDecoder;
    util.inherits(Readable2, Stream);
    var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function prependListener(emitter, event, fn) {
      if (typeof emitter.prependListener === "function")
        return emitter.prependListener(event, fn);
      if (!emitter._events || !emitter._events[event])
        emitter.on(event, fn);
      else if (isArray(emitter._events[event]))
        emitter._events[event].unshift(fn);
      else
        emitter._events[event] = [fn, emitter._events[event]];
    }
    function ReadableState(options, stream) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      var isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex)
        this.objectMode = this.objectMode || !!options.readableObjectMode;
      var hwm = options.highWaterMark;
      var readableHwm = options.readableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      if (hwm || hwm === 0)
        this.highWaterMark = hwm;
      else if (isDuplex && (readableHwm || readableHwm === 0))
        this.highWaterMark = readableHwm;
      else
        this.highWaterMark = defaultHwm;
      this.highWaterMark = Math.floor(this.highWaterMark);
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;
      this.destroyed = false;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder)
          StringDecoder = require_string_decoder().StringDecoder;
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    function Readable2(options) {
      Duplex = Duplex || require_stream_duplex();
      if (!(this instanceof Readable2))
        return new Readable2(options);
      this._readableState = new ReadableState(options, this);
      this.readable = true;
      if (options) {
        if (typeof options.read === "function")
          this._read = options.read;
        if (typeof options.destroy === "function")
          this._destroy = options.destroy;
      }
      Stream.call(this);
    }
    Object.defineProperty(Readable2.prototype, "destroyed", {
      get: function() {
        if (this._readableState === void 0) {
          return false;
        }
        return this._readableState.destroyed;
      },
      set: function(value) {
        if (!this._readableState) {
          return;
        }
        this._readableState.destroyed = value;
      }
    });
    Readable2.prototype.destroy = destroyImpl.destroy;
    Readable2.prototype._undestroy = destroyImpl.undestroy;
    Readable2.prototype._destroy = function(err, cb) {
      this.push(null);
      cb(err);
    };
    Readable2.prototype.push = function(chunk, encoding) {
      var state = this._readableState;
      var skipChunkCheck;
      if (!state.objectMode) {
        if (typeof chunk === "string") {
          encoding = encoding || state.defaultEncoding;
          if (encoding !== state.encoding) {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "";
          }
          skipChunkCheck = true;
        }
      } else {
        skipChunkCheck = true;
      }
      return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    };
    Readable2.prototype.unshift = function(chunk) {
      return readableAddChunk(this, chunk, null, true, false);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
      var state = stream._readableState;
      if (chunk === null) {
        state.reading = false;
        onEofChunk(stream, state);
      } else {
        var er;
        if (!skipChunkCheck)
          er = chunkInvalid(state, chunk);
        if (er) {
          stream.emit("error", er);
        } else if (state.objectMode || chunk && chunk.length > 0) {
          if (typeof chunk !== "string" && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
            chunk = _uint8ArrayToBuffer(chunk);
          }
          if (addToFront) {
            if (state.endEmitted)
              stream.emit("error", new Error("stream.unshift() after end event"));
            else
              addChunk(stream, state, chunk, true);
          } else if (state.ended) {
            stream.emit("error", new Error("stream.push() after EOF"));
          } else {
            state.reading = false;
            if (state.decoder && !encoding) {
              chunk = state.decoder.write(chunk);
              if (state.objectMode || chunk.length !== 0)
                addChunk(stream, state, chunk, false);
              else
                maybeReadMore(stream, state);
            } else {
              addChunk(stream, state, chunk, false);
            }
          }
        } else if (!addToFront) {
          state.reading = false;
        }
      }
      return needMoreData(state);
    }
    function addChunk(stream, state, chunk, addToFront) {
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit("data", chunk);
        stream.read(0);
      } else {
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);
        if (state.needReadable)
          emitReadable(stream);
      }
      maybeReadMore(stream, state);
    }
    function chunkInvalid(state, chunk) {
      var er;
      if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new TypeError("Invalid non-string/buffer chunk");
      }
      return er;
    }
    function needMoreData(state) {
      return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    }
    Readable2.prototype.isPaused = function() {
      return this._readableState.flowing === false;
    };
    Readable2.prototype.setEncoding = function(enc) {
      if (!StringDecoder)
        StringDecoder = require_string_decoder().StringDecoder;
      this._readableState.decoder = new StringDecoder(enc);
      this._readableState.encoding = enc;
      return this;
    };
    var MAX_HWM = 8388608;
    function computeNewHighWaterMark(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }
    function howMuchToRead(n, state) {
      if (n <= 0 || state.length === 0 && state.ended)
        return 0;
      if (state.objectMode)
        return 1;
      if (n !== n) {
        if (state.flowing && state.length)
          return state.buffer.head.data.length;
        else
          return state.length;
      }
      if (n > state.highWaterMark)
        state.highWaterMark = computeNewHighWaterMark(n);
      if (n <= state.length)
        return n;
      if (!state.ended) {
        state.needReadable = true;
        return 0;
      }
      return state.length;
    }
    Readable2.prototype.read = function(n) {
      debug("read", n);
      n = parseInt(n, 10);
      var state = this._readableState;
      var nOrig = n;
      if (n !== 0)
        state.emittedReadable = false;
      if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
        debug("read: emitReadable", state.length, state.ended);
        if (state.length === 0 && state.ended)
          endReadable(this);
        else
          emitReadable(this);
        return null;
      }
      n = howMuchToRead(n, state);
      if (n === 0 && state.ended) {
        if (state.length === 0)
          endReadable(this);
        return null;
      }
      var doRead = state.needReadable;
      debug("need readable", doRead);
      if (state.length === 0 || state.length - n < state.highWaterMark) {
        doRead = true;
        debug("length less than watermark", doRead);
      }
      if (state.ended || state.reading) {
        doRead = false;
        debug("reading or ended", doRead);
      } else if (doRead) {
        debug("do read");
        state.reading = true;
        state.sync = true;
        if (state.length === 0)
          state.needReadable = true;
        this._read(state.highWaterMark);
        state.sync = false;
        if (!state.reading)
          n = howMuchToRead(nOrig, state);
      }
      var ret2;
      if (n > 0)
        ret2 = fromList(n, state);
      else
        ret2 = null;
      if (ret2 === null) {
        state.needReadable = true;
        n = 0;
      } else {
        state.length -= n;
      }
      if (state.length === 0) {
        if (!state.ended)
          state.needReadable = true;
        if (nOrig !== n && state.ended)
          endReadable(this);
      }
      if (ret2 !== null)
        this.emit("data", ret2);
      return ret2;
    };
    function onEofChunk(stream, state) {
      if (state.ended)
        return;
      if (state.decoder) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;
      emitReadable(stream);
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug("emitReadable", state.flowing);
        state.emittedReadable = true;
        if (state.sync)
          pna.nextTick(emitReadable_, stream);
        else
          emitReadable_(stream);
      }
    }
    function emitReadable_(stream) {
      debug("emit readable");
      stream.emit("readable");
      flow(stream);
    }
    function maybeReadMore(stream, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        pna.nextTick(maybeReadMore_, stream, state);
      }
    }
    function maybeReadMore_(stream, state) {
      var len = state.length;
      while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
        debug("maybeReadMore read 0");
        stream.read(0);
        if (len === state.length)
          break;
        else
          len = state.length;
      }
      state.readingMore = false;
    }
    Readable2.prototype._read = function(n) {
      this.emit("error", new Error("_read() is not implemented"));
    };
    Readable2.prototype.pipe = function(dest, pipeOpts) {
      var src = this;
      var state = this._readableState;
      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : unpipe;
      if (state.endEmitted)
        pna.nextTick(endFn);
      else
        src.once("end", endFn);
      dest.on("unpipe", onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug("onunpipe");
        if (readable === src) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }
      function onend() {
        debug("onend");
        dest.end();
      }
      var ondrain = pipeOnDrain(src);
      dest.on("drain", ondrain);
      var cleanedUp = false;
      function cleanup() {
        debug("cleanup");
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        dest.removeListener("drain", ondrain);
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src.removeListener("end", onend);
        src.removeListener("end", unpipe);
        src.removeListener("data", ondata);
        cleanedUp = true;
        if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain))
          ondrain();
      }
      var increasedAwaitDrain = false;
      src.on("data", ondata);
      function ondata(chunk) {
        debug("ondata");
        increasedAwaitDrain = false;
        var ret2 = dest.write(chunk);
        if (false === ret2 && !increasedAwaitDrain) {
          if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
            debug("false write response, pause", state.awaitDrain);
            state.awaitDrain++;
            increasedAwaitDrain = true;
          }
          src.pause();
        }
      }
      function onerror(er) {
        debug("onerror", er);
        unpipe();
        dest.removeListener("error", onerror);
        if (EElistenerCount(dest, "error") === 0)
          dest.emit("error", er);
      }
      prependListener(dest, "error", onerror);
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      dest.once("close", onclose);
      function onfinish() {
        debug("onfinish");
        dest.removeListener("close", onclose);
        unpipe();
      }
      dest.once("finish", onfinish);
      function unpipe() {
        debug("unpipe");
        src.unpipe(dest);
      }
      dest.emit("pipe", src);
      if (!state.flowing) {
        debug("pipe resume");
        src.resume();
      }
      return dest;
    };
    function pipeOnDrain(src) {
      return function() {
        var state = src._readableState;
        debug("pipeOnDrain", state.awaitDrain);
        if (state.awaitDrain)
          state.awaitDrain--;
        if (state.awaitDrain === 0 && EElistenerCount(src, "data")) {
          state.flowing = true;
          flow(src);
        }
      };
    }
    Readable2.prototype.unpipe = function(dest) {
      var state = this._readableState;
      var unpipeInfo = { hasUnpiped: false };
      if (state.pipesCount === 0)
        return this;
      if (state.pipesCount === 1) {
        if (dest && dest !== state.pipes)
          return this;
        if (!dest)
          dest = state.pipes;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        if (dest)
          dest.emit("unpipe", this, unpipeInfo);
        return this;
      }
      if (!dest) {
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        for (var i = 0; i < len; i++) {
          dests[i].emit("unpipe", this, { hasUnpiped: false });
        }
        return this;
      }
      var index = indexOf(state.pipes, dest);
      if (index === -1)
        return this;
      state.pipes.splice(index, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1)
        state.pipes = state.pipes[0];
      dest.emit("unpipe", this, unpipeInfo);
      return this;
    };
    Readable2.prototype.on = function(ev, fn) {
      var res = Stream.prototype.on.call(this, ev, fn);
      if (ev === "data") {
        if (this._readableState.flowing !== false)
          this.resume();
      } else if (ev === "readable") {
        var state = this._readableState;
        if (!state.endEmitted && !state.readableListening) {
          state.readableListening = state.needReadable = true;
          state.emittedReadable = false;
          if (!state.reading) {
            pna.nextTick(nReadingNextTick, this);
          } else if (state.length) {
            emitReadable(this);
          }
        }
      }
      return res;
    };
    Readable2.prototype.addListener = Readable2.prototype.on;
    function nReadingNextTick(self2) {
      debug("readable nexttick read 0");
      self2.read(0);
    }
    Readable2.prototype.resume = function() {
      var state = this._readableState;
      if (!state.flowing) {
        debug("resume");
        state.flowing = true;
        resume(this, state);
      }
      return this;
    };
    function resume(stream, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        pna.nextTick(resume_, stream, state);
      }
    }
    function resume_(stream, state) {
      if (!state.reading) {
        debug("resume read 0");
        stream.read(0);
      }
      state.resumeScheduled = false;
      state.awaitDrain = 0;
      stream.emit("resume");
      flow(stream);
      if (state.flowing && !state.reading)
        stream.read(0);
    }
    Readable2.prototype.pause = function() {
      debug("call pause flowing=%j", this._readableState.flowing);
      if (false !== this._readableState.flowing) {
        debug("pause");
        this._readableState.flowing = false;
        this.emit("pause");
      }
      return this;
    };
    function flow(stream) {
      var state = stream._readableState;
      debug("flow", state.flowing);
      while (state.flowing && stream.read() !== null) {
      }
    }
    Readable2.prototype.wrap = function(stream) {
      var _this = this;
      var state = this._readableState;
      var paused = false;
      stream.on("end", function() {
        debug("wrapped end");
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length)
            _this.push(chunk);
        }
        _this.push(null);
      });
      stream.on("data", function(chunk) {
        debug("wrapped data");
        if (state.decoder)
          chunk = state.decoder.write(chunk);
        if (state.objectMode && (chunk === null || chunk === void 0))
          return;
        else if (!state.objectMode && (!chunk || !chunk.length))
          return;
        var ret2 = _this.push(chunk);
        if (!ret2) {
          paused = true;
          stream.pause();
        }
      });
      for (var i in stream) {
        if (this[i] === void 0 && typeof stream[i] === "function") {
          this[i] = function(method) {
            return function() {
              return stream[method].apply(stream, arguments);
            };
          }(i);
        }
      }
      for (var n = 0; n < kProxyEvents.length; n++) {
        stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
      }
      this._read = function(n2) {
        debug("wrapped _read", n2);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return this;
    };
    Object.defineProperty(Readable2.prototype, "readableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function() {
        return this._readableState.highWaterMark;
      }
    });
    Readable2._fromList = fromList;
    function fromList(n, state) {
      if (state.length === 0)
        return null;
      var ret2;
      if (state.objectMode)
        ret2 = state.buffer.shift();
      else if (!n || n >= state.length) {
        if (state.decoder)
          ret2 = state.buffer.join("");
        else if (state.buffer.length === 1)
          ret2 = state.buffer.head.data;
        else
          ret2 = state.buffer.concat(state.length);
        state.buffer.clear();
      } else {
        ret2 = fromListPartial(n, state.buffer, state.decoder);
      }
      return ret2;
    }
    function fromListPartial(n, list, hasStrings) {
      var ret2;
      if (n < list.head.data.length) {
        ret2 = list.head.data.slice(0, n);
        list.head.data = list.head.data.slice(n);
      } else if (n === list.head.data.length) {
        ret2 = list.shift();
      } else {
        ret2 = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
      }
      return ret2;
    }
    function copyFromBufferString(n, list) {
      var p = list.head;
      var c = 1;
      var ret2 = p.data;
      n -= ret2.length;
      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length)
          ret2 += str;
        else
          ret2 += str.slice(0, n);
        n -= nb;
        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next)
              list.head = p.next;
            else
              list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = str.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret2;
    }
    function copyFromBuffer(n, list) {
      var ret2 = Buffer2.allocUnsafe(n);
      var p = list.head;
      var c = 1;
      p.data.copy(ret2);
      n -= p.data.length;
      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret2, ret2.length - n, 0, nb);
        n -= nb;
        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next)
              list.head = p.next;
            else
              list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = buf.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret2;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      if (state.length > 0)
        throw new Error('"endReadable()" called on non-empty stream');
      if (!state.endEmitted) {
        state.ended = true;
        pna.nextTick(endReadableNT, state, stream);
      }
    }
    function endReadableNT(state, stream) {
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit("end");
      }
    }
    function indexOf(xs, x) {
      for (var i = 0, l2 = xs.length; i < l2; i++) {
        if (xs[i] === x)
          return i;
      }
      return -1;
    }
  }
});

// ../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_transform.js
var require_stream_transform = __commonJS({
  "../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_transform.js"(exports2, module2) {
    "use strict";
    module2.exports = Transform;
    var Duplex = require_stream_duplex();
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    util.inherits(Transform, Duplex);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (!cb) {
        return this.emit("error", new Error("write callback called multiple times"));
      }
      ts.writechunk = null;
      ts.writecb = null;
      if (data != null)
        this.push(data);
      cb(er);
      var rs = this._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        this._read(rs.highWaterMark);
      }
    }
    function Transform(options) {
      if (!(this instanceof Transform))
        return new Transform(options);
      Duplex.call(this, options);
      this._transformState = {
        afterTransform: afterTransform.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      if (options) {
        if (typeof options.transform === "function")
          this._transform = options.transform;
        if (typeof options.flush === "function")
          this._flush = options.flush;
      }
      this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      if (typeof this._flush === "function") {
        this._flush(function(er, data) {
          done(_this, er, data);
        });
      } else {
        done(this, null, null);
      }
    }
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      throw new Error("_transform() is not implemented");
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark)
          this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n) {
      var ts = this._transformState;
      if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        ts.needTransform = true;
      }
    };
    Transform.prototype._destroy = function(err, cb) {
      var _this2 = this;
      Duplex.prototype._destroy.call(this, err, function(err2) {
        cb(err2);
        _this2.emit("close");
      });
    };
    function done(stream, er, data) {
      if (er)
        return stream.emit("error", er);
      if (data != null)
        stream.push(data);
      if (stream._writableState.length)
        throw new Error("Calling transform done when ws.length != 0");
      if (stream._transformState.transforming)
        throw new Error("Calling transform done when still transforming");
      return stream.push(null);
    }
  }
});

// ../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_passthrough.js
var require_stream_passthrough = __commonJS({
  "../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_passthrough.js"(exports2, module2) {
    "use strict";
    module2.exports = PassThrough;
    var Transform = require_stream_transform();
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    util.inherits(PassThrough, Transform);
    function PassThrough(options) {
      if (!(this instanceof PassThrough))
        return new PassThrough(options);
      Transform.call(this, options);
    }
    PassThrough.prototype._transform = function(chunk, encoding, cb) {
      cb(null, chunk);
    };
  }
});

// ../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/readable.js
var require_readable = __commonJS({
  "../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/readable.js"(exports2, module2) {
    "use strict";
    var Stream = require("stream");
    if (process.env.READABLE_STREAM === "disable" && Stream) {
      module2.exports = Stream;
      exports2 = module2.exports = Stream.Readable;
      exports2.Readable = Stream.Readable;
      exports2.Writable = Stream.Writable;
      exports2.Duplex = Stream.Duplex;
      exports2.Transform = Stream.Transform;
      exports2.PassThrough = Stream.PassThrough;
      exports2.Stream = Stream;
    } else {
      exports2 = module2.exports = require_stream_readable();
      exports2.Stream = Stream || exports2;
      exports2.Readable = exports2;
      exports2.Writable = require_stream_writable();
      exports2.Duplex = require_stream_duplex();
      exports2.Transform = require_stream_transform();
      exports2.PassThrough = require_stream_passthrough();
    }
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/PullStream.js
var require_PullStream = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/PullStream.js"(exports2, module2) {
    "use strict";
    var Stream = require("stream");
    var Promise2 = require_bluebird();
    var util = require("util");
    var Buffer2 = require_Buffer();
    var strFunction = "function";
    if (!Stream.Writable || !Stream.Writable.prototype.destroy)
      Stream = require_readable();
    function PullStream() {
      if (!(this instanceof PullStream))
        return new PullStream();
      Stream.Duplex.call(this, { decodeStrings: false, objectMode: true });
      this.buffer = Buffer2.from("");
      var self2 = this;
      self2.on("finish", function() {
        self2.finished = true;
        self2.emit("chunk", false);
      });
    }
    util.inherits(PullStream, Stream.Duplex);
    PullStream.prototype._write = function(chunk, e, cb) {
      this.buffer = Buffer2.concat([this.buffer, chunk]);
      this.cb = cb;
      this.emit("chunk");
    };
    PullStream.prototype.stream = function(eof, includeEof) {
      var p = Stream.PassThrough();
      var done, self2 = this;
      function cb() {
        if (typeof self2.cb === strFunction) {
          var callback = self2.cb;
          self2.cb = void 0;
          return callback();
        }
      }
      function pull() {
        var packet;
        if (self2.buffer && self2.buffer.length) {
          if (typeof eof === "number") {
            packet = self2.buffer.slice(0, eof);
            self2.buffer = self2.buffer.slice(eof);
            eof -= packet.length;
            done = !eof;
          } else {
            var match = self2.buffer.indexOf(eof);
            if (match !== -1) {
              self2.match = match;
              if (includeEof)
                match = match + eof.length;
              packet = self2.buffer.slice(0, match);
              self2.buffer = self2.buffer.slice(match);
              done = true;
            } else {
              var len = self2.buffer.length - eof.length;
              if (len <= 0) {
                cb();
              } else {
                packet = self2.buffer.slice(0, len);
                self2.buffer = self2.buffer.slice(len);
              }
            }
          }
          if (packet)
            p.write(packet, function() {
              if (self2.buffer.length === 0 || eof.length && self2.buffer.length <= eof.length)
                cb();
            });
        }
        if (!done) {
          if (self2.finished) {
            self2.removeListener("chunk", pull);
            self2.emit("error", new Error("FILE_ENDED"));
            return;
          }
        } else {
          self2.removeListener("chunk", pull);
          p.end();
        }
      }
      self2.on("chunk", pull);
      pull();
      return p;
    };
    PullStream.prototype.pull = function(eof, includeEof) {
      if (eof === 0)
        return Promise2.resolve("");
      if (!isNaN(eof) && this.buffer.length > eof) {
        var data = this.buffer.slice(0, eof);
        this.buffer = this.buffer.slice(eof);
        return Promise2.resolve(data);
      }
      var buffer = Buffer2.from(""), self2 = this;
      var concatStream = Stream.Transform();
      concatStream._transform = function(d, e, cb) {
        buffer = Buffer2.concat([buffer, d]);
        cb();
      };
      var rejectHandler;
      var pullStreamRejectHandler;
      return new Promise2(function(resolve, reject) {
        rejectHandler = reject;
        pullStreamRejectHandler = function(e) {
          self2.__emittedError = e;
          reject(e);
        };
        if (self2.finished)
          return reject(new Error("FILE_ENDED"));
        self2.once("error", pullStreamRejectHandler);
        self2.stream(eof, includeEof).on("error", reject).pipe(concatStream).on("finish", function() {
          resolve(buffer);
        }).on("error", reject);
      }).finally(function() {
        self2.removeListener("error", rejectHandler);
        self2.removeListener("error", pullStreamRejectHandler);
      });
    };
    PullStream.prototype._read = function() {
    };
    module2.exports = PullStream;
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/NoopStream.js
var require_NoopStream = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/NoopStream.js"(exports2, module2) {
    "use strict";
    var Stream = require("stream");
    var util = require("util");
    if (!Stream.Writable || !Stream.Writable.prototype.destroy)
      Stream = require_readable();
    function NoopStream() {
      if (!(this instanceof NoopStream)) {
        return new NoopStream();
      }
      Stream.Transform.call(this);
    }
    util.inherits(NoopStream, Stream.Transform);
    NoopStream.prototype._transform = function(d, e, cb) {
      cb();
    };
    module2.exports = NoopStream;
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/BufferStream.js
var require_BufferStream = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/BufferStream.js"(exports2, module2) {
    "use strict";
    var Promise2 = require_bluebird();
    var Stream = require("stream");
    var Buffer2 = require_Buffer();
    if (!Stream.Writable || !Stream.Writable.prototype.destroy)
      Stream = require_readable();
    module2.exports = function(entry) {
      return new Promise2(function(resolve, reject) {
        var chunks = [];
        var bufferStream = Stream.Transform().on("finish", function() {
          resolve(Buffer2.concat(chunks));
        }).on("error", reject);
        bufferStream._transform = function(d, e, cb) {
          chunks.push(d);
          cb();
        };
        entry.on("error", reject).pipe(bufferStream);
      });
    };
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/parseExtraField.js
var require_parseExtraField = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/parseExtraField.js"(exports2, module2) {
    "use strict";
    var binary = require_binary();
    module2.exports = function(extraField, vars) {
      var extra;
      while (!extra && extraField && extraField.length) {
        var candidateExtra = binary.parse(extraField).word16lu("signature").word16lu("partsize").word64lu("uncompressedSize").word64lu("compressedSize").word64lu("offset").word64lu("disknum").vars;
        if (candidateExtra.signature === 1) {
          extra = candidateExtra;
        } else {
          extraField = extraField.slice(candidateExtra.partsize + 4);
        }
      }
      extra = extra || {};
      if (vars.compressedSize === 4294967295)
        vars.compressedSize = extra.compressedSize;
      if (vars.uncompressedSize === 4294967295)
        vars.uncompressedSize = extra.uncompressedSize;
      if (vars.offsetToLocalFileHeader === 4294967295)
        vars.offsetToLocalFileHeader = extra.offset;
      return extra;
    };
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/parseDateTime.js
var require_parseDateTime = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/parseDateTime.js"(exports2, module2) {
    "use strict";
    module2.exports = function parseDateTime(date, time) {
      const day = date & 31;
      const month = date >> 5 & 15;
      const year = (date >> 9 & 127) + 1980;
      const seconds = time ? (time & 31) * 2 : 0;
      const minutes = time ? time >> 5 & 63 : 0;
      const hours = time ? time >> 11 : 0;
      return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    };
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/parse.js
var require_parse = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/parse.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var zlib = require("zlib");
    var Stream = require("stream");
    var binary = require_binary();
    var Promise2 = require_bluebird();
    var PullStream = require_PullStream();
    var NoopStream = require_NoopStream();
    var BufferStream = require_BufferStream();
    var parseExtraField = require_parseExtraField();
    var Buffer2 = require_Buffer();
    var parseDateTime = require_parseDateTime();
    if (!Stream.Writable || !Stream.Writable.prototype.destroy)
      Stream = require_readable();
    var endDirectorySignature = Buffer2.alloc(4);
    endDirectorySignature.writeUInt32LE(101010256, 0);
    function Parse2(opts) {
      if (!(this instanceof Parse2)) {
        return new Parse2(opts);
      }
      var self2 = this;
      self2._opts = opts || { verbose: false };
      PullStream.call(self2, self2._opts);
      self2.on("finish", function() {
        self2.emit("end");
        self2.emit("close");
      });
      self2._readRecord().catch(function(e) {
        if (!self2.__emittedError || self2.__emittedError !== e)
          self2.emit("error", e);
      });
    }
    util.inherits(Parse2, PullStream);
    Parse2.prototype._readRecord = function() {
      var self2 = this;
      return self2.pull(4).then(function(data) {
        if (data.length === 0)
          return;
        var signature = data.readUInt32LE(0);
        if (signature === 875721283) {
          return self2._readCrxHeader();
        }
        if (signature === 67324752) {
          return self2._readFile();
        } else if (signature === 33639248) {
          self2.reachedCD = true;
          return self2._readCentralDirectoryFileHeader();
        } else if (signature === 101010256) {
          return self2._readEndOfCentralDirectoryRecord();
        } else if (self2.reachedCD) {
          var includeEof = true;
          return self2.pull(endDirectorySignature, includeEof).then(function() {
            return self2._readEndOfCentralDirectoryRecord();
          });
        } else
          self2.emit("error", new Error("invalid signature: 0x" + signature.toString(16)));
      });
    };
    Parse2.prototype._readCrxHeader = function() {
      var self2 = this;
      return self2.pull(12).then(function(data) {
        self2.crxHeader = binary.parse(data).word32lu("version").word32lu("pubKeyLength").word32lu("signatureLength").vars;
        return self2.pull(self2.crxHeader.pubKeyLength + self2.crxHeader.signatureLength);
      }).then(function(data) {
        self2.crxHeader.publicKey = data.slice(0, self2.crxHeader.pubKeyLength);
        self2.crxHeader.signature = data.slice(self2.crxHeader.pubKeyLength);
        self2.emit("crx-header", self2.crxHeader);
        return self2._readRecord();
      });
    };
    Parse2.prototype._readFile = function() {
      var self2 = this;
      return self2.pull(26).then(function(data) {
        var vars = binary.parse(data).word16lu("versionsNeededToExtract").word16lu("flags").word16lu("compressionMethod").word16lu("lastModifiedTime").word16lu("lastModifiedDate").word32lu("crc32").word32lu("compressedSize").word32lu("uncompressedSize").word16lu("fileNameLength").word16lu("extraFieldLength").vars;
        vars.lastModifiedDateTime = parseDateTime(vars.lastModifiedDate, vars.lastModifiedTime);
        if (self2.crxHeader)
          vars.crxHeader = self2.crxHeader;
        return self2.pull(vars.fileNameLength).then(function(fileNameBuffer) {
          var fileName = fileNameBuffer.toString("utf8");
          var entry = Stream.PassThrough();
          var __autodraining = false;
          entry.autodrain = function() {
            __autodraining = true;
            var draining = entry.pipe(NoopStream());
            draining.promise = function() {
              return new Promise2(function(resolve, reject) {
                draining.on("finish", resolve);
                draining.on("error", reject);
              });
            };
            return draining;
          };
          entry.buffer = function() {
            return BufferStream(entry);
          };
          entry.path = fileName;
          entry.props = {};
          entry.props.path = fileName;
          entry.props.pathBuffer = fileNameBuffer;
          entry.props.flags = {
            "isUnicode": (vars.flags & 2048) != 0
          };
          entry.type = vars.uncompressedSize === 0 && /[\/\\]$/.test(fileName) ? "Directory" : "File";
          if (self2._opts.verbose) {
            if (entry.type === "Directory") {
              console.log("   creating:", fileName);
            } else if (entry.type === "File") {
              if (vars.compressionMethod === 0) {
                console.log(" extracting:", fileName);
              } else {
                console.log("  inflating:", fileName);
              }
            }
          }
          return self2.pull(vars.extraFieldLength).then(function(extraField) {
            var extra = parseExtraField(extraField, vars);
            entry.vars = vars;
            entry.extra = extra;
            if (self2._opts.forceStream) {
              self2.push(entry);
            } else {
              self2.emit("entry", entry);
              if (self2._readableState.pipesCount || self2._readableState.pipes && self2._readableState.pipes.length)
                self2.push(entry);
            }
            if (self2._opts.verbose)
              console.log({
                filename: fileName,
                vars,
                extra
              });
            var fileSizeKnown = !(vars.flags & 8) || vars.compressedSize > 0, eof;
            entry.__autodraining = __autodraining;
            var inflater = vars.compressionMethod && !__autodraining ? zlib.createInflateRaw() : Stream.PassThrough();
            if (fileSizeKnown) {
              entry.size = vars.uncompressedSize;
              eof = vars.compressedSize;
            } else {
              eof = Buffer2.alloc(4);
              eof.writeUInt32LE(134695760, 0);
            }
            return new Promise2(function(resolve, reject) {
              self2.stream(eof).pipe(inflater).on("error", function(err) {
                self2.emit("error", err);
              }).pipe(entry).on("finish", function() {
                return fileSizeKnown ? self2._readRecord().then(resolve).catch(reject) : self2._processDataDescriptor(entry).then(resolve).catch(reject);
              });
            });
          });
        });
      });
    };
    Parse2.prototype._processDataDescriptor = function(entry) {
      var self2 = this;
      return self2.pull(16).then(function(data) {
        var vars = binary.parse(data).word32lu("dataDescriptorSignature").word32lu("crc32").word32lu("compressedSize").word32lu("uncompressedSize").vars;
        entry.size = vars.uncompressedSize;
        return self2._readRecord();
      });
    };
    Parse2.prototype._readCentralDirectoryFileHeader = function() {
      var self2 = this;
      return self2.pull(42).then(function(data) {
        var vars = binary.parse(data).word16lu("versionMadeBy").word16lu("versionsNeededToExtract").word16lu("flags").word16lu("compressionMethod").word16lu("lastModifiedTime").word16lu("lastModifiedDate").word32lu("crc32").word32lu("compressedSize").word32lu("uncompressedSize").word16lu("fileNameLength").word16lu("extraFieldLength").word16lu("fileCommentLength").word16lu("diskNumber").word16lu("internalFileAttributes").word32lu("externalFileAttributes").word32lu("offsetToLocalFileHeader").vars;
        return self2.pull(vars.fileNameLength).then(function(fileName) {
          vars.fileName = fileName.toString("utf8");
          return self2.pull(vars.extraFieldLength);
        }).then(function(extraField) {
          return self2.pull(vars.fileCommentLength);
        }).then(function(fileComment) {
          return self2._readRecord();
        });
      });
    };
    Parse2.prototype._readEndOfCentralDirectoryRecord = function() {
      var self2 = this;
      return self2.pull(18).then(function(data) {
        var vars = binary.parse(data).word16lu("diskNumber").word16lu("diskStart").word16lu("numberOfRecordsOnDisk").word16lu("numberOfRecords").word32lu("sizeOfCentralDirectory").word32lu("offsetToStartOfCentralDirectory").word16lu("commentLength").vars;
        return self2.pull(vars.commentLength).then(function(comment) {
          comment = comment.toString("utf8");
          self2.end();
          self2.push(null);
        });
      });
    };
    Parse2.prototype.promise = function() {
      var self2 = this;
      return new Promise2(function(resolve, reject) {
        self2.on("finish", resolve);
        self2.on("error", reject);
      });
    };
    module2.exports = Parse2;
  }
});

// ../../../node_modules/.pnpm/duplexer2@0.1.4/node_modules/duplexer2/index.js
var require_duplexer2 = __commonJS({
  "../../../node_modules/.pnpm/duplexer2@0.1.4/node_modules/duplexer2/index.js"(exports2, module2) {
    "use strict";
    var stream = require_readable();
    function DuplexWrapper(options, writable, readable) {
      if (typeof readable === "undefined") {
        readable = writable;
        writable = options;
        options = null;
      }
      stream.Duplex.call(this, options);
      if (typeof readable.read !== "function") {
        readable = new stream.Readable(options).wrap(readable);
      }
      this._writable = writable;
      this._readable = readable;
      this._waiting = false;
      var self2 = this;
      writable.once("finish", function() {
        self2.end();
      });
      this.once("finish", function() {
        writable.end();
      });
      readable.on("readable", function() {
        if (self2._waiting) {
          self2._waiting = false;
          self2._read();
        }
      });
      readable.once("end", function() {
        self2.push(null);
      });
      if (!options || typeof options.bubbleErrors === "undefined" || options.bubbleErrors) {
        writable.on("error", function(err) {
          self2.emit("error", err);
        });
        readable.on("error", function(err) {
          self2.emit("error", err);
        });
      }
    }
    DuplexWrapper.prototype = Object.create(stream.Duplex.prototype, { constructor: { value: DuplexWrapper } });
    DuplexWrapper.prototype._write = function _write(input, encoding, done) {
      this._writable.write(input, encoding, done);
    };
    DuplexWrapper.prototype._read = function _read() {
      var buf;
      var reads = 0;
      while ((buf = this._readable.read()) !== null) {
        this.push(buf);
        reads++;
      }
      if (reads === 0) {
        this._waiting = true;
      }
    };
    module2.exports = function duplex2(options, writable, readable) {
      return new DuplexWrapper(options, writable, readable);
    };
    module2.exports.DuplexWrapper = DuplexWrapper;
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/parseOne.js
var require_parseOne = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/parseOne.js"(exports2, module2) {
    "use strict";
    var Stream = require("stream");
    var Parse2 = require_parse();
    var duplexer2 = require_duplexer2();
    var BufferStream = require_BufferStream();
    if (!Stream.Writable || !Stream.Writable.prototype.destroy)
      Stream = require_readable();
    function parseOne(match, opts) {
      var inStream = Stream.PassThrough({ objectMode: true });
      var outStream = Stream.PassThrough();
      var transform = Stream.Transform({ objectMode: true });
      var re = match instanceof RegExp ? match : match && new RegExp(match);
      var found;
      transform._transform = function(entry, e, cb) {
        if (found || re && !re.exec(entry.path)) {
          entry.autodrain();
          return cb();
        } else {
          found = true;
          out.emit("entry", entry);
          entry.on("error", function(e2) {
            outStream.emit("error", e2);
          });
          entry.pipe(outStream).on("error", function(err) {
            cb(err);
          }).on("finish", function(d) {
            cb(null, d);
          });
        }
      };
      inStream.pipe(Parse2(opts)).on("error", function(err) {
        outStream.emit("error", err);
      }).pipe(transform).on("error", Object).on("finish", function() {
        if (!found)
          outStream.emit("error", new Error("PATTERN_NOT_FOUND"));
        else
          outStream.end();
      });
      var out = duplexer2(inStream, outStream);
      out.buffer = function() {
        return BufferStream(outStream);
      };
      return out;
    }
    module2.exports = parseOne;
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/abstract.js
var require_abstract = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/abstract.js"(exports2, module2) {
    "use strict";
    module2.exports = Abstract;
    var Stream = require("stream").Stream;
    var inherits2 = require_inherits();
    function Abstract() {
      Stream.call(this);
    }
    inherits2(Abstract, Stream);
    Abstract.prototype.on = function(ev, fn) {
      if (ev === "ready" && this.ready) {
        process.nextTick(fn.bind(this));
      } else {
        Stream.prototype.on.call(this, ev, fn);
      }
      return this;
    };
    Abstract.prototype.abort = function() {
      this._aborted = true;
      this.emit("abort");
    };
    Abstract.prototype.destroy = function() {
    };
    Abstract.prototype.warn = function(msg, code) {
      var self2 = this;
      var er = decorate(msg, code, self2);
      if (!self2.listeners("warn")) {
        console.error(
          "%s %s\npath = %s\nsyscall = %s\nfstream_type = %s\nfstream_path = %s\nfstream_unc_path = %s\nfstream_class = %s\nfstream_stack =\n%s\n",
          code || "UNKNOWN",
          er.stack,
          er.path,
          er.syscall,
          er.fstream_type,
          er.fstream_path,
          er.fstream_unc_path,
          er.fstream_class,
          er.fstream_stack.join("\n")
        );
      } else {
        self2.emit("warn", er);
      }
    };
    Abstract.prototype.info = function(msg, code) {
      this.emit("info", msg, code);
    };
    Abstract.prototype.error = function(msg, code, th) {
      var er = decorate(msg, code, this);
      if (th)
        throw er;
      else
        this.emit("error", er);
    };
    function decorate(er, code, self2) {
      if (!(er instanceof Error))
        er = new Error(er);
      er.code = er.code || code;
      er.path = er.path || self2.path;
      er.fstream_type = er.fstream_type || self2.type;
      er.fstream_path = er.fstream_path || self2.path;
      if (self2._path !== self2.path) {
        er.fstream_unc_path = er.fstream_unc_path || self2._path;
      }
      if (self2.linkpath) {
        er.fstream_linkpath = er.fstream_linkpath || self2.linkpath;
      }
      er.fstream_class = er.fstream_class || self2.constructor.name;
      er.fstream_stack = er.fstream_stack || new Error().stack.split(/\n/).slice(3).map(function(s) {
        return s.replace(/^ {4}at /, "");
      });
      return er;
    }
  }
});

// ../../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  "../../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js"(exports2, module2) {
    "use strict";
    var constants = require("constants");
    var origCwd = process.cwd;
    var cwd = null;
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
    process.cwd = function() {
      if (!cwd)
        cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {
    }
    if (typeof process.chdir === "function") {
      chdir = process.chdir;
      process.chdir = function(d) {
        cwd = null;
        chdir.call(process, d);
      };
      if (Object.setPrototypeOf)
        Object.setPrototypeOf(process.chdir, chdir);
    }
    var chdir;
    module2.exports = patch;
    function patch(fs) {
      if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs);
      }
      if (!fs.lutimes) {
        patchLutimes(fs);
      }
      fs.chown = chownFix(fs.chown);
      fs.fchown = chownFix(fs.fchown);
      fs.lchown = chownFix(fs.lchown);
      fs.chmod = chmodFix(fs.chmod);
      fs.fchmod = chmodFix(fs.fchmod);
      fs.lchmod = chmodFix(fs.lchmod);
      fs.chownSync = chownFixSync(fs.chownSync);
      fs.fchownSync = chownFixSync(fs.fchownSync);
      fs.lchownSync = chownFixSync(fs.lchownSync);
      fs.chmodSync = chmodFixSync(fs.chmodSync);
      fs.fchmodSync = chmodFixSync(fs.fchmodSync);
      fs.lchmodSync = chmodFixSync(fs.lchmodSync);
      fs.stat = statFix(fs.stat);
      fs.fstat = statFix(fs.fstat);
      fs.lstat = statFix(fs.lstat);
      fs.statSync = statFixSync(fs.statSync);
      fs.fstatSync = statFixSync(fs.fstatSync);
      fs.lstatSync = statFixSync(fs.lstatSync);
      if (fs.chmod && !fs.lchmod) {
        fs.lchmod = function(path, mode, cb) {
          if (cb)
            process.nextTick(cb);
        };
        fs.lchmodSync = function() {
        };
      }
      if (fs.chown && !fs.lchown) {
        fs.lchown = function(path, uid, gid, cb) {
          if (cb)
            process.nextTick(cb);
        };
        fs.lchownSync = function() {
        };
      }
      if (platform === "win32") {
        fs.rename = typeof fs.rename !== "function" ? fs.rename : function(fs$rename) {
          function rename(from, to, cb) {
            var start = Date.now();
            var backoff = 0;
            fs$rename(from, to, function CB(er) {
              if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
                setTimeout(function() {
                  fs.stat(to, function(stater, st) {
                    if (stater && stater.code === "ENOENT")
                      fs$rename(from, to, CB);
                    else
                      cb(er);
                  });
                }, backoff);
                if (backoff < 100)
                  backoff += 10;
                return;
              }
              if (cb)
                cb(er);
            });
          }
          if (Object.setPrototypeOf)
            Object.setPrototypeOf(rename, fs$rename);
          return rename;
        }(fs.rename);
      }
      fs.read = typeof fs.read !== "function" ? fs.read : function(fs$read) {
        function read(fd, buffer, offset, length, position, callback_) {
          var callback;
          if (callback_ && typeof callback_ === "function") {
            var eagCounter = 0;
            callback = function(er, _, __) {
              if (er && er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                return fs$read.call(fs, fd, buffer, offset, length, position, callback);
              }
              callback_.apply(this, arguments);
            };
          }
          return fs$read.call(fs, fd, buffer, offset, length, position, callback);
        }
        if (Object.setPrototypeOf)
          Object.setPrototypeOf(read, fs$read);
        return read;
      }(fs.read);
      fs.readSync = typeof fs.readSync !== "function" ? fs.readSync : function(fs$readSync) {
        return function(fd, buffer, offset, length, position) {
          var eagCounter = 0;
          while (true) {
            try {
              return fs$readSync.call(fs, fd, buffer, offset, length, position);
            } catch (er) {
              if (er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                continue;
              }
              throw er;
            }
          }
        };
      }(fs.readSync);
      function patchLchmod(fs2) {
        fs2.lchmod = function(path, mode, callback) {
          fs2.open(
            path,
            constants.O_WRONLY | constants.O_SYMLINK,
            mode,
            function(err, fd) {
              if (err) {
                if (callback)
                  callback(err);
                return;
              }
              fs2.fchmod(fd, mode, function(err2) {
                fs2.close(fd, function(err22) {
                  if (callback)
                    callback(err2 || err22);
                });
              });
            }
          );
        };
        fs2.lchmodSync = function(path, mode) {
          var fd = fs2.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
          var threw = true;
          var ret2;
          try {
            ret2 = fs2.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs2.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs2.closeSync(fd);
            }
          }
          return ret2;
        };
      }
      function patchLutimes(fs2) {
        if (constants.hasOwnProperty("O_SYMLINK") && fs2.futimes) {
          fs2.lutimes = function(path, at, mt, cb) {
            fs2.open(path, constants.O_SYMLINK, function(er, fd) {
              if (er) {
                if (cb)
                  cb(er);
                return;
              }
              fs2.futimes(fd, at, mt, function(er2) {
                fs2.close(fd, function(er22) {
                  if (cb)
                    cb(er2 || er22);
                });
              });
            });
          };
          fs2.lutimesSync = function(path, at, mt) {
            var fd = fs2.openSync(path, constants.O_SYMLINK);
            var ret2;
            var threw = true;
            try {
              ret2 = fs2.futimesSync(fd, at, mt);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs2.closeSync(fd);
                } catch (er) {
                }
              } else {
                fs2.closeSync(fd);
              }
            }
            return ret2;
          };
        } else if (fs2.futimes) {
          fs2.lutimes = function(_a, _b, _c, cb) {
            if (cb)
              process.nextTick(cb);
          };
          fs2.lutimesSync = function() {
          };
        }
      }
      function chmodFix(orig) {
        if (!orig)
          return orig;
        return function(target, mode, cb) {
          return orig.call(fs, target, mode, function(er) {
            if (chownErOk(er))
              er = null;
            if (cb)
              cb.apply(this, arguments);
          });
        };
      }
      function chmodFixSync(orig) {
        if (!orig)
          return orig;
        return function(target, mode) {
          try {
            return orig.call(fs, target, mode);
          } catch (er) {
            if (!chownErOk(er))
              throw er;
          }
        };
      }
      function chownFix(orig) {
        if (!orig)
          return orig;
        return function(target, uid, gid, cb) {
          return orig.call(fs, target, uid, gid, function(er) {
            if (chownErOk(er))
              er = null;
            if (cb)
              cb.apply(this, arguments);
          });
        };
      }
      function chownFixSync(orig) {
        if (!orig)
          return orig;
        return function(target, uid, gid) {
          try {
            return orig.call(fs, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er))
              throw er;
          }
        };
      }
      function statFix(orig) {
        if (!orig)
          return orig;
        return function(target, options, cb) {
          if (typeof options === "function") {
            cb = options;
            options = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0)
                stats.uid += 4294967296;
              if (stats.gid < 0)
                stats.gid += 4294967296;
            }
            if (cb)
              cb.apply(this, arguments);
          }
          return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
        };
      }
      function statFixSync(orig) {
        if (!orig)
          return orig;
        return function(target, options) {
          var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
          if (stats) {
            if (stats.uid < 0)
              stats.uid += 4294967296;
            if (stats.gid < 0)
              stats.gid += 4294967296;
          }
          return stats;
        };
      }
      function chownErOk(er) {
        if (!er)
          return true;
        if (er.code === "ENOSYS")
          return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === "EINVAL" || er.code === "EPERM")
            return true;
        }
        return false;
      }
    }
  }
});

// ../../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  "../../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js"(exports2, module2) {
    "use strict";
    var Stream = require("stream").Stream;
    module2.exports = legacy;
    function legacy(fs) {
      return {
        ReadStream,
        WriteStream
      };
      function ReadStream(path, options) {
        if (!(this instanceof ReadStream))
          return new ReadStream(path, options);
        Stream.call(this);
        var self2 = this;
        this.path = path;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = "r";
        this.mode = 438;
        this.bufferSize = 64 * 1024;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.encoding)
          this.setEncoding(this.encoding);
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if ("number" !== typeof this.end) {
            throw TypeError("end must be a Number");
          }
          if (this.start > this.end) {
            throw new Error("start must be <= end");
          }
          this.pos = this.start;
        }
        if (this.fd !== null) {
          process.nextTick(function() {
            self2._read();
          });
          return;
        }
        fs.open(this.path, this.flags, this.mode, function(err, fd) {
          if (err) {
            self2.emit("error", err);
            self2.readable = false;
            return;
          }
          self2.fd = fd;
          self2.emit("open", fd);
          self2._read();
        });
      }
      function WriteStream(path, options) {
        if (!(this instanceof WriteStream))
          return new WriteStream(path, options);
        Stream.call(this);
        this.path = path;
        this.fd = null;
        this.writable = true;
        this.flags = "w";
        this.encoding = "binary";
        this.mode = 438;
        this.bytesWritten = 0;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.start < 0) {
            throw new Error("start must be >= zero");
          }
          this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
          this._open = fs.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
          this.flush();
        }
      }
    }
  }
});

// ../../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  "../../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js"(exports2, module2) {
    "use strict";
    module2.exports = clone;
    var getPrototypeOf = Object.getPrototypeOf || function(obj2) {
      return obj2.__proto__;
    };
    function clone(obj2) {
      if (obj2 === null || typeof obj2 !== "object")
        return obj2;
      if (obj2 instanceof Object)
        var copy = { __proto__: getPrototypeOf(obj2) };
      else
        var copy = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj2).forEach(function(key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj2, key));
      });
      return copy;
    }
  }
});

// ../../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  "../../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var polyfills = require_polyfills();
    var legacy = require_legacy_streams();
    var clone = require_clone();
    var util = require("util");
    var gracefulQueue;
    var previousSymbol;
    if (typeof Symbol === "function" && typeof Symbol.for === "function") {
      gracefulQueue = Symbol.for("graceful-fs.queue");
      previousSymbol = Symbol.for("graceful-fs.previous");
    } else {
      gracefulQueue = "___graceful-fs.queue";
      previousSymbol = "___graceful-fs.previous";
    }
    function noop() {
    }
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function() {
          return queue2;
        }
      });
    }
    var debug = noop;
    if (util.debuglog)
      debug = util.debuglog("gfs4");
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
      debug = function() {
        var m = util.format.apply(util, arguments);
        m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
        console.error(m);
      };
    if (!fs[gracefulQueue]) {
      queue = global[gracefulQueue] || [];
      publishQueue(fs, queue);
      fs.close = function(fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs, fd, function(err) {
            if (!err) {
              resetQueue();
            }
            if (typeof cb === "function")
              cb.apply(this, arguments);
          });
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close
        });
        return close;
      }(fs.close);
      fs.closeSync = function(fs$closeSync) {
        function closeSync(fd) {
          fs$closeSync.apply(fs, arguments);
          resetQueue();
        }
        Object.defineProperty(closeSync, previousSymbol, {
          value: fs$closeSync
        });
        return closeSync;
      }(fs.closeSync);
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
        process.on("exit", function() {
          debug(fs[gracefulQueue]);
          require("assert").equal(fs[gracefulQueue].length, 0);
        });
      }
    }
    var queue;
    if (!global[gracefulQueue]) {
      publishQueue(global, fs[gracefulQueue]);
    }
    module2.exports = patch(clone(fs));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
      module2.exports = patch(fs);
      fs.__patched = true;
    }
    function patch(fs2) {
      polyfills(fs2);
      fs2.gracefulify = patch;
      fs2.createReadStream = createReadStream;
      fs2.createWriteStream = createWriteStream;
      var fs$readFile = fs2.readFile;
      fs2.readFile = readFile;
      function readFile(path, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$readFile(path, options, cb);
        function go$readFile(path2, options2, cb2, startTime) {
          return fs$readFile(path2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$readFile, [path2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$writeFile = fs2.writeFile;
      fs2.writeFile = writeFile;
      function writeFile(path, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$writeFile(path, data, options, cb);
        function go$writeFile(path2, data2, options2, cb2, startTime) {
          return fs$writeFile(path2, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$writeFile, [path2, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$appendFile = fs2.appendFile;
      if (fs$appendFile)
        fs2.appendFile = appendFile;
      function appendFile(path, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$appendFile(path, data, options, cb);
        function go$appendFile(path2, data2, options2, cb2, startTime) {
          return fs$appendFile(path2, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$appendFile, [path2, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$copyFile = fs2.copyFile;
      if (fs$copyFile)
        fs2.copyFile = copyFile;
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === "function") {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$readdir = fs2.readdir;
      fs2.readdir = readdir;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir(path, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path2, options2, cb2, startTime) {
          return fs$readdir(path2, fs$readdirCallback(
            path2,
            options2,
            cb2,
            startTime
          ));
        } : function go$readdir2(path2, options2, cb2, startTime) {
          return fs$readdir(path2, options2, fs$readdirCallback(
            path2,
            options2,
            cb2,
            startTime
          ));
        };
        return go$readdir(path, options, cb);
        function fs$readdirCallback(path2, options2, cb2, startTime) {
          return function(err, files) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([
                go$readdir,
                [path2, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (files && files.sort)
                files.sort();
              if (typeof cb2 === "function")
                cb2.call(this, err, files);
            }
          };
        }
      }
      if (process.version.substr(0, 4) === "v0.8") {
        var legStreams = legacy(fs2);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }
      var fs$ReadStream = fs2.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }
      var fs$WriteStream = fs2.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }
      Object.defineProperty(fs2, "ReadStream", {
        get: function() {
          return ReadStream;
        },
        set: function(val) {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(fs2, "WriteStream", {
        get: function() {
          return WriteStream;
        },
        set: function(val) {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileReadStream = ReadStream;
      Object.defineProperty(fs2, "FileReadStream", {
        get: function() {
          return FileReadStream;
        },
        set: function(val) {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs2, "FileWriteStream", {
        get: function() {
          return FileWriteStream;
        },
        set: function(val) {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      function ReadStream(path, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this;
        else
          return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
      }
      function ReadStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            if (that.autoClose)
              that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
            that.read();
          }
        });
      }
      function WriteStream(path, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this;
        else
          return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
      }
      function WriteStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
          }
        });
      }
      function createReadStream(path, options) {
        return new fs2.ReadStream(path, options);
      }
      function createWriteStream(path, options) {
        return new fs2.WriteStream(path, options);
      }
      var fs$open = fs2.open;
      fs2.open = open;
      function open(path, flags, mode, cb) {
        if (typeof mode === "function")
          cb = mode, mode = null;
        return go$open(path, flags, mode, cb);
        function go$open(path2, flags2, mode2, cb2, startTime) {
          return fs$open(path2, flags2, mode2, function(err, fd) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$open, [path2, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      return fs2;
    }
    function enqueue(elem) {
      debug("ENQUEUE", elem[0].name, elem[1]);
      fs[gracefulQueue].push(elem);
      retry2();
    }
    var retryTimer;
    function resetQueue() {
      var now = Date.now();
      for (var i = 0; i < fs[gracefulQueue].length; ++i) {
        if (fs[gracefulQueue][i].length > 2) {
          fs[gracefulQueue][i][3] = now;
          fs[gracefulQueue][i][4] = now;
        }
      }
      retry2();
    }
    function retry2() {
      clearTimeout(retryTimer);
      retryTimer = void 0;
      if (fs[gracefulQueue].length === 0)
        return;
      var elem = fs[gracefulQueue].shift();
      var fn = elem[0];
      var args = elem[1];
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];
      if (startTime === void 0) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args);
      } else if (Date.now() - startTime >= 6e4) {
        debug("TIMEOUT", fn.name, args);
        var cb = args.pop();
        if (typeof cb === "function")
          cb.call(null, err);
      } else {
        var sinceAttempt = Date.now() - lastTime;
        var sinceStart = Math.max(lastTime - startTime, 1);
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        if (sinceAttempt >= desiredDelay) {
          debug("RETRY", fn.name, args);
          fn.apply(null, args.concat([startTime]));
        } else {
          fs[gracefulQueue].push(elem);
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry2, 0);
      }
    }
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/get-type.js
var require_get_type = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/get-type.js"(exports2, module2) {
    "use strict";
    module2.exports = getType;
    function getType(st) {
      var types = [
        "Directory",
        "File",
        "SymbolicLink",
        "Link",
        // special for hardlinks from tarballs
        "BlockDevice",
        "CharacterDevice",
        "FIFO",
        "Socket"
      ];
      var type;
      if (st.type && types.indexOf(st.type) !== -1) {
        st[st.type] = true;
        return st.type;
      }
      for (var i = 0, l2 = types.length; i < l2; i++) {
        type = types[i];
        var is = st[type] || st["is" + type];
        if (typeof is === "function")
          is = is.call(st);
        if (is) {
          st[type] = true;
          st.type = type;
          return type;
        }
      }
      return null;
    }
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/link-reader.js
var require_link_reader = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/link-reader.js"(exports2, module2) {
    "use strict";
    module2.exports = LinkReader;
    var fs = require_graceful_fs();
    var inherits2 = require_inherits();
    var Reader = require_reader();
    inherits2(LinkReader, Reader);
    function LinkReader(props) {
      var self2 = this;
      if (!(self2 instanceof LinkReader)) {
        throw new Error("LinkReader must be called as constructor.");
      }
      if (!(props.type === "Link" && props.Link || props.type === "SymbolicLink" && props.SymbolicLink)) {
        throw new Error("Non-link type " + props.type);
      }
      Reader.call(self2, props);
    }
    LinkReader.prototype._stat = function(currentStat) {
      var self2 = this;
      fs.readlink(self2._path, function(er, linkpath) {
        if (er)
          return self2.error(er);
        self2.linkpath = self2.props.linkpath = linkpath;
        self2.emit("linkpath", linkpath);
        Reader.prototype._stat.call(self2, currentStat);
      });
    };
    LinkReader.prototype._read = function() {
      var self2 = this;
      if (self2._paused)
        return;
      if (!self2._ended) {
        self2.emit("end");
        self2.emit("close");
        self2._ended = true;
      }
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/dir-reader.js
var require_dir_reader = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/dir-reader.js"(exports2, module2) {
    "use strict";
    module2.exports = DirReader;
    var fs = require_graceful_fs();
    var inherits2 = require_inherits();
    var path = require("path");
    var Reader = require_reader();
    var assert = require("assert").ok;
    inherits2(DirReader, Reader);
    function DirReader(props) {
      var self2 = this;
      if (!(self2 instanceof DirReader)) {
        throw new Error("DirReader must be called as constructor.");
      }
      if (props.type !== "Directory" || !props.Directory) {
        throw new Error("Non-directory type " + props.type);
      }
      self2.entries = null;
      self2._index = -1;
      self2._paused = false;
      self2._length = -1;
      if (props.sort) {
        this.sort = props.sort;
      }
      Reader.call(this, props);
    }
    DirReader.prototype._getEntries = function() {
      var self2 = this;
      if (self2._gotEntries)
        return;
      self2._gotEntries = true;
      fs.readdir(self2._path, function(er, entries) {
        if (er)
          return self2.error(er);
        self2.entries = entries;
        self2.emit("entries", entries);
        if (self2._paused)
          self2.once("resume", processEntries);
        else
          processEntries();
        function processEntries() {
          self2._length = self2.entries.length;
          if (typeof self2.sort === "function") {
            self2.entries = self2.entries.sort(self2.sort.bind(self2));
          }
          self2._read();
        }
      });
    };
    DirReader.prototype._read = function() {
      var self2 = this;
      if (!self2.entries)
        return self2._getEntries();
      if (self2._paused || self2._currentEntry || self2._aborted) {
        return;
      }
      self2._index++;
      if (self2._index >= self2.entries.length) {
        if (!self2._ended) {
          self2._ended = true;
          self2.emit("end");
          self2.emit("close");
        }
        return;
      }
      var p = path.resolve(self2._path, self2.entries[self2._index]);
      assert(p !== self2._path);
      assert(self2.entries[self2._index]);
      self2._currentEntry = p;
      fs[self2.props.follow ? "stat" : "lstat"](p, function(er, stat) {
        if (er)
          return self2.error(er);
        var who = self2._proxy || self2;
        stat.path = p;
        stat.basename = path.basename(p);
        stat.dirname = path.dirname(p);
        var childProps = self2.getChildProps.call(who, stat);
        childProps.path = p;
        childProps.basename = path.basename(p);
        childProps.dirname = path.dirname(p);
        var entry = Reader(childProps, stat);
        self2._currentEntry = entry;
        entry.on("pause", function(who2) {
          if (!self2._paused && !entry._disowned) {
            self2.pause(who2);
          }
        });
        entry.on("resume", function(who2) {
          if (self2._paused && !entry._disowned) {
            self2.resume(who2);
          }
        });
        entry.on("stat", function(props) {
          self2.emit("_entryStat", entry, props);
          if (entry._aborted)
            return;
          if (entry._paused) {
            entry.once("resume", function() {
              self2.emit("entryStat", entry, props);
            });
          } else
            self2.emit("entryStat", entry, props);
        });
        entry.on("ready", function EMITCHILD() {
          if (self2._paused) {
            entry.pause(self2);
            return self2.once("resume", EMITCHILD);
          }
          if (entry.type === "Socket") {
            self2.emit("socket", entry);
          } else {
            self2.emitEntry(entry);
          }
        });
        var ended = false;
        entry.on("close", onend);
        entry.on("disown", onend);
        function onend() {
          if (ended)
            return;
          ended = true;
          self2.emit("childEnd", entry);
          self2.emit("entryEnd", entry);
          self2._currentEntry = null;
          if (!self2._paused) {
            self2._read();
          }
        }
        entry.on("error", function(er2) {
          if (entry._swallowErrors) {
            self2.warn(er2);
            entry.emit("end");
            entry.emit("close");
          } else {
            self2.emit("error", er2);
          }
        });
        [
          "child",
          "childEnd",
          "warn"
        ].forEach(function(ev) {
          entry.on(ev, self2.emit.bind(self2, ev));
        });
      });
    };
    DirReader.prototype.disown = function(entry) {
      entry.emit("beforeDisown");
      entry._disowned = true;
      entry.parent = entry.root = null;
      if (entry === this._currentEntry) {
        this._currentEntry = null;
      }
      entry.emit("disown");
    };
    DirReader.prototype.getChildProps = function() {
      return {
        depth: this.depth + 1,
        root: this.root || this,
        parent: this,
        follow: this.follow,
        filter: this.filter,
        sort: this.props.sort,
        hardlinks: this.props.hardlinks
      };
    };
    DirReader.prototype.pause = function(who) {
      var self2 = this;
      if (self2._paused)
        return;
      who = who || self2;
      self2._paused = true;
      if (self2._currentEntry && self2._currentEntry.pause) {
        self2._currentEntry.pause(who);
      }
      self2.emit("pause", who);
    };
    DirReader.prototype.resume = function(who) {
      var self2 = this;
      if (!self2._paused)
        return;
      who = who || self2;
      self2._paused = false;
      self2.emit("resume", who);
      if (self2._paused) {
        return;
      }
      if (self2._currentEntry) {
        if (self2._currentEntry.resume)
          self2._currentEntry.resume(who);
      } else
        self2._read();
    };
    DirReader.prototype.emitEntry = function(entry) {
      this.emit("entry", entry);
      this.emit("child", entry);
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/file-reader.js
var require_file_reader = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/file-reader.js"(exports2, module2) {
    "use strict";
    module2.exports = FileReader;
    var fs = require_graceful_fs();
    var inherits2 = require_inherits();
    var Reader = require_reader();
    var EOF = { EOF: true };
    var CLOSE = { CLOSE: true };
    inherits2(FileReader, Reader);
    function FileReader(props) {
      var self2 = this;
      if (!(self2 instanceof FileReader)) {
        throw new Error("FileReader must be called as constructor.");
      }
      if (!(props.type === "Link" && props.Link || props.type === "File" && props.File)) {
        throw new Error("Non-file type " + props.type);
      }
      self2._buffer = [];
      self2._bytesEmitted = 0;
      Reader.call(self2, props);
    }
    FileReader.prototype._getStream = function() {
      var self2 = this;
      var stream = self2._stream = fs.createReadStream(self2._path, self2.props);
      if (self2.props.blksize) {
        stream.bufferSize = self2.props.blksize;
      }
      stream.on("open", self2.emit.bind(self2, "open"));
      stream.on("data", function(c) {
        self2._bytesEmitted += c.length;
        if (!c.length) {
          return;
        } else if (self2._paused || self2._buffer.length) {
          self2._buffer.push(c);
          self2._read();
        } else
          self2.emit("data", c);
      });
      stream.on("end", function() {
        if (self2._paused || self2._buffer.length) {
          self2._buffer.push(EOF);
          self2._read();
        } else {
          self2.emit("end");
        }
        if (self2._bytesEmitted !== self2.props.size) {
          self2.error("Didn't get expected byte count\nexpect: " + self2.props.size + "\nactual: " + self2._bytesEmitted);
        }
      });
      stream.on("close", function() {
        if (self2._paused || self2._buffer.length) {
          self2._buffer.push(CLOSE);
          self2._read();
        } else {
          self2.emit("close");
        }
      });
      stream.on("error", function(e) {
        self2.emit("error", e);
      });
      self2._read();
    };
    FileReader.prototype._read = function() {
      var self2 = this;
      if (self2._paused) {
        return;
      }
      if (!self2._stream) {
        return self2._getStream();
      }
      if (self2._buffer.length) {
        var buf = self2._buffer;
        for (var i = 0, l2 = buf.length; i < l2; i++) {
          var c = buf[i];
          if (c === EOF) {
            self2.emit("end");
          } else if (c === CLOSE) {
            self2.emit("close");
          } else {
            self2.emit("data", c);
          }
          if (self2._paused) {
            self2._buffer = buf.slice(i);
            return;
          }
        }
        self2._buffer.length = 0;
      }
    };
    FileReader.prototype.pause = function(who) {
      var self2 = this;
      if (self2._paused)
        return;
      who = who || self2;
      self2._paused = true;
      if (self2._stream)
        self2._stream.pause();
      self2.emit("pause", who);
    };
    FileReader.prototype.resume = function(who) {
      var self2 = this;
      if (!self2._paused)
        return;
      who = who || self2;
      self2.emit("resume", who);
      self2._paused = false;
      if (self2._stream)
        self2._stream.resume();
      self2._read();
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/socket-reader.js
var require_socket_reader = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/socket-reader.js"(exports2, module2) {
    "use strict";
    module2.exports = SocketReader;
    var inherits2 = require_inherits();
    var Reader = require_reader();
    inherits2(SocketReader, Reader);
    function SocketReader(props) {
      var self2 = this;
      if (!(self2 instanceof SocketReader)) {
        throw new Error("SocketReader must be called as constructor.");
      }
      if (!(props.type === "Socket" && props.Socket)) {
        throw new Error("Non-socket type " + props.type);
      }
      Reader.call(self2, props);
    }
    SocketReader.prototype._read = function() {
      var self2 = this;
      if (self2._paused)
        return;
      if (!self2._ended) {
        self2.emit("end");
        self2.emit("close");
        self2._ended = true;
      }
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/proxy-reader.js
var require_proxy_reader = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/proxy-reader.js"(exports2, module2) {
    "use strict";
    module2.exports = ProxyReader;
    var Reader = require_reader();
    var getType = require_get_type();
    var inherits2 = require_inherits();
    var fs = require_graceful_fs();
    inherits2(ProxyReader, Reader);
    function ProxyReader(props) {
      var self2 = this;
      if (!(self2 instanceof ProxyReader)) {
        throw new Error("ProxyReader must be called as constructor.");
      }
      self2.props = props;
      self2._buffer = [];
      self2.ready = false;
      Reader.call(self2, props);
    }
    ProxyReader.prototype._stat = function() {
      var self2 = this;
      var props = self2.props;
      var stat = props.follow ? "stat" : "lstat";
      fs[stat](props.path, function(er, current) {
        var type;
        if (er || !current) {
          type = "File";
        } else {
          type = getType(current);
        }
        props[type] = true;
        props.type = self2.type = type;
        self2._old = current;
        self2._addProxy(Reader(props, current));
      });
    };
    ProxyReader.prototype._addProxy = function(proxy) {
      var self2 = this;
      if (self2._proxyTarget) {
        return self2.error("proxy already set");
      }
      self2._proxyTarget = proxy;
      proxy._proxy = self2;
      [
        "error",
        "data",
        "end",
        "close",
        "linkpath",
        "entry",
        "entryEnd",
        "child",
        "childEnd",
        "warn",
        "stat"
      ].forEach(function(ev) {
        proxy.on(ev, self2.emit.bind(self2, ev));
      });
      self2.emit("proxy", proxy);
      proxy.on("ready", function() {
        self2.ready = true;
        self2.emit("ready");
      });
      var calls = self2._buffer;
      self2._buffer.length = 0;
      calls.forEach(function(c) {
        proxy[c[0]].apply(proxy, c[1]);
      });
    };
    ProxyReader.prototype.pause = function() {
      return this._proxyTarget ? this._proxyTarget.pause() : false;
    };
    ProxyReader.prototype.resume = function() {
      return this._proxyTarget ? this._proxyTarget.resume() : false;
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/reader.js
var require_reader = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/reader.js"(exports2, module2) {
    "use strict";
    module2.exports = Reader;
    var fs = require_graceful_fs();
    var Stream = require("stream").Stream;
    var inherits2 = require_inherits();
    var path = require("path");
    var getType = require_get_type();
    var hardLinks = Reader.hardLinks = {};
    var Abstract = require_abstract();
    inherits2(Reader, Abstract);
    var LinkReader = require_link_reader();
    function Reader(props, currentStat) {
      var self2 = this;
      if (!(self2 instanceof Reader))
        return new Reader(props, currentStat);
      if (typeof props === "string") {
        props = { path: props };
      }
      var type;
      var ClassType;
      if (props.type && typeof props.type === "function") {
        type = props.type;
        ClassType = type;
      } else {
        type = getType(props);
        ClassType = Reader;
      }
      if (currentStat && !type) {
        type = getType(currentStat);
        props[type] = true;
        props.type = type;
      }
      switch (type) {
        case "Directory":
          ClassType = require_dir_reader();
          break;
        case "Link":
        case "File":
          ClassType = require_file_reader();
          break;
        case "SymbolicLink":
          ClassType = LinkReader;
          break;
        case "Socket":
          ClassType = require_socket_reader();
          break;
        case null:
          ClassType = require_proxy_reader();
          break;
      }
      if (!(self2 instanceof ClassType)) {
        return new ClassType(props);
      }
      Abstract.call(self2);
      if (!props.path) {
        self2.error("Must provide a path", null, true);
      }
      self2.readable = true;
      self2.writable = false;
      self2.type = type;
      self2.props = props;
      self2.depth = props.depth = props.depth || 0;
      self2.parent = props.parent || null;
      self2.root = props.root || props.parent && props.parent.root || self2;
      self2._path = self2.path = path.resolve(props.path);
      if (process.platform === "win32") {
        self2.path = self2._path = self2.path.replace(/\?/g, "_");
        if (self2._path.length >= 260) {
          self2._swallowErrors = true;
          self2._path = "\\\\?\\" + self2.path.replace(/\//g, "\\");
        }
      }
      self2.basename = props.basename = path.basename(self2.path);
      self2.dirname = props.dirname = path.dirname(self2.path);
      props.parent = props.root = null;
      self2.size = props.size;
      self2.filter = typeof props.filter === "function" ? props.filter : null;
      if (props.sort === "alpha")
        props.sort = alphasort;
      self2._stat(currentStat);
    }
    function alphasort(a, b) {
      return a === b ? 0 : a.toLowerCase() > b.toLowerCase() ? 1 : a.toLowerCase() < b.toLowerCase() ? -1 : a > b ? 1 : -1;
    }
    Reader.prototype._stat = function(currentStat) {
      var self2 = this;
      var props = self2.props;
      var stat = props.follow ? "stat" : "lstat";
      if (currentStat)
        process.nextTick(statCb.bind(null, null, currentStat));
      else
        fs[stat](self2._path, statCb);
      function statCb(er, props_) {
        if (er)
          return self2.error(er);
        Object.keys(props_).forEach(function(k2) {
          props[k2] = props_[k2];
        });
        if (void 0 !== self2.size && props.size !== self2.size) {
          return self2.error("incorrect size");
        }
        self2.size = props.size;
        var type = getType(props);
        var handleHardlinks = props.hardlinks !== false;
        if (handleHardlinks && type !== "Directory" && props.nlink && props.nlink > 1) {
          var k = props.dev + ":" + props.ino;
          if (hardLinks[k] === self2._path || !hardLinks[k]) {
            hardLinks[k] = self2._path;
          } else {
            type = self2.type = self2.props.type = "Link";
            self2.Link = self2.props.Link = true;
            self2.linkpath = self2.props.linkpath = hardLinks[k];
            self2._stat = self2._read = LinkReader.prototype._read;
          }
        }
        if (self2.type && self2.type !== type) {
          self2.error("Unexpected type: " + type);
        }
        if (self2.filter) {
          var who = self2._proxy || self2;
          if (!self2.filter.call(who, who, props)) {
            if (!self2._disowned) {
              self2.abort();
              self2.emit("end");
              self2.emit("close");
            }
            return;
          }
        }
        var events = ["_stat", "stat", "ready"];
        var e = 0;
        (function go() {
          if (self2._aborted) {
            self2.emit("end");
            self2.emit("close");
            return;
          }
          if (self2._paused && self2.type !== "Directory") {
            self2.once("resume", go);
            return;
          }
          var ev = events[e++];
          if (!ev) {
            return self2._read();
          }
          self2.emit(ev, props);
          go();
        })();
      }
    };
    Reader.prototype.pipe = function(dest) {
      var self2 = this;
      if (typeof dest.add === "function") {
        self2.on("entry", function(entry) {
          var ret2 = dest.add(entry);
          if (ret2 === false) {
            self2.pause();
          }
        });
      }
      return Stream.prototype.pipe.apply(this, arguments);
    };
    Reader.prototype.pause = function(who) {
      this._paused = true;
      who = who || this;
      this.emit("pause", who);
      if (this._stream)
        this._stream.pause(who);
    };
    Reader.prototype.resume = function(who) {
      this._paused = false;
      who = who || this;
      this.emit("resume", who);
      if (this._stream)
        this._stream.resume(who);
      this._read();
    };
    Reader.prototype._read = function() {
      this.error("Cannot read unknown type: " + this.type);
    };
  }
});

// ../../../node_modules/.pnpm/fs.realpath@1.0.0/node_modules/fs.realpath/old.js
var require_old = __commonJS({
  "../../../node_modules/.pnpm/fs.realpath@1.0.0/node_modules/fs.realpath/old.js"(exports2) {
    "use strict";
    var pathModule = require("path");
    var isWindows = process.platform === "win32";
    var fs = require("fs");
    var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);
    function rethrow() {
      var callback;
      if (DEBUG) {
        var backtrace = new Error();
        callback = debugCallback;
      } else
        callback = missingCallback;
      return callback;
      function debugCallback(err) {
        if (err) {
          backtrace.message = err.message;
          err = backtrace;
          missingCallback(err);
        }
      }
      function missingCallback(err) {
        if (err) {
          if (process.throwDeprecation)
            throw err;
          else if (!process.noDeprecation) {
            var msg = "fs: missing callback " + (err.stack || err.message);
            if (process.traceDeprecation)
              console.trace(msg);
            else
              console.error(msg);
          }
        }
      }
    }
    function maybeCallback(cb) {
      return typeof cb === "function" ? cb : rethrow();
    }
    var normalize = pathModule.normalize;
    if (isWindows) {
      nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
    } else {
      nextPartRe = /(.*?)(?:[\/]+|$)/g;
    }
    var nextPartRe;
    if (isWindows) {
      splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
    } else {
      splitRootRe = /^[\/]*/;
    }
    var splitRootRe;
    exports2.realpathSync = function realpathSync(p, cache) {
      p = pathModule.resolve(p);
      if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
        return cache[p];
      }
      var original = p, seenLinks = {}, knownHard = {};
      var pos;
      var current;
      var base;
      var previous;
      start();
      function start() {
        var m = splitRootRe.exec(p);
        pos = m[0].length;
        current = m[0];
        base = m[0];
        previous = "";
        if (isWindows && !knownHard[base]) {
          fs.lstatSync(base);
          knownHard[base] = true;
        }
      }
      while (pos < p.length) {
        nextPartRe.lastIndex = pos;
        var result = nextPartRe.exec(p);
        previous = current;
        current += result[0];
        base = previous + result[1];
        pos = nextPartRe.lastIndex;
        if (knownHard[base] || cache && cache[base] === base) {
          continue;
        }
        var resolvedLink;
        if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
          resolvedLink = cache[base];
        } else {
          var stat = fs.lstatSync(base);
          if (!stat.isSymbolicLink()) {
            knownHard[base] = true;
            if (cache)
              cache[base] = base;
            continue;
          }
          var linkTarget = null;
          if (!isWindows) {
            var id = stat.dev.toString(32) + ":" + stat.ino.toString(32);
            if (seenLinks.hasOwnProperty(id)) {
              linkTarget = seenLinks[id];
            }
          }
          if (linkTarget === null) {
            fs.statSync(base);
            linkTarget = fs.readlinkSync(base);
          }
          resolvedLink = pathModule.resolve(previous, linkTarget);
          if (cache)
            cache[base] = resolvedLink;
          if (!isWindows)
            seenLinks[id] = linkTarget;
        }
        p = pathModule.resolve(resolvedLink, p.slice(pos));
        start();
      }
      if (cache)
        cache[original] = p;
      return p;
    };
    exports2.realpath = function realpath(p, cache, cb) {
      if (typeof cb !== "function") {
        cb = maybeCallback(cache);
        cache = null;
      }
      p = pathModule.resolve(p);
      if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
        return process.nextTick(cb.bind(null, null, cache[p]));
      }
      var original = p, seenLinks = {}, knownHard = {};
      var pos;
      var current;
      var base;
      var previous;
      start();
      function start() {
        var m = splitRootRe.exec(p);
        pos = m[0].length;
        current = m[0];
        base = m[0];
        previous = "";
        if (isWindows && !knownHard[base]) {
          fs.lstat(base, function(err) {
            if (err)
              return cb(err);
            knownHard[base] = true;
            LOOP();
          });
        } else {
          process.nextTick(LOOP);
        }
      }
      function LOOP() {
        if (pos >= p.length) {
          if (cache)
            cache[original] = p;
          return cb(null, p);
        }
        nextPartRe.lastIndex = pos;
        var result = nextPartRe.exec(p);
        previous = current;
        current += result[0];
        base = previous + result[1];
        pos = nextPartRe.lastIndex;
        if (knownHard[base] || cache && cache[base] === base) {
          return process.nextTick(LOOP);
        }
        if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
          return gotResolvedLink(cache[base]);
        }
        return fs.lstat(base, gotStat);
      }
      function gotStat(err, stat) {
        if (err)
          return cb(err);
        if (!stat.isSymbolicLink()) {
          knownHard[base] = true;
          if (cache)
            cache[base] = base;
          return process.nextTick(LOOP);
        }
        if (!isWindows) {
          var id = stat.dev.toString(32) + ":" + stat.ino.toString(32);
          if (seenLinks.hasOwnProperty(id)) {
            return gotTarget(null, seenLinks[id], base);
          }
        }
        fs.stat(base, function(err2) {
          if (err2)
            return cb(err2);
          fs.readlink(base, function(err3, target) {
            if (!isWindows)
              seenLinks[id] = target;
            gotTarget(err3, target);
          });
        });
      }
      function gotTarget(err, target, base2) {
        if (err)
          return cb(err);
        var resolvedLink = pathModule.resolve(previous, target);
        if (cache)
          cache[base2] = resolvedLink;
        gotResolvedLink(resolvedLink);
      }
      function gotResolvedLink(resolvedLink) {
        p = pathModule.resolve(resolvedLink, p.slice(pos));
        start();
      }
    };
  }
});

// ../../../node_modules/.pnpm/fs.realpath@1.0.0/node_modules/fs.realpath/index.js
var require_fs = __commonJS({
  "../../../node_modules/.pnpm/fs.realpath@1.0.0/node_modules/fs.realpath/index.js"(exports2, module2) {
    "use strict";
    module2.exports = realpath;
    realpath.realpath = realpath;
    realpath.sync = realpathSync;
    realpath.realpathSync = realpathSync;
    realpath.monkeypatch = monkeypatch;
    realpath.unmonkeypatch = unmonkeypatch;
    var fs = require("fs");
    var origRealpath = fs.realpath;
    var origRealpathSync = fs.realpathSync;
    var version2 = process.version;
    var ok = /^v[0-5]\./.test(version2);
    var old = require_old();
    function newError(er) {
      return er && er.syscall === "realpath" && (er.code === "ELOOP" || er.code === "ENOMEM" || er.code === "ENAMETOOLONG");
    }
    function realpath(p, cache, cb) {
      if (ok) {
        return origRealpath(p, cache, cb);
      }
      if (typeof cache === "function") {
        cb = cache;
        cache = null;
      }
      origRealpath(p, cache, function(er, result) {
        if (newError(er)) {
          old.realpath(p, cache, cb);
        } else {
          cb(er, result);
        }
      });
    }
    function realpathSync(p, cache) {
      if (ok) {
        return origRealpathSync(p, cache);
      }
      try {
        return origRealpathSync(p, cache);
      } catch (er) {
        if (newError(er)) {
          return old.realpathSync(p, cache);
        } else {
          throw er;
        }
      }
    }
    function monkeypatch() {
      fs.realpath = realpath;
      fs.realpathSync = realpathSync;
    }
    function unmonkeypatch() {
      fs.realpath = origRealpath;
      fs.realpathSync = origRealpathSync;
    }
  }
});

// ../../../node_modules/.pnpm/concat-map@0.0.1/node_modules/concat-map/index.js
var require_concat_map = __commonJS({
  "../../../node_modules/.pnpm/concat-map@0.0.1/node_modules/concat-map/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function(xs, fn) {
      var res = [];
      for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x))
          res.push.apply(res, x);
        else
          res.push(x);
      }
      return res;
    };
    var isArray = Array.isArray || function(xs) {
      return Object.prototype.toString.call(xs) === "[object Array]";
    };
  }
});

// ../../../node_modules/.pnpm/balanced-match@1.0.2/node_modules/balanced-match/index.js
var require_balanced_match = __commonJS({
  "../../../node_modules/.pnpm/balanced-match@1.0.2/node_modules/balanced-match/index.js"(exports2, module2) {
    "use strict";
    module2.exports = balanced;
    function balanced(a, b, str) {
      if (a instanceof RegExp)
        a = maybeMatch(a, str);
      if (b instanceof RegExp)
        b = maybeMatch(b, str);
      var r = range(a, b, str);
      return r && {
        start: r[0],
        end: r[1],
        pre: str.slice(0, r[0]),
        body: str.slice(r[0] + a.length, r[1]),
        post: str.slice(r[1] + b.length)
      };
    }
    function maybeMatch(reg, str) {
      var m = str.match(reg);
      return m ? m[0] : null;
    }
    balanced.range = range;
    function range(a, b, str) {
      var begs, beg, left, right, result;
      var ai = str.indexOf(a);
      var bi = str.indexOf(b, ai + 1);
      var i = ai;
      if (ai >= 0 && bi > 0) {
        if (a === b) {
          return [ai, bi];
        }
        begs = [];
        left = str.length;
        while (i >= 0 && !result) {
          if (i == ai) {
            begs.push(i);
            ai = str.indexOf(a, i + 1);
          } else if (begs.length == 1) {
            result = [begs.pop(), bi];
          } else {
            beg = begs.pop();
            if (beg < left) {
              left = beg;
              right = bi;
            }
            bi = str.indexOf(b, i + 1);
          }
          i = ai < bi && ai >= 0 ? ai : bi;
        }
        if (begs.length) {
          result = [left, right];
        }
      }
      return result;
    }
  }
});

// ../../../node_modules/.pnpm/brace-expansion@1.1.11/node_modules/brace-expansion/index.js
var require_brace_expansion = __commonJS({
  "../../../node_modules/.pnpm/brace-expansion@1.1.11/node_modules/brace-expansion/index.js"(exports2, module2) {
    "use strict";
    var concatMap = require_concat_map();
    var balanced = require_balanced_match();
    module2.exports = expandTop;
    var escSlash = "\0SLASH" + Math.random() + "\0";
    var escOpen = "\0OPEN" + Math.random() + "\0";
    var escClose = "\0CLOSE" + Math.random() + "\0";
    var escComma = "\0COMMA" + Math.random() + "\0";
    var escPeriod = "\0PERIOD" + Math.random() + "\0";
    function numeric(str) {
      return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
    }
    function escapeBraces(str) {
      return str.split("\\\\").join(escSlash).split("\\{").join(escOpen).split("\\}").join(escClose).split("\\,").join(escComma).split("\\.").join(escPeriod);
    }
    function unescapeBraces(str) {
      return str.split(escSlash).join("\\").split(escOpen).join("{").split(escClose).join("}").split(escComma).join(",").split(escPeriod).join(".");
    }
    function parseCommaParts(str) {
      if (!str)
        return [""];
      var parts = [];
      var m = balanced("{", "}", str);
      if (!m)
        return str.split(",");
      var pre = m.pre;
      var body = m.body;
      var post = m.post;
      var p = pre.split(",");
      p[p.length - 1] += "{" + body + "}";
      var postParts = parseCommaParts(post);
      if (post.length) {
        p[p.length - 1] += postParts.shift();
        p.push.apply(p, postParts);
      }
      parts.push.apply(parts, p);
      return parts;
    }
    function expandTop(str) {
      if (!str)
        return [];
      if (str.substr(0, 2) === "{}") {
        str = "\\{\\}" + str.substr(2);
      }
      return expand(escapeBraces(str), true).map(unescapeBraces);
    }
    function embrace(str) {
      return "{" + str + "}";
    }
    function isPadded(el) {
      return /^-?0\d/.test(el);
    }
    function lte(i, y) {
      return i <= y;
    }
    function gte(i, y) {
      return i >= y;
    }
    function expand(str, isTop) {
      var expansions = [];
      var m = balanced("{", "}", str);
      if (!m || /\$$/.test(m.pre))
        return [str];
      var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
      var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
      var isSequence = isNumericSequence || isAlphaSequence;
      var isOptions = m.body.indexOf(",") >= 0;
      if (!isSequence && !isOptions) {
        if (m.post.match(/,.*\}/)) {
          str = m.pre + "{" + m.body + escClose + m.post;
          return expand(str);
        }
        return [str];
      }
      var n;
      if (isSequence) {
        n = m.body.split(/\.\./);
      } else {
        n = parseCommaParts(m.body);
        if (n.length === 1) {
          n = expand(n[0], false).map(embrace);
          if (n.length === 1) {
            var post = m.post.length ? expand(m.post, false) : [""];
            return post.map(function(p) {
              return m.pre + n[0] + p;
            });
          }
        }
      }
      var pre = m.pre;
      var post = m.post.length ? expand(m.post, false) : [""];
      var N;
      if (isSequence) {
        var x = numeric(n[0]);
        var y = numeric(n[1]);
        var width = Math.max(n[0].length, n[1].length);
        var incr = n.length == 3 ? Math.abs(numeric(n[2])) : 1;
        var test = lte;
        var reverse = y < x;
        if (reverse) {
          incr *= -1;
          test = gte;
        }
        var pad = n.some(isPadded);
        N = [];
        for (var i = x; test(i, y); i += incr) {
          var c;
          if (isAlphaSequence) {
            c = String.fromCharCode(i);
            if (c === "\\")
              c = "";
          } else {
            c = String(i);
            if (pad) {
              var need = width - c.length;
              if (need > 0) {
                var z = new Array(need + 1).join("0");
                if (i < 0)
                  c = "-" + z + c.slice(1);
                else
                  c = z + c;
              }
            }
          }
          N.push(c);
        }
      } else {
        N = concatMap(n, function(el) {
          return expand(el, false);
        });
      }
      for (var j = 0; j < N.length; j++) {
        for (var k = 0; k < post.length; k++) {
          var expansion = pre + N[j] + post[k];
          if (!isTop || isSequence || expansion)
            expansions.push(expansion);
        }
      }
      return expansions;
    }
  }
});

// ../../../node_modules/.pnpm/minimatch@3.1.2/node_modules/minimatch/minimatch.js
var require_minimatch = __commonJS({
  "../../../node_modules/.pnpm/minimatch@3.1.2/node_modules/minimatch/minimatch.js"(exports2, module2) {
    "use strict";
    module2.exports = minimatch;
    minimatch.Minimatch = Minimatch;
    var path = function() {
      try {
        return require("path");
      } catch (e) {
      }
    }() || {
      sep: "/"
    };
    minimatch.sep = path.sep;
    var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {};
    var expand = require_brace_expansion();
    var plTypes = {
      "!": { open: "(?:(?!(?:", close: "))[^/]*?)" },
      "?": { open: "(?:", close: ")?" },
      "+": { open: "(?:", close: ")+" },
      "*": { open: "(?:", close: ")*" },
      "@": { open: "(?:", close: ")" }
    };
    var qmark = "[^/]";
    var star = qmark + "*?";
    var twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
    var twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
    var reSpecials = charSet("().*{}+?[]^$\\!");
    function charSet(s) {
      return s.split("").reduce(function(set, c) {
        set[c] = true;
        return set;
      }, {});
    }
    var slashSplit = /\/+/;
    minimatch.filter = filter;
    function filter(pattern, options) {
      options = options || {};
      return function(p, i, list) {
        return minimatch(p, pattern, options);
      };
    }
    function ext(a, b) {
      b = b || {};
      var t = {};
      Object.keys(a).forEach(function(k) {
        t[k] = a[k];
      });
      Object.keys(b).forEach(function(k) {
        t[k] = b[k];
      });
      return t;
    }
    minimatch.defaults = function(def) {
      if (!def || typeof def !== "object" || !Object.keys(def).length) {
        return minimatch;
      }
      var orig = minimatch;
      var m = function minimatch2(p, pattern, options) {
        return orig(p, pattern, ext(def, options));
      };
      m.Minimatch = function Minimatch2(pattern, options) {
        return new orig.Minimatch(pattern, ext(def, options));
      };
      m.Minimatch.defaults = function defaults2(options) {
        return orig.defaults(ext(def, options)).Minimatch;
      };
      m.filter = function filter2(pattern, options) {
        return orig.filter(pattern, ext(def, options));
      };
      m.defaults = function defaults2(options) {
        return orig.defaults(ext(def, options));
      };
      m.makeRe = function makeRe2(pattern, options) {
        return orig.makeRe(pattern, ext(def, options));
      };
      m.braceExpand = function braceExpand2(pattern, options) {
        return orig.braceExpand(pattern, ext(def, options));
      };
      m.match = function(list, pattern, options) {
        return orig.match(list, pattern, ext(def, options));
      };
      return m;
    };
    Minimatch.defaults = function(def) {
      return minimatch.defaults(def).Minimatch;
    };
    function minimatch(p, pattern, options) {
      assertValidPattern(pattern);
      if (!options)
        options = {};
      if (!options.nocomment && pattern.charAt(0) === "#") {
        return false;
      }
      return new Minimatch(pattern, options).match(p);
    }
    function Minimatch(pattern, options) {
      if (!(this instanceof Minimatch)) {
        return new Minimatch(pattern, options);
      }
      assertValidPattern(pattern);
      if (!options)
        options = {};
      pattern = pattern.trim();
      if (!options.allowWindowsEscape && path.sep !== "/") {
        pattern = pattern.split(path.sep).join("/");
      }
      this.options = options;
      this.set = [];
      this.pattern = pattern;
      this.regexp = null;
      this.negate = false;
      this.comment = false;
      this.empty = false;
      this.partial = !!options.partial;
      this.make();
    }
    Minimatch.prototype.debug = function() {
    };
    Minimatch.prototype.make = make;
    function make() {
      var pattern = this.pattern;
      var options = this.options;
      if (!options.nocomment && pattern.charAt(0) === "#") {
        this.comment = true;
        return;
      }
      if (!pattern) {
        this.empty = true;
        return;
      }
      this.parseNegate();
      var set = this.globSet = this.braceExpand();
      if (options.debug)
        this.debug = function debug() {
          console.error.apply(console, arguments);
        };
      this.debug(this.pattern, set);
      set = this.globParts = set.map(function(s) {
        return s.split(slashSplit);
      });
      this.debug(this.pattern, set);
      set = set.map(function(s, si, set2) {
        return s.map(this.parse, this);
      }, this);
      this.debug(this.pattern, set);
      set = set.filter(function(s) {
        return s.indexOf(false) === -1;
      });
      this.debug(this.pattern, set);
      this.set = set;
    }
    Minimatch.prototype.parseNegate = parseNegate;
    function parseNegate() {
      var pattern = this.pattern;
      var negate = false;
      var options = this.options;
      var negateOffset = 0;
      if (options.nonegate)
        return;
      for (var i = 0, l2 = pattern.length; i < l2 && pattern.charAt(i) === "!"; i++) {
        negate = !negate;
        negateOffset++;
      }
      if (negateOffset)
        this.pattern = pattern.substr(negateOffset);
      this.negate = negate;
    }
    minimatch.braceExpand = function(pattern, options) {
      return braceExpand(pattern, options);
    };
    Minimatch.prototype.braceExpand = braceExpand;
    function braceExpand(pattern, options) {
      if (!options) {
        if (this instanceof Minimatch) {
          options = this.options;
        } else {
          options = {};
        }
      }
      pattern = typeof pattern === "undefined" ? this.pattern : pattern;
      assertValidPattern(pattern);
      if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
        return [pattern];
      }
      return expand(pattern);
    }
    var MAX_PATTERN_LENGTH = 1024 * 64;
    var assertValidPattern = function(pattern) {
      if (typeof pattern !== "string") {
        throw new TypeError("invalid pattern");
      }
      if (pattern.length > MAX_PATTERN_LENGTH) {
        throw new TypeError("pattern is too long");
      }
    };
    Minimatch.prototype.parse = parse2;
    var SUBPARSE = {};
    function parse2(pattern, isSub) {
      assertValidPattern(pattern);
      var options = this.options;
      if (pattern === "**") {
        if (!options.noglobstar)
          return GLOBSTAR;
        else
          pattern = "*";
      }
      if (pattern === "")
        return "";
      var re = "";
      var hasMagic = !!options.nocase;
      var escaping = false;
      var patternListStack = [];
      var negativeLists = [];
      var stateChar;
      var inClass = false;
      var reClassStart = -1;
      var classStart = -1;
      var patternStart = pattern.charAt(0) === "." ? "" : options.dot ? "(?!(?:^|\\/)\\.{1,2}(?:$|\\/))" : "(?!\\.)";
      var self2 = this;
      function clearStateChar() {
        if (stateChar) {
          switch (stateChar) {
            case "*":
              re += star;
              hasMagic = true;
              break;
            case "?":
              re += qmark;
              hasMagic = true;
              break;
            default:
              re += "\\" + stateChar;
              break;
          }
          self2.debug("clearStateChar %j %j", stateChar, re);
          stateChar = false;
        }
      }
      for (var i = 0, len = pattern.length, c; i < len && (c = pattern.charAt(i)); i++) {
        this.debug("%s	%s %s %j", pattern, i, re, c);
        if (escaping && reSpecials[c]) {
          re += "\\" + c;
          escaping = false;
          continue;
        }
        switch (c) {
          case "/": {
            return false;
          }
          case "\\":
            clearStateChar();
            escaping = true;
            continue;
          case "?":
          case "*":
          case "+":
          case "@":
          case "!":
            this.debug("%s	%s %s %j <-- stateChar", pattern, i, re, c);
            if (inClass) {
              this.debug("  in class");
              if (c === "!" && i === classStart + 1)
                c = "^";
              re += c;
              continue;
            }
            self2.debug("call clearStateChar %j", stateChar);
            clearStateChar();
            stateChar = c;
            if (options.noext)
              clearStateChar();
            continue;
          case "(":
            if (inClass) {
              re += "(";
              continue;
            }
            if (!stateChar) {
              re += "\\(";
              continue;
            }
            patternListStack.push({
              type: stateChar,
              start: i - 1,
              reStart: re.length,
              open: plTypes[stateChar].open,
              close: plTypes[stateChar].close
            });
            re += stateChar === "!" ? "(?:(?!(?:" : "(?:";
            this.debug("plType %j %j", stateChar, re);
            stateChar = false;
            continue;
          case ")":
            if (inClass || !patternListStack.length) {
              re += "\\)";
              continue;
            }
            clearStateChar();
            hasMagic = true;
            var pl = patternListStack.pop();
            re += pl.close;
            if (pl.type === "!") {
              negativeLists.push(pl);
            }
            pl.reEnd = re.length;
            continue;
          case "|":
            if (inClass || !patternListStack.length || escaping) {
              re += "\\|";
              escaping = false;
              continue;
            }
            clearStateChar();
            re += "|";
            continue;
          case "[":
            clearStateChar();
            if (inClass) {
              re += "\\" + c;
              continue;
            }
            inClass = true;
            classStart = i;
            reClassStart = re.length;
            re += c;
            continue;
          case "]":
            if (i === classStart + 1 || !inClass) {
              re += "\\" + c;
              escaping = false;
              continue;
            }
            var cs = pattern.substring(classStart + 1, i);
            try {
              RegExp("[" + cs + "]");
            } catch (er) {
              var sp = this.parse(cs, SUBPARSE);
              re = re.substr(0, reClassStart) + "\\[" + sp[0] + "\\]";
              hasMagic = hasMagic || sp[1];
              inClass = false;
              continue;
            }
            hasMagic = true;
            inClass = false;
            re += c;
            continue;
          default:
            clearStateChar();
            if (escaping) {
              escaping = false;
            } else if (reSpecials[c] && !(c === "^" && inClass)) {
              re += "\\";
            }
            re += c;
        }
      }
      if (inClass) {
        cs = pattern.substr(classStart + 1);
        sp = this.parse(cs, SUBPARSE);
        re = re.substr(0, reClassStart) + "\\[" + sp[0];
        hasMagic = hasMagic || sp[1];
      }
      for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
        var tail = re.slice(pl.reStart + pl.open.length);
        this.debug("setting tail", re, pl);
        tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function(_, $1, $2) {
          if (!$2) {
            $2 = "\\";
          }
          return $1 + $1 + $2 + "|";
        });
        this.debug("tail=%j\n   %s", tail, tail, pl, re);
        var t = pl.type === "*" ? star : pl.type === "?" ? qmark : "\\" + pl.type;
        hasMagic = true;
        re = re.slice(0, pl.reStart) + t + "\\(" + tail;
      }
      clearStateChar();
      if (escaping) {
        re += "\\\\";
      }
      var addPatternStart = false;
      switch (re.charAt(0)) {
        case "[":
        case ".":
        case "(":
          addPatternStart = true;
      }
      for (var n = negativeLists.length - 1; n > -1; n--) {
        var nl = negativeLists[n];
        var nlBefore = re.slice(0, nl.reStart);
        var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
        var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
        var nlAfter = re.slice(nl.reEnd);
        nlLast += nlAfter;
        var openParensBefore = nlBefore.split("(").length - 1;
        var cleanAfter = nlAfter;
        for (i = 0; i < openParensBefore; i++) {
          cleanAfter = cleanAfter.replace(/\)[+*?]?/, "");
        }
        nlAfter = cleanAfter;
        var dollar = "";
        if (nlAfter === "" && isSub !== SUBPARSE) {
          dollar = "$";
        }
        var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
        re = newRe;
      }
      if (re !== "" && hasMagic) {
        re = "(?=.)" + re;
      }
      if (addPatternStart) {
        re = patternStart + re;
      }
      if (isSub === SUBPARSE) {
        return [re, hasMagic];
      }
      if (!hasMagic) {
        return globUnescape(pattern);
      }
      var flags = options.nocase ? "i" : "";
      try {
        var regExp = new RegExp("^" + re + "$", flags);
      } catch (er) {
        return new RegExp("$.");
      }
      regExp._glob = pattern;
      regExp._src = re;
      return regExp;
    }
    minimatch.makeRe = function(pattern, options) {
      return new Minimatch(pattern, options || {}).makeRe();
    };
    Minimatch.prototype.makeRe = makeRe;
    function makeRe() {
      if (this.regexp || this.regexp === false)
        return this.regexp;
      var set = this.set;
      if (!set.length) {
        this.regexp = false;
        return this.regexp;
      }
      var options = this.options;
      var twoStar = options.noglobstar ? star : options.dot ? twoStarDot : twoStarNoDot;
      var flags = options.nocase ? "i" : "";
      var re = set.map(function(pattern) {
        return pattern.map(function(p) {
          return p === GLOBSTAR ? twoStar : typeof p === "string" ? regExpEscape(p) : p._src;
        }).join("\\/");
      }).join("|");
      re = "^(?:" + re + ")$";
      if (this.negate)
        re = "^(?!" + re + ").*$";
      try {
        this.regexp = new RegExp(re, flags);
      } catch (ex) {
        this.regexp = false;
      }
      return this.regexp;
    }
    minimatch.match = function(list, pattern, options) {
      options = options || {};
      var mm = new Minimatch(pattern, options);
      list = list.filter(function(f) {
        return mm.match(f);
      });
      if (mm.options.nonull && !list.length) {
        list.push(pattern);
      }
      return list;
    };
    Minimatch.prototype.match = function match(f, partial) {
      if (typeof partial === "undefined")
        partial = this.partial;
      this.debug("match", f, this.pattern);
      if (this.comment)
        return false;
      if (this.empty)
        return f === "";
      if (f === "/" && partial)
        return true;
      var options = this.options;
      if (path.sep !== "/") {
        f = f.split(path.sep).join("/");
      }
      f = f.split(slashSplit);
      this.debug(this.pattern, "split", f);
      var set = this.set;
      this.debug(this.pattern, "set", set);
      var filename;
      var i;
      for (i = f.length - 1; i >= 0; i--) {
        filename = f[i];
        if (filename)
          break;
      }
      for (i = 0; i < set.length; i++) {
        var pattern = set[i];
        var file = f;
        if (options.matchBase && pattern.length === 1) {
          file = [filename];
        }
        var hit = this.matchOne(file, pattern, partial);
        if (hit) {
          if (options.flipNegate)
            return true;
          return !this.negate;
        }
      }
      if (options.flipNegate)
        return false;
      return this.negate;
    };
    Minimatch.prototype.matchOne = function(file, pattern, partial) {
      var options = this.options;
      this.debug(
        "matchOne",
        { "this": this, file, pattern }
      );
      this.debug("matchOne", file.length, pattern.length);
      for (var fi = 0, pi = 0, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
        this.debug("matchOne loop");
        var p = pattern[pi];
        var f = file[fi];
        this.debug(pattern, p, f);
        if (p === false)
          return false;
        if (p === GLOBSTAR) {
          this.debug("GLOBSTAR", [pattern, p, f]);
          var fr = fi;
          var pr = pi + 1;
          if (pr === pl) {
            this.debug("** at the end");
            for (; fi < fl; fi++) {
              if (file[fi] === "." || file[fi] === ".." || !options.dot && file[fi].charAt(0) === ".")
                return false;
            }
            return true;
          }
          while (fr < fl) {
            var swallowee = file[fr];
            this.debug("\nglobstar while", file, fr, pattern, pr, swallowee);
            if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
              this.debug("globstar found match!", fr, fl, swallowee);
              return true;
            } else {
              if (swallowee === "." || swallowee === ".." || !options.dot && swallowee.charAt(0) === ".") {
                this.debug("dot detected!", file, fr, pattern, pr);
                break;
              }
              this.debug("globstar swallow a segment, and continue");
              fr++;
            }
          }
          if (partial) {
            this.debug("\n>>> no match, partial?", file, fr, pattern, pr);
            if (fr === fl)
              return true;
          }
          return false;
        }
        var hit;
        if (typeof p === "string") {
          hit = f === p;
          this.debug("string match", p, f, hit);
        } else {
          hit = f.match(p);
          this.debug("pattern match", p, f, hit);
        }
        if (!hit)
          return false;
      }
      if (fi === fl && pi === pl) {
        return true;
      } else if (fi === fl) {
        return partial;
      } else if (pi === pl) {
        return fi === fl - 1 && file[fi] === "";
      }
      throw new Error("wtf?");
    };
    function globUnescape(s) {
      return s.replace(/\\(.)/g, "$1");
    }
    function regExpEscape(s) {
      return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }
  }
});

// ../../../node_modules/.pnpm/path-is-absolute@1.0.1/node_modules/path-is-absolute/index.js
var require_path_is_absolute = __commonJS({
  "../../../node_modules/.pnpm/path-is-absolute@1.0.1/node_modules/path-is-absolute/index.js"(exports2, module2) {
    "use strict";
    function posix(path) {
      return path.charAt(0) === "/";
    }
    function win32(path) {
      var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
      var result = splitDeviceRe.exec(path);
      var device = result[1] || "";
      var isUnc = Boolean(device && device.charAt(1) !== ":");
      return Boolean(result[2] || isUnc);
    }
    module2.exports = process.platform === "win32" ? win32 : posix;
    module2.exports.posix = posix;
    module2.exports.win32 = win32;
  }
});

// ../../../node_modules/.pnpm/glob@7.2.3/node_modules/glob/common.js
var require_common = __commonJS({
  "../../../node_modules/.pnpm/glob@7.2.3/node_modules/glob/common.js"(exports2) {
    "use strict";
    exports2.setopts = setopts;
    exports2.ownProp = ownProp;
    exports2.makeAbs = makeAbs;
    exports2.finish = finish;
    exports2.mark = mark;
    exports2.isIgnored = isIgnored;
    exports2.childrenIgnored = childrenIgnored;
    function ownProp(obj2, field) {
      return Object.prototype.hasOwnProperty.call(obj2, field);
    }
    var fs = require("fs");
    var path = require("path");
    var minimatch = require_minimatch();
    var isAbsolute = require_path_is_absolute();
    var Minimatch = minimatch.Minimatch;
    function alphasort(a, b) {
      return a.localeCompare(b, "en");
    }
    function setupIgnores(self2, options) {
      self2.ignore = options.ignore || [];
      if (!Array.isArray(self2.ignore))
        self2.ignore = [self2.ignore];
      if (self2.ignore.length) {
        self2.ignore = self2.ignore.map(ignoreMap);
      }
    }
    function ignoreMap(pattern) {
      var gmatcher = null;
      if (pattern.slice(-3) === "/**") {
        var gpattern = pattern.replace(/(\/\*\*)+$/, "");
        gmatcher = new Minimatch(gpattern, { dot: true });
      }
      return {
        matcher: new Minimatch(pattern, { dot: true }),
        gmatcher
      };
    }
    function setopts(self2, pattern, options) {
      if (!options)
        options = {};
      if (options.matchBase && -1 === pattern.indexOf("/")) {
        if (options.noglobstar) {
          throw new Error("base matching requires globstar");
        }
        pattern = "**/" + pattern;
      }
      self2.silent = !!options.silent;
      self2.pattern = pattern;
      self2.strict = options.strict !== false;
      self2.realpath = !!options.realpath;
      self2.realpathCache = options.realpathCache || /* @__PURE__ */ Object.create(null);
      self2.follow = !!options.follow;
      self2.dot = !!options.dot;
      self2.mark = !!options.mark;
      self2.nodir = !!options.nodir;
      if (self2.nodir)
        self2.mark = true;
      self2.sync = !!options.sync;
      self2.nounique = !!options.nounique;
      self2.nonull = !!options.nonull;
      self2.nosort = !!options.nosort;
      self2.nocase = !!options.nocase;
      self2.stat = !!options.stat;
      self2.noprocess = !!options.noprocess;
      self2.absolute = !!options.absolute;
      self2.fs = options.fs || fs;
      self2.maxLength = options.maxLength || Infinity;
      self2.cache = options.cache || /* @__PURE__ */ Object.create(null);
      self2.statCache = options.statCache || /* @__PURE__ */ Object.create(null);
      self2.symlinks = options.symlinks || /* @__PURE__ */ Object.create(null);
      setupIgnores(self2, options);
      self2.changedCwd = false;
      var cwd = process.cwd();
      if (!ownProp(options, "cwd"))
        self2.cwd = cwd;
      else {
        self2.cwd = path.resolve(options.cwd);
        self2.changedCwd = self2.cwd !== cwd;
      }
      self2.root = options.root || path.resolve(self2.cwd, "/");
      self2.root = path.resolve(self2.root);
      if (process.platform === "win32")
        self2.root = self2.root.replace(/\\/g, "/");
      self2.cwdAbs = isAbsolute(self2.cwd) ? self2.cwd : makeAbs(self2, self2.cwd);
      if (process.platform === "win32")
        self2.cwdAbs = self2.cwdAbs.replace(/\\/g, "/");
      self2.nomount = !!options.nomount;
      options.nonegate = true;
      options.nocomment = true;
      options.allowWindowsEscape = false;
      self2.minimatch = new Minimatch(pattern, options);
      self2.options = self2.minimatch.options;
    }
    function finish(self2) {
      var nou = self2.nounique;
      var all = nou ? [] : /* @__PURE__ */ Object.create(null);
      for (var i = 0, l2 = self2.matches.length; i < l2; i++) {
        var matches = self2.matches[i];
        if (!matches || Object.keys(matches).length === 0) {
          if (self2.nonull) {
            var literal = self2.minimatch.globSet[i];
            if (nou)
              all.push(literal);
            else
              all[literal] = true;
          }
        } else {
          var m = Object.keys(matches);
          if (nou)
            all.push.apply(all, m);
          else
            m.forEach(function(m2) {
              all[m2] = true;
            });
        }
      }
      if (!nou)
        all = Object.keys(all);
      if (!self2.nosort)
        all = all.sort(alphasort);
      if (self2.mark) {
        for (var i = 0; i < all.length; i++) {
          all[i] = self2._mark(all[i]);
        }
        if (self2.nodir) {
          all = all.filter(function(e) {
            var notDir = !/\/$/.test(e);
            var c = self2.cache[e] || self2.cache[makeAbs(self2, e)];
            if (notDir && c)
              notDir = c !== "DIR" && !Array.isArray(c);
            return notDir;
          });
        }
      }
      if (self2.ignore.length)
        all = all.filter(function(m2) {
          return !isIgnored(self2, m2);
        });
      self2.found = all;
    }
    function mark(self2, p) {
      var abs = makeAbs(self2, p);
      var c = self2.cache[abs];
      var m = p;
      if (c) {
        var isDir = c === "DIR" || Array.isArray(c);
        var slash = p.slice(-1) === "/";
        if (isDir && !slash)
          m += "/";
        else if (!isDir && slash)
          m = m.slice(0, -1);
        if (m !== p) {
          var mabs = makeAbs(self2, m);
          self2.statCache[mabs] = self2.statCache[abs];
          self2.cache[mabs] = self2.cache[abs];
        }
      }
      return m;
    }
    function makeAbs(self2, f) {
      var abs = f;
      if (f.charAt(0) === "/") {
        abs = path.join(self2.root, f);
      } else if (isAbsolute(f) || f === "") {
        abs = f;
      } else if (self2.changedCwd) {
        abs = path.resolve(self2.cwd, f);
      } else {
        abs = path.resolve(f);
      }
      if (process.platform === "win32")
        abs = abs.replace(/\\/g, "/");
      return abs;
    }
    function isIgnored(self2, path2) {
      if (!self2.ignore.length)
        return false;
      return self2.ignore.some(function(item) {
        return item.matcher.match(path2) || !!(item.gmatcher && item.gmatcher.match(path2));
      });
    }
    function childrenIgnored(self2, path2) {
      if (!self2.ignore.length)
        return false;
      return self2.ignore.some(function(item) {
        return !!(item.gmatcher && item.gmatcher.match(path2));
      });
    }
  }
});

// ../../../node_modules/.pnpm/glob@7.2.3/node_modules/glob/sync.js
var require_sync = __commonJS({
  "../../../node_modules/.pnpm/glob@7.2.3/node_modules/glob/sync.js"(exports2, module2) {
    "use strict";
    module2.exports = globSync;
    globSync.GlobSync = GlobSync;
    var rp = require_fs();
    var minimatch = require_minimatch();
    var Minimatch = minimatch.Minimatch;
    var Glob = require_glob().Glob;
    var util = require("util");
    var path = require("path");
    var assert = require("assert");
    var isAbsolute = require_path_is_absolute();
    var common = require_common();
    var setopts = common.setopts;
    var ownProp = common.ownProp;
    var childrenIgnored = common.childrenIgnored;
    var isIgnored = common.isIgnored;
    function globSync(pattern, options) {
      if (typeof options === "function" || arguments.length === 3)
        throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");
      return new GlobSync(pattern, options).found;
    }
    function GlobSync(pattern, options) {
      if (!pattern)
        throw new Error("must provide pattern");
      if (typeof options === "function" || arguments.length === 3)
        throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");
      if (!(this instanceof GlobSync))
        return new GlobSync(pattern, options);
      setopts(this, pattern, options);
      if (this.noprocess)
        return this;
      var n = this.minimatch.set.length;
      this.matches = new Array(n);
      for (var i = 0; i < n; i++) {
        this._process(this.minimatch.set[i], i, false);
      }
      this._finish();
    }
    GlobSync.prototype._finish = function() {
      assert.ok(this instanceof GlobSync);
      if (this.realpath) {
        var self2 = this;
        this.matches.forEach(function(matchset, index) {
          var set = self2.matches[index] = /* @__PURE__ */ Object.create(null);
          for (var p in matchset) {
            try {
              p = self2._makeAbs(p);
              var real = rp.realpathSync(p, self2.realpathCache);
              set[real] = true;
            } catch (er) {
              if (er.syscall === "stat")
                set[self2._makeAbs(p)] = true;
              else
                throw er;
            }
          }
        });
      }
      common.finish(this);
    };
    GlobSync.prototype._process = function(pattern, index, inGlobStar) {
      assert.ok(this instanceof GlobSync);
      var n = 0;
      while (typeof pattern[n] === "string") {
        n++;
      }
      var prefix;
      switch (n) {
        case pattern.length:
          this._processSimple(pattern.join("/"), index);
          return;
        case 0:
          prefix = null;
          break;
        default:
          prefix = pattern.slice(0, n).join("/");
          break;
      }
      var remain = pattern.slice(n);
      var read;
      if (prefix === null)
        read = ".";
      else if (isAbsolute(prefix) || isAbsolute(pattern.map(function(p) {
        return typeof p === "string" ? p : "[*]";
      }).join("/"))) {
        if (!prefix || !isAbsolute(prefix))
          prefix = "/" + prefix;
        read = prefix;
      } else
        read = prefix;
      var abs = this._makeAbs(read);
      if (childrenIgnored(this, read))
        return;
      var isGlobStar = remain[0] === minimatch.GLOBSTAR;
      if (isGlobStar)
        this._processGlobStar(prefix, read, abs, remain, index, inGlobStar);
      else
        this._processReaddir(prefix, read, abs, remain, index, inGlobStar);
    };
    GlobSync.prototype._processReaddir = function(prefix, read, abs, remain, index, inGlobStar) {
      var entries = this._readdir(abs, inGlobStar);
      if (!entries)
        return;
      var pn = remain[0];
      var negate = !!this.minimatch.negate;
      var rawGlob = pn._glob;
      var dotOk = this.dot || rawGlob.charAt(0) === ".";
      var matchedEntries = [];
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.charAt(0) !== "." || dotOk) {
          var m;
          if (negate && !prefix) {
            m = !e.match(pn);
          } else {
            m = e.match(pn);
          }
          if (m)
            matchedEntries.push(e);
        }
      }
      var len = matchedEntries.length;
      if (len === 0)
        return;
      if (remain.length === 1 && !this.mark && !this.stat) {
        if (!this.matches[index])
          this.matches[index] = /* @__PURE__ */ Object.create(null);
        for (var i = 0; i < len; i++) {
          var e = matchedEntries[i];
          if (prefix) {
            if (prefix.slice(-1) !== "/")
              e = prefix + "/" + e;
            else
              e = prefix + e;
          }
          if (e.charAt(0) === "/" && !this.nomount) {
            e = path.join(this.root, e);
          }
          this._emitMatch(index, e);
        }
        return;
      }
      remain.shift();
      for (var i = 0; i < len; i++) {
        var e = matchedEntries[i];
        var newPattern;
        if (prefix)
          newPattern = [prefix, e];
        else
          newPattern = [e];
        this._process(newPattern.concat(remain), index, inGlobStar);
      }
    };
    GlobSync.prototype._emitMatch = function(index, e) {
      if (isIgnored(this, e))
        return;
      var abs = this._makeAbs(e);
      if (this.mark)
        e = this._mark(e);
      if (this.absolute) {
        e = abs;
      }
      if (this.matches[index][e])
        return;
      if (this.nodir) {
        var c = this.cache[abs];
        if (c === "DIR" || Array.isArray(c))
          return;
      }
      this.matches[index][e] = true;
      if (this.stat)
        this._stat(e);
    };
    GlobSync.prototype._readdirInGlobStar = function(abs) {
      if (this.follow)
        return this._readdir(abs, false);
      var entries;
      var lstat;
      var stat;
      try {
        lstat = this.fs.lstatSync(abs);
      } catch (er) {
        if (er.code === "ENOENT") {
          return null;
        }
      }
      var isSym = lstat && lstat.isSymbolicLink();
      this.symlinks[abs] = isSym;
      if (!isSym && lstat && !lstat.isDirectory())
        this.cache[abs] = "FILE";
      else
        entries = this._readdir(abs, false);
      return entries;
    };
    GlobSync.prototype._readdir = function(abs, inGlobStar) {
      var entries;
      if (inGlobStar && !ownProp(this.symlinks, abs))
        return this._readdirInGlobStar(abs);
      if (ownProp(this.cache, abs)) {
        var c = this.cache[abs];
        if (!c || c === "FILE")
          return null;
        if (Array.isArray(c))
          return c;
      }
      try {
        return this._readdirEntries(abs, this.fs.readdirSync(abs));
      } catch (er) {
        this._readdirError(abs, er);
        return null;
      }
    };
    GlobSync.prototype._readdirEntries = function(abs, entries) {
      if (!this.mark && !this.stat) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (abs === "/")
            e = abs + e;
          else
            e = abs + "/" + e;
          this.cache[e] = true;
        }
      }
      this.cache[abs] = entries;
      return entries;
    };
    GlobSync.prototype._readdirError = function(f, er) {
      switch (er.code) {
        case "ENOTSUP":
        case "ENOTDIR":
          var abs = this._makeAbs(f);
          this.cache[abs] = "FILE";
          if (abs === this.cwdAbs) {
            var error = new Error(er.code + " invalid cwd " + this.cwd);
            error.path = this.cwd;
            error.code = er.code;
            throw error;
          }
          break;
        case "ENOENT":
        case "ELOOP":
        case "ENAMETOOLONG":
        case "UNKNOWN":
          this.cache[this._makeAbs(f)] = false;
          break;
        default:
          this.cache[this._makeAbs(f)] = false;
          if (this.strict)
            throw er;
          if (!this.silent)
            console.error("glob error", er);
          break;
      }
    };
    GlobSync.prototype._processGlobStar = function(prefix, read, abs, remain, index, inGlobStar) {
      var entries = this._readdir(abs, inGlobStar);
      if (!entries)
        return;
      var remainWithoutGlobStar = remain.slice(1);
      var gspref = prefix ? [prefix] : [];
      var noGlobStar = gspref.concat(remainWithoutGlobStar);
      this._process(noGlobStar, index, false);
      var len = entries.length;
      var isSym = this.symlinks[abs];
      if (isSym && inGlobStar)
        return;
      for (var i = 0; i < len; i++) {
        var e = entries[i];
        if (e.charAt(0) === "." && !this.dot)
          continue;
        var instead = gspref.concat(entries[i], remainWithoutGlobStar);
        this._process(instead, index, true);
        var below = gspref.concat(entries[i], remain);
        this._process(below, index, true);
      }
    };
    GlobSync.prototype._processSimple = function(prefix, index) {
      var exists = this._stat(prefix);
      if (!this.matches[index])
        this.matches[index] = /* @__PURE__ */ Object.create(null);
      if (!exists)
        return;
      if (prefix && isAbsolute(prefix) && !this.nomount) {
        var trail = /[\/\\]$/.test(prefix);
        if (prefix.charAt(0) === "/") {
          prefix = path.join(this.root, prefix);
        } else {
          prefix = path.resolve(this.root, prefix);
          if (trail)
            prefix += "/";
        }
      }
      if (process.platform === "win32")
        prefix = prefix.replace(/\\/g, "/");
      this._emitMatch(index, prefix);
    };
    GlobSync.prototype._stat = function(f) {
      var abs = this._makeAbs(f);
      var needDir = f.slice(-1) === "/";
      if (f.length > this.maxLength)
        return false;
      if (!this.stat && ownProp(this.cache, abs)) {
        var c = this.cache[abs];
        if (Array.isArray(c))
          c = "DIR";
        if (!needDir || c === "DIR")
          return c;
        if (needDir && c === "FILE")
          return false;
      }
      var exists;
      var stat = this.statCache[abs];
      if (!stat) {
        var lstat;
        try {
          lstat = this.fs.lstatSync(abs);
        } catch (er) {
          if (er && (er.code === "ENOENT" || er.code === "ENOTDIR")) {
            this.statCache[abs] = false;
            return false;
          }
        }
        if (lstat && lstat.isSymbolicLink()) {
          try {
            stat = this.fs.statSync(abs);
          } catch (er) {
            stat = lstat;
          }
        } else {
          stat = lstat;
        }
      }
      this.statCache[abs] = stat;
      var c = true;
      if (stat)
        c = stat.isDirectory() ? "DIR" : "FILE";
      this.cache[abs] = this.cache[abs] || c;
      if (needDir && c === "FILE")
        return false;
      return c;
    };
    GlobSync.prototype._mark = function(p) {
      return common.mark(this, p);
    };
    GlobSync.prototype._makeAbs = function(f) {
      return common.makeAbs(this, f);
    };
  }
});

// ../../../node_modules/.pnpm/wrappy@1.0.2/node_modules/wrappy/wrappy.js
var require_wrappy = __commonJS({
  "../../../node_modules/.pnpm/wrappy@1.0.2/node_modules/wrappy/wrappy.js"(exports2, module2) {
    "use strict";
    module2.exports = wrappy;
    function wrappy(fn, cb) {
      if (fn && cb)
        return wrappy(fn)(cb);
      if (typeof fn !== "function")
        throw new TypeError("need wrapper function");
      Object.keys(fn).forEach(function(k) {
        wrapper[k] = fn[k];
      });
      return wrapper;
      function wrapper() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        var ret2 = fn.apply(this, args);
        var cb2 = args[args.length - 1];
        if (typeof ret2 === "function" && ret2 !== cb2) {
          Object.keys(cb2).forEach(function(k) {
            ret2[k] = cb2[k];
          });
        }
        return ret2;
      }
    }
  }
});

// ../../../node_modules/.pnpm/once@1.4.0/node_modules/once/once.js
var require_once = __commonJS({
  "../../../node_modules/.pnpm/once@1.4.0/node_modules/once/once.js"(exports2, module2) {
    "use strict";
    var wrappy = require_wrappy();
    module2.exports = wrappy(once);
    module2.exports.strict = wrappy(onceStrict);
    once.proto = once(function() {
      Object.defineProperty(Function.prototype, "once", {
        value: function() {
          return once(this);
        },
        configurable: true
      });
      Object.defineProperty(Function.prototype, "onceStrict", {
        value: function() {
          return onceStrict(this);
        },
        configurable: true
      });
    });
    function once(fn) {
      var f = function() {
        if (f.called)
          return f.value;
        f.called = true;
        return f.value = fn.apply(this, arguments);
      };
      f.called = false;
      return f;
    }
    function onceStrict(fn) {
      var f = function() {
        if (f.called)
          throw new Error(f.onceError);
        f.called = true;
        return f.value = fn.apply(this, arguments);
      };
      var name = fn.name || "Function wrapped with `once`";
      f.onceError = name + " shouldn't be called more than once";
      f.called = false;
      return f;
    }
  }
});

// ../../../node_modules/.pnpm/inflight@1.0.6/node_modules/inflight/inflight.js
var require_inflight = __commonJS({
  "../../../node_modules/.pnpm/inflight@1.0.6/node_modules/inflight/inflight.js"(exports2, module2) {
    "use strict";
    var wrappy = require_wrappy();
    var reqs = /* @__PURE__ */ Object.create(null);
    var once = require_once();
    module2.exports = wrappy(inflight);
    function inflight(key, cb) {
      if (reqs[key]) {
        reqs[key].push(cb);
        return null;
      } else {
        reqs[key] = [cb];
        return makeres(key);
      }
    }
    function makeres(key) {
      return once(function RES() {
        var cbs = reqs[key];
        var len = cbs.length;
        var args = slice(arguments);
        try {
          for (var i = 0; i < len; i++) {
            cbs[i].apply(null, args);
          }
        } finally {
          if (cbs.length > len) {
            cbs.splice(0, len);
            process.nextTick(function() {
              RES.apply(null, args);
            });
          } else {
            delete reqs[key];
          }
        }
      });
    }
    function slice(args) {
      var length = args.length;
      var array = [];
      for (var i = 0; i < length; i++)
        array[i] = args[i];
      return array;
    }
  }
});

// ../../../node_modules/.pnpm/glob@7.2.3/node_modules/glob/glob.js
var require_glob = __commonJS({
  "../../../node_modules/.pnpm/glob@7.2.3/node_modules/glob/glob.js"(exports2, module2) {
    "use strict";
    module2.exports = glob;
    var rp = require_fs();
    var minimatch = require_minimatch();
    var Minimatch = minimatch.Minimatch;
    var inherits2 = require_inherits();
    var EE = require("events").EventEmitter;
    var path = require("path");
    var assert = require("assert");
    var isAbsolute = require_path_is_absolute();
    var globSync = require_sync();
    var common = require_common();
    var setopts = common.setopts;
    var ownProp = common.ownProp;
    var inflight = require_inflight();
    var util = require("util");
    var childrenIgnored = common.childrenIgnored;
    var isIgnored = common.isIgnored;
    var once = require_once();
    function glob(pattern, options, cb) {
      if (typeof options === "function")
        cb = options, options = {};
      if (!options)
        options = {};
      if (options.sync) {
        if (cb)
          throw new TypeError("callback provided to sync glob");
        return globSync(pattern, options);
      }
      return new Glob(pattern, options, cb);
    }
    glob.sync = globSync;
    var GlobSync = glob.GlobSync = globSync.GlobSync;
    glob.glob = glob;
    function extend(origin, add) {
      if (add === null || typeof add !== "object") {
        return origin;
      }
      var keys = Object.keys(add);
      var i = keys.length;
      while (i--) {
        origin[keys[i]] = add[keys[i]];
      }
      return origin;
    }
    glob.hasMagic = function(pattern, options_) {
      var options = extend({}, options_);
      options.noprocess = true;
      var g = new Glob(pattern, options);
      var set = g.minimatch.set;
      if (!pattern)
        return false;
      if (set.length > 1)
        return true;
      for (var j = 0; j < set[0].length; j++) {
        if (typeof set[0][j] !== "string")
          return true;
      }
      return false;
    };
    glob.Glob = Glob;
    inherits2(Glob, EE);
    function Glob(pattern, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = null;
      }
      if (options && options.sync) {
        if (cb)
          throw new TypeError("callback provided to sync glob");
        return new GlobSync(pattern, options);
      }
      if (!(this instanceof Glob))
        return new Glob(pattern, options, cb);
      setopts(this, pattern, options);
      this._didRealPath = false;
      var n = this.minimatch.set.length;
      this.matches = new Array(n);
      if (typeof cb === "function") {
        cb = once(cb);
        this.on("error", cb);
        this.on("end", function(matches) {
          cb(null, matches);
        });
      }
      var self2 = this;
      this._processing = 0;
      this._emitQueue = [];
      this._processQueue = [];
      this.paused = false;
      if (this.noprocess)
        return this;
      if (n === 0)
        return done();
      var sync = true;
      for (var i = 0; i < n; i++) {
        this._process(this.minimatch.set[i], i, false, done);
      }
      sync = false;
      function done() {
        --self2._processing;
        if (self2._processing <= 0) {
          if (sync) {
            process.nextTick(function() {
              self2._finish();
            });
          } else {
            self2._finish();
          }
        }
      }
    }
    Glob.prototype._finish = function() {
      assert(this instanceof Glob);
      if (this.aborted)
        return;
      if (this.realpath && !this._didRealpath)
        return this._realpath();
      common.finish(this);
      this.emit("end", this.found);
    };
    Glob.prototype._realpath = function() {
      if (this._didRealpath)
        return;
      this._didRealpath = true;
      var n = this.matches.length;
      if (n === 0)
        return this._finish();
      var self2 = this;
      for (var i = 0; i < this.matches.length; i++)
        this._realpathSet(i, next);
      function next() {
        if (--n === 0)
          self2._finish();
      }
    };
    Glob.prototype._realpathSet = function(index, cb) {
      var matchset = this.matches[index];
      if (!matchset)
        return cb();
      var found = Object.keys(matchset);
      var self2 = this;
      var n = found.length;
      if (n === 0)
        return cb();
      var set = this.matches[index] = /* @__PURE__ */ Object.create(null);
      found.forEach(function(p, i) {
        p = self2._makeAbs(p);
        rp.realpath(p, self2.realpathCache, function(er, real) {
          if (!er)
            set[real] = true;
          else if (er.syscall === "stat")
            set[p] = true;
          else
            self2.emit("error", er);
          if (--n === 0) {
            self2.matches[index] = set;
            cb();
          }
        });
      });
    };
    Glob.prototype._mark = function(p) {
      return common.mark(this, p);
    };
    Glob.prototype._makeAbs = function(f) {
      return common.makeAbs(this, f);
    };
    Glob.prototype.abort = function() {
      this.aborted = true;
      this.emit("abort");
    };
    Glob.prototype.pause = function() {
      if (!this.paused) {
        this.paused = true;
        this.emit("pause");
      }
    };
    Glob.prototype.resume = function() {
      if (this.paused) {
        this.emit("resume");
        this.paused = false;
        if (this._emitQueue.length) {
          var eq = this._emitQueue.slice(0);
          this._emitQueue.length = 0;
          for (var i = 0; i < eq.length; i++) {
            var e = eq[i];
            this._emitMatch(e[0], e[1]);
          }
        }
        if (this._processQueue.length) {
          var pq = this._processQueue.slice(0);
          this._processQueue.length = 0;
          for (var i = 0; i < pq.length; i++) {
            var p = pq[i];
            this._processing--;
            this._process(p[0], p[1], p[2], p[3]);
          }
        }
      }
    };
    Glob.prototype._process = function(pattern, index, inGlobStar, cb) {
      assert(this instanceof Glob);
      assert(typeof cb === "function");
      if (this.aborted)
        return;
      this._processing++;
      if (this.paused) {
        this._processQueue.push([pattern, index, inGlobStar, cb]);
        return;
      }
      var n = 0;
      while (typeof pattern[n] === "string") {
        n++;
      }
      var prefix;
      switch (n) {
        case pattern.length:
          this._processSimple(pattern.join("/"), index, cb);
          return;
        case 0:
          prefix = null;
          break;
        default:
          prefix = pattern.slice(0, n).join("/");
          break;
      }
      var remain = pattern.slice(n);
      var read;
      if (prefix === null)
        read = ".";
      else if (isAbsolute(prefix) || isAbsolute(pattern.map(function(p) {
        return typeof p === "string" ? p : "[*]";
      }).join("/"))) {
        if (!prefix || !isAbsolute(prefix))
          prefix = "/" + prefix;
        read = prefix;
      } else
        read = prefix;
      var abs = this._makeAbs(read);
      if (childrenIgnored(this, read))
        return cb();
      var isGlobStar = remain[0] === minimatch.GLOBSTAR;
      if (isGlobStar)
        this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb);
      else
        this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb);
    };
    Glob.prototype._processReaddir = function(prefix, read, abs, remain, index, inGlobStar, cb) {
      var self2 = this;
      this._readdir(abs, inGlobStar, function(er, entries) {
        return self2._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
      });
    };
    Glob.prototype._processReaddir2 = function(prefix, read, abs, remain, index, inGlobStar, entries, cb) {
      if (!entries)
        return cb();
      var pn = remain[0];
      var negate = !!this.minimatch.negate;
      var rawGlob = pn._glob;
      var dotOk = this.dot || rawGlob.charAt(0) === ".";
      var matchedEntries = [];
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.charAt(0) !== "." || dotOk) {
          var m;
          if (negate && !prefix) {
            m = !e.match(pn);
          } else {
            m = e.match(pn);
          }
          if (m)
            matchedEntries.push(e);
        }
      }
      var len = matchedEntries.length;
      if (len === 0)
        return cb();
      if (remain.length === 1 && !this.mark && !this.stat) {
        if (!this.matches[index])
          this.matches[index] = /* @__PURE__ */ Object.create(null);
        for (var i = 0; i < len; i++) {
          var e = matchedEntries[i];
          if (prefix) {
            if (prefix !== "/")
              e = prefix + "/" + e;
            else
              e = prefix + e;
          }
          if (e.charAt(0) === "/" && !this.nomount) {
            e = path.join(this.root, e);
          }
          this._emitMatch(index, e);
        }
        return cb();
      }
      remain.shift();
      for (var i = 0; i < len; i++) {
        var e = matchedEntries[i];
        var newPattern;
        if (prefix) {
          if (prefix !== "/")
            e = prefix + "/" + e;
          else
            e = prefix + e;
        }
        this._process([e].concat(remain), index, inGlobStar, cb);
      }
      cb();
    };
    Glob.prototype._emitMatch = function(index, e) {
      if (this.aborted)
        return;
      if (isIgnored(this, e))
        return;
      if (this.paused) {
        this._emitQueue.push([index, e]);
        return;
      }
      var abs = isAbsolute(e) ? e : this._makeAbs(e);
      if (this.mark)
        e = this._mark(e);
      if (this.absolute)
        e = abs;
      if (this.matches[index][e])
        return;
      if (this.nodir) {
        var c = this.cache[abs];
        if (c === "DIR" || Array.isArray(c))
          return;
      }
      this.matches[index][e] = true;
      var st = this.statCache[abs];
      if (st)
        this.emit("stat", e, st);
      this.emit("match", e);
    };
    Glob.prototype._readdirInGlobStar = function(abs, cb) {
      if (this.aborted)
        return;
      if (this.follow)
        return this._readdir(abs, false, cb);
      var lstatkey = "lstat\0" + abs;
      var self2 = this;
      var lstatcb = inflight(lstatkey, lstatcb_);
      if (lstatcb)
        self2.fs.lstat(abs, lstatcb);
      function lstatcb_(er, lstat) {
        if (er && er.code === "ENOENT")
          return cb();
        var isSym = lstat && lstat.isSymbolicLink();
        self2.symlinks[abs] = isSym;
        if (!isSym && lstat && !lstat.isDirectory()) {
          self2.cache[abs] = "FILE";
          cb();
        } else
          self2._readdir(abs, false, cb);
      }
    };
    Glob.prototype._readdir = function(abs, inGlobStar, cb) {
      if (this.aborted)
        return;
      cb = inflight("readdir\0" + abs + "\0" + inGlobStar, cb);
      if (!cb)
        return;
      if (inGlobStar && !ownProp(this.symlinks, abs))
        return this._readdirInGlobStar(abs, cb);
      if (ownProp(this.cache, abs)) {
        var c = this.cache[abs];
        if (!c || c === "FILE")
          return cb();
        if (Array.isArray(c))
          return cb(null, c);
      }
      var self2 = this;
      self2.fs.readdir(abs, readdirCb(this, abs, cb));
    };
    function readdirCb(self2, abs, cb) {
      return function(er, entries) {
        if (er)
          self2._readdirError(abs, er, cb);
        else
          self2._readdirEntries(abs, entries, cb);
      };
    }
    Glob.prototype._readdirEntries = function(abs, entries, cb) {
      if (this.aborted)
        return;
      if (!this.mark && !this.stat) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (abs === "/")
            e = abs + e;
          else
            e = abs + "/" + e;
          this.cache[e] = true;
        }
      }
      this.cache[abs] = entries;
      return cb(null, entries);
    };
    Glob.prototype._readdirError = function(f, er, cb) {
      if (this.aborted)
        return;
      switch (er.code) {
        case "ENOTSUP":
        case "ENOTDIR":
          var abs = this._makeAbs(f);
          this.cache[abs] = "FILE";
          if (abs === this.cwdAbs) {
            var error = new Error(er.code + " invalid cwd " + this.cwd);
            error.path = this.cwd;
            error.code = er.code;
            this.emit("error", error);
            this.abort();
          }
          break;
        case "ENOENT":
        case "ELOOP":
        case "ENAMETOOLONG":
        case "UNKNOWN":
          this.cache[this._makeAbs(f)] = false;
          break;
        default:
          this.cache[this._makeAbs(f)] = false;
          if (this.strict) {
            this.emit("error", er);
            this.abort();
          }
          if (!this.silent)
            console.error("glob error", er);
          break;
      }
      return cb();
    };
    Glob.prototype._processGlobStar = function(prefix, read, abs, remain, index, inGlobStar, cb) {
      var self2 = this;
      this._readdir(abs, inGlobStar, function(er, entries) {
        self2._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
      });
    };
    Glob.prototype._processGlobStar2 = function(prefix, read, abs, remain, index, inGlobStar, entries, cb) {
      if (!entries)
        return cb();
      var remainWithoutGlobStar = remain.slice(1);
      var gspref = prefix ? [prefix] : [];
      var noGlobStar = gspref.concat(remainWithoutGlobStar);
      this._process(noGlobStar, index, false, cb);
      var isSym = this.symlinks[abs];
      var len = entries.length;
      if (isSym && inGlobStar)
        return cb();
      for (var i = 0; i < len; i++) {
        var e = entries[i];
        if (e.charAt(0) === "." && !this.dot)
          continue;
        var instead = gspref.concat(entries[i], remainWithoutGlobStar);
        this._process(instead, index, true, cb);
        var below = gspref.concat(entries[i], remain);
        this._process(below, index, true, cb);
      }
      cb();
    };
    Glob.prototype._processSimple = function(prefix, index, cb) {
      var self2 = this;
      this._stat(prefix, function(er, exists) {
        self2._processSimple2(prefix, index, er, exists, cb);
      });
    };
    Glob.prototype._processSimple2 = function(prefix, index, er, exists, cb) {
      if (!this.matches[index])
        this.matches[index] = /* @__PURE__ */ Object.create(null);
      if (!exists)
        return cb();
      if (prefix && isAbsolute(prefix) && !this.nomount) {
        var trail = /[\/\\]$/.test(prefix);
        if (prefix.charAt(0) === "/") {
          prefix = path.join(this.root, prefix);
        } else {
          prefix = path.resolve(this.root, prefix);
          if (trail)
            prefix += "/";
        }
      }
      if (process.platform === "win32")
        prefix = prefix.replace(/\\/g, "/");
      this._emitMatch(index, prefix);
      cb();
    };
    Glob.prototype._stat = function(f, cb) {
      var abs = this._makeAbs(f);
      var needDir = f.slice(-1) === "/";
      if (f.length > this.maxLength)
        return cb();
      if (!this.stat && ownProp(this.cache, abs)) {
        var c = this.cache[abs];
        if (Array.isArray(c))
          c = "DIR";
        if (!needDir || c === "DIR")
          return cb(null, c);
        if (needDir && c === "FILE")
          return cb();
      }
      var exists;
      var stat = this.statCache[abs];
      if (stat !== void 0) {
        if (stat === false)
          return cb(null, stat);
        else {
          var type = stat.isDirectory() ? "DIR" : "FILE";
          if (needDir && type === "FILE")
            return cb();
          else
            return cb(null, type, stat);
        }
      }
      var self2 = this;
      var statcb = inflight("stat\0" + abs, lstatcb_);
      if (statcb)
        self2.fs.lstat(abs, statcb);
      function lstatcb_(er, lstat) {
        if (lstat && lstat.isSymbolicLink()) {
          return self2.fs.stat(abs, function(er2, stat2) {
            if (er2)
              self2._stat2(f, abs, null, lstat, cb);
            else
              self2._stat2(f, abs, er2, stat2, cb);
          });
        } else {
          self2._stat2(f, abs, er, lstat, cb);
        }
      }
    };
    Glob.prototype._stat2 = function(f, abs, er, stat, cb) {
      if (er && (er.code === "ENOENT" || er.code === "ENOTDIR")) {
        this.statCache[abs] = false;
        return cb();
      }
      var needDir = f.slice(-1) === "/";
      this.statCache[abs] = stat;
      if (abs.slice(-1) === "/" && stat && !stat.isDirectory())
        return cb(null, false, stat);
      var c = true;
      if (stat)
        c = stat.isDirectory() ? "DIR" : "FILE";
      this.cache[abs] = this.cache[abs] || c;
      if (needDir && c === "FILE")
        return cb();
      return cb(null, c, stat);
    };
  }
});

// ../../../node_modules/.pnpm/rimraf@2.7.1/node_modules/rimraf/rimraf.js
var require_rimraf = __commonJS({
  "../../../node_modules/.pnpm/rimraf@2.7.1/node_modules/rimraf/rimraf.js"(exports2, module2) {
    "use strict";
    module2.exports = rimraf;
    rimraf.sync = rimrafSync;
    var assert = require("assert");
    var path = require("path");
    var fs = require("fs");
    var glob = void 0;
    try {
      glob = require_glob();
    } catch (_err) {
    }
    var _0666 = parseInt("666", 8);
    var defaultGlobOpts = {
      nosort: true,
      silent: true
    };
    var timeout = 0;
    var isWindows = process.platform === "win32";
    function defaults2(options) {
      var methods = [
        "unlink",
        "chmod",
        "stat",
        "lstat",
        "rmdir",
        "readdir"
      ];
      methods.forEach(function(m) {
        options[m] = options[m] || fs[m];
        m = m + "Sync";
        options[m] = options[m] || fs[m];
      });
      options.maxBusyTries = options.maxBusyTries || 3;
      options.emfileWait = options.emfileWait || 1e3;
      if (options.glob === false) {
        options.disableGlob = true;
      }
      if (options.disableGlob !== true && glob === void 0) {
        throw Error("glob dependency not found, set `options.disableGlob = true` if intentional");
      }
      options.disableGlob = options.disableGlob || false;
      options.glob = options.glob || defaultGlobOpts;
    }
    function rimraf(p, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      assert(p, "rimraf: missing path");
      assert.equal(typeof p, "string", "rimraf: path should be a string");
      assert.equal(typeof cb, "function", "rimraf: callback function required");
      assert(options, "rimraf: invalid options argument provided");
      assert.equal(typeof options, "object", "rimraf: options should be object");
      defaults2(options);
      var busyTries = 0;
      var errState = null;
      var n = 0;
      if (options.disableGlob || !glob.hasMagic(p))
        return afterGlob(null, [p]);
      options.lstat(p, function(er, stat) {
        if (!er)
          return afterGlob(null, [p]);
        glob(p, options.glob, afterGlob);
      });
      function next(er) {
        errState = errState || er;
        if (--n === 0)
          cb(errState);
      }
      function afterGlob(er, results) {
        if (er)
          return cb(er);
        n = results.length;
        if (n === 0)
          return cb();
        results.forEach(function(p2) {
          rimraf_(p2, options, function CB(er2) {
            if (er2) {
              if ((er2.code === "EBUSY" || er2.code === "ENOTEMPTY" || er2.code === "EPERM") && busyTries < options.maxBusyTries) {
                busyTries++;
                var time = busyTries * 100;
                return setTimeout(function() {
                  rimraf_(p2, options, CB);
                }, time);
              }
              if (er2.code === "EMFILE" && timeout < options.emfileWait) {
                return setTimeout(function() {
                  rimraf_(p2, options, CB);
                }, timeout++);
              }
              if (er2.code === "ENOENT")
                er2 = null;
            }
            timeout = 0;
            next(er2);
          });
        });
      }
    }
    function rimraf_(p, options, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.lstat(p, function(er, st) {
        if (er && er.code === "ENOENT")
          return cb(null);
        if (er && er.code === "EPERM" && isWindows)
          fixWinEPERM(p, options, er, cb);
        if (st && st.isDirectory())
          return rmdir(p, options, er, cb);
        options.unlink(p, function(er2) {
          if (er2) {
            if (er2.code === "ENOENT")
              return cb(null);
            if (er2.code === "EPERM")
              return isWindows ? fixWinEPERM(p, options, er2, cb) : rmdir(p, options, er2, cb);
            if (er2.code === "EISDIR")
              return rmdir(p, options, er2, cb);
          }
          return cb(er2);
        });
      });
    }
    function fixWinEPERM(p, options, er, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      if (er)
        assert(er instanceof Error);
      options.chmod(p, _0666, function(er2) {
        if (er2)
          cb(er2.code === "ENOENT" ? null : er);
        else
          options.stat(p, function(er3, stats) {
            if (er3)
              cb(er3.code === "ENOENT" ? null : er);
            else if (stats.isDirectory())
              rmdir(p, options, er, cb);
            else
              options.unlink(p, cb);
          });
      });
    }
    function fixWinEPERMSync(p, options, er) {
      assert(p);
      assert(options);
      if (er)
        assert(er instanceof Error);
      try {
        options.chmodSync(p, _0666);
      } catch (er2) {
        if (er2.code === "ENOENT")
          return;
        else
          throw er;
      }
      try {
        var stats = options.statSync(p);
      } catch (er3) {
        if (er3.code === "ENOENT")
          return;
        else
          throw er;
      }
      if (stats.isDirectory())
        rmdirSync(p, options, er);
      else
        options.unlinkSync(p);
    }
    function rmdir(p, options, originalEr, cb) {
      assert(p);
      assert(options);
      if (originalEr)
        assert(originalEr instanceof Error);
      assert(typeof cb === "function");
      options.rmdir(p, function(er) {
        if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM"))
          rmkids(p, options, cb);
        else if (er && er.code === "ENOTDIR")
          cb(originalEr);
        else
          cb(er);
      });
    }
    function rmkids(p, options, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.readdir(p, function(er, files) {
        if (er)
          return cb(er);
        var n = files.length;
        if (n === 0)
          return options.rmdir(p, cb);
        var errState;
        files.forEach(function(f) {
          rimraf(path.join(p, f), options, function(er2) {
            if (errState)
              return;
            if (er2)
              return cb(errState = er2);
            if (--n === 0)
              options.rmdir(p, cb);
          });
        });
      });
    }
    function rimrafSync(p, options) {
      options = options || {};
      defaults2(options);
      assert(p, "rimraf: missing path");
      assert.equal(typeof p, "string", "rimraf: path should be a string");
      assert(options, "rimraf: missing options");
      assert.equal(typeof options, "object", "rimraf: options should be object");
      var results;
      if (options.disableGlob || !glob.hasMagic(p)) {
        results = [p];
      } else {
        try {
          options.lstatSync(p);
          results = [p];
        } catch (er) {
          results = glob.sync(p, options.glob);
        }
      }
      if (!results.length)
        return;
      for (var i = 0; i < results.length; i++) {
        var p = results[i];
        try {
          var st = options.lstatSync(p);
        } catch (er) {
          if (er.code === "ENOENT")
            return;
          if (er.code === "EPERM" && isWindows)
            fixWinEPERMSync(p, options, er);
        }
        try {
          if (st && st.isDirectory())
            rmdirSync(p, options, null);
          else
            options.unlinkSync(p);
        } catch (er) {
          if (er.code === "ENOENT")
            return;
          if (er.code === "EPERM")
            return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er);
          if (er.code !== "EISDIR")
            throw er;
          rmdirSync(p, options, er);
        }
      }
    }
    function rmdirSync(p, options, originalEr) {
      assert(p);
      assert(options);
      if (originalEr)
        assert(originalEr instanceof Error);
      try {
        options.rmdirSync(p);
      } catch (er) {
        if (er.code === "ENOENT")
          return;
        if (er.code === "ENOTDIR")
          throw originalEr;
        if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")
          rmkidsSync(p, options);
      }
    }
    function rmkidsSync(p, options) {
      assert(p);
      assert(options);
      options.readdirSync(p).forEach(function(f) {
        rimrafSync(path.join(p, f), options);
      });
      var retries = isWindows ? 100 : 1;
      var i = 0;
      do {
        var threw = true;
        try {
          var ret2 = options.rmdirSync(p, options);
          threw = false;
          return ret2;
        } finally {
          if (++i < retries && threw)
            continue;
        }
      } while (true);
    }
  }
});

// ../../../node_modules/.pnpm/mkdirp@0.5.6/node_modules/mkdirp/index.js
var require_mkdirp = __commonJS({
  "../../../node_modules/.pnpm/mkdirp@0.5.6/node_modules/mkdirp/index.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var fs = require("fs");
    var _0777 = parseInt("0777", 8);
    module2.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;
    function mkdirP(p, opts, f, made) {
      if (typeof opts === "function") {
        f = opts;
        opts = {};
      } else if (!opts || typeof opts !== "object") {
        opts = { mode: opts };
      }
      var mode = opts.mode;
      var xfs = opts.fs || fs;
      if (mode === void 0) {
        mode = _0777;
      }
      if (!made)
        made = null;
      var cb = f || /* istanbul ignore next */
      function() {
      };
      p = path.resolve(p);
      xfs.mkdir(p, mode, function(er) {
        if (!er) {
          made = made || p;
          return cb(null, made);
        }
        switch (er.code) {
          case "ENOENT":
            if (path.dirname(p) === p)
              return cb(er);
            mkdirP(path.dirname(p), opts, function(er2, made2) {
              if (er2)
                cb(er2, made2);
              else
                mkdirP(p, opts, cb, made2);
            });
            break;
          default:
            xfs.stat(p, function(er2, stat) {
              if (er2 || !stat.isDirectory())
                cb(er, made);
              else
                cb(null, made);
            });
            break;
        }
      });
    }
    mkdirP.sync = function sync(p, opts, made) {
      if (!opts || typeof opts !== "object") {
        opts = { mode: opts };
      }
      var mode = opts.mode;
      var xfs = opts.fs || fs;
      if (mode === void 0) {
        mode = _0777;
      }
      if (!made)
        made = null;
      p = path.resolve(p);
      try {
        xfs.mkdirSync(p, mode);
        made = made || p;
      } catch (err0) {
        switch (err0.code) {
          case "ENOENT":
            made = sync(path.dirname(p), opts, made);
            sync(p, opts, made);
            break;
          default:
            var stat;
            try {
              stat = xfs.statSync(p);
            } catch (err1) {
              throw err0;
            }
            if (!stat.isDirectory())
              throw err0;
            break;
        }
      }
      return made;
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/collect.js
var require_collect = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/collect.js"(exports2, module2) {
    "use strict";
    module2.exports = collect;
    function collect(stream) {
      if (stream._collected)
        return;
      if (stream._paused)
        return stream.on("resume", collect.bind(null, stream));
      stream._collected = true;
      stream.pause();
      stream.on("data", save);
      stream.on("end", save);
      var buf = [];
      function save(b) {
        if (typeof b === "string")
          b = new Buffer(b);
        if (Buffer.isBuffer(b) && !b.length)
          return;
        buf.push(b);
      }
      stream.on("entry", saveEntry);
      var entryBuffer = [];
      function saveEntry(e) {
        collect(e);
        entryBuffer.push(e);
      }
      stream.on("proxy", proxyPause);
      function proxyPause(p) {
        p.pause();
      }
      stream.pipe = function(orig) {
        return function(dest) {
          var e = 0;
          (function unblockEntry() {
            var entry = entryBuffer[e++];
            if (!entry)
              return resume();
            entry.on("end", unblockEntry);
            if (dest)
              dest.add(entry);
            else
              stream.emit("entry", entry);
          })();
          function resume() {
            stream.removeListener("entry", saveEntry);
            stream.removeListener("data", save);
            stream.removeListener("end", save);
            stream.pipe = orig;
            if (dest)
              stream.pipe(dest);
            buf.forEach(function(b) {
              if (b)
                stream.emit("data", b);
              else
                stream.emit("end");
            });
            stream.resume();
          }
          return dest;
        };
      }(stream.pipe);
    }
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/dir-writer.js
var require_dir_writer = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/dir-writer.js"(exports2, module2) {
    "use strict";
    module2.exports = DirWriter;
    var Writer = require_writer();
    var inherits2 = require_inherits();
    var mkdir = require_mkdirp();
    var path = require("path");
    var collect = require_collect();
    inherits2(DirWriter, Writer);
    function DirWriter(props) {
      var self2 = this;
      if (!(self2 instanceof DirWriter)) {
        self2.error("DirWriter must be called as constructor.", null, true);
      }
      if (props.type !== "Directory" || !props.Directory) {
        self2.error("Non-directory type " + props.type + " " + JSON.stringify(props), null, true);
      }
      Writer.call(this, props);
    }
    DirWriter.prototype._create = function() {
      var self2 = this;
      mkdir(self2._path, Writer.dirmode, function(er) {
        if (er)
          return self2.error(er);
        self2.ready = true;
        self2.emit("ready");
        self2._process();
      });
    };
    DirWriter.prototype.write = function() {
      return true;
    };
    DirWriter.prototype.end = function() {
      this._ended = true;
      this._process();
    };
    DirWriter.prototype.add = function(entry) {
      var self2 = this;
      collect(entry);
      if (!self2.ready || self2._currentEntry) {
        self2._buffer.push(entry);
        return false;
      }
      if (self2._ended) {
        return self2.error("add after end");
      }
      self2._buffer.push(entry);
      self2._process();
      return this._buffer.length === 0;
    };
    DirWriter.prototype._process = function() {
      var self2 = this;
      if (self2._processing)
        return;
      var entry = self2._buffer.shift();
      if (!entry) {
        self2.emit("drain");
        if (self2._ended)
          self2._finish();
        return;
      }
      self2._processing = true;
      self2.emit("entry", entry);
      var p = entry;
      var pp;
      do {
        pp = p._path || p.path;
        if (pp === self2.root._path || pp === self2._path || pp && pp.indexOf(self2._path) === 0) {
          self2._processing = false;
          if (entry._collected)
            entry.pipe();
          return self2._process();
        }
        p = p.parent;
      } while (p);
      var props = {
        parent: self2,
        root: self2.root || self2,
        type: entry.type,
        depth: self2.depth + 1
      };
      pp = entry._path || entry.path || entry.props.path;
      if (entry.parent) {
        pp = pp.substr(entry.parent._path.length + 1);
      }
      props.path = path.join(self2.path, path.join("/", pp));
      props.filter = self2.filter;
      Object.keys(entry.props).forEach(function(k) {
        if (!props.hasOwnProperty(k)) {
          props[k] = entry.props[k];
        }
      });
      var child = self2._currentChild = new Writer(props);
      child.on("ready", function() {
        entry.pipe(child);
        entry.resume();
      });
      child.on("error", function(er) {
        if (child._swallowErrors) {
          self2.warn(er);
          child.emit("end");
          child.emit("close");
        } else {
          self2.emit("error", er);
        }
      });
      child.on("close", onend);
      var ended = false;
      function onend() {
        if (ended)
          return;
        ended = true;
        self2._currentChild = null;
        self2._processing = false;
        self2._process();
      }
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/link-writer.js
var require_link_writer = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/link-writer.js"(exports2, module2) {
    "use strict";
    module2.exports = LinkWriter;
    var fs = require_graceful_fs();
    var Writer = require_writer();
    var inherits2 = require_inherits();
    var path = require("path");
    var rimraf = require_rimraf();
    inherits2(LinkWriter, Writer);
    function LinkWriter(props) {
      var self2 = this;
      if (!(self2 instanceof LinkWriter)) {
        throw new Error("LinkWriter must be called as constructor.");
      }
      if (!(props.type === "Link" && props.Link || props.type === "SymbolicLink" && props.SymbolicLink)) {
        throw new Error("Non-link type " + props.type);
      }
      if (props.linkpath === "")
        props.linkpath = ".";
      if (!props.linkpath) {
        self2.error("Need linkpath property to create " + props.type);
      }
      Writer.call(this, props);
    }
    LinkWriter.prototype._create = function() {
      var self2 = this;
      var hard = self2.type === "Link" || process.platform === "win32";
      var link = hard ? "link" : "symlink";
      var lp = hard ? path.resolve(self2.dirname, self2.linkpath) : self2.linkpath;
      if (hard)
        return clobber(self2, lp, link);
      fs.readlink(self2._path, function(er, p) {
        if (p && p === lp)
          return finish(self2);
        clobber(self2, lp, link);
      });
    };
    function clobber(self2, lp, link) {
      rimraf(self2._path, function(er) {
        if (er)
          return self2.error(er);
        create(self2, lp, link);
      });
    }
    function create(self2, lp, link) {
      fs[link](lp, self2._path, function(er) {
        if (er) {
          if ((er.code === "ENOENT" || er.code === "EACCES" || er.code === "EPERM") && process.platform === "win32") {
            self2.ready = true;
            self2.emit("ready");
            self2.emit("end");
            self2.emit("close");
            self2.end = self2._finish = function() {
            };
          } else
            return self2.error(er);
        }
        finish(self2);
      });
    }
    function finish(self2) {
      self2.ready = true;
      self2.emit("ready");
      if (self2._ended && !self2._finished)
        self2._finish();
    }
    LinkWriter.prototype.end = function() {
      this._ended = true;
      if (this.ready) {
        this._finished = true;
        this._finish();
      }
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/file-writer.js
var require_file_writer = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/file-writer.js"(exports2, module2) {
    "use strict";
    module2.exports = FileWriter;
    var fs = require_graceful_fs();
    var Writer = require_writer();
    var inherits2 = require_inherits();
    var EOF = {};
    inherits2(FileWriter, Writer);
    function FileWriter(props) {
      var self2 = this;
      if (!(self2 instanceof FileWriter)) {
        throw new Error("FileWriter must be called as constructor.");
      }
      if (props.type !== "File" || !props.File) {
        throw new Error("Non-file type " + props.type);
      }
      self2._buffer = [];
      self2._bytesWritten = 0;
      Writer.call(this, props);
    }
    FileWriter.prototype._create = function() {
      var self2 = this;
      if (self2._stream)
        return;
      var so = {};
      if (self2.props.flags)
        so.flags = self2.props.flags;
      so.mode = Writer.filemode;
      if (self2._old && self2._old.blksize)
        so.bufferSize = self2._old.blksize;
      self2._stream = fs.createWriteStream(self2._path, so);
      self2._stream.on("open", function() {
        self2.ready = true;
        self2._buffer.forEach(function(c) {
          if (c === EOF)
            self2._stream.end();
          else
            self2._stream.write(c);
        });
        self2.emit("ready");
        self2.emit("drain");
      });
      self2._stream.on("error", function(er) {
        self2.emit("error", er);
      });
      self2._stream.on("drain", function() {
        self2.emit("drain");
      });
      self2._stream.on("close", function() {
        self2._finish();
      });
    };
    FileWriter.prototype.write = function(c) {
      var self2 = this;
      self2._bytesWritten += c.length;
      if (!self2.ready) {
        if (!Buffer.isBuffer(c) && typeof c !== "string") {
          throw new Error("invalid write data");
        }
        self2._buffer.push(c);
        return false;
      }
      var ret2 = self2._stream.write(c);
      if (ret2 === false && self2._stream._queue) {
        return self2._stream._queue.length <= 2;
      } else {
        return ret2;
      }
    };
    FileWriter.prototype.end = function(c) {
      var self2 = this;
      if (c)
        self2.write(c);
      if (!self2.ready) {
        self2._buffer.push(EOF);
        return false;
      }
      return self2._stream.end();
    };
    FileWriter.prototype._finish = function() {
      var self2 = this;
      if (typeof self2.size === "number" && self2._bytesWritten !== self2.size) {
        self2.error(
          "Did not get expected byte count.\nexpect: " + self2.size + "\nactual: " + self2._bytesWritten
        );
      }
      Writer.prototype._finish.call(self2);
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/proxy-writer.js
var require_proxy_writer = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/proxy-writer.js"(exports2, module2) {
    "use strict";
    module2.exports = ProxyWriter;
    var Writer = require_writer();
    var getType = require_get_type();
    var inherits2 = require_inherits();
    var collect = require_collect();
    var fs = require("fs");
    inherits2(ProxyWriter, Writer);
    function ProxyWriter(props) {
      var self2 = this;
      if (!(self2 instanceof ProxyWriter)) {
        throw new Error("ProxyWriter must be called as constructor.");
      }
      self2.props = props;
      self2._needDrain = false;
      Writer.call(self2, props);
    }
    ProxyWriter.prototype._stat = function() {
      var self2 = this;
      var props = self2.props;
      var stat = props.follow ? "stat" : "lstat";
      fs[stat](props.path, function(er, current) {
        var type;
        if (er || !current) {
          type = "File";
        } else {
          type = getType(current);
        }
        props[type] = true;
        props.type = self2.type = type;
        self2._old = current;
        self2._addProxy(Writer(props, current));
      });
    };
    ProxyWriter.prototype._addProxy = function(proxy) {
      var self2 = this;
      if (self2._proxy) {
        return self2.error("proxy already set");
      }
      self2._proxy = proxy;
      [
        "ready",
        "error",
        "close",
        "pipe",
        "drain",
        "warn"
      ].forEach(function(ev) {
        proxy.on(ev, self2.emit.bind(self2, ev));
      });
      self2.emit("proxy", proxy);
      var calls = self2._buffer;
      calls.forEach(function(c) {
        proxy[c[0]].apply(proxy, c[1]);
      });
      self2._buffer.length = 0;
      if (self2._needsDrain)
        self2.emit("drain");
    };
    ProxyWriter.prototype.add = function(entry) {
      collect(entry);
      if (!this._proxy) {
        this._buffer.push(["add", [entry]]);
        this._needDrain = true;
        return false;
      }
      return this._proxy.add(entry);
    };
    ProxyWriter.prototype.write = function(c) {
      if (!this._proxy) {
        this._buffer.push(["write", [c]]);
        this._needDrain = true;
        return false;
      }
      return this._proxy.write(c);
    };
    ProxyWriter.prototype.end = function(c) {
      if (!this._proxy) {
        this._buffer.push(["end", [c]]);
        return false;
      }
      return this._proxy.end(c);
    };
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/writer.js
var require_writer = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/lib/writer.js"(exports2, module2) {
    "use strict";
    module2.exports = Writer;
    var fs = require_graceful_fs();
    var inherits2 = require_inherits();
    var rimraf = require_rimraf();
    var mkdir = require_mkdirp();
    var path = require("path");
    var umask = process.platform === "win32" ? 0 : process.umask();
    var getType = require_get_type();
    var Abstract = require_abstract();
    inherits2(Writer, Abstract);
    Writer.dirmode = parseInt("0777", 8) & ~umask;
    Writer.filemode = parseInt("0666", 8) & ~umask;
    var DirWriter = require_dir_writer();
    var LinkWriter = require_link_writer();
    var FileWriter = require_file_writer();
    var ProxyWriter = require_proxy_writer();
    function Writer(props, current) {
      var self2 = this;
      if (typeof props === "string") {
        props = { path: props };
      }
      var type = getType(props);
      var ClassType = Writer;
      switch (type) {
        case "Directory":
          ClassType = DirWriter;
          break;
        case "File":
          ClassType = FileWriter;
          break;
        case "Link":
        case "SymbolicLink":
          ClassType = LinkWriter;
          break;
        case null:
        default:
          ClassType = ProxyWriter;
          break;
      }
      if (!(self2 instanceof ClassType))
        return new ClassType(props);
      Abstract.call(self2);
      if (!props.path)
        self2.error("Must provide a path", null, true);
      self2.type = props.type;
      self2.props = props;
      self2.depth = props.depth || 0;
      self2.clobber = props.clobber === false ? props.clobber : true;
      self2.parent = props.parent || null;
      self2.root = props.root || props.parent && props.parent.root || self2;
      self2._path = self2.path = path.resolve(props.path);
      if (process.platform === "win32") {
        self2.path = self2._path = self2.path.replace(/\?/g, "_");
        if (self2._path.length >= 260) {
          self2._swallowErrors = true;
          self2._path = "\\\\?\\" + self2.path.replace(/\//g, "\\");
        }
      }
      self2.basename = path.basename(props.path);
      self2.dirname = path.dirname(props.path);
      self2.linkpath = props.linkpath || null;
      props.parent = props.root = null;
      self2.size = props.size;
      if (typeof props.mode === "string") {
        props.mode = parseInt(props.mode, 8);
      }
      self2.readable = false;
      self2.writable = true;
      self2._buffer = [];
      self2.ready = false;
      self2.filter = typeof props.filter === "function" ? props.filter : null;
      self2._stat(current);
    }
    Writer.prototype._create = function() {
      var self2 = this;
      fs[self2.props.follow ? "stat" : "lstat"](self2._path, function(er) {
        if (er) {
          return self2.warn("Cannot create " + self2._path + "\nUnsupported type: " + self2.type, "ENOTSUP");
        }
        self2._finish();
      });
    };
    Writer.prototype._stat = function(current) {
      var self2 = this;
      var props = self2.props;
      var stat = props.follow ? "stat" : "lstat";
      var who = self2._proxy || self2;
      if (current)
        statCb(null, current);
      else
        fs[stat](self2._path, statCb);
      function statCb(er, current2) {
        if (self2.filter && !self2.filter.call(who, who, current2)) {
          self2._aborted = true;
          self2.emit("end");
          self2.emit("close");
          return;
        }
        if (er || !current2) {
          return create(self2);
        }
        self2._old = current2;
        var currentType = getType(current2);
        if (currentType !== self2.type || self2.type === "File" && current2.nlink > 1) {
          return rimraf(self2._path, function(er2) {
            if (er2)
              return self2.error(er2);
            self2._old = null;
            create(self2);
          });
        }
        create(self2);
      }
    };
    function create(self2) {
      mkdir(path.dirname(self2._path), Writer.dirmode, function(er, made) {
        if (er)
          return self2.error(er);
        self2._madeDir = made;
        return self2._create();
      });
    }
    function endChmod(self2, want, current, path2, cb) {
      var wantMode = want.mode;
      var chmod = want.follow || self2.type !== "SymbolicLink" ? "chmod" : "lchmod";
      if (!fs[chmod])
        return cb();
      if (typeof wantMode !== "number")
        return cb();
      var curMode = current.mode & parseInt("0777", 8);
      wantMode = wantMode & parseInt("0777", 8);
      if (wantMode === curMode)
        return cb();
      fs[chmod](path2, wantMode, cb);
    }
    function endChown(self2, want, current, path2, cb) {
      if (process.platform === "win32")
        return cb();
      if (!process.getuid || process.getuid() !== 0)
        return cb();
      if (typeof want.uid !== "number" && typeof want.gid !== "number")
        return cb();
      if (current.uid === want.uid && current.gid === want.gid)
        return cb();
      var chown = self2.props.follow || self2.type !== "SymbolicLink" ? "chown" : "lchown";
      if (!fs[chown])
        return cb();
      if (typeof want.uid !== "number")
        want.uid = current.uid;
      if (typeof want.gid !== "number")
        want.gid = current.gid;
      fs[chown](path2, want.uid, want.gid, cb);
    }
    function endUtimes(self2, want, current, path2, cb) {
      if (!fs.utimes || process.platform === "win32")
        return cb();
      var utimes = want.follow || self2.type !== "SymbolicLink" ? "utimes" : "lutimes";
      if (utimes === "lutimes" && !fs[utimes]) {
        utimes = "utimes";
      }
      if (!fs[utimes])
        return cb();
      var curA = current.atime;
      var curM = current.mtime;
      var meA = want.atime;
      var meM = want.mtime;
      if (meA === void 0)
        meA = curA;
      if (meM === void 0)
        meM = curM;
      if (!isDate(meA))
        meA = new Date(meA);
      if (!isDate(meM))
        meA = new Date(meM);
      if (meA.getTime() === curA.getTime() && meM.getTime() === curM.getTime())
        return cb();
      fs[utimes](path2, meA, meM, cb);
    }
    Writer.prototype._finish = function() {
      var self2 = this;
      if (self2._finishing)
        return;
      self2._finishing = true;
      var todo = 0;
      var errState = null;
      var done = false;
      if (self2._old) {
        self2._old.atime = /* @__PURE__ */ new Date(0);
        self2._old.mtime = /* @__PURE__ */ new Date(0);
        setProps(self2._old);
      } else {
        var stat = self2.props.follow ? "stat" : "lstat";
        fs[stat](self2._path, function(er, current) {
          if (er) {
            if (er.code === "ENOENT" && (self2.type === "Link" || self2.type === "SymbolicLink") && process.platform === "win32") {
              self2.ready = true;
              self2.emit("ready");
              self2.emit("end");
              self2.emit("close");
              self2.end = self2._finish = function() {
              };
              return;
            } else
              return self2.error(er);
          }
          setProps(self2._old = current);
        });
      }
      return;
      function setProps(current) {
        todo += 3;
        endChmod(self2, self2.props, current, self2._path, next("chmod"));
        endChown(self2, self2.props, current, self2._path, next("chown"));
        endUtimes(self2, self2.props, current, self2._path, next("utimes"));
      }
      function next(what) {
        return function(er) {
          if (errState)
            return;
          if (er) {
            er.fstream_finish_call = what;
            return self2.error(errState = er);
          }
          if (--todo > 0)
            return;
          if (done)
            return;
          done = true;
          if (!self2._madeDir)
            return end();
          else
            endMadeDir(self2, self2._path, end);
          function end(er2) {
            if (er2) {
              er2.fstream_finish_call = "setupMadeDir";
              return self2.error(er2);
            }
            self2.emit("end");
            self2.emit("close");
          }
        };
      }
    };
    function endMadeDir(self2, p, cb) {
      var made = self2._madeDir;
      var d = path.dirname(p);
      endMadeDir_(self2, d, function(er) {
        if (er)
          return cb(er);
        if (d === made) {
          return cb();
        }
        endMadeDir(self2, d, cb);
      });
    }
    function endMadeDir_(self2, p, cb) {
      var dirProps = {};
      Object.keys(self2.props).forEach(function(k) {
        dirProps[k] = self2.props[k];
        if (k === "mode" && self2.type !== "Directory") {
          dirProps[k] = dirProps[k] | parseInt("0111", 8);
        }
      });
      var todo = 3;
      var errState = null;
      fs.stat(p, function(er, current) {
        if (er)
          return cb(errState = er);
        endChmod(self2, dirProps, current, p, next);
        endChown(self2, dirProps, current, p, next);
        endUtimes(self2, dirProps, current, p, next);
      });
      function next(er) {
        if (errState)
          return;
        if (er)
          return cb(errState = er);
        if (--todo === 0)
          return cb();
      }
    }
    Writer.prototype.pipe = function() {
      this.error("Can't pipe from writable stream");
    };
    Writer.prototype.add = function() {
      this.error("Can't add to non-Directory type");
    };
    Writer.prototype.write = function() {
      return true;
    };
    function objectToString(d) {
      return Object.prototype.toString.call(d);
    }
    function isDate(d) {
      return typeof d === "object" && objectToString(d) === "[object Date]";
    }
  }
});

// ../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/fstream.js
var require_fstream = __commonJS({
  "../../../node_modules/.pnpm/fstream@1.0.12/node_modules/fstream/fstream.js"(exports2) {
    "use strict";
    exports2.Abstract = require_abstract();
    exports2.Reader = require_reader();
    exports2.Writer = require_writer();
    exports2.File = {
      Reader: require_file_reader(),
      Writer: require_file_writer()
    };
    exports2.Dir = {
      Reader: require_dir_reader(),
      Writer: require_dir_writer()
    };
    exports2.Link = {
      Reader: require_link_reader(),
      Writer: require_link_writer()
    };
    exports2.Proxy = {
      Reader: require_proxy_reader(),
      Writer: require_proxy_writer()
    };
    exports2.Reader.Dir = exports2.DirReader = exports2.Dir.Reader;
    exports2.Reader.File = exports2.FileReader = exports2.File.Reader;
    exports2.Reader.Link = exports2.LinkReader = exports2.Link.Reader;
    exports2.Reader.Proxy = exports2.ProxyReader = exports2.Proxy.Reader;
    exports2.Writer.Dir = exports2.DirWriter = exports2.Dir.Writer;
    exports2.Writer.File = exports2.FileWriter = exports2.File.Writer;
    exports2.Writer.Link = exports2.LinkWriter = exports2.Link.Writer;
    exports2.Writer.Proxy = exports2.ProxyWriter = exports2.Proxy.Writer;
    exports2.collect = require_collect();
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/extract.js
var require_extract = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/extract.js"(exports2, module2) {
    "use strict";
    module2.exports = Extract;
    var Parse2 = require_parse();
    var Writer = require_fstream().Writer;
    var path = require("path");
    var stream = require("stream");
    var duplexer2 = require_duplexer2();
    var Promise2 = require_bluebird();
    function Extract(opts) {
      opts.path = path.resolve(path.normalize(opts.path));
      var parser2 = new Parse2(opts);
      var outStream = new stream.Writable({ objectMode: true });
      outStream._write = function(entry, encoding, cb) {
        if (entry.type == "Directory")
          return cb();
        var extractPath = path.join(opts.path, entry.path);
        if (extractPath.indexOf(opts.path) != 0) {
          return cb();
        }
        const writer = opts.getWriter ? opts.getWriter({ path: extractPath }) : Writer({ path: extractPath });
        entry.pipe(writer).on("error", cb).on("close", cb);
      };
      var extract = duplexer2(parser2, outStream);
      parser2.once("crx-header", function(crxHeader) {
        extract.crxHeader = crxHeader;
      });
      parser2.pipe(outStream).on("finish", function() {
        extract.emit("close");
      });
      extract.promise = function() {
        return new Promise2(function(resolve, reject) {
          extract.on("close", resolve);
          extract.on("error", reject);
        });
      };
      return extract;
    }
  }
});

// ../../../node_modules/.pnpm/big-integer@1.6.51/node_modules/big-integer/BigInteger.js
var require_BigInteger = __commonJS({
  "../../../node_modules/.pnpm/big-integer@1.6.51/node_modules/big-integer/BigInteger.js"(exports2, module2) {
    "use strict";
    var bigInt = function(undefined2) {
      "use strict";
      var BASE = 1e7, LOG_BASE = 7, MAX_INT = 9007199254740992, MAX_INT_ARR = smallToArray(MAX_INT), DEFAULT_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
      var supportsNativeBigInt = typeof BigInt === "function";
      function Integer(v, radix, alphabet, caseSensitive) {
        if (typeof v === "undefined")
          return Integer[0];
        if (typeof radix !== "undefined")
          return +radix === 10 && !alphabet ? parseValue(v) : parseBase(v, radix, alphabet, caseSensitive);
        return parseValue(v);
      }
      function BigInteger(value, sign) {
        this.value = value;
        this.sign = sign;
        this.isSmall = false;
      }
      BigInteger.prototype = Object.create(Integer.prototype);
      function SmallInteger(value) {
        this.value = value;
        this.sign = value < 0;
        this.isSmall = true;
      }
      SmallInteger.prototype = Object.create(Integer.prototype);
      function NativeBigInt(value) {
        this.value = value;
      }
      NativeBigInt.prototype = Object.create(Integer.prototype);
      function isPrecise(n) {
        return -MAX_INT < n && n < MAX_INT;
      }
      function smallToArray(n) {
        if (n < 1e7)
          return [n];
        if (n < 1e14)
          return [n % 1e7, Math.floor(n / 1e7)];
        return [n % 1e7, Math.floor(n / 1e7) % 1e7, Math.floor(n / 1e14)];
      }
      function arrayToSmall(arr) {
        trim(arr);
        var length = arr.length;
        if (length < 4 && compareAbs(arr, MAX_INT_ARR) < 0) {
          switch (length) {
            case 0:
              return 0;
            case 1:
              return arr[0];
            case 2:
              return arr[0] + arr[1] * BASE;
            default:
              return arr[0] + (arr[1] + arr[2] * BASE) * BASE;
          }
        }
        return arr;
      }
      function trim(v) {
        var i2 = v.length;
        while (v[--i2] === 0)
          ;
        v.length = i2 + 1;
      }
      function createArray(length) {
        var x = new Array(length);
        var i2 = -1;
        while (++i2 < length) {
          x[i2] = 0;
        }
        return x;
      }
      function truncate(n) {
        if (n > 0)
          return Math.floor(n);
        return Math.ceil(n);
      }
      function add(a, b) {
        var l_a = a.length, l_b = b.length, r = new Array(l_a), carry = 0, base = BASE, sum, i2;
        for (i2 = 0; i2 < l_b; i2++) {
          sum = a[i2] + b[i2] + carry;
          carry = sum >= base ? 1 : 0;
          r[i2] = sum - carry * base;
        }
        while (i2 < l_a) {
          sum = a[i2] + carry;
          carry = sum === base ? 1 : 0;
          r[i2++] = sum - carry * base;
        }
        if (carry > 0)
          r.push(carry);
        return r;
      }
      function addAny(a, b) {
        if (a.length >= b.length)
          return add(a, b);
        return add(b, a);
      }
      function addSmall(a, carry) {
        var l2 = a.length, r = new Array(l2), base = BASE, sum, i2;
        for (i2 = 0; i2 < l2; i2++) {
          sum = a[i2] - base + carry;
          carry = Math.floor(sum / base);
          r[i2] = sum - carry * base;
          carry += 1;
        }
        while (carry > 0) {
          r[i2++] = carry % base;
          carry = Math.floor(carry / base);
        }
        return r;
      }
      BigInteger.prototype.add = function(v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
          return this.subtract(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall) {
          return new BigInteger(addSmall(a, Math.abs(b)), this.sign);
        }
        return new BigInteger(addAny(a, b), this.sign);
      };
      BigInteger.prototype.plus = BigInteger.prototype.add;
      SmallInteger.prototype.add = function(v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
          return this.subtract(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
          if (isPrecise(a + b))
            return new SmallInteger(a + b);
          b = smallToArray(Math.abs(b));
        }
        return new BigInteger(addSmall(b, Math.abs(a)), a < 0);
      };
      SmallInteger.prototype.plus = SmallInteger.prototype.add;
      NativeBigInt.prototype.add = function(v) {
        return new NativeBigInt(this.value + parseValue(v).value);
      };
      NativeBigInt.prototype.plus = NativeBigInt.prototype.add;
      function subtract(a, b) {
        var a_l = a.length, b_l = b.length, r = new Array(a_l), borrow = 0, base = BASE, i2, difference;
        for (i2 = 0; i2 < b_l; i2++) {
          difference = a[i2] - borrow - b[i2];
          if (difference < 0) {
            difference += base;
            borrow = 1;
          } else
            borrow = 0;
          r[i2] = difference;
        }
        for (i2 = b_l; i2 < a_l; i2++) {
          difference = a[i2] - borrow;
          if (difference < 0)
            difference += base;
          else {
            r[i2++] = difference;
            break;
          }
          r[i2] = difference;
        }
        for (; i2 < a_l; i2++) {
          r[i2] = a[i2];
        }
        trim(r);
        return r;
      }
      function subtractAny(a, b, sign) {
        var value;
        if (compareAbs(a, b) >= 0) {
          value = subtract(a, b);
        } else {
          value = subtract(b, a);
          sign = !sign;
        }
        value = arrayToSmall(value);
        if (typeof value === "number") {
          if (sign)
            value = -value;
          return new SmallInteger(value);
        }
        return new BigInteger(value, sign);
      }
      function subtractSmall(a, b, sign) {
        var l2 = a.length, r = new Array(l2), carry = -b, base = BASE, i2, difference;
        for (i2 = 0; i2 < l2; i2++) {
          difference = a[i2] + carry;
          carry = Math.floor(difference / base);
          difference %= base;
          r[i2] = difference < 0 ? difference + base : difference;
        }
        r = arrayToSmall(r);
        if (typeof r === "number") {
          if (sign)
            r = -r;
          return new SmallInteger(r);
        }
        return new BigInteger(r, sign);
      }
      BigInteger.prototype.subtract = function(v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
          return this.add(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall)
          return subtractSmall(a, Math.abs(b), this.sign);
        return subtractAny(a, b, this.sign);
      };
      BigInteger.prototype.minus = BigInteger.prototype.subtract;
      SmallInteger.prototype.subtract = function(v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
          return this.add(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
          return new SmallInteger(a - b);
        }
        return subtractSmall(b, Math.abs(a), a >= 0);
      };
      SmallInteger.prototype.minus = SmallInteger.prototype.subtract;
      NativeBigInt.prototype.subtract = function(v) {
        return new NativeBigInt(this.value - parseValue(v).value);
      };
      NativeBigInt.prototype.minus = NativeBigInt.prototype.subtract;
      BigInteger.prototype.negate = function() {
        return new BigInteger(this.value, !this.sign);
      };
      SmallInteger.prototype.negate = function() {
        var sign = this.sign;
        var small = new SmallInteger(-this.value);
        small.sign = !sign;
        return small;
      };
      NativeBigInt.prototype.negate = function() {
        return new NativeBigInt(-this.value);
      };
      BigInteger.prototype.abs = function() {
        return new BigInteger(this.value, false);
      };
      SmallInteger.prototype.abs = function() {
        return new SmallInteger(Math.abs(this.value));
      };
      NativeBigInt.prototype.abs = function() {
        return new NativeBigInt(this.value >= 0 ? this.value : -this.value);
      };
      function multiplyLong(a, b) {
        var a_l = a.length, b_l = b.length, l2 = a_l + b_l, r = createArray(l2), base = BASE, product, carry, i2, a_i, b_j;
        for (i2 = 0; i2 < a_l; ++i2) {
          a_i = a[i2];
          for (var j = 0; j < b_l; ++j) {
            b_j = b[j];
            product = a_i * b_j + r[i2 + j];
            carry = Math.floor(product / base);
            r[i2 + j] = product - carry * base;
            r[i2 + j + 1] += carry;
          }
        }
        trim(r);
        return r;
      }
      function multiplySmall(a, b) {
        var l2 = a.length, r = new Array(l2), base = BASE, carry = 0, product, i2;
        for (i2 = 0; i2 < l2; i2++) {
          product = a[i2] * b + carry;
          carry = Math.floor(product / base);
          r[i2] = product - carry * base;
        }
        while (carry > 0) {
          r[i2++] = carry % base;
          carry = Math.floor(carry / base);
        }
        return r;
      }
      function shiftLeft(x, n) {
        var r = [];
        while (n-- > 0)
          r.push(0);
        return r.concat(x);
      }
      function multiplyKaratsuba(x, y) {
        var n = Math.max(x.length, y.length);
        if (n <= 30)
          return multiplyLong(x, y);
        n = Math.ceil(n / 2);
        var b = x.slice(n), a = x.slice(0, n), d = y.slice(n), c = y.slice(0, n);
        var ac = multiplyKaratsuba(a, c), bd = multiplyKaratsuba(b, d), abcd = multiplyKaratsuba(addAny(a, b), addAny(c, d));
        var product = addAny(addAny(ac, shiftLeft(subtract(subtract(abcd, ac), bd), n)), shiftLeft(bd, 2 * n));
        trim(product);
        return product;
      }
      function useKaratsuba(l1, l2) {
        return -0.012 * l1 - 0.012 * l2 + 15e-6 * l1 * l2 > 0;
      }
      BigInteger.prototype.multiply = function(v) {
        var n = parseValue(v), a = this.value, b = n.value, sign = this.sign !== n.sign, abs;
        if (n.isSmall) {
          if (b === 0)
            return Integer[0];
          if (b === 1)
            return this;
          if (b === -1)
            return this.negate();
          abs = Math.abs(b);
          if (abs < BASE) {
            return new BigInteger(multiplySmall(a, abs), sign);
          }
          b = smallToArray(abs);
        }
        if (useKaratsuba(a.length, b.length))
          return new BigInteger(multiplyKaratsuba(a, b), sign);
        return new BigInteger(multiplyLong(a, b), sign);
      };
      BigInteger.prototype.times = BigInteger.prototype.multiply;
      function multiplySmallAndArray(a, b, sign) {
        if (a < BASE) {
          return new BigInteger(multiplySmall(b, a), sign);
        }
        return new BigInteger(multiplyLong(b, smallToArray(a)), sign);
      }
      SmallInteger.prototype._multiplyBySmall = function(a) {
        if (isPrecise(a.value * this.value)) {
          return new SmallInteger(a.value * this.value);
        }
        return multiplySmallAndArray(Math.abs(a.value), smallToArray(Math.abs(this.value)), this.sign !== a.sign);
      };
      BigInteger.prototype._multiplyBySmall = function(a) {
        if (a.value === 0)
          return Integer[0];
        if (a.value === 1)
          return this;
        if (a.value === -1)
          return this.negate();
        return multiplySmallAndArray(Math.abs(a.value), this.value, this.sign !== a.sign);
      };
      SmallInteger.prototype.multiply = function(v) {
        return parseValue(v)._multiplyBySmall(this);
      };
      SmallInteger.prototype.times = SmallInteger.prototype.multiply;
      NativeBigInt.prototype.multiply = function(v) {
        return new NativeBigInt(this.value * parseValue(v).value);
      };
      NativeBigInt.prototype.times = NativeBigInt.prototype.multiply;
      function square(a) {
        var l2 = a.length, r = createArray(l2 + l2), base = BASE, product, carry, i2, a_i, a_j;
        for (i2 = 0; i2 < l2; i2++) {
          a_i = a[i2];
          carry = 0 - a_i * a_i;
          for (var j = i2; j < l2; j++) {
            a_j = a[j];
            product = 2 * (a_i * a_j) + r[i2 + j] + carry;
            carry = Math.floor(product / base);
            r[i2 + j] = product - carry * base;
          }
          r[i2 + l2] = carry;
        }
        trim(r);
        return r;
      }
      BigInteger.prototype.square = function() {
        return new BigInteger(square(this.value), false);
      };
      SmallInteger.prototype.square = function() {
        var value = this.value * this.value;
        if (isPrecise(value))
          return new SmallInteger(value);
        return new BigInteger(square(smallToArray(Math.abs(this.value))), false);
      };
      NativeBigInt.prototype.square = function(v) {
        return new NativeBigInt(this.value * this.value);
      };
      function divMod1(a, b) {
        var a_l = a.length, b_l = b.length, base = BASE, result = createArray(b.length), divisorMostSignificantDigit = b[b_l - 1], lambda = Math.ceil(base / (2 * divisorMostSignificantDigit)), remainder = multiplySmall(a, lambda), divisor = multiplySmall(b, lambda), quotientDigit, shift, carry, borrow, i2, l2, q;
        if (remainder.length <= a_l)
          remainder.push(0);
        divisor.push(0);
        divisorMostSignificantDigit = divisor[b_l - 1];
        for (shift = a_l - b_l; shift >= 0; shift--) {
          quotientDigit = base - 1;
          if (remainder[shift + b_l] !== divisorMostSignificantDigit) {
            quotientDigit = Math.floor((remainder[shift + b_l] * base + remainder[shift + b_l - 1]) / divisorMostSignificantDigit);
          }
          carry = 0;
          borrow = 0;
          l2 = divisor.length;
          for (i2 = 0; i2 < l2; i2++) {
            carry += quotientDigit * divisor[i2];
            q = Math.floor(carry / base);
            borrow += remainder[shift + i2] - (carry - q * base);
            carry = q;
            if (borrow < 0) {
              remainder[shift + i2] = borrow + base;
              borrow = -1;
            } else {
              remainder[shift + i2] = borrow;
              borrow = 0;
            }
          }
          while (borrow !== 0) {
            quotientDigit -= 1;
            carry = 0;
            for (i2 = 0; i2 < l2; i2++) {
              carry += remainder[shift + i2] - base + divisor[i2];
              if (carry < 0) {
                remainder[shift + i2] = carry + base;
                carry = 0;
              } else {
                remainder[shift + i2] = carry;
                carry = 1;
              }
            }
            borrow += carry;
          }
          result[shift] = quotientDigit;
        }
        remainder = divModSmall(remainder, lambda)[0];
        return [arrayToSmall(result), arrayToSmall(remainder)];
      }
      function divMod2(a, b) {
        var a_l = a.length, b_l = b.length, result = [], part = [], base = BASE, guess, xlen, highx, highy, check;
        while (a_l) {
          part.unshift(a[--a_l]);
          trim(part);
          if (compareAbs(part, b) < 0) {
            result.push(0);
            continue;
          }
          xlen = part.length;
          highx = part[xlen - 1] * base + part[xlen - 2];
          highy = b[b_l - 1] * base + b[b_l - 2];
          if (xlen > b_l) {
            highx = (highx + 1) * base;
          }
          guess = Math.ceil(highx / highy);
          do {
            check = multiplySmall(b, guess);
            if (compareAbs(check, part) <= 0)
              break;
            guess--;
          } while (guess);
          result.push(guess);
          part = subtract(part, check);
        }
        result.reverse();
        return [arrayToSmall(result), arrayToSmall(part)];
      }
      function divModSmall(value, lambda) {
        var length = value.length, quotient = createArray(length), base = BASE, i2, q, remainder, divisor;
        remainder = 0;
        for (i2 = length - 1; i2 >= 0; --i2) {
          divisor = remainder * base + value[i2];
          q = truncate(divisor / lambda);
          remainder = divisor - q * lambda;
          quotient[i2] = q | 0;
        }
        return [quotient, remainder | 0];
      }
      function divModAny(self2, v) {
        var value, n = parseValue(v);
        if (supportsNativeBigInt) {
          return [new NativeBigInt(self2.value / n.value), new NativeBigInt(self2.value % n.value)];
        }
        var a = self2.value, b = n.value;
        var quotient;
        if (b === 0)
          throw new Error("Cannot divide by zero");
        if (self2.isSmall) {
          if (n.isSmall) {
            return [new SmallInteger(truncate(a / b)), new SmallInteger(a % b)];
          }
          return [Integer[0], self2];
        }
        if (n.isSmall) {
          if (b === 1)
            return [self2, Integer[0]];
          if (b == -1)
            return [self2.negate(), Integer[0]];
          var abs = Math.abs(b);
          if (abs < BASE) {
            value = divModSmall(a, abs);
            quotient = arrayToSmall(value[0]);
            var remainder = value[1];
            if (self2.sign)
              remainder = -remainder;
            if (typeof quotient === "number") {
              if (self2.sign !== n.sign)
                quotient = -quotient;
              return [new SmallInteger(quotient), new SmallInteger(remainder)];
            }
            return [new BigInteger(quotient, self2.sign !== n.sign), new SmallInteger(remainder)];
          }
          b = smallToArray(abs);
        }
        var comparison = compareAbs(a, b);
        if (comparison === -1)
          return [Integer[0], self2];
        if (comparison === 0)
          return [Integer[self2.sign === n.sign ? 1 : -1], Integer[0]];
        if (a.length + b.length <= 200)
          value = divMod1(a, b);
        else
          value = divMod2(a, b);
        quotient = value[0];
        var qSign = self2.sign !== n.sign, mod = value[1], mSign = self2.sign;
        if (typeof quotient === "number") {
          if (qSign)
            quotient = -quotient;
          quotient = new SmallInteger(quotient);
        } else
          quotient = new BigInteger(quotient, qSign);
        if (typeof mod === "number") {
          if (mSign)
            mod = -mod;
          mod = new SmallInteger(mod);
        } else
          mod = new BigInteger(mod, mSign);
        return [quotient, mod];
      }
      BigInteger.prototype.divmod = function(v) {
        var result = divModAny(this, v);
        return {
          quotient: result[0],
          remainder: result[1]
        };
      };
      NativeBigInt.prototype.divmod = SmallInteger.prototype.divmod = BigInteger.prototype.divmod;
      BigInteger.prototype.divide = function(v) {
        return divModAny(this, v)[0];
      };
      NativeBigInt.prototype.over = NativeBigInt.prototype.divide = function(v) {
        return new NativeBigInt(this.value / parseValue(v).value);
      };
      SmallInteger.prototype.over = SmallInteger.prototype.divide = BigInteger.prototype.over = BigInteger.prototype.divide;
      BigInteger.prototype.mod = function(v) {
        return divModAny(this, v)[1];
      };
      NativeBigInt.prototype.mod = NativeBigInt.prototype.remainder = function(v) {
        return new NativeBigInt(this.value % parseValue(v).value);
      };
      SmallInteger.prototype.remainder = SmallInteger.prototype.mod = BigInteger.prototype.remainder = BigInteger.prototype.mod;
      BigInteger.prototype.pow = function(v) {
        var n = parseValue(v), a = this.value, b = n.value, value, x, y;
        if (b === 0)
          return Integer[1];
        if (a === 0)
          return Integer[0];
        if (a === 1)
          return Integer[1];
        if (a === -1)
          return n.isEven() ? Integer[1] : Integer[-1];
        if (n.sign) {
          return Integer[0];
        }
        if (!n.isSmall)
          throw new Error("The exponent " + n.toString() + " is too large.");
        if (this.isSmall) {
          if (isPrecise(value = Math.pow(a, b)))
            return new SmallInteger(truncate(value));
        }
        x = this;
        y = Integer[1];
        while (true) {
          if (b & true) {
            y = y.times(x);
            --b;
          }
          if (b === 0)
            break;
          b /= 2;
          x = x.square();
        }
        return y;
      };
      SmallInteger.prototype.pow = BigInteger.prototype.pow;
      NativeBigInt.prototype.pow = function(v) {
        var n = parseValue(v);
        var a = this.value, b = n.value;
        var _0 = BigInt(0), _1 = BigInt(1), _2 = BigInt(2);
        if (b === _0)
          return Integer[1];
        if (a === _0)
          return Integer[0];
        if (a === _1)
          return Integer[1];
        if (a === BigInt(-1))
          return n.isEven() ? Integer[1] : Integer[-1];
        if (n.isNegative())
          return new NativeBigInt(_0);
        var x = this;
        var y = Integer[1];
        while (true) {
          if ((b & _1) === _1) {
            y = y.times(x);
            --b;
          }
          if (b === _0)
            break;
          b /= _2;
          x = x.square();
        }
        return y;
      };
      BigInteger.prototype.modPow = function(exp, mod) {
        exp = parseValue(exp);
        mod = parseValue(mod);
        if (mod.isZero())
          throw new Error("Cannot take modPow with modulus 0");
        var r = Integer[1], base = this.mod(mod);
        if (exp.isNegative()) {
          exp = exp.multiply(Integer[-1]);
          base = base.modInv(mod);
        }
        while (exp.isPositive()) {
          if (base.isZero())
            return Integer[0];
          if (exp.isOdd())
            r = r.multiply(base).mod(mod);
          exp = exp.divide(2);
          base = base.square().mod(mod);
        }
        return r;
      };
      NativeBigInt.prototype.modPow = SmallInteger.prototype.modPow = BigInteger.prototype.modPow;
      function compareAbs(a, b) {
        if (a.length !== b.length) {
          return a.length > b.length ? 1 : -1;
        }
        for (var i2 = a.length - 1; i2 >= 0; i2--) {
          if (a[i2] !== b[i2])
            return a[i2] > b[i2] ? 1 : -1;
        }
        return 0;
      }
      BigInteger.prototype.compareAbs = function(v) {
        var n = parseValue(v), a = this.value, b = n.value;
        if (n.isSmall)
          return 1;
        return compareAbs(a, b);
      };
      SmallInteger.prototype.compareAbs = function(v) {
        var n = parseValue(v), a = Math.abs(this.value), b = n.value;
        if (n.isSmall) {
          b = Math.abs(b);
          return a === b ? 0 : a > b ? 1 : -1;
        }
        return -1;
      };
      NativeBigInt.prototype.compareAbs = function(v) {
        var a = this.value;
        var b = parseValue(v).value;
        a = a >= 0 ? a : -a;
        b = b >= 0 ? b : -b;
        return a === b ? 0 : a > b ? 1 : -1;
      };
      BigInteger.prototype.compare = function(v) {
        if (v === Infinity) {
          return -1;
        }
        if (v === -Infinity) {
          return 1;
        }
        var n = parseValue(v), a = this.value, b = n.value;
        if (this.sign !== n.sign) {
          return n.sign ? 1 : -1;
        }
        if (n.isSmall) {
          return this.sign ? -1 : 1;
        }
        return compareAbs(a, b) * (this.sign ? -1 : 1);
      };
      BigInteger.prototype.compareTo = BigInteger.prototype.compare;
      SmallInteger.prototype.compare = function(v) {
        if (v === Infinity) {
          return -1;
        }
        if (v === -Infinity) {
          return 1;
        }
        var n = parseValue(v), a = this.value, b = n.value;
        if (n.isSmall) {
          return a == b ? 0 : a > b ? 1 : -1;
        }
        if (a < 0 !== n.sign) {
          return a < 0 ? -1 : 1;
        }
        return a < 0 ? 1 : -1;
      };
      SmallInteger.prototype.compareTo = SmallInteger.prototype.compare;
      NativeBigInt.prototype.compare = function(v) {
        if (v === Infinity) {
          return -1;
        }
        if (v === -Infinity) {
          return 1;
        }
        var a = this.value;
        var b = parseValue(v).value;
        return a === b ? 0 : a > b ? 1 : -1;
      };
      NativeBigInt.prototype.compareTo = NativeBigInt.prototype.compare;
      BigInteger.prototype.equals = function(v) {
        return this.compare(v) === 0;
      };
      NativeBigInt.prototype.eq = NativeBigInt.prototype.equals = SmallInteger.prototype.eq = SmallInteger.prototype.equals = BigInteger.prototype.eq = BigInteger.prototype.equals;
      BigInteger.prototype.notEquals = function(v) {
        return this.compare(v) !== 0;
      };
      NativeBigInt.prototype.neq = NativeBigInt.prototype.notEquals = SmallInteger.prototype.neq = SmallInteger.prototype.notEquals = BigInteger.prototype.neq = BigInteger.prototype.notEquals;
      BigInteger.prototype.greater = function(v) {
        return this.compare(v) > 0;
      };
      NativeBigInt.prototype.gt = NativeBigInt.prototype.greater = SmallInteger.prototype.gt = SmallInteger.prototype.greater = BigInteger.prototype.gt = BigInteger.prototype.greater;
      BigInteger.prototype.lesser = function(v) {
        return this.compare(v) < 0;
      };
      NativeBigInt.prototype.lt = NativeBigInt.prototype.lesser = SmallInteger.prototype.lt = SmallInteger.prototype.lesser = BigInteger.prototype.lt = BigInteger.prototype.lesser;
      BigInteger.prototype.greaterOrEquals = function(v) {
        return this.compare(v) >= 0;
      };
      NativeBigInt.prototype.geq = NativeBigInt.prototype.greaterOrEquals = SmallInteger.prototype.geq = SmallInteger.prototype.greaterOrEquals = BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;
      BigInteger.prototype.lesserOrEquals = function(v) {
        return this.compare(v) <= 0;
      };
      NativeBigInt.prototype.leq = NativeBigInt.prototype.lesserOrEquals = SmallInteger.prototype.leq = SmallInteger.prototype.lesserOrEquals = BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;
      BigInteger.prototype.isEven = function() {
        return (this.value[0] & 1) === 0;
      };
      SmallInteger.prototype.isEven = function() {
        return (this.value & 1) === 0;
      };
      NativeBigInt.prototype.isEven = function() {
        return (this.value & BigInt(1)) === BigInt(0);
      };
      BigInteger.prototype.isOdd = function() {
        return (this.value[0] & 1) === 1;
      };
      SmallInteger.prototype.isOdd = function() {
        return (this.value & 1) === 1;
      };
      NativeBigInt.prototype.isOdd = function() {
        return (this.value & BigInt(1)) === BigInt(1);
      };
      BigInteger.prototype.isPositive = function() {
        return !this.sign;
      };
      SmallInteger.prototype.isPositive = function() {
        return this.value > 0;
      };
      NativeBigInt.prototype.isPositive = SmallInteger.prototype.isPositive;
      BigInteger.prototype.isNegative = function() {
        return this.sign;
      };
      SmallInteger.prototype.isNegative = function() {
        return this.value < 0;
      };
      NativeBigInt.prototype.isNegative = SmallInteger.prototype.isNegative;
      BigInteger.prototype.isUnit = function() {
        return false;
      };
      SmallInteger.prototype.isUnit = function() {
        return Math.abs(this.value) === 1;
      };
      NativeBigInt.prototype.isUnit = function() {
        return this.abs().value === BigInt(1);
      };
      BigInteger.prototype.isZero = function() {
        return false;
      };
      SmallInteger.prototype.isZero = function() {
        return this.value === 0;
      };
      NativeBigInt.prototype.isZero = function() {
        return this.value === BigInt(0);
      };
      BigInteger.prototype.isDivisibleBy = function(v) {
        var n = parseValue(v);
        if (n.isZero())
          return false;
        if (n.isUnit())
          return true;
        if (n.compareAbs(2) === 0)
          return this.isEven();
        return this.mod(n).isZero();
      };
      NativeBigInt.prototype.isDivisibleBy = SmallInteger.prototype.isDivisibleBy = BigInteger.prototype.isDivisibleBy;
      function isBasicPrime(v) {
        var n = v.abs();
        if (n.isUnit())
          return false;
        if (n.equals(2) || n.equals(3) || n.equals(5))
          return true;
        if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5))
          return false;
        if (n.lesser(49))
          return true;
      }
      function millerRabinTest(n, a) {
        var nPrev = n.prev(), b = nPrev, r = 0, d, t, i2, x;
        while (b.isEven())
          b = b.divide(2), r++;
        next:
          for (i2 = 0; i2 < a.length; i2++) {
            if (n.lesser(a[i2]))
              continue;
            x = bigInt(a[i2]).modPow(b, n);
            if (x.isUnit() || x.equals(nPrev))
              continue;
            for (d = r - 1; d != 0; d--) {
              x = x.square().mod(n);
              if (x.isUnit())
                return false;
              if (x.equals(nPrev))
                continue next;
            }
            return false;
          }
        return true;
      }
      BigInteger.prototype.isPrime = function(strict) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined2)
          return isPrime;
        var n = this.abs();
        var bits = n.bitLength();
        if (bits <= 64)
          return millerRabinTest(n, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]);
        var logN = Math.log(2) * bits.toJSNumber();
        var t = Math.ceil(strict === true ? 2 * Math.pow(logN, 2) : logN);
        for (var a = [], i2 = 0; i2 < t; i2++) {
          a.push(bigInt(i2 + 2));
        }
        return millerRabinTest(n, a);
      };
      NativeBigInt.prototype.isPrime = SmallInteger.prototype.isPrime = BigInteger.prototype.isPrime;
      BigInteger.prototype.isProbablePrime = function(iterations, rng2) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined2)
          return isPrime;
        var n = this.abs();
        var t = iterations === undefined2 ? 5 : iterations;
        for (var a = [], i2 = 0; i2 < t; i2++) {
          a.push(bigInt.randBetween(2, n.minus(2), rng2));
        }
        return millerRabinTest(n, a);
      };
      NativeBigInt.prototype.isProbablePrime = SmallInteger.prototype.isProbablePrime = BigInteger.prototype.isProbablePrime;
      BigInteger.prototype.modInv = function(n) {
        var t = bigInt.zero, newT = bigInt.one, r = parseValue(n), newR = this.abs(), q, lastT, lastR;
        while (!newR.isZero()) {
          q = r.divide(newR);
          lastT = t;
          lastR = r;
          t = newT;
          r = newR;
          newT = lastT.subtract(q.multiply(newT));
          newR = lastR.subtract(q.multiply(newR));
        }
        if (!r.isUnit())
          throw new Error(this.toString() + " and " + n.toString() + " are not co-prime");
        if (t.compare(0) === -1) {
          t = t.add(n);
        }
        if (this.isNegative()) {
          return t.negate();
        }
        return t;
      };
      NativeBigInt.prototype.modInv = SmallInteger.prototype.modInv = BigInteger.prototype.modInv;
      BigInteger.prototype.next = function() {
        var value = this.value;
        if (this.sign) {
          return subtractSmall(value, 1, this.sign);
        }
        return new BigInteger(addSmall(value, 1), this.sign);
      };
      SmallInteger.prototype.next = function() {
        var value = this.value;
        if (value + 1 < MAX_INT)
          return new SmallInteger(value + 1);
        return new BigInteger(MAX_INT_ARR, false);
      };
      NativeBigInt.prototype.next = function() {
        return new NativeBigInt(this.value + BigInt(1));
      };
      BigInteger.prototype.prev = function() {
        var value = this.value;
        if (this.sign) {
          return new BigInteger(addSmall(value, 1), true);
        }
        return subtractSmall(value, 1, this.sign);
      };
      SmallInteger.prototype.prev = function() {
        var value = this.value;
        if (value - 1 > -MAX_INT)
          return new SmallInteger(value - 1);
        return new BigInteger(MAX_INT_ARR, true);
      };
      NativeBigInt.prototype.prev = function() {
        return new NativeBigInt(this.value - BigInt(1));
      };
      var powersOfTwo = [1];
      while (2 * powersOfTwo[powersOfTwo.length - 1] <= BASE)
        powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);
      var powers2Length = powersOfTwo.length, highestPower2 = powersOfTwo[powers2Length - 1];
      function shift_isSmall(n) {
        return Math.abs(n) <= BASE;
      }
      BigInteger.prototype.shiftLeft = function(v) {
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
          throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0)
          return this.shiftRight(-n);
        var result = this;
        if (result.isZero())
          return result;
        while (n >= powers2Length) {
          result = result.multiply(highestPower2);
          n -= powers2Length - 1;
        }
        return result.multiply(powersOfTwo[n]);
      };
      NativeBigInt.prototype.shiftLeft = SmallInteger.prototype.shiftLeft = BigInteger.prototype.shiftLeft;
      BigInteger.prototype.shiftRight = function(v) {
        var remQuo;
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
          throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0)
          return this.shiftLeft(-n);
        var result = this;
        while (n >= powers2Length) {
          if (result.isZero() || result.isNegative() && result.isUnit())
            return result;
          remQuo = divModAny(result, highestPower2);
          result = remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
          n -= powers2Length - 1;
        }
        remQuo = divModAny(result, powersOfTwo[n]);
        return remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
      };
      NativeBigInt.prototype.shiftRight = SmallInteger.prototype.shiftRight = BigInteger.prototype.shiftRight;
      function bitwise(x, y, fn) {
        y = parseValue(y);
        var xSign = x.isNegative(), ySign = y.isNegative();
        var xRem = xSign ? x.not() : x, yRem = ySign ? y.not() : y;
        var xDigit = 0, yDigit = 0;
        var xDivMod = null, yDivMod = null;
        var result = [];
        while (!xRem.isZero() || !yRem.isZero()) {
          xDivMod = divModAny(xRem, highestPower2);
          xDigit = xDivMod[1].toJSNumber();
          if (xSign) {
            xDigit = highestPower2 - 1 - xDigit;
          }
          yDivMod = divModAny(yRem, highestPower2);
          yDigit = yDivMod[1].toJSNumber();
          if (ySign) {
            yDigit = highestPower2 - 1 - yDigit;
          }
          xRem = xDivMod[0];
          yRem = yDivMod[0];
          result.push(fn(xDigit, yDigit));
        }
        var sum = fn(xSign ? 1 : 0, ySign ? 1 : 0) !== 0 ? bigInt(-1) : bigInt(0);
        for (var i2 = result.length - 1; i2 >= 0; i2 -= 1) {
          sum = sum.multiply(highestPower2).add(bigInt(result[i2]));
        }
        return sum;
      }
      BigInteger.prototype.not = function() {
        return this.negate().prev();
      };
      NativeBigInt.prototype.not = SmallInteger.prototype.not = BigInteger.prototype.not;
      BigInteger.prototype.and = function(n) {
        return bitwise(this, n, function(a, b) {
          return a & b;
        });
      };
      NativeBigInt.prototype.and = SmallInteger.prototype.and = BigInteger.prototype.and;
      BigInteger.prototype.or = function(n) {
        return bitwise(this, n, function(a, b) {
          return a | b;
        });
      };
      NativeBigInt.prototype.or = SmallInteger.prototype.or = BigInteger.prototype.or;
      BigInteger.prototype.xor = function(n) {
        return bitwise(this, n, function(a, b) {
          return a ^ b;
        });
      };
      NativeBigInt.prototype.xor = SmallInteger.prototype.xor = BigInteger.prototype.xor;
      var LOBMASK_I = 1 << 30, LOBMASK_BI = (BASE & -BASE) * (BASE & -BASE) | LOBMASK_I;
      function roughLOB(n) {
        var v = n.value, x = typeof v === "number" ? v | LOBMASK_I : typeof v === "bigint" ? v | BigInt(LOBMASK_I) : v[0] + v[1] * BASE | LOBMASK_BI;
        return x & -x;
      }
      function integerLogarithm(value, base) {
        if (base.compareTo(value) <= 0) {
          var tmp = integerLogarithm(value, base.square(base));
          var p = tmp.p;
          var e = tmp.e;
          var t = p.multiply(base);
          return t.compareTo(value) <= 0 ? { p: t, e: e * 2 + 1 } : { p, e: e * 2 };
        }
        return { p: bigInt(1), e: 0 };
      }
      BigInteger.prototype.bitLength = function() {
        var n = this;
        if (n.compareTo(bigInt(0)) < 0) {
          n = n.negate().subtract(bigInt(1));
        }
        if (n.compareTo(bigInt(0)) === 0) {
          return bigInt(0);
        }
        return bigInt(integerLogarithm(n, bigInt(2)).e).add(bigInt(1));
      };
      NativeBigInt.prototype.bitLength = SmallInteger.prototype.bitLength = BigInteger.prototype.bitLength;
      function max(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.greater(b) ? a : b;
      }
      function min(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.lesser(b) ? a : b;
      }
      function gcd(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        if (a.equals(b))
          return a;
        if (a.isZero())
          return b;
        if (b.isZero())
          return a;
        var c = Integer[1], d, t;
        while (a.isEven() && b.isEven()) {
          d = min(roughLOB(a), roughLOB(b));
          a = a.divide(d);
          b = b.divide(d);
          c = c.multiply(d);
        }
        while (a.isEven()) {
          a = a.divide(roughLOB(a));
        }
        do {
          while (b.isEven()) {
            b = b.divide(roughLOB(b));
          }
          if (a.greater(b)) {
            t = b;
            b = a;
            a = t;
          }
          b = b.subtract(a);
        } while (!b.isZero());
        return c.isUnit() ? a : a.multiply(c);
      }
      function lcm(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        return a.divide(gcd(a, b)).multiply(b);
      }
      function randBetween(a, b, rng2) {
        a = parseValue(a);
        b = parseValue(b);
        var usedRNG = rng2 || Math.random;
        var low = min(a, b), high = max(a, b);
        var range = high.subtract(low).add(1);
        if (range.isSmall)
          return low.add(Math.floor(usedRNG() * range));
        var digits = toBase(range, BASE).value;
        var result = [], restricted = true;
        for (var i2 = 0; i2 < digits.length; i2++) {
          var top = restricted ? digits[i2] + (i2 + 1 < digits.length ? digits[i2 + 1] / BASE : 0) : BASE;
          var digit = truncate(usedRNG() * top);
          result.push(digit);
          if (digit < digits[i2])
            restricted = false;
        }
        return low.add(Integer.fromArray(result, BASE, false));
      }
      var parseBase = function(text, base, alphabet, caseSensitive) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        text = String(text);
        if (!caseSensitive) {
          text = text.toLowerCase();
          alphabet = alphabet.toLowerCase();
        }
        var length = text.length;
        var i2;
        var absBase = Math.abs(base);
        var alphabetValues = {};
        for (i2 = 0; i2 < alphabet.length; i2++) {
          alphabetValues[alphabet[i2]] = i2;
        }
        for (i2 = 0; i2 < length; i2++) {
          var c = text[i2];
          if (c === "-")
            continue;
          if (c in alphabetValues) {
            if (alphabetValues[c] >= absBase) {
              if (c === "1" && absBase === 1)
                continue;
              throw new Error(c + " is not a valid digit in base " + base + ".");
            }
          }
        }
        base = parseValue(base);
        var digits = [];
        var isNegative = text[0] === "-";
        for (i2 = isNegative ? 1 : 0; i2 < text.length; i2++) {
          var c = text[i2];
          if (c in alphabetValues)
            digits.push(parseValue(alphabetValues[c]));
          else if (c === "<") {
            var start = i2;
            do {
              i2++;
            } while (text[i2] !== ">" && i2 < text.length);
            digits.push(parseValue(text.slice(start + 1, i2)));
          } else
            throw new Error(c + " is not a valid character");
        }
        return parseBaseFromArray(digits, base, isNegative);
      };
      function parseBaseFromArray(digits, base, isNegative) {
        var val = Integer[0], pow = Integer[1], i2;
        for (i2 = digits.length - 1; i2 >= 0; i2--) {
          val = val.add(digits[i2].times(pow));
          pow = pow.times(base);
        }
        return isNegative ? val.negate() : val;
      }
      function stringify2(digit, alphabet) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        if (digit < alphabet.length) {
          return alphabet[digit];
        }
        return "<" + digit + ">";
      }
      function toBase(n, base) {
        base = bigInt(base);
        if (base.isZero()) {
          if (n.isZero())
            return { value: [0], isNegative: false };
          throw new Error("Cannot convert nonzero numbers to base 0.");
        }
        if (base.equals(-1)) {
          if (n.isZero())
            return { value: [0], isNegative: false };
          if (n.isNegative())
            return {
              value: [].concat.apply(
                [],
                Array.apply(null, Array(-n.toJSNumber())).map(Array.prototype.valueOf, [1, 0])
              ),
              isNegative: false
            };
          var arr = Array.apply(null, Array(n.toJSNumber() - 1)).map(Array.prototype.valueOf, [0, 1]);
          arr.unshift([1]);
          return {
            value: [].concat.apply([], arr),
            isNegative: false
          };
        }
        var neg = false;
        if (n.isNegative() && base.isPositive()) {
          neg = true;
          n = n.abs();
        }
        if (base.isUnit()) {
          if (n.isZero())
            return { value: [0], isNegative: false };
          return {
            value: Array.apply(null, Array(n.toJSNumber())).map(Number.prototype.valueOf, 1),
            isNegative: neg
          };
        }
        var out = [];
        var left = n, divmod;
        while (left.isNegative() || left.compareAbs(base) >= 0) {
          divmod = left.divmod(base);
          left = divmod.quotient;
          var digit = divmod.remainder;
          if (digit.isNegative()) {
            digit = base.minus(digit).abs();
            left = left.next();
          }
          out.push(digit.toJSNumber());
        }
        out.push(left.toJSNumber());
        return { value: out.reverse(), isNegative: neg };
      }
      function toBaseString(n, base, alphabet) {
        var arr = toBase(n, base);
        return (arr.isNegative ? "-" : "") + arr.value.map(function(x) {
          return stringify2(x, alphabet);
        }).join("");
      }
      BigInteger.prototype.toArray = function(radix) {
        return toBase(this, radix);
      };
      SmallInteger.prototype.toArray = function(radix) {
        return toBase(this, radix);
      };
      NativeBigInt.prototype.toArray = function(radix) {
        return toBase(this, radix);
      };
      BigInteger.prototype.toString = function(radix, alphabet) {
        if (radix === undefined2)
          radix = 10;
        if (radix !== 10)
          return toBaseString(this, radix, alphabet);
        var v = this.value, l2 = v.length, str = String(v[--l2]), zeros = "0000000", digit;
        while (--l2 >= 0) {
          digit = String(v[l2]);
          str += zeros.slice(digit.length) + digit;
        }
        var sign = this.sign ? "-" : "";
        return sign + str;
      };
      SmallInteger.prototype.toString = function(radix, alphabet) {
        if (radix === undefined2)
          radix = 10;
        if (radix != 10)
          return toBaseString(this, radix, alphabet);
        return String(this.value);
      };
      NativeBigInt.prototype.toString = SmallInteger.prototype.toString;
      NativeBigInt.prototype.toJSON = BigInteger.prototype.toJSON = SmallInteger.prototype.toJSON = function() {
        return this.toString();
      };
      BigInteger.prototype.valueOf = function() {
        return parseInt(this.toString(), 10);
      };
      BigInteger.prototype.toJSNumber = BigInteger.prototype.valueOf;
      SmallInteger.prototype.valueOf = function() {
        return this.value;
      };
      SmallInteger.prototype.toJSNumber = SmallInteger.prototype.valueOf;
      NativeBigInt.prototype.valueOf = NativeBigInt.prototype.toJSNumber = function() {
        return parseInt(this.toString(), 10);
      };
      function parseStringValue(v) {
        if (isPrecise(+v)) {
          var x = +v;
          if (x === truncate(x))
            return supportsNativeBigInt ? new NativeBigInt(BigInt(x)) : new SmallInteger(x);
          throw new Error("Invalid integer: " + v);
        }
        var sign = v[0] === "-";
        if (sign)
          v = v.slice(1);
        var split = v.split(/e/i);
        if (split.length > 2)
          throw new Error("Invalid integer: " + split.join("e"));
        if (split.length === 2) {
          var exp = split[1];
          if (exp[0] === "+")
            exp = exp.slice(1);
          exp = +exp;
          if (exp !== truncate(exp) || !isPrecise(exp))
            throw new Error("Invalid integer: " + exp + " is not a valid exponent.");
          var text = split[0];
          var decimalPlace = text.indexOf(".");
          if (decimalPlace >= 0) {
            exp -= text.length - decimalPlace - 1;
            text = text.slice(0, decimalPlace) + text.slice(decimalPlace + 1);
          }
          if (exp < 0)
            throw new Error("Cannot include negative exponent part for integers");
          text += new Array(exp + 1).join("0");
          v = text;
        }
        var isValid = /^([0-9][0-9]*)$/.test(v);
        if (!isValid)
          throw new Error("Invalid integer: " + v);
        if (supportsNativeBigInt) {
          return new NativeBigInt(BigInt(sign ? "-" + v : v));
        }
        var r = [], max2 = v.length, l2 = LOG_BASE, min2 = max2 - l2;
        while (max2 > 0) {
          r.push(+v.slice(min2, max2));
          min2 -= l2;
          if (min2 < 0)
            min2 = 0;
          max2 -= l2;
        }
        trim(r);
        return new BigInteger(r, sign);
      }
      function parseNumberValue(v) {
        if (supportsNativeBigInt) {
          return new NativeBigInt(BigInt(v));
        }
        if (isPrecise(v)) {
          if (v !== truncate(v))
            throw new Error(v + " is not an integer.");
          return new SmallInteger(v);
        }
        return parseStringValue(v.toString());
      }
      function parseValue(v) {
        if (typeof v === "number") {
          return parseNumberValue(v);
        }
        if (typeof v === "string") {
          return parseStringValue(v);
        }
        if (typeof v === "bigint") {
          return new NativeBigInt(v);
        }
        return v;
      }
      for (var i = 0; i < 1e3; i++) {
        Integer[i] = parseValue(i);
        if (i > 0)
          Integer[-i] = parseValue(-i);
      }
      Integer.one = Integer[1];
      Integer.zero = Integer[0];
      Integer.minusOne = Integer[-1];
      Integer.max = max;
      Integer.min = min;
      Integer.gcd = gcd;
      Integer.lcm = lcm;
      Integer.isInstance = function(x) {
        return x instanceof BigInteger || x instanceof SmallInteger || x instanceof NativeBigInt;
      };
      Integer.randBetween = randBetween;
      Integer.fromArray = function(digits, base, isNegative) {
        return parseBaseFromArray(digits.map(parseValue), parseValue(base || 10), isNegative);
      };
      return Integer;
    }();
    if (typeof module2 !== "undefined" && module2.hasOwnProperty("exports")) {
      module2.exports = bigInt;
    }
    if (typeof define === "function" && define.amd) {
      define(function() {
        return bigInt;
      });
    }
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Decrypt.js
var require_Decrypt = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Decrypt.js"(exports2, module2) {
    "use strict";
    var bigInt = require_BigInteger();
    var Stream = require("stream");
    if (!Stream.Writable || !Stream.Writable.prototype.destroy)
      Stream = require_readable();
    var table;
    function generateTable() {
      var poly = 3988292384, c, n, k;
      table = [];
      for (n = 0; n < 256; n++) {
        c = n;
        for (k = 0; k < 8; k++)
          c = c & 1 ? poly ^ c >>> 1 : c = c >>> 1;
        table[n] = c >>> 0;
      }
    }
    function crc(ch, crc2) {
      if (!table)
        generateTable();
      if (ch.charCodeAt)
        ch = ch.charCodeAt(0);
      return bigInt(crc2).shiftRight(8).and(16777215).xor(table[bigInt(crc2).xor(ch).and(255)]).value;
    }
    function Decrypt() {
      if (!(this instanceof Decrypt))
        return new Decrypt();
      this.key0 = 305419896;
      this.key1 = 591751049;
      this.key2 = 878082192;
    }
    Decrypt.prototype.update = function(h) {
      this.key0 = crc(h, this.key0);
      this.key1 = bigInt(this.key0).and(255).and(4294967295).add(this.key1);
      this.key1 = bigInt(this.key1).multiply(134775813).add(1).and(4294967295).value;
      this.key2 = crc(bigInt(this.key1).shiftRight(24).and(255), this.key2);
    };
    Decrypt.prototype.decryptByte = function(c) {
      var k = bigInt(this.key2).or(2);
      c = c ^ bigInt(k).multiply(bigInt(k ^ 1)).shiftRight(8).and(255);
      this.update(c);
      return c;
    };
    Decrypt.prototype.stream = function() {
      var stream = Stream.Transform(), self2 = this;
      stream._transform = function(d, e, cb) {
        for (var i = 0; i < d.length; i++) {
          d[i] = self2.decryptByte(d[i]);
        }
        this.push(d);
        cb();
      };
      return stream;
    };
    module2.exports = Decrypt;
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Open/unzip.js
var require_unzip = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Open/unzip.js"(exports2, module2) {
    "use strict";
    var Promise2 = require_bluebird();
    var Decrypt = require_Decrypt();
    var PullStream = require_PullStream();
    var Stream = require("stream");
    var binary = require_binary();
    var zlib = require("zlib");
    var parseExtraField = require_parseExtraField();
    var Buffer2 = require_Buffer();
    var parseDateTime = require_parseDateTime();
    if (!Stream.Writable || !Stream.Writable.prototype.destroy)
      Stream = require_readable();
    module2.exports = function unzip(source, offset, _password, directoryVars) {
      var file = PullStream(), entry = Stream.PassThrough();
      var req = source.stream(offset);
      req.pipe(file).on("error", function(e) {
        entry.emit("error", e);
      });
      entry.vars = file.pull(30).then(function(data) {
        var vars = binary.parse(data).word32lu("signature").word16lu("versionsNeededToExtract").word16lu("flags").word16lu("compressionMethod").word16lu("lastModifiedTime").word16lu("lastModifiedDate").word32lu("crc32").word32lu("compressedSize").word32lu("uncompressedSize").word16lu("fileNameLength").word16lu("extraFieldLength").vars;
        vars.lastModifiedDateTime = parseDateTime(vars.lastModifiedDate, vars.lastModifiedTime);
        return file.pull(vars.fileNameLength).then(function(fileName) {
          vars.fileName = fileName.toString("utf8");
          return file.pull(vars.extraFieldLength);
        }).then(function(extraField) {
          var checkEncryption;
          vars.extra = parseExtraField(extraField, vars);
          if (directoryVars && directoryVars.compressedSize)
            vars = directoryVars;
          if (vars.flags & 1)
            checkEncryption = file.pull(12).then(function(header) {
              if (!_password)
                throw new Error("MISSING_PASSWORD");
              var decrypt = Decrypt();
              String(_password).split("").forEach(function(d) {
                decrypt.update(d);
              });
              for (var i = 0; i < header.length; i++)
                header[i] = decrypt.decryptByte(header[i]);
              vars.decrypt = decrypt;
              vars.compressedSize -= 12;
              var check = vars.flags & 8 ? vars.lastModifiedTime >> 8 & 255 : vars.crc32 >> 24 & 255;
              if (header[11] !== check)
                throw new Error("BAD_PASSWORD");
              return vars;
            });
          return Promise2.resolve(checkEncryption).then(function() {
            entry.emit("vars", vars);
            return vars;
          });
        });
      });
      entry.vars.then(function(vars) {
        var fileSizeKnown = !(vars.flags & 8) || vars.compressedSize > 0, eof;
        var inflater = vars.compressionMethod ? zlib.createInflateRaw() : Stream.PassThrough();
        if (fileSizeKnown) {
          entry.size = vars.uncompressedSize;
          eof = vars.compressedSize;
        } else {
          eof = Buffer2.alloc(4);
          eof.writeUInt32LE(134695760, 0);
        }
        var stream = file.stream(eof);
        if (vars.decrypt)
          stream = stream.pipe(vars.decrypt.stream());
        stream.pipe(inflater).on("error", function(err) {
          entry.emit("error", err);
        }).pipe(entry).on("finish", function() {
          if (req.destroy)
            req.destroy();
          else if (req.abort)
            req.abort();
          else if (req.close)
            req.close();
          else if (req.push)
            req.push();
          else
            console.log("warning - unable to close stream");
        });
      }).catch(function(e) {
        entry.emit("error", e);
      });
      return entry;
    };
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Open/directory.js
var require_directory = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Open/directory.js"(exports2, module2) {
    "use strict";
    var binary = require_binary();
    var PullStream = require_PullStream();
    var unzip = require_unzip();
    var Promise2 = require_bluebird();
    var BufferStream = require_BufferStream();
    var parseExtraField = require_parseExtraField();
    var Buffer2 = require_Buffer();
    var path = require("path");
    var Writer = require_fstream().Writer;
    var parseDateTime = require_parseDateTime();
    var signature = Buffer2.alloc(4);
    signature.writeUInt32LE(101010256, 0);
    function getCrxHeader(source) {
      var sourceStream = source.stream(0).pipe(PullStream());
      return sourceStream.pull(4).then(function(data) {
        var signature2 = data.readUInt32LE(0);
        if (signature2 === 875721283) {
          var crxHeader;
          return sourceStream.pull(12).then(function(data2) {
            crxHeader = binary.parse(data2).word32lu("version").word32lu("pubKeyLength").word32lu("signatureLength").vars;
          }).then(function() {
            return sourceStream.pull(crxHeader.pubKeyLength + crxHeader.signatureLength);
          }).then(function(data2) {
            crxHeader.publicKey = data2.slice(0, crxHeader.pubKeyLength);
            crxHeader.signature = data2.slice(crxHeader.pubKeyLength);
            crxHeader.size = 16 + crxHeader.pubKeyLength + crxHeader.signatureLength;
            return crxHeader;
          });
        }
      });
    }
    function getZip64CentralDirectory(source, zip64CDL) {
      var d64loc = binary.parse(zip64CDL).word32lu("signature").word32lu("diskNumber").word64lu("offsetToStartOfCentralDirectory").word32lu("numberOfDisks").vars;
      if (d64loc.signature != 117853008) {
        throw new Error("invalid zip64 end of central dir locator signature (0x07064b50): 0x" + d64loc.signature.toString(16));
      }
      var dir64 = PullStream();
      source.stream(d64loc.offsetToStartOfCentralDirectory).pipe(dir64);
      return dir64.pull(56);
    }
    function parseZip64DirRecord(dir64record) {
      var vars = binary.parse(dir64record).word32lu("signature").word64lu("sizeOfCentralDirectory").word16lu("version").word16lu("versionsNeededToExtract").word32lu("diskNumber").word32lu("diskStart").word64lu("numberOfRecordsOnDisk").word64lu("numberOfRecords").word64lu("sizeOfCentralDirectory").word64lu("offsetToStartOfCentralDirectory").vars;
      if (vars.signature != 101075792) {
        throw new Error("invalid zip64 end of central dir locator signature (0x06064b50): 0x0" + vars.signature.toString(16));
      }
      return vars;
    }
    module2.exports = function centralDirectory(source, options) {
      var endDir = PullStream(), records = PullStream(), tailSize = options && options.tailSize || 80, sourceSize, crxHeader, startOffset, vars;
      if (options && options.crx)
        crxHeader = getCrxHeader(source);
      return source.size().then(function(size) {
        sourceSize = size;
        source.stream(Math.max(0, size - tailSize)).on("error", function(error) {
          endDir.emit("error", error);
        }).pipe(endDir);
        return endDir.pull(signature);
      }).then(function() {
        return Promise2.props({ directory: endDir.pull(22), crxHeader });
      }).then(function(d) {
        var data = d.directory;
        startOffset = d.crxHeader && d.crxHeader.size || 0;
        vars = binary.parse(data).word32lu("signature").word16lu("diskNumber").word16lu("diskStart").word16lu("numberOfRecordsOnDisk").word16lu("numberOfRecords").word32lu("sizeOfCentralDirectory").word32lu("offsetToStartOfCentralDirectory").word16lu("commentLength").vars;
        if (vars.numberOfRecords == 65535 || vars.numberOfRecords == 65535 || vars.offsetToStartOfCentralDirectory == 4294967295) {
          const zip64CDLSize = 20;
          const zip64CDLOffset = sourceSize - (tailSize - endDir.match + zip64CDLSize);
          const zip64CDLStream = PullStream();
          source.stream(zip64CDLOffset).pipe(zip64CDLStream);
          return zip64CDLStream.pull(zip64CDLSize).then(function(d2) {
            return getZip64CentralDirectory(source, d2);
          }).then(function(dir64record) {
            vars = parseZip64DirRecord(dir64record);
          });
        } else {
          vars.offsetToStartOfCentralDirectory += startOffset;
        }
      }).then(function() {
        if (vars.commentLength)
          return endDir.pull(vars.commentLength).then(function(comment) {
            vars.comment = comment.toString("utf8");
          });
      }).then(function() {
        source.stream(vars.offsetToStartOfCentralDirectory).pipe(records);
        vars.extract = function(opts) {
          if (!opts || !opts.path)
            throw new Error("PATH_MISSING");
          opts.path = path.resolve(path.normalize(opts.path));
          return vars.files.then(function(files) {
            return Promise2.map(files, function(entry) {
              if (entry.type == "Directory")
                return;
              var extractPath = path.join(opts.path, entry.path);
              if (extractPath.indexOf(opts.path) != 0) {
                return;
              }
              var writer = opts.getWriter ? opts.getWriter({ path: extractPath }) : Writer({ path: extractPath });
              return new Promise2(function(resolve, reject) {
                entry.stream(opts.password).on("error", reject).pipe(writer).on("close", resolve).on("error", reject);
              });
            }, { concurrency: opts.concurrency > 1 ? opts.concurrency : 1 });
          });
        };
        vars.files = Promise2.mapSeries(Array(vars.numberOfRecords), function() {
          return records.pull(46).then(function(data) {
            var vars2 = binary.parse(data).word32lu("signature").word16lu("versionMadeBy").word16lu("versionsNeededToExtract").word16lu("flags").word16lu("compressionMethod").word16lu("lastModifiedTime").word16lu("lastModifiedDate").word32lu("crc32").word32lu("compressedSize").word32lu("uncompressedSize").word16lu("fileNameLength").word16lu("extraFieldLength").word16lu("fileCommentLength").word16lu("diskNumber").word16lu("internalFileAttributes").word32lu("externalFileAttributes").word32lu("offsetToLocalFileHeader").vars;
            vars2.offsetToLocalFileHeader += startOffset;
            vars2.lastModifiedDateTime = parseDateTime(vars2.lastModifiedDate, vars2.lastModifiedTime);
            return records.pull(vars2.fileNameLength).then(function(fileNameBuffer) {
              vars2.pathBuffer = fileNameBuffer;
              vars2.path = fileNameBuffer.toString("utf8");
              vars2.isUnicode = (vars2.flags & 2048) != 0;
              return records.pull(vars2.extraFieldLength);
            }).then(function(extraField) {
              vars2.extra = parseExtraField(extraField, vars2);
              return records.pull(vars2.fileCommentLength);
            }).then(function(comment) {
              vars2.comment = comment;
              vars2.type = vars2.uncompressedSize === 0 && /[\/\\]$/.test(vars2.path) ? "Directory" : "File";
              vars2.stream = function(_password) {
                return unzip(source, vars2.offsetToLocalFileHeader, _password, vars2);
              };
              vars2.buffer = function(_password) {
                return BufferStream(vars2.stream(_password));
              };
              return vars2;
            });
          });
        });
        return Promise2.props(vars);
      });
    };
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Open/index.js
var require_Open = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/lib/Open/index.js"(exports2, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var Promise2 = require_bluebird();
    var directory = require_directory();
    var Stream = require("stream");
    if (!Stream.Writable || !Stream.Writable.prototype.destroy)
      Stream = require_readable();
    module2.exports = {
      buffer: function(buffer, options) {
        var source = {
          stream: function(offset, length) {
            var stream = Stream.PassThrough();
            stream.end(buffer.slice(offset, length));
            return stream;
          },
          size: function() {
            return Promise2.resolve(buffer.length);
          }
        };
        return directory(source, options);
      },
      file: function(filename, options) {
        var source = {
          stream: function(offset, length) {
            return fs.createReadStream(filename, { start: offset, end: length && offset + length });
          },
          size: function() {
            return new Promise2(function(resolve, reject) {
              fs.stat(filename, function(err, d) {
                if (err)
                  reject(err);
                else
                  resolve(d.size);
              });
            });
          }
        };
        return directory(source, options);
      },
      url: function(request, params, options) {
        if (typeof params === "string")
          params = { url: params };
        if (!params.url)
          throw "URL missing";
        params.headers = params.headers || {};
        var source = {
          stream: function(offset, length) {
            var options2 = Object.create(params);
            options2.headers = Object.create(params.headers);
            options2.headers.range = "bytes=" + offset + "-" + (length ? length : "");
            return request(options2);
          },
          size: function() {
            return new Promise2(function(resolve, reject) {
              var req = request(params);
              req.on("response", function(d) {
                req.abort();
                if (!d.headers["content-length"])
                  reject(new Error("Missing content length header"));
                else
                  resolve(d.headers["content-length"]);
              }).on("error", reject);
            });
          }
        };
        return directory(source, options);
      },
      s3: function(client, params, options) {
        var source = {
          size: function() {
            return new Promise2(function(resolve, reject) {
              client.headObject(params, function(err, d) {
                if (err)
                  reject(err);
                else
                  resolve(d.ContentLength);
              });
            });
          },
          stream: function(offset, length) {
            var d = {};
            for (var key in params)
              d[key] = params[key];
            d.Range = "bytes=" + offset + "-" + (length ? length : "");
            return client.getObject(d).createReadStream();
          }
        };
        return directory(source, options);
      },
      custom: function(source, options) {
        return directory(source, options);
      }
    };
  }
});

// ../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/unzip.js
var require_unzip2 = __commonJS({
  "../../../node_modules/.pnpm/unzipper@0.10.14/node_modules/unzipper/unzip.js"(exports2) {
    "use strict";
    require_listenercount();
    require_buffer_indexof_polyfill();
    require_setImmediate();
    exports2.Parse = require_parse();
    exports2.ParseOne = require_parseOne();
    exports2.Extract = require_extract();
    exports2.Open = require_Open();
  }
});

// ../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/utils/Utf8Stream.js
var require_Utf8Stream = __commonJS({
  "../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/utils/Utf8Stream.js"(exports2, module2) {
    "use strict";
    var { Transform } = require("stream");
    var { StringDecoder } = require("string_decoder");
    var Utf8Stream = class extends Transform {
      constructor(options) {
        super(Object.assign({}, options, { writableObjectMode: false }));
        this._buffer = "";
      }
      _transform(chunk, encoding, callback) {
        if (typeof chunk == "string") {
          this._transform = this._transformString;
        } else {
          this._stringDecoder = new StringDecoder();
          this._transform = this._transformBuffer;
        }
        this._transform(chunk, encoding, callback);
      }
      _transformBuffer(chunk, _, callback) {
        this._buffer += this._stringDecoder.write(chunk);
        this._processBuffer(callback);
      }
      _transformString(chunk, _, callback) {
        this._buffer += chunk.toString();
        this._processBuffer(callback);
      }
      _processBuffer(callback) {
        if (this._buffer) {
          this.push(this._buffer, "utf8");
          this._buffer = "";
        }
        callback(null);
      }
      _flushInput() {
        if (this._stringDecoder) {
          this._buffer += this._stringDecoder.end();
        }
      }
      _flush(callback) {
        this._flushInput();
        this._processBuffer(callback);
      }
    };
    module2.exports = Utf8Stream;
  }
});

// ../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/Parser.js
var require_Parser = __commonJS({
  "../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/Parser.js"(exports2, module2) {
    "use strict";
    var Utf8Stream = require_Utf8Stream();
    var patterns = {
      value1: /^(?:[\"\{\[\]\-\d]|true\b|false\b|null\b|\s{1,256})/,
      string: /^(?:[^\"\\]{1,256}|\\[bfnrt\"\\\/]|\\u[\da-fA-F]{4}|\")/,
      key1: /^(?:[\"\}]|\s{1,256})/,
      colon: /^(?:\:|\s{1,256})/,
      comma: /^(?:[\,\]\}]|\s{1,256})/,
      ws: /^\s{1,256}/,
      numberStart: /^\d/,
      numberDigit: /^\d{0,256}/,
      numberFraction: /^[\.eE]/,
      numberExponent: /^[eE]/,
      numberExpSign: /^[-+]/
    };
    var MAX_PATTERN_SIZE = 16;
    var noSticky = true;
    try {
      new RegExp(".", "y");
      noSticky = false;
    } catch (e) {
    }
    !noSticky && Object.keys(patterns).forEach((key) => {
      let src = patterns[key].source.slice(1);
      if (src.slice(0, 3) === "(?:" && src.slice(-1) === ")") {
        src = src.slice(3, -1);
      }
      patterns[key] = new RegExp(src, "y");
    });
    patterns.numberFracStart = patterns.numberExpStart = patterns.numberStart;
    patterns.numberFracDigit = patterns.numberExpDigit = patterns.numberDigit;
    var values = { true: true, false: false, null: null };
    var expected = { object: "objectStop", array: "arrayStop", "": "done" };
    var fromHex = (s) => String.fromCharCode(parseInt(s.slice(2), 16));
    var codes = { b: "\b", f: "\f", n: "\n", r: "\r", t: "	", '"': '"', "\\": "\\", "/": "/" };
    var Parser = class _Parser extends Utf8Stream {
      static make(options) {
        return new _Parser(options);
      }
      constructor(options) {
        super(Object.assign({}, options, { readableObjectMode: true }));
        this._packKeys = this._packStrings = this._packNumbers = this._streamKeys = this._streamStrings = this._streamNumbers = true;
        if (options) {
          "packValues" in options && (this._packKeys = this._packStrings = this._packNumbers = options.packValues);
          "packKeys" in options && (this._packKeys = options.packKeys);
          "packStrings" in options && (this._packStrings = options.packStrings);
          "packNumbers" in options && (this._packNumbers = options.packNumbers);
          "streamValues" in options && (this._streamKeys = this._streamStrings = this._streamNumbers = options.streamValues);
          "streamKeys" in options && (this._streamKeys = options.streamKeys);
          "streamStrings" in options && (this._streamStrings = options.streamStrings);
          "streamNumbers" in options && (this._streamNumbers = options.streamNumbers);
          this._jsonStreaming = options.jsonStreaming;
        }
        !this._packKeys && (this._streamKeys = true);
        !this._packStrings && (this._streamStrings = true);
        !this._packNumbers && (this._streamNumbers = true);
        this._done = false;
        this._expect = this._jsonStreaming ? "done" : "value";
        this._stack = [];
        this._parent = "";
        this._open_number = false;
        this._accumulator = "";
      }
      _flush(callback) {
        this._done = true;
        super._flush((error) => {
          if (error)
            return callback(error);
          if (this._open_number) {
            if (this._streamNumbers) {
              this.push({ name: "endNumber" });
            }
            this._open_number = false;
            if (this._packNumbers) {
              this.push({ name: "numberValue", value: this._accumulator });
              this._accumulator = "";
            }
          }
          callback(null);
        });
      }
      _processBuffer(callback) {
        let match, value, index = 0;
        main:
          for (; ; ) {
            switch (this._expect) {
              case "value1":
              case "value":
                patterns.value1.lastIndex = index;
                match = patterns.value1.exec(this._buffer);
                if (!match) {
                  if (this._done || index + MAX_PATTERN_SIZE < this._buffer.length) {
                    if (index < this._buffer.length)
                      return callback(new Error("Parser cannot parse input: expected a value"));
                    return callback(new Error("Parser has expected a value"));
                  }
                  break main;
                }
                value = match[0];
                switch (value) {
                  case '"':
                    this._streamStrings && this.push({ name: "startString" });
                    this._expect = "string";
                    break;
                  case "{":
                    this.push({ name: "startObject" });
                    this._stack.push(this._parent);
                    this._parent = "object";
                    this._expect = "key1";
                    break;
                  case "[":
                    this.push({ name: "startArray" });
                    this._stack.push(this._parent);
                    this._parent = "array";
                    this._expect = "value1";
                    break;
                  case "]":
                    if (this._expect !== "value1")
                      return callback(new Error("Parser cannot parse input: unexpected token ']'"));
                    if (this._open_number) {
                      this._streamNumbers && this.push({ name: "endNumber" });
                      this._open_number = false;
                      if (this._packNumbers) {
                        this.push({ name: "numberValue", value: this._accumulator });
                        this._accumulator = "";
                      }
                    }
                    this.push({ name: "endArray" });
                    this._parent = this._stack.pop();
                    this._expect = expected[this._parent];
                    break;
                  case "-":
                    this._open_number = true;
                    if (this._streamNumbers) {
                      this.push({ name: "startNumber" });
                      this.push({ name: "numberChunk", value: "-" });
                    }
                    this._packNumbers && (this._accumulator = "-");
                    this._expect = "numberStart";
                    break;
                  case "0":
                    this._open_number = true;
                    if (this._streamNumbers) {
                      this.push({ name: "startNumber" });
                      this.push({ name: "numberChunk", value: "0" });
                    }
                    this._packNumbers && (this._accumulator = "0");
                    this._expect = "numberFraction";
                    break;
                  case "1":
                  case "2":
                  case "3":
                  case "4":
                  case "5":
                  case "6":
                  case "7":
                  case "8":
                  case "9":
                    this._open_number = true;
                    if (this._streamNumbers) {
                      this.push({ name: "startNumber" });
                      this.push({ name: "numberChunk", value });
                    }
                    this._packNumbers && (this._accumulator = value);
                    this._expect = "numberDigit";
                    break;
                  case "true":
                  case "false":
                  case "null":
                    if (this._buffer.length - index === value.length && !this._done)
                      break main;
                    this.push({ name: value + "Value", value: values[value] });
                    this._expect = expected[this._parent];
                    break;
                }
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "keyVal":
              case "string":
                patterns.string.lastIndex = index;
                match = patterns.string.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length && (this._done || this._buffer.length - index >= 6))
                    return callback(new Error("Parser cannot parse input: escaped characters"));
                  if (this._done)
                    return callback(new Error("Parser has expected a string value"));
                  break main;
                }
                value = match[0];
                if (value === '"') {
                  if (this._expect === "keyVal") {
                    this._streamKeys && this.push({ name: "endKey" });
                    if (this._packKeys) {
                      this.push({ name: "keyValue", value: this._accumulator });
                      this._accumulator = "";
                    }
                    this._expect = "colon";
                  } else {
                    this._streamStrings && this.push({ name: "endString" });
                    if (this._packStrings) {
                      this.push({ name: "stringValue", value: this._accumulator });
                      this._accumulator = "";
                    }
                    this._expect = expected[this._parent];
                  }
                } else if (value.length > 1 && value.charAt(0) === "\\") {
                  const t = value.length == 2 ? codes[value.charAt(1)] : fromHex(value);
                  if (this._expect === "keyVal" ? this._streamKeys : this._streamStrings) {
                    this.push({ name: "stringChunk", value: t });
                  }
                  if (this._expect === "keyVal" ? this._packKeys : this._packStrings) {
                    this._accumulator += t;
                  }
                } else {
                  if (this._expect === "keyVal" ? this._streamKeys : this._streamStrings) {
                    this.push({ name: "stringChunk", value });
                  }
                  if (this._expect === "keyVal" ? this._packKeys : this._packStrings) {
                    this._accumulator += value;
                  }
                }
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "key1":
              case "key":
                patterns.key1.lastIndex = index;
                match = patterns.key1.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length || this._done)
                    return callback(new Error("Parser cannot parse input: expected an object key"));
                  break main;
                }
                value = match[0];
                if (value === '"') {
                  this._streamKeys && this.push({ name: "startKey" });
                  this._expect = "keyVal";
                } else if (value === "}") {
                  if (this._expect !== "key1")
                    return callback(new Error("Parser cannot parse input: unexpected token '}'"));
                  this.push({ name: "endObject" });
                  this._parent = this._stack.pop();
                  this._expect = expected[this._parent];
                }
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "colon":
                patterns.colon.lastIndex = index;
                match = patterns.colon.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length || this._done)
                    return callback(new Error("Parser cannot parse input: expected ':'"));
                  break main;
                }
                value = match[0];
                value === ":" && (this._expect = "value");
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "arrayStop":
              case "objectStop":
                patterns.comma.lastIndex = index;
                match = patterns.comma.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length || this._done)
                    return callback(new Error("Parser cannot parse input: expected ','"));
                  break main;
                }
                if (this._open_number) {
                  this._streamNumbers && this.push({ name: "endNumber" });
                  this._open_number = false;
                  if (this._packNumbers) {
                    this.push({ name: "numberValue", value: this._accumulator });
                    this._accumulator = "";
                  }
                }
                value = match[0];
                if (value === ",") {
                  this._expect = this._expect === "arrayStop" ? "value" : "key";
                } else if (value === "}" || value === "]") {
                  if (value === "}" ? this._expect === "arrayStop" : this._expect !== "arrayStop") {
                    return callback(new Error("Parser cannot parse input: expected '" + (this._expect === "arrayStop" ? "]" : "}") + "'"));
                  }
                  this.push({ name: value === "}" ? "endObject" : "endArray" });
                  this._parent = this._stack.pop();
                  this._expect = expected[this._parent];
                }
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "numberStart":
                patterns.numberStart.lastIndex = index;
                match = patterns.numberStart.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length || this._done)
                    return callback(new Error("Parser cannot parse input: expected a starting digit"));
                  break main;
                }
                value = match[0];
                this._streamNumbers && this.push({ name: "numberChunk", value });
                this._packNumbers && (this._accumulator += value);
                this._expect = value === "0" ? "numberFraction" : "numberDigit";
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "numberDigit":
                patterns.numberDigit.lastIndex = index;
                match = patterns.numberDigit.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length || this._done)
                    return callback(new Error("Parser cannot parse input: expected a digit"));
                  break main;
                }
                value = match[0];
                if (value) {
                  this._streamNumbers && this.push({ name: "numberChunk", value });
                  this._packNumbers && (this._accumulator += value);
                  if (noSticky) {
                    this._buffer = this._buffer.slice(value.length);
                  } else {
                    index += value.length;
                  }
                } else {
                  if (index < this._buffer.length) {
                    this._expect = "numberFraction";
                    break;
                  }
                  if (this._done) {
                    this._expect = expected[this._parent];
                    break;
                  }
                  break main;
                }
                break;
              case "numberFraction":
                patterns.numberFraction.lastIndex = index;
                match = patterns.numberFraction.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length || this._done) {
                    this._expect = expected[this._parent];
                    break;
                  }
                  break main;
                }
                value = match[0];
                this._streamNumbers && this.push({ name: "numberChunk", value });
                this._packNumbers && (this._accumulator += value);
                this._expect = value === "." ? "numberFracStart" : "numberExpSign";
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "numberFracStart":
                patterns.numberFracStart.lastIndex = index;
                match = patterns.numberFracStart.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length || this._done)
                    return callback(new Error("Parser cannot parse input: expected a fractional part of a number"));
                  break main;
                }
                value = match[0];
                this._streamNumbers && this.push({ name: "numberChunk", value });
                this._packNumbers && (this._accumulator += value);
                this._expect = "numberFracDigit";
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "numberFracDigit":
                patterns.numberFracDigit.lastIndex = index;
                match = patterns.numberFracDigit.exec(this._buffer);
                value = match[0];
                if (value) {
                  this._streamNumbers && this.push({ name: "numberChunk", value });
                  this._packNumbers && (this._accumulator += value);
                  if (noSticky) {
                    this._buffer = this._buffer.slice(value.length);
                  } else {
                    index += value.length;
                  }
                } else {
                  if (index < this._buffer.length) {
                    this._expect = "numberExponent";
                    break;
                  }
                  if (this._done) {
                    this._expect = expected[this._parent];
                    break;
                  }
                  break main;
                }
                break;
              case "numberExponent":
                patterns.numberExponent.lastIndex = index;
                match = patterns.numberExponent.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length) {
                    this._expect = expected[this._parent];
                    break;
                  }
                  if (this._done) {
                    this._expect = "done";
                    break;
                  }
                  break main;
                }
                value = match[0];
                this._streamNumbers && this.push({ name: "numberChunk", value });
                this._packNumbers && (this._accumulator += value);
                this._expect = "numberExpSign";
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "numberExpSign":
                patterns.numberExpSign.lastIndex = index;
                match = patterns.numberExpSign.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length) {
                    this._expect = "numberExpStart";
                    break;
                  }
                  if (this._done)
                    return callback(new Error("Parser has expected an exponent value of a number"));
                  break main;
                }
                value = match[0];
                this._streamNumbers && this.push({ name: "numberChunk", value });
                this._packNumbers && (this._accumulator += value);
                this._expect = "numberExpStart";
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "numberExpStart":
                patterns.numberExpStart.lastIndex = index;
                match = patterns.numberExpStart.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length || this._done)
                    return callback(new Error("Parser cannot parse input: expected an exponent part of a number"));
                  break main;
                }
                value = match[0];
                this._streamNumbers && this.push({ name: "numberChunk", value });
                this._packNumbers && (this._accumulator += value);
                this._expect = "numberExpDigit";
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
              case "numberExpDigit":
                patterns.numberExpDigit.lastIndex = index;
                match = patterns.numberExpDigit.exec(this._buffer);
                value = match[0];
                if (value) {
                  this._streamNumbers && this.push({ name: "numberChunk", value });
                  this._packNumbers && (this._accumulator += value);
                  if (noSticky) {
                    this._buffer = this._buffer.slice(value.length);
                  } else {
                    index += value.length;
                  }
                } else {
                  if (index < this._buffer.length || this._done) {
                    this._expect = expected[this._parent];
                    break;
                  }
                  break main;
                }
                break;
              case "done":
                patterns.ws.lastIndex = index;
                match = patterns.ws.exec(this._buffer);
                if (!match) {
                  if (index < this._buffer.length) {
                    if (this._jsonStreaming) {
                      this._expect = "value";
                      break;
                    }
                    return callback(new Error("Parser cannot parse input: unexpected characters"));
                  }
                  break main;
                }
                value = match[0];
                if (this._open_number) {
                  this._streamNumbers && this.push({ name: "endNumber" });
                  this._open_number = false;
                  if (this._packNumbers) {
                    this.push({ name: "numberValue", value: this._accumulator });
                    this._accumulator = "";
                  }
                }
                if (noSticky) {
                  this._buffer = this._buffer.slice(value.length);
                } else {
                  index += value.length;
                }
                break;
            }
          }
        !noSticky && (this._buffer = this._buffer.slice(index));
        callback(null);
      }
    };
    Parser.parser = Parser.make;
    Parser.make.Constructor = Parser;
    module2.exports = Parser;
  }
});

// ../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/utils/emit.js
var require_emit = __commonJS({
  "../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/utils/emit.js"(exports2, module2) {
    "use strict";
    var emit = (stream) => stream.on("data", (item) => stream.emit(item.name, item.value));
    module2.exports = emit;
  }
});

// ../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/index.js
var require_stream_json = __commonJS({
  "../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/index.js"(exports2, module2) {
    "use strict";
    var Parser = require_Parser();
    var emit = require_emit();
    var make = (options) => emit(new Parser(options));
    make.Parser = Parser;
    make.parser = Parser.parser;
    module2.exports = make;
  }
});

// ../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/Assembler.js
var require_Assembler = __commonJS({
  "../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/Assembler.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var startObject = (Ctr) => function() {
      if (this.done) {
        this.done = false;
      } else {
        this.stack.push(this.current, this.key);
      }
      this.current = new Ctr();
      this.key = null;
    };
    var Assembler = class _Assembler extends EventEmitter {
      static connectTo(stream, options) {
        return new _Assembler(options).connectTo(stream);
      }
      constructor(options) {
        super();
        this.stack = [];
        this.current = this.key = null;
        this.done = true;
        if (options) {
          this.reviver = typeof options.reviver == "function" && options.reviver;
          if (this.reviver) {
            this.stringValue = this._saveValue = this._saveValueWithReviver;
          }
          if (options.numberAsString) {
            this.numberValue = this.stringValue;
          }
        }
      }
      connectTo(stream) {
        stream.on("data", (chunk) => {
          if (this[chunk.name]) {
            this[chunk.name](chunk.value);
            if (this.done)
              this.emit("done", this);
          }
        });
        return this;
      }
      get depth() {
        return (this.stack.length >> 1) + (this.done ? 0 : 1);
      }
      get path() {
        const path = [];
        for (let i = 0; i < this.stack.length; i += 2) {
          const key = this.stack[i + 1];
          path.push(key === null ? this.stack[i].length : key);
        }
        return path;
      }
      dropToLevel(level) {
        if (level < this.depth) {
          if (level) {
            const index = level - 1 << 1;
            this.current = this.stack[index];
            this.key = this.stack[index + 1];
            this.stack.splice(index);
          } else {
            this.stack = [];
            this.current = this.key = null;
            this.done = true;
          }
        }
        return this;
      }
      consume(chunk) {
        this[chunk.name] && this[chunk.name](chunk.value);
        return this;
      }
      keyValue(value) {
        this.key = value;
      }
      //stringValue() - aliased below to _saveValue()
      numberValue(value) {
        this._saveValue(parseFloat(value));
      }
      nullValue() {
        this._saveValue(null);
      }
      trueValue() {
        this._saveValue(true);
      }
      falseValue() {
        this._saveValue(false);
      }
      //startObject() - assigned below
      endObject() {
        if (this.stack.length) {
          const value = this.current;
          this.key = this.stack.pop();
          this.current = this.stack.pop();
          this._saveValue(value);
        } else {
          this.done = true;
        }
      }
      //startArray() - assigned below
      //endArray() - aliased below to endObject()
      _saveValue(value) {
        if (this.done) {
          this.current = value;
        } else {
          if (this.current instanceof Array) {
            this.current.push(value);
          } else {
            this.current[this.key] = value;
            this.key = null;
          }
        }
      }
      _saveValueWithReviver(value) {
        if (this.done) {
          this.current = this.reviver("", value);
        } else {
          if (this.current instanceof Array) {
            value = this.reviver("" + this.current.length, value);
            this.current.push(value);
            if (value === void 0) {
              delete this.current[this.current.length - 1];
            }
          } else {
            value = this.reviver(this.key, value);
            if (value !== void 0) {
              this.current[this.key] = value;
            }
            this.key = null;
          }
        }
      }
    };
    Assembler.prototype.stringValue = Assembler.prototype._saveValue;
    Assembler.prototype.startObject = startObject(Object);
    Assembler.prototype.startArray = startObject(Array);
    Assembler.prototype.endArray = Assembler.prototype.endObject;
    module2.exports = Assembler;
  }
});

// ../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/streamers/StreamBase.js
var require_StreamBase = __commonJS({
  "../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/streamers/StreamBase.js"(exports2, module2) {
    "use strict";
    var { Transform } = require("stream");
    var Assembler = require_Assembler();
    var Counter = class {
      constructor(initialDepth) {
        this.depth = initialDepth;
      }
      startObject() {
        ++this.depth;
      }
      endObject() {
        --this.depth;
      }
      startArray() {
        ++this.depth;
      }
      endArray() {
        --this.depth;
      }
    };
    var StreamBase = class extends Transform {
      constructor(options) {
        super(Object.assign({}, options, { writableObjectMode: true, readableObjectMode: true }));
        if (options) {
          this.objectFilter = options.objectFilter;
          this.includeUndecided = options.includeUndecided;
        }
        if (typeof this.objectFilter != "function") {
          this._filter = this._transform;
        }
        this._transform = this._wait || this._filter;
        this._assembler = new Assembler(options);
      }
      _transform(chunk, encoding, callback) {
        if (this._assembler[chunk.name]) {
          this._assembler[chunk.name](chunk.value);
          if (this._assembler.depth === this._level) {
            this._push();
          }
        }
        callback(null);
      }
      _filter(chunk, encoding, callback) {
        if (this._assembler[chunk.name]) {
          this._assembler[chunk.name](chunk.value);
          const result = this.objectFilter(this._assembler);
          if (result) {
            if (this._assembler.depth === this._level) {
              this._push();
              this._transform = this._filter;
            }
            this._transform = this._accept;
            return callback(null);
          }
          if (result === false) {
            this._saved_assembler = this._assembler;
            this._assembler = new Counter(this._saved_assembler.depth);
            this._saved_assembler.dropToLevel(this._level);
            if (this._assembler.depth === this._level) {
              this._assembler = this._saved_assembler;
              this._transform = this._filter;
            }
            this._transform = this._reject;
            return callback(null);
          }
          if (this._assembler.depth === this._level) {
            this._push(!this.includeUndecided);
          }
        }
        callback(null);
      }
      _accept(chunk, encoding, callback) {
        if (this._assembler[chunk.name]) {
          this._assembler[chunk.name](chunk.value);
          if (this._assembler.depth === this._level) {
            this._push();
            this._transform = this._filter;
          }
        }
        callback(null);
      }
      _reject(chunk, encoding, callback) {
        if (this._assembler[chunk.name]) {
          this._assembler[chunk.name](chunk.value);
          if (this._assembler.depth === this._level) {
            this._assembler = this._saved_assembler;
            this._transform = this._filter;
          }
        }
        callback(null);
      }
    };
    module2.exports = StreamBase;
  }
});

// ../../../node_modules/.pnpm/stream-chain@2.2.5/node_modules/stream-chain/index.js
var require_stream_chain = __commonJS({
  "../../../node_modules/.pnpm/stream-chain@2.2.5/node_modules/stream-chain/index.js"(exports2, module2) {
    "use strict";
    var { Readable: Readable2, Writable, Duplex, Transform } = require("stream");
    var none = Symbol.for("object-stream.none");
    var finalSymbol = Symbol.for("object-stream.final");
    var manySymbol = Symbol.for("object-stream.many");
    var final = (value) => ({ [finalSymbol]: value });
    var many = (values) => ({ [manySymbol]: values });
    var isFinal = (o) => o && typeof o == "object" && finalSymbol in o;
    var isMany = (o) => o && typeof o == "object" && manySymbol in o;
    var getFinalValue = (o) => o[finalSymbol];
    var getManyValues = (o) => o[manySymbol];
    var runAsyncGenerator = async (gen, stream) => {
      for (; ; ) {
        let data = gen.next();
        if (data && typeof data.then == "function") {
          data = await data;
        }
        if (data.done)
          break;
        let value = data.value;
        if (value && typeof value.then == "function") {
          value = await value;
        }
        Chain.sanitize(value, stream);
      }
    };
    var wrapFunction = (fn) => new Transform({
      writableObjectMode: true,
      readableObjectMode: true,
      transform(chunk, encoding, callback) {
        try {
          const result = fn.call(this, chunk, encoding);
          if (result && typeof result.then == "function") {
            result.then(
              (result2) => (Chain.sanitize(result2, this), callback(null)),
              (error) => callback(error)
            );
            return;
          }
          if (result && typeof result.next == "function") {
            runAsyncGenerator(result, this).then(
              () => callback(null),
              (error) => callback(error)
            );
            return;
          }
          Chain.sanitize(result, this);
          callback(null);
        } catch (error) {
          callback(error);
        }
      }
    });
    var wrapArray = (fns) => new Transform({
      writableObjectMode: true,
      readableObjectMode: true,
      transform(chunk, encoding, callback) {
        try {
          let value = chunk;
          for (let i = 0; i < fns.length; ++i) {
            const result = fns[i].call(this, value, encoding);
            if (result === Chain.none) {
              callback(null);
              return;
            }
            if (Chain.isFinal(result)) {
              value = Chain.getFinalValue(result);
              break;
            }
            value = result;
          }
          Chain.sanitize(value, this);
          callback(null);
        } catch (error) {
          callback(error);
        }
      }
    });
    var isReadableNodeStream = (obj2) => obj2 && typeof obj2.pipe === "function" && typeof obj2.on === "function" && (!obj2._writableState || (typeof obj2._readableState === "object" ? obj2._readableState.readable : null) !== false) && // Duplex
    (!obj2._writableState || obj2._readableState);
    var isWritableNodeStream = (obj2) => obj2 && typeof obj2.write === "function" && typeof obj2.on === "function" && (!obj2._readableState || (typeof obj2._writableState === "object" ? obj2._writableState.writable : null) !== false);
    var isDuplexNodeStream = (obj2) => obj2 && typeof obj2.pipe === "function" && obj2._readableState && typeof obj2.on === "function" && typeof obj2.write === "function";
    var Chain = class _Chain extends Duplex {
      constructor(fns, options) {
        super(options || { writableObjectMode: true, readableObjectMode: true });
        if (!(fns instanceof Array) || !fns.length) {
          throw Error("Chain's argument should be a non-empty array.");
        }
        this.streams = fns.filter((fn) => fn).map((fn, index, fns2) => {
          if (typeof fn === "function" || fn instanceof Array)
            return _Chain.convertToTransform(fn);
          if (isDuplexNodeStream(fn) || !index && isReadableNodeStream(fn) || index === fns2.length - 1 && isWritableNodeStream(fn)) {
            return fn;
          }
          throw Error("Arguments should be functions, arrays or streams.");
        }).filter((s) => s);
        this.input = this.streams[0];
        this.output = this.streams.reduce((output, stream) => output && output.pipe(stream) || stream);
        if (!isWritableNodeStream(this.input)) {
          this._write = (_1, _2, callback) => callback(null);
          this._final = (callback) => callback(null);
          this.input.on("end", () => this.end());
        }
        if (isReadableNodeStream(this.output)) {
          this.output.on("data", (chunk) => !this.push(chunk) && this.output.pause());
          this.output.on("end", () => this.push(null));
        } else {
          this._read = () => {
          };
          this.resume();
          this.output.on("finish", () => this.push(null));
        }
        if (!options || !options.skipEvents) {
          this.streams.forEach((stream) => stream.on("error", (error) => this.emit("error", error)));
        }
      }
      _write(chunk, encoding, callback) {
        let error = null;
        try {
          this.input.write(chunk, encoding, (e) => callback(e || error));
        } catch (e) {
          error = e;
        }
      }
      _final(callback) {
        let error = null;
        try {
          this.input.end(null, null, (e) => callback(e || error));
        } catch (e) {
          error = e;
        }
      }
      _read() {
        this.output.resume();
      }
      static make(fns, options) {
        return new _Chain(fns, options);
      }
      static sanitize(result, stream) {
        if (_Chain.isFinal(result)) {
          result = _Chain.getFinalValue(result);
        } else if (_Chain.isMany(result)) {
          result = _Chain.getManyValues(result);
        }
        if (result !== void 0 && result !== null && result !== _Chain.none) {
          if (result instanceof Array) {
            result.forEach((value) => value !== void 0 && value !== null && stream.push(value));
          } else {
            stream.push(result);
          }
        }
      }
      static convertToTransform(fn) {
        if (typeof fn === "function")
          return wrapFunction(fn);
        if (fn instanceof Array)
          return fn.length ? wrapArray(fn) : null;
        return null;
      }
    };
    Chain.none = none;
    Chain.final = final;
    Chain.isFinal = isFinal;
    Chain.getFinalValue = getFinalValue;
    Chain.many = many;
    Chain.isMany = isMany;
    Chain.getManyValues = getManyValues;
    Chain.chain = Chain.make;
    Chain.make.Constructor = Chain;
    module2.exports = Chain;
  }
});

// ../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/utils/withParser.js
var require_withParser = __commonJS({
  "../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/utils/withParser.js"(exports2, module2) {
    "use strict";
    var Chain = require_stream_chain();
    var Parser = require_Parser();
    var withParser = (fn, options) => new Chain([new Parser(options), fn(options)], Object.assign({}, options, { writableObjectMode: false, readableObjectMode: true }));
    module2.exports = withParser;
  }
});

// ../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/streamers/StreamValues.js
var require_StreamValues = __commonJS({
  "../../../node_modules/.pnpm/stream-json@1.8.0/node_modules/stream-json/streamers/StreamValues.js"(exports2, module2) {
    "use strict";
    var StreamBase = require_StreamBase();
    var withParser = require_withParser();
    var StreamValues = class _StreamValues extends StreamBase {
      static make(options) {
        return new _StreamValues(options);
      }
      static withParser(options) {
        return withParser(_StreamValues.make, Object.assign({}, options, { jsonStreaming: true }));
      }
      constructor(options) {
        super(options);
        this._counter = 0;
        this._level = 0;
      }
      _push(discard) {
        if (discard) {
          ++this._counter;
        } else {
          this.push({ key: this._counter++, value: this._assembler.current });
        }
        this._assembler.current = this._assembler.key = null;
      }
    };
    StreamValues.streamValues = StreamValues.make;
    StreamValues.make.Constructor = StreamValues;
    module2.exports = StreamValues;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_freeGlobal.js
var require_freeGlobal = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_freeGlobal.js"(exports2, module2) {
    "use strict";
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    module2.exports = freeGlobal;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_root.js
var require_root = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_root.js"(exports2, module2) {
    "use strict";
    var freeGlobal = require_freeGlobal();
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    module2.exports = root;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Symbol.js
var require_Symbol = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Symbol.js"(exports2, module2) {
    "use strict";
    var root = require_root();
    var Symbol2 = root.Symbol;
    module2.exports = Symbol2;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getRawTag.js
var require_getRawTag = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getRawTag.js"(exports2, module2) {
    "use strict";
    var Symbol2 = require_Symbol();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var nativeObjectToString = objectProto.toString;
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
      try {
        value[symToStringTag] = void 0;
        var unmasked = true;
      } catch (e) {
      }
      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }
    module2.exports = getRawTag;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_objectToString.js
var require_objectToString = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_objectToString.js"(exports2, module2) {
    "use strict";
    var objectProto = Object.prototype;
    var nativeObjectToString = objectProto.toString;
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }
    module2.exports = objectToString;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseGetTag.js
var require_baseGetTag = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseGetTag.js"(exports2, module2) {
    "use strict";
    var Symbol2 = require_Symbol();
    var getRawTag = require_getRawTag();
    var objectToString = require_objectToString();
    var nullTag = "[object Null]";
    var undefinedTag = "[object Undefined]";
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    function baseGetTag(value) {
      if (value == null) {
        return value === void 0 ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    module2.exports = baseGetTag;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isObject.js
var require_isObject = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isObject.js"(exports2, module2) {
    "use strict";
    function isObject2(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }
    module2.exports = isObject2;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isFunction.js
var require_isFunction = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isFunction.js"(exports2, module2) {
    "use strict";
    var baseGetTag = require_baseGetTag();
    var isObject2 = require_isObject();
    var asyncTag = "[object AsyncFunction]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var proxyTag = "[object Proxy]";
    function isFunction(value) {
      if (!isObject2(value)) {
        return false;
      }
      var tag = baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }
    module2.exports = isFunction;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_coreJsData.js
var require_coreJsData = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_coreJsData.js"(exports2, module2) {
    "use strict";
    var root = require_root();
    var coreJsData = root["__core-js_shared__"];
    module2.exports = coreJsData;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isMasked.js
var require_isMasked = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isMasked.js"(exports2, module2) {
    "use strict";
    var coreJsData = require_coreJsData();
    var maskSrcKey = function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
      return uid ? "Symbol(src)_1." + uid : "";
    }();
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }
    module2.exports = isMasked;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_toSource.js
var require_toSource = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_toSource.js"(exports2, module2) {
    "use strict";
    var funcProto = Function.prototype;
    var funcToString = funcProto.toString;
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {
        }
        try {
          return func + "";
        } catch (e) {
        }
      }
      return "";
    }
    module2.exports = toSource;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsNative.js
var require_baseIsNative = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsNative.js"(exports2, module2) {
    "use strict";
    var isFunction = require_isFunction();
    var isMasked = require_isMasked();
    var isObject2 = require_isObject();
    var toSource = require_toSource();
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var reIsNative = RegExp(
      "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    );
    function baseIsNative(value) {
      if (!isObject2(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }
    module2.exports = baseIsNative;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getValue.js
var require_getValue = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getValue.js"(exports2, module2) {
    "use strict";
    function getValue(object, key) {
      return object == null ? void 0 : object[key];
    }
    module2.exports = getValue;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getNative.js
var require_getNative = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getNative.js"(exports2, module2) {
    "use strict";
    var baseIsNative = require_baseIsNative();
    var getValue = require_getValue();
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : void 0;
    }
    module2.exports = getNative;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_defineProperty.js
var require_defineProperty = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_defineProperty.js"(exports2, module2) {
    "use strict";
    var getNative = require_getNative();
    var defineProperty = function() {
      try {
        var func = getNative(Object, "defineProperty");
        func({}, "", {});
        return func;
      } catch (e) {
      }
    }();
    module2.exports = defineProperty;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseAssignValue.js
var require_baseAssignValue = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseAssignValue.js"(exports2, module2) {
    "use strict";
    var defineProperty = require_defineProperty();
    function baseAssignValue(object, key, value) {
      if (key == "__proto__" && defineProperty) {
        defineProperty(object, key, {
          "configurable": true,
          "enumerable": true,
          "value": value,
          "writable": true
        });
      } else {
        object[key] = value;
      }
    }
    module2.exports = baseAssignValue;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayAggregator.js
var require_arrayAggregator = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayAggregator.js"(exports2, module2) {
    "use strict";
    function arrayAggregator(array, setter, iteratee, accumulator) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        var value = array[index];
        setter(accumulator, value, iteratee(value), array);
      }
      return accumulator;
    }
    module2.exports = arrayAggregator;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_createBaseFor.js
var require_createBaseFor = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_createBaseFor.js"(exports2, module2) {
    "use strict";
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
        while (length--) {
          var key = props[fromRight ? length : ++index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }
    module2.exports = createBaseFor;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseFor.js
var require_baseFor = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseFor.js"(exports2, module2) {
    "use strict";
    var createBaseFor = require_createBaseFor();
    var baseFor = createBaseFor();
    module2.exports = baseFor;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseTimes.js
var require_baseTimes = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseTimes.js"(exports2, module2) {
    "use strict";
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    module2.exports = baseTimes;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isObjectLike.js
var require_isObjectLike = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isObjectLike.js"(exports2, module2) {
    "use strict";
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }
    module2.exports = isObjectLike;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsArguments.js
var require_baseIsArguments = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsArguments.js"(exports2, module2) {
    "use strict";
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var argsTag = "[object Arguments]";
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }
    module2.exports = baseIsArguments;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isArguments.js
var require_isArguments = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isArguments.js"(exports2, module2) {
    "use strict";
    var baseIsArguments = require_baseIsArguments();
    var isObjectLike = require_isObjectLike();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var isArguments = baseIsArguments(function() {
      return arguments;
    }()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
    };
    module2.exports = isArguments;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isArray.js
var require_isArray = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isArray.js"(exports2, module2) {
    "use strict";
    var isArray = Array.isArray;
    module2.exports = isArray;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/stubFalse.js
var require_stubFalse = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/stubFalse.js"(exports2, module2) {
    "use strict";
    function stubFalse() {
      return false;
    }
    module2.exports = stubFalse;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isBuffer.js
var require_isBuffer = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isBuffer.js"(exports2, module2) {
    "use strict";
    var root = require_root();
    var stubFalse = require_stubFalse();
    var freeExports = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && typeof module2 == "object" && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var Buffer2 = moduleExports ? root.Buffer : void 0;
    var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
    var isBuffer = nativeIsBuffer || stubFalse;
    module2.exports = isBuffer;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isIndex.js
var require_isIndex = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isIndex.js"(exports2, module2) {
    "use strict";
    var MAX_SAFE_INTEGER = 9007199254740991;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    module2.exports = isIndex;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isLength.js
var require_isLength = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isLength.js"(exports2, module2) {
    "use strict";
    var MAX_SAFE_INTEGER = 9007199254740991;
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    module2.exports = isLength;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsTypedArray.js
var require_baseIsTypedArray = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsTypedArray.js"(exports2, module2) {
    "use strict";
    var baseGetTag = require_baseGetTag();
    var isLength = require_isLength();
    var isObjectLike = require_isObjectLike();
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var funcTag = "[object Function]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var objectTag = "[object Object]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var float32Tag = "[object Float32Array]";
    var float64Tag = "[object Float64Array]";
    var int8Tag = "[object Int8Array]";
    var int16Tag = "[object Int16Array]";
    var int32Tag = "[object Int32Array]";
    var uint8Tag = "[object Uint8Array]";
    var uint8ClampedTag = "[object Uint8ClampedArray]";
    var uint16Tag = "[object Uint16Array]";
    var uint32Tag = "[object Uint32Array]";
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    function baseIsTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }
    module2.exports = baseIsTypedArray;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseUnary.js
var require_baseUnary = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseUnary.js"(exports2, module2) {
    "use strict";
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }
    module2.exports = baseUnary;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_nodeUtil.js
var require_nodeUtil = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_nodeUtil.js"(exports2, module2) {
    "use strict";
    var freeGlobal = require_freeGlobal();
    var freeExports = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && typeof module2 == "object" && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    }();
    module2.exports = nodeUtil;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isTypedArray.js
var require_isTypedArray = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isTypedArray.js"(exports2, module2) {
    "use strict";
    var baseIsTypedArray = require_baseIsTypedArray();
    var baseUnary = require_baseUnary();
    var nodeUtil = require_nodeUtil();
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
    module2.exports = isTypedArray;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayLikeKeys.js
var require_arrayLikeKeys = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayLikeKeys.js"(exports2, module2) {
    "use strict";
    var baseTimes = require_baseTimes();
    var isArguments = require_isArguments();
    var isArray = require_isArray();
    var isBuffer = require_isBuffer();
    var isIndex = require_isIndex();
    var isTypedArray = require_isTypedArray();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
        (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
        isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    module2.exports = arrayLikeKeys;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isPrototype.js
var require_isPrototype = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isPrototype.js"(exports2, module2) {
    "use strict";
    var objectProto = Object.prototype;
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    module2.exports = isPrototype;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_overArg.js
var require_overArg = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_overArg.js"(exports2, module2) {
    "use strict";
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    module2.exports = overArg;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_nativeKeys.js
var require_nativeKeys = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_nativeKeys.js"(exports2, module2) {
    "use strict";
    var overArg = require_overArg();
    var nativeKeys = overArg(Object.keys, Object);
    module2.exports = nativeKeys;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseKeys.js
var require_baseKeys = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseKeys.js"(exports2, module2) {
    "use strict";
    var isPrototype = require_isPrototype();
    var nativeKeys = require_nativeKeys();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    module2.exports = baseKeys;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isArrayLike.js
var require_isArrayLike = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isArrayLike.js"(exports2, module2) {
    "use strict";
    var isFunction = require_isFunction();
    var isLength = require_isLength();
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    module2.exports = isArrayLike;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/keys.js
var require_keys = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/keys.js"(exports2, module2) {
    "use strict";
    var arrayLikeKeys = require_arrayLikeKeys();
    var baseKeys = require_baseKeys();
    var isArrayLike = require_isArrayLike();
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    module2.exports = keys;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseForOwn.js
var require_baseForOwn = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseForOwn.js"(exports2, module2) {
    "use strict";
    var baseFor = require_baseFor();
    var keys = require_keys();
    function baseForOwn(object, iteratee) {
      return object && baseFor(object, iteratee, keys);
    }
    module2.exports = baseForOwn;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_createBaseEach.js
var require_createBaseEach = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_createBaseEach.js"(exports2, module2) {
    "use strict";
    var isArrayLike = require_isArrayLike();
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        if (collection == null) {
          return collection;
        }
        if (!isArrayLike(collection)) {
          return eachFunc(collection, iteratee);
        }
        var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
        while (fromRight ? index-- : ++index < length) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }
    module2.exports = createBaseEach;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseEach.js
var require_baseEach = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseEach.js"(exports2, module2) {
    "use strict";
    var baseForOwn = require_baseForOwn();
    var createBaseEach = require_createBaseEach();
    var baseEach = createBaseEach(baseForOwn);
    module2.exports = baseEach;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseAggregator.js
var require_baseAggregator = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseAggregator.js"(exports2, module2) {
    "use strict";
    var baseEach = require_baseEach();
    function baseAggregator(collection, setter, iteratee, accumulator) {
      baseEach(collection, function(value, key, collection2) {
        setter(accumulator, value, iteratee(value), collection2);
      });
      return accumulator;
    }
    module2.exports = baseAggregator;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheClear.js
var require_listCacheClear = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheClear.js"(exports2, module2) {
    "use strict";
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }
    module2.exports = listCacheClear;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/eq.js
var require_eq = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/eq.js"(exports2, module2) {
    "use strict";
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    module2.exports = eq;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_assocIndexOf.js
var require_assocIndexOf = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_assocIndexOf.js"(exports2, module2) {
    "use strict";
    var eq = require_eq();
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }
    module2.exports = assocIndexOf;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheDelete.js
var require_listCacheDelete = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheDelete.js"(exports2, module2) {
    "use strict";
    var assocIndexOf = require_assocIndexOf();
    var arrayProto = Array.prototype;
    var splice = arrayProto.splice;
    function listCacheDelete(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }
    module2.exports = listCacheDelete;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheGet.js
var require_listCacheGet = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheGet.js"(exports2, module2) {
    "use strict";
    var assocIndexOf = require_assocIndexOf();
    function listCacheGet(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      return index < 0 ? void 0 : data[index][1];
    }
    module2.exports = listCacheGet;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheHas.js
var require_listCacheHas = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheHas.js"(exports2, module2) {
    "use strict";
    var assocIndexOf = require_assocIndexOf();
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }
    module2.exports = listCacheHas;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheSet.js
var require_listCacheSet = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_listCacheSet.js"(exports2, module2) {
    "use strict";
    var assocIndexOf = require_assocIndexOf();
    function listCacheSet(key, value) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }
    module2.exports = listCacheSet;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_ListCache.js
var require_ListCache = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_ListCache.js"(exports2, module2) {
    "use strict";
    var listCacheClear = require_listCacheClear();
    var listCacheDelete = require_listCacheDelete();
    var listCacheGet = require_listCacheGet();
    var listCacheHas = require_listCacheHas();
    var listCacheSet = require_listCacheSet();
    function ListCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    module2.exports = ListCache;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackClear.js
var require_stackClear = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackClear.js"(exports2, module2) {
    "use strict";
    var ListCache = require_ListCache();
    function stackClear() {
      this.__data__ = new ListCache();
      this.size = 0;
    }
    module2.exports = stackClear;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackDelete.js
var require_stackDelete = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackDelete.js"(exports2, module2) {
    "use strict";
    function stackDelete(key) {
      var data = this.__data__, result = data["delete"](key);
      this.size = data.size;
      return result;
    }
    module2.exports = stackDelete;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackGet.js
var require_stackGet = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackGet.js"(exports2, module2) {
    "use strict";
    function stackGet(key) {
      return this.__data__.get(key);
    }
    module2.exports = stackGet;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackHas.js
var require_stackHas = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackHas.js"(exports2, module2) {
    "use strict";
    function stackHas(key) {
      return this.__data__.has(key);
    }
    module2.exports = stackHas;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Map.js
var require_Map = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Map.js"(exports2, module2) {
    "use strict";
    var getNative = require_getNative();
    var root = require_root();
    var Map2 = getNative(root, "Map");
    module2.exports = Map2;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_nativeCreate.js
var require_nativeCreate = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_nativeCreate.js"(exports2, module2) {
    "use strict";
    var getNative = require_getNative();
    var nativeCreate = getNative(Object, "create");
    module2.exports = nativeCreate;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashClear.js
var require_hashClear = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashClear.js"(exports2, module2) {
    "use strict";
    var nativeCreate = require_nativeCreate();
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }
    module2.exports = hashClear;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashDelete.js
var require_hashDelete = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashDelete.js"(exports2, module2) {
    "use strict";
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }
    module2.exports = hashDelete;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashGet.js
var require_hashGet = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashGet.js"(exports2, module2) {
    "use strict";
    var nativeCreate = require_nativeCreate();
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? void 0 : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : void 0;
    }
    module2.exports = hashGet;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashHas.js
var require_hashHas = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashHas.js"(exports2, module2) {
    "use strict";
    var nativeCreate = require_nativeCreate();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
    }
    module2.exports = hashHas;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashSet.js
var require_hashSet = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hashSet.js"(exports2, module2) {
    "use strict";
    var nativeCreate = require_nativeCreate();
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
      return this;
    }
    module2.exports = hashSet;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Hash.js
var require_Hash = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Hash.js"(exports2, module2) {
    "use strict";
    var hashClear = require_hashClear();
    var hashDelete = require_hashDelete();
    var hashGet = require_hashGet();
    var hashHas = require_hashHas();
    var hashSet = require_hashSet();
    function Hash(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    module2.exports = Hash;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheClear.js
var require_mapCacheClear = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheClear.js"(exports2, module2) {
    "use strict";
    var Hash = require_Hash();
    var ListCache = require_ListCache();
    var Map2 = require_Map();
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        "hash": new Hash(),
        "map": new (Map2 || ListCache)(),
        "string": new Hash()
      };
    }
    module2.exports = mapCacheClear;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isKeyable.js
var require_isKeyable = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isKeyable.js"(exports2, module2) {
    "use strict";
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    module2.exports = isKeyable;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getMapData.js
var require_getMapData = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getMapData.js"(exports2, module2) {
    "use strict";
    var isKeyable = require_isKeyable();
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    module2.exports = getMapData;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheDelete.js
var require_mapCacheDelete = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheDelete.js"(exports2, module2) {
    "use strict";
    var getMapData = require_getMapData();
    function mapCacheDelete(key) {
      var result = getMapData(this, key)["delete"](key);
      this.size -= result ? 1 : 0;
      return result;
    }
    module2.exports = mapCacheDelete;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheGet.js
var require_mapCacheGet = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheGet.js"(exports2, module2) {
    "use strict";
    var getMapData = require_getMapData();
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }
    module2.exports = mapCacheGet;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheHas.js
var require_mapCacheHas = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheHas.js"(exports2, module2) {
    "use strict";
    var getMapData = require_getMapData();
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }
    module2.exports = mapCacheHas;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheSet.js
var require_mapCacheSet = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapCacheSet.js"(exports2, module2) {
    "use strict";
    var getMapData = require_getMapData();
    function mapCacheSet(key, value) {
      var data = getMapData(this, key), size = data.size;
      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }
    module2.exports = mapCacheSet;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_MapCache.js
var require_MapCache = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_MapCache.js"(exports2, module2) {
    "use strict";
    var mapCacheClear = require_mapCacheClear();
    var mapCacheDelete = require_mapCacheDelete();
    var mapCacheGet = require_mapCacheGet();
    var mapCacheHas = require_mapCacheHas();
    var mapCacheSet = require_mapCacheSet();
    function MapCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    module2.exports = MapCache;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackSet.js
var require_stackSet = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stackSet.js"(exports2, module2) {
    "use strict";
    var ListCache = require_ListCache();
    var Map2 = require_Map();
    var MapCache = require_MapCache();
    var LARGE_ARRAY_SIZE = 200;
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }
    module2.exports = stackSet;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Stack.js
var require_Stack = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Stack.js"(exports2, module2) {
    "use strict";
    var ListCache = require_ListCache();
    var stackClear = require_stackClear();
    var stackDelete = require_stackDelete();
    var stackGet = require_stackGet();
    var stackHas = require_stackHas();
    var stackSet = require_stackSet();
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;
    module2.exports = Stack;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_setCacheAdd.js
var require_setCacheAdd = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_setCacheAdd.js"(exports2, module2) {
    "use strict";
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }
    module2.exports = setCacheAdd;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_setCacheHas.js
var require_setCacheHas = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_setCacheHas.js"(exports2, module2) {
    "use strict";
    function setCacheHas(value) {
      return this.__data__.has(value);
    }
    module2.exports = setCacheHas;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_SetCache.js
var require_SetCache = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_SetCache.js"(exports2, module2) {
    "use strict";
    var MapCache = require_MapCache();
    var setCacheAdd = require_setCacheAdd();
    var setCacheHas = require_setCacheHas();
    function SetCache(values) {
      var index = -1, length = values == null ? 0 : values.length;
      this.__data__ = new MapCache();
      while (++index < length) {
        this.add(values[index]);
      }
    }
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;
    module2.exports = SetCache;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arraySome.js
var require_arraySome = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arraySome.js"(exports2, module2) {
    "use strict";
    function arraySome(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }
    module2.exports = arraySome;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_cacheHas.js
var require_cacheHas = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_cacheHas.js"(exports2, module2) {
    "use strict";
    function cacheHas(cache, key) {
      return cache.has(key);
    }
    module2.exports = cacheHas;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_equalArrays.js
var require_equalArrays = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_equalArrays.js"(exports2, module2) {
    "use strict";
    var SetCache = require_SetCache();
    var arraySome = require_arraySome();
    var cacheHas = require_cacheHas();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      var arrStacked = stack.get(array);
      var othStacked = stack.get(other);
      if (arrStacked && othStacked) {
        return arrStacked == other && othStacked == array;
      }
      var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
      stack.set(array, other);
      stack.set(other, array);
      while (++index < arrLength) {
        var arrValue = array[index], othValue = other[index];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== void 0) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        if (seen) {
          if (!arraySome(other, function(othValue2, othIndex) {
            if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
            result = false;
            break;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
          result = false;
          break;
        }
      }
      stack["delete"](array);
      stack["delete"](other);
      return result;
    }
    module2.exports = equalArrays;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Uint8Array.js
var require_Uint8Array = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Uint8Array.js"(exports2, module2) {
    "use strict";
    var root = require_root();
    var Uint8Array2 = root.Uint8Array;
    module2.exports = Uint8Array2;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapToArray.js
var require_mapToArray = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_mapToArray.js"(exports2, module2) {
    "use strict";
    function mapToArray(map) {
      var index = -1, result = Array(map.size);
      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }
    module2.exports = mapToArray;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_setToArray.js
var require_setToArray = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_setToArray.js"(exports2, module2) {
    "use strict";
    function setToArray(set) {
      var index = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }
    module2.exports = setToArray;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_equalByTag.js
var require_equalByTag = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_equalByTag.js"(exports2, module2) {
    "use strict";
    var Symbol2 = require_Symbol();
    var Uint8Array2 = require_Uint8Array();
    var eq = require_eq();
    var equalArrays = require_equalArrays();
    var mapToArray = require_mapToArray();
    var setToArray = require_setToArray();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var symbolTag = "[object Symbol]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
    function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;
        case arrayBufferTag:
          if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
            return false;
          }
          return true;
        case boolTag:
        case dateTag:
        case numberTag:
          return eq(+object, +other);
        case errorTag:
          return object.name == other.name && object.message == other.message;
        case regexpTag:
        case stringTag:
          return object == other + "";
        case mapTag:
          var convert = mapToArray;
        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
          convert || (convert = setToArray);
          if (object.size != other.size && !isPartial) {
            return false;
          }
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;
          stack.set(object, other);
          var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
          stack["delete"](object);
          return result;
        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }
    module2.exports = equalByTag;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayPush.js
var require_arrayPush = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayPush.js"(exports2, module2) {
    "use strict";
    function arrayPush(array, values) {
      var index = -1, length = values.length, offset = array.length;
      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }
    module2.exports = arrayPush;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseGetAllKeys.js
var require_baseGetAllKeys = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseGetAllKeys.js"(exports2, module2) {
    "use strict";
    var arrayPush = require_arrayPush();
    var isArray = require_isArray();
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }
    module2.exports = baseGetAllKeys;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayFilter.js
var require_arrayFilter = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayFilter.js"(exports2, module2) {
    "use strict";
    function arrayFilter(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
    module2.exports = arrayFilter;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/stubArray.js
var require_stubArray = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/stubArray.js"(exports2, module2) {
    "use strict";
    function stubArray() {
      return [];
    }
    module2.exports = stubArray;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getSymbols.js
var require_getSymbols = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getSymbols.js"(exports2, module2) {
    "use strict";
    var arrayFilter = require_arrayFilter();
    var stubArray = require_stubArray();
    var objectProto = Object.prototype;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeGetSymbols = Object.getOwnPropertySymbols;
    var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return arrayFilter(nativeGetSymbols(object), function(symbol) {
        return propertyIsEnumerable.call(object, symbol);
      });
    };
    module2.exports = getSymbols;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getAllKeys.js
var require_getAllKeys = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getAllKeys.js"(exports2, module2) {
    "use strict";
    var baseGetAllKeys = require_baseGetAllKeys();
    var getSymbols = require_getSymbols();
    var keys = require_keys();
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }
    module2.exports = getAllKeys;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_equalObjects.js
var require_equalObjects = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_equalObjects.js"(exports2, module2) {
    "use strict";
    var getAllKeys = require_getAllKeys();
    var COMPARE_PARTIAL_FLAG = 1;
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      var objStacked = stack.get(object);
      var othStacked = stack.get(other);
      if (objStacked && othStacked) {
        return objStacked == other && othStacked == object;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);
      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key], othValue = other[key];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
        }
        if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == "constructor");
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor, othCtor = other.constructor;
        if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack["delete"](object);
      stack["delete"](other);
      return result;
    }
    module2.exports = equalObjects;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_DataView.js
var require_DataView = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_DataView.js"(exports2, module2) {
    "use strict";
    var getNative = require_getNative();
    var root = require_root();
    var DataView = getNative(root, "DataView");
    module2.exports = DataView;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Promise.js
var require_Promise = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Promise.js"(exports2, module2) {
    "use strict";
    var getNative = require_getNative();
    var root = require_root();
    var Promise2 = getNative(root, "Promise");
    module2.exports = Promise2;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Set.js
var require_Set = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_Set.js"(exports2, module2) {
    "use strict";
    var getNative = require_getNative();
    var root = require_root();
    var Set = getNative(root, "Set");
    module2.exports = Set;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_WeakMap.js
var require_WeakMap = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_WeakMap.js"(exports2, module2) {
    "use strict";
    var getNative = require_getNative();
    var root = require_root();
    var WeakMap = getNative(root, "WeakMap");
    module2.exports = WeakMap;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getTag.js
var require_getTag = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getTag.js"(exports2, module2) {
    "use strict";
    var DataView = require_DataView();
    var Map2 = require_Map();
    var Promise2 = require_Promise();
    var Set = require_Set();
    var WeakMap = require_WeakMap();
    var baseGetTag = require_baseGetTag();
    var toSource = require_toSource();
    var mapTag = "[object Map]";
    var objectTag = "[object Object]";
    var promiseTag = "[object Promise]";
    var setTag = "[object Set]";
    var weakMapTag = "[object WeakMap]";
    var dataViewTag = "[object DataView]";
    var dataViewCtorString = toSource(DataView);
    var mapCtorString = toSource(Map2);
    var promiseCtorString = toSource(Promise2);
    var setCtorString = toSource(Set);
    var weakMapCtorString = toSource(WeakMap);
    var getTag = baseGetTag;
    if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
      getTag = function(value) {
        var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString:
              return dataViewTag;
            case mapCtorString:
              return mapTag;
            case promiseCtorString:
              return promiseTag;
            case setCtorString:
              return setTag;
            case weakMapCtorString:
              return weakMapTag;
          }
        }
        return result;
      };
    }
    module2.exports = getTag;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsEqualDeep.js
var require_baseIsEqualDeep = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsEqualDeep.js"(exports2, module2) {
    "use strict";
    var Stack = require_Stack();
    var equalArrays = require_equalArrays();
    var equalByTag = require_equalByTag();
    var equalObjects = require_equalObjects();
    var getTag = require_getTag();
    var isArray = require_isArray();
    var isBuffer = require_isBuffer();
    var isTypedArray = require_isTypedArray();
    var COMPARE_PARTIAL_FLAG = 1;
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var objectTag = "[object Object]";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;
      var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
      if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack());
        return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
          stack || (stack = new Stack());
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack());
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }
    module2.exports = baseIsEqualDeep;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsEqual.js
var require_baseIsEqual = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsEqual.js"(exports2, module2) {
    "use strict";
    var baseIsEqualDeep = require_baseIsEqualDeep();
    var isObjectLike = require_isObjectLike();
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }
    module2.exports = baseIsEqual;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsMatch.js
var require_baseIsMatch = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIsMatch.js"(exports2, module2) {
    "use strict";
    var Stack = require_Stack();
    var baseIsEqual = require_baseIsEqual();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function baseIsMatch(object, source, matchData, customizer) {
      var index = matchData.length, length = index, noCustomizer = !customizer;
      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (index--) {
        var data = matchData[index];
        if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0], objValue = object[key], srcValue = data[1];
        if (noCustomizer && data[2]) {
          if (objValue === void 0 && !(key in object)) {
            return false;
          }
        } else {
          var stack = new Stack();
          if (customizer) {
            var result = customizer(objValue, srcValue, key, object, source, stack);
          }
          if (!(result === void 0 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result)) {
            return false;
          }
        }
      }
      return true;
    }
    module2.exports = baseIsMatch;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isStrictComparable.js
var require_isStrictComparable = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isStrictComparable.js"(exports2, module2) {
    "use strict";
    var isObject2 = require_isObject();
    function isStrictComparable(value) {
      return value === value && !isObject2(value);
    }
    module2.exports = isStrictComparable;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getMatchData.js
var require_getMatchData = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_getMatchData.js"(exports2, module2) {
    "use strict";
    var isStrictComparable = require_isStrictComparable();
    var keys = require_keys();
    function getMatchData(object) {
      var result = keys(object), length = result.length;
      while (length--) {
        var key = result[length], value = object[key];
        result[length] = [key, value, isStrictComparable(value)];
      }
      return result;
    }
    module2.exports = getMatchData;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_matchesStrictComparable.js
var require_matchesStrictComparable = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_matchesStrictComparable.js"(exports2, module2) {
    "use strict";
    function matchesStrictComparable(key, srcValue) {
      return function(object) {
        if (object == null) {
          return false;
        }
        return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
      };
    }
    module2.exports = matchesStrictComparable;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseMatches.js
var require_baseMatches = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseMatches.js"(exports2, module2) {
    "use strict";
    var baseIsMatch = require_baseIsMatch();
    var getMatchData = require_getMatchData();
    var matchesStrictComparable = require_matchesStrictComparable();
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
      }
      return function(object) {
        return object === source || baseIsMatch(object, source, matchData);
      };
    }
    module2.exports = baseMatches;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isSymbol.js
var require_isSymbol = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/isSymbol.js"(exports2, module2) {
    "use strict";
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var symbolTag = "[object Symbol]";
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
    }
    module2.exports = isSymbol;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isKey.js
var require_isKey = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_isKey.js"(exports2, module2) {
    "use strict";
    var isArray = require_isArray();
    var isSymbol = require_isSymbol();
    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
    var reIsPlainProp = /^\w*$/;
    function isKey(value, object) {
      if (isArray(value)) {
        return false;
      }
      var type = typeof value;
      if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
        return true;
      }
      return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
    }
    module2.exports = isKey;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/memoize.js
var require_memoize = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/memoize.js"(exports2, module2) {
    "use strict";
    var MapCache = require_MapCache();
    var FUNC_ERROR_TEXT = "Expected a function";
    function memoize(func, resolver) {
      if (typeof func != "function" || resolver != null && typeof resolver != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
      };
      memoized.cache = new (memoize.Cache || MapCache)();
      return memoized;
    }
    memoize.Cache = MapCache;
    module2.exports = memoize;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_memoizeCapped.js
var require_memoizeCapped = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_memoizeCapped.js"(exports2, module2) {
    "use strict";
    var memoize = require_memoize();
    var MAX_MEMOIZE_SIZE = 500;
    function memoizeCapped(func) {
      var result = memoize(func, function(key) {
        if (cache.size === MAX_MEMOIZE_SIZE) {
          cache.clear();
        }
        return key;
      });
      var cache = result.cache;
      return result;
    }
    module2.exports = memoizeCapped;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stringToPath.js
var require_stringToPath = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_stringToPath.js"(exports2, module2) {
    "use strict";
    var memoizeCapped = require_memoizeCapped();
    var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
    var reEscapeChar = /\\(\\)?/g;
    var stringToPath = memoizeCapped(function(string) {
      var result = [];
      if (string.charCodeAt(0) === 46) {
        result.push("");
      }
      string.replace(rePropName, function(match, number, quote, subString) {
        result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
      });
      return result;
    });
    module2.exports = stringToPath;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayMap.js
var require_arrayMap = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_arrayMap.js"(exports2, module2) {
    "use strict";
    function arrayMap(array, iteratee) {
      var index = -1, length = array == null ? 0 : array.length, result = Array(length);
      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }
    module2.exports = arrayMap;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseToString.js
var require_baseToString = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseToString.js"(exports2, module2) {
    "use strict";
    var Symbol2 = require_Symbol();
    var arrayMap = require_arrayMap();
    var isArray = require_isArray();
    var isSymbol = require_isSymbol();
    var INFINITY = 1 / 0;
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolToString = symbolProto ? symbolProto.toString : void 0;
    function baseToString(value) {
      if (typeof value == "string") {
        return value;
      }
      if (isArray(value)) {
        return arrayMap(value, baseToString) + "";
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : "";
      }
      var result = value + "";
      return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    module2.exports = baseToString;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/toString.js
var require_toString = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/toString.js"(exports2, module2) {
    "use strict";
    var baseToString = require_baseToString();
    function toString(value) {
      return value == null ? "" : baseToString(value);
    }
    module2.exports = toString;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_castPath.js
var require_castPath = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_castPath.js"(exports2, module2) {
    "use strict";
    var isArray = require_isArray();
    var isKey = require_isKey();
    var stringToPath = require_stringToPath();
    var toString = require_toString();
    function castPath(value, object) {
      if (isArray(value)) {
        return value;
      }
      return isKey(value, object) ? [value] : stringToPath(toString(value));
    }
    module2.exports = castPath;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_toKey.js
var require_toKey = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_toKey.js"(exports2, module2) {
    "use strict";
    var isSymbol = require_isSymbol();
    var INFINITY = 1 / 0;
    function toKey(value) {
      if (typeof value == "string" || isSymbol(value)) {
        return value;
      }
      var result = value + "";
      return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    module2.exports = toKey;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseGet.js
var require_baseGet = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseGet.js"(exports2, module2) {
    "use strict";
    var castPath = require_castPath();
    var toKey = require_toKey();
    function baseGet(object, path) {
      path = castPath(path, object);
      var index = 0, length = path.length;
      while (object != null && index < length) {
        object = object[toKey(path[index++])];
      }
      return index && index == length ? object : void 0;
    }
    module2.exports = baseGet;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/get.js
var require_get = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/get.js"(exports2, module2) {
    "use strict";
    var baseGet = require_baseGet();
    function get(object, path, defaultValue) {
      var result = object == null ? void 0 : baseGet(object, path);
      return result === void 0 ? defaultValue : result;
    }
    module2.exports = get;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseHasIn.js
var require_baseHasIn = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseHasIn.js"(exports2, module2) {
    "use strict";
    function baseHasIn(object, key) {
      return object != null && key in Object(object);
    }
    module2.exports = baseHasIn;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hasPath.js
var require_hasPath = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_hasPath.js"(exports2, module2) {
    "use strict";
    var castPath = require_castPath();
    var isArguments = require_isArguments();
    var isArray = require_isArray();
    var isIndex = require_isIndex();
    var isLength = require_isLength();
    var toKey = require_toKey();
    function hasPath(object, path, hasFunc) {
      path = castPath(path, object);
      var index = -1, length = path.length, result = false;
      while (++index < length) {
        var key = toKey(path[index]);
        if (!(result = object != null && hasFunc(object, key))) {
          break;
        }
        object = object[key];
      }
      if (result || ++index != length) {
        return result;
      }
      length = object == null ? 0 : object.length;
      return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
    }
    module2.exports = hasPath;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/hasIn.js
var require_hasIn = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/hasIn.js"(exports2, module2) {
    "use strict";
    var baseHasIn = require_baseHasIn();
    var hasPath = require_hasPath();
    function hasIn(object, path) {
      return object != null && hasPath(object, path, baseHasIn);
    }
    module2.exports = hasIn;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseMatchesProperty.js
var require_baseMatchesProperty = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseMatchesProperty.js"(exports2, module2) {
    "use strict";
    var baseIsEqual = require_baseIsEqual();
    var get = require_get();
    var hasIn = require_hasIn();
    var isKey = require_isKey();
    var isStrictComparable = require_isStrictComparable();
    var matchesStrictComparable = require_matchesStrictComparable();
    var toKey = require_toKey();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function baseMatchesProperty(path, srcValue) {
      if (isKey(path) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path), srcValue);
      }
      return function(object) {
        var objValue = get(object, path);
        return objValue === void 0 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
      };
    }
    module2.exports = baseMatchesProperty;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/identity.js
var require_identity = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/identity.js"(exports2, module2) {
    "use strict";
    function identity(value) {
      return value;
    }
    module2.exports = identity;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseProperty.js
var require_baseProperty = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseProperty.js"(exports2, module2) {
    "use strict";
    function baseProperty(key) {
      return function(object) {
        return object == null ? void 0 : object[key];
      };
    }
    module2.exports = baseProperty;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_basePropertyDeep.js
var require_basePropertyDeep = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_basePropertyDeep.js"(exports2, module2) {
    "use strict";
    var baseGet = require_baseGet();
    function basePropertyDeep(path) {
      return function(object) {
        return baseGet(object, path);
      };
    }
    module2.exports = basePropertyDeep;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/property.js
var require_property = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/property.js"(exports2, module2) {
    "use strict";
    var baseProperty = require_baseProperty();
    var basePropertyDeep = require_basePropertyDeep();
    var isKey = require_isKey();
    var toKey = require_toKey();
    function property(path) {
      return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
    }
    module2.exports = property;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIteratee.js
var require_baseIteratee = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_baseIteratee.js"(exports2, module2) {
    "use strict";
    var baseMatches = require_baseMatches();
    var baseMatchesProperty = require_baseMatchesProperty();
    var identity = require_identity();
    var isArray = require_isArray();
    var property = require_property();
    function baseIteratee(value) {
      if (typeof value == "function") {
        return value;
      }
      if (value == null) {
        return identity;
      }
      if (typeof value == "object") {
        return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
      }
      return property(value);
    }
    module2.exports = baseIteratee;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_createAggregator.js
var require_createAggregator = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/_createAggregator.js"(exports2, module2) {
    "use strict";
    var arrayAggregator = require_arrayAggregator();
    var baseAggregator = require_baseAggregator();
    var baseIteratee = require_baseIteratee();
    var isArray = require_isArray();
    function createAggregator(setter, initializer) {
      return function(collection, iteratee) {
        var func = isArray(collection) ? arrayAggregator : baseAggregator, accumulator = initializer ? initializer() : {};
        return func(collection, setter, baseIteratee(iteratee, 2), accumulator);
      };
    }
    module2.exports = createAggregator;
  }
});

// ../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/groupBy.js
var require_groupBy = __commonJS({
  "../../../node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/groupBy.js"(exports2, module2) {
    "use strict";
    var baseAssignValue = require_baseAssignValue();
    var createAggregator = require_createAggregator();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var groupBy2 = createAggregator(function(result, value, key) {
      if (hasOwnProperty.call(result, key)) {
        result[key].push(value);
      } else {
        baseAssignValue(result, key, [value]);
      }
    });
    module2.exports = groupBy2;
  }
});

// main.ts
var core = __toESM(require_core());

// logic.ts
var import_unzipper = __toESM(require_unzip2());
var import_stream_json = __toESM(require_stream_json());
var import_StreamValues = __toESM(require_StreamValues());

// promise.ts
var delay = (ms) => new Promise((f) => setTimeout(f, ms));
var defaults = {
  maxRetry: 4,
  interval: 300,
  intervalMultiplicator: 1.5,
  context: ""
};
function retry(f, options) {
  const { maxRetry, interval, intervalMultiplicator, context } = {
    ...defaults,
    ...options
  };
  function rec(remainingTry, i) {
    const result = f();
    if (remainingTry <= 0) {
      return result;
    }
    return result.catch((e) => {
      console.log(
        "promise-retry",
        context + " failed. " + remainingTry + " retry remain. " + String(e)
      );
      return delay(i).then(() => rec(remainingTry - 1, i * intervalMultiplicator));
    });
  }
  return rec(maxRetry, interval);
}
async function promiseAllBatched(batch, items, fn) {
  const data = Array(items.length);
  const queue = items.map((item, index) => ({
    item,
    index
  }));
  async function step() {
    if (queue.length === 0)
      return;
    const first = queue.shift();
    if (first) {
      const { item, index } = first;
      data[index] = await fn(item, index);
    }
    await step();
  }
  await Promise.all(
    Array(Math.min(batch, items.length)).fill(() => void 0).map(step)
  );
  return data;
}

// logic.ts
var import_groupBy = __toESM(require_groupBy());
var import_stream = require("stream");
async function downloadArchive(githubToken, url) {
  console.log("retrieving " + url);
  const blob = await retry(
    () => fetch(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json"
      }
    })
  ).then((r) => {
    if (r.status === 410) {
      return null;
    }
    return r;
  }).then((r) => r ? handleErrors(r) : null).then((r) => r ? r.blob() : null);
  if (!blob)
    return null;
  return new Promise((resolve, reject) => {
    import_stream.Readable.fromWeb(blob.stream()).pipe((0, import_unzipper.Parse)()).on("entry", (entry) => {
      const fileName = entry.path;
      if (fileName === "report.json") {
        entry.pipe((0, import_stream_json.parser)()).pipe((0, import_StreamValues.streamValues)()).on("data", (e) => resolve(e.value)).on("error", reject);
      } else {
        entry.autodrain();
      }
    });
  });
}
function isDateBefore(a, b) {
  return new Date(a) < new Date(b);
}
function successRateDisplay(a, b) {
  if (!b)
    return "N/A";
  if (!a)
    return "\u274C 0%";
  const r = a / b;
  return (r === 1 ? "\u2705 " : r < 0.8 ? "\u26A0\uFE0F " : "") + Math.round(100 * r) + "%";
}
function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.url + ": " + response.status + " " + response.statusText);
  }
  return response;
}
async function loadReports({
  branch,
  days,
  githubToken,
  environment
}) {
  let page = 1;
  const maxPage = 100;
  const dateFrom = days ? new Date(Date.now() - 24 * 60 * 60 * 1e3 * parseInt(days, 10)) : void 0;
  let latestDateReached = false;
  const artifacts = [];
  let res;
  do {
    const url = `https://api.github.com/repos/LedgerHQ/ledger-live/actions/artifacts?per_page=100&name=report&page=${page}`;
    console.log("retrieving " + url);
    res = await retry(
      () => fetch(url, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json"
        }
      })
    ).then((r) => r.ok ? r.json() : r.status === 502 ? {} : handleErrors(r)).then((r) => {
      if (r.artifacts) {
        return r.artifacts;
      }
      return [];
    });
    if (res) {
      res.forEach((a) => {
        if (!branch || a.workflow_run.head_branch === branch) {
          if (!dateFrom || isDateBefore(dateFrom, a.created_at)) {
            artifacts.push(a);
          } else {
            latestDateReached = true;
          }
        }
      });
    }
    page++;
    await delay(500);
  } while (res && res.length > 0 && !latestDateReached && page < maxPage);
  const reports = (await promiseAllBatched(
    5,
    artifacts,
    (artifact) => downloadArchive(githubToken, artifact.archive_download_url).then((report) => ({
      artifact,
      report
    }))
  )).filter(Boolean).filter(({ report }) => {
    if (environment && report) {
      return report.environment === environment;
    }
    return true;
  });
  return reports;
}
function generateSuperReport(all, days) {
  let reportMarkdownBody = "";
  let reportSlackText = "";
  let totalReports = 0;
  let totalMutations = 0;
  let totalOperations = 0;
  const stats = {};
  all.forEach(({ report }) => {
    report == null ? void 0 : report.results.forEach(({ specName, existingMutationNames }) => {
      const s = stats[specName] = stats[specName] || {
        specName,
        fatalErrors: [],
        runs: 0,
        mutations: {}
      };
      existingMutationNames == null ? void 0 : existingMutationNames.forEach((mutationName) => {
        s.mutations[mutationName] = {
          mutationName,
          runs: 0,
          success: 0,
          errors: []
        };
      });
    });
  });
  all.forEach(({ report }) => {
    var _a;
    totalReports++;
    (_a = report == null ? void 0 : report.results) == null ? void 0 : _a.forEach((result) => {
      const { specName, fatalError, mutations } = result;
      const specStats = stats[specName];
      if (fatalError) {
        specStats.fatalErrors.push(fatalError);
      } else {
        specStats.runs++;
      }
      mutations == null ? void 0 : mutations.forEach((mutation) => {
        const { mutationName, operationId, error } = mutation;
        if (mutationName) {
          totalMutations++;
          const prev = specStats.mutations[mutationName];
          const errors = (prev == null ? void 0 : prev.errors.slice(0)) || [];
          if (error) {
            errors.push(error);
          }
          specStats.mutations[mutationName] = {
            mutationName,
            runs: ((prev == null ? void 0 : prev.runs) || 0) + 1,
            success: ((prev == null ? void 0 : prev.success) || 0) + (error || !operationId ? 0 : 1),
            errors
          };
        }
        if (operationId) {
          totalOperations++;
        }
      });
    });
  });
  const ctx = days ? `${days} last days` : "all available reports";
  const coverageInfo = Object.values(stats).reduce(
    ([success, total], { mutations }) => {
      const m = Object.values(mutations);
      const mutationsWithOneSuccess = m.filter((m2) => m2.success > 0);
      return [success + mutationsWithOneSuccess.length, total + m.length];
    },
    [0, 0]
  );
  const summary = `${ctx}: ${totalReports} runs, ${totalOperations} success txs. ${successRateDisplay(
    totalOperations,
    totalMutations
  )} success rate. ${successRateDisplay(coverageInfo[0], coverageInfo[1])} coverage rate.`;
  reportMarkdownBody += `# Bot "super report" on ${ctx}
`;
  reportMarkdownBody += "\n> What is the Bot and how does it work? [Everything is documented here!](https://github.com/LedgerHQ/ledger-live/wiki/LLC:bot)\n\n";
  reportMarkdownBody += summary + "\n\n";
  reportMarkdownBody += "| Spec | Availability (scan success) | Transactions success | Mutations Coverage | Operations |\n";
  reportMarkdownBody += "|--|--|--|--|--|\n";
  reportMarkdownBody += Object.values(stats).map(({ specName, mutations, fatalErrors, runs }) => {
    const m = Object.values(mutations);
    const txs = m.reduce((acc, m2) => acc + m2.success, 0) || 0;
    const txsAttempts = m.reduce((acc, m2) => acc + m2.runs, 0) || 0;
    const txsSuccess = successRateDisplay(txs, txsAttempts);
    const mutationsWithOneSuccess = m.filter((m2) => m2.success > 0);
    const mutationCoverage = successRateDisplay(mutationsWithOneSuccess.length, m.length);
    return `|${specName}|${successRateDisplay(
      runs - fatalErrors.length,
      runs
    )}|${txsSuccess}|${mutationCoverage}|${txs ? txs : "\u274C"}|
`;
  }).join("");
  reportMarkdownBody += "## Details case by case\n";
  Object.values(stats).forEach(({ specName, mutations, fatalErrors }) => {
    reportMarkdownBody += `## Spec \`${specName}\`
`;
    if (fatalErrors.length) {
      const grouped = groupErrors(fatalErrors);
      reportMarkdownBody += `
<details><summary>\u274C Fatal cases (${fatalErrors.length})</summary>

`;
      reportMarkdownBody += grouped.map(
        ({ error, occurrences }) => `- ${occurrences > 1 ? `**(x${occurrences})** ` : ""}\`${error}\`
`
      ).join("");
      reportMarkdownBody += `
</details>

`;
    }
    const m = Object.values(mutations);
    if (m.length > 0) {
      const allErrors = m.reduce((acc, m2) => acc.concat(m2.errors), []);
      const groupedErrors = groupErrors(allErrors);
      reportMarkdownBody += "\n";
      reportMarkdownBody += "| Mutation | Tx Success | Ops | Errors |\n";
      reportMarkdownBody += "|--|--|--|--|\n";
      reportMarkdownBody += m.map(({ errors, success, runs, mutationName }) => {
        const grouped = groupErrors(errors);
        return `|${mutationName.replace(/[|]/g, " ")}|${successRateDisplay(success, runs)}|${success ? success : "\u274C"}|${groupedErrors.filter((e) => grouped.some((e2) => e2.error === e.error)).map(({ index }) => index).join(", ")}|
`;
      }).join("");
      if (groupedErrors.length) {
        reportMarkdownBody += "\n";
        reportMarkdownBody += "<details><summary>Detail of errors (" + (allErrors.length + 1) + ")</summary>\n\n\n";
        reportMarkdownBody += groupedErrors.map(
          ({ error, index, occurrences }) => `${index}. ${occurrences > 1 ? `**(x${occurrences})** ` : ""}\`${error}\`
`
        ).join("") + "\n";
        reportMarkdownBody += "\n</details>\n\n";
      }
    }
  });
  reportSlackText = `:confetti_ball: *${summary} <{{url}}|Full Report>*`;
  return {
    reportMarkdownBody,
    reportSlackText
  };
}
async function getLatestCommitShaOfBranch({
  githubToken,
  branch
}) {
  console.log("getting latest commit");
  const commits = await fetch(
    `https://api.github.com/repos/LedgerHQ/ledger-live/commits${branch ? "?sha=" + branch : ""}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json"
      }
    }
  ).then(handleErrors).then((r) => r.json());
  return commits[0].sha;
}
async function uploadCommentToGithubSha({
  githubToken,
  reportMarkdownBody,
  sha
}) {
  const githubUrl = `https://api.github.com/repos/LedgerHQ/ledger-live/commits/${sha}/comments`;
  console.log("sending to " + githubUrl);
  const githubComment = await fetch(githubUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body: reportMarkdownBody })
  }).then(handleErrors).then((r) => r.json());
  return githubComment;
}
async function uploadToSlack({
  text,
  slackChannel,
  slackIconEmoji,
  slackApiToken
}) {
  console.log("upload to slack");
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${slackApiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      channel: slackChannel || "ledger-live-bot",
      icon_emoji: slackIconEmoji || ":mere_denis:"
    })
  }).then(handleErrors);
}
var groupErrorsIncluding = [
  "Error: could not find optimisticOperation",
  "Error: Transaction has been reverted by the EVM",
  "LedgerAPI4xx: An error occurred: -25: Missing inputs",
  "Error: failed to get Stake Activation",
  "LedgerAPI4xx: Failed to get transactions for addresses",
  "Failure(s) occurred during RPC call : co.ledger.jrpc.model.CallError: An error occurred: -32000"
];
function groupSimilarError(str) {
  const g = groupErrorsIncluding.find((t) => str.includes(t));
  if (g)
    return g;
  return str;
}
function safeErrorDisplay(txt) {
  return txt.slice(0, 200).replace(/[\s`]/g, " ");
}
function groupErrors(errors) {
  const grouped = (0, import_groupBy.default)(errors.map((e) => groupSimilarError(safeErrorDisplay(e))));
  return Object.keys(grouped).map((error, i) => ({
    error,
    index: i + 1,
    occurrences: grouped[error].length
  }));
}

// main.ts
async function main() {
  const githubToken = core.getInput("githubToken");
  const branch = core.getInput("branch");
  const days = core.getInput("days");
  const slackChannel = core.getInput("slackChannel");
  const slackIconEmoji = core.getInput("slackIconEmoji");
  const slackApiToken = core.getInput("slackApiToken");
  const environment = core.getInput("environment");
  const reports = await loadReports({ branch, days, githubToken, environment });
  const { reportMarkdownBody, reportSlackText } = generateSuperReport(reports, days);
  const sha = await getLatestCommitShaOfBranch({ githubToken, branch });
  const githubComment = await uploadCommentToGithubSha({
    sha,
    githubToken,
    reportMarkdownBody
  });
  if (slackApiToken && githubComment) {
    const text = reportSlackText.replace("{{url}}", githubComment.html_url);
    await uploadToSlack({ text, slackApiToken, slackChannel, slackIconEmoji });
  }
}
main().catch((err) => {
  core.setFailed(err);
});
