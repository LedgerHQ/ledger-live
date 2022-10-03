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
  default: () => EVX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function EVX({
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
    d: "M7.562 12.908l-1.964 1.965-.922.922A8.203 8.203 0 013.75 12c0-4.549 3.701-8.25 8.25-8.25 4.549 0 8.25 3.701 8.25 8.25 0 4.549-3.701 8.25-8.25 8.25a8.206 8.206 0 01-4.732-1.496 8.304 8.304 0 01-.958-.786l.871-.872 6.313-6.313a1.216 1.216 0 012.024-.803c.223.201.363.478.394.777l2.905 2.906A7.024 7.024 0 0012 4.983a7.024 7.024 0 00-6.84 8.584L7.024 11.7a1.216 1.216 0 011.978-.74c.219.183.366.436.416.717l1.188 1.186-.873.872-.835-.836a1.208 1.208 0 01-1.337.008zm6.531-.98l-5.938 5.938A6.976 6.976 0 0012 19.017a7.026 7.026 0 006.364-4.063l-3.033-3.035a1.207 1.207 0 01-1.238.009zm.633-1.587a.547.547 0 10-.038 1.093.547.547 0 00.038-1.093zm-6.495.995a.546.546 0 100 1.092.546.546 0 000-1.092z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M7.562 12.908l-1.964 1.965-.922.922A8.203 8.203 0 013.75 12c0-4.549 3.701-8.25 8.25-8.25 4.549 0 8.25 3.701 8.25 8.25 0 4.549-3.701 8.25-8.25 8.25a8.206 8.206 0 01-4.732-1.496 8.304 8.304 0 01-.958-.786l.871-.872 6.313-6.313a1.216 1.216 0 012.024-.803c.223.201.363.478.394.777l2.905 2.906A7.024 7.024 0 0012 4.983a7.024 7.024 0 00-6.84 8.584L7.024 11.7a1.216 1.216 0 011.978-.74c.219.183.366.436.416.717l1.188 1.186-.873.872-.835-.836a1.208 1.208 0 01-1.337.008zm6.531-.98l-5.938 5.938A6.976 6.976 0 0012 19.017a7.026 7.026 0 006.364-4.063l-3.033-3.035a1.207 1.207 0 01-1.238.009zm.633-1.587a.547.547 0 10-.038 1.093.547.547 0 00.038-1.093zm-6.495.995a.546.546 0 100 1.092.546.546 0 000-1.092z"
  }));
}
EVX.DefaultColor = DefaultColor;
var EVX_default = EVX;
//# sourceMappingURL=EVX.js.map
