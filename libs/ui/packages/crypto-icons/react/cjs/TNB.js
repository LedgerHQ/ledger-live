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
  default: () => TNB_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FFC04E";
function TNB({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.698 8.893h.003l-.023.097-.195.92h-.022l-1.285 5.465H8.542l1.31-5.464H7.653l-1.234 5.464H4.622l1.633-6.75h5.5l-.057.268zm3.106-.268h2.723c2.342.107 2.124 1.66 2.124 1.66h.599l-.218.643h-.545c-.162.59-1.252.911-1.252.911 1.252.161 1.198 1.125 1.198 1.125h.6l-.164.643h-.49c-.126.893-.917 1.326-1.567 1.533a4.014 4.014 0 01-1.215.182H13.17l1.634-6.697zM5.492 9.911H3.75l.327-1.286h1.742l-.327 1.286zm7.461 4.714l-1.416-3.322.6-2.57 1.415 3.16-.599 2.732zm4.166-3.322a.736.736 0 00.52-.211.717.717 0 000-1.023.74.74 0 00-.52-.212h-1.061l-.327 1.446h1.388zm-.367 2.786c.488 0 .884-.372.884-.83 0-.459-.393-.83-.884-.83h-1.276l-.394 1.66h1.67z"
  }));
}
TNB.DefaultColor = DefaultColor;
var TNB_default = TNB;
//# sourceMappingURL=TNB.js.map
