import * as pkg from '../index';
const Common = {};

for (const key of Object.keys(pkg)) {
    if (key === 'default') continue;
    Common[key] = pkg[key];
}

export default Common;
