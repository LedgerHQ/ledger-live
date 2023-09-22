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
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      Object.defineProperty(o2, k22, { enumerable: true, get: function() {
        return m3[k2];
      } });
    } : function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      o2[k22] = m3[k2];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    } : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k2 in mod)
          if (k2 !== "default" && Object.hasOwnProperty.call(mod, k2))
            __createBinding(result, mod, k2);
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
    function escapeData(s3) {
      return utils_1.toCommandValue(s3).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
    }
    function escapeProperty(s3) {
      return utils_1.toCommandValue(s3).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
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
    for (let i3 = 0; i3 < 256; ++i3) {
      byteToHex.push((i3 + 256).toString(16).substr(1));
    }
    stringify_default = stringify;
  }
});

// ../../../node_modules/.pnpm/uuid@8.3.2/node_modules/uuid/dist/esm-node/v1.js
function v1(options, buf, offset) {
  let i3 = buf && offset || 0;
  const b2 = buf || new Array(16);
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
  const dt2 = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
  if (dt2 < 0 && options.clockseq === void 0) {
    clockseq = clockseq + 1 & 16383;
  }
  if ((dt2 < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
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
  b2[i3++] = tl >>> 24 & 255;
  b2[i3++] = tl >>> 16 & 255;
  b2[i3++] = tl >>> 8 & 255;
  b2[i3++] = tl & 255;
  const tmh = msecs / 4294967296 * 1e4 & 268435455;
  b2[i3++] = tmh >>> 8 & 255;
  b2[i3++] = tmh & 255;
  b2[i3++] = tmh >>> 24 & 15 | 16;
  b2[i3++] = tmh >>> 16 & 255;
  b2[i3++] = clockseq >>> 8 | 128;
  b2[i3++] = clockseq & 255;
  for (let n2 = 0; n2 < 6; ++n2) {
    b2[i3 + n2] = node[n2];
  }
  return buf || stringify_default(b2);
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
  let v2;
  const arr = new Uint8Array(16);
  arr[0] = (v2 = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v2 >>> 16 & 255;
  arr[2] = v2 >>> 8 & 255;
  arr[3] = v2 & 255;
  arr[4] = (v2 = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v2 & 255;
  arr[6] = (v2 = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v2 & 255;
  arr[8] = (v2 = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v2 & 255;
  arr[10] = (v2 = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
  arr[11] = v2 / 4294967296 & 255;
  arr[12] = v2 >>> 24 & 255;
  arr[13] = v2 >>> 16 & 255;
  arr[14] = v2 >>> 8 & 255;
  arr[15] = v2 & 255;
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
  for (let i3 = 0; i3 < str.length; ++i3) {
    bytes.push(str.charCodeAt(i3));
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
      for (let i3 = 0; i3 < 16; ++i3) {
        buf[offset + i3] = bytes[i3];
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
    for (let i3 = 0; i3 < 16; ++i3) {
      buf[offset + i3] = rnds[i3];
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
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      Object.defineProperty(o2, k22, { enumerable: true, get: function() {
        return m3[k2];
      } });
    } : function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      o2[k22] = m3[k2];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    } : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k2 in mod)
          if (k2 !== "default" && Object.hasOwnProperty.call(mod, k2))
            __createBinding(result, mod, k2);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prepareKeyValueMessage = exports.issueFileCommand = void 0;
    var fs3 = __importStar(require("fs"));
    var os = __importStar(require("os"));
    var uuid_1 = (init_esm_node(), __toCommonJS(esm_node_exports));
    var utils_1 = require_utils();
    function issueFileCommand(command, message) {
      const filePath = process.env[`GITHUB_${command}`];
      if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
      }
      if (!fs3.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
      }
      fs3.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
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
      for (const upperNoProxyItem of noProxy.split(",").map((x3) => x3.trim().toUpperCase()).filter((x3) => x3)) {
        if (upperReqHosts.some((x3) => x3 === upperNoProxyItem)) {
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
    var http3 = require("http");
    var https2 = require("https");
    var events = require("events");
    var assert = require("assert");
    var util = require("util");
    exports.httpOverHttp = httpOverHttp;
    exports.httpsOverHttp = httpsOverHttp;
    exports.httpOverHttps = httpOverHttps;
    exports.httpsOverHttps = httpsOverHttps;
    function httpOverHttp(options) {
      var agent = new TunnelingAgent(options);
      agent.request = http3.request;
      return agent;
    }
    function httpsOverHttp(options) {
      var agent = new TunnelingAgent(options);
      agent.request = http3.request;
      agent.createSocket = createSecureSocket;
      agent.defaultPort = 443;
      return agent;
    }
    function httpOverHttps(options) {
      var agent = new TunnelingAgent(options);
      agent.request = https2.request;
      return agent;
    }
    function httpsOverHttps(options) {
      var agent = new TunnelingAgent(options);
      agent.request = https2.request;
      agent.createSocket = createSecureSocket;
      agent.defaultPort = 443;
      return agent;
    }
    function TunnelingAgent(options) {
      var self2 = this;
      self2.options = options || {};
      self2.proxyOptions = self2.options.proxy || {};
      self2.maxSockets = self2.options.maxSockets || http3.Agent.defaultMaxSockets;
      self2.requests = [];
      self2.sockets = [];
      self2.on("free", function onFree(socket, host, port, localAddress) {
        var options2 = toOptions(host, port, localAddress);
        for (var i3 = 0, len = self2.requests.length; i3 < len; ++i3) {
          var pending = self2.requests[i3];
          if (pending.host === options2.host && pending.port === options2.port) {
            self2.requests.splice(i3, 1);
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
      debug2("making CONNECT request");
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
          debug2(
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
          debug2("got illegal response body from proxy");
          socket.destroy();
          var error = new Error("got illegal response body from proxy");
          error.code = "ECONNRESET";
          options.request.emit("error", error);
          self2.removeSocket(placeholder);
          return;
        }
        debug2("tunneling connection has established");
        self2.sockets[self2.sockets.indexOf(placeholder)] = socket;
        return cb(socket);
      }
      function onError(cause) {
        connectReq.removeAllListeners();
        debug2(
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
      for (var i3 = 1, len = arguments.length; i3 < len; ++i3) {
        var overrides = arguments[i3];
        if (typeof overrides === "object") {
          var keys = Object.keys(overrides);
          for (var j2 = 0, keyLen = keys.length; j2 < keyLen; ++j2) {
            var k2 = keys[j2];
            if (overrides[k2] !== void 0) {
              target[k2] = overrides[k2];
            }
          }
        }
      }
      return target;
    }
    var debug2;
    if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
      debug2 = function() {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] === "string") {
          args[0] = "TUNNEL: " + args[0];
        } else {
          args.unshift("TUNNEL:");
        }
        console.error.apply(console, args);
      };
    } else {
      debug2 = function() {
      };
    }
    exports.debug = debug2;
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
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      Object.defineProperty(o2, k22, { enumerable: true, get: function() {
        return m3[k2];
      } });
    } : function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      o2[k22] = m3[k2];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    } : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k2 in mod)
          if (k2 !== "default" && Object.hasOwnProperty.call(mod, k2))
            __createBinding(result, mod, k2);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P2, generator) {
      function adopt(value) {
        return value instanceof P2 ? value : new P2(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P2 || (P2 = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e3) {
            reject(e3);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e3) {
            reject(e3);
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
    var http3 = __importStar(require("http"));
    var https2 = __importStar(require("https"));
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
    var Headers2;
    (function(Headers3) {
      Headers3["Accept"] = "accept";
      Headers3["ContentType"] = "content-type";
    })(Headers2 = exports.Headers || (exports.Headers = {}));
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
          additionalHeaders[Headers2.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers2.Accept, MediaTypes.ApplicationJson);
          const res = yield this.get(requestUrl, additionalHeaders);
          return this._processResponse(res, this.requestOptions);
        });
      }
      postJson(requestUrl, obj, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const data = JSON.stringify(obj, null, 2);
          additionalHeaders[Headers2.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers2.Accept, MediaTypes.ApplicationJson);
          additionalHeaders[Headers2.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers2.ContentType, MediaTypes.ApplicationJson);
          const res = yield this.post(requestUrl, data, additionalHeaders);
          return this._processResponse(res, this.requestOptions);
        });
      }
      putJson(requestUrl, obj, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const data = JSON.stringify(obj, null, 2);
          additionalHeaders[Headers2.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers2.Accept, MediaTypes.ApplicationJson);
          additionalHeaders[Headers2.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers2.ContentType, MediaTypes.ApplicationJson);
          const res = yield this.put(requestUrl, data, additionalHeaders);
          return this._processResponse(res, this.requestOptions);
        });
      }
      patchJson(requestUrl, obj, additionalHeaders = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const data = JSON.stringify(obj, null, 2);
          additionalHeaders[Headers2.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers2.Accept, MediaTypes.ApplicationJson);
          additionalHeaders[Headers2.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers2.ContentType, MediaTypes.ApplicationJson);
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
        info.httpModule = usingSsl ? https2 : http3;
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
          maxSockets = this.requestOptions.maxSockets || http3.globalAgent.maxSockets;
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
          agent = usingSsl ? new https2.Agent(options) : new http3.Agent(options);
          this._agent = agent;
        }
        if (!agent) {
          agent = usingSsl ? https2.globalAgent : http3.globalAgent;
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
                const a2 = new Date(value);
                if (!isNaN(a2.valueOf())) {
                  return a2;
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
    var lowercaseKeys = (obj) => Object.keys(obj).reduce((c2, k2) => (c2[k2.toLowerCase()] = obj[k2], c2), {});
  }
});

// ../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/auth.js
var require_auth = __commonJS({
  "../../../node_modules/.pnpm/@actions+http-client@2.0.1/node_modules/@actions/http-client/lib/auth.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P2, generator) {
      function adopt(value) {
        return value instanceof P2 ? value : new P2(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P2 || (P2 = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e3) {
            reject(e3);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e3) {
            reject(e3);
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
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P2, generator) {
      function adopt(value) {
        return value instanceof P2 ? value : new P2(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P2 || (P2 = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e3) {
            reject(e3);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e3) {
            reject(e3);
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
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P2, generator) {
      function adopt(value) {
        return value instanceof P2 ? value : new P2(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P2 || (P2 = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e3) {
            reject(e3);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e3) {
            reject(e3);
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
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      Object.defineProperty(o2, k22, { enumerable: true, get: function() {
        return m3[k2];
      } });
    } : function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      o2[k22] = m3[k2];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    } : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k2 in mod)
          if (k2 !== "default" && Object.hasOwnProperty.call(mod, k2))
            __createBinding(result, mod, k2);
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
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      Object.defineProperty(o2, k22, { enumerable: true, get: function() {
        return m3[k2];
      } });
    } : function(o2, m3, k2, k22) {
      if (k22 === void 0)
        k22 = k2;
      o2[k22] = m3[k2];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o2, v2) {
      Object.defineProperty(o2, "default", { enumerable: true, value: v2 });
    } : function(o2, v2) {
      o2["default"] = v2;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k2 in mod)
          if (k2 !== "default" && Object.hasOwnProperty.call(mod, k2))
            __createBinding(result, mod, k2);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P2, generator) {
      function adopt(value) {
        return value instanceof P2 ? value : new P2(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P2 || (P2 = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e3) {
            reject(e3);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e3) {
            reject(e3);
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
      const inputs = getInput2(name, options).split("\n").filter((x3) => x3 !== "");
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
    function debug2(message) {
      command_1.issueCommand("debug", {}, message);
    }
    exports.debug = debug2;
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

// ../../../node_modules/.pnpm/web-streams-polyfill@3.2.1/node_modules/web-streams-polyfill/dist/ponyfill.es2018.js
var require_ponyfill_es2018 = __commonJS({
  "../../../node_modules/.pnpm/web-streams-polyfill@3.2.1/node_modules/web-streams-polyfill/dist/ponyfill.es2018.js"(exports, module2) {
    "use strict";
    (function(global2, factory) {
      typeof exports === "object" && typeof module2 !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.WebStreamsPolyfill = {}));
    })(exports, function(exports2) {
      "use strict";
      const SymbolPolyfill = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol : (description) => `Symbol(${description})`;
      function noop2() {
        return void 0;
      }
      function getGlobals() {
        if (typeof self !== "undefined") {
          return self;
        } else if (typeof window !== "undefined") {
          return window;
        } else if (typeof global !== "undefined") {
          return global;
        }
        return void 0;
      }
      const globals = getGlobals();
      function typeIsObject(x3) {
        return typeof x3 === "object" && x3 !== null || typeof x3 === "function";
      }
      const rethrowAssertionErrorRejection = noop2;
      const originalPromise = Promise;
      const originalPromiseThen = Promise.prototype.then;
      const originalPromiseResolve = Promise.resolve.bind(originalPromise);
      const originalPromiseReject = Promise.reject.bind(originalPromise);
      function newPromise(executor) {
        return new originalPromise(executor);
      }
      function promiseResolvedWith(value) {
        return originalPromiseResolve(value);
      }
      function promiseRejectedWith(reason) {
        return originalPromiseReject(reason);
      }
      function PerformPromiseThen(promise, onFulfilled, onRejected) {
        return originalPromiseThen.call(promise, onFulfilled, onRejected);
      }
      function uponPromise(promise, onFulfilled, onRejected) {
        PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), void 0, rethrowAssertionErrorRejection);
      }
      function uponFulfillment(promise, onFulfilled) {
        uponPromise(promise, onFulfilled);
      }
      function uponRejection(promise, onRejected) {
        uponPromise(promise, void 0, onRejected);
      }
      function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
        return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
      }
      function setPromiseIsHandledToTrue(promise) {
        PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
      }
      const queueMicrotask2 = (() => {
        const globalQueueMicrotask = globals && globals.queueMicrotask;
        if (typeof globalQueueMicrotask === "function") {
          return globalQueueMicrotask;
        }
        const resolvedPromise = promiseResolvedWith(void 0);
        return (fn) => PerformPromiseThen(resolvedPromise, fn);
      })();
      function reflectCall(F3, V2, args) {
        if (typeof F3 !== "function") {
          throw new TypeError("Argument is not a function");
        }
        return Function.prototype.apply.call(F3, V2, args);
      }
      function promiseCall(F3, V2, args) {
        try {
          return promiseResolvedWith(reflectCall(F3, V2, args));
        } catch (value) {
          return promiseRejectedWith(value);
        }
      }
      const QUEUE_MAX_ARRAY_SIZE = 16384;
      class SimpleQueue {
        constructor() {
          this._cursor = 0;
          this._size = 0;
          this._front = {
            _elements: [],
            _next: void 0
          };
          this._back = this._front;
          this._cursor = 0;
          this._size = 0;
        }
        get length() {
          return this._size;
        }
        // For exception safety, this method is structured in order:
        // 1. Read state
        // 2. Calculate required state mutations
        // 3. Perform state mutations
        push(element) {
          const oldBack = this._back;
          let newBack = oldBack;
          if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
            newBack = {
              _elements: [],
              _next: void 0
            };
          }
          oldBack._elements.push(element);
          if (newBack !== oldBack) {
            this._back = newBack;
            oldBack._next = newBack;
          }
          ++this._size;
        }
        // Like push(), shift() follows the read -> calculate -> mutate pattern for
        // exception safety.
        shift() {
          const oldFront = this._front;
          let newFront = oldFront;
          const oldCursor = this._cursor;
          let newCursor = oldCursor + 1;
          const elements = oldFront._elements;
          const element = elements[oldCursor];
          if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
            newFront = oldFront._next;
            newCursor = 0;
          }
          --this._size;
          this._cursor = newCursor;
          if (oldFront !== newFront) {
            this._front = newFront;
          }
          elements[oldCursor] = void 0;
          return element;
        }
        // The tricky thing about forEach() is that it can be called
        // re-entrantly. The queue may be mutated inside the callback. It is easy to
        // see that push() within the callback has no negative effects since the end
        // of the queue is checked for on every iteration. If shift() is called
        // repeatedly within the callback then the next iteration may return an
        // element that has been removed. In this case the callback will be called
        // with undefined values until we either "catch up" with elements that still
        // exist or reach the back of the queue.
        forEach(callback) {
          let i3 = this._cursor;
          let node = this._front;
          let elements = node._elements;
          while (i3 !== elements.length || node._next !== void 0) {
            if (i3 === elements.length) {
              node = node._next;
              elements = node._elements;
              i3 = 0;
              if (elements.length === 0) {
                break;
              }
            }
            callback(elements[i3]);
            ++i3;
          }
        }
        // Return the element that would be returned if shift() was called now,
        // without modifying the queue.
        peek() {
          const front = this._front;
          const cursor = this._cursor;
          return front._elements[cursor];
        }
      }
      function ReadableStreamReaderGenericInitialize(reader, stream) {
        reader._ownerReadableStream = stream;
        stream._reader = reader;
        if (stream._state === "readable") {
          defaultReaderClosedPromiseInitialize(reader);
        } else if (stream._state === "closed") {
          defaultReaderClosedPromiseInitializeAsResolved(reader);
        } else {
          defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
        }
      }
      function ReadableStreamReaderGenericCancel(reader, reason) {
        const stream = reader._ownerReadableStream;
        return ReadableStreamCancel(stream, reason);
      }
      function ReadableStreamReaderGenericRelease(reader) {
        if (reader._ownerReadableStream._state === "readable") {
          defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
        } else {
          defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
        }
        reader._ownerReadableStream._reader = void 0;
        reader._ownerReadableStream = void 0;
      }
      function readerLockException(name) {
        return new TypeError("Cannot " + name + " a stream using a released reader");
      }
      function defaultReaderClosedPromiseInitialize(reader) {
        reader._closedPromise = newPromise((resolve2, reject) => {
          reader._closedPromise_resolve = resolve2;
          reader._closedPromise_reject = reject;
        });
      }
      function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
        defaultReaderClosedPromiseInitialize(reader);
        defaultReaderClosedPromiseReject(reader, reason);
      }
      function defaultReaderClosedPromiseInitializeAsResolved(reader) {
        defaultReaderClosedPromiseInitialize(reader);
        defaultReaderClosedPromiseResolve(reader);
      }
      function defaultReaderClosedPromiseReject(reader, reason) {
        if (reader._closedPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(reader._closedPromise);
        reader._closedPromise_reject(reason);
        reader._closedPromise_resolve = void 0;
        reader._closedPromise_reject = void 0;
      }
      function defaultReaderClosedPromiseResetToRejected(reader, reason) {
        defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
      }
      function defaultReaderClosedPromiseResolve(reader) {
        if (reader._closedPromise_resolve === void 0) {
          return;
        }
        reader._closedPromise_resolve(void 0);
        reader._closedPromise_resolve = void 0;
        reader._closedPromise_reject = void 0;
      }
      const AbortSteps = SymbolPolyfill("[[AbortSteps]]");
      const ErrorSteps = SymbolPolyfill("[[ErrorSteps]]");
      const CancelSteps = SymbolPolyfill("[[CancelSteps]]");
      const PullSteps = SymbolPolyfill("[[PullSteps]]");
      const NumberIsFinite = Number.isFinite || function(x3) {
        return typeof x3 === "number" && isFinite(x3);
      };
      const MathTrunc = Math.trunc || function(v2) {
        return v2 < 0 ? Math.ceil(v2) : Math.floor(v2);
      };
      function isDictionary(x3) {
        return typeof x3 === "object" || typeof x3 === "function";
      }
      function assertDictionary(obj, context) {
        if (obj !== void 0 && !isDictionary(obj)) {
          throw new TypeError(`${context} is not an object.`);
        }
      }
      function assertFunction(x3, context) {
        if (typeof x3 !== "function") {
          throw new TypeError(`${context} is not a function.`);
        }
      }
      function isObject(x3) {
        return typeof x3 === "object" && x3 !== null || typeof x3 === "function";
      }
      function assertObject(x3, context) {
        if (!isObject(x3)) {
          throw new TypeError(`${context} is not an object.`);
        }
      }
      function assertRequiredArgument(x3, position, context) {
        if (x3 === void 0) {
          throw new TypeError(`Parameter ${position} is required in '${context}'.`);
        }
      }
      function assertRequiredField(x3, field, context) {
        if (x3 === void 0) {
          throw new TypeError(`${field} is required in '${context}'.`);
        }
      }
      function convertUnrestrictedDouble(value) {
        return Number(value);
      }
      function censorNegativeZero(x3) {
        return x3 === 0 ? 0 : x3;
      }
      function integerPart(x3) {
        return censorNegativeZero(MathTrunc(x3));
      }
      function convertUnsignedLongLongWithEnforceRange(value, context) {
        const lowerBound = 0;
        const upperBound = Number.MAX_SAFE_INTEGER;
        let x3 = Number(value);
        x3 = censorNegativeZero(x3);
        if (!NumberIsFinite(x3)) {
          throw new TypeError(`${context} is not a finite number`);
        }
        x3 = integerPart(x3);
        if (x3 < lowerBound || x3 > upperBound) {
          throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
        }
        if (!NumberIsFinite(x3) || x3 === 0) {
          return 0;
        }
        return x3;
      }
      function assertReadableStream(x3, context) {
        if (!IsReadableStream(x3)) {
          throw new TypeError(`${context} is not a ReadableStream.`);
        }
      }
      function AcquireReadableStreamDefaultReader(stream) {
        return new ReadableStreamDefaultReader2(stream);
      }
      function ReadableStreamAddReadRequest(stream, readRequest) {
        stream._reader._readRequests.push(readRequest);
      }
      function ReadableStreamFulfillReadRequest(stream, chunk, done) {
        const reader = stream._reader;
        const readRequest = reader._readRequests.shift();
        if (done) {
          readRequest._closeSteps();
        } else {
          readRequest._chunkSteps(chunk);
        }
      }
      function ReadableStreamGetNumReadRequests(stream) {
        return stream._reader._readRequests.length;
      }
      function ReadableStreamHasDefaultReader(stream) {
        const reader = stream._reader;
        if (reader === void 0) {
          return false;
        }
        if (!IsReadableStreamDefaultReader(reader)) {
          return false;
        }
        return true;
      }
      class ReadableStreamDefaultReader2 {
        constructor(stream) {
          assertRequiredArgument(stream, 1, "ReadableStreamDefaultReader");
          assertReadableStream(stream, "First parameter");
          if (IsReadableStreamLocked(stream)) {
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          }
          ReadableStreamReaderGenericInitialize(this, stream);
          this._readRequests = new SimpleQueue();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed,
         * or rejected if the stream ever errors or the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          if (!IsReadableStreamDefaultReader(this)) {
            return promiseRejectedWith(defaultReaderBrandCheckException("closed"));
          }
          return this._closedPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(reason = void 0) {
          if (!IsReadableStreamDefaultReader(this)) {
            return promiseRejectedWith(defaultReaderBrandCheckException("cancel"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("cancel"));
          }
          return ReadableStreamReaderGenericCancel(this, reason);
        }
        /**
         * Returns a promise that allows access to the next chunk from the stream's internal queue, if available.
         *
         * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
         */
        read() {
          if (!IsReadableStreamDefaultReader(this)) {
            return promiseRejectedWith(defaultReaderBrandCheckException("read"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("read from"));
          }
          let resolvePromise;
          let rejectPromise;
          const promise = newPromise((resolve2, reject) => {
            resolvePromise = resolve2;
            rejectPromise = reject;
          });
          const readRequest = {
            _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
            _closeSteps: () => resolvePromise({ value: void 0, done: true }),
            _errorSteps: (e3) => rejectPromise(e3)
          };
          ReadableStreamDefaultReaderRead(this, readRequest);
          return promise;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamDefaultReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!IsReadableStreamDefaultReader(this)) {
            throw defaultReaderBrandCheckException("releaseLock");
          }
          if (this._ownerReadableStream === void 0) {
            return;
          }
          if (this._readRequests.length > 0) {
            throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
          }
          ReadableStreamReaderGenericRelease(this);
        }
      }
      Object.defineProperties(ReadableStreamDefaultReader2.prototype, {
        cancel: { enumerable: true },
        read: { enumerable: true },
        releaseLock: { enumerable: true },
        closed: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamDefaultReader2.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStreamDefaultReader",
          configurable: true
        });
      }
      function IsReadableStreamDefaultReader(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_readRequests")) {
          return false;
        }
        return x3 instanceof ReadableStreamDefaultReader2;
      }
      function ReadableStreamDefaultReaderRead(reader, readRequest) {
        const stream = reader._ownerReadableStream;
        stream._disturbed = true;
        if (stream._state === "closed") {
          readRequest._closeSteps();
        } else if (stream._state === "errored") {
          readRequest._errorSteps(stream._storedError);
        } else {
          stream._readableStreamController[PullSteps](readRequest);
        }
      }
      function defaultReaderBrandCheckException(name) {
        return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
      }
      const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
      }).prototype);
      class ReadableStreamAsyncIteratorImpl {
        constructor(reader, preventCancel) {
          this._ongoingPromise = void 0;
          this._isFinished = false;
          this._reader = reader;
          this._preventCancel = preventCancel;
        }
        next() {
          const nextSteps = () => this._nextSteps();
          this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
          return this._ongoingPromise;
        }
        return(value) {
          const returnSteps = () => this._returnSteps(value);
          return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
        }
        _nextSteps() {
          if (this._isFinished) {
            return Promise.resolve({ value: void 0, done: true });
          }
          const reader = this._reader;
          if (reader._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("iterate"));
          }
          let resolvePromise;
          let rejectPromise;
          const promise = newPromise((resolve2, reject) => {
            resolvePromise = resolve2;
            rejectPromise = reject;
          });
          const readRequest = {
            _chunkSteps: (chunk) => {
              this._ongoingPromise = void 0;
              queueMicrotask2(() => resolvePromise({ value: chunk, done: false }));
            },
            _closeSteps: () => {
              this._ongoingPromise = void 0;
              this._isFinished = true;
              ReadableStreamReaderGenericRelease(reader);
              resolvePromise({ value: void 0, done: true });
            },
            _errorSteps: (reason) => {
              this._ongoingPromise = void 0;
              this._isFinished = true;
              ReadableStreamReaderGenericRelease(reader);
              rejectPromise(reason);
            }
          };
          ReadableStreamDefaultReaderRead(reader, readRequest);
          return promise;
        }
        _returnSteps(value) {
          if (this._isFinished) {
            return Promise.resolve({ value, done: true });
          }
          this._isFinished = true;
          const reader = this._reader;
          if (reader._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("finish iterating"));
          }
          if (!this._preventCancel) {
            const result = ReadableStreamReaderGenericCancel(reader, value);
            ReadableStreamReaderGenericRelease(reader);
            return transformPromiseWith(result, () => ({ value, done: true }));
          }
          ReadableStreamReaderGenericRelease(reader);
          return promiseResolvedWith({ value, done: true });
        }
      }
      const ReadableStreamAsyncIteratorPrototype = {
        next() {
          if (!IsReadableStreamAsyncIterator(this)) {
            return promiseRejectedWith(streamAsyncIteratorBrandCheckException("next"));
          }
          return this._asyncIteratorImpl.next();
        },
        return(value) {
          if (!IsReadableStreamAsyncIterator(this)) {
            return promiseRejectedWith(streamAsyncIteratorBrandCheckException("return"));
          }
          return this._asyncIteratorImpl.return(value);
        }
      };
      if (AsyncIteratorPrototype !== void 0) {
        Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
      }
      function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
        const reader = AcquireReadableStreamDefaultReader(stream);
        const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
        const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
        iterator._asyncIteratorImpl = impl;
        return iterator;
      }
      function IsReadableStreamAsyncIterator(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_asyncIteratorImpl")) {
          return false;
        }
        try {
          return x3._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
        } catch (_a) {
          return false;
        }
      }
      function streamAsyncIteratorBrandCheckException(name) {
        return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
      }
      const NumberIsNaN = Number.isNaN || function(x3) {
        return x3 !== x3;
      };
      function CreateArrayFromList(elements) {
        return elements.slice();
      }
      function CopyDataBlockBytes(dest, destOffset, src, srcOffset, n2) {
        new Uint8Array(dest).set(new Uint8Array(src, srcOffset, n2), destOffset);
      }
      function TransferArrayBuffer(O2) {
        return O2;
      }
      function IsDetachedBuffer(O2) {
        return false;
      }
      function ArrayBufferSlice(buffer, begin, end) {
        if (buffer.slice) {
          return buffer.slice(begin, end);
        }
        const length = end - begin;
        const slice = new ArrayBuffer(length);
        CopyDataBlockBytes(slice, 0, buffer, begin, length);
        return slice;
      }
      function IsNonNegativeNumber(v2) {
        if (typeof v2 !== "number") {
          return false;
        }
        if (NumberIsNaN(v2)) {
          return false;
        }
        if (v2 < 0) {
          return false;
        }
        return true;
      }
      function CloneAsUint8Array(O2) {
        const buffer = ArrayBufferSlice(O2.buffer, O2.byteOffset, O2.byteOffset + O2.byteLength);
        return new Uint8Array(buffer);
      }
      function DequeueValue(container) {
        const pair = container._queue.shift();
        container._queueTotalSize -= pair.size;
        if (container._queueTotalSize < 0) {
          container._queueTotalSize = 0;
        }
        return pair.value;
      }
      function EnqueueValueWithSize(container, value, size) {
        if (!IsNonNegativeNumber(size) || size === Infinity) {
          throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
        }
        container._queue.push({ value, size });
        container._queueTotalSize += size;
      }
      function PeekQueueValue(container) {
        const pair = container._queue.peek();
        return pair.value;
      }
      function ResetQueue(container) {
        container._queue = new SimpleQueue();
        container._queueTotalSize = 0;
      }
      class ReadableStreamBYOBRequest2 {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the view for writing in to, or `null` if the BYOB request has already been responded to.
         */
        get view() {
          if (!IsReadableStreamBYOBRequest(this)) {
            throw byobRequestBrandCheckException("view");
          }
          return this._view;
        }
        respond(bytesWritten) {
          if (!IsReadableStreamBYOBRequest(this)) {
            throw byobRequestBrandCheckException("respond");
          }
          assertRequiredArgument(bytesWritten, 1, "respond");
          bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, "First parameter");
          if (this._associatedReadableByteStreamController === void 0) {
            throw new TypeError("This BYOB request has been invalidated");
          }
          if (IsDetachedBuffer(this._view.buffer))
            ;
          ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
        }
        respondWithNewView(view) {
          if (!IsReadableStreamBYOBRequest(this)) {
            throw byobRequestBrandCheckException("respondWithNewView");
          }
          assertRequiredArgument(view, 1, "respondWithNewView");
          if (!ArrayBuffer.isView(view)) {
            throw new TypeError("You can only respond with array buffer views");
          }
          if (this._associatedReadableByteStreamController === void 0) {
            throw new TypeError("This BYOB request has been invalidated");
          }
          if (IsDetachedBuffer(view.buffer))
            ;
          ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
        }
      }
      Object.defineProperties(ReadableStreamBYOBRequest2.prototype, {
        respond: { enumerable: true },
        respondWithNewView: { enumerable: true },
        view: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamBYOBRequest2.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStreamBYOBRequest",
          configurable: true
        });
      }
      class ReadableByteStreamController2 {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the current BYOB pull request, or `null` if there isn't one.
         */
        get byobRequest() {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("byobRequest");
          }
          return ReadableByteStreamControllerGetBYOBRequest(this);
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying byte source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("desiredSize");
          }
          return ReadableByteStreamControllerGetDesiredSize(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("close");
          }
          if (this._closeRequested) {
            throw new TypeError("The stream has already been closed; do not close it again!");
          }
          const state = this._controlledReadableByteStream._state;
          if (state !== "readable") {
            throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
          }
          ReadableByteStreamControllerClose(this);
        }
        enqueue(chunk) {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("enqueue");
          }
          assertRequiredArgument(chunk, 1, "enqueue");
          if (!ArrayBuffer.isView(chunk)) {
            throw new TypeError("chunk must be an array buffer view");
          }
          if (chunk.byteLength === 0) {
            throw new TypeError("chunk must have non-zero byteLength");
          }
          if (chunk.buffer.byteLength === 0) {
            throw new TypeError(`chunk's buffer must have non-zero byteLength`);
          }
          if (this._closeRequested) {
            throw new TypeError("stream is closed or draining");
          }
          const state = this._controlledReadableByteStream._state;
          if (state !== "readable") {
            throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
          }
          ReadableByteStreamControllerEnqueue(this, chunk);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(e3 = void 0) {
          if (!IsReadableByteStreamController(this)) {
            throw byteStreamControllerBrandCheckException("error");
          }
          ReadableByteStreamControllerError(this, e3);
        }
        /** @internal */
        [CancelSteps](reason) {
          ReadableByteStreamControllerClearPendingPullIntos(this);
          ResetQueue(this);
          const result = this._cancelAlgorithm(reason);
          ReadableByteStreamControllerClearAlgorithms(this);
          return result;
        }
        /** @internal */
        [PullSteps](readRequest) {
          const stream = this._controlledReadableByteStream;
          if (this._queueTotalSize > 0) {
            const entry = this._queue.shift();
            this._queueTotalSize -= entry.byteLength;
            ReadableByteStreamControllerHandleQueueDrain(this);
            const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
            readRequest._chunkSteps(view);
            return;
          }
          const autoAllocateChunkSize = this._autoAllocateChunkSize;
          if (autoAllocateChunkSize !== void 0) {
            let buffer;
            try {
              buffer = new ArrayBuffer(autoAllocateChunkSize);
            } catch (bufferE) {
              readRequest._errorSteps(bufferE);
              return;
            }
            const pullIntoDescriptor = {
              buffer,
              bufferByteLength: autoAllocateChunkSize,
              byteOffset: 0,
              byteLength: autoAllocateChunkSize,
              bytesFilled: 0,
              elementSize: 1,
              viewConstructor: Uint8Array,
              readerType: "default"
            };
            this._pendingPullIntos.push(pullIntoDescriptor);
          }
          ReadableStreamAddReadRequest(stream, readRequest);
          ReadableByteStreamControllerCallPullIfNeeded(this);
        }
      }
      Object.defineProperties(ReadableByteStreamController2.prototype, {
        close: { enumerable: true },
        enqueue: { enumerable: true },
        error: { enumerable: true },
        byobRequest: { enumerable: true },
        desiredSize: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableByteStreamController2.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableByteStreamController",
          configurable: true
        });
      }
      function IsReadableByteStreamController(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_controlledReadableByteStream")) {
          return false;
        }
        return x3 instanceof ReadableByteStreamController2;
      }
      function IsReadableStreamBYOBRequest(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_associatedReadableByteStreamController")) {
          return false;
        }
        return x3 instanceof ReadableStreamBYOBRequest2;
      }
      function ReadableByteStreamControllerCallPullIfNeeded(controller) {
        const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
        if (!shouldPull) {
          return;
        }
        if (controller._pulling) {
          controller._pullAgain = true;
          return;
        }
        controller._pulling = true;
        const pullPromise = controller._pullAlgorithm();
        uponPromise(pullPromise, () => {
          controller._pulling = false;
          if (controller._pullAgain) {
            controller._pullAgain = false;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }
        }, (e3) => {
          ReadableByteStreamControllerError(controller, e3);
        });
      }
      function ReadableByteStreamControllerClearPendingPullIntos(controller) {
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        controller._pendingPullIntos = new SimpleQueue();
      }
      function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
        let done = false;
        if (stream._state === "closed") {
          done = true;
        }
        const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
        if (pullIntoDescriptor.readerType === "default") {
          ReadableStreamFulfillReadRequest(stream, filledView, done);
        } else {
          ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
        }
      }
      function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
        const bytesFilled = pullIntoDescriptor.bytesFilled;
        const elementSize = pullIntoDescriptor.elementSize;
        return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
      }
      function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
        controller._queue.push({ buffer, byteOffset, byteLength });
        controller._queueTotalSize += byteLength;
      }
      function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
        const elementSize = pullIntoDescriptor.elementSize;
        const currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
        const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
        const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
        const maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
        let totalBytesToCopyRemaining = maxBytesToCopy;
        let ready = false;
        if (maxAlignedBytes > currentAlignedBytes) {
          totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
          ready = true;
        }
        const queue = controller._queue;
        while (totalBytesToCopyRemaining > 0) {
          const headOfQueue = queue.peek();
          const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
          const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
          CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
          if (headOfQueue.byteLength === bytesToCopy) {
            queue.shift();
          } else {
            headOfQueue.byteOffset += bytesToCopy;
            headOfQueue.byteLength -= bytesToCopy;
          }
          controller._queueTotalSize -= bytesToCopy;
          ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
          totalBytesToCopyRemaining -= bytesToCopy;
        }
        return ready;
      }
      function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
        pullIntoDescriptor.bytesFilled += size;
      }
      function ReadableByteStreamControllerHandleQueueDrain(controller) {
        if (controller._queueTotalSize === 0 && controller._closeRequested) {
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamClose(controller._controlledReadableByteStream);
        } else {
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
      }
      function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
        if (controller._byobRequest === null) {
          return;
        }
        controller._byobRequest._associatedReadableByteStreamController = void 0;
        controller._byobRequest._view = null;
        controller._byobRequest = null;
      }
      function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
        while (controller._pendingPullIntos.length > 0) {
          if (controller._queueTotalSize === 0) {
            return;
          }
          const pullIntoDescriptor = controller._pendingPullIntos.peek();
          if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
            ReadableByteStreamControllerShiftPendingPullInto(controller);
            ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
          }
        }
      }
      function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
        const stream = controller._controlledReadableByteStream;
        let elementSize = 1;
        if (view.constructor !== DataView) {
          elementSize = view.constructor.BYTES_PER_ELEMENT;
        }
        const ctor = view.constructor;
        const buffer = TransferArrayBuffer(view.buffer);
        const pullIntoDescriptor = {
          buffer,
          bufferByteLength: buffer.byteLength,
          byteOffset: view.byteOffset,
          byteLength: view.byteLength,
          bytesFilled: 0,
          elementSize,
          viewConstructor: ctor,
          readerType: "byob"
        };
        if (controller._pendingPullIntos.length > 0) {
          controller._pendingPullIntos.push(pullIntoDescriptor);
          ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
          return;
        }
        if (stream._state === "closed") {
          const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
          readIntoRequest._closeSteps(emptyView);
          return;
        }
        if (controller._queueTotalSize > 0) {
          if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
            const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
            ReadableByteStreamControllerHandleQueueDrain(controller);
            readIntoRequest._chunkSteps(filledView);
            return;
          }
          if (controller._closeRequested) {
            const e3 = new TypeError("Insufficient bytes to fill elements in the given buffer");
            ReadableByteStreamControllerError(controller, e3);
            readIntoRequest._errorSteps(e3);
            return;
          }
        }
        controller._pendingPullIntos.push(pullIntoDescriptor);
        ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
        ReadableByteStreamControllerCallPullIfNeeded(controller);
      }
      function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
        const stream = controller._controlledReadableByteStream;
        if (ReadableStreamHasBYOBReader(stream)) {
          while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
            ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
          }
        }
      }
      function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
        ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
        if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
          return;
        }
        ReadableByteStreamControllerShiftPendingPullInto(controller);
        const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
        if (remainderSize > 0) {
          const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
          const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
          ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
        }
        pullIntoDescriptor.bytesFilled -= remainderSize;
        ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
        ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
      }
      function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        const state = controller._controlledReadableByteStream._state;
        if (state === "closed") {
          ReadableByteStreamControllerRespondInClosedState(controller);
        } else {
          ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
        }
        ReadableByteStreamControllerCallPullIfNeeded(controller);
      }
      function ReadableByteStreamControllerShiftPendingPullInto(controller) {
        const descriptor = controller._pendingPullIntos.shift();
        return descriptor;
      }
      function ReadableByteStreamControllerShouldCallPull(controller) {
        const stream = controller._controlledReadableByteStream;
        if (stream._state !== "readable") {
          return false;
        }
        if (controller._closeRequested) {
          return false;
        }
        if (!controller._started) {
          return false;
        }
        if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
          return true;
        }
        if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
          return true;
        }
        const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
        if (desiredSize > 0) {
          return true;
        }
        return false;
      }
      function ReadableByteStreamControllerClearAlgorithms(controller) {
        controller._pullAlgorithm = void 0;
        controller._cancelAlgorithm = void 0;
      }
      function ReadableByteStreamControllerClose(controller) {
        const stream = controller._controlledReadableByteStream;
        if (controller._closeRequested || stream._state !== "readable") {
          return;
        }
        if (controller._queueTotalSize > 0) {
          controller._closeRequested = true;
          return;
        }
        if (controller._pendingPullIntos.length > 0) {
          const firstPendingPullInto = controller._pendingPullIntos.peek();
          if (firstPendingPullInto.bytesFilled > 0) {
            const e3 = new TypeError("Insufficient bytes to fill elements in the given buffer");
            ReadableByteStreamControllerError(controller, e3);
            throw e3;
          }
        }
        ReadableByteStreamControllerClearAlgorithms(controller);
        ReadableStreamClose(stream);
      }
      function ReadableByteStreamControllerEnqueue(controller, chunk) {
        const stream = controller._controlledReadableByteStream;
        if (controller._closeRequested || stream._state !== "readable") {
          return;
        }
        const buffer = chunk.buffer;
        const byteOffset = chunk.byteOffset;
        const byteLength = chunk.byteLength;
        const transferredBuffer = TransferArrayBuffer(buffer);
        if (controller._pendingPullIntos.length > 0) {
          const firstPendingPullInto = controller._pendingPullIntos.peek();
          if (IsDetachedBuffer(firstPendingPullInto.buffer))
            ;
          firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
        }
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        if (ReadableStreamHasDefaultReader(stream)) {
          if (ReadableStreamGetNumReadRequests(stream) === 0) {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          } else {
            if (controller._pendingPullIntos.length > 0) {
              ReadableByteStreamControllerShiftPendingPullInto(controller);
            }
            const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
            ReadableStreamFulfillReadRequest(stream, transferredView, false);
          }
        } else if (ReadableStreamHasBYOBReader(stream)) {
          ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        } else {
          ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
        }
        ReadableByteStreamControllerCallPullIfNeeded(controller);
      }
      function ReadableByteStreamControllerError(controller, e3) {
        const stream = controller._controlledReadableByteStream;
        if (stream._state !== "readable") {
          return;
        }
        ReadableByteStreamControllerClearPendingPullIntos(controller);
        ResetQueue(controller);
        ReadableByteStreamControllerClearAlgorithms(controller);
        ReadableStreamError(stream, e3);
      }
      function ReadableByteStreamControllerGetBYOBRequest(controller) {
        if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
          const byobRequest = Object.create(ReadableStreamBYOBRequest2.prototype);
          SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
          controller._byobRequest = byobRequest;
        }
        return controller._byobRequest;
      }
      function ReadableByteStreamControllerGetDesiredSize(controller) {
        const state = controller._controlledReadableByteStream._state;
        if (state === "errored") {
          return null;
        }
        if (state === "closed") {
          return 0;
        }
        return controller._strategyHWM - controller._queueTotalSize;
      }
      function ReadableByteStreamControllerRespond(controller, bytesWritten) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        const state = controller._controlledReadableByteStream._state;
        if (state === "closed") {
          if (bytesWritten !== 0) {
            throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
          }
        } else {
          if (bytesWritten === 0) {
            throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
          }
          if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
            throw new RangeError("bytesWritten out of range");
          }
        }
        firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
        ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
      }
      function ReadableByteStreamControllerRespondWithNewView(controller, view) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        const state = controller._controlledReadableByteStream._state;
        if (state === "closed") {
          if (view.byteLength !== 0) {
            throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
          }
        } else {
          if (view.byteLength === 0) {
            throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
          }
        }
        if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
          throw new RangeError("The region specified by view does not match byobRequest");
        }
        if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
          throw new RangeError("The buffer of view has different capacity than byobRequest");
        }
        if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
          throw new RangeError("The region specified by view is larger than byobRequest");
        }
        const viewByteLength = view.byteLength;
        firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
        ReadableByteStreamControllerRespondInternal(controller, viewByteLength);
      }
      function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
        controller._controlledReadableByteStream = stream;
        controller._pullAgain = false;
        controller._pulling = false;
        controller._byobRequest = null;
        controller._queue = controller._queueTotalSize = void 0;
        ResetQueue(controller);
        controller._closeRequested = false;
        controller._started = false;
        controller._strategyHWM = highWaterMark;
        controller._pullAlgorithm = pullAlgorithm;
        controller._cancelAlgorithm = cancelAlgorithm;
        controller._autoAllocateChunkSize = autoAllocateChunkSize;
        controller._pendingPullIntos = new SimpleQueue();
        stream._readableStreamController = controller;
        const startResult = startAlgorithm();
        uponPromise(promiseResolvedWith(startResult), () => {
          controller._started = true;
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }, (r3) => {
          ReadableByteStreamControllerError(controller, r3);
        });
      }
      function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
        const controller = Object.create(ReadableByteStreamController2.prototype);
        let startAlgorithm = () => void 0;
        let pullAlgorithm = () => promiseResolvedWith(void 0);
        let cancelAlgorithm = () => promiseResolvedWith(void 0);
        if (underlyingByteSource.start !== void 0) {
          startAlgorithm = () => underlyingByteSource.start(controller);
        }
        if (underlyingByteSource.pull !== void 0) {
          pullAlgorithm = () => underlyingByteSource.pull(controller);
        }
        if (underlyingByteSource.cancel !== void 0) {
          cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
        }
        const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
        if (autoAllocateChunkSize === 0) {
          throw new TypeError("autoAllocateChunkSize must be greater than 0");
        }
        SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
      }
      function SetUpReadableStreamBYOBRequest(request, controller, view) {
        request._associatedReadableByteStreamController = controller;
        request._view = view;
      }
      function byobRequestBrandCheckException(name) {
        return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
      }
      function byteStreamControllerBrandCheckException(name) {
        return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
      }
      function AcquireReadableStreamBYOBReader(stream) {
        return new ReadableStreamBYOBReader2(stream);
      }
      function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
        stream._reader._readIntoRequests.push(readIntoRequest);
      }
      function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
        const reader = stream._reader;
        const readIntoRequest = reader._readIntoRequests.shift();
        if (done) {
          readIntoRequest._closeSteps(chunk);
        } else {
          readIntoRequest._chunkSteps(chunk);
        }
      }
      function ReadableStreamGetNumReadIntoRequests(stream) {
        return stream._reader._readIntoRequests.length;
      }
      function ReadableStreamHasBYOBReader(stream) {
        const reader = stream._reader;
        if (reader === void 0) {
          return false;
        }
        if (!IsReadableStreamBYOBReader(reader)) {
          return false;
        }
        return true;
      }
      class ReadableStreamBYOBReader2 {
        constructor(stream) {
          assertRequiredArgument(stream, 1, "ReadableStreamBYOBReader");
          assertReadableStream(stream, "First parameter");
          if (IsReadableStreamLocked(stream)) {
            throw new TypeError("This stream has already been locked for exclusive reading by another reader");
          }
          if (!IsReadableByteStreamController(stream._readableStreamController)) {
            throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
          }
          ReadableStreamReaderGenericInitialize(this, stream);
          this._readIntoRequests = new SimpleQueue();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the reader's lock is released before the stream finishes closing.
         */
        get closed() {
          if (!IsReadableStreamBYOBReader(this)) {
            return promiseRejectedWith(byobReaderBrandCheckException("closed"));
          }
          return this._closedPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(reason = void 0) {
          if (!IsReadableStreamBYOBReader(this)) {
            return promiseRejectedWith(byobReaderBrandCheckException("cancel"));
          }
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("cancel"));
          }
          return ReadableStreamReaderGenericCancel(this, reason);
        }
        /**
         * Attempts to reads bytes into view, and returns a promise resolved with the result.
         *
         * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
         */
        read(view) {
          if (!IsReadableStreamBYOBReader(this)) {
            return promiseRejectedWith(byobReaderBrandCheckException("read"));
          }
          if (!ArrayBuffer.isView(view)) {
            return promiseRejectedWith(new TypeError("view must be an array buffer view"));
          }
          if (view.byteLength === 0) {
            return promiseRejectedWith(new TypeError("view must have non-zero byteLength"));
          }
          if (view.buffer.byteLength === 0) {
            return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
          }
          if (IsDetachedBuffer(view.buffer))
            ;
          if (this._ownerReadableStream === void 0) {
            return promiseRejectedWith(readerLockException("read from"));
          }
          let resolvePromise;
          let rejectPromise;
          const promise = newPromise((resolve2, reject) => {
            resolvePromise = resolve2;
            rejectPromise = reject;
          });
          const readIntoRequest = {
            _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
            _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
            _errorSteps: (e3) => rejectPromise(e3)
          };
          ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
          return promise;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamBYOBReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
          if (!IsReadableStreamBYOBReader(this)) {
            throw byobReaderBrandCheckException("releaseLock");
          }
          if (this._ownerReadableStream === void 0) {
            return;
          }
          if (this._readIntoRequests.length > 0) {
            throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
          }
          ReadableStreamReaderGenericRelease(this);
        }
      }
      Object.defineProperties(ReadableStreamBYOBReader2.prototype, {
        cancel: { enumerable: true },
        read: { enumerable: true },
        releaseLock: { enumerable: true },
        closed: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamBYOBReader2.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStreamBYOBReader",
          configurable: true
        });
      }
      function IsReadableStreamBYOBReader(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_readIntoRequests")) {
          return false;
        }
        return x3 instanceof ReadableStreamBYOBReader2;
      }
      function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
        const stream = reader._ownerReadableStream;
        stream._disturbed = true;
        if (stream._state === "errored") {
          readIntoRequest._errorSteps(stream._storedError);
        } else {
          ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
        }
      }
      function byobReaderBrandCheckException(name) {
        return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
      }
      function ExtractHighWaterMark(strategy, defaultHWM) {
        const { highWaterMark } = strategy;
        if (highWaterMark === void 0) {
          return defaultHWM;
        }
        if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
          throw new RangeError("Invalid highWaterMark");
        }
        return highWaterMark;
      }
      function ExtractSizeAlgorithm(strategy) {
        const { size } = strategy;
        if (!size) {
          return () => 1;
        }
        return size;
      }
      function convertQueuingStrategy(init, context) {
        assertDictionary(init, context);
        const highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
        const size = init === null || init === void 0 ? void 0 : init.size;
        return {
          highWaterMark: highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
          size: size === void 0 ? void 0 : convertQueuingStrategySize(size, `${context} has member 'size' that`)
        };
      }
      function convertQueuingStrategySize(fn, context) {
        assertFunction(fn, context);
        return (chunk) => convertUnrestrictedDouble(fn(chunk));
      }
      function convertUnderlyingSink(original, context) {
        assertDictionary(original, context);
        const abort = original === null || original === void 0 ? void 0 : original.abort;
        const close = original === null || original === void 0 ? void 0 : original.close;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const type = original === null || original === void 0 ? void 0 : original.type;
        const write = original === null || original === void 0 ? void 0 : original.write;
        return {
          abort: abort === void 0 ? void 0 : convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
          close: close === void 0 ? void 0 : convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
          start: start === void 0 ? void 0 : convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
          write: write === void 0 ? void 0 : convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
          type
        };
      }
      function convertUnderlyingSinkAbortCallback(fn, original, context) {
        assertFunction(fn, context);
        return (reason) => promiseCall(fn, original, [reason]);
      }
      function convertUnderlyingSinkCloseCallback(fn, original, context) {
        assertFunction(fn, context);
        return () => promiseCall(fn, original, []);
      }
      function convertUnderlyingSinkStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
      }
      function convertUnderlyingSinkWriteCallback(fn, original, context) {
        assertFunction(fn, context);
        return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
      }
      function assertWritableStream(x3, context) {
        if (!IsWritableStream(x3)) {
          throw new TypeError(`${context} is not a WritableStream.`);
        }
      }
      function isAbortSignal2(value) {
        if (typeof value !== "object" || value === null) {
          return false;
        }
        try {
          return typeof value.aborted === "boolean";
        } catch (_a) {
          return false;
        }
      }
      const supportsAbortController = typeof AbortController === "function";
      function createAbortController() {
        if (supportsAbortController) {
          return new AbortController();
        }
        return void 0;
      }
      class WritableStream2 {
        constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
          if (rawUnderlyingSink === void 0) {
            rawUnderlyingSink = null;
          } else {
            assertObject(rawUnderlyingSink, "First parameter");
          }
          const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
          const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, "First parameter");
          InitializeWritableStream(this);
          const type = underlyingSink.type;
          if (type !== void 0) {
            throw new RangeError("Invalid type is specified");
          }
          const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
          const highWaterMark = ExtractHighWaterMark(strategy, 1);
          SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
        }
        /**
         * Returns whether or not the writable stream is locked to a writer.
         */
        get locked() {
          if (!IsWritableStream(this)) {
            throw streamBrandCheckException$2("locked");
          }
          return IsWritableStreamLocked(this);
        }
        /**
         * Aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be
         * immediately moved to an errored state, with any queued-up writes discarded. This will also execute any abort
         * mechanism of the underlying sink.
         *
         * The returned promise will fulfill if the stream shuts down successfully, or reject if the underlying sink signaled
         * that there was an error doing so. Additionally, it will reject with a `TypeError` (without attempting to cancel
         * the stream) if the stream is currently locked.
         */
        abort(reason = void 0) {
          if (!IsWritableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$2("abort"));
          }
          if (IsWritableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("Cannot abort a stream that already has a writer"));
          }
          return WritableStreamAbort(this, reason);
        }
        /**
         * Closes the stream. The underlying sink will finish processing any previously-written chunks, before invoking its
         * close behavior. During this time any further attempts to write will fail (without erroring the stream).
         *
         * The method returns a promise that will fulfill if all remaining chunks are successfully written and the stream
         * successfully closes, or rejects if an error is encountered during this process. Additionally, it will reject with
         * a `TypeError` (without attempting to cancel the stream) if the stream is currently locked.
         */
        close() {
          if (!IsWritableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$2("close"));
          }
          if (IsWritableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("Cannot close a stream that already has a writer"));
          }
          if (WritableStreamCloseQueuedOrInFlight(this)) {
            return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
          }
          return WritableStreamClose(this);
        }
        /**
         * Creates a {@link WritableStreamDefaultWriter | writer} and locks the stream to the new writer. While the stream
         * is locked, no other writer can be acquired until this one is released.
         *
         * This functionality is especially useful for creating abstractions that desire the ability to write to a stream
         * without interruption or interleaving. By getting a writer for the stream, you can ensure nobody else can write at
         * the same time, which would cause the resulting written data to be unpredictable and probably useless.
         */
        getWriter() {
          if (!IsWritableStream(this)) {
            throw streamBrandCheckException$2("getWriter");
          }
          return AcquireWritableStreamDefaultWriter(this);
        }
      }
      Object.defineProperties(WritableStream2.prototype, {
        abort: { enumerable: true },
        close: { enumerable: true },
        getWriter: { enumerable: true },
        locked: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(WritableStream2.prototype, SymbolPolyfill.toStringTag, {
          value: "WritableStream",
          configurable: true
        });
      }
      function AcquireWritableStreamDefaultWriter(stream) {
        return new WritableStreamDefaultWriter2(stream);
      }
      function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
        const stream = Object.create(WritableStream2.prototype);
        InitializeWritableStream(stream);
        const controller = Object.create(WritableStreamDefaultController2.prototype);
        SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        return stream;
      }
      function InitializeWritableStream(stream) {
        stream._state = "writable";
        stream._storedError = void 0;
        stream._writer = void 0;
        stream._writableStreamController = void 0;
        stream._writeRequests = new SimpleQueue();
        stream._inFlightWriteRequest = void 0;
        stream._closeRequest = void 0;
        stream._inFlightCloseRequest = void 0;
        stream._pendingAbortRequest = void 0;
        stream._backpressure = false;
      }
      function IsWritableStream(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_writableStreamController")) {
          return false;
        }
        return x3 instanceof WritableStream2;
      }
      function IsWritableStreamLocked(stream) {
        if (stream._writer === void 0) {
          return false;
        }
        return true;
      }
      function WritableStreamAbort(stream, reason) {
        var _a;
        if (stream._state === "closed" || stream._state === "errored") {
          return promiseResolvedWith(void 0);
        }
        stream._writableStreamController._abortReason = reason;
        (_a = stream._writableStreamController._abortController) === null || _a === void 0 ? void 0 : _a.abort();
        const state = stream._state;
        if (state === "closed" || state === "errored") {
          return promiseResolvedWith(void 0);
        }
        if (stream._pendingAbortRequest !== void 0) {
          return stream._pendingAbortRequest._promise;
        }
        let wasAlreadyErroring = false;
        if (state === "erroring") {
          wasAlreadyErroring = true;
          reason = void 0;
        }
        const promise = newPromise((resolve2, reject) => {
          stream._pendingAbortRequest = {
            _promise: void 0,
            _resolve: resolve2,
            _reject: reject,
            _reason: reason,
            _wasAlreadyErroring: wasAlreadyErroring
          };
        });
        stream._pendingAbortRequest._promise = promise;
        if (!wasAlreadyErroring) {
          WritableStreamStartErroring(stream, reason);
        }
        return promise;
      }
      function WritableStreamClose(stream) {
        const state = stream._state;
        if (state === "closed" || state === "errored") {
          return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
        }
        const promise = newPromise((resolve2, reject) => {
          const closeRequest = {
            _resolve: resolve2,
            _reject: reject
          };
          stream._closeRequest = closeRequest;
        });
        const writer = stream._writer;
        if (writer !== void 0 && stream._backpressure && state === "writable") {
          defaultWriterReadyPromiseResolve(writer);
        }
        WritableStreamDefaultControllerClose(stream._writableStreamController);
        return promise;
      }
      function WritableStreamAddWriteRequest(stream) {
        const promise = newPromise((resolve2, reject) => {
          const writeRequest = {
            _resolve: resolve2,
            _reject: reject
          };
          stream._writeRequests.push(writeRequest);
        });
        return promise;
      }
      function WritableStreamDealWithRejection(stream, error) {
        const state = stream._state;
        if (state === "writable") {
          WritableStreamStartErroring(stream, error);
          return;
        }
        WritableStreamFinishErroring(stream);
      }
      function WritableStreamStartErroring(stream, reason) {
        const controller = stream._writableStreamController;
        stream._state = "erroring";
        stream._storedError = reason;
        const writer = stream._writer;
        if (writer !== void 0) {
          WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
        }
        if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
          WritableStreamFinishErroring(stream);
        }
      }
      function WritableStreamFinishErroring(stream) {
        stream._state = "errored";
        stream._writableStreamController[ErrorSteps]();
        const storedError = stream._storedError;
        stream._writeRequests.forEach((writeRequest) => {
          writeRequest._reject(storedError);
        });
        stream._writeRequests = new SimpleQueue();
        if (stream._pendingAbortRequest === void 0) {
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          return;
        }
        const abortRequest = stream._pendingAbortRequest;
        stream._pendingAbortRequest = void 0;
        if (abortRequest._wasAlreadyErroring) {
          abortRequest._reject(storedError);
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          return;
        }
        const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
        uponPromise(promise, () => {
          abortRequest._resolve();
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
        }, (reason) => {
          abortRequest._reject(reason);
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
        });
      }
      function WritableStreamFinishInFlightWrite(stream) {
        stream._inFlightWriteRequest._resolve(void 0);
        stream._inFlightWriteRequest = void 0;
      }
      function WritableStreamFinishInFlightWriteWithError(stream, error) {
        stream._inFlightWriteRequest._reject(error);
        stream._inFlightWriteRequest = void 0;
        WritableStreamDealWithRejection(stream, error);
      }
      function WritableStreamFinishInFlightClose(stream) {
        stream._inFlightCloseRequest._resolve(void 0);
        stream._inFlightCloseRequest = void 0;
        const state = stream._state;
        if (state === "erroring") {
          stream._storedError = void 0;
          if (stream._pendingAbortRequest !== void 0) {
            stream._pendingAbortRequest._resolve();
            stream._pendingAbortRequest = void 0;
          }
        }
        stream._state = "closed";
        const writer = stream._writer;
        if (writer !== void 0) {
          defaultWriterClosedPromiseResolve(writer);
        }
      }
      function WritableStreamFinishInFlightCloseWithError(stream, error) {
        stream._inFlightCloseRequest._reject(error);
        stream._inFlightCloseRequest = void 0;
        if (stream._pendingAbortRequest !== void 0) {
          stream._pendingAbortRequest._reject(error);
          stream._pendingAbortRequest = void 0;
        }
        WritableStreamDealWithRejection(stream, error);
      }
      function WritableStreamCloseQueuedOrInFlight(stream) {
        if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
          return false;
        }
        return true;
      }
      function WritableStreamHasOperationMarkedInFlight(stream) {
        if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
          return false;
        }
        return true;
      }
      function WritableStreamMarkCloseRequestInFlight(stream) {
        stream._inFlightCloseRequest = stream._closeRequest;
        stream._closeRequest = void 0;
      }
      function WritableStreamMarkFirstWriteRequestInFlight(stream) {
        stream._inFlightWriteRequest = stream._writeRequests.shift();
      }
      function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
        if (stream._closeRequest !== void 0) {
          stream._closeRequest._reject(stream._storedError);
          stream._closeRequest = void 0;
        }
        const writer = stream._writer;
        if (writer !== void 0) {
          defaultWriterClosedPromiseReject(writer, stream._storedError);
        }
      }
      function WritableStreamUpdateBackpressure(stream, backpressure) {
        const writer = stream._writer;
        if (writer !== void 0 && backpressure !== stream._backpressure) {
          if (backpressure) {
            defaultWriterReadyPromiseReset(writer);
          } else {
            defaultWriterReadyPromiseResolve(writer);
          }
        }
        stream._backpressure = backpressure;
      }
      class WritableStreamDefaultWriter2 {
        constructor(stream) {
          assertRequiredArgument(stream, 1, "WritableStreamDefaultWriter");
          assertWritableStream(stream, "First parameter");
          if (IsWritableStreamLocked(stream)) {
            throw new TypeError("This stream has already been locked for exclusive writing by another writer");
          }
          this._ownerWritableStream = stream;
          stream._writer = this;
          const state = stream._state;
          if (state === "writable") {
            if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
              defaultWriterReadyPromiseInitialize(this);
            } else {
              defaultWriterReadyPromiseInitializeAsResolved(this);
            }
            defaultWriterClosedPromiseInitialize(this);
          } else if (state === "erroring") {
            defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
            defaultWriterClosedPromiseInitialize(this);
          } else if (state === "closed") {
            defaultWriterReadyPromiseInitializeAsResolved(this);
            defaultWriterClosedPromiseInitializeAsResolved(this);
          } else {
            const storedError = stream._storedError;
            defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
            defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
          }
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the writer’s lock is released before the stream finishes closing.
         */
        get closed() {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("closed"));
          }
          return this._closedPromise;
        }
        /**
         * Returns the desired size to fill the stream’s internal queue. It can be negative, if the queue is over-full.
         * A producer can use this information to determine the right amount of data to write.
         *
         * It will be `null` if the stream cannot be successfully written to (due to either being errored, or having an abort
         * queued up). It will return zero if the stream is closed. And the getter will throw an exception if invoked when
         * the writer’s lock is released.
         */
        get desiredSize() {
          if (!IsWritableStreamDefaultWriter(this)) {
            throw defaultWriterBrandCheckException("desiredSize");
          }
          if (this._ownerWritableStream === void 0) {
            throw defaultWriterLockException("desiredSize");
          }
          return WritableStreamDefaultWriterGetDesiredSize(this);
        }
        /**
         * Returns a promise that will be fulfilled when the desired size to fill the stream’s internal queue transitions
         * from non-positive to positive, signaling that it is no longer applying backpressure. Once the desired size dips
         * back to zero or below, the getter will return a new promise that stays pending until the next transition.
         *
         * If the stream becomes errored or aborted, or the writer’s lock is released, the returned promise will become
         * rejected.
         */
        get ready() {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("ready"));
          }
          return this._readyPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.abort | stream.abort(reason)}.
         */
        abort(reason = void 0) {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("abort"));
          }
          if (this._ownerWritableStream === void 0) {
            return promiseRejectedWith(defaultWriterLockException("abort"));
          }
          return WritableStreamDefaultWriterAbort(this, reason);
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.close | stream.close()}.
         */
        close() {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("close"));
          }
          const stream = this._ownerWritableStream;
          if (stream === void 0) {
            return promiseRejectedWith(defaultWriterLockException("close"));
          }
          if (WritableStreamCloseQueuedOrInFlight(stream)) {
            return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
          }
          return WritableStreamDefaultWriterClose(this);
        }
        /**
         * Releases the writer’s lock on the corresponding stream. After the lock is released, the writer is no longer active.
         * If the associated stream is errored when the lock is released, the writer will appear errored in the same way from
         * now on; otherwise, the writer will appear closed.
         *
         * Note that the lock can still be released even if some ongoing writes have not yet finished (i.e. even if the
         * promises returned from previous calls to {@link WritableStreamDefaultWriter.write | write()} have not yet settled).
         * It’s not necessary to hold the lock on the writer for the duration of the write; the lock instead simply prevents
         * other producers from writing in an interleaved manner.
         */
        releaseLock() {
          if (!IsWritableStreamDefaultWriter(this)) {
            throw defaultWriterBrandCheckException("releaseLock");
          }
          const stream = this._ownerWritableStream;
          if (stream === void 0) {
            return;
          }
          WritableStreamDefaultWriterRelease(this);
        }
        write(chunk = void 0) {
          if (!IsWritableStreamDefaultWriter(this)) {
            return promiseRejectedWith(defaultWriterBrandCheckException("write"));
          }
          if (this._ownerWritableStream === void 0) {
            return promiseRejectedWith(defaultWriterLockException("write to"));
          }
          return WritableStreamDefaultWriterWrite(this, chunk);
        }
      }
      Object.defineProperties(WritableStreamDefaultWriter2.prototype, {
        abort: { enumerable: true },
        close: { enumerable: true },
        releaseLock: { enumerable: true },
        write: { enumerable: true },
        closed: { enumerable: true },
        desiredSize: { enumerable: true },
        ready: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(WritableStreamDefaultWriter2.prototype, SymbolPolyfill.toStringTag, {
          value: "WritableStreamDefaultWriter",
          configurable: true
        });
      }
      function IsWritableStreamDefaultWriter(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_ownerWritableStream")) {
          return false;
        }
        return x3 instanceof WritableStreamDefaultWriter2;
      }
      function WritableStreamDefaultWriterAbort(writer, reason) {
        const stream = writer._ownerWritableStream;
        return WritableStreamAbort(stream, reason);
      }
      function WritableStreamDefaultWriterClose(writer) {
        const stream = writer._ownerWritableStream;
        return WritableStreamClose(stream);
      }
      function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
        const stream = writer._ownerWritableStream;
        const state = stream._state;
        if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
          return promiseResolvedWith(void 0);
        }
        if (state === "errored") {
          return promiseRejectedWith(stream._storedError);
        }
        return WritableStreamDefaultWriterClose(writer);
      }
      function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error) {
        if (writer._closedPromiseState === "pending") {
          defaultWriterClosedPromiseReject(writer, error);
        } else {
          defaultWriterClosedPromiseResetToRejected(writer, error);
        }
      }
      function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error) {
        if (writer._readyPromiseState === "pending") {
          defaultWriterReadyPromiseReject(writer, error);
        } else {
          defaultWriterReadyPromiseResetToRejected(writer, error);
        }
      }
      function WritableStreamDefaultWriterGetDesiredSize(writer) {
        const stream = writer._ownerWritableStream;
        const state = stream._state;
        if (state === "errored" || state === "erroring") {
          return null;
        }
        if (state === "closed") {
          return 0;
        }
        return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
      }
      function WritableStreamDefaultWriterRelease(writer) {
        const stream = writer._ownerWritableStream;
        const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
        WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
        WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
        stream._writer = void 0;
        writer._ownerWritableStream = void 0;
      }
      function WritableStreamDefaultWriterWrite(writer, chunk) {
        const stream = writer._ownerWritableStream;
        const controller = stream._writableStreamController;
        const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
        if (stream !== writer._ownerWritableStream) {
          return promiseRejectedWith(defaultWriterLockException("write to"));
        }
        const state = stream._state;
        if (state === "errored") {
          return promiseRejectedWith(stream._storedError);
        }
        if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
          return promiseRejectedWith(new TypeError("The stream is closing or closed and cannot be written to"));
        }
        if (state === "erroring") {
          return promiseRejectedWith(stream._storedError);
        }
        const promise = WritableStreamAddWriteRequest(stream);
        WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
        return promise;
      }
      const closeSentinel = {};
      class WritableStreamDefaultController2 {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * The reason which was passed to `WritableStream.abort(reason)` when the stream was aborted.
         *
         * @deprecated
         *  This property has been removed from the specification, see https://github.com/whatwg/streams/pull/1177.
         *  Use {@link WritableStreamDefaultController.signal}'s `reason` instead.
         */
        get abortReason() {
          if (!IsWritableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$2("abortReason");
          }
          return this._abortReason;
        }
        /**
         * An `AbortSignal` that can be used to abort the pending write or close operation when the stream is aborted.
         */
        get signal() {
          if (!IsWritableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$2("signal");
          }
          if (this._abortController === void 0) {
            throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
          }
          return this._abortController.signal;
        }
        /**
         * Closes the controlled writable stream, making all future interactions with it fail with the given error `e`.
         *
         * This method is rarely used, since usually it suffices to return a rejected promise from one of the underlying
         * sink's methods. However, it can be useful for suddenly shutting down a stream in response to an event outside the
         * normal lifecycle of interactions with the underlying sink.
         */
        error(e3 = void 0) {
          if (!IsWritableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$2("error");
          }
          const state = this._controlledWritableStream._state;
          if (state !== "writable") {
            return;
          }
          WritableStreamDefaultControllerError(this, e3);
        }
        /** @internal */
        [AbortSteps](reason) {
          const result = this._abortAlgorithm(reason);
          WritableStreamDefaultControllerClearAlgorithms(this);
          return result;
        }
        /** @internal */
        [ErrorSteps]() {
          ResetQueue(this);
        }
      }
      Object.defineProperties(WritableStreamDefaultController2.prototype, {
        abortReason: { enumerable: true },
        signal: { enumerable: true },
        error: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(WritableStreamDefaultController2.prototype, SymbolPolyfill.toStringTag, {
          value: "WritableStreamDefaultController",
          configurable: true
        });
      }
      function IsWritableStreamDefaultController(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_controlledWritableStream")) {
          return false;
        }
        return x3 instanceof WritableStreamDefaultController2;
      }
      function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
        controller._controlledWritableStream = stream;
        stream._writableStreamController = controller;
        controller._queue = void 0;
        controller._queueTotalSize = void 0;
        ResetQueue(controller);
        controller._abortReason = void 0;
        controller._abortController = createAbortController();
        controller._started = false;
        controller._strategySizeAlgorithm = sizeAlgorithm;
        controller._strategyHWM = highWaterMark;
        controller._writeAlgorithm = writeAlgorithm;
        controller._closeAlgorithm = closeAlgorithm;
        controller._abortAlgorithm = abortAlgorithm;
        const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
        WritableStreamUpdateBackpressure(stream, backpressure);
        const startResult = startAlgorithm();
        const startPromise = promiseResolvedWith(startResult);
        uponPromise(startPromise, () => {
          controller._started = true;
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }, (r3) => {
          controller._started = true;
          WritableStreamDealWithRejection(stream, r3);
        });
      }
      function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
        const controller = Object.create(WritableStreamDefaultController2.prototype);
        let startAlgorithm = () => void 0;
        let writeAlgorithm = () => promiseResolvedWith(void 0);
        let closeAlgorithm = () => promiseResolvedWith(void 0);
        let abortAlgorithm = () => promiseResolvedWith(void 0);
        if (underlyingSink.start !== void 0) {
          startAlgorithm = () => underlyingSink.start(controller);
        }
        if (underlyingSink.write !== void 0) {
          writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
        }
        if (underlyingSink.close !== void 0) {
          closeAlgorithm = () => underlyingSink.close();
        }
        if (underlyingSink.abort !== void 0) {
          abortAlgorithm = (reason) => underlyingSink.abort(reason);
        }
        SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
      }
      function WritableStreamDefaultControllerClearAlgorithms(controller) {
        controller._writeAlgorithm = void 0;
        controller._closeAlgorithm = void 0;
        controller._abortAlgorithm = void 0;
        controller._strategySizeAlgorithm = void 0;
      }
      function WritableStreamDefaultControllerClose(controller) {
        EnqueueValueWithSize(controller, closeSentinel, 0);
        WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
      }
      function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
        try {
          return controller._strategySizeAlgorithm(chunk);
        } catch (chunkSizeE) {
          WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
          return 1;
        }
      }
      function WritableStreamDefaultControllerGetDesiredSize(controller) {
        return controller._strategyHWM - controller._queueTotalSize;
      }
      function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
        try {
          EnqueueValueWithSize(controller, chunk, chunkSize);
        } catch (enqueueE) {
          WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
          return;
        }
        const stream = controller._controlledWritableStream;
        if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === "writable") {
          const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
          WritableStreamUpdateBackpressure(stream, backpressure);
        }
        WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
      }
      function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
        const stream = controller._controlledWritableStream;
        if (!controller._started) {
          return;
        }
        if (stream._inFlightWriteRequest !== void 0) {
          return;
        }
        const state = stream._state;
        if (state === "erroring") {
          WritableStreamFinishErroring(stream);
          return;
        }
        if (controller._queue.length === 0) {
          return;
        }
        const value = PeekQueueValue(controller);
        if (value === closeSentinel) {
          WritableStreamDefaultControllerProcessClose(controller);
        } else {
          WritableStreamDefaultControllerProcessWrite(controller, value);
        }
      }
      function WritableStreamDefaultControllerErrorIfNeeded(controller, error) {
        if (controller._controlledWritableStream._state === "writable") {
          WritableStreamDefaultControllerError(controller, error);
        }
      }
      function WritableStreamDefaultControllerProcessClose(controller) {
        const stream = controller._controlledWritableStream;
        WritableStreamMarkCloseRequestInFlight(stream);
        DequeueValue(controller);
        const sinkClosePromise = controller._closeAlgorithm();
        WritableStreamDefaultControllerClearAlgorithms(controller);
        uponPromise(sinkClosePromise, () => {
          WritableStreamFinishInFlightClose(stream);
        }, (reason) => {
          WritableStreamFinishInFlightCloseWithError(stream, reason);
        });
      }
      function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
        const stream = controller._controlledWritableStream;
        WritableStreamMarkFirstWriteRequestInFlight(stream);
        const sinkWritePromise = controller._writeAlgorithm(chunk);
        uponPromise(sinkWritePromise, () => {
          WritableStreamFinishInFlightWrite(stream);
          const state = stream._state;
          DequeueValue(controller);
          if (!WritableStreamCloseQueuedOrInFlight(stream) && state === "writable") {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }, (reason) => {
          if (stream._state === "writable") {
            WritableStreamDefaultControllerClearAlgorithms(controller);
          }
          WritableStreamFinishInFlightWriteWithError(stream, reason);
        });
      }
      function WritableStreamDefaultControllerGetBackpressure(controller) {
        const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
        return desiredSize <= 0;
      }
      function WritableStreamDefaultControllerError(controller, error) {
        const stream = controller._controlledWritableStream;
        WritableStreamDefaultControllerClearAlgorithms(controller);
        WritableStreamStartErroring(stream, error);
      }
      function streamBrandCheckException$2(name) {
        return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
      }
      function defaultControllerBrandCheckException$2(name) {
        return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
      }
      function defaultWriterBrandCheckException(name) {
        return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
      }
      function defaultWriterLockException(name) {
        return new TypeError("Cannot " + name + " a stream using a released writer");
      }
      function defaultWriterClosedPromiseInitialize(writer) {
        writer._closedPromise = newPromise((resolve2, reject) => {
          writer._closedPromise_resolve = resolve2;
          writer._closedPromise_reject = reject;
          writer._closedPromiseState = "pending";
        });
      }
      function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
        defaultWriterClosedPromiseInitialize(writer);
        defaultWriterClosedPromiseReject(writer, reason);
      }
      function defaultWriterClosedPromiseInitializeAsResolved(writer) {
        defaultWriterClosedPromiseInitialize(writer);
        defaultWriterClosedPromiseResolve(writer);
      }
      function defaultWriterClosedPromiseReject(writer, reason) {
        if (writer._closedPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(writer._closedPromise);
        writer._closedPromise_reject(reason);
        writer._closedPromise_resolve = void 0;
        writer._closedPromise_reject = void 0;
        writer._closedPromiseState = "rejected";
      }
      function defaultWriterClosedPromiseResetToRejected(writer, reason) {
        defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
      }
      function defaultWriterClosedPromiseResolve(writer) {
        if (writer._closedPromise_resolve === void 0) {
          return;
        }
        writer._closedPromise_resolve(void 0);
        writer._closedPromise_resolve = void 0;
        writer._closedPromise_reject = void 0;
        writer._closedPromiseState = "resolved";
      }
      function defaultWriterReadyPromiseInitialize(writer) {
        writer._readyPromise = newPromise((resolve2, reject) => {
          writer._readyPromise_resolve = resolve2;
          writer._readyPromise_reject = reject;
        });
        writer._readyPromiseState = "pending";
      }
      function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
        defaultWriterReadyPromiseInitialize(writer);
        defaultWriterReadyPromiseReject(writer, reason);
      }
      function defaultWriterReadyPromiseInitializeAsResolved(writer) {
        defaultWriterReadyPromiseInitialize(writer);
        defaultWriterReadyPromiseResolve(writer);
      }
      function defaultWriterReadyPromiseReject(writer, reason) {
        if (writer._readyPromise_reject === void 0) {
          return;
        }
        setPromiseIsHandledToTrue(writer._readyPromise);
        writer._readyPromise_reject(reason);
        writer._readyPromise_resolve = void 0;
        writer._readyPromise_reject = void 0;
        writer._readyPromiseState = "rejected";
      }
      function defaultWriterReadyPromiseReset(writer) {
        defaultWriterReadyPromiseInitialize(writer);
      }
      function defaultWriterReadyPromiseResetToRejected(writer, reason) {
        defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
      }
      function defaultWriterReadyPromiseResolve(writer) {
        if (writer._readyPromise_resolve === void 0) {
          return;
        }
        writer._readyPromise_resolve(void 0);
        writer._readyPromise_resolve = void 0;
        writer._readyPromise_reject = void 0;
        writer._readyPromiseState = "fulfilled";
      }
      const NativeDOMException = typeof DOMException !== "undefined" ? DOMException : void 0;
      function isDOMExceptionConstructor(ctor) {
        if (!(typeof ctor === "function" || typeof ctor === "object")) {
          return false;
        }
        try {
          new ctor();
          return true;
        } catch (_a) {
          return false;
        }
      }
      function createDOMExceptionPolyfill() {
        const ctor = function DOMException3(message, name) {
          this.message = message || "";
          this.name = name || "Error";
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
          }
        };
        ctor.prototype = Object.create(Error.prototype);
        Object.defineProperty(ctor.prototype, "constructor", { value: ctor, writable: true, configurable: true });
        return ctor;
      }
      const DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();
      function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
        const reader = AcquireReadableStreamDefaultReader(source);
        const writer = AcquireWritableStreamDefaultWriter(dest);
        source._disturbed = true;
        let shuttingDown = false;
        let currentWrite = promiseResolvedWith(void 0);
        return newPromise((resolve2, reject) => {
          let abortAlgorithm;
          if (signal !== void 0) {
            abortAlgorithm = () => {
              const error = new DOMException$1("Aborted", "AbortError");
              const actions = [];
              if (!preventAbort) {
                actions.push(() => {
                  if (dest._state === "writable") {
                    return WritableStreamAbort(dest, error);
                  }
                  return promiseResolvedWith(void 0);
                });
              }
              if (!preventCancel) {
                actions.push(() => {
                  if (source._state === "readable") {
                    return ReadableStreamCancel(source, error);
                  }
                  return promiseResolvedWith(void 0);
                });
              }
              shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error);
            };
            if (signal.aborted) {
              abortAlgorithm();
              return;
            }
            signal.addEventListener("abort", abortAlgorithm);
          }
          function pipeLoop() {
            return newPromise((resolveLoop, rejectLoop) => {
              function next(done) {
                if (done) {
                  resolveLoop();
                } else {
                  PerformPromiseThen(pipeStep(), next, rejectLoop);
                }
              }
              next(false);
            });
          }
          function pipeStep() {
            if (shuttingDown) {
              return promiseResolvedWith(true);
            }
            return PerformPromiseThen(writer._readyPromise, () => {
              return newPromise((resolveRead, rejectRead) => {
                ReadableStreamDefaultReaderRead(reader, {
                  _chunkSteps: (chunk) => {
                    currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), void 0, noop2);
                    resolveRead(false);
                  },
                  _closeSteps: () => resolveRead(true),
                  _errorSteps: rejectRead
                });
              });
            });
          }
          isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
            if (!preventAbort) {
              shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
            } else {
              shutdown(true, storedError);
            }
          });
          isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
            if (!preventCancel) {
              shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
            } else {
              shutdown(true, storedError);
            }
          });
          isOrBecomesClosed(source, reader._closedPromise, () => {
            if (!preventClose) {
              shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
            } else {
              shutdown();
            }
          });
          if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === "closed") {
            const destClosed = new TypeError("the destination writable stream closed before all data could be piped to it");
            if (!preventCancel) {
              shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
            } else {
              shutdown(true, destClosed);
            }
          }
          setPromiseIsHandledToTrue(pipeLoop());
          function waitForWritesToFinish() {
            const oldCurrentWrite = currentWrite;
            return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0);
          }
          function isOrBecomesErrored(stream, promise, action) {
            if (stream._state === "errored") {
              action(stream._storedError);
            } else {
              uponRejection(promise, action);
            }
          }
          function isOrBecomesClosed(stream, promise, action) {
            if (stream._state === "closed") {
              action();
            } else {
              uponFulfillment(promise, action);
            }
          }
          function shutdownWithAction(action, originalIsError, originalError) {
            if (shuttingDown) {
              return;
            }
            shuttingDown = true;
            if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
              uponFulfillment(waitForWritesToFinish(), doTheRest);
            } else {
              doTheRest();
            }
            function doTheRest() {
              uponPromise(action(), () => finalize(originalIsError, originalError), (newError) => finalize(true, newError));
            }
          }
          function shutdown(isError, error) {
            if (shuttingDown) {
              return;
            }
            shuttingDown = true;
            if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
              uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error));
            } else {
              finalize(isError, error);
            }
          }
          function finalize(isError, error) {
            WritableStreamDefaultWriterRelease(writer);
            ReadableStreamReaderGenericRelease(reader);
            if (signal !== void 0) {
              signal.removeEventListener("abort", abortAlgorithm);
            }
            if (isError) {
              reject(error);
            } else {
              resolve2(void 0);
            }
          }
        });
      }
      class ReadableStreamDefaultController2 {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("desiredSize");
          }
          return ReadableStreamDefaultControllerGetDesiredSize(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("close");
          }
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
            throw new TypeError("The stream is not in a state that permits close");
          }
          ReadableStreamDefaultControllerClose(this);
        }
        enqueue(chunk = void 0) {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("enqueue");
          }
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
            throw new TypeError("The stream is not in a state that permits enqueue");
          }
          return ReadableStreamDefaultControllerEnqueue(this, chunk);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(e3 = void 0) {
          if (!IsReadableStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException$1("error");
          }
          ReadableStreamDefaultControllerError(this, e3);
        }
        /** @internal */
        [CancelSteps](reason) {
          ResetQueue(this);
          const result = this._cancelAlgorithm(reason);
          ReadableStreamDefaultControllerClearAlgorithms(this);
          return result;
        }
        /** @internal */
        [PullSteps](readRequest) {
          const stream = this._controlledReadableStream;
          if (this._queue.length > 0) {
            const chunk = DequeueValue(this);
            if (this._closeRequested && this._queue.length === 0) {
              ReadableStreamDefaultControllerClearAlgorithms(this);
              ReadableStreamClose(stream);
            } else {
              ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
            readRequest._chunkSteps(chunk);
          } else {
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableStreamDefaultControllerCallPullIfNeeded(this);
          }
        }
      }
      Object.defineProperties(ReadableStreamDefaultController2.prototype, {
        close: { enumerable: true },
        enqueue: { enumerable: true },
        error: { enumerable: true },
        desiredSize: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStreamDefaultController2.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStreamDefaultController",
          configurable: true
        });
      }
      function IsReadableStreamDefaultController(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_controlledReadableStream")) {
          return false;
        }
        return x3 instanceof ReadableStreamDefaultController2;
      }
      function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
        const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
        if (!shouldPull) {
          return;
        }
        if (controller._pulling) {
          controller._pullAgain = true;
          return;
        }
        controller._pulling = true;
        const pullPromise = controller._pullAlgorithm();
        uponPromise(pullPromise, () => {
          controller._pulling = false;
          if (controller._pullAgain) {
            controller._pullAgain = false;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          }
        }, (e3) => {
          ReadableStreamDefaultControllerError(controller, e3);
        });
      }
      function ReadableStreamDefaultControllerShouldCallPull(controller) {
        const stream = controller._controlledReadableStream;
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
          return false;
        }
        if (!controller._started) {
          return false;
        }
        if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
          return true;
        }
        const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
        if (desiredSize > 0) {
          return true;
        }
        return false;
      }
      function ReadableStreamDefaultControllerClearAlgorithms(controller) {
        controller._pullAlgorithm = void 0;
        controller._cancelAlgorithm = void 0;
        controller._strategySizeAlgorithm = void 0;
      }
      function ReadableStreamDefaultControllerClose(controller) {
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
          return;
        }
        const stream = controller._controlledReadableStream;
        controller._closeRequested = true;
        if (controller._queue.length === 0) {
          ReadableStreamDefaultControllerClearAlgorithms(controller);
          ReadableStreamClose(stream);
        }
      }
      function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
          return;
        }
        const stream = controller._controlledReadableStream;
        if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
          ReadableStreamFulfillReadRequest(stream, chunk, false);
        } else {
          let chunkSize;
          try {
            chunkSize = controller._strategySizeAlgorithm(chunk);
          } catch (chunkSizeE) {
            ReadableStreamDefaultControllerError(controller, chunkSizeE);
            throw chunkSizeE;
          }
          try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
          } catch (enqueueE) {
            ReadableStreamDefaultControllerError(controller, enqueueE);
            throw enqueueE;
          }
        }
        ReadableStreamDefaultControllerCallPullIfNeeded(controller);
      }
      function ReadableStreamDefaultControllerError(controller, e3) {
        const stream = controller._controlledReadableStream;
        if (stream._state !== "readable") {
          return;
        }
        ResetQueue(controller);
        ReadableStreamDefaultControllerClearAlgorithms(controller);
        ReadableStreamError(stream, e3);
      }
      function ReadableStreamDefaultControllerGetDesiredSize(controller) {
        const state = controller._controlledReadableStream._state;
        if (state === "errored") {
          return null;
        }
        if (state === "closed") {
          return 0;
        }
        return controller._strategyHWM - controller._queueTotalSize;
      }
      function ReadableStreamDefaultControllerHasBackpressure(controller) {
        if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
          return false;
        }
        return true;
      }
      function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
        const state = controller._controlledReadableStream._state;
        if (!controller._closeRequested && state === "readable") {
          return true;
        }
        return false;
      }
      function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
        controller._controlledReadableStream = stream;
        controller._queue = void 0;
        controller._queueTotalSize = void 0;
        ResetQueue(controller);
        controller._started = false;
        controller._closeRequested = false;
        controller._pullAgain = false;
        controller._pulling = false;
        controller._strategySizeAlgorithm = sizeAlgorithm;
        controller._strategyHWM = highWaterMark;
        controller._pullAlgorithm = pullAlgorithm;
        controller._cancelAlgorithm = cancelAlgorithm;
        stream._readableStreamController = controller;
        const startResult = startAlgorithm();
        uponPromise(promiseResolvedWith(startResult), () => {
          controller._started = true;
          ReadableStreamDefaultControllerCallPullIfNeeded(controller);
        }, (r3) => {
          ReadableStreamDefaultControllerError(controller, r3);
        });
      }
      function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
        const controller = Object.create(ReadableStreamDefaultController2.prototype);
        let startAlgorithm = () => void 0;
        let pullAlgorithm = () => promiseResolvedWith(void 0);
        let cancelAlgorithm = () => promiseResolvedWith(void 0);
        if (underlyingSource.start !== void 0) {
          startAlgorithm = () => underlyingSource.start(controller);
        }
        if (underlyingSource.pull !== void 0) {
          pullAlgorithm = () => underlyingSource.pull(controller);
        }
        if (underlyingSource.cancel !== void 0) {
          cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
        }
        SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
      }
      function defaultControllerBrandCheckException$1(name) {
        return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
      }
      function ReadableStreamTee(stream, cloneForBranch2) {
        if (IsReadableByteStreamController(stream._readableStreamController)) {
          return ReadableByteStreamTee(stream);
        }
        return ReadableStreamDefaultTee(stream);
      }
      function ReadableStreamDefaultTee(stream, cloneForBranch2) {
        const reader = AcquireReadableStreamDefaultReader(stream);
        let reading = false;
        let readAgain = false;
        let canceled1 = false;
        let canceled2 = false;
        let reason1;
        let reason2;
        let branch1;
        let branch2;
        let resolveCancelPromise;
        const cancelPromise = newPromise((resolve2) => {
          resolveCancelPromise = resolve2;
        });
        function pullAlgorithm() {
          if (reading) {
            readAgain = true;
            return promiseResolvedWith(void 0);
          }
          reading = true;
          const readRequest = {
            _chunkSteps: (chunk) => {
              queueMicrotask2(() => {
                readAgain = false;
                const chunk1 = chunk;
                const chunk2 = chunk;
                if (!canceled1) {
                  ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                }
                if (!canceled2) {
                  ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                }
                reading = false;
                if (readAgain) {
                  pullAlgorithm();
                }
              });
            },
            _closeSteps: () => {
              reading = false;
              if (!canceled1) {
                ReadableStreamDefaultControllerClose(branch1._readableStreamController);
              }
              if (!canceled2) {
                ReadableStreamDefaultControllerClose(branch2._readableStreamController);
              }
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            },
            _errorSteps: () => {
              reading = false;
            }
          };
          ReadableStreamDefaultReaderRead(reader, readRequest);
          return promiseResolvedWith(void 0);
        }
        function cancel1Algorithm(reason) {
          canceled1 = true;
          reason1 = reason;
          if (canceled2) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function cancel2Algorithm(reason) {
          canceled2 = true;
          reason2 = reason;
          if (canceled1) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function startAlgorithm() {
        }
        branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
        branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
        uponRejection(reader._closedPromise, (r3) => {
          ReadableStreamDefaultControllerError(branch1._readableStreamController, r3);
          ReadableStreamDefaultControllerError(branch2._readableStreamController, r3);
          if (!canceled1 || !canceled2) {
            resolveCancelPromise(void 0);
          }
        });
        return [branch1, branch2];
      }
      function ReadableByteStreamTee(stream) {
        let reader = AcquireReadableStreamDefaultReader(stream);
        let reading = false;
        let readAgainForBranch1 = false;
        let readAgainForBranch2 = false;
        let canceled1 = false;
        let canceled2 = false;
        let reason1;
        let reason2;
        let branch1;
        let branch2;
        let resolveCancelPromise;
        const cancelPromise = newPromise((resolve2) => {
          resolveCancelPromise = resolve2;
        });
        function forwardReaderError(thisReader) {
          uponRejection(thisReader._closedPromise, (r3) => {
            if (thisReader !== reader) {
              return;
            }
            ReadableByteStreamControllerError(branch1._readableStreamController, r3);
            ReadableByteStreamControllerError(branch2._readableStreamController, r3);
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(void 0);
            }
          });
        }
        function pullWithDefaultReader() {
          if (IsReadableStreamBYOBReader(reader)) {
            ReadableStreamReaderGenericRelease(reader);
            reader = AcquireReadableStreamDefaultReader(stream);
            forwardReaderError(reader);
          }
          const readRequest = {
            _chunkSteps: (chunk) => {
              queueMicrotask2(() => {
                readAgainForBranch1 = false;
                readAgainForBranch2 = false;
                const chunk1 = chunk;
                let chunk2 = chunk;
                if (!canceled1 && !canceled2) {
                  try {
                    chunk2 = CloneAsUint8Array(chunk);
                  } catch (cloneE) {
                    ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                    ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                    resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                    return;
                  }
                }
                if (!canceled1) {
                  ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                }
                if (!canceled2) {
                  ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                }
                reading = false;
                if (readAgainForBranch1) {
                  pull1Algorithm();
                } else if (readAgainForBranch2) {
                  pull2Algorithm();
                }
              });
            },
            _closeSteps: () => {
              reading = false;
              if (!canceled1) {
                ReadableByteStreamControllerClose(branch1._readableStreamController);
              }
              if (!canceled2) {
                ReadableByteStreamControllerClose(branch2._readableStreamController);
              }
              if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
              }
              if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
              }
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            },
            _errorSteps: () => {
              reading = false;
            }
          };
          ReadableStreamDefaultReaderRead(reader, readRequest);
        }
        function pullWithBYOBReader(view, forBranch2) {
          if (IsReadableStreamDefaultReader(reader)) {
            ReadableStreamReaderGenericRelease(reader);
            reader = AcquireReadableStreamBYOBReader(stream);
            forwardReaderError(reader);
          }
          const byobBranch = forBranch2 ? branch2 : branch1;
          const otherBranch = forBranch2 ? branch1 : branch2;
          const readIntoRequest = {
            _chunkSteps: (chunk) => {
              queueMicrotask2(() => {
                readAgainForBranch1 = false;
                readAgainForBranch2 = false;
                const byobCanceled = forBranch2 ? canceled2 : canceled1;
                const otherCanceled = forBranch2 ? canceled1 : canceled2;
                if (!otherCanceled) {
                  let clonedChunk;
                  try {
                    clonedChunk = CloneAsUint8Array(chunk);
                  } catch (cloneE) {
                    ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                    ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                    resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                    return;
                  }
                  if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                  ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                } else if (!byobCanceled) {
                  ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                }
                reading = false;
                if (readAgainForBranch1) {
                  pull1Algorithm();
                } else if (readAgainForBranch2) {
                  pull2Algorithm();
                }
              });
            },
            _closeSteps: (chunk) => {
              reading = false;
              const byobCanceled = forBranch2 ? canceled2 : canceled1;
              const otherCanceled = forBranch2 ? canceled1 : canceled2;
              if (!byobCanceled) {
                ReadableByteStreamControllerClose(byobBranch._readableStreamController);
              }
              if (!otherCanceled) {
                ReadableByteStreamControllerClose(otherBranch._readableStreamController);
              }
              if (chunk !== void 0) {
                if (!byobCanceled) {
                  ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                }
                if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                }
              }
              if (!byobCanceled || !otherCanceled) {
                resolveCancelPromise(void 0);
              }
            },
            _errorSteps: () => {
              reading = false;
            }
          };
          ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
        }
        function pull1Algorithm() {
          if (reading) {
            readAgainForBranch1 = true;
            return promiseResolvedWith(void 0);
          }
          reading = true;
          const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
          if (byobRequest === null) {
            pullWithDefaultReader();
          } else {
            pullWithBYOBReader(byobRequest._view, false);
          }
          return promiseResolvedWith(void 0);
        }
        function pull2Algorithm() {
          if (reading) {
            readAgainForBranch2 = true;
            return promiseResolvedWith(void 0);
          }
          reading = true;
          const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
          if (byobRequest === null) {
            pullWithDefaultReader();
          } else {
            pullWithBYOBReader(byobRequest._view, true);
          }
          return promiseResolvedWith(void 0);
        }
        function cancel1Algorithm(reason) {
          canceled1 = true;
          reason1 = reason;
          if (canceled2) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function cancel2Algorithm(reason) {
          canceled2 = true;
          reason2 = reason;
          if (canceled1) {
            const compositeReason = CreateArrayFromList([reason1, reason2]);
            const cancelResult = ReadableStreamCancel(stream, compositeReason);
            resolveCancelPromise(cancelResult);
          }
          return cancelPromise;
        }
        function startAlgorithm() {
          return;
        }
        branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
        branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
        forwardReaderError(reader);
        return [branch1, branch2];
      }
      function convertUnderlyingDefaultOrByteSource(source, context) {
        assertDictionary(source, context);
        const original = source;
        const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
        const cancel = original === null || original === void 0 ? void 0 : original.cancel;
        const pull = original === null || original === void 0 ? void 0 : original.pull;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const type = original === null || original === void 0 ? void 0 : original.type;
        return {
          autoAllocateChunkSize: autoAllocateChunkSize === void 0 ? void 0 : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
          cancel: cancel === void 0 ? void 0 : convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
          pull: pull === void 0 ? void 0 : convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
          start: start === void 0 ? void 0 : convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
          type: type === void 0 ? void 0 : convertReadableStreamType(type, `${context} has member 'type' that`)
        };
      }
      function convertUnderlyingSourceCancelCallback(fn, original, context) {
        assertFunction(fn, context);
        return (reason) => promiseCall(fn, original, [reason]);
      }
      function convertUnderlyingSourcePullCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => promiseCall(fn, original, [controller]);
      }
      function convertUnderlyingSourceStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
      }
      function convertReadableStreamType(type, context) {
        type = `${type}`;
        if (type !== "bytes") {
          throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
        }
        return type;
      }
      function convertReaderOptions(options, context) {
        assertDictionary(options, context);
        const mode = options === null || options === void 0 ? void 0 : options.mode;
        return {
          mode: mode === void 0 ? void 0 : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
        };
      }
      function convertReadableStreamReaderMode(mode, context) {
        mode = `${mode}`;
        if (mode !== "byob") {
          throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
        }
        return mode;
      }
      function convertIteratorOptions(options, context) {
        assertDictionary(options, context);
        const preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
        return { preventCancel: Boolean(preventCancel) };
      }
      function convertPipeOptions(options, context) {
        assertDictionary(options, context);
        const preventAbort = options === null || options === void 0 ? void 0 : options.preventAbort;
        const preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
        const preventClose = options === null || options === void 0 ? void 0 : options.preventClose;
        const signal = options === null || options === void 0 ? void 0 : options.signal;
        if (signal !== void 0) {
          assertAbortSignal(signal, `${context} has member 'signal' that`);
        }
        return {
          preventAbort: Boolean(preventAbort),
          preventCancel: Boolean(preventCancel),
          preventClose: Boolean(preventClose),
          signal
        };
      }
      function assertAbortSignal(signal, context) {
        if (!isAbortSignal2(signal)) {
          throw new TypeError(`${context} is not an AbortSignal.`);
        }
      }
      function convertReadableWritablePair(pair, context) {
        assertDictionary(pair, context);
        const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
        assertRequiredField(readable, "readable", "ReadableWritablePair");
        assertReadableStream(readable, `${context} has member 'readable' that`);
        const writable = pair === null || pair === void 0 ? void 0 : pair.writable;
        assertRequiredField(writable, "writable", "ReadableWritablePair");
        assertWritableStream(writable, `${context} has member 'writable' that`);
        return { readable, writable };
      }
      class ReadableStream3 {
        constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
          if (rawUnderlyingSource === void 0) {
            rawUnderlyingSource = null;
          } else {
            assertObject(rawUnderlyingSource, "First parameter");
          }
          const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
          const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, "First parameter");
          InitializeReadableStream(this);
          if (underlyingSource.type === "bytes") {
            if (strategy.size !== void 0) {
              throw new RangeError("The strategy for a byte stream cannot have a size function");
            }
            const highWaterMark = ExtractHighWaterMark(strategy, 0);
            SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
          } else {
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
          }
        }
        /**
         * Whether or not the readable stream is locked to a {@link ReadableStreamDefaultReader | reader}.
         */
        get locked() {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("locked");
          }
          return IsReadableStreamLocked(this);
        }
        /**
         * Cancels the stream, signaling a loss of interest in the stream by a consumer.
         *
         * The supplied `reason` argument will be given to the underlying source's {@link UnderlyingSource.cancel | cancel()}
         * method, which might or might not use it.
         */
        cancel(reason = void 0) {
          if (!IsReadableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$1("cancel"));
          }
          if (IsReadableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("Cannot cancel a stream that already has a reader"));
          }
          return ReadableStreamCancel(this, reason);
        }
        getReader(rawOptions = void 0) {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("getReader");
          }
          const options = convertReaderOptions(rawOptions, "First parameter");
          if (options.mode === void 0) {
            return AcquireReadableStreamDefaultReader(this);
          }
          return AcquireReadableStreamBYOBReader(this);
        }
        pipeThrough(rawTransform, rawOptions = {}) {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("pipeThrough");
          }
          assertRequiredArgument(rawTransform, 1, "pipeThrough");
          const transform = convertReadableWritablePair(rawTransform, "First parameter");
          const options = convertPipeOptions(rawOptions, "Second parameter");
          if (IsReadableStreamLocked(this)) {
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
          }
          if (IsWritableStreamLocked(transform.writable)) {
            throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
          }
          const promise = ReadableStreamPipeTo(this, transform.writable, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
          setPromiseIsHandledToTrue(promise);
          return transform.readable;
        }
        pipeTo(destination, rawOptions = {}) {
          if (!IsReadableStream(this)) {
            return promiseRejectedWith(streamBrandCheckException$1("pipeTo"));
          }
          if (destination === void 0) {
            return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
          }
          if (!IsWritableStream(destination)) {
            return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
          }
          let options;
          try {
            options = convertPipeOptions(rawOptions, "Second parameter");
          } catch (e3) {
            return promiseRejectedWith(e3);
          }
          if (IsReadableStreamLocked(this)) {
            return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"));
          }
          if (IsWritableStreamLocked(destination)) {
            return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"));
          }
          return ReadableStreamPipeTo(this, destination, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
        }
        /**
         * Tees this readable stream, returning a two-element array containing the two resulting branches as
         * new {@link ReadableStream} instances.
         *
         * Teeing a stream will lock it, preventing any other consumer from acquiring a reader.
         * To cancel the stream, cancel both of the resulting branches; a composite cancellation reason will then be
         * propagated to the stream's underlying source.
         *
         * Note that the chunks seen in each branch will be the same object. If the chunks are not immutable,
         * this could allow interference between the two branches.
         */
        tee() {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("tee");
          }
          const branches = ReadableStreamTee(this);
          return CreateArrayFromList(branches);
        }
        values(rawOptions = void 0) {
          if (!IsReadableStream(this)) {
            throw streamBrandCheckException$1("values");
          }
          const options = convertIteratorOptions(rawOptions, "First parameter");
          return AcquireReadableStreamAsyncIterator(this, options.preventCancel);
        }
      }
      Object.defineProperties(ReadableStream3.prototype, {
        cancel: { enumerable: true },
        getReader: { enumerable: true },
        pipeThrough: { enumerable: true },
        pipeTo: { enumerable: true },
        tee: { enumerable: true },
        values: { enumerable: true },
        locked: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ReadableStream3.prototype, SymbolPolyfill.toStringTag, {
          value: "ReadableStream",
          configurable: true
        });
      }
      if (typeof SymbolPolyfill.asyncIterator === "symbol") {
        Object.defineProperty(ReadableStream3.prototype, SymbolPolyfill.asyncIterator, {
          value: ReadableStream3.prototype.values,
          writable: true,
          configurable: true
        });
      }
      function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
        const stream = Object.create(ReadableStream3.prototype);
        InitializeReadableStream(stream);
        const controller = Object.create(ReadableStreamDefaultController2.prototype);
        SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        return stream;
      }
      function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
        const stream = Object.create(ReadableStream3.prototype);
        InitializeReadableStream(stream);
        const controller = Object.create(ReadableByteStreamController2.prototype);
        SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, void 0);
        return stream;
      }
      function InitializeReadableStream(stream) {
        stream._state = "readable";
        stream._reader = void 0;
        stream._storedError = void 0;
        stream._disturbed = false;
      }
      function IsReadableStream(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_readableStreamController")) {
          return false;
        }
        return x3 instanceof ReadableStream3;
      }
      function IsReadableStreamLocked(stream) {
        if (stream._reader === void 0) {
          return false;
        }
        return true;
      }
      function ReadableStreamCancel(stream, reason) {
        stream._disturbed = true;
        if (stream._state === "closed") {
          return promiseResolvedWith(void 0);
        }
        if (stream._state === "errored") {
          return promiseRejectedWith(stream._storedError);
        }
        ReadableStreamClose(stream);
        const reader = stream._reader;
        if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
          reader._readIntoRequests.forEach((readIntoRequest) => {
            readIntoRequest._closeSteps(void 0);
          });
          reader._readIntoRequests = new SimpleQueue();
        }
        const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
        return transformPromiseWith(sourceCancelPromise, noop2);
      }
      function ReadableStreamClose(stream) {
        stream._state = "closed";
        const reader = stream._reader;
        if (reader === void 0) {
          return;
        }
        defaultReaderClosedPromiseResolve(reader);
        if (IsReadableStreamDefaultReader(reader)) {
          reader._readRequests.forEach((readRequest) => {
            readRequest._closeSteps();
          });
          reader._readRequests = new SimpleQueue();
        }
      }
      function ReadableStreamError(stream, e3) {
        stream._state = "errored";
        stream._storedError = e3;
        const reader = stream._reader;
        if (reader === void 0) {
          return;
        }
        defaultReaderClosedPromiseReject(reader, e3);
        if (IsReadableStreamDefaultReader(reader)) {
          reader._readRequests.forEach((readRequest) => {
            readRequest._errorSteps(e3);
          });
          reader._readRequests = new SimpleQueue();
        } else {
          reader._readIntoRequests.forEach((readIntoRequest) => {
            readIntoRequest._errorSteps(e3);
          });
          reader._readIntoRequests = new SimpleQueue();
        }
      }
      function streamBrandCheckException$1(name) {
        return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
      }
      function convertQueuingStrategyInit(init, context) {
        assertDictionary(init, context);
        const highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
        assertRequiredField(highWaterMark, "highWaterMark", "QueuingStrategyInit");
        return {
          highWaterMark: convertUnrestrictedDouble(highWaterMark)
        };
      }
      const byteLengthSizeFunction = (chunk) => {
        return chunk.byteLength;
      };
      try {
        Object.defineProperty(byteLengthSizeFunction, "name", {
          value: "size",
          configurable: true
        });
      } catch (_a) {
      }
      class ByteLengthQueuingStrategy2 {
        constructor(options) {
          assertRequiredArgument(options, 1, "ByteLengthQueuingStrategy");
          options = convertQueuingStrategyInit(options, "First parameter");
          this._byteLengthQueuingStrategyHighWaterMark = options.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!IsByteLengthQueuingStrategy(this)) {
            throw byteLengthBrandCheckException("highWaterMark");
          }
          return this._byteLengthQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by returning the value of its `byteLength` property.
         */
        get size() {
          if (!IsByteLengthQueuingStrategy(this)) {
            throw byteLengthBrandCheckException("size");
          }
          return byteLengthSizeFunction;
        }
      }
      Object.defineProperties(ByteLengthQueuingStrategy2.prototype, {
        highWaterMark: { enumerable: true },
        size: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(ByteLengthQueuingStrategy2.prototype, SymbolPolyfill.toStringTag, {
          value: "ByteLengthQueuingStrategy",
          configurable: true
        });
      }
      function byteLengthBrandCheckException(name) {
        return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
      }
      function IsByteLengthQueuingStrategy(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_byteLengthQueuingStrategyHighWaterMark")) {
          return false;
        }
        return x3 instanceof ByteLengthQueuingStrategy2;
      }
      const countSizeFunction = () => {
        return 1;
      };
      try {
        Object.defineProperty(countSizeFunction, "name", {
          value: "size",
          configurable: true
        });
      } catch (_a) {
      }
      class CountQueuingStrategy2 {
        constructor(options) {
          assertRequiredArgument(options, 1, "CountQueuingStrategy");
          options = convertQueuingStrategyInit(options, "First parameter");
          this._countQueuingStrategyHighWaterMark = options.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
          if (!IsCountQueuingStrategy(this)) {
            throw countBrandCheckException("highWaterMark");
          }
          return this._countQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by always returning 1.
         * This ensures that the total queue size is a count of the number of chunks in the queue.
         */
        get size() {
          if (!IsCountQueuingStrategy(this)) {
            throw countBrandCheckException("size");
          }
          return countSizeFunction;
        }
      }
      Object.defineProperties(CountQueuingStrategy2.prototype, {
        highWaterMark: { enumerable: true },
        size: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(CountQueuingStrategy2.prototype, SymbolPolyfill.toStringTag, {
          value: "CountQueuingStrategy",
          configurable: true
        });
      }
      function countBrandCheckException(name) {
        return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
      }
      function IsCountQueuingStrategy(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_countQueuingStrategyHighWaterMark")) {
          return false;
        }
        return x3 instanceof CountQueuingStrategy2;
      }
      function convertTransformer(original, context) {
        assertDictionary(original, context);
        const flush = original === null || original === void 0 ? void 0 : original.flush;
        const readableType = original === null || original === void 0 ? void 0 : original.readableType;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const transform = original === null || original === void 0 ? void 0 : original.transform;
        const writableType = original === null || original === void 0 ? void 0 : original.writableType;
        return {
          flush: flush === void 0 ? void 0 : convertTransformerFlushCallback(flush, original, `${context} has member 'flush' that`),
          readableType,
          start: start === void 0 ? void 0 : convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
          transform: transform === void 0 ? void 0 : convertTransformerTransformCallback(transform, original, `${context} has member 'transform' that`),
          writableType
        };
      }
      function convertTransformerFlushCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => promiseCall(fn, original, [controller]);
      }
      function convertTransformerStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
      }
      function convertTransformerTransformCallback(fn, original, context) {
        assertFunction(fn, context);
        return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
      }
      class TransformStream2 {
        constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
          if (rawTransformer === void 0) {
            rawTransformer = null;
          }
          const writableStrategy = convertQueuingStrategy(rawWritableStrategy, "Second parameter");
          const readableStrategy = convertQueuingStrategy(rawReadableStrategy, "Third parameter");
          const transformer = convertTransformer(rawTransformer, "First parameter");
          if (transformer.readableType !== void 0) {
            throw new RangeError("Invalid readableType specified");
          }
          if (transformer.writableType !== void 0) {
            throw new RangeError("Invalid writableType specified");
          }
          const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
          const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
          const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
          const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
          let startPromise_resolve;
          const startPromise = newPromise((resolve2) => {
            startPromise_resolve = resolve2;
          });
          InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
          SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
          if (transformer.start !== void 0) {
            startPromise_resolve(transformer.start(this._transformStreamController));
          } else {
            startPromise_resolve(void 0);
          }
        }
        /**
         * The readable side of the transform stream.
         */
        get readable() {
          if (!IsTransformStream(this)) {
            throw streamBrandCheckException("readable");
          }
          return this._readable;
        }
        /**
         * The writable side of the transform stream.
         */
        get writable() {
          if (!IsTransformStream(this)) {
            throw streamBrandCheckException("writable");
          }
          return this._writable;
        }
      }
      Object.defineProperties(TransformStream2.prototype, {
        readable: { enumerable: true },
        writable: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(TransformStream2.prototype, SymbolPolyfill.toStringTag, {
          value: "TransformStream",
          configurable: true
        });
      }
      function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
        function startAlgorithm() {
          return startPromise;
        }
        function writeAlgorithm(chunk) {
          return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
        }
        function abortAlgorithm(reason) {
          return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
        }
        function closeAlgorithm() {
          return TransformStreamDefaultSinkCloseAlgorithm(stream);
        }
        stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
        function pullAlgorithm() {
          return TransformStreamDefaultSourcePullAlgorithm(stream);
        }
        function cancelAlgorithm(reason) {
          TransformStreamErrorWritableAndUnblockWrite(stream, reason);
          return promiseResolvedWith(void 0);
        }
        stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
        stream._backpressure = void 0;
        stream._backpressureChangePromise = void 0;
        stream._backpressureChangePromise_resolve = void 0;
        TransformStreamSetBackpressure(stream, true);
        stream._transformStreamController = void 0;
      }
      function IsTransformStream(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_transformStreamController")) {
          return false;
        }
        return x3 instanceof TransformStream2;
      }
      function TransformStreamError(stream, e3) {
        ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e3);
        TransformStreamErrorWritableAndUnblockWrite(stream, e3);
      }
      function TransformStreamErrorWritableAndUnblockWrite(stream, e3) {
        TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
        WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e3);
        if (stream._backpressure) {
          TransformStreamSetBackpressure(stream, false);
        }
      }
      function TransformStreamSetBackpressure(stream, backpressure) {
        if (stream._backpressureChangePromise !== void 0) {
          stream._backpressureChangePromise_resolve();
        }
        stream._backpressureChangePromise = newPromise((resolve2) => {
          stream._backpressureChangePromise_resolve = resolve2;
        });
        stream._backpressure = backpressure;
      }
      class TransformStreamDefaultController2 {
        constructor() {
          throw new TypeError("Illegal constructor");
        }
        /**
         * Returns the desired size to fill the readable side’s internal queue. It can be negative, if the queue is over-full.
         */
        get desiredSize() {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("desiredSize");
          }
          const readableController = this._controlledTransformStream._readable._readableStreamController;
          return ReadableStreamDefaultControllerGetDesiredSize(readableController);
        }
        enqueue(chunk = void 0) {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("enqueue");
          }
          TransformStreamDefaultControllerEnqueue(this, chunk);
        }
        /**
         * Errors both the readable side and the writable side of the controlled transform stream, making all future
         * interactions with it fail with the given error `e`. Any chunks queued for transformation will be discarded.
         */
        error(reason = void 0) {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("error");
          }
          TransformStreamDefaultControllerError(this, reason);
        }
        /**
         * Closes the readable side and errors the writable side of the controlled transform stream. This is useful when the
         * transformer only needs to consume a portion of the chunks written to the writable side.
         */
        terminate() {
          if (!IsTransformStreamDefaultController(this)) {
            throw defaultControllerBrandCheckException("terminate");
          }
          TransformStreamDefaultControllerTerminate(this);
        }
      }
      Object.defineProperties(TransformStreamDefaultController2.prototype, {
        enqueue: { enumerable: true },
        error: { enumerable: true },
        terminate: { enumerable: true },
        desiredSize: { enumerable: true }
      });
      if (typeof SymbolPolyfill.toStringTag === "symbol") {
        Object.defineProperty(TransformStreamDefaultController2.prototype, SymbolPolyfill.toStringTag, {
          value: "TransformStreamDefaultController",
          configurable: true
        });
      }
      function IsTransformStreamDefaultController(x3) {
        if (!typeIsObject(x3)) {
          return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x3, "_controlledTransformStream")) {
          return false;
        }
        return x3 instanceof TransformStreamDefaultController2;
      }
      function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
        controller._controlledTransformStream = stream;
        stream._transformStreamController = controller;
        controller._transformAlgorithm = transformAlgorithm;
        controller._flushAlgorithm = flushAlgorithm;
      }
      function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
        const controller = Object.create(TransformStreamDefaultController2.prototype);
        let transformAlgorithm = (chunk) => {
          try {
            TransformStreamDefaultControllerEnqueue(controller, chunk);
            return promiseResolvedWith(void 0);
          } catch (transformResultE) {
            return promiseRejectedWith(transformResultE);
          }
        };
        let flushAlgorithm = () => promiseResolvedWith(void 0);
        if (transformer.transform !== void 0) {
          transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
        }
        if (transformer.flush !== void 0) {
          flushAlgorithm = () => transformer.flush(controller);
        }
        SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
      }
      function TransformStreamDefaultControllerClearAlgorithms(controller) {
        controller._transformAlgorithm = void 0;
        controller._flushAlgorithm = void 0;
      }
      function TransformStreamDefaultControllerEnqueue(controller, chunk) {
        const stream = controller._controlledTransformStream;
        const readableController = stream._readable._readableStreamController;
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
          throw new TypeError("Readable side is not in a state that permits enqueue");
        }
        try {
          ReadableStreamDefaultControllerEnqueue(readableController, chunk);
        } catch (e3) {
          TransformStreamErrorWritableAndUnblockWrite(stream, e3);
          throw stream._readable._storedError;
        }
        const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
        if (backpressure !== stream._backpressure) {
          TransformStreamSetBackpressure(stream, true);
        }
      }
      function TransformStreamDefaultControllerError(controller, e3) {
        TransformStreamError(controller._controlledTransformStream, e3);
      }
      function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
        const transformPromise = controller._transformAlgorithm(chunk);
        return transformPromiseWith(transformPromise, void 0, (r3) => {
          TransformStreamError(controller._controlledTransformStream, r3);
          throw r3;
        });
      }
      function TransformStreamDefaultControllerTerminate(controller) {
        const stream = controller._controlledTransformStream;
        const readableController = stream._readable._readableStreamController;
        ReadableStreamDefaultControllerClose(readableController);
        const error = new TypeError("TransformStream terminated");
        TransformStreamErrorWritableAndUnblockWrite(stream, error);
      }
      function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
        const controller = stream._transformStreamController;
        if (stream._backpressure) {
          const backpressureChangePromise = stream._backpressureChangePromise;
          return transformPromiseWith(backpressureChangePromise, () => {
            const writable = stream._writable;
            const state = writable._state;
            if (state === "erroring") {
              throw writable._storedError;
            }
            return TransformStreamDefaultControllerPerformTransform(controller, chunk);
          });
        }
        return TransformStreamDefaultControllerPerformTransform(controller, chunk);
      }
      function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
        TransformStreamError(stream, reason);
        return promiseResolvedWith(void 0);
      }
      function TransformStreamDefaultSinkCloseAlgorithm(stream) {
        const readable = stream._readable;
        const controller = stream._transformStreamController;
        const flushPromise = controller._flushAlgorithm();
        TransformStreamDefaultControllerClearAlgorithms(controller);
        return transformPromiseWith(flushPromise, () => {
          if (readable._state === "errored") {
            throw readable._storedError;
          }
          ReadableStreamDefaultControllerClose(readable._readableStreamController);
        }, (r3) => {
          TransformStreamError(stream, r3);
          throw readable._storedError;
        });
      }
      function TransformStreamDefaultSourcePullAlgorithm(stream) {
        TransformStreamSetBackpressure(stream, false);
        return stream._backpressureChangePromise;
      }
      function defaultControllerBrandCheckException(name) {
        return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
      }
      function streamBrandCheckException(name) {
        return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
      }
      exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy2;
      exports2.CountQueuingStrategy = CountQueuingStrategy2;
      exports2.ReadableByteStreamController = ReadableByteStreamController2;
      exports2.ReadableStream = ReadableStream3;
      exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader2;
      exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest2;
      exports2.ReadableStreamDefaultController = ReadableStreamDefaultController2;
      exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader2;
      exports2.TransformStream = TransformStream2;
      exports2.TransformStreamDefaultController = TransformStreamDefaultController2;
      exports2.WritableStream = WritableStream2;
      exports2.WritableStreamDefaultController = WritableStreamDefaultController2;
      exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter2;
      Object.defineProperty(exports2, "__esModule", { value: true });
    });
  }
});

