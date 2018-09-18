// @flow
/* eslint-disable no-unused-vars */

// The code here is only enabled in development and allows to investigate performance
// https://github.com/jondot/rn-snoopy

// core Snoopy
import Snoopy from "rn-snoopy";

// some Snoopy goodies we're going to use
import bars from "rn-snoopy/stream/bars";
import filter from "rn-snoopy/stream/filter";
import buffer from "rn-snoopy/stream/buffer";

import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";

const emitter = new EventEmitter();

const events = Snoopy.stream(emitter);

// see all new views
// filter({ method: "createView" }, true)(events).subscribe();

bars()(buffer()(events)).subscribe();
