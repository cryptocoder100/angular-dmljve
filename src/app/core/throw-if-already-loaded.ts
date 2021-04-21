import {error} from 'util';

// Author : Prasad:
// Recommended from Angular Style guide.
// This code makes sure that we load the core/shared module
// just once. @optional tells teh Injector to pass in null if no
// other instance is found. @skipself instructs injector to find if
// an instance exists.

export function throwIfAlreadyLoaded(parentModule: any, parentModuleName: string) {
  if (parentModule) {
    throw new error(`${parentModuleName} has already been loaded. Load the CoreModule inside app Module once.`);
  }
}