// ../../../node_modules/.pnpm/fetch-blob@3.2.0/node_modules/fetch-blob/streams.cjs
var require_streams = __commonJS({
  "../../../node_modules/.pnpm/fetch-blob@3.2.0/node_modules/fetch-blob/streams.cjs"() {
    "use strict";
    var POOL_SIZE2 = 65536;
    if (!globalThis.ReadableStream) {
      try {
        const process2 = require("process");
        const { emitWarning } = process2;
        try {
          process2.emitWarning = () => {
          };
          Object.assign(globalThis, require("stream/web"));
          process2.emitWarning = emitWarning;
        } catch (error) {
          process2.emitWarning = emitWarning;
          throw error;
        }
      } catch (error) {
        Object.assign(globalThis, require_ponyfill_es2018());
      }
    }
    try {
      const { Blob: Blob4 } = require("buffer");
      if (Blob4 && !Blob4.prototype.stream) {
        Blob4.prototype.stream = function name(params) {
          let position = 0;
          const blob = this;
          return new ReadableStream({
            type: "bytes",
            async pull(ctrl) {
              const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE2));
              const buffer = await chunk.arrayBuffer();
              position += buffer.byteLength;
              ctrl.enqueue(new Uint8Array(buffer));
              if (position === blob.size) {
                ctrl.close();
              }
            }
          });
        };
      }
    } catch (error) {
    }
  }
});

