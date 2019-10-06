/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
module.exports.defer = function defer() {
  let resolve, reject;
  let promise = new Promise(function(success, failure) {
    resolve = success;
    reject = failure;
  });
  if (!resolve || !reject) throw "defer() error"; // this never happens and is just to make flow happy
  return { promise, resolve, reject };
};
// TODO use bip32-path library
module.exports.splitPath = function splitPath(path) {
  let result = [];
  let components = path.split("/");
  components.forEach(element => {
    let number = parseInt(element, 10);
    if (isNaN(number)) {
      return; // FIXME shouldn't it throws instead?
    }
    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }
    result.push(number);
  });
  return result;
};
// TODO use async await
module.exports.eachSeries = function eachSeries(arr, fun) {
  return arr.reduce((p, e) => p.then(() => fun(e)), Promise.resolve());
};
module.exports.foreach = function foreach(arr, callback) {
  function iterate(index, array, result) {
    if (index >= array.length) {
      return result;
    } else
      return callback(array[index], index).then(function(res) {
        result.push(res);
        return iterate(index + 1, array, result);
      });
  }
  return Promise.resolve().then(() => iterate(0, arr, []));
};
module.exports.doIf = function doIf(condition, callback) {
  return Promise.resolve().then(() => {
    if (condition) {
      return callback();
    }
  });
};
module.exports.asyncWhile = function asyncWhile(predicate, callback) {
  function iterate(result) {
    if (!predicate()) {
      return result;
    } else {
      return callback().then(res => {
        result.push(res);
        return iterate(result);
      });
    }
  }
  return Promise.resolve([]).then(iterate);
};
module.exports.delay = function(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
};
