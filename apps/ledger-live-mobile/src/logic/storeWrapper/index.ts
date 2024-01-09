import { decorateStats } from "./stats";
// import asyncstorageImpl from "./asyncstorage";
// export default decorateStats(asyncstorageImpl);

import mmkvImpl from "./mmkv";
export default decorateStats(mmkvImpl);
