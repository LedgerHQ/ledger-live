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
  default: () => CTR_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function CTR({
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
    d: "M12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5zm0-1.16a7.09 7.09 0 100-14.18 7.09 7.09 0 000 14.18zm.054-2.184c-2.698 0-4.87-2.063-4.87-4.879V12c0-2.75 2.118-4.905 4.978-4.905 1.929 0 3.17.809 4.007 1.967l-1.97 1.523c-.54-.674-1.16-1.105-2.064-1.105-1.322 0-2.253 1.118-2.253 2.493V12c0 1.415.93 2.52 2.253 2.52.985 0 1.565-.457 2.132-1.145l1.97 1.402c-.891 1.226-2.092 2.129-4.183 2.129z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5zm0-1.16a7.09 7.09 0 100-14.18 7.09 7.09 0 000 14.18zm.054-2.184c-2.698 0-4.87-2.063-4.87-4.879V12c0-2.75 2.118-4.905 4.978-4.905 1.929 0 3.17.809 4.007 1.967l-1.97 1.523c-.54-.674-1.16-1.105-2.064-1.105-1.322 0-2.253 1.118-2.253 2.493V12c0 1.415.93 2.52 2.253 2.52.985 0 1.565-.457 2.132-1.145l1.97 1.402c-.891 1.226-2.092 2.129-4.183 2.129z"
  }));
}
CTR.DefaultColor = DefaultColor;
var CTR_default = CTR;
//# sourceMappingURL=CTR.js.map
