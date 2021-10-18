"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.palettes = void 0;
var dark_1 = __importDefault(require("./dark"));
var light_1 = __importDefault(require("./light"));
exports.palettes = {
    dark: dark_1.default,
    light: light_1.default,
};
