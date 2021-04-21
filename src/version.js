var version = require('../package.json').version;
var _a = require('path'), resolve = _a.resolve, relative = _a.relative;
var writeFileSync = require('fs-extra').writeFileSync;
var gitInfo = {
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
    version:  '2021.1.7',
    versionDate: '04/16/2021'
};
gitInfo.version = version;
var file = resolve(__dirname, '..', 'src', 'environments', 'version.ts');
writeFileSync(file, "// IMPORTANT: THIS FILE IS AUTO GENERATED! DO NOT MANUALLY EDIT OR CHECKIN!\n/* tslint:disable */\nexport const VERSION = " + JSON.stringify(gitInfo, null, 4) + ";\n/* tslint:enable */\n", { encoding: 'utf-8' });
console.log("Wrote version info to " + relative(resolve(__dirname, '..'), file));
