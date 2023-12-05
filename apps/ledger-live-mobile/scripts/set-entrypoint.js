#!/bin/node
const fs = require("fs");

//Obtain the entrypoint string passed to the node script
const entrypoint = { storybook: process.argv[2] === "isStorybook" };

//copy the json inside the entrypoint.json file
fs.writeFileSync("entrypoint.json", JSON.stringify(entrypoint, undefined, 2));
