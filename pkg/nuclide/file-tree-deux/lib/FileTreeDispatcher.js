'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var {Dispatcher} = require('flux');

var instance: FileTreeDispatcher;

class FileTreeDispatcher extends Dispatcher {
  static getInstance(): FileTreeDispatcher {
    if (!instance) {
      instance = new FileTreeDispatcher();
    }
    return instance;
  }
}

module.exports = FileTreeDispatcher;
