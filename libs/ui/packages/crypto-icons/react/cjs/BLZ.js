var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  default: () => BLZ_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#18578C";
function BLZ({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.725 15.252a1.314 1.314 0 010 1.833 1.257 1.257 0 01-1.8.002 1.309 1.309 0 010-1.837 1.257 1.257 0 011.8.002zm8.297-8.707a1.297 1.297 0 01.786 1.199c0 .525-.31.997-.786 1.198a1.255 1.255 0 01-1.387-.281 1.309 1.309 0 010-1.834 1.256 1.256 0 011.387-.282zm-8.464 7.707l1.227-1.257a2.448 2.448 0 001.347 1.373l-1.23 1.253-1.345-1.369zM15.83 9.65l-1.23 1.255c-.12-.309-.301-.589-.533-.824a2.42 2.42 0 00-.81-.545l1.23-1.254 1.343 1.368zm-.515 5.957a1.273 1.273 0 011.177-.8c.515 0 .98.316 1.177.8a1.317 1.317 0 01-.277 1.414 1.26 1.26 0 01-1.389.281 1.263 1.263 0 01-.411-.281 1.315 1.315 0 01-.277-1.414zM6.776 7.133a1.274 1.274 0 011.177-.801c.515 0 .98.315 1.177.8a1.317 1.317 0 01-.276 1.414 1.26 1.26 0 01-1.801 0 1.315 1.315 0 01-.277-1.413zm7.609 8.433l-1.234-1.25a2.449 2.449 0 001.347-1.373l1.23 1.254-1.343 1.369zm-4.38-7.358l1.23 1.255a2.377 2.377 0 00-.808.542 2.487 2.487 0 00-.536.826l-1.23-1.253 1.343-1.37zm2.206-1.11a1.287 1.287 0 01-1.275-1.3c0-.718.57-1.298 1.275-1.298.337 0 .662.136.901.38.24.244.374.574.373.918 0 .718-.57 1.3-1.275 1.3zm1.275 11.104c0 .717-.572 1.298-1.275 1.298a1.287 1.287 0 01-1.275-1.298c0-.717.57-1.3 1.275-1.3.337 0 .662.137.901.381.24.244.374.574.373.919zm-.813-10.425v1.608a2.306 2.306 0 00-.802 0V7.777h.803zm0 6.909v1.608h-.802v-1.609c.265.047.537.047.803 0zm4-2.544a1.316 1.316 0 01.276-1.415 1.257 1.257 0 011.39-.283 1.313 1.313 0 01.414 2.119 1.262 1.262 0 01-2.08-.421zm-11.798-.277c0-.717.57-1.298 1.275-1.298.704 0 1.274.58 1.275 1.297 0 .345-.135.675-.373.919a1.262 1.262 0 01-.902.38 1.287 1.287 0 01-1.275-1.297v-.001zm11.312.409l-1.578-.002c.046-.27.046-.547 0-.817h1.578v.819zm-6.482 0H8.126v-.818h1.579c-.046.27-.046.547 0 .818zm2.467 1.528c-.998 0-1.807-.825-1.807-1.841s.81-1.841 1.807-1.841c.998 0 1.807.825 1.808 1.841 0 1.016-.81 1.84-1.808 1.84z"
  }));
}
BLZ.DefaultColor = DefaultColor;
var BLZ_default = BLZ;
//# sourceMappingURL=BLZ.js.map
