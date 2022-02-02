/**
 * @overview A minimalistic wrapper around React Native's AsyncStorage.
 * @license MIT
 */
 import AsyncStorage from '@react-native-async-storage/async-storage';
 import { stringify, parse } from "zipson"
 import { merge } from 'lodash';
 
const COMPRESSED_KEY = "_-_COMPRESSED";
const CHUNK_SIZE = 1000000;

const getChunks = (str, size) => {
    const strLength = str.length;
    const numChunks = Math.ceil(strLength / size);
    const chunks = new Array(numChunks);
  
    let i = 0;
    let o = 0;
  
    for (; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }
  
    return chunks;
  }

const stringifyPairs = (pairs) => {
    return pairs.reduce((acc, current) => {
        const key = current[0];
        const data = JSON.stringify(current[1]);

        if (data.length > CHUNK_SIZE) {
            const chunks = getChunks(stringify(current[1]), CHUNK_SIZE);
            const numberOfChunks = chunks.length;
            return [...acc, [current[0], COMPRESSED_KEY + numberOfChunks], ...chunks.map((chunk, index) => [key + COMPRESSED_KEY + index, chunk])]
        } else {
            return [...acc, [key, data]]
        }  
    }, [])
  }

const getCompressedValue = async (key, value) => {
      console.log({key});
      if (value && value.includes(COMPRESSED_KEY)) {
        const numberOfChunk = Number(value.replace(COMPRESSED_KEY, ""))
        const keys = []
        for (let i = 0; i < numberOfChunk; i++) {
            keys.push(key + COMPRESSED_KEY + i)
        }
        const values = await AsyncStorage.multiGet(keys);
        const concatString = values.reduce((acc, current) => {
            return acc + current[1]
        }, "")
        return parse(concatString)
      }
      return JSON.parse(value)
  }


 const deviceStorage = {
     /**
      * Get a one or more value for a key or array of keys from AsyncStorage
      * @param {String|Array} key A key or array of keys
      * @return {Promise}
      */
     async get(key) {
         if(!Array.isArray(key)) {
             const value = await AsyncStorage.getItem(key);
             return await getCompressedValue(key, value);
         } else {
             const values = await AsyncStorage.multiGet(key);
             const data = values.map(value => {
                return getCompressedValue(value[0], value[1]);
            });
            return Promise.all(data);
         }
     },
 
     /**
      * Save a key value pair or a series of key value pairs to AsyncStorage.
      * @param  {String|Array} key The key or an array of key/value pairs
      * @param  {Any} value The value to save
      * @return {Promise}
      */
     save(key, value) {
         let pairs = [];
         if(!Array.isArray(key)) {
             pairs.push([key, value]);
         } else {
            pairs = key.map(function(pair) {
                 return [pair[0], pair[1]];
             });
         }

         console.log({pairs});
         console.log(stringifyPairs(pairs))

         return AsyncStorage.multiSet(stringifyPairs(pairs));
     },
 
     /**
      * Updates the value in the store for a given key in AsyncStorage. If the value is a string it will be replaced. If the value is an object it will be deep merged.
      * @param  {String} key The key
      * @param  {Value} value The value to update with
      * @return {Promise}
      */
     update(key, value) {
         return deviceStorage.get(key).then(item => {
             value = typeof value === 'string' ? value : merge({}, item, value);
             return deviceStorage.save(key, value);
         });
     },
 
     /**
      * Delete the value for a given key in AsyncStorage.
      * @param  {String|Array} key The key or an array of keys to be deleted
      * @return {Promise}
      */
     delete(key) {
         if (Array.isArray(key)) {
             return AsyncStorage.multiRemove(key);
         } else {
             return AsyncStorage.removeItem(key);
         }
     },
 
     /**
      * Get all keys in AsyncStorage.
      * @return {Promise} A promise which when it resolves gets passed the saved keys in AsyncStorage.
      */
     keys() {
         return AsyncStorage.getAllKeys().then((keys) => keys.filter(key => !key.includes(COMPRESSED_KEY)));
     },
 
     /**
      * Push a value onto an array stored in AsyncStorage by key or create a new array in AsyncStorage for a key if it's not yet defined.
      * @param {String} key They key
      * @param {Any} value The value to push onto the array
      * @return {Promise}
      */
     push(key, value) {
         return deviceStorage.get(key).then((currentValue) => {
             if (currentValue === null) {
                 // if there is no current value populate it with the new value
                 return deviceStorage.save(key, [value]);
             }
             if (Array.isArray(currentValue)) {
                 return deviceStorage.save(key, [...currentValue, value]);
             }
             throw new Error(`Existing value for key "${key}" must be of type null or Array, received ${typeof currentValue}.`);
         });
     },
 };
 
 module.exports = deviceStorage;