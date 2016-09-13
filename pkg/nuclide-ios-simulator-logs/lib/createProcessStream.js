Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.createProcessStream = createProcessStream;
exports._findAvailableDevice = _findAvailableDevice;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _commonsNodeProcess2;

function _commonsNodeProcess() {
  return _commonsNodeProcess2 = require('../../commons-node/process');
}

var _commonsAtomFeatureConfig2;

function _commonsAtomFeatureConfig() {
  return _commonsAtomFeatureConfig2 = _interopRequireDefault(require('../../commons-atom/featureConfig'));
}

var _assert2;

function _assert() {
  return _assert2 = _interopRequireDefault(require('assert'));
}

var _os2;

function _os() {
  return _os2 = _interopRequireDefault(require('os'));
}

var _commonsNodeNuclideUri2;

function _commonsNodeNuclideUri() {
  return _commonsNodeNuclideUri2 = _interopRequireDefault(require('../../commons-node/nuclideUri'));
}

var _rxjsBundlesRxUmdMinJs2;

function _rxjsBundlesRxUmdMinJs() {
  return _rxjsBundlesRxUmdMinJs2 = require('rxjs/bundles/Rx.umd.min.js');
}

function createProcessStream() {
  // Get a list of devices and their states from `xcrun simctl`.
  var simctlOutput$ = (0, (_commonsNodeProcess2 || _commonsNodeProcess()).observeProcess)(spawnSimctlList).map(function (event) {
    if (event.kind === 'error') {
      throw event.error;
    }
    return event;
  }).filter(function (event) {
    return event.kind === 'stdout';
  }).map(function (event) {
    (0, (_assert2 || _assert()).default)(event.data != null);
    return event.data;
  }).reduce(function (acc, next) {
    return acc + next;
  }, '').map(function (rawJson) {
    (0, (_assert2 || _assert()).default)(typeof rawJson === 'string');
    return JSON.parse(rawJson);
  });

  var udid$ = simctlOutput$.map(function (json) {
    var devices = json.devices;

    var device = _findAvailableDevice(devices);
    if (device == null) {
      throw new Error('No active iOS simulator found');
    }
    return device.udid;
  })
  // Retry every second until we find an active device.
  .retryWhen(function (error$) {
    return error$.delay(1000);
  });

  return udid$.first().flatMap(function (udid) {
    return (0, (_commonsNodeProcess2 || _commonsNodeProcess()).observeProcess)(function () {
      return tailDeviceLogs(udid);
    }).map(function (event) {
      if (event.kind === 'error') {
        throw event.error;
      }
      return event;
    }).filter(function (event) {
      return event.kind === 'stdout';
    }).map(function (event) {
      (0, (_assert2 || _assert()).default)(typeof event.data === 'string');
      return event.data;
    });
  });
}

/**
 * Finds the first booted available device in a list of devices (formatted in the output style of
 * `simctl`.). Exported for testing only.
 */

function _findAvailableDevice(devices) {
  for (var key of Object.keys(devices)) {
    for (var device of devices[key]) {
      if (device.availability === '(available)' && device.state === 'Booted') {
        return device;
      }
    }
  }
}

function spawnSimctlList() {
  return (0, (_commonsNodeProcess2 || _commonsNodeProcess()).safeSpawn)('xcrun', ['simctl', 'list', '--json']);
}

function tailDeviceLogs(udid) {
  var logDir = (_commonsNodeNuclideUri2 || _commonsNodeNuclideUri()).default.join((_os2 || _os()).default.homedir(), 'Library', 'Logs', 'CoreSimulator', udid, 'asl');
  return (0, (_commonsNodeProcess2 || _commonsNodeProcess()).safeSpawn)((_commonsAtomFeatureConfig2 || _commonsAtomFeatureConfig()).default.get('nuclide-ios-simulator-logs.pathToSyslog'), ['-w', '-F', 'xml', '-d', logDir]);
}