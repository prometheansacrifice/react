/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberDevToolsHook
 * @flow
 */

'use strict';

var warning = require('fbjs/lib/warning');

import type {Fiber} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';

declare var __REACT_DEVTOOLS_GLOBAL_HOOK__: Object | void;

let rendererID = null;
let injectInternals = null;
let onCommitRoot = null;
let onCommitUnmount = null;
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  __REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber
) {
  let {
    inject,
    onCommitFiberRoot,
    onCommitFiberUnmount,
  } = __REACT_DEVTOOLS_GLOBAL_HOOK__;

  injectInternals = function(
    findFiberByHostInstance: (instance: any) => Fiber,
    findHostInstanceByFiber: (component: Fiber) => any,
    bundleType: number,
    version: string,
  ) {
    warning(rendererID == null, 'Cannot inject into DevTools twice.');
    // A dummy function to check for minification during runtime
    // Refer https://github.com/facebook/react-devtools/issues/694#issuecomment-300535376
    var testMinification = function() {
      if (__DEV__) {
        return 42;
      }
    };
    warning(
      (testMinification.name || testMinification.toString())
        .indexOf('testMinification') !== -1,
      "It looks like you're using a minified copy of the development build " +
        'of React. When deploying React apps to production, make sure to use ' +
        'the production build which skips development warnings and is faster. ' +
        'See https://fb.me/react-minification for more details.',
    );
    rendererID = inject({
      findHostInstanceByFiber: findHostInstanceByFiber,
      findFiberByHostInstance: findFiberByHostInstance,
      bundleType: bundleType,
      version: version,
      testMinification: testMinification,
    });
  };

  onCommitRoot = function(root: FiberRoot) {
    if (rendererID == null) {
      return;
    }
    try {
      onCommitFiberRoot(rendererID, root);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      if (__DEV__) {
        warning(false, 'React DevTools encountered an error: %s', err);
      }
    }
  };

  onCommitUnmount = function(fiber: Fiber) {
    if (rendererID == null) {
      return;
    }
    try {
      onCommitFiberUnmount(rendererID, fiber);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      if (__DEV__) {
        warning(false, 'React DevTools encountered an error: %s', err);
      }
    }
  };
}

exports.injectInternals = injectInternals;
exports.onCommitRoot = onCommitRoot;
exports.onCommitUnmount = onCommitUnmount;