// ../../../node_modules/.pnpm/fetch-blob@3.2.0/node_modules/fetch-blob/index.js
async function* toIterator(parts, clone2 = true) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* (
        /** @type {AsyncIterableIterator<Uint8Array>} */
        part.stream()
      );
    } else if (ArrayBuffer.isView(part)) {
      if (clone2) {
        let position = part.byteOffset;
        const end = part.byteOffset + part.byteLength;
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE);
          const chunk = part.buffer.slice(position, position + size);
          position += chunk.byteLength;
          yield new Uint8Array(chunk);
        }
      } else {
        yield part;
      }
    } else {
      let position = 0, b2 = (
        /** @type {Blob} */
        part
      );
      while (position !== b2.size) {
        const chunk = b2.slice(position, Math.min(b2.size, position + POOL_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
      }
    }
  }
}
var import_streams, POOL_SIZE, _Blob, Blob2, fetch_blob_default;
var init_fetch_blob = __esm({
  "../../../node_modules/.pnpm/fetch-blob@3.2.0/node_modules/fetch-blob/index.js"() {
    "use strict";
    import_streams = __toESM(require_streams(), 1);
    POOL_SIZE = 65536;
    _Blob = class Blob {
      /** @type {Array.<(Blob|Uint8Array)>} */
      #parts = [];
      #type = "";
      #size = 0;
      #endings = "transparent";
      /**
       * The Blob() constructor returns a new Blob object. The content
       * of the blob consists of the concatenation of the values given
       * in the parameter array.
       *
       * @param {*} blobParts
       * @param {{ type?: string, endings?: string }} [options]
       */
      constructor(blobParts = [], options = {}) {
        if (typeof blobParts !== "object" || blobParts === null) {
          throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        }
        if (typeof blobParts[Symbol.iterator] !== "function") {
          throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        }
        if (typeof options !== "object" && typeof options !== "function") {
          throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        }
        if (options === null)
          options = {};
        const encoder = new TextEncoder();
        for (const element of blobParts) {
          let part;
          if (ArrayBuffer.isView(element)) {
            part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
          } else if (element instanceof ArrayBuffer) {
            part = new Uint8Array(element.slice(0));
          } else if (element instanceof Blob) {
            part = element;
          } else {
            part = encoder.encode(`${element}`);
          }
          this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
          this.#parts.push(part);
        }
        this.#endings = `${options.endings === void 0 ? "transparent" : options.endings}`;
        const type = options.type === void 0 ? "" : String(options.type);
        this.#type = /^[\x20-\x7E]*$/.test(type) ? type : "";
      }
      /**
       * The Blob interface's size property returns the
       * size of the Blob in bytes.
       */
      get size() {
        return this.#size;
      }
      /**
       * The type property of a Blob object returns the MIME type of the file.
       */
      get type() {
        return this.#type;
      }
      /**
       * The text() method in the Blob interface returns a Promise
       * that resolves with a string containing the contents of
       * the blob, interpreted as UTF-8.
       *
       * @return {Promise<string>}
       */
      async text() {
        const decoder = new TextDecoder();
        let str = "";
        for await (const part of toIterator(this.#parts, false)) {
          str += decoder.decode(part, { stream: true });
        }
        str += decoder.decode();
        return str;
      }
      /**
       * The arrayBuffer() method in the Blob interface returns a
       * Promise that resolves with the contents of the blob as
       * binary data contained in an ArrayBuffer.
       *
       * @return {Promise<ArrayBuffer>}
       */
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of toIterator(this.#parts, false)) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        const it2 = toIterator(this.#parts, true);
        return new globalThis.ReadableStream({
          // @ts-ignore
          type: "bytes",
          async pull(ctrl) {
            const chunk = await it2.next();
            chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
          },
          async cancel() {
            await it2.return();
          }
        });
      }
      /**
       * The Blob interface's slice() method creates and returns a
       * new Blob object which contains data from a subset of the
       * blob on which it's called.
       *
       * @param {number} [start]
       * @param {number} [end]
       * @param {string} [type]
       */
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = this.#parts;
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          if (added >= span) {
            break;
          }
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            let chunk;
            if (ArrayBuffer.isView(part)) {
              chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.byteLength;
            } else {
              chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.size;
            }
            relativeEnd -= size2;
            blobParts.push(chunk);
            relativeStart = 0;
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        blob.#size = span;
        blob.#parts = blobParts;
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.constructor === "function" && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(_Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Blob2 = _Blob;
    fetch_blob_default = Blob2;
  }
});

// ../../../node_modules/.pnpm/fetch-blob@3.2.0/node_modules/fetch-blob/file.js
var _File, File2, file_default;
var init_file = __esm({
  "../../../node_modules/.pnpm/fetch-blob@3.2.0/node_modules/fetch-blob/file.js"() {
    "use strict";
    init_fetch_blob();
    _File = class File extends fetch_blob_default {
      #lastModified = 0;
      #name = "";
      /**
       * @param {*[]} fileBits
       * @param {string} fileName
       * @param {{lastModified?: number, type?: string}} options
       */
      // @ts-ignore
      constructor(fileBits, fileName, options = {}) {
        if (arguments.length < 2) {
          throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
        }
        super(fileBits, options);
        if (options === null)
          options = {};
        const lastModified = options.lastModified === void 0 ? Date.now() : Number(options.lastModified);
        if (!Number.isNaN(lastModified)) {
          this.#lastModified = lastModified;
        }
        this.#name = String(fileName);
      }
      get name() {
        return this.#name;
      }
      get lastModified() {
        return this.#lastModified;
      }
      get [Symbol.toStringTag]() {
        return "File";
      }
      static [Symbol.hasInstance](object) {
        return !!object && object instanceof fetch_blob_default && /^(File)$/.test(object[Symbol.toStringTag]);
      }
    };
    File2 = _File;
    file_default = File2;
  }
});

// ../../../node_modules/.pnpm/formdata-polyfill@4.0.10/node_modules/formdata-polyfill/esm.min.js
function formDataToBlob(F3, B2 = fetch_blob_default) {
  var b2 = `${r()}${r()}`.replace(/\./g, "").slice(-28).padStart(32, "-"), c2 = [], p2 = `--${b2}\r
Content-Disposition: form-data; name="`;
  F3.forEach((v2, n2) => typeof v2 == "string" ? c2.push(p2 + e(n2) + `"\r
\r
${v2.replace(/\r(?!\n)|(?<!\r)\n/g, "\r\n")}\r
`) : c2.push(p2 + e(n2) + `"; filename="${e(v2.name, 1)}"\r
Content-Type: ${v2.type || "application/octet-stream"}\r
\r
`, v2, "\r\n"));
  c2.push(`--${b2}--`);
  return new B2(c2, { type: "multipart/form-data; boundary=" + b2 });
}
var t, i, h, r, m, f, e, x, FormData;
var init_esm_min = __esm({
  "../../../node_modules/.pnpm/formdata-polyfill@4.0.10/node_modules/formdata-polyfill/esm.min.js"() {
    "use strict";
    init_fetch_blob();
    init_file();
    ({ toStringTag: t, iterator: i, hasInstance: h } = Symbol);
    r = Math.random;
    m = "append,set,get,getAll,delete,keys,values,entries,forEach,constructor".split(",");
    f = (a2, b2, c2) => (a2 += "", /^(Blob|File)$/.test(b2 && b2[t]) ? [(c2 = c2 !== void 0 ? c2 + "" : b2[t] == "File" ? b2.name : "blob", a2), b2.name !== c2 || b2[t] == "blob" ? new file_default([b2], c2, b2) : b2] : [a2, b2 + ""]);
    e = (c2, f4) => (f4 ? c2 : c2.replace(/\r?\n|\r/g, "\r\n")).replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22");
    x = (n2, a2, e3) => {
      if (a2.length < e3) {
        throw new TypeError(`Failed to execute '${n2}' on 'FormData': ${e3} arguments required, but only ${a2.length} present.`);
      }
    };
    FormData = class FormData2 {
      #d = [];
      constructor(...a2) {
        if (a2.length)
          throw new TypeError(`Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.`);
      }
      get [t]() {
        return "FormData";
      }
      [i]() {
        return this.entries();
      }
      static [h](o2) {
        return o2 && typeof o2 === "object" && o2[t] === "FormData" && !m.some((m3) => typeof o2[m3] != "function");
      }
      append(...a2) {
        x("append", arguments, 2);
        this.#d.push(f(...a2));
      }
      delete(a2) {
        x("delete", arguments, 1);
        a2 += "";
        this.#d = this.#d.filter(([b2]) => b2 !== a2);
      }
      get(a2) {
        x("get", arguments, 1);
        a2 += "";
        for (var b2 = this.#d, l2 = b2.length, c2 = 0; c2 < l2; c2++)
          if (b2[c2][0] === a2)
            return b2[c2][1];
        return null;
      }
      getAll(a2, b2) {
        x("getAll", arguments, 1);
        b2 = [];
        a2 += "";
        this.#d.forEach((c2) => c2[0] === a2 && b2.push(c2[1]));
        return b2;
      }
      has(a2) {
        x("has", arguments, 1);
        a2 += "";
        return this.#d.some((b2) => b2[0] === a2);
      }
      forEach(a2, b2) {
        x("forEach", arguments, 1);
        for (var [c2, d2] of this)
          a2.call(b2, d2, c2, this);
      }
      set(...a2) {
        x("set", arguments, 2);
        var b2 = [], c2 = true;
        a2 = f(...a2);
        this.#d.forEach((d2) => {
          d2[0] === a2[0] ? c2 && (c2 = !b2.push(a2)) : b2.push(d2);
        });
        c2 && b2.push(a2);
        this.#d = b2;
      }
      *entries() {
        yield* this.#d;
      }
      *keys() {
        for (var [a2] of this)
          yield a2;
      }
      *values() {
        for (var [, a2] of this)
          yield a2;
      }
    };
  }
});

// ../../../node_modules/.pnpm/node-domexception@1.0.0/node_modules/node-domexception/index.js
var require_node_domexception = __commonJS({
  "../../../node_modules/.pnpm/node-domexception@1.0.0/node_modules/node-domexception/index.js"(exports, module2) {
    "use strict";
    if (!globalThis.DOMException) {
      try {
        const { MessageChannel } = require("worker_threads"), port = new MessageChannel().port1, ab = new ArrayBuffer();
        port.postMessage(ab, [ab, ab]);
      } catch (err) {
        err.constructor.name === "DOMException" && (globalThis.DOMException = err.constructor);
      }
    }
    module2.exports = globalThis.DOMException;
  }
});

// ../../../node_modules/.pnpm/fetch-blob@3.2.0/node_modules/fetch-blob/from.js
var import_node_fs, import_node_path, import_node_domexception, stat, BlobDataItem;
var init_from = __esm({
  "../../../node_modules/.pnpm/fetch-blob@3.2.0/node_modules/fetch-blob/from.js"() {
    "use strict";
    import_node_fs = require("fs");
    import_node_path = require("path");
    import_node_domexception = __toESM(require_node_domexception(), 1);
    init_file();
    init_fetch_blob();
    ({ stat } = import_node_fs.promises);
    BlobDataItem = class _BlobDataItem {
      #path;
      #start;
      constructor(options) {
        this.#path = options.path;
        this.#start = options.start;
        this.size = options.size;
        this.lastModified = options.lastModified;
      }
      /**
       * Slicing arguments is first validated and formatted
       * to not be out of range by Blob.prototype.slice
       */
      slice(start, end) {
        return new _BlobDataItem({
          path: this.#path,
          lastModified: this.lastModified,
          size: end - start,
          start: this.#start + start
        });
      }
      async *stream() {
        const { mtimeMs } = await stat(this.#path);
        if (mtimeMs > this.lastModified) {
          throw new import_node_domexception.default("The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.", "NotReadableError");
        }
        yield* (0, import_node_fs.createReadStream)(this.#path, {
          start: this.#start,
          end: this.#start + this.size - 1
        });
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
    };
  }
});

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/utils/multipart-parser.js
var multipart_parser_exports = {};
__export(multipart_parser_exports, {
  toFormData: () => toFormData
});
function _fileName(headerValue) {
  const m3 = headerValue.match(/\bfilename=("(.*?)"|([^()<>@,;:\\"/[\]?={}\s\t]+))($|;\s)/i);
  if (!m3) {
    return;
  }
  const match = m3[2] || m3[3] || "";
  let filename = match.slice(match.lastIndexOf("\\") + 1);
  filename = filename.replace(/%22/g, '"');
  filename = filename.replace(/&#(\d{4});/g, (m4, code) => {
    return String.fromCharCode(code);
  });
  return filename;
}
async function toFormData(Body2, ct2) {
  if (!/multipart/i.test(ct2)) {
    throw new TypeError("Failed to fetch");
  }
  const m3 = ct2.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!m3) {
    throw new TypeError("no or bad content-type header, no multipart boundary");
  }
  const parser = new MultipartParser(m3[1] || m3[2]);
  let headerField;
  let headerValue;
  let entryValue;
  let entryName;
  let contentType;
  let filename;
  const entryChunks = [];
  const formData = new FormData();
  const onPartData = (ui8a) => {
    entryValue += decoder.decode(ui8a, { stream: true });
  };
  const appendToFile = (ui8a) => {
    entryChunks.push(ui8a);
  };
  const appendFileToFormData = () => {
    const file = new file_default(entryChunks, filename, { type: contentType });
    formData.append(entryName, file);
  };
  const appendEntryToFormData = () => {
    formData.append(entryName, entryValue);
  };
  const decoder = new TextDecoder("utf-8");
  decoder.decode();
  parser.onPartBegin = function() {
    parser.onPartData = onPartData;
    parser.onPartEnd = appendEntryToFormData;
    headerField = "";
    headerValue = "";
    entryValue = "";
    entryName = "";
    contentType = "";
    filename = null;
    entryChunks.length = 0;
  };
  parser.onHeaderField = function(ui8a) {
    headerField += decoder.decode(ui8a, { stream: true });
  };
  parser.onHeaderValue = function(ui8a) {
    headerValue += decoder.decode(ui8a, { stream: true });
  };
  parser.onHeaderEnd = function() {
    headerValue += decoder.decode();
    headerField = headerField.toLowerCase();
    if (headerField === "content-disposition") {
      const m4 = headerValue.match(/\bname=("([^"]*)"|([^()<>@,;:\\"/[\]?={}\s\t]+))/i);
      if (m4) {
        entryName = m4[2] || m4[3] || "";
      }
      filename = _fileName(headerValue);
      if (filename) {
        parser.onPartData = appendToFile;
        parser.onPartEnd = appendFileToFormData;
      }
    } else if (headerField === "content-type") {
      contentType = headerValue;
    }
    headerValue = "";
    headerField = "";
  };
  for await (const chunk of Body2) {
    parser.write(chunk);
  }
  parser.end();
  return formData;
}
var s, S, f2, F, LF, CR, SPACE, HYPHEN, COLON, A, Z, lower, noop, MultipartParser;
var init_multipart_parser = __esm({
  "../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/utils/multipart-parser.js"() {
    "use strict";
    init_from();
    init_esm_min();
    s = 0;
    S = {
      START_BOUNDARY: s++,
      HEADER_FIELD_START: s++,
      HEADER_FIELD: s++,
      HEADER_VALUE_START: s++,
      HEADER_VALUE: s++,
      HEADER_VALUE_ALMOST_DONE: s++,
      HEADERS_ALMOST_DONE: s++,
      PART_DATA_START: s++,
      PART_DATA: s++,
      END: s++
    };
    f2 = 1;
    F = {
      PART_BOUNDARY: f2,
      LAST_BOUNDARY: f2 *= 2
    };
    LF = 10;
    CR = 13;
    SPACE = 32;
    HYPHEN = 45;
    COLON = 58;
    A = 97;
    Z = 122;
    lower = (c2) => c2 | 32;
    noop = () => {
    };
    MultipartParser = class {
      /**
       * @param {string} boundary
       */
      constructor(boundary) {
        this.index = 0;
        this.flags = 0;
        this.onHeaderEnd = noop;
        this.onHeaderField = noop;
        this.onHeadersEnd = noop;
        this.onHeaderValue = noop;
        this.onPartBegin = noop;
        this.onPartData = noop;
        this.onPartEnd = noop;
        this.boundaryChars = {};
        boundary = "\r\n--" + boundary;
        const ui8a = new Uint8Array(boundary.length);
        for (let i3 = 0; i3 < boundary.length; i3++) {
          ui8a[i3] = boundary.charCodeAt(i3);
          this.boundaryChars[ui8a[i3]] = true;
        }
        this.boundary = ui8a;
        this.lookbehind = new Uint8Array(this.boundary.length + 8);
        this.state = S.START_BOUNDARY;
      }
      /**
       * @param {Uint8Array} data
       */
      write(data) {
        let i3 = 0;
        const length_ = data.length;
        let previousIndex = this.index;
        let { lookbehind, boundary, boundaryChars, index, state, flags } = this;
        const boundaryLength = this.boundary.length;
        const boundaryEnd = boundaryLength - 1;
        const bufferLength = data.length;
        let c2;
        let cl;
        const mark = (name) => {
          this[name + "Mark"] = i3;
        };
        const clear = (name) => {
          delete this[name + "Mark"];
        };
        const callback = (callbackSymbol, start, end, ui8a) => {
          if (start === void 0 || start !== end) {
            this[callbackSymbol](ui8a && ui8a.subarray(start, end));
          }
        };
        const dataCallback = (name, clear2) => {
          const markSymbol = name + "Mark";
          if (!(markSymbol in this)) {
            return;
          }
          if (clear2) {
            callback(name, this[markSymbol], i3, data);
            delete this[markSymbol];
          } else {
            callback(name, this[markSymbol], data.length, data);
            this[markSymbol] = 0;
          }
        };
        for (i3 = 0; i3 < length_; i3++) {
          c2 = data[i3];
          switch (state) {
            case S.START_BOUNDARY:
              if (index === boundary.length - 2) {
                if (c2 === HYPHEN) {
                  flags |= F.LAST_BOUNDARY;
                } else if (c2 !== CR) {
                  return;
                }
                index++;
                break;
              } else if (index - 1 === boundary.length - 2) {
                if (flags & F.LAST_BOUNDARY && c2 === HYPHEN) {
                  state = S.END;
                  flags = 0;
                } else if (!(flags & F.LAST_BOUNDARY) && c2 === LF) {
                  index = 0;
                  callback("onPartBegin");
                  state = S.HEADER_FIELD_START;
                } else {
                  return;
                }
                break;
              }
              if (c2 !== boundary[index + 2]) {
                index = -2;
              }
              if (c2 === boundary[index + 2]) {
                index++;
              }
              break;
            case S.HEADER_FIELD_START:
              state = S.HEADER_FIELD;
              mark("onHeaderField");
              index = 0;
            case S.HEADER_FIELD:
              if (c2 === CR) {
                clear("onHeaderField");
                state = S.HEADERS_ALMOST_DONE;
                break;
              }
              index++;
              if (c2 === HYPHEN) {
                break;
              }
              if (c2 === COLON) {
                if (index === 1) {
                  return;
                }
                dataCallback("onHeaderField", true);
                state = S.HEADER_VALUE_START;
                break;
              }
              cl = lower(c2);
              if (cl < A || cl > Z) {
                return;
              }
              break;
            case S.HEADER_VALUE_START:
              if (c2 === SPACE) {
                break;
              }
              mark("onHeaderValue");
              state = S.HEADER_VALUE;
            case S.HEADER_VALUE:
              if (c2 === CR) {
                dataCallback("onHeaderValue", true);
                callback("onHeaderEnd");
                state = S.HEADER_VALUE_ALMOST_DONE;
              }
              break;
            case S.HEADER_VALUE_ALMOST_DONE:
              if (c2 !== LF) {
                return;
              }
              state = S.HEADER_FIELD_START;
              break;
            case S.HEADERS_ALMOST_DONE:
              if (c2 !== LF) {
                return;
              }
              callback("onHeadersEnd");
              state = S.PART_DATA_START;
              break;
            case S.PART_DATA_START:
              state = S.PART_DATA;
              mark("onPartData");
            case S.PART_DATA:
              previousIndex = index;
              if (index === 0) {
                i3 += boundaryEnd;
                while (i3 < bufferLength && !(data[i3] in boundaryChars)) {
                  i3 += boundaryLength;
                }
                i3 -= boundaryEnd;
                c2 = data[i3];
              }
              if (index < boundary.length) {
                if (boundary[index] === c2) {
                  if (index === 0) {
                    dataCallback("onPartData", true);
                  }
                  index++;
                } else {
                  index = 0;
                }
              } else if (index === boundary.length) {
                index++;
                if (c2 === CR) {
                  flags |= F.PART_BOUNDARY;
                } else if (c2 === HYPHEN) {
                  flags |= F.LAST_BOUNDARY;
                } else {
                  index = 0;
                }
              } else if (index - 1 === boundary.length) {
                if (flags & F.PART_BOUNDARY) {
                  index = 0;
                  if (c2 === LF) {
                    flags &= ~F.PART_BOUNDARY;
                    callback("onPartEnd");
                    callback("onPartBegin");
                    state = S.HEADER_FIELD_START;
                    break;
                  }
                } else if (flags & F.LAST_BOUNDARY) {
                  if (c2 === HYPHEN) {
                    callback("onPartEnd");
                    state = S.END;
                    flags = 0;
                  } else {
                    index = 0;
                  }
                } else {
                  index = 0;
                }
              }
              if (index > 0) {
                lookbehind[index - 1] = c2;
              } else if (previousIndex > 0) {
                const _lookbehind = new Uint8Array(lookbehind.buffer, lookbehind.byteOffset, lookbehind.byteLength);
                callback("onPartData", 0, previousIndex, _lookbehind);
                previousIndex = 0;
                mark("onPartData");
                i3--;
              }
              break;
            case S.END:
              break;
            default:
              throw new Error(`Unexpected state entered: ${state}`);
          }
        }
        dataCallback("onHeaderField");
        dataCallback("onHeaderValue");
        dataCallback("onPartData");
        this.index = index;
        this.state = state;
        this.flags = flags;
      }
      end() {
        if (this.state === S.HEADER_FIELD_START && this.index === 0 || this.state === S.PART_DATA && this.index === this.boundary.length) {
          this.onPartEnd();
        } else if (this.state !== S.END) {
          throw new Error("MultipartParser.end(): stream ended unexpectedly");
        }
      }
    };
  }
});

// main.ts
var core = __toESM(require_core());
var fs2 = __toESM(require("fs"));
var path = __toESM(require("path"));

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/index.js
var import_node_http2 = __toESM(require("http"), 1);
var import_node_https = __toESM(require("https"), 1);
var import_node_zlib = __toESM(require("zlib"), 1);
var import_node_stream2 = __toESM(require("stream"), 1);
var import_node_buffer2 = require("buffer");

// ../../../node_modules/.pnpm/data-uri-to-buffer@4.0.0/node_modules/data-uri-to-buffer/dist/index.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i3 = 1; i3 < meta.length; i3++) {
    if (meta[i3] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i3]}`;
      if (meta[i3].indexOf("charset=") === 0) {
        charset = meta[i3].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
var dist_default = dataUriToBuffer;

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/body.js
var import_node_stream = __toESM(require("stream"), 1);
var import_node_util = require("util");
var import_node_buffer = require("buffer");
init_fetch_blob();
init_esm_min();

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/errors/base.js
var FetchBaseError = class extends Error {
  constructor(message, type) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.type = type;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
};

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/errors/fetch-error.js
var FetchError = class extends FetchBaseError {
  /**
   * @param  {string} message -      Error message for human
   * @param  {string} [type] -        Error type for machine
   * @param  {SystemError} [systemError] - For Node.js system error
   */
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
};

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/utils/is.js
var NAME = Symbol.toStringTag;
var isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
var isBlob = (object) => {
  return object && typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
var isAbortSignal = (object) => {
  return typeof object === "object" && (object[NAME] === "AbortSignal" || object[NAME] === "EventTarget");
};
var isDomainOrSubdomain = (destination, original) => {
  const orig = new URL(original).hostname;
  const dest = new URL(destination).hostname;
  return orig === dest || orig.endsWith(`.${dest}`);
};
var isSameProtocol = (destination, original) => {
  const orig = new URL(original).protocol;
  const dest = new URL(destination).protocol;
  return orig === dest;
};

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/body.js
var pipeline = (0, import_node_util.promisify)(import_node_stream.default.pipeline);
var INTERNALS = Symbol("Body internals");
var Body = class {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;
    if (body === null) {
      body = null;
    } else if (isURLSearchParameters(body)) {
      body = import_node_buffer.Buffer.from(body.toString());
    } else if (isBlob(body)) {
    } else if (import_node_buffer.Buffer.isBuffer(body)) {
    } else if (import_node_util.types.isAnyArrayBuffer(body)) {
      body = import_node_buffer.Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      body = import_node_buffer.Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof import_node_stream.default) {
    } else if (body instanceof FormData) {
      body = formDataToBlob(body);
      boundary = body.type.split("=")[1];
    } else {
      body = import_node_buffer.Buffer.from(String(body));
    }
    let stream = body;
    if (import_node_buffer.Buffer.isBuffer(body)) {
      stream = import_node_stream.default.Readable.from(body);
    } else if (isBlob(body)) {
      stream = import_node_stream.default.Readable.from(body.stream());
    }
    this[INTERNALS] = {
      body,
      stream,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;
    if (body instanceof import_node_stream.default) {
      body.on("error", (error_) => {
        const error = error_ instanceof FetchBaseError ? error_ : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, "system", error_);
        this[INTERNALS].error = error;
      });
    }
  }
  get body() {
    return this[INTERNALS].stream;
  }
  get bodyUsed() {
    return this[INTERNALS].disturbed;
  }
  /**
   * Decode response as ArrayBuffer
   *
   * @return  Promise
   */
  async arrayBuffer() {
    const { buffer, byteOffset, byteLength } = await consumeBody(this);
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  async formData() {
    const ct2 = this.headers.get("content-type");
    if (ct2.startsWith("application/x-www-form-urlencoded")) {
      const formData = new FormData();
      const parameters = new URLSearchParams(await this.text());
      for (const [name, value] of parameters) {
        formData.append(name, value);
      }
      return formData;
    }
    const { toFormData: toFormData2 } = await Promise.resolve().then(() => (init_multipart_parser(), multipart_parser_exports));
    return toFormData2(this.body, ct2);
  }
  /**
   * Return raw response as Blob
   *
   * @return Promise
   */
  async blob() {
    const ct2 = this.headers && this.headers.get("content-type") || this[INTERNALS].body && this[INTERNALS].body.type || "";
    const buf = await this.arrayBuffer();
    return new fetch_blob_default([buf], {
      type: ct2
    });
  }
  /**
   * Decode response as json
   *
   * @return  Promise
   */
  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }
  /**
   * Decode response as text
   *
   * @return  Promise
   */
  async text() {
    const buffer = await consumeBody(this);
    return new TextDecoder().decode(buffer);
  }
  /**
   * Decode response as buffer (non-spec api)
   *
   * @return  Promise
   */
  buffer() {
    return consumeBody(this);
  }
};
Body.prototype.buffer = (0, import_node_util.deprecate)(Body.prototype.buffer, "Please use 'response.arrayBuffer()' instead of 'response.buffer()'", "node-fetch#buffer");
Object.defineProperties(Body.prototype, {
  body: { enumerable: true },
  bodyUsed: { enumerable: true },
  arrayBuffer: { enumerable: true },
  blob: { enumerable: true },
  json: { enumerable: true },
  text: { enumerable: true },
  data: { get: (0, import_node_util.deprecate)(
    () => {
    },
    "data doesn't exist, use json(), text(), arrayBuffer(), or body instead",
    "https://github.com/node-fetch/node-fetch/issues/1000 (response)"
  ) }
});
async function consumeBody(data) {
  if (data[INTERNALS].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS].disturbed = true;
  if (data[INTERNALS].error) {
    throw data[INTERNALS].error;
  }
  const { body } = data;
  if (body === null) {
    return import_node_buffer.Buffer.alloc(0);
  }
  if (!(body instanceof import_node_stream.default)) {
    return import_node_buffer.Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(error);
        throw error;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error) {
    const error_ = error instanceof FetchBaseError ? error : new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error.message}`, "system", error);
    throw error_;
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c2) => typeof c2 === "string")) {
        return import_node_buffer.Buffer.from(accum.join(""));
      }
      return import_node_buffer.Buffer.concat(accum, accumBytes);
    } catch (error) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error.message}`, "system", error);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
var clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let { body } = instance[INTERNALS];
  if (instance.bodyUsed) {
    throw new Error("cannot clone body after it is used");
  }
  if (body instanceof import_node_stream.default && typeof body.getBoundary !== "function") {
    p1 = new import_node_stream.PassThrough({ highWaterMark });
    p2 = new import_node_stream.PassThrough({ highWaterMark });
    body.pipe(p1);
    body.pipe(p2);
    instance[INTERNALS].stream = p1;
    body = p2;
  }
  return body;
};
var getNonSpecFormDataBoundary = (0, import_node_util.deprecate)(
  (body) => body.getBoundary(),
  "form-data doesn't follow the spec and requires special treatment. Use alternative package",
  "https://github.com/node-fetch/node-fetch/issues/1167"
);
var extractContentType = (body, request) => {
  if (body === null) {
    return null;
  }
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  if (isURLSearchParameters(body)) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }
  if (isBlob(body)) {
    return body.type || null;
  }
  if (import_node_buffer.Buffer.isBuffer(body) || import_node_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }
  if (body instanceof FormData) {
    return `multipart/form-data; boundary=${request[INTERNALS].boundary}`;
  }
  if (body && typeof body.getBoundary === "function") {
    return `multipart/form-data;boundary=${getNonSpecFormDataBoundary(body)}`;
  }
  if (body instanceof import_node_stream.default) {
    return null;
  }
  return "text/plain;charset=UTF-8";
};
var getTotalBytes = (request) => {
  const { body } = request[INTERNALS];
  if (body === null) {
    return 0;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (import_node_buffer.Buffer.isBuffer(body)) {
    return body.length;
  }
  if (body && typeof body.getLengthSync === "function") {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  }
  return null;
};
var writeToStream = async (dest, { body }) => {
  if (body === null) {
    dest.end();
  } else {
    await pipeline(body, dest);
  }
};

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/headers.js
var import_node_util2 = require("util");
var import_node_http = __toESM(require("http"), 1);
var validateHeaderName = typeof import_node_http.default.validateHeaderName === "function" ? import_node_http.default.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const error = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(error, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
    throw error;
  }
};
var validateHeaderValue = typeof import_node_http.default.validateHeaderValue === "function" ? import_node_http.default.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const error = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(error, "code", { value: "ERR_INVALID_CHAR" });
    throw error;
  }
};
var Headers = class _Headers extends URLSearchParams {
  /**
   * Headers class
   *
   * @constructor
   * @param {HeadersInit} [init] - Response headers
   */
  constructor(init) {
    let result = [];
    if (init instanceof _Headers) {
      const raw = init.raw();
      for (const [name, values] of Object.entries(raw)) {
        result.push(...values.map((value) => [name, value]));
      }
    } else if (init == null) {
    } else if (typeof init === "object" && !import_node_util2.types.isBoxedPrimitive(init)) {
      const method = init[Symbol.iterator];
      if (method == null) {
        result.push(...Object.entries(init));
      } else {
        if (typeof method !== "function") {
          throw new TypeError("Header pairs must be iterable");
        }
        result = [...init].map((pair) => {
          if (typeof pair !== "object" || import_node_util2.types.isBoxedPrimitive(pair)) {
            throw new TypeError("Each header pair must be an iterable object");
          }
          return [...pair];
        }).map((pair) => {
          if (pair.length !== 2) {
            throw new TypeError("Each header pair must be a name/value tuple");
          }
          return [...pair];
        });
      }
    } else {
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    }
    result = result.length > 0 ? result.map(([name, value]) => {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return [String(name).toLowerCase(), String(value)];
    }) : void 0;
    super(result);
    return new Proxy(this, {
      get(target, p2, receiver) {
        switch (p2) {
          case "append":
          case "set":
            return (name, value) => {
              validateHeaderName(name);
              validateHeaderValue(name, String(value));
              return URLSearchParams.prototype[p2].call(
                target,
                String(name).toLowerCase(),
                String(value)
              );
            };
          case "delete":
          case "has":
          case "getAll":
            return (name) => {
              validateHeaderName(name);
              return URLSearchParams.prototype[p2].call(
                target,
                String(name).toLowerCase()
              );
            };
          case "keys":
            return () => {
              target.sort();
              return new Set(URLSearchParams.prototype.keys.call(target)).keys();
            };
          default:
            return Reflect.get(target, p2, receiver);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(name) {
    const values = this.getAll(name);
    if (values.length === 0) {
      return null;
    }
    let value = values.join(", ");
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase();
    }
    return value;
  }
  forEach(callback, thisArg = void 0) {
    for (const name of this.keys()) {
      Reflect.apply(callback, thisArg, [this.get(name), name, this]);
    }
  }
  *values() {
    for (const name of this.keys()) {
      yield this.get(name);
    }
  }
  /**
   * @type {() => IterableIterator<[string, string]>}
   */
  *entries() {
    for (const name of this.keys()) {
      yield [name, this.get(name)];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  /**
   * Node-fetch non-spec method
   * returning all headers and their values as array
   * @returns {Record<string, string[]>}
   */
  raw() {
    return [...this.keys()].reduce((result, key) => {
      result[key] = this.getAll(key);
      return result;
    }, {});
  }
  /**
   * For better console.log(headers) and also to convert Headers into Node.js Request compatible format
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((result, key) => {
      const values = this.getAll(key);
      if (key === "host") {
        result[key] = values[0];
      } else {
        result[key] = values.length > 1 ? values : values[0];
      }
      return result;
    }, {});
  }
};
Object.defineProperties(
  Headers.prototype,
  ["get", "entries", "forEach", "values"].reduce((result, property) => {
    result[property] = { enumerable: true };
    return result;
  }, {})
);
function fromRawHeaders(headers = []) {
  return new Headers(
    headers.reduce((result, value, index, array) => {
      if (index % 2 === 0) {
        result.push(array.slice(index, index + 2));
      }
      return result;
    }, []).filter(([name, value]) => {
      try {
        validateHeaderName(name);
        validateHeaderValue(name, String(value));
        return true;
      } catch {
        return false;
      }
    })
  );
}

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/utils/is-redirect.js
var redirectStatus = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
var isRedirect = (code) => {
  return redirectStatus.has(code);
};

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/response.js
var INTERNALS2 = Symbol("Response internals");
var Response = class _Response extends Body {
  constructor(body = null, options = {}) {
    super(body, options);
    const status = options.status != null ? options.status : 200;
    const headers = new Headers(options.headers);
    if (body !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(body, this);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    this[INTERNALS2] = {
      type: "default",
      url: options.url,
      status,
      statusText: options.statusText || "",
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark
    };
  }
  get type() {
    return this[INTERNALS2].type;
  }
  get url() {
    return this[INTERNALS2].url || "";
  }
  get status() {
    return this[INTERNALS2].status;
  }
  /**
   * Convenience property representing if the request ended normally
   */
  get ok() {
    return this[INTERNALS2].status >= 200 && this[INTERNALS2].status < 300;
  }
  get redirected() {
    return this[INTERNALS2].counter > 0;
  }
  get statusText() {
    return this[INTERNALS2].statusText;
  }
  get headers() {
    return this[INTERNALS2].headers;
  }
  get highWaterMark() {
    return this[INTERNALS2].highWaterMark;
  }
  /**
   * Clone this response
   *
   * @return  Response
   */
  clone() {
    return new _Response(clone(this, this.highWaterMark), {
      type: this.type,
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size,
      highWaterMark: this.highWaterMark
    });
  }
  /**
   * @param {string} url    The URL that the new response is to originate from.
   * @param {number} status An optional status code for the response (e.g., 302.)
   * @returns {Response}    A Response object.
   */
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }
    return new _Response(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }
  static error() {
    const response = new _Response(null, { status: 0, statusText: "" });
    response[INTERNALS2].type = "error";
    return response;
  }
  static json(data = void 0, init = {}) {
    const body = JSON.stringify(data);
    if (body === void 0) {
      throw new TypeError("data is not JSON serializable");
    }
    const headers = new Headers(init && init.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return new _Response(body, {
      ...init,
      headers
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
};
Object.defineProperties(Response.prototype, {
  type: { enumerable: true },
  url: { enumerable: true },
  status: { enumerable: true },
  ok: { enumerable: true },
  redirected: { enumerable: true },
  statusText: { enumerable: true },
  headers: { enumerable: true },
  clone: { enumerable: true }
});

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/request.js
var import_node_url = require("url");
var import_node_util3 = require("util");

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/utils/get-search.js
var getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash.length] === "?" ? "?" : "";
};

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/utils/referrer.js
var import_node_net = require("net");
function stripURLForUseAsAReferrer(url, originOnly = false) {
  if (url == null) {
    return "no-referrer";
  }
  url = new URL(url);
  if (/^(about|blob|data):$/.test(url.protocol)) {
    return "no-referrer";
  }
  url.username = "";
  url.password = "";
  url.hash = "";
  if (originOnly) {
    url.pathname = "";
    url.search = "";
  }
  return url;
}
var ReferrerPolicy = /* @__PURE__ */ new Set([
  "",
  "no-referrer",
  "no-referrer-when-downgrade",
  "same-origin",
  "origin",
  "strict-origin",
  "origin-when-cross-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url"
]);
var DEFAULT_REFERRER_POLICY = "strict-origin-when-cross-origin";
function validateReferrerPolicy(referrerPolicy) {
  if (!ReferrerPolicy.has(referrerPolicy)) {
    throw new TypeError(`Invalid referrerPolicy: ${referrerPolicy}`);
  }
  return referrerPolicy;
}
function isOriginPotentiallyTrustworthy(url) {
  if (/^(http|ws)s:$/.test(url.protocol)) {
    return true;
  }
  const hostIp = url.host.replace(/(^\[)|(]$)/g, "");
  const hostIPVersion = (0, import_node_net.isIP)(hostIp);
  if (hostIPVersion === 4 && /^127\./.test(hostIp)) {
    return true;
  }
  if (hostIPVersion === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(hostIp)) {
    return true;
  }
  if (url.host === "localhost" || url.host.endsWith(".localhost")) {
    return false;
  }
  if (url.protocol === "file:") {
    return true;
  }
  return false;
}
function isUrlPotentiallyTrustworthy(url) {
  if (/^about:(blank|srcdoc)$/.test(url)) {
    return true;
  }
  if (url.protocol === "data:") {
    return true;
  }
  if (/^(blob|filesystem):$/.test(url.protocol)) {
    return true;
  }
  return isOriginPotentiallyTrustworthy(url);
}
function determineRequestsReferrer(request, { referrerURLCallback, referrerOriginCallback } = {}) {
  if (request.referrer === "no-referrer" || request.referrerPolicy === "") {
    return null;
  }
  const policy = request.referrerPolicy;
  if (request.referrer === "about:client") {
    return "no-referrer";
  }
  const referrerSource = request.referrer;
  let referrerURL = stripURLForUseAsAReferrer(referrerSource);
  let referrerOrigin = stripURLForUseAsAReferrer(referrerSource, true);
  if (referrerURL.toString().length > 4096) {
    referrerURL = referrerOrigin;
  }
  if (referrerURLCallback) {
    referrerURL = referrerURLCallback(referrerURL);
  }
  if (referrerOriginCallback) {
    referrerOrigin = referrerOriginCallback(referrerOrigin);
  }
  const currentURL = new URL(request.url);
  switch (policy) {
    case "no-referrer":
      return "no-referrer";
    case "origin":
      return referrerOrigin;
    case "unsafe-url":
      return referrerURL;
    case "strict-origin":
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return "no-referrer";
      }
      return referrerOrigin.toString();
    case "strict-origin-when-cross-origin":
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL;
      }
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return "no-referrer";
      }
      return referrerOrigin;
    case "same-origin":
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL;
      }
      return "no-referrer";
    case "origin-when-cross-origin":
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL;
      }
      return referrerOrigin;
    case "no-referrer-when-downgrade":
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return "no-referrer";
      }
      return referrerURL;
    default:
      throw new TypeError(`Invalid referrerPolicy: ${policy}`);
  }
}
function parseReferrerPolicyFromHeader(headers) {
  const policyTokens = (headers.get("referrer-policy") || "").split(/[,\s]+/);
  let policy = "";
  for (const token of policyTokens) {
    if (token && ReferrerPolicy.has(token)) {
      policy = token;
    }
  }
  return policy;
}

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/request.js
var INTERNALS3 = Symbol("Request internals");
var isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS3] === "object";
};
var doBadDataWarn = (0, import_node_util3.deprecate)(
  () => {
  },
  ".data is not a valid RequestInit property, use .body instead",
  "https://github.com/node-fetch/node-fetch/issues/1000 (request)"
);
var Request = class _Request extends Body {
  constructor(input, init = {}) {
    let parsedURL;
    if (isRequest(input)) {
      parsedURL = new URL(input.url);
    } else {
      parsedURL = new URL(input);
      input = {};
    }
    if (parsedURL.username !== "" || parsedURL.password !== "") {
      throw new TypeError(`${parsedURL} is an url with embedded credentials.`);
    }
    let method = init.method || input.method || "GET";
    if (/^(delete|get|head|options|post|put)$/i.test(method)) {
      method = method.toUpperCase();
    }
    if (!isRequest(init) && "data" in init) {
      doBadDataWarn();
    }
    if ((init.body != null || isRequest(input) && input.body !== null) && (method === "GET" || method === "HEAD")) {
      throw new TypeError("Request with GET/HEAD method cannot have body");
    }
    const inputBody = init.body ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;
    super(inputBody, {
      size: init.size || input.size || 0
    });
    const headers = new Headers(init.headers || input.headers || {});
    if (inputBody !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(inputBody, this);
      if (contentType) {
        headers.set("Content-Type", contentType);
      }
    }
    let signal = isRequest(input) ? input.signal : null;
    if ("signal" in init) {
      signal = init.signal;
    }
    if (signal != null && !isAbortSignal(signal)) {
      throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
    }
    let referrer = init.referrer == null ? input.referrer : init.referrer;
    if (referrer === "") {
      referrer = "no-referrer";
    } else if (referrer) {
      const parsedReferrer = new URL(referrer);
      referrer = /^about:(\/\/)?client$/.test(parsedReferrer) ? "client" : parsedReferrer;
    } else {
      referrer = void 0;
    }
    this[INTERNALS3] = {
      method,
      redirect: init.redirect || input.redirect || "follow",
      headers,
      parsedURL,
      signal,
      referrer
    };
    this.follow = init.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init.follow;
    this.compress = init.compress === void 0 ? input.compress === void 0 ? true : input.compress : init.compress;
    this.counter = init.counter || input.counter || 0;
    this.agent = init.agent || input.agent;
    this.highWaterMark = init.highWaterMark || input.highWaterMark || 16384;
    this.insecureHTTPParser = init.insecureHTTPParser || input.insecureHTTPParser || false;
    this.referrerPolicy = init.referrerPolicy || input.referrerPolicy || "";
  }
  /** @returns {string} */
  get method() {
    return this[INTERNALS3].method;
  }
  /** @returns {string} */
  get url() {
    return (0, import_node_url.format)(this[INTERNALS3].parsedURL);
  }
  /** @returns {Headers} */
  get headers() {
    return this[INTERNALS3].headers;
  }
  get redirect() {
    return this[INTERNALS3].redirect;
  }
  /** @returns {AbortSignal} */
  get signal() {
    return this[INTERNALS3].signal;
  }
  // https://fetch.spec.whatwg.org/#dom-request-referrer
  get referrer() {
    if (this[INTERNALS3].referrer === "no-referrer") {
      return "";
    }
    if (this[INTERNALS3].referrer === "client") {
      return "about:client";
    }
    if (this[INTERNALS3].referrer) {
      return this[INTERNALS3].referrer.toString();
    }
    return void 0;
  }
  get referrerPolicy() {
    return this[INTERNALS3].referrerPolicy;
  }
  set referrerPolicy(referrerPolicy) {
    this[INTERNALS3].referrerPolicy = validateReferrerPolicy(referrerPolicy);
  }
  /**
   * Clone this request
   *
   * @return  Request
   */
  clone() {
    return new _Request(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
};
Object.defineProperties(Request.prototype, {
  method: { enumerable: true },
  url: { enumerable: true },
  headers: { enumerable: true },
  redirect: { enumerable: true },
  clone: { enumerable: true },
  signal: { enumerable: true },
  referrer: { enumerable: true },
  referrerPolicy: { enumerable: true }
});
var getNodeRequestOptions = (request) => {
  const { parsedURL } = request[INTERNALS3];
  const headers = new Headers(request[INTERNALS3].headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "*/*");
  }
  let contentLengthValue = null;
  if (request.body === null && /^(post|put)$/i.test(request.method)) {
    contentLengthValue = "0";
  }
  if (request.body !== null) {
    const totalBytes = getTotalBytes(request);
    if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
      contentLengthValue = String(totalBytes);
    }
  }
  if (contentLengthValue) {
    headers.set("Content-Length", contentLengthValue);
  }
  if (request.referrerPolicy === "") {
    request.referrerPolicy = DEFAULT_REFERRER_POLICY;
  }
  if (request.referrer && request.referrer !== "no-referrer") {
    request[INTERNALS3].referrer = determineRequestsReferrer(request);
  } else {
    request[INTERNALS3].referrer = "no-referrer";
  }
  if (request[INTERNALS3].referrer instanceof URL) {
    headers.set("Referer", request.referrer);
  }
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "node-fetch");
  }
  if (request.compress && !headers.has("Accept-Encoding")) {
    headers.set("Accept-Encoding", "gzip, deflate, br");
  }
  let { agent } = request;
  if (typeof agent === "function") {
    agent = agent(parsedURL);
  }
  const search = getSearch(parsedURL);
  const options = {
    // Overwrite search to retain trailing ? (issue #776)
    path: parsedURL.pathname + search,
    // The following options are not expressed in the URL
    method: request.method,
    headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: request.insecureHTTPParser,
    agent
  };
  return {
    /** @type {URL} */
    parsedURL,
    options
  };
};

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/errors/abort-error.js
var AbortError = class extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
};

// ../../../node_modules/.pnpm/node-fetch@3.3.2/node_modules/node-fetch/src/index.js
init_esm_min();
init_from();
var supportedSchemas = /* @__PURE__ */ new Set(["data:", "http:", "https:"]);
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const { parsedURL, options } = getNodeRequestOptions(request);
    if (!supportedSchemas.has(parsedURL.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${parsedURL.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (parsedURL.protocol === "data:") {
      const data = dist_default(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (parsedURL.protocol === "https:" ? import_node_https.default : import_node_http2.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error = new AbortError("The operation was aborted.");
      reject(error);
      if (request.body && request.body instanceof import_node_stream2.default.Readable) {
        request.body.destroy(error);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(parsedURL.toString(), options);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (error) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${error.message}`, "system", error));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, (error) => {
      if (response && response.body) {
        response.body.destroy(error);
      }
    });
    if (process.version < "v14") {
      request_.on("socket", (s3) => {
        let endedWithEventsCount;
        s3.prependListener("end", () => {
          endedWithEventsCount = s3._eventsCount;
        });
        s3.prependListener("close", (hadError) => {
          if (response && endedWithEventsCount < s3._eventsCount && !hadError) {
            const error = new Error("Premature close");
            error.code = "ERR_STREAM_PREMATURE_CLOSE";
            response.body.emit("error", error);
          }
        });
      });
    }
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        let locationURL = null;
        try {
          locationURL = location === null ? null : new URL(location, request.url);
        } catch {
          if (request.redirect !== "manual") {
            reject(new FetchError(`uri requested responds with an invalid redirect URL: ${location}`, "invalid-redirect"));
            finalize();
            return;
          }
        }
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: clone(request),
              signal: request.signal,
              size: request.size,
              referrer: request.referrer,
              referrerPolicy: request.referrerPolicy
            };
            if (!isDomainOrSubdomain(request.url, locationURL) || !isSameProtocol(request.url, locationURL)) {
              for (const name of ["authorization", "www-authenticate", "cookie", "cookie2"]) {
                requestOptions.headers.delete(name);
              }
            }
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_node_stream2.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            const responseReferrerPolicy = parseReferrerPolicyFromHeader(headers);
            if (responseReferrerPolicy) {
              requestOptions.referrerPolicy = responseReferrerPolicy;
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      if (signal) {
        response_.once("end", () => {
          signal.removeEventListener("abort", abortAndFinalize);
        });
      }
      let body = (0, import_node_stream2.pipeline)(response_, new import_node_stream2.PassThrough(), (error) => {
        if (error) {
          reject(error);
        }
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_node_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_node_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_node_stream2.pipeline)(body, import_node_zlib.default.createGunzip(zlibOptions), (error) => {
          if (error) {
            reject(error);
          }
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_node_stream2.pipeline)(response_, new import_node_stream2.PassThrough(), (error) => {
          if (error) {
            reject(error);
          }
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_node_stream2.pipeline)(body, import_node_zlib.default.createInflate(), (error) => {
              if (error) {
                reject(error);
              }
            });
          } else {
            body = (0, import_node_stream2.pipeline)(body, import_node_zlib.default.createInflateRaw(), (error) => {
              if (error) {
                reject(error);
              }
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        raw.once("end", () => {
          if (!response) {
            response = new Response(body, responseOptions);
            resolve2(response);
          }
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_node_stream2.pipeline)(body, import_node_zlib.default.createBrotliDecompress(), (error) => {
          if (error) {
            reject(error);
          }
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request).catch(reject);
  });
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = import_node_buffer2.Buffer.from("0\r\n\r\n");
  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on("response", (response) => {
    const { headers } = response;
    isChunkedTransfer = headers["transfer-encoding"] === "chunked" && !headers["content-length"];
  });
  request.on("socket", (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error = new Error("Premature close");
        error.code = "ERR_STREAM_PREMATURE_CLOSE";
        errorCallback(error);
      }
    };
    const onData = (buf) => {
      properLastChunkReceived = import_node_buffer2.Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = import_node_buffer2.Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && import_node_buffer2.Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }
      previousChunk = buf;
    };
    socket.prependListener("close", onSocketClose);
    socket.on("data", onData);
    request.on("close", () => {
      socket.removeListener("close", onSocketClose);
      socket.removeListener("data", onData);
    });
  });
}

// ../../../node_modules/.pnpm/formdata-node@5.0.1/node_modules/formdata-node/lib/isFunction.js
var isFunction = (value) => typeof value === "function";

// ../../../node_modules/.pnpm/web-streams-polyfill@4.0.0-beta.3/node_modules/web-streams-polyfill/dist/ponyfill.mjs
var e2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? Symbol : (e3) => `Symbol(${e3})`;
function t2() {
}
function r2(e3) {
  return "object" == typeof e3 && null !== e3 || "function" == typeof e3;
}
var o = t2;
function n(e3, t3) {
  try {
    Object.defineProperty(e3, "name", { value: t3, configurable: true });
  } catch (e4) {
  }
}
var a = Promise;
var i2 = Promise.prototype.then;
var l = Promise.resolve.bind(a);
var s2 = Promise.reject.bind(a);
function u(e3) {
  return new a(e3);
}
function c(e3) {
  return l(e3);
}
function d(e3) {
  return s2(e3);
}
function f3(e3, t3, r3) {
  return i2.call(e3, t3, r3);
}
function b(e3, t3, r3) {
  f3(f3(e3, t3, r3), void 0, o);
}
function h2(e3, t3) {
  b(e3, t3);
}
function _(e3, t3) {
  b(e3, void 0, t3);
}
function p(e3, t3, r3) {
  return f3(e3, t3, r3);
}
function m2(e3) {
  f3(e3, void 0, o);
}
var y = (e3) => {
  if ("function" == typeof queueMicrotask)
    y = queueMicrotask;
  else {
    const e4 = c(void 0);
    y = (t3) => f3(e4, t3);
  }
  return y(e3);
};
function g(e3, t3, r3) {
  if ("function" != typeof e3)
    throw new TypeError("Argument is not a function");
  return Function.prototype.apply.call(e3, t3, r3);
}
function w(e3, t3, r3) {
  try {
    return c(g(e3, t3, r3));
  } catch (e4) {
    return d(e4);
  }
}
var S2 = class {
  constructor() {
    this._cursor = 0, this._size = 0, this._front = { _elements: [], _next: void 0 }, this._back = this._front, this._cursor = 0, this._size = 0;
  }
  get length() {
    return this._size;
  }
  push(e3) {
    const t3 = this._back;
    let r3 = t3;
    16383 === t3._elements.length && (r3 = { _elements: [], _next: void 0 }), t3._elements.push(e3), r3 !== t3 && (this._back = r3, t3._next = r3), ++this._size;
  }
  shift() {
    const e3 = this._front;
    let t3 = e3;
    const r3 = this._cursor;
    let o2 = r3 + 1;
    const n2 = e3._elements, a2 = n2[r3];
    return 16384 === o2 && (t3 = e3._next, o2 = 0), --this._size, this._cursor = o2, e3 !== t3 && (this._front = t3), n2[r3] = void 0, a2;
  }
  forEach(e3) {
    let t3 = this._cursor, r3 = this._front, o2 = r3._elements;
    for (; !(t3 === o2.length && void 0 === r3._next || t3 === o2.length && (r3 = r3._next, o2 = r3._elements, t3 = 0, 0 === o2.length)); )
      e3(o2[t3]), ++t3;
  }
  peek() {
    const e3 = this._front, t3 = this._cursor;
    return e3._elements[t3];
  }
};
var v = e2("[[AbortSteps]]");
var R = e2("[[ErrorSteps]]");
var T = e2("[[CancelSteps]]");
var q = e2("[[PullSteps]]");
var C = e2("[[ReleaseSteps]]");
function E(e3, t3) {
  e3._ownerReadableStream = t3, t3._reader = e3, "readable" === t3._state ? O(e3) : "closed" === t3._state ? function(e4) {
    O(e4), j(e4);
  }(e3) : B(e3, t3._storedError);
}
function P(e3, t3) {
  return Gt(e3._ownerReadableStream, t3);
}
function W(e3) {
  const t3 = e3._ownerReadableStream;
  "readable" === t3._state ? A2(e3, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")) : function(e4, t4) {
    B(e4, t4);
  }(e3, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness")), t3._readableStreamController[C](), t3._reader = void 0, e3._ownerReadableStream = void 0;
}
function k(e3) {
  return new TypeError("Cannot " + e3 + " a stream using a released reader");
}
function O(e3) {
  e3._closedPromise = u((t3, r3) => {
    e3._closedPromise_resolve = t3, e3._closedPromise_reject = r3;
  });
}
function B(e3, t3) {
  O(e3), A2(e3, t3);
}
function A2(e3, t3) {
  void 0 !== e3._closedPromise_reject && (m2(e3._closedPromise), e3._closedPromise_reject(t3), e3._closedPromise_resolve = void 0, e3._closedPromise_reject = void 0);
}
function j(e3) {
  void 0 !== e3._closedPromise_resolve && (e3._closedPromise_resolve(void 0), e3._closedPromise_resolve = void 0, e3._closedPromise_reject = void 0);
}
var z = Number.isFinite || function(e3) {
  return "number" == typeof e3 && isFinite(e3);
};
var L = Math.trunc || function(e3) {
  return e3 < 0 ? Math.ceil(e3) : Math.floor(e3);
};
function F2(e3, t3) {
  if (void 0 !== e3 && ("object" != typeof (r3 = e3) && "function" != typeof r3))
    throw new TypeError(`${t3} is not an object.`);
  var r3;
}
function I(e3, t3) {
  if ("function" != typeof e3)
    throw new TypeError(`${t3} is not a function.`);
}
function D(e3, t3) {
  if (!function(e4) {
    return "object" == typeof e4 && null !== e4 || "function" == typeof e4;
  }(e3))
    throw new TypeError(`${t3} is not an object.`);
}
function $(e3, t3, r3) {
  if (void 0 === e3)
    throw new TypeError(`Parameter ${t3} is required in '${r3}'.`);
}
function M(e3, t3, r3) {
  if (void 0 === e3)
    throw new TypeError(`${t3} is required in '${r3}'.`);
}
function Y(e3) {
  return Number(e3);
}
function Q(e3) {
  return 0 === e3 ? 0 : e3;
}
function N(e3, t3) {
  const r3 = Number.MAX_SAFE_INTEGER;
  let o2 = Number(e3);
  if (o2 = Q(o2), !z(o2))
    throw new TypeError(`${t3} is not a finite number`);
  if (o2 = function(e4) {
    return Q(L(e4));
  }(o2), o2 < 0 || o2 > r3)
    throw new TypeError(`${t3} is outside the accepted range of 0 to ${r3}, inclusive`);
  return z(o2) && 0 !== o2 ? o2 : 0;
}
function H(e3) {
  if (!r2(e3))
    return false;
  if ("function" != typeof e3.getReader)
    return false;
  try {
    return "boolean" == typeof e3.locked;
  } catch (e4) {
    return false;
  }
}
function x2(e3) {
  if (!r2(e3))
    return false;
  if ("function" != typeof e3.getWriter)
    return false;
  try {
    return "boolean" == typeof e3.locked;
  } catch (e4) {
    return false;
  }
}
function V(e3, t3) {
  if (!Vt(e3))
    throw new TypeError(`${t3} is not a ReadableStream.`);
}
function U(e3, t3) {
  e3._reader._readRequests.push(t3);
}
function G(e3, t3, r3) {
  const o2 = e3._reader._readRequests.shift();
  r3 ? o2._closeSteps() : o2._chunkSteps(t3);
}
function X(e3) {
  return e3._reader._readRequests.length;
}
function J(e3) {
  const t3 = e3._reader;
  return void 0 !== t3 && !!K(t3);
}
var ReadableStreamDefaultReader = class {
  constructor(e3) {
    if ($(e3, 1, "ReadableStreamDefaultReader"), V(e3, "First parameter"), Ut(e3))
      throw new TypeError("This stream has already been locked for exclusive reading by another reader");
    E(this, e3), this._readRequests = new S2();
  }
  get closed() {
    return K(this) ? this._closedPromise : d(ee("closed"));
  }
  cancel(e3) {
    return K(this) ? void 0 === this._ownerReadableStream ? d(k("cancel")) : P(this, e3) : d(ee("cancel"));
  }
  read() {
    if (!K(this))
      return d(ee("read"));
    if (void 0 === this._ownerReadableStream)
      return d(k("read from"));
    let e3, t3;
    const r3 = u((r4, o2) => {
      e3 = r4, t3 = o2;
    });
    return function(e4, t4) {
      const r4 = e4._ownerReadableStream;
      r4._disturbed = true, "closed" === r4._state ? t4._closeSteps() : "errored" === r4._state ? t4._errorSteps(r4._storedError) : r4._readableStreamController[q](t4);
    }(this, { _chunkSteps: (t4) => e3({ value: t4, done: false }), _closeSteps: () => e3({ value: void 0, done: true }), _errorSteps: (e4) => t3(e4) }), r3;
  }
  releaseLock() {
    if (!K(this))
      throw ee("releaseLock");
    void 0 !== this._ownerReadableStream && function(e3) {
      W(e3);
      const t3 = new TypeError("Reader was released");
      Z2(e3, t3);
    }(this);
  }
};
function K(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_readRequests") && e3 instanceof ReadableStreamDefaultReader);
}
function Z2(e3, t3) {
  const r3 = e3._readRequests;
  e3._readRequests = new S2(), r3.forEach((e4) => {
    e4._errorSteps(t3);
  });
}
function ee(e3) {
  return new TypeError(`ReadableStreamDefaultReader.prototype.${e3} can only be used on a ReadableStreamDefaultReader`);
}
Object.defineProperties(ReadableStreamDefaultReader.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), n(ReadableStreamDefaultReader.prototype.cancel, "cancel"), n(ReadableStreamDefaultReader.prototype.read, "read"), n(ReadableStreamDefaultReader.prototype.releaseLock, "releaseLock"), "symbol" == typeof e2.toStringTag && Object.defineProperty(ReadableStreamDefaultReader.prototype, e2.toStringTag, { value: "ReadableStreamDefaultReader", configurable: true });
var te = class {
  constructor(e3, t3) {
    this._ongoingPromise = void 0, this._isFinished = false, this._reader = e3, this._preventCancel = t3;
  }
  next() {
    const e3 = () => this._nextSteps();
    return this._ongoingPromise = this._ongoingPromise ? p(this._ongoingPromise, e3, e3) : e3(), this._ongoingPromise;
  }
  return(e3) {
    const t3 = () => this._returnSteps(e3);
    return this._ongoingPromise ? p(this._ongoingPromise, t3, t3) : t3();
  }
  _nextSteps() {
    if (this._isFinished)
      return Promise.resolve({ value: void 0, done: true });
    const e3 = this._reader;
    return void 0 === e3 ? d(k("iterate")) : f3(e3.read(), (e4) => {
      var t3;
      return this._ongoingPromise = void 0, e4.done && (this._isFinished = true, null === (t3 = this._reader) || void 0 === t3 || t3.releaseLock(), this._reader = void 0), e4;
    }, (e4) => {
      var t3;
      throw this._ongoingPromise = void 0, this._isFinished = true, null === (t3 = this._reader) || void 0 === t3 || t3.releaseLock(), this._reader = void 0, e4;
    });
  }
  _returnSteps(e3) {
    if (this._isFinished)
      return Promise.resolve({ value: e3, done: true });
    this._isFinished = true;
    const t3 = this._reader;
    if (void 0 === t3)
      return d(k("finish iterating"));
    if (this._reader = void 0, !this._preventCancel) {
      const r3 = t3.cancel(e3);
      return t3.releaseLock(), p(r3, () => ({ value: e3, done: true }));
    }
    return t3.releaseLock(), c({ value: e3, done: true });
  }
};
var re = { next() {
  return oe(this) ? this._asyncIteratorImpl.next() : d(ne("next"));
}, return(e3) {
  return oe(this) ? this._asyncIteratorImpl.return(e3) : d(ne("return"));
} };
function oe(e3) {
  if (!r2(e3))
    return false;
  if (!Object.prototype.hasOwnProperty.call(e3, "_asyncIteratorImpl"))
    return false;
  try {
    return e3._asyncIteratorImpl instanceof te;
  } catch (e4) {
    return false;
  }
}
function ne(e3) {
  return new TypeError(`ReadableStreamAsyncIterator.${e3} can only be used on a ReadableSteamAsyncIterator`);
}
"symbol" == typeof e2.asyncIterator && Object.defineProperty(re, e2.asyncIterator, { value() {
  return this;
}, writable: true, configurable: true });
var ae = Number.isNaN || function(e3) {
  return e3 != e3;
};
function ie(e3, t3, r3, o2, n2) {
  new Uint8Array(e3).set(new Uint8Array(r3, o2, n2), t3);
}
function le(e3) {
  const t3 = function(e4, t4, r3) {
    if (e4.slice)
      return e4.slice(t4, r3);
    const o2 = r3 - t4, n2 = new ArrayBuffer(o2);
    return ie(n2, 0, e4, t4, o2), n2;
  }(e3.buffer, e3.byteOffset, e3.byteOffset + e3.byteLength);
  return new Uint8Array(t3);
}
function se(e3) {
  const t3 = e3._queue.shift();
  return e3._queueTotalSize -= t3.size, e3._queueTotalSize < 0 && (e3._queueTotalSize = 0), t3.value;
}
function ue(e3, t3, r3) {
  if ("number" != typeof (o2 = r3) || ae(o2) || o2 < 0 || r3 === 1 / 0)
    throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
  var o2;
  e3._queue.push({ value: t3, size: r3 }), e3._queueTotalSize += r3;
}
function ce(e3) {
  e3._queue = new S2(), e3._queueTotalSize = 0;
}
var ReadableStreamBYOBRequest = class {
  constructor() {
    throw new TypeError("Illegal constructor");
  }
  get view() {
    if (!fe(this))
      throw Be("view");
    return this._view;
  }
  respond(e3) {
    if (!fe(this))
      throw Be("respond");
    if ($(e3, 1, "respond"), e3 = N(e3, "First parameter"), void 0 === this._associatedReadableByteStreamController)
      throw new TypeError("This BYOB request has been invalidated");
    this._view.buffer, function(e4, t3) {
      const r3 = e4._pendingPullIntos.peek();
      if ("closed" === e4._controlledReadableByteStream._state) {
        if (0 !== t3)
          throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
      } else {
        if (0 === t3)
          throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
        if (r3.bytesFilled + t3 > r3.byteLength)
          throw new RangeError("bytesWritten out of range");
      }
      r3.buffer = r3.buffer, qe(e4, t3);
    }(this._associatedReadableByteStreamController, e3);
  }
  respondWithNewView(e3) {
    if (!fe(this))
      throw Be("respondWithNewView");
    if ($(e3, 1, "respondWithNewView"), !ArrayBuffer.isView(e3))
      throw new TypeError("You can only respond with array buffer views");
    if (void 0 === this._associatedReadableByteStreamController)
      throw new TypeError("This BYOB request has been invalidated");
    e3.buffer, function(e4, t3) {
      const r3 = e4._pendingPullIntos.peek();
      if ("closed" === e4._controlledReadableByteStream._state) {
        if (0 !== t3.byteLength)
          throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
      } else if (0 === t3.byteLength)
        throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
      if (r3.byteOffset + r3.bytesFilled !== t3.byteOffset)
        throw new RangeError("The region specified by view does not match byobRequest");
      if (r3.bufferByteLength !== t3.buffer.byteLength)
        throw new RangeError("The buffer of view has different capacity than byobRequest");
      if (r3.bytesFilled + t3.byteLength > r3.byteLength)
        throw new RangeError("The region specified by view is larger than byobRequest");
      const o2 = t3.byteLength;
      r3.buffer = t3.buffer, qe(e4, o2);
    }(this._associatedReadableByteStreamController, e3);
  }
};
Object.defineProperties(ReadableStreamBYOBRequest.prototype, { respond: { enumerable: true }, respondWithNewView: { enumerable: true }, view: { enumerable: true } }), n(ReadableStreamBYOBRequest.prototype.respond, "respond"), n(ReadableStreamBYOBRequest.prototype.respondWithNewView, "respondWithNewView"), "symbol" == typeof e2.toStringTag && Object.defineProperty(ReadableStreamBYOBRequest.prototype, e2.toStringTag, { value: "ReadableStreamBYOBRequest", configurable: true });
var ReadableByteStreamController = class {
  constructor() {
    throw new TypeError("Illegal constructor");
  }
  get byobRequest() {
    if (!de(this))
      throw Ae("byobRequest");
    return function(e3) {
      if (null === e3._byobRequest && e3._pendingPullIntos.length > 0) {
        const t3 = e3._pendingPullIntos.peek(), r3 = new Uint8Array(t3.buffer, t3.byteOffset + t3.bytesFilled, t3.byteLength - t3.bytesFilled), o2 = Object.create(ReadableStreamBYOBRequest.prototype);
        !function(e4, t4, r4) {
          e4._associatedReadableByteStreamController = t4, e4._view = r4;
        }(o2, e3, r3), e3._byobRequest = o2;
      }
      return e3._byobRequest;
    }(this);
  }
  get desiredSize() {
    if (!de(this))
      throw Ae("desiredSize");
    return ke(this);
  }
  close() {
    if (!de(this))
      throw Ae("close");
    if (this._closeRequested)
      throw new TypeError("The stream has already been closed; do not close it again!");
    const e3 = this._controlledReadableByteStream._state;
    if ("readable" !== e3)
      throw new TypeError(`The stream (in ${e3} state) is not in the readable state and cannot be closed`);
    !function(e4) {
      const t3 = e4._controlledReadableByteStream;
      if (e4._closeRequested || "readable" !== t3._state)
        return;
      if (e4._queueTotalSize > 0)
        return void (e4._closeRequested = true);
      if (e4._pendingPullIntos.length > 0) {
        if (e4._pendingPullIntos.peek().bytesFilled > 0) {
          const t4 = new TypeError("Insufficient bytes to fill elements in the given buffer");
          throw Pe(e4, t4), t4;
        }
      }
      Ee(e4), Xt(t3);
    }(this);
  }
  enqueue(e3) {
    if (!de(this))
      throw Ae("enqueue");
    if ($(e3, 1, "enqueue"), !ArrayBuffer.isView(e3))
      throw new TypeError("chunk must be an array buffer view");
    if (0 === e3.byteLength)
      throw new TypeError("chunk must have non-zero byteLength");
    if (0 === e3.buffer.byteLength)
      throw new TypeError("chunk's buffer must have non-zero byteLength");
    if (this._closeRequested)
      throw new TypeError("stream is closed or draining");
    const t3 = this._controlledReadableByteStream._state;
    if ("readable" !== t3)
      throw new TypeError(`The stream (in ${t3} state) is not in the readable state and cannot be enqueued to`);
    !function(e4, t4) {
      const r3 = e4._controlledReadableByteStream;
      if (e4._closeRequested || "readable" !== r3._state)
        return;
      const o2 = t4.buffer, n2 = t4.byteOffset, a2 = t4.byteLength, i3 = o2;
      if (e4._pendingPullIntos.length > 0) {
        const t5 = e4._pendingPullIntos.peek();
        t5.buffer, 0, Re(e4), t5.buffer = t5.buffer, "none" === t5.readerType && ge(e4, t5);
      }
      if (J(r3))
        if (function(e5) {
          const t5 = e5._controlledReadableByteStream._reader;
          for (; t5._readRequests.length > 0; ) {
            if (0 === e5._queueTotalSize)
              return;
            We(e5, t5._readRequests.shift());
          }
        }(e4), 0 === X(r3))
          me(e4, i3, n2, a2);
        else {
          e4._pendingPullIntos.length > 0 && Ce(e4);
          G(r3, new Uint8Array(i3, n2, a2), false);
        }
      else
        Le(r3) ? (me(e4, i3, n2, a2), Te(e4)) : me(e4, i3, n2, a2);
      be(e4);
    }(this, e3);
  }
  error(e3) {
    if (!de(this))
      throw Ae("error");
    Pe(this, e3);
  }
  [T](e3) {
    he(this), ce(this);
    const t3 = this._cancelAlgorithm(e3);
    return Ee(this), t3;
  }
  [q](e3) {
    const t3 = this._controlledReadableByteStream;
    if (this._queueTotalSize > 0)
      return void We(this, e3);
    const r3 = this._autoAllocateChunkSize;
    if (void 0 !== r3) {
      let t4;
      try {
        t4 = new ArrayBuffer(r3);
      } catch (t5) {
        return void e3._errorSteps(t5);
      }
      const o2 = { buffer: t4, bufferByteLength: r3, byteOffset: 0, byteLength: r3, bytesFilled: 0, elementSize: 1, viewConstructor: Uint8Array, readerType: "default" };
      this._pendingPullIntos.push(o2);
    }
    U(t3, e3), be(this);
  }
  [C]() {
    if (this._pendingPullIntos.length > 0) {
      const e3 = this._pendingPullIntos.peek();
      e3.readerType = "none", this._pendingPullIntos = new S2(), this._pendingPullIntos.push(e3);
    }
  }
};
function de(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_controlledReadableByteStream") && e3 instanceof ReadableByteStreamController);
}
function fe(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_associatedReadableByteStreamController") && e3 instanceof ReadableStreamBYOBRequest);
}
function be(e3) {
  const t3 = function(e4) {
    const t4 = e4._controlledReadableByteStream;
    if ("readable" !== t4._state)
      return false;
    if (e4._closeRequested)
      return false;
    if (!e4._started)
      return false;
    if (J(t4) && X(t4) > 0)
      return true;
    if (Le(t4) && ze(t4) > 0)
      return true;
    if (ke(e4) > 0)
      return true;
    return false;
  }(e3);
  if (!t3)
    return;
  if (e3._pulling)
    return void (e3._pullAgain = true);
  e3._pulling = true;
  b(e3._pullAlgorithm(), () => (e3._pulling = false, e3._pullAgain && (e3._pullAgain = false, be(e3)), null), (t4) => (Pe(e3, t4), null));
}
function he(e3) {
  Re(e3), e3._pendingPullIntos = new S2();
}
function _e(e3, t3) {
  let r3 = false;
  "closed" === e3._state && (r3 = true);
  const o2 = pe(t3);
  "default" === t3.readerType ? G(e3, o2, r3) : function(e4, t4, r4) {
    const o3 = e4._reader._readIntoRequests.shift();
    r4 ? o3._closeSteps(t4) : o3._chunkSteps(t4);
  }(e3, o2, r3);
}
function pe(e3) {
  const t3 = e3.bytesFilled, r3 = e3.elementSize;
  return new e3.viewConstructor(e3.buffer, e3.byteOffset, t3 / r3);
}
function me(e3, t3, r3, o2) {
  e3._queue.push({ buffer: t3, byteOffset: r3, byteLength: o2 }), e3._queueTotalSize += o2;
}
function ye(e3, t3, r3, o2) {
  let n2;
  try {
    n2 = t3.slice(r3, r3 + o2);
  } catch (t4) {
    throw Pe(e3, t4), t4;
  }
  me(e3, n2, 0, o2);
}
function ge(e3, t3) {
  t3.bytesFilled > 0 && ye(e3, t3.buffer, t3.byteOffset, t3.bytesFilled), Ce(e3);
}
function we(e3, t3) {
  const r3 = t3.elementSize, o2 = t3.bytesFilled - t3.bytesFilled % r3, n2 = Math.min(e3._queueTotalSize, t3.byteLength - t3.bytesFilled), a2 = t3.bytesFilled + n2, i3 = a2 - a2 % r3;
  let l2 = n2, s3 = false;
  i3 > o2 && (l2 = i3 - t3.bytesFilled, s3 = true);
  const u2 = e3._queue;
  for (; l2 > 0; ) {
    const r4 = u2.peek(), o3 = Math.min(l2, r4.byteLength), n3 = t3.byteOffset + t3.bytesFilled;
    ie(t3.buffer, n3, r4.buffer, r4.byteOffset, o3), r4.byteLength === o3 ? u2.shift() : (r4.byteOffset += o3, r4.byteLength -= o3), e3._queueTotalSize -= o3, Se(e3, o3, t3), l2 -= o3;
  }
  return s3;
}
function Se(e3, t3, r3) {
  r3.bytesFilled += t3;
}
function ve(e3) {
  0 === e3._queueTotalSize && e3._closeRequested ? (Ee(e3), Xt(e3._controlledReadableByteStream)) : be(e3);
}
function Re(e3) {
  null !== e3._byobRequest && (e3._byobRequest._associatedReadableByteStreamController = void 0, e3._byobRequest._view = null, e3._byobRequest = null);
}
function Te(e3) {
  for (; e3._pendingPullIntos.length > 0; ) {
    if (0 === e3._queueTotalSize)
      return;
    const t3 = e3._pendingPullIntos.peek();
    we(e3, t3) && (Ce(e3), _e(e3._controlledReadableByteStream, t3));
  }
}
function qe(e3, t3) {
  const r3 = e3._pendingPullIntos.peek();
  Re(e3);
  "closed" === e3._controlledReadableByteStream._state ? function(e4, t4) {
    "none" === t4.readerType && Ce(e4);
    const r4 = e4._controlledReadableByteStream;
    if (Le(r4))
      for (; ze(r4) > 0; )
        _e(r4, Ce(e4));
  }(e3, r3) : function(e4, t4, r4) {
    if (Se(0, t4, r4), "none" === r4.readerType)
      return ge(e4, r4), void Te(e4);
    if (r4.bytesFilled < r4.elementSize)
      return;
    Ce(e4);
    const o2 = r4.bytesFilled % r4.elementSize;
    if (o2 > 0) {
      const t5 = r4.byteOffset + r4.bytesFilled;
      ye(e4, r4.buffer, t5 - o2, o2);
    }
    r4.bytesFilled -= o2, _e(e4._controlledReadableByteStream, r4), Te(e4);
  }(e3, t3, r3), be(e3);
}
function Ce(e3) {
  return e3._pendingPullIntos.shift();
}
function Ee(e3) {
  e3._pullAlgorithm = void 0, e3._cancelAlgorithm = void 0;
}
function Pe(e3, t3) {
  const r3 = e3._controlledReadableByteStream;
  "readable" === r3._state && (he(e3), ce(e3), Ee(e3), Jt(r3, t3));
}
function We(e3, t3) {
  const r3 = e3._queue.shift();
  e3._queueTotalSize -= r3.byteLength, ve(e3);
  const o2 = new Uint8Array(r3.buffer, r3.byteOffset, r3.byteLength);
  t3._chunkSteps(o2);
}
function ke(e3) {
  const t3 = e3._controlledReadableByteStream._state;
  return "errored" === t3 ? null : "closed" === t3 ? 0 : e3._strategyHWM - e3._queueTotalSize;
}
function Oe(e3, t3, r3) {
  const o2 = Object.create(ReadableByteStreamController.prototype);
  let n2, a2, i3;
  n2 = void 0 !== t3.start ? () => t3.start(o2) : () => {
  }, a2 = void 0 !== t3.pull ? () => t3.pull(o2) : () => c(void 0), i3 = void 0 !== t3.cancel ? (e4) => t3.cancel(e4) : () => c(void 0);
  const l2 = t3.autoAllocateChunkSize;
  if (0 === l2)
    throw new TypeError("autoAllocateChunkSize must be greater than 0");
  !function(e4, t4, r4, o3, n3, a3, i4) {
    t4._controlledReadableByteStream = e4, t4._pullAgain = false, t4._pulling = false, t4._byobRequest = null, t4._queue = t4._queueTotalSize = void 0, ce(t4), t4._closeRequested = false, t4._started = false, t4._strategyHWM = a3, t4._pullAlgorithm = o3, t4._cancelAlgorithm = n3, t4._autoAllocateChunkSize = i4, t4._pendingPullIntos = new S2(), e4._readableStreamController = t4, b(c(r4()), () => (t4._started = true, be(t4), null), (e5) => (Pe(t4, e5), null));
  }(e3, o2, n2, a2, i3, r3, l2);
}
function Be(e3) {
  return new TypeError(`ReadableStreamBYOBRequest.prototype.${e3} can only be used on a ReadableStreamBYOBRequest`);
}
function Ae(e3) {
  return new TypeError(`ReadableByteStreamController.prototype.${e3} can only be used on a ReadableByteStreamController`);
}
function je(e3, t3) {
  e3._reader._readIntoRequests.push(t3);
}
function ze(e3) {
  return e3._reader._readIntoRequests.length;
}
function Le(e3) {
  const t3 = e3._reader;
  return void 0 !== t3 && !!Fe(t3);
}
Object.defineProperties(ReadableByteStreamController.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, byobRequest: { enumerable: true }, desiredSize: { enumerable: true } }), n(ReadableByteStreamController.prototype.close, "close"), n(ReadableByteStreamController.prototype.enqueue, "enqueue"), n(ReadableByteStreamController.prototype.error, "error"), "symbol" == typeof e2.toStringTag && Object.defineProperty(ReadableByteStreamController.prototype, e2.toStringTag, { value: "ReadableByteStreamController", configurable: true });
var ReadableStreamBYOBReader = class {
  constructor(e3) {
    if ($(e3, 1, "ReadableStreamBYOBReader"), V(e3, "First parameter"), Ut(e3))
      throw new TypeError("This stream has already been locked for exclusive reading by another reader");
    if (!de(e3._readableStreamController))
      throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
    E(this, e3), this._readIntoRequests = new S2();
  }
  get closed() {
    return Fe(this) ? this._closedPromise : d(De("closed"));
  }
  cancel(e3) {
    return Fe(this) ? void 0 === this._ownerReadableStream ? d(k("cancel")) : P(this, e3) : d(De("cancel"));
  }
  read(e3) {
    if (!Fe(this))
      return d(De("read"));
    if (!ArrayBuffer.isView(e3))
      return d(new TypeError("view must be an array buffer view"));
    if (0 === e3.byteLength)
      return d(new TypeError("view must have non-zero byteLength"));
    if (0 === e3.buffer.byteLength)
      return d(new TypeError("view's buffer must have non-zero byteLength"));
    if (e3.buffer, void 0 === this._ownerReadableStream)
      return d(k("read from"));
    let t3, r3;
    const o2 = u((e4, o3) => {
      t3 = e4, r3 = o3;
    });
    return function(e4, t4, r4) {
      const o3 = e4._ownerReadableStream;
      o3._disturbed = true, "errored" === o3._state ? r4._errorSteps(o3._storedError) : function(e5, t5, r5) {
        const o4 = e5._controlledReadableByteStream;
        let n2 = 1;
        t5.constructor !== DataView && (n2 = t5.constructor.BYTES_PER_ELEMENT);
        const a2 = t5.constructor, i3 = t5.buffer, l2 = { buffer: i3, bufferByteLength: i3.byteLength, byteOffset: t5.byteOffset, byteLength: t5.byteLength, bytesFilled: 0, elementSize: n2, viewConstructor: a2, readerType: "byob" };
        if (e5._pendingPullIntos.length > 0)
          return e5._pendingPullIntos.push(l2), void je(o4, r5);
        if ("closed" !== o4._state) {
          if (e5._queueTotalSize > 0) {
            if (we(e5, l2)) {
              const t6 = pe(l2);
              return ve(e5), void r5._chunkSteps(t6);
            }
            if (e5._closeRequested) {
              const t6 = new TypeError("Insufficient bytes to fill elements in the given buffer");
              return Pe(e5, t6), void r5._errorSteps(t6);
            }
          }
          e5._pendingPullIntos.push(l2), je(o4, r5), be(e5);
        } else {
          const e6 = new a2(l2.buffer, l2.byteOffset, 0);
          r5._closeSteps(e6);
        }
      }(o3._readableStreamController, t4, r4);
    }(this, e3, { _chunkSteps: (e4) => t3({ value: e4, done: false }), _closeSteps: (e4) => t3({ value: e4, done: true }), _errorSteps: (e4) => r3(e4) }), o2;
  }
  releaseLock() {
    if (!Fe(this))
      throw De("releaseLock");
    void 0 !== this._ownerReadableStream && function(e3) {
      W(e3);
      const t3 = new TypeError("Reader was released");
      Ie(e3, t3);
    }(this);
  }
};
function Fe(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_readIntoRequests") && e3 instanceof ReadableStreamBYOBReader);
}
function Ie(e3, t3) {
  const r3 = e3._readIntoRequests;
  e3._readIntoRequests = new S2(), r3.forEach((e4) => {
    e4._errorSteps(t3);
  });
}
function De(e3) {
  return new TypeError(`ReadableStreamBYOBReader.prototype.${e3} can only be used on a ReadableStreamBYOBReader`);
}
function $e(e3, t3) {
  const { highWaterMark: r3 } = e3;
  if (void 0 === r3)
    return t3;
  if (ae(r3) || r3 < 0)
    throw new RangeError("Invalid highWaterMark");
  return r3;
}
function Me(e3) {
  const { size: t3 } = e3;
  return t3 || (() => 1);
}
function Ye(e3, t3) {
  F2(e3, t3);
  const r3 = null == e3 ? void 0 : e3.highWaterMark, o2 = null == e3 ? void 0 : e3.size;
  return { highWaterMark: void 0 === r3 ? void 0 : Y(r3), size: void 0 === o2 ? void 0 : Qe(o2, `${t3} has member 'size' that`) };
}
function Qe(e3, t3) {
  return I(e3, t3), (t4) => Y(e3(t4));
}
function Ne(e3, t3, r3) {
  return I(e3, r3), (r4) => w(e3, t3, [r4]);
}
function He(e3, t3, r3) {
  return I(e3, r3), () => w(e3, t3, []);
}
function xe(e3, t3, r3) {
  return I(e3, r3), (r4) => g(e3, t3, [r4]);
}
function Ve(e3, t3, r3) {
  return I(e3, r3), (r4, o2) => w(e3, t3, [r4, o2]);
}
Object.defineProperties(ReadableStreamBYOBReader.prototype, { cancel: { enumerable: true }, read: { enumerable: true }, releaseLock: { enumerable: true }, closed: { enumerable: true } }), n(ReadableStreamBYOBReader.prototype.cancel, "cancel"), n(ReadableStreamBYOBReader.prototype.read, "read"), n(ReadableStreamBYOBReader.prototype.releaseLock, "releaseLock"), "symbol" == typeof e2.toStringTag && Object.defineProperty(ReadableStreamBYOBReader.prototype, e2.toStringTag, { value: "ReadableStreamBYOBReader", configurable: true });
var Ue = "function" == typeof AbortController;
var WritableStream = class {
  constructor(e3 = {}, t3 = {}) {
    void 0 === e3 ? e3 = null : D(e3, "First parameter");
    const r3 = Ye(t3, "Second parameter"), o2 = function(e4, t4) {
      F2(e4, t4);
      const r4 = null == e4 ? void 0 : e4.abort, o3 = null == e4 ? void 0 : e4.close, n3 = null == e4 ? void 0 : e4.start, a3 = null == e4 ? void 0 : e4.type, i3 = null == e4 ? void 0 : e4.write;
      return { abort: void 0 === r4 ? void 0 : Ne(r4, e4, `${t4} has member 'abort' that`), close: void 0 === o3 ? void 0 : He(o3, e4, `${t4} has member 'close' that`), start: void 0 === n3 ? void 0 : xe(n3, e4, `${t4} has member 'start' that`), write: void 0 === i3 ? void 0 : Ve(i3, e4, `${t4} has member 'write' that`), type: a3 };
    }(e3, "First parameter");
    var n2;
    (n2 = this)._state = "writable", n2._storedError = void 0, n2._writer = void 0, n2._writableStreamController = void 0, n2._writeRequests = new S2(), n2._inFlightWriteRequest = void 0, n2._closeRequest = void 0, n2._inFlightCloseRequest = void 0, n2._pendingAbortRequest = void 0, n2._backpressure = false;
    if (void 0 !== o2.type)
      throw new RangeError("Invalid type is specified");
    const a2 = Me(r3);
    !function(e4, t4, r4, o3) {
      const n3 = Object.create(WritableStreamDefaultController.prototype);
      let a3, i3, l2, s3;
      a3 = void 0 !== t4.start ? () => t4.start(n3) : () => {
      };
      i3 = void 0 !== t4.write ? (e5) => t4.write(e5, n3) : () => c(void 0);
      l2 = void 0 !== t4.close ? () => t4.close() : () => c(void 0);
      s3 = void 0 !== t4.abort ? (e5) => t4.abort(e5) : () => c(void 0);
      !function(e5, t5, r5, o4, n4, a4, i4, l3) {
        t5._controlledWritableStream = e5, e5._writableStreamController = t5, t5._queue = void 0, t5._queueTotalSize = void 0, ce(t5), t5._abortReason = void 0, t5._abortController = function() {
          if (Ue)
            return new AbortController();
        }(), t5._started = false, t5._strategySizeAlgorithm = l3, t5._strategyHWM = i4, t5._writeAlgorithm = o4, t5._closeAlgorithm = n4, t5._abortAlgorithm = a4;
        const s4 = bt(t5);
        nt(e5, s4);
        const u2 = r5();
        b(c(u2), () => (t5._started = true, dt(t5), null), (r6) => (t5._started = true, Ze(e5, r6), null));
      }(e4, n3, a3, i3, l2, s3, r4, o3);
    }(this, o2, $e(r3, 1), a2);
  }
  get locked() {
    if (!Ge(this))
      throw _t("locked");
    return Xe(this);
  }
  abort(e3) {
    return Ge(this) ? Xe(this) ? d(new TypeError("Cannot abort a stream that already has a writer")) : Je(this, e3) : d(_t("abort"));
  }
  close() {
    return Ge(this) ? Xe(this) ? d(new TypeError("Cannot close a stream that already has a writer")) : rt(this) ? d(new TypeError("Cannot close an already-closing stream")) : Ke(this) : d(_t("close"));
  }
  getWriter() {
    if (!Ge(this))
      throw _t("getWriter");
    return new WritableStreamDefaultWriter(this);
  }
};
function Ge(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_writableStreamController") && e3 instanceof WritableStream);
}
function Xe(e3) {
  return void 0 !== e3._writer;
}
function Je(e3, t3) {
  var r3;
  if ("closed" === e3._state || "errored" === e3._state)
    return c(void 0);
  e3._writableStreamController._abortReason = t3, null === (r3 = e3._writableStreamController._abortController) || void 0 === r3 || r3.abort(t3);
  const o2 = e3._state;
  if ("closed" === o2 || "errored" === o2)
    return c(void 0);
  if (void 0 !== e3._pendingAbortRequest)
    return e3._pendingAbortRequest._promise;
  let n2 = false;
  "erroring" === o2 && (n2 = true, t3 = void 0);
  const a2 = u((r4, o3) => {
    e3._pendingAbortRequest = { _promise: void 0, _resolve: r4, _reject: o3, _reason: t3, _wasAlreadyErroring: n2 };
  });
  return e3._pendingAbortRequest._promise = a2, n2 || et(e3, t3), a2;
}
function Ke(e3) {
  const t3 = e3._state;
  if ("closed" === t3 || "errored" === t3)
    return d(new TypeError(`The stream (in ${t3} state) is not in the writable state and cannot be closed`));
  const r3 = u((t4, r4) => {
    const o3 = { _resolve: t4, _reject: r4 };
    e3._closeRequest = o3;
  }), o2 = e3._writer;
  var n2;
  return void 0 !== o2 && e3._backpressure && "writable" === t3 && Et(o2), ue(n2 = e3._writableStreamController, lt, 0), dt(n2), r3;
}
function Ze(e3, t3) {
  "writable" !== e3._state ? tt(e3) : et(e3, t3);
}
function et(e3, t3) {
  const r3 = e3._writableStreamController;
  e3._state = "erroring", e3._storedError = t3;
  const o2 = e3._writer;
  void 0 !== o2 && it(o2, t3), !function(e4) {
    if (void 0 === e4._inFlightWriteRequest && void 0 === e4._inFlightCloseRequest)
      return false;
    return true;
  }(e3) && r3._started && tt(e3);
}
function tt(e3) {
  e3._state = "errored", e3._writableStreamController[R]();
  const t3 = e3._storedError;
  if (e3._writeRequests.forEach((e4) => {
    e4._reject(t3);
  }), e3._writeRequests = new S2(), void 0 === e3._pendingAbortRequest)
    return void ot(e3);
  const r3 = e3._pendingAbortRequest;
  if (e3._pendingAbortRequest = void 0, r3._wasAlreadyErroring)
    return r3._reject(t3), void ot(e3);
  b(e3._writableStreamController[v](r3._reason), () => (r3._resolve(), ot(e3), null), (t4) => (r3._reject(t4), ot(e3), null));
}
function rt(e3) {
  return void 0 !== e3._closeRequest || void 0 !== e3._inFlightCloseRequest;
}
function ot(e3) {
  void 0 !== e3._closeRequest && (e3._closeRequest._reject(e3._storedError), e3._closeRequest = void 0);
  const t3 = e3._writer;
  void 0 !== t3 && St(t3, e3._storedError);
}
function nt(e3, t3) {
  const r3 = e3._writer;
  void 0 !== r3 && t3 !== e3._backpressure && (t3 ? function(e4) {
    Rt(e4);
  }(r3) : Et(r3)), e3._backpressure = t3;
}
Object.defineProperties(WritableStream.prototype, { abort: { enumerable: true }, close: { enumerable: true }, getWriter: { enumerable: true }, locked: { enumerable: true } }), n(WritableStream.prototype.abort, "abort"), n(WritableStream.prototype.close, "close"), n(WritableStream.prototype.getWriter, "getWriter"), "symbol" == typeof e2.toStringTag && Object.defineProperty(WritableStream.prototype, e2.toStringTag, { value: "WritableStream", configurable: true });
var WritableStreamDefaultWriter = class {
  constructor(e3) {
    if ($(e3, 1, "WritableStreamDefaultWriter"), function(e4, t4) {
      if (!Ge(e4))
        throw new TypeError(`${t4} is not a WritableStream.`);
    }(e3, "First parameter"), Xe(e3))
      throw new TypeError("This stream has already been locked for exclusive writing by another writer");
    this._ownerWritableStream = e3, e3._writer = this;
    const t3 = e3._state;
    if ("writable" === t3)
      !rt(e3) && e3._backpressure ? Rt(this) : qt(this), gt(this);
    else if ("erroring" === t3)
      Tt(this, e3._storedError), gt(this);
    else if ("closed" === t3)
      qt(this), gt(r3 = this), vt(r3);
    else {
      const t4 = e3._storedError;
      Tt(this, t4), wt(this, t4);
    }
    var r3;
  }
  get closed() {
    return at(this) ? this._closedPromise : d(mt("closed"));
  }
  get desiredSize() {
    if (!at(this))
      throw mt("desiredSize");
    if (void 0 === this._ownerWritableStream)
      throw yt("desiredSize");
    return function(e3) {
      const t3 = e3._ownerWritableStream, r3 = t3._state;
      if ("errored" === r3 || "erroring" === r3)
        return null;
      if ("closed" === r3)
        return 0;
      return ct(t3._writableStreamController);
    }(this);
  }
  get ready() {
    return at(this) ? this._readyPromise : d(mt("ready"));
  }
  abort(e3) {
    return at(this) ? void 0 === this._ownerWritableStream ? d(yt("abort")) : function(e4, t3) {
      return Je(e4._ownerWritableStream, t3);
    }(this, e3) : d(mt("abort"));
  }
  close() {
    if (!at(this))
      return d(mt("close"));
    const e3 = this._ownerWritableStream;
    return void 0 === e3 ? d(yt("close")) : rt(e3) ? d(new TypeError("Cannot close an already-closing stream")) : Ke(this._ownerWritableStream);
  }
  releaseLock() {
    if (!at(this))
      throw mt("releaseLock");
    void 0 !== this._ownerWritableStream && function(e3) {
      const t3 = e3._ownerWritableStream, r3 = new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
      it(e3, r3), function(e4, t4) {
        "pending" === e4._closedPromiseState ? St(e4, t4) : function(e5, t5) {
          wt(e5, t5);
        }(e4, t4);
      }(e3, r3), t3._writer = void 0, e3._ownerWritableStream = void 0;
    }(this);
  }
  write(e3) {
    return at(this) ? void 0 === this._ownerWritableStream ? d(yt("write to")) : function(e4, t3) {
      const r3 = e4._ownerWritableStream, o2 = r3._writableStreamController, n2 = function(e5, t4) {
        try {
          return e5._strategySizeAlgorithm(t4);
        } catch (t5) {
          return ft(e5, t5), 1;
        }
      }(o2, t3);
      if (r3 !== e4._ownerWritableStream)
        return d(yt("write to"));
      const a2 = r3._state;
      if ("errored" === a2)
        return d(r3._storedError);
      if (rt(r3) || "closed" === a2)
        return d(new TypeError("The stream is closing or closed and cannot be written to"));
      if ("erroring" === a2)
        return d(r3._storedError);
      const i3 = function(e5) {
        return u((t4, r4) => {
          const o3 = { _resolve: t4, _reject: r4 };
          e5._writeRequests.push(o3);
        });
      }(r3);
      return function(e5, t4, r4) {
        try {
          ue(e5, t4, r4);
        } catch (t5) {
          return void ft(e5, t5);
        }
        const o3 = e5._controlledWritableStream;
        if (!rt(o3) && "writable" === o3._state) {
          nt(o3, bt(e5));
        }
        dt(e5);
      }(o2, t3, n2), i3;
    }(this, e3) : d(mt("write"));
  }
};
function at(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_ownerWritableStream") && e3 instanceof WritableStreamDefaultWriter);
}
function it(e3, t3) {
  "pending" === e3._readyPromiseState ? Ct(e3, t3) : function(e4, t4) {
    Tt(e4, t4);
  }(e3, t3);
}
Object.defineProperties(WritableStreamDefaultWriter.prototype, { abort: { enumerable: true }, close: { enumerable: true }, releaseLock: { enumerable: true }, write: { enumerable: true }, closed: { enumerable: true }, desiredSize: { enumerable: true }, ready: { enumerable: true } }), n(WritableStreamDefaultWriter.prototype.abort, "abort"), n(WritableStreamDefaultWriter.prototype.close, "close"), n(WritableStreamDefaultWriter.prototype.releaseLock, "releaseLock"), n(WritableStreamDefaultWriter.prototype.write, "write"), "symbol" == typeof e2.toStringTag && Object.defineProperty(WritableStreamDefaultWriter.prototype, e2.toStringTag, { value: "WritableStreamDefaultWriter", configurable: true });
var lt = {};
var WritableStreamDefaultController = class {
  constructor() {
    throw new TypeError("Illegal constructor");
  }
  get abortReason() {
    if (!st(this))
      throw pt("abortReason");
    return this._abortReason;
  }
  get signal() {
    if (!st(this))
      throw pt("signal");
    if (void 0 === this._abortController)
      throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
    return this._abortController.signal;
  }
  error(e3) {
    if (!st(this))
      throw pt("error");
    "writable" === this._controlledWritableStream._state && ht(this, e3);
  }
  [v](e3) {
    const t3 = this._abortAlgorithm(e3);
    return ut(this), t3;
  }
  [R]() {
    ce(this);
  }
};
function st(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_controlledWritableStream") && e3 instanceof WritableStreamDefaultController);
}
function ut(e3) {
  e3._writeAlgorithm = void 0, e3._closeAlgorithm = void 0, e3._abortAlgorithm = void 0, e3._strategySizeAlgorithm = void 0;
}
function ct(e3) {
  return e3._strategyHWM - e3._queueTotalSize;
}
function dt(e3) {
  const t3 = e3._controlledWritableStream;
  if (!e3._started)
    return;
  if (void 0 !== t3._inFlightWriteRequest)
    return;
  if ("erroring" === t3._state)
    return void tt(t3);
  if (0 === e3._queue.length)
    return;
  const r3 = e3._queue.peek().value;
  r3 === lt ? function(e4) {
    const t4 = e4._controlledWritableStream;
    (function(e5) {
      e5._inFlightCloseRequest = e5._closeRequest, e5._closeRequest = void 0;
    })(t4), se(e4);
    const r4 = e4._closeAlgorithm();
    ut(e4), b(r4, () => (function(e5) {
      e5._inFlightCloseRequest._resolve(void 0), e5._inFlightCloseRequest = void 0, "erroring" === e5._state && (e5._storedError = void 0, void 0 !== e5._pendingAbortRequest && (e5._pendingAbortRequest._resolve(), e5._pendingAbortRequest = void 0)), e5._state = "closed";
      const t5 = e5._writer;
      void 0 !== t5 && vt(t5);
    }(t4), null), (e5) => (function(e6, t5) {
      e6._inFlightCloseRequest._reject(t5), e6._inFlightCloseRequest = void 0, void 0 !== e6._pendingAbortRequest && (e6._pendingAbortRequest._reject(t5), e6._pendingAbortRequest = void 0), Ze(e6, t5);
    }(t4, e5), null));
  }(e3) : function(e4, t4) {
    const r4 = e4._controlledWritableStream;
    !function(e5) {
      e5._inFlightWriteRequest = e5._writeRequests.shift();
    }(r4);
    b(e4._writeAlgorithm(t4), () => {
      !function(e5) {
        e5._inFlightWriteRequest._resolve(void 0), e5._inFlightWriteRequest = void 0;
      }(r4);
      const t5 = r4._state;
      if (se(e4), !rt(r4) && "writable" === t5) {
        const t6 = bt(e4);
        nt(r4, t6);
      }
      return dt(e4), null;
    }, (t5) => ("writable" === r4._state && ut(e4), function(e5, t6) {
      e5._inFlightWriteRequest._reject(t6), e5._inFlightWriteRequest = void 0, Ze(e5, t6);
    }(r4, t5), null));
  }(e3, r3);
}
function ft(e3, t3) {
  "writable" === e3._controlledWritableStream._state && ht(e3, t3);
}
function bt(e3) {
  return ct(e3) <= 0;
}
function ht(e3, t3) {
  const r3 = e3._controlledWritableStream;
  ut(e3), et(r3, t3);
}
function _t(e3) {
  return new TypeError(`WritableStream.prototype.${e3} can only be used on a WritableStream`);
}
function pt(e3) {
  return new TypeError(`WritableStreamDefaultController.prototype.${e3} can only be used on a WritableStreamDefaultController`);
}
function mt(e3) {
  return new TypeError(`WritableStreamDefaultWriter.prototype.${e3} can only be used on a WritableStreamDefaultWriter`);
}
function yt(e3) {
  return new TypeError("Cannot " + e3 + " a stream using a released writer");
}
function gt(e3) {
  e3._closedPromise = u((t3, r3) => {
    e3._closedPromise_resolve = t3, e3._closedPromise_reject = r3, e3._closedPromiseState = "pending";
  });
}
function wt(e3, t3) {
  gt(e3), St(e3, t3);
}
function St(e3, t3) {
  void 0 !== e3._closedPromise_reject && (m2(e3._closedPromise), e3._closedPromise_reject(t3), e3._closedPromise_resolve = void 0, e3._closedPromise_reject = void 0, e3._closedPromiseState = "rejected");
}
function vt(e3) {
  void 0 !== e3._closedPromise_resolve && (e3._closedPromise_resolve(void 0), e3._closedPromise_resolve = void 0, e3._closedPromise_reject = void 0, e3._closedPromiseState = "resolved");
}
function Rt(e3) {
  e3._readyPromise = u((t3, r3) => {
    e3._readyPromise_resolve = t3, e3._readyPromise_reject = r3;
  }), e3._readyPromiseState = "pending";
}
function Tt(e3, t3) {
  Rt(e3), Ct(e3, t3);
}
function qt(e3) {
  Rt(e3), Et(e3);
}
function Ct(e3, t3) {
  void 0 !== e3._readyPromise_reject && (m2(e3._readyPromise), e3._readyPromise_reject(t3), e3._readyPromise_resolve = void 0, e3._readyPromise_reject = void 0, e3._readyPromiseState = "rejected");
}
function Et(e3) {
  void 0 !== e3._readyPromise_resolve && (e3._readyPromise_resolve(void 0), e3._readyPromise_resolve = void 0, e3._readyPromise_reject = void 0, e3._readyPromiseState = "fulfilled");
}
Object.defineProperties(WritableStreamDefaultController.prototype, { abortReason: { enumerable: true }, signal: { enumerable: true }, error: { enumerable: true } }), "symbol" == typeof e2.toStringTag && Object.defineProperty(WritableStreamDefaultController.prototype, e2.toStringTag, { value: "WritableStreamDefaultController", configurable: true });
var Pt = "undefined" != typeof DOMException ? DOMException : void 0;
var Wt = function(e3) {
  if ("function" != typeof e3 && "object" != typeof e3)
    return false;
  try {
    return new e3(), true;
  } catch (e4) {
    return false;
  }
}(Pt) ? Pt : function() {
  const e3 = function(e4, t3) {
    this.message = e4 || "", this.name = t3 || "Error", Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  };
  return e3.prototype = Object.create(Error.prototype), Object.defineProperty(e3.prototype, "constructor", { value: e3, writable: true, configurable: true }), e3;
}();
function kt(e3, t3, r3, o2, n2, a2) {
  const i3 = e3.getReader(), l2 = t3.getWriter();
  Vt(e3) && (e3._disturbed = true);
  let s3, _2, g2, w2 = false, S3 = false, v2 = "readable", R2 = "writable", T2 = false, q2 = false;
  const C2 = u((e4) => {
    g2 = e4;
  });
  let E2 = Promise.resolve(void 0);
  return u((P2, W2) => {
    let k2;
    function O2() {
      if (w2)
        return;
      const e4 = u((e5, t4) => {
        !function r4(o3) {
          o3 ? e5() : f3(function() {
            if (w2)
              return c(true);
            return f3(l2.ready, () => f3(i3.read(), (e6) => !!e6.done || (E2 = l2.write(e6.value), m2(E2), false)));
          }(), r4, t4);
        }(false);
      });
      m2(e4);
    }
    function B2() {
      return v2 = "closed", r3 ? L2() : z2(() => (Ge(t3) && (T2 = rt(t3), R2 = t3._state), T2 || "closed" === R2 ? c(void 0) : "erroring" === R2 || "errored" === R2 ? d(_2) : (T2 = true, l2.close())), false, void 0), null;
    }
    function A3(e4) {
      return w2 || (v2 = "errored", s3 = e4, o2 ? L2(true, e4) : z2(() => l2.abort(e4), true, e4)), null;
    }
    function j2(e4) {
      return S3 || (R2 = "errored", _2 = e4, n2 ? L2(true, e4) : z2(() => i3.cancel(e4), true, e4)), null;
    }
    if (void 0 !== a2 && (k2 = () => {
      const e4 = void 0 !== a2.reason ? a2.reason : new Wt("Aborted", "AbortError"), t4 = [];
      o2 || t4.push(() => "writable" === R2 ? l2.abort(e4) : c(void 0)), n2 || t4.push(() => "readable" === v2 ? i3.cancel(e4) : c(void 0)), z2(() => Promise.all(t4.map((e5) => e5())), true, e4);
    }, a2.aborted ? k2() : a2.addEventListener("abort", k2)), Vt(e3) && (v2 = e3._state, s3 = e3._storedError), Ge(t3) && (R2 = t3._state, _2 = t3._storedError, T2 = rt(t3)), Vt(e3) && Ge(t3) && (q2 = true, g2()), "errored" === v2)
      A3(s3);
    else if ("erroring" === R2 || "errored" === R2)
      j2(_2);
    else if ("closed" === v2)
      B2();
    else if (T2 || "closed" === R2) {
      const e4 = new TypeError("the destination writable stream closed before all data could be piped to it");
      n2 ? L2(true, e4) : z2(() => i3.cancel(e4), true, e4);
    }
    function z2(e4, t4, r4) {
      function o3() {
        return "writable" !== R2 || T2 ? n3() : h2(function() {
          let e5;
          return c(function t5() {
            if (e5 !== E2)
              return e5 = E2, p(E2, t5, t5);
          }());
        }(), n3), null;
      }
      function n3() {
        return e4 ? b(e4(), () => F3(t4, r4), (e5) => F3(true, e5)) : F3(t4, r4), null;
      }
      w2 || (w2 = true, q2 ? o3() : h2(C2, o3));
    }
    function L2(e4, t4) {
      z2(void 0, e4, t4);
    }
    function F3(e4, t4) {
      return S3 = true, l2.releaseLock(), i3.releaseLock(), void 0 !== a2 && a2.removeEventListener("abort", k2), e4 ? W2(t4) : P2(void 0), null;
    }
    w2 || (b(i3.closed, B2, A3), b(l2.closed, function() {
      return S3 || (R2 = "closed"), null;
    }, j2)), q2 ? O2() : y(() => {
      q2 = true, g2(), O2();
    });
  });
}
function Ot(e3, t3) {
  return function(e4) {
    try {
      return e4.getReader({ mode: "byob" }).releaseLock(), true;
    } catch (e5) {
      return false;
    }
  }(e3) ? function(e4) {
    let t4, r3, o2, n2, a2, i3 = e4.getReader(), l2 = false, s3 = false, d2 = false, f4 = false, h3 = false, p2 = false;
    const m3 = u((e5) => {
      a2 = e5;
    });
    function y2(e5) {
      _(e5.closed, (t5) => (e5 !== i3 || (o2.error(t5), n2.error(t5), h3 && p2 || a2(void 0)), null));
    }
    function g2() {
      l2 && (i3.releaseLock(), i3 = e4.getReader(), y2(i3), l2 = false), b(i3.read(), (e5) => {
        var t5, r4;
        if (d2 = false, f4 = false, e5.done)
          return h3 || o2.close(), p2 || n2.close(), null === (t5 = o2.byobRequest) || void 0 === t5 || t5.respond(0), null === (r4 = n2.byobRequest) || void 0 === r4 || r4.respond(0), h3 && p2 || a2(void 0), null;
        const l3 = e5.value, u2 = l3;
        let c2 = l3;
        if (!h3 && !p2)
          try {
            c2 = le(l3);
          } catch (e6) {
            return o2.error(e6), n2.error(e6), a2(i3.cancel(e6)), null;
          }
        return h3 || o2.enqueue(u2), p2 || n2.enqueue(c2), s3 = false, d2 ? S3() : f4 && v2(), null;
      }, () => (s3 = false, null));
    }
    function w2(t5, r4) {
      l2 || (i3.releaseLock(), i3 = e4.getReader({ mode: "byob" }), y2(i3), l2 = true);
      const u2 = r4 ? n2 : o2, c2 = r4 ? o2 : n2;
      b(i3.read(t5), (e5) => {
        var t6;
        d2 = false, f4 = false;
        const o3 = r4 ? p2 : h3, n3 = r4 ? h3 : p2;
        if (e5.done) {
          o3 || u2.close(), n3 || c2.close();
          const r5 = e5.value;
          return void 0 !== r5 && (o3 || u2.byobRequest.respondWithNewView(r5), n3 || null === (t6 = c2.byobRequest) || void 0 === t6 || t6.respond(0)), o3 && n3 || a2(void 0), null;
        }
        const l3 = e5.value;
        if (n3)
          o3 || u2.byobRequest.respondWithNewView(l3);
        else {
          let e6;
          try {
            e6 = le(l3);
          } catch (e7) {
            return u2.error(e7), c2.error(e7), a2(i3.cancel(e7)), null;
          }
          o3 || u2.byobRequest.respondWithNewView(l3), c2.enqueue(e6);
        }
        return s3 = false, d2 ? S3() : f4 && v2(), null;
      }, () => (s3 = false, null));
    }
    function S3() {
      if (s3)
        return d2 = true, c(void 0);
      s3 = true;
      const e5 = o2.byobRequest;
      return null === e5 ? g2() : w2(e5.view, false), c(void 0);
    }
    function v2() {
      if (s3)
        return f4 = true, c(void 0);
      s3 = true;
      const e5 = n2.byobRequest;
      return null === e5 ? g2() : w2(e5.view, true), c(void 0);
    }
    function R2(e5) {
      if (h3 = true, t4 = e5, p2) {
        const e6 = [t4, r3], o3 = i3.cancel(e6);
        a2(o3);
      }
      return m3;
    }
    function T2(e5) {
      if (p2 = true, r3 = e5, h3) {
        const e6 = [t4, r3], o3 = i3.cancel(e6);
        a2(o3);
      }
      return m3;
    }
    const q2 = new ReadableStream2({ type: "bytes", start(e5) {
      o2 = e5;
    }, pull: S3, cancel: R2 }), C2 = new ReadableStream2({ type: "bytes", start(e5) {
      n2 = e5;
    }, pull: v2, cancel: T2 });
    return y2(i3), [q2, C2];
  }(e3) : function(e4, t4) {
    const r3 = e4.getReader();
    let o2, n2, a2, i3, l2, s3 = false, d2 = false, f4 = false, h3 = false;
    const p2 = u((e5) => {
      l2 = e5;
    });
    function m3() {
      return s3 ? (d2 = true, c(void 0)) : (s3 = true, b(r3.read(), (e5) => {
        if (d2 = false, e5.done)
          return f4 || a2.close(), h3 || i3.close(), f4 && h3 || l2(void 0), null;
        const t5 = e5.value, r4 = t5, o3 = t5;
        return f4 || a2.enqueue(r4), h3 || i3.enqueue(o3), s3 = false, d2 && m3(), null;
      }, () => (s3 = false, null)), c(void 0));
    }
    function y2(e5) {
      if (f4 = true, o2 = e5, h3) {
        const e6 = [o2, n2], t5 = r3.cancel(e6);
        l2(t5);
      }
      return p2;
    }
    function g2(e5) {
      if (h3 = true, n2 = e5, f4) {
        const e6 = [o2, n2], t5 = r3.cancel(e6);
        l2(t5);
      }
      return p2;
    }
    const w2 = new ReadableStream2({ start(e5) {
      a2 = e5;
    }, pull: m3, cancel: y2 }), S3 = new ReadableStream2({ start(e5) {
      i3 = e5;
    }, pull: m3, cancel: g2 });
    return _(r3.closed, (e5) => (a2.error(e5), i3.error(e5), f4 && h3 || l2(void 0), null)), [w2, S3];
  }(e3);
}
var ReadableStreamDefaultController = class {
  constructor() {
    throw new TypeError("Illegal constructor");
  }
  get desiredSize() {
    if (!Bt(this))
      throw Dt("desiredSize");
    return Lt(this);
  }
  close() {
    if (!Bt(this))
      throw Dt("close");
    if (!Ft(this))
      throw new TypeError("The stream is not in a state that permits close");
    !function(e3) {
      if (!Ft(e3))
        return;
      const t3 = e3._controlledReadableStream;
      e3._closeRequested = true, 0 === e3._queue.length && (jt(e3), Xt(t3));
    }(this);
  }
  enqueue(e3) {
    if (!Bt(this))
      throw Dt("enqueue");
    if (!Ft(this))
      throw new TypeError("The stream is not in a state that permits enqueue");
    return function(e4, t3) {
      if (!Ft(e4))
        return;
      const r3 = e4._controlledReadableStream;
      if (Ut(r3) && X(r3) > 0)
        G(r3, t3, false);
      else {
        let r4;
        try {
          r4 = e4._strategySizeAlgorithm(t3);
        } catch (t4) {
          throw zt(e4, t4), t4;
        }
        try {
          ue(e4, t3, r4);
        } catch (t4) {
          throw zt(e4, t4), t4;
        }
      }
      At(e4);
    }(this, e3);
  }
  error(e3) {
    if (!Bt(this))
      throw Dt("error");
    zt(this, e3);
  }
  [T](e3) {
    ce(this);
    const t3 = this._cancelAlgorithm(e3);
    return jt(this), t3;
  }
  [q](e3) {
    const t3 = this._controlledReadableStream;
    if (this._queue.length > 0) {
      const r3 = se(this);
      this._closeRequested && 0 === this._queue.length ? (jt(this), Xt(t3)) : At(this), e3._chunkSteps(r3);
    } else
      U(t3, e3), At(this);
  }
  [C]() {
  }
};
function Bt(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_controlledReadableStream") && e3 instanceof ReadableStreamDefaultController);
}
function At(e3) {
  const t3 = function(e4) {
    const t4 = e4._controlledReadableStream;
    if (!Ft(e4))
      return false;
    if (!e4._started)
      return false;
    if (Ut(t4) && X(t4) > 0)
      return true;
    if (Lt(e4) > 0)
      return true;
    return false;
  }(e3);
  if (!t3)
    return;
  if (e3._pulling)
    return void (e3._pullAgain = true);
  e3._pulling = true;
  b(e3._pullAlgorithm(), () => (e3._pulling = false, e3._pullAgain && (e3._pullAgain = false, At(e3)), null), (t4) => (zt(e3, t4), null));
}
function jt(e3) {
  e3._pullAlgorithm = void 0, e3._cancelAlgorithm = void 0, e3._strategySizeAlgorithm = void 0;
}
function zt(e3, t3) {
  const r3 = e3._controlledReadableStream;
  "readable" === r3._state && (ce(e3), jt(e3), Jt(r3, t3));
}
function Lt(e3) {
  const t3 = e3._controlledReadableStream._state;
  return "errored" === t3 ? null : "closed" === t3 ? 0 : e3._strategyHWM - e3._queueTotalSize;
}
function Ft(e3) {
  return !e3._closeRequested && "readable" === e3._controlledReadableStream._state;
}
function It(e3, t3, r3, o2) {
  const n2 = Object.create(ReadableStreamDefaultController.prototype);
  let a2, i3, l2;
  a2 = void 0 !== t3.start ? () => t3.start(n2) : () => {
  }, i3 = void 0 !== t3.pull ? () => t3.pull(n2) : () => c(void 0), l2 = void 0 !== t3.cancel ? (e4) => t3.cancel(e4) : () => c(void 0), function(e4, t4, r4, o3, n3, a3, i4) {
    t4._controlledReadableStream = e4, t4._queue = void 0, t4._queueTotalSize = void 0, ce(t4), t4._started = false, t4._closeRequested = false, t4._pullAgain = false, t4._pulling = false, t4._strategySizeAlgorithm = i4, t4._strategyHWM = a3, t4._pullAlgorithm = o3, t4._cancelAlgorithm = n3, e4._readableStreamController = t4, b(c(r4()), () => (t4._started = true, At(t4), null), (e5) => (zt(t4, e5), null));
  }(e3, n2, a2, i3, l2, r3, o2);
}
function Dt(e3) {
  return new TypeError(`ReadableStreamDefaultController.prototype.${e3} can only be used on a ReadableStreamDefaultController`);
}
function $t(e3, t3, r3) {
  return I(e3, r3), (r4) => w(e3, t3, [r4]);
}
function Mt(e3, t3, r3) {
  return I(e3, r3), (r4) => w(e3, t3, [r4]);
}
function Yt(e3, t3, r3) {
  return I(e3, r3), (r4) => g(e3, t3, [r4]);
}
function Qt(e3, t3) {
  if ("bytes" !== (e3 = `${e3}`))
    throw new TypeError(`${t3} '${e3}' is not a valid enumeration value for ReadableStreamType`);
  return e3;
}
function Nt(e3, t3) {
  if ("byob" !== (e3 = `${e3}`))
    throw new TypeError(`${t3} '${e3}' is not a valid enumeration value for ReadableStreamReaderMode`);
  return e3;
}
function Ht(e3, t3) {
  F2(e3, t3);
  const r3 = null == e3 ? void 0 : e3.preventAbort, o2 = null == e3 ? void 0 : e3.preventCancel, n2 = null == e3 ? void 0 : e3.preventClose, a2 = null == e3 ? void 0 : e3.signal;
  return void 0 !== a2 && function(e4, t4) {
    if (!function(e5) {
      if ("object" != typeof e5 || null === e5)
        return false;
      try {
        return "boolean" == typeof e5.aborted;
      } catch (e6) {
        return false;
      }
    }(e4))
      throw new TypeError(`${t4} is not an AbortSignal.`);
  }(a2, `${t3} has member 'signal' that`), { preventAbort: Boolean(r3), preventCancel: Boolean(o2), preventClose: Boolean(n2), signal: a2 };
}
function xt(e3, t3) {
  F2(e3, t3);
  const r3 = null == e3 ? void 0 : e3.readable;
  M(r3, "readable", "ReadableWritablePair"), function(e4, t4) {
    if (!H(e4))
      throw new TypeError(`${t4} is not a ReadableStream.`);
  }(r3, `${t3} has member 'readable' that`);
  const o2 = null == e3 ? void 0 : e3.writable;
  return M(o2, "writable", "ReadableWritablePair"), function(e4, t4) {
    if (!x2(e4))
      throw new TypeError(`${t4} is not a WritableStream.`);
  }(o2, `${t3} has member 'writable' that`), { readable: r3, writable: o2 };
}
Object.defineProperties(ReadableStreamDefaultController.prototype, { close: { enumerable: true }, enqueue: { enumerable: true }, error: { enumerable: true }, desiredSize: { enumerable: true } }), n(ReadableStreamDefaultController.prototype.close, "close"), n(ReadableStreamDefaultController.prototype.enqueue, "enqueue"), n(ReadableStreamDefaultController.prototype.error, "error"), "symbol" == typeof e2.toStringTag && Object.defineProperty(ReadableStreamDefaultController.prototype, e2.toStringTag, { value: "ReadableStreamDefaultController", configurable: true });
var ReadableStream2 = class {
  constructor(e3 = {}, t3 = {}) {
    void 0 === e3 ? e3 = null : D(e3, "First parameter");
    const r3 = Ye(t3, "Second parameter"), o2 = function(e4, t4) {
      F2(e4, t4);
      const r4 = e4, o3 = null == r4 ? void 0 : r4.autoAllocateChunkSize, n3 = null == r4 ? void 0 : r4.cancel, a2 = null == r4 ? void 0 : r4.pull, i3 = null == r4 ? void 0 : r4.start, l2 = null == r4 ? void 0 : r4.type;
      return { autoAllocateChunkSize: void 0 === o3 ? void 0 : N(o3, `${t4} has member 'autoAllocateChunkSize' that`), cancel: void 0 === n3 ? void 0 : $t(n3, r4, `${t4} has member 'cancel' that`), pull: void 0 === a2 ? void 0 : Mt(a2, r4, `${t4} has member 'pull' that`), start: void 0 === i3 ? void 0 : Yt(i3, r4, `${t4} has member 'start' that`), type: void 0 === l2 ? void 0 : Qt(l2, `${t4} has member 'type' that`) };
    }(e3, "First parameter");
    var n2;
    if ((n2 = this)._state = "readable", n2._reader = void 0, n2._storedError = void 0, n2._disturbed = false, "bytes" === o2.type) {
      if (void 0 !== r3.size)
        throw new RangeError("The strategy for a byte stream cannot have a size function");
      Oe(this, o2, $e(r3, 0));
    } else {
      const e4 = Me(r3);
      It(this, o2, $e(r3, 1), e4);
    }
  }
  get locked() {
    if (!Vt(this))
      throw Kt("locked");
    return Ut(this);
  }
  cancel(e3) {
    return Vt(this) ? Ut(this) ? d(new TypeError("Cannot cancel a stream that already has a reader")) : Gt(this, e3) : d(Kt("cancel"));
  }
  getReader(e3) {
    if (!Vt(this))
      throw Kt("getReader");
    return void 0 === function(e4, t3) {
      F2(e4, t3);
      const r3 = null == e4 ? void 0 : e4.mode;
      return { mode: void 0 === r3 ? void 0 : Nt(r3, `${t3} has member 'mode' that`) };
    }(e3, "First parameter").mode ? new ReadableStreamDefaultReader(this) : function(e4) {
      return new ReadableStreamBYOBReader(e4);
    }(this);
  }
  pipeThrough(e3, t3 = {}) {
    if (!H(this))
      throw Kt("pipeThrough");
    $(e3, 1, "pipeThrough");
    const r3 = xt(e3, "First parameter"), o2 = Ht(t3, "Second parameter");
    if (this.locked)
      throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
    if (r3.writable.locked)
      throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
    return m2(kt(this, r3.writable, o2.preventClose, o2.preventAbort, o2.preventCancel, o2.signal)), r3.readable;
  }
  pipeTo(e3, t3 = {}) {
    if (!H(this))
      return d(Kt("pipeTo"));
    if (void 0 === e3)
      return d("Parameter 1 is required in 'pipeTo'.");
    if (!x2(e3))
      return d(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
    let r3;
    try {
      r3 = Ht(t3, "Second parameter");
    } catch (e4) {
      return d(e4);
    }
    return this.locked ? d(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream")) : e3.locked ? d(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream")) : kt(this, e3, r3.preventClose, r3.preventAbort, r3.preventCancel, r3.signal);
  }
  tee() {
    if (!H(this))
      throw Kt("tee");
    if (this.locked)
      throw new TypeError("Cannot tee a stream that already has a reader");
    return Ot(this);
  }
  values(e3) {
    if (!H(this))
      throw Kt("values");
    return function(e4, t3) {
      const r3 = e4.getReader(), o2 = new te(r3, t3), n2 = Object.create(re);
      return n2._asyncIteratorImpl = o2, n2;
    }(this, function(e4, t3) {
      F2(e4, t3);
      const r3 = null == e4 ? void 0 : e4.preventCancel;
      return { preventCancel: Boolean(r3) };
    }(e3, "First parameter").preventCancel);
  }
};
function Vt(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_readableStreamController") && e3 instanceof ReadableStream2);
}
function Ut(e3) {
  return void 0 !== e3._reader;
}
function Gt(e3, r3) {
  if (e3._disturbed = true, "closed" === e3._state)
    return c(void 0);
  if ("errored" === e3._state)
    return d(e3._storedError);
  Xt(e3);
  const o2 = e3._reader;
  if (void 0 !== o2 && Fe(o2)) {
    const e4 = o2._readIntoRequests;
    o2._readIntoRequests = new S2(), e4.forEach((e5) => {
      e5._closeSteps(void 0);
    });
  }
  return p(e3._readableStreamController[T](r3), t2);
}
function Xt(e3) {
  e3._state = "closed";
  const t3 = e3._reader;
  if (void 0 !== t3 && (j(t3), K(t3))) {
    const e4 = t3._readRequests;
    t3._readRequests = new S2(), e4.forEach((e5) => {
      e5._closeSteps();
    });
  }
}
function Jt(e3, t3) {
  e3._state = "errored", e3._storedError = t3;
  const r3 = e3._reader;
  void 0 !== r3 && (A2(r3, t3), K(r3) ? Z2(r3, t3) : Ie(r3, t3));
}
function Kt(e3) {
  return new TypeError(`ReadableStream.prototype.${e3} can only be used on a ReadableStream`);
}
function Zt(e3, t3) {
  F2(e3, t3);
  const r3 = null == e3 ? void 0 : e3.highWaterMark;
  return M(r3, "highWaterMark", "QueuingStrategyInit"), { highWaterMark: Y(r3) };
}
Object.defineProperties(ReadableStream2.prototype, { cancel: { enumerable: true }, getReader: { enumerable: true }, pipeThrough: { enumerable: true }, pipeTo: { enumerable: true }, tee: { enumerable: true }, values: { enumerable: true }, locked: { enumerable: true } }), n(ReadableStream2.prototype.cancel, "cancel"), n(ReadableStream2.prototype.getReader, "getReader"), n(ReadableStream2.prototype.pipeThrough, "pipeThrough"), n(ReadableStream2.prototype.pipeTo, "pipeTo"), n(ReadableStream2.prototype.tee, "tee"), n(ReadableStream2.prototype.values, "values"), "symbol" == typeof e2.toStringTag && Object.defineProperty(ReadableStream2.prototype, e2.toStringTag, { value: "ReadableStream", configurable: true }), "symbol" == typeof e2.asyncIterator && Object.defineProperty(ReadableStream2.prototype, e2.asyncIterator, { value: ReadableStream2.prototype.values, writable: true, configurable: true });
var er = (e3) => e3.byteLength;
n(er, "size");
var ByteLengthQueuingStrategy = class {
  constructor(e3) {
    $(e3, 1, "ByteLengthQueuingStrategy"), e3 = Zt(e3, "First parameter"), this._byteLengthQueuingStrategyHighWaterMark = e3.highWaterMark;
  }
  get highWaterMark() {
    if (!rr(this))
      throw tr("highWaterMark");
    return this._byteLengthQueuingStrategyHighWaterMark;
  }
  get size() {
    if (!rr(this))
      throw tr("size");
    return er;
  }
};
function tr(e3) {
  return new TypeError(`ByteLengthQueuingStrategy.prototype.${e3} can only be used on a ByteLengthQueuingStrategy`);
}
function rr(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_byteLengthQueuingStrategyHighWaterMark") && e3 instanceof ByteLengthQueuingStrategy);
}
Object.defineProperties(ByteLengthQueuingStrategy.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), "symbol" == typeof e2.toStringTag && Object.defineProperty(ByteLengthQueuingStrategy.prototype, e2.toStringTag, { value: "ByteLengthQueuingStrategy", configurable: true });
var or = () => 1;
n(or, "size");
var CountQueuingStrategy = class {
  constructor(e3) {
    $(e3, 1, "CountQueuingStrategy"), e3 = Zt(e3, "First parameter"), this._countQueuingStrategyHighWaterMark = e3.highWaterMark;
  }
  get highWaterMark() {
    if (!ar(this))
      throw nr("highWaterMark");
    return this._countQueuingStrategyHighWaterMark;
  }
  get size() {
    if (!ar(this))
      throw nr("size");
    return or;
  }
};
function nr(e3) {
  return new TypeError(`CountQueuingStrategy.prototype.${e3} can only be used on a CountQueuingStrategy`);
}
function ar(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_countQueuingStrategyHighWaterMark") && e3 instanceof CountQueuingStrategy);
}
function ir(e3, t3, r3) {
  return I(e3, r3), (r4) => w(e3, t3, [r4]);
}
function lr(e3, t3, r3) {
  return I(e3, r3), (r4) => g(e3, t3, [r4]);
}
function sr(e3, t3, r3) {
  return I(e3, r3), (r4, o2) => w(e3, t3, [r4, o2]);
}
Object.defineProperties(CountQueuingStrategy.prototype, { highWaterMark: { enumerable: true }, size: { enumerable: true } }), "symbol" == typeof e2.toStringTag && Object.defineProperty(CountQueuingStrategy.prototype, e2.toStringTag, { value: "CountQueuingStrategy", configurable: true });
var TransformStream = class {
  constructor(e3 = {}, t3 = {}, r3 = {}) {
    void 0 === e3 && (e3 = null);
    const o2 = Ye(t3, "Second parameter"), n2 = Ye(r3, "Third parameter"), a2 = function(e4, t4) {
      F2(e4, t4);
      const r4 = null == e4 ? void 0 : e4.flush, o3 = null == e4 ? void 0 : e4.readableType, n3 = null == e4 ? void 0 : e4.start, a3 = null == e4 ? void 0 : e4.transform, i4 = null == e4 ? void 0 : e4.writableType;
      return { flush: void 0 === r4 ? void 0 : ir(r4, e4, `${t4} has member 'flush' that`), readableType: o3, start: void 0 === n3 ? void 0 : lr(n3, e4, `${t4} has member 'start' that`), transform: void 0 === a3 ? void 0 : sr(a3, e4, `${t4} has member 'transform' that`), writableType: i4 };
    }(e3, "First parameter");
    if (void 0 !== a2.readableType)
      throw new RangeError("Invalid readableType specified");
    if (void 0 !== a2.writableType)
      throw new RangeError("Invalid writableType specified");
    const i3 = $e(n2, 0), l2 = Me(n2), s3 = $e(o2, 1), f4 = Me(o2);
    let b2;
    !function(e4, t4, r4, o3, n3, a3) {
      function i4() {
        return t4;
      }
      function l3(t5) {
        return function(e5, t6) {
          const r5 = e5._transformStreamController;
          if (e5._backpressure) {
            return p(e5._backpressureChangePromise, () => {
              if ("erroring" === (Ge(e5._writable) ? e5._writable._state : e5._writableState))
                throw Ge(e5._writable) ? e5._writable._storedError : e5._writableStoredError;
              return pr(r5, t6);
            });
          }
          return pr(r5, t6);
        }(e4, t5);
      }
      function s4(t5) {
        return function(e5, t6) {
          return cr(e5, t6), c(void 0);
        }(e4, t5);
      }
      function u2() {
        return function(e5) {
          const t5 = e5._transformStreamController, r5 = t5._flushAlgorithm();
          return hr(t5), p(r5, () => {
            if ("errored" === e5._readableState)
              throw e5._readableStoredError;
            gr(e5) && wr(e5);
          }, (t6) => {
            throw cr(e5, t6), e5._readableStoredError;
          });
        }(e4);
      }
      function d2() {
        return function(e5) {
          return fr(e5, false), e5._backpressureChangePromise;
        }(e4);
      }
      function f5(t5) {
        return dr(e4, t5), c(void 0);
      }
      e4._writableState = "writable", e4._writableStoredError = void 0, e4._writableHasInFlightOperation = false, e4._writableStarted = false, e4._writable = function(e5, t5, r5, o4, n4, a4, i5) {
        return new WritableStream({ start(r6) {
          e5._writableController = r6;
          try {
            const t6 = r6.signal;
            void 0 !== t6 && t6.addEventListener("abort", () => {
              "writable" === e5._writableState && (e5._writableState = "erroring", t6.reason && (e5._writableStoredError = t6.reason));
            });
          } catch (e6) {
          }
          return p(t5(), () => (e5._writableStarted = true, Cr(e5), null), (t6) => {
            throw e5._writableStarted = true, Rr(e5, t6), t6;
          });
        }, write: (t6) => (function(e6) {
          e6._writableHasInFlightOperation = true;
        }(e5), p(r5(t6), () => (function(e6) {
          e6._writableHasInFlightOperation = false;
        }(e5), Cr(e5), null), (t7) => {
          throw function(e6, t8) {
            e6._writableHasInFlightOperation = false, Rr(e6, t8);
          }(e5, t7), t7;
        })), close: () => (function(e6) {
          e6._writableHasInFlightOperation = true;
        }(e5), p(o4(), () => (function(e6) {
          e6._writableHasInFlightOperation = false;
          "erroring" === e6._writableState && (e6._writableStoredError = void 0);
          e6._writableState = "closed";
        }(e5), null), (t6) => {
          throw function(e6, t7) {
            e6._writableHasInFlightOperation = false, e6._writableState, Rr(e6, t7);
          }(e5, t6), t6;
        })), abort: (t6) => (e5._writableState = "errored", e5._writableStoredError = t6, n4(t6)) }, { highWaterMark: a4, size: i5 });
      }(e4, i4, l3, u2, s4, r4, o3), e4._readableState = "readable", e4._readableStoredError = void 0, e4._readableCloseRequested = false, e4._readablePulling = false, e4._readable = function(e5, t5, r5, o4, n4, a4) {
        return new ReadableStream2({ start: (r6) => (e5._readableController = r6, t5().catch((t6) => {
          Sr(e5, t6);
        })), pull: () => (e5._readablePulling = true, r5().catch((t6) => {
          Sr(e5, t6);
        })), cancel: (t6) => (e5._readableState = "closed", o4(t6)) }, { highWaterMark: n4, size: a4 });
      }(e4, i4, d2, f5, n3, a3), e4._backpressure = void 0, e4._backpressureChangePromise = void 0, e4._backpressureChangePromise_resolve = void 0, fr(e4, true), e4._transformStreamController = void 0;
    }(this, u((e4) => {
      b2 = e4;
    }), s3, f4, i3, l2), function(e4, t4) {
      const r4 = Object.create(TransformStreamDefaultController.prototype);
      let o3, n3;
      o3 = void 0 !== t4.transform ? (e5) => t4.transform(e5, r4) : (e5) => {
        try {
          return _r(r4, e5), c(void 0);
        } catch (e6) {
          return d(e6);
        }
      };
      n3 = void 0 !== t4.flush ? () => t4.flush(r4) : () => c(void 0);
      !function(e5, t5, r5, o4) {
        t5._controlledTransformStream = e5, e5._transformStreamController = t5, t5._transformAlgorithm = r5, t5._flushAlgorithm = o4;
      }(e4, r4, o3, n3);
    }(this, a2), void 0 !== a2.start ? b2(a2.start(this._transformStreamController)) : b2(void 0);
  }
  get readable() {
    if (!ur(this))
      throw yr("readable");
    return this._readable;
  }
  get writable() {
    if (!ur(this))
      throw yr("writable");
    return this._writable;
  }
};
function ur(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_transformStreamController") && e3 instanceof TransformStream);
}
function cr(e3, t3) {
  Sr(e3, t3), dr(e3, t3);
}
function dr(e3, t3) {
  hr(e3._transformStreamController), function(e4, t4) {
    e4._writableController.error(t4);
    "writable" === e4._writableState && Tr(e4, t4);
  }(e3, t3), e3._backpressure && fr(e3, false);
}
function fr(e3, t3) {
  void 0 !== e3._backpressureChangePromise && e3._backpressureChangePromise_resolve(), e3._backpressureChangePromise = u((t4) => {
    e3._backpressureChangePromise_resolve = t4;
  }), e3._backpressure = t3;
}
Object.defineProperties(TransformStream.prototype, { readable: { enumerable: true }, writable: { enumerable: true } }), "symbol" == typeof e2.toStringTag && Object.defineProperty(TransformStream.prototype, e2.toStringTag, { value: "TransformStream", configurable: true });
var TransformStreamDefaultController = class {
  constructor() {
    throw new TypeError("Illegal constructor");
  }
  get desiredSize() {
    if (!br(this))
      throw mr("desiredSize");
    return vr(this._controlledTransformStream);
  }
  enqueue(e3) {
    if (!br(this))
      throw mr("enqueue");
    _r(this, e3);
  }
  error(e3) {
    if (!br(this))
      throw mr("error");
    var t3;
    t3 = e3, cr(this._controlledTransformStream, t3);
  }
  terminate() {
    if (!br(this))
      throw mr("terminate");
    !function(e3) {
      const t3 = e3._controlledTransformStream;
      gr(t3) && wr(t3);
      const r3 = new TypeError("TransformStream terminated");
      dr(t3, r3);
    }(this);
  }
};
function br(e3) {
  return !!r2(e3) && (!!Object.prototype.hasOwnProperty.call(e3, "_controlledTransformStream") && e3 instanceof TransformStreamDefaultController);
}
function hr(e3) {
  e3._transformAlgorithm = void 0, e3._flushAlgorithm = void 0;
}
function _r(e3, t3) {
  const r3 = e3._controlledTransformStream;
  if (!gr(r3))
    throw new TypeError("Readable side is not in a state that permits enqueue");
  try {
    !function(e4, t4) {
      e4._readablePulling = false;
      try {
        e4._readableController.enqueue(t4);
      } catch (t5) {
        throw Sr(e4, t5), t5;
      }
    }(r3, t3);
  } catch (e4) {
    throw dr(r3, e4), r3._readableStoredError;
  }
  const o2 = function(e4) {
    return !function(e5) {
      if (!gr(e5))
        return false;
      if (e5._readablePulling)
        return true;
      if (vr(e5) > 0)
        return true;
      return false;
    }(e4);
  }(r3);
  o2 !== r3._backpressure && fr(r3, true);
}
function pr(e3, t3) {
  return p(e3._transformAlgorithm(t3), void 0, (t4) => {
    throw cr(e3._controlledTransformStream, t4), t4;
  });
}
function mr(e3) {
  return new TypeError(`TransformStreamDefaultController.prototype.${e3} can only be used on a TransformStreamDefaultController`);
}
function yr(e3) {
  return new TypeError(`TransformStream.prototype.${e3} can only be used on a TransformStream`);
}
function gr(e3) {
  return !e3._readableCloseRequested && "readable" === e3._readableState;
}
function wr(e3) {
  e3._readableState = "closed", e3._readableCloseRequested = true, e3._readableController.close();
}
function Sr(e3, t3) {
  "readable" === e3._readableState && (e3._readableState = "errored", e3._readableStoredError = t3), e3._readableController.error(t3);
}
function vr(e3) {
  return e3._readableController.desiredSize;
}
function Rr(e3, t3) {
  "writable" !== e3._writableState ? qr(e3) : Tr(e3, t3);
}
function Tr(e3, t3) {
  e3._writableState = "erroring", e3._writableStoredError = t3, !function(e4) {
    return e4._writableHasInFlightOperation;
  }(e3) && e3._writableStarted && qr(e3);
}
function qr(e3) {
  e3._writableState = "errored";
}
function Cr(e3) {
  "erroring" === e3._writableState && qr(e3);
}
Object.defineProperties(TransformStreamDefaultController.prototype, { enqueue: { enumerable: true }, error: { enumerable: true }, terminate: { enumerable: true }, desiredSize: { enumerable: true } }), n(TransformStreamDefaultController.prototype.enqueue, "enqueue"), n(TransformStreamDefaultController.prototype.error, "error"), n(TransformStreamDefaultController.prototype.terminate, "terminate"), "symbol" == typeof e2.toStringTag && Object.defineProperty(TransformStreamDefaultController.prototype, e2.toStringTag, { value: "TransformStreamDefaultController", configurable: true });

// ../../../node_modules/.pnpm/formdata-node@5.0.1/node_modules/formdata-node/lib/blobHelpers.js
var CHUNK_SIZE = 65536;
async function* clonePart(part) {
  const end = part.byteOffset + part.byteLength;
  let position = part.byteOffset;
  while (position !== end) {
    const size = Math.min(end - position, CHUNK_SIZE);
    const chunk = part.buffer.slice(position, position + size);
    position += chunk.byteLength;
    yield new Uint8Array(chunk);
  }
}
async function* consumeNodeBlob(blob) {
  let position = 0;
  while (position !== blob.size) {
    const chunk = blob.slice(position, Math.min(blob.size, position + CHUNK_SIZE));
    const buffer = await chunk.arrayBuffer();
    position += buffer.byteLength;
    yield new Uint8Array(buffer);
  }
}
async function* consumeBlobParts(parts, clone2 = false) {
  for (const part of parts) {
    if (ArrayBuffer.isView(part)) {
      if (clone2) {
        yield* clonePart(part);
      } else {
        yield part;
      }
    } else if (isFunction(part.stream)) {
      yield* part.stream();
    } else {
      yield* consumeNodeBlob(part);
    }
  }
}
function* sliceBlob(blobParts, blobSize, start = 0, end) {
  end !== null && end !== void 0 ? end : end = blobSize;
  let relativeStart = start < 0 ? Math.max(blobSize + start, 0) : Math.min(start, blobSize);
  let relativeEnd = end < 0 ? Math.max(blobSize + end, 0) : Math.min(end, blobSize);
  const span = Math.max(relativeEnd - relativeStart, 0);
  let added = 0;
  for (const part of blobParts) {
    if (added >= span) {
      break;
    }
    const partSize = ArrayBuffer.isView(part) ? part.byteLength : part.size;
    if (relativeStart && partSize <= relativeStart) {
      relativeStart -= partSize;
      relativeEnd -= partSize;
    } else {
      let chunk;
      if (ArrayBuffer.isView(part)) {
        chunk = part.subarray(relativeStart, Math.min(partSize, relativeEnd));
        added += chunk.byteLength;
      } else {
        chunk = part.slice(relativeStart, Math.min(partSize, relativeEnd));
        added += chunk.size;
      }
      relativeEnd -= partSize;
      relativeStart = 0;
      yield chunk;
    }
  }
}

// ../../../node_modules/.pnpm/formdata-node@5.0.1/node_modules/formdata-node/lib/Blob.js
var __classPrivateFieldGet = function(receiver, state, kind, f4) {
  if (kind === "a" && !f4)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f4 : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f4 : kind === "a" ? f4.call(receiver) : f4 ? f4.value : state.get(receiver);
};
var __classPrivateFieldSet = function(receiver, state, value, kind, f4) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f4)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f4 : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f4.call(receiver, value) : f4 ? f4.value = value : state.set(receiver, value), value;
};
var _Blob_parts;
var _Blob_type;
var _Blob_size;
var Blob3 = class _Blob2 {
  static [(_Blob_parts = /* @__PURE__ */ new WeakMap(), _Blob_type = /* @__PURE__ */ new WeakMap(), _Blob_size = /* @__PURE__ */ new WeakMap(), Symbol.hasInstance)](value) {
    return Boolean(value && typeof value === "object" && isFunction(value.constructor) && (isFunction(value.stream) || isFunction(value.arrayBuffer)) && /^(Blob|File)$/.test(value[Symbol.toStringTag]));
  }
  constructor(blobParts = [], options = {}) {
    _Blob_parts.set(this, []);
    _Blob_type.set(this, "");
    _Blob_size.set(this, 0);
    options !== null && options !== void 0 ? options : options = {};
    if (typeof blobParts !== "object" || blobParts === null) {
      throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
    }
    if (!isFunction(blobParts[Symbol.iterator])) {
      throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
    }
    if (typeof options !== "object" && !isFunction(options)) {
      throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
    }
    const encoder = new TextEncoder();
    for (const raw of blobParts) {
      let part;
      if (ArrayBuffer.isView(raw)) {
        part = new Uint8Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
      } else if (raw instanceof ArrayBuffer) {
        part = new Uint8Array(raw.slice(0));
      } else if (raw instanceof _Blob2) {
        part = raw;
      } else {
        part = encoder.encode(String(raw));
      }
      __classPrivateFieldSet(this, _Blob_size, __classPrivateFieldGet(this, _Blob_size, "f") + (ArrayBuffer.isView(part) ? part.byteLength : part.size), "f");
      __classPrivateFieldGet(this, _Blob_parts, "f").push(part);
    }
    const type = options.type === void 0 ? "" : String(options.type);
    __classPrivateFieldSet(this, _Blob_type, /^[\x20-\x7E]*$/.test(type) ? type : "", "f");
  }
  get type() {
    return __classPrivateFieldGet(this, _Blob_type, "f");
  }
  get size() {
    return __classPrivateFieldGet(this, _Blob_size, "f");
  }
  slice(start, end, contentType) {
    return new _Blob2(sliceBlob(__classPrivateFieldGet(this, _Blob_parts, "f"), this.size, start, end), {
      type: contentType
    });
  }
  async text() {
    const decoder = new TextDecoder();
    let result = "";
    for await (const chunk of consumeBlobParts(__classPrivateFieldGet(this, _Blob_parts, "f"))) {
      result += decoder.decode(chunk, { stream: true });
    }
    result += decoder.decode();
    return result;
  }
  async arrayBuffer() {
    const view = new Uint8Array(this.size);
    let offset = 0;
    for await (const chunk of consumeBlobParts(__classPrivateFieldGet(this, _Blob_parts, "f"))) {
      view.set(chunk, offset);
      offset += chunk.length;
    }
    return view.buffer;
  }
  stream() {
    const iterator = consumeBlobParts(__classPrivateFieldGet(this, _Blob_parts, "f"), true);
    return new ReadableStream2({
      async pull(controller) {
        const { value, done } = await iterator.next();
        if (done) {
          return queueMicrotask(() => controller.close());
        }
        controller.enqueue(value);
      },
      async cancel() {
        await iterator.return();
      }
    });
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
};
Object.defineProperties(Blob3.prototype, {
  type: { enumerable: true },
  size: { enumerable: true },
  slice: { enumerable: true },
  stream: { enumerable: true },
  text: { enumerable: true },
  arrayBuffer: { enumerable: true }
});

// ../../../node_modules/.pnpm/formdata-node@5.0.1/node_modules/formdata-node/lib/isBlob.js
var isBlob2 = (value) => value instanceof Blob3;

// ../../../node_modules/.pnpm/formdata-node@5.0.1/node_modules/formdata-node/lib/File.js
var __classPrivateFieldSet2 = function(receiver, state, value, kind, f4) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f4)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f4 : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f4.call(receiver, value) : f4 ? f4.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet2 = function(receiver, state, kind, f4) {
  if (kind === "a" && !f4)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f4 : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f4 : kind === "a" ? f4.call(receiver) : f4 ? f4.value : state.get(receiver);
};
var _File_name;
var _File_lastModified;
var File3 = class extends Blob3 {
  static [(_File_name = /* @__PURE__ */ new WeakMap(), _File_lastModified = /* @__PURE__ */ new WeakMap(), Symbol.hasInstance)](value) {
    return value instanceof Blob3 && value[Symbol.toStringTag] === "File" && typeof value.name === "string";
  }
  constructor(fileBits, name, options = {}) {
    super(fileBits, options);
    _File_name.set(this, void 0);
    _File_lastModified.set(this, 0);
    if (arguments.length < 2) {
      throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`);
    }
    __classPrivateFieldSet2(this, _File_name, String(name), "f");
    const lastModified = options.lastModified === void 0 ? Date.now() : Number(options.lastModified);
    if (!Number.isNaN(lastModified)) {
      __classPrivateFieldSet2(this, _File_lastModified, lastModified, "f");
    }
  }
  get name() {
    return __classPrivateFieldGet2(this, _File_name, "f");
  }
  get webkitRelativePath() {
    return "";
  }
  get lastModified() {
    return __classPrivateFieldGet2(this, _File_lastModified, "f");
  }
  get [Symbol.toStringTag]() {
    return "File";
  }
};

// ../../../node_modules/.pnpm/formdata-node@5.0.1/node_modules/formdata-node/lib/isFile.js
var isFile = (value) => value instanceof File3;

// ../../../node_modules/.pnpm/formdata-node@5.0.1/node_modules/formdata-node/lib/FormData.js
var __classPrivateFieldGet3 = function(receiver, state, kind, f4) {
  if (kind === "a" && !f4)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f4 : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f4 : kind === "a" ? f4.call(receiver) : f4 ? f4.value : state.get(receiver);
};
var _FormData_instances;
var _FormData_entries;
var _FormData_setEntry;
var FormData3 = class {
  constructor() {
    _FormData_instances.add(this);
    _FormData_entries.set(this, /* @__PURE__ */ new Map());
  }
  static [(_FormData_entries = /* @__PURE__ */ new WeakMap(), _FormData_instances = /* @__PURE__ */ new WeakSet(), Symbol.hasInstance)](value) {
    if (!value) {
      return false;
    }
    const val = value;
    return Boolean(isFunction(val.constructor) && val[Symbol.toStringTag] === "FormData" && isFunction(val.append) && isFunction(val.set) && isFunction(val.get) && isFunction(val.getAll) && isFunction(val.has) && isFunction(val.delete) && isFunction(val.entries) && isFunction(val.values) && isFunction(val.keys) && isFunction(val[Symbol.iterator]) && isFunction(val.forEach));
  }
  append(name, value, fileName) {
    __classPrivateFieldGet3(this, _FormData_instances, "m", _FormData_setEntry).call(this, {
      name,
      fileName,
      append: true,
      rawValue: value,
      argsLength: arguments.length
    });
  }
  set(name, value, fileName) {
    __classPrivateFieldGet3(this, _FormData_instances, "m", _FormData_setEntry).call(this, {
      name,
      fileName,
      append: false,
      rawValue: value,
      argsLength: arguments.length
    });
  }
  get(name) {
    const field = __classPrivateFieldGet3(this, _FormData_entries, "f").get(String(name));
    if (!field) {
      return null;
    }
    return field[0];
  }
  getAll(name) {
    const field = __classPrivateFieldGet3(this, _FormData_entries, "f").get(String(name));
    if (!field) {
      return [];
    }
    return field.slice();
  }
  has(name) {
    return __classPrivateFieldGet3(this, _FormData_entries, "f").has(String(name));
  }
  delete(name) {
    __classPrivateFieldGet3(this, _FormData_entries, "f").delete(String(name));
  }
  *keys() {
    for (const key of __classPrivateFieldGet3(this, _FormData_entries, "f").keys()) {
      yield key;
    }
  }
  *entries() {
    for (const name of this.keys()) {
      const values = this.getAll(name);
      for (const value of values) {
        yield [name, value];
      }
    }
  }
  *values() {
    for (const [, value] of this) {
      yield value;
    }
  }
  [(_FormData_setEntry = function _FormData_setEntry2({ name, rawValue, append, fileName, argsLength }) {
    const methodName = append ? "append" : "set";
    if (argsLength < 2) {
      throw new TypeError(`Failed to execute '${methodName}' on 'FormData': 2 arguments required, but only ${argsLength} present.`);
    }
    name = String(name);
    let value;
    if (isFile(rawValue)) {
      value = fileName === void 0 ? rawValue : new File3([rawValue], fileName, {
        type: rawValue.type,
        lastModified: rawValue.lastModified
      });
    } else if (isBlob2(rawValue)) {
      value = new File3([rawValue], fileName === void 0 ? "blob" : fileName, {
        type: rawValue.type
      });
    } else if (fileName) {
      throw new TypeError(`Failed to execute '${methodName}' on 'FormData': parameter 2 is not of type 'Blob'.`);
    } else {
      value = String(rawValue);
    }
    const values = __classPrivateFieldGet3(this, _FormData_entries, "f").get(name);
    if (!values) {
      return void __classPrivateFieldGet3(this, _FormData_entries, "f").set(name, [value]);
    }
    if (!append) {
      return void __classPrivateFieldGet3(this, _FormData_entries, "f").set(name, [value]);
    }
    values.push(value);
  }, Symbol.iterator)]() {
    return this.entries();
  }
  forEach(callback, thisArg) {
    for (const [name, value] of this) {
      callback.call(thisArg, value, name, this);
    }
  }
  get [Symbol.toStringTag]() {
    return "FormData";
  }
};

// main.ts
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
  const p2 = core.getInput("path");
  const os = core.getInput("os").replace("-latest", "");
  const workspace = core.getInput("workspace");
  const fullPath = path.resolve(p2);
  const upload = async (file, i3 = 0) => {
    if (i3 > 2) {
      return "error";
    }
    try {
      const form = new FormData3();
      form.set("image", file.toString("base64"));
      const res = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Client-ID 11eb8a62f4c7927`
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        body: form
      }).then(handleErrors);
      const link = (await res.json()).data.link;
      if (!link) {
        throw new Error("no link");
      }
      return link;
    } catch (e3) {
      await wait(3e3);
      console.log(e3);
      core.debug(e3);
      core.setOutput("error", e3);
      return await upload(file, i3 + 1);
    }
  };
  const getAllFiles = (currentPath) => {
    let results2 = [];
    const dirents = fs2.readdirSync(currentPath, { withFileTypes: true });
    dirents.forEach((dirent) => {
      if (dirent.name.toLocaleLowerCase().includes("retry") || dirent.name.endsWith(".zip"))
        return;
      const newPath = path.resolve(currentPath, dirent.name);
      const stat2 = fs2.statSync(newPath);
      if (stat2 && stat2.isDirectory()) {
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
    fs2.writeFileSync(`${workspace}/images-${os}.json`, JSON.stringify([]));
    return core.setOutput("images", []);
  }
  const resultsP = files.map(async (file) => {
    const img = fs2.readFileSync(`${file}`);
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
  fs2.writeFileSync(`${workspace}/images-${os}.json`, final);
  core.setOutput("images", final);
};
uploadImage().catch((err) => {
  core.setFailed(err);
});
/*! Bundled license information:

fetch-blob/index.js:
  (*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)

formdata-polyfill/esm.min.js:
  (*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)

node-domexception/index.js:
  (*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> *)

web-streams-polyfill/dist/ponyfill.mjs:
  (**
   * @license
   * web-streams-polyfill v4.0.0-beta.3
   * Copyright 2021 Mattias Buelens, Diwank Singh Tomer and other contributors.
   * This code is released under the MIT license.
   * SPDX-License-Identifier: MIT
   *)

formdata-node/lib/blobHelpers.js:
  (*! Based on fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> & David Frank *)

formdata-node/lib/Blob.js:
  (*! Based on fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> & David Frank *)
*/
