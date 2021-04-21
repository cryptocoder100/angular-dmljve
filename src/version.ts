const { version } = require('../package.json');
const { resolve, relative } = require('path');
const { writeFileSync } = require('fs-extra');

const gitInfo = {
    dirtyMark: false,
    dirtySemver: false,
    // raw: "30374842-dirty",
    // hash: "30374842",
    // "distance": null,
    // "tag": null,
    // "semver": null,
    // "suffix": "30374842-dirty",
    // "semverString": null,
    // "version": "0.0.1"
    version: '2021.1.7',
    versionDate: '04/16/2021'
};

gitInfo.version = version;

const file = resolve(__dirname, '..', 'src', 'environments', 'version.ts');
writeFileSync(file,
`// IMPORTANT: THIS FILE IS AUTO GENERATED! DO NOT MANUALLY EDIT OR CHECKIN!
/* tslint:disable */
export const VERSION = ${JSON.stringify(gitInfo, null, 4)};
/* tslint:enable */
`, { encoding: 'utf-8' });

console.log(`Wrote version info to ${relative(resolve(__dirname, '..'), file)}`);
