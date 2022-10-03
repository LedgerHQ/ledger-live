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
  default: () => XEM_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#67B2E8";
function XEM({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M4.608 8.216A14.875 14.875 0 014.5 6.477a15.166 15.166 0 017.81-1.974c.426.009 1.043.056 1.51.106a4.505 4.505 0 00-2.376 3.884 4.09 4.09 0 01-.135 1.014 3.397 3.397 0 01-6.352.504 1.108 1.108 0 01-.075-.225 15.132 15.132 0 01-.274-1.57zm12.46 6.42c-.178.277-.367.547-.564.814a4.423 4.423 0 00-.547-2.168 4.45 4.45 0 00-1.61-1.697l-.067-.042a5.095 5.095 0 01-.112-.067c-.853-.542-1.373-1.301-1.556-2.28A3.389 3.389 0 0115.15 5.28a3.358 3.358 0 011.827.062c.465.147.934.338 1.506.606.33.155.663.327 1.017.528a15.093 15.093 0 01-.339 3.11 15.11 15.11 0 01-2.092 5.049zM14.79 17.39A15.395 15.395 0 0112 19.5a15.281 15.281 0 01-6.229-7.02 4.52 4.52 0 004.525.009c.396-.226.83-.371 1.28-.428a3.39 3.39 0 013.677 2.404c.251.841.178 1.667-.212 2.48-.033.07-.062.125-.13.258l-.032.065a.437.437 0 01-.089.122z"
  }));
}
XEM.DefaultColor = DefaultColor;
var XEM_default = XEM;
//# sourceMappingURL=XEM.js.map
