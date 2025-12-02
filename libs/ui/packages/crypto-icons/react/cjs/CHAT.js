"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var CHAT_exports = {};
__export(CHAT_exports, {
  default: () => CHAT_default
});
module.exports = __toCommonJS(CHAT_exports);
var React = __toESM(require("react"));
var import_StyledSvg = __toESM(require("./StyledSvg"));
const DefaultColor = "#1c98f7";
function CHAT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M12.21 17.494a8.6 8.6 0 001.563-.255c.632.192 1.3.236 1.952.127l.078-.006c.232 0 .537.135.982.42v-.469a.46.46 0 01.233-.398q.291-.165.538-.374c.648-.549 1.014-1.281 1.014-2.057q0-.39-.12-.754.296-.55.471-1.147a3.44 3.44 0 01.579 1.902c0 1.053-.49 2.036-1.339 2.754q-.212.18-.446.332v1.096a.466.466 0 01-.742.37q-.435-.326-.9-.608-.132-.08-.276-.14a5 5 0 01-.779.057 4.93 4.93 0 01-2.807-.85zm-5.6-2.192c-1.338-1.134-2.11-2.68-2.11-4.337 0-3.385 3.194-6.09 7.093-6.09s7.093 2.705 7.093 6.09c0 3.386-3.194 6.09-7.093 6.09q-.659 0-1.296-.1c-.184.043-.918.48-1.977 1.252a.581.581 0 01-.926-.462v-1.869a7 7 0 01-.784-.574m3.712.5q.05 0 .098.007.575.098 1.173.098c3.294 0 5.93-2.234 5.93-4.942s-2.636-4.941-5.93-4.941-5.93 2.233-5.93 4.941c0 1.31.615 2.543 1.704 3.465q.412.348.897.624a.57.57 0 01.293.498v1.078c.837-.562 1.387-.828 1.765-.828M8.57 12.115a.925.925 0 01-.93-.92c0-.508.416-.92.93-.92.513 0 .93.412.93.92s-.417.92-.93.92m3.023 0a.925.925 0 01-.93-.92c0-.508.416-.92.93-.92s.93.412.93.92-.416.92-.93.92m3.023 0a.925.925 0 01-.93-.92c0-.508.416-.92.93-.92s.93.412.93.92-.416.92-.93.92", clipRule: "evenodd" }));
}
CHAT.DefaultColor = DefaultColor;
var CHAT_default = CHAT;
//# sourceMappingURL=CHAT.js.map
