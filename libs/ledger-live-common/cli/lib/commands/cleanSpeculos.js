"use strict";
exports.__esModule = true;
/* eslint-disable no-console */
var child_process_1 = require("child_process");
var rxjs_1 = require("rxjs");
exports["default"] = {
    description: "clean all docker instance of speculos",
    args: [],
    job: function () {
        var instances = (0, child_process_1.execSync)("docker ps -a -q --filter name=speculos")
            .toString()
            .split(/\s/g)
            .filter(Boolean);
        if (instances.length > 0) {
            (0, child_process_1.execSync)("docker container rm -f " + instances.join(" "));
        }
        return (0, rxjs_1.of)(instances.join(" "));
    }
};
//# sourceMappingURL=cleanSpeculos.js.map