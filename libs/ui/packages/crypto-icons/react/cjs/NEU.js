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
  default: () => NEU_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#B3BA00";
function NEU({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M9.848 7.998l-.098.06L14.25 15V8.051L12.003 6.75 9.848 7.998zm-.098 7.876l2.352 1.376 2.148-1.254L9.75 9v6.874zM7.5 9.267v5.466L9 15.75v-7.5L7.5 9.267zM15 15.75l1.5-1.04V9.29L15 8.25v7.5z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 3c-4.969 0-9 4.031-9 9s4.031 9 9 9 9-4.031 9-9-4.031-9-9-9zm-.037 14.715l-4.857-2.88V9.084l4.857-2.872 4.857 2.872v5.752l-4.857 2.878v.001z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9.848 7.998l-.098.06L14.25 15V8.051L12.003 6.75 9.848 7.998zm-.098 7.876l2.352 1.376 2.148-1.254L9.75 9v6.874zM7.5 9.267v5.466L9 15.75v-7.5L7.5 9.267zM15 15.75l1.5-1.04V9.29L15 8.25v7.5z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 3c-4.969 0-9 4.031-9 9s4.031 9 9 9 9-4.031 9-9-4.031-9-9-9zm-.037 14.715l-4.857-2.88V9.084l4.857-2.872 4.857 2.872v5.752l-4.857 2.878v.001z"
  }));
}
NEU.DefaultColor = DefaultColor;
var NEU_default = NEU;
//# sourceMappingURL=NEU.js.map
