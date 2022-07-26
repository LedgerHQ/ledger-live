"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.jsonFromFile = exports.apdusFromFile = exports.fromFile = exports.fromNodeStream = void 0;
var fs_1 = __importDefault(require("fs"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var fromNodeStream = function (stream) {
    return rxjs_1.Observable.create(function (o) {
        var endHandler = function () { return o.complete(); };
        var errorHandler = function (e) { return o.error(e); };
        var dataHandler = function (data) { return o.next(data); };
        stream.addListener("end", endHandler);
        stream.addListener("error", errorHandler);
        stream.addListener("data", dataHandler);
        return function () {
            stream.removeListener("end", endHandler);
            stream.removeListener("error", errorHandler);
            stream.removeListener("data", dataHandler);
        };
    });
};
exports.fromNodeStream = fromNodeStream;
var fromFile = function (file) {
    return (0, exports.fromNodeStream)(file === "-" ? process.stdin : fs_1["default"].createReadStream(file));
};
exports.fromFile = fromFile;
var apdusFromFile = function (file) {
    return (0, exports.fromFile)(file).pipe((0, operators_1.map)(function (b) { return b.toString(); }), (0, operators_1.concatMap)(function (str) {
        return str
            .replace(/ /g, "")
            .split("\n") // we supports => <= recorded files but will just clear out the <= and =>
            .filter(function (line) { return !line.startsWith("<="); }) // we remove the responses
            .map(function (line) { return (line.startsWith("=>") ? line.slice(2) : line); }) // we just keep the sending
            .filter(Boolean);
    }), (0, operators_1.map)(function (line) { return Buffer.from(line, "hex"); }));
};
exports.apdusFromFile = apdusFromFile;
var jsonFromFile = function (file, rawValue) {
    if (rawValue === void 0) { rawValue = false; }
    return rxjs_1.Observable.create(function (o) {
        var acc = "";
        var count = 0;
        return (0, exports.fromFile)(file).subscribe({
            error: function (e) { return o.error(e); },
            complete: function () { return o.complete(); },
            next: function (chunk) {
                var lastIndex = 0;
                var str = chunk.toString();
                for (var i = 0; i < str.length; i++) {
                    switch (str[i]) {
                        case "[":
                        case "{":
                            count++;
                            break;
                        case "]":
                        case "}":
                            count--;
                            if (count === 0) {
                                acc += str.slice(lastIndex, i + 1);
                                lastIndex = i + 1;
                                try {
                                    o.next(rawValue ? acc : JSON.parse(acc));
                                }
                                catch (e) {
                                    o.error(e);
                                }
                                acc = "";
                            }
                            break;
                        default:
                    }
                }
                acc += str.slice(lastIndex);
            }
        });
    });
};
exports.jsonFromFile = jsonFromFile;
//# sourceMappingURL=stream.js.map