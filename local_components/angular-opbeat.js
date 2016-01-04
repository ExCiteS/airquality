(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;
        if (!u && a) return a(o, !0);
        if (i) return i(o, !0);
        var f = new Error("Cannot find module '" + o + "'");
        throw f.code = "MODULE_NOT_FOUND", f
      }
      var l = n[o] = {
        exports: {}
      };
      t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];
        return s(n ? n : e)
      }, l, l.exports, e, t, n, r)
    }
    return n[o].exports
  }
  var i = typeof require == "function" && require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s
})({
  1: [function (_dereq_, module, exports) {
    module.exports = function (stackFrames) {

      return stackFrames.map(function (frame) {
        if (frame.functionName) {
          frame.functionName = normalizeFunctionName(frame.functionName)
        }
        return frame
      })

    }

    function normalizeFunctionName(fnName) {
      // SpinderMonkey name convetion (https://developer.mozilla.org/en-US/docs/Tools/Debugger-API/Debugger.Object#Accessor_Properties_of_the_Debugger.Object_prototype)

      // We use a/b to refer to the b defined within a
      var parts = fnName.split('/')
      if (parts.length > 1) {
        fnName = ['Object', parts[parts.length - 1]].join('.')
      } else {
        fnName = parts[0]
      }

      // a< to refer to a function that occurs somewhere within an expression that is assigned to a.
      fnName = fnName.replace(/.<$/gi, '.<anonymous>')

      // Normalize IE's 'Anonymous function'
      fnName = fnName.replace(/^Anonymous function$/, '<anonymous>')

      // Always use the last part
      var parts = fnName.split('.')
      if (parts.length > 1) {
        fnName = parts[parts.length - 1]
      } else {
        fnName = parts[0]
      }

      return fnName
    }
  }, {}],
  2: [function (_dereq_, module, exports) {
    (function (root, factory) {
      'use strict';
      // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

      /* istanbul ignore next */
      if (typeof define === 'function' && define.amd) {
        define('error-stack-parser', ['stackframe'], factory);
      } else if (typeof exports === 'object') {
        module.exports = factory(_dereq_('stackframe'));
      } else {
        root.ErrorStackParser = factory(root.StackFrame);
      }
    }(this, function ErrorStackParser(StackFrame) {
      'use strict';

      var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
      var CHROME_IE_STACK_REGEXP = /\s+at .*(\S+\:\d+|\(native\))/;

      return {
        /**
         * Given an Error object, extract the most information from it.
         * @param error {Error}
         * @return Array[StackFrame]
         */
        parse: function ErrorStackParser$$parse(error) {
          if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
            return this.parseOpera(error);
          } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
            return this.parseV8OrIE(error);
          } else if (error.stack && error.stack.match(FIREFOX_SAFARI_STACK_REGEXP)) {
            return this.parseFFOrSafari(error);
          } else {
            throw new Error('Cannot parse given Error object');
          }
        },

        /**
         * Separate line and column numbers from a URL-like string.
         * @param urlLike String
         * @return Array[String]
         */
        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
          // Fail-fast but return locations like "(native)"
          if (urlLike.indexOf(':') === -1) {
            return [urlLike];
          }

          var locationParts = urlLike.replace(/[\(\)\s]/g, '').split(':');
          var lastNumber = locationParts.pop();
          var possibleNumber = locationParts[locationParts.length - 1];
          if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
            var lineNumber = locationParts.pop();
            return [locationParts.join(':'), lineNumber, lastNumber];
          } else {
            return [locationParts.join(':'), lastNumber, undefined];
          }
        },

        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
          return error.stack.split('\n').filter(function (line) {
            return !!line.match(CHROME_IE_STACK_REGEXP);
          }, this).map(function (line) {
            var tokens = line.replace(/^\s+/, '').split(/\s+/).slice(1);
            var locationParts = this.extractLocation(tokens.pop());
            var functionName = (!tokens[0]) ? undefined : tokens[0];

            // Special case for IE's 'Anonymous function'
            if (tokens[0] === 'Anonymous' && tokens[1] === 'function') {
              functionName = tokens.slice(0, 2).join(' ');
            }

            return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], line);
          }, this);
        },

        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
          return error.stack.split('\n').filter(function (line) {
            return !!line.match(FIREFOX_SAFARI_STACK_REGEXP);
          }, this).map(function (line) {
            var tokens = line.split('@');
            var locationParts = this.extractLocation(tokens.pop());
            var functionName = tokens.shift() || undefined;
            return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], line);
          }, this);
        },

        parseOpera: function ErrorStackParser$$parseOpera(e) {
          if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
              e.message.split('\n').length > e.stacktrace.split('\n').length)) {
            return this.parseOpera9(e);
          } else if (!e.stack) {
            return this.parseOpera10(e);
          } else {
            return this.parseOpera11(e);
          }
        },

        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
          var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
          var lines = e.message.split('\n');
          var result = [];

          for (var i = 2, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
              result.push(new StackFrame(undefined, undefined, match[2], match[1], undefined, lines[i]));
            }
          }

          return result;
        },

        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
          var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
          var lines = e.stacktrace.split('\n');
          var result = [];

          for (var i = 0, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
              result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1], undefined, lines[i]));
            }
          }

          return result;
        },

        // Opera 10.65+ Error.stack very similar to FF/Safari
        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
          return error.stack.split('\n').filter(function (line) {
            return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) &&
              !line.match(/^Error created at/);
          }, this).map(function (line) {
            var tokens = line.split('@');
            var locationParts = this.extractLocation(tokens.pop());
            var functionCall = (tokens.shift() || '');
            var functionName = functionCall
              .replace(/<anonymous function(: (\w+))?>/, '$2')
              .replace(/\([^\)]*\)/g, '') || undefined;
            var argsRaw;
            if (functionCall.match(/\(([^\)]*)\)/)) {
              argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
            }
            var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ? undefined : argsRaw.split(',');
            return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2], line);
          }, this);
        }
      };
    }));


  }, {
    "stackframe": 8
  }],
  3: [function (_dereq_, module, exports) {
    (function (process, global) {
      /*!
       * @overview es6-promise - a tiny implementation of Promises/A+.
       * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
       * @license   Licensed under MIT license
       *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
       * @version   3.0.2
       */

      (function () {
        "use strict";

        function lib$es6$promise$utils$$objectOrFunction(x) {
          return typeof x === 'function' || (typeof x === 'object' && x !== null);
        }

        function lib$es6$promise$utils$$isFunction(x) {
          return typeof x === 'function';
        }

        function lib$es6$promise$utils$$isMaybeThenable(x) {
          return typeof x === 'object' && x !== null;
        }

        var lib$es6$promise$utils$$_isArray;
        if (!Array.isArray) {
          lib$es6$promise$utils$$_isArray = function (x) {
            return Object.prototype.toString.call(x) === '[object Array]';
          };
        } else {
          lib$es6$promise$utils$$_isArray = Array.isArray;
        }

        var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
        var lib$es6$promise$asap$$len = 0;
        var lib$es6$promise$asap$$toString = {}.toString;
        var lib$es6$promise$asap$$vertxNext;
        var lib$es6$promise$asap$$customSchedulerFn;

        var lib$es6$promise$asap$$asap = function asap(callback, arg) {
          lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
          lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
          lib$es6$promise$asap$$len += 2;
          if (lib$es6$promise$asap$$len === 2) {
            // If len is 2, that means that we need to schedule an async flush.
            // If additional callbacks are queued before the queue is flushed, they
            // will be processed by this flush that we are scheduling.
            if (lib$es6$promise$asap$$customSchedulerFn) {
              lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
            } else {
              lib$es6$promise$asap$$scheduleFlush();
            }
          }
        }

        function lib$es6$promise$asap$$setScheduler(scheduleFn) {
          lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
        }

        function lib$es6$promise$asap$$setAsap(asapFn) {
          lib$es6$promise$asap$$asap = asapFn;
        }

        var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
        var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
        var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
        var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

        // test for web worker but not in IE10
        var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
          typeof importScripts !== 'undefined' &&
          typeof MessageChannel !== 'undefined';

        // node
        function lib$es6$promise$asap$$useNextTick() {
          // node version 0.10.x displays a deprecation warning when nextTick is used recursively
          // see https://github.com/cujojs/when/issues/410 for details
          return function () {
            process.nextTick(lib$es6$promise$asap$$flush);
          };
        }

        // vertx
        function lib$es6$promise$asap$$useVertxTimer() {
          return function () {
            lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
          };
        }

        function lib$es6$promise$asap$$useMutationObserver() {
          var iterations = 0;
          var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
          var node = document.createTextNode('');
          observer.observe(node, {
            characterData: true
          });

          return function () {
            node.data = (iterations = ++iterations % 2);
          };
        }

        // web worker
        function lib$es6$promise$asap$$useMessageChannel() {
          var channel = new MessageChannel();
          channel.port1.onmessage = lib$es6$promise$asap$$flush;
          return function () {
            channel.port2.postMessage(0);
          };
        }

        function lib$es6$promise$asap$$useSetTimeout() {
          return function () {
            setTimeout(lib$es6$promise$asap$$flush, 1);
          };
        }

        var lib$es6$promise$asap$$queue = new Array(1000);

        function lib$es6$promise$asap$$flush() {
          for (var i = 0; i < lib$es6$promise$asap$$len; i += 2) {
            var callback = lib$es6$promise$asap$$queue[i];
            var arg = lib$es6$promise$asap$$queue[i + 1];

            callback(arg);

            lib$es6$promise$asap$$queue[i] = undefined;
            lib$es6$promise$asap$$queue[i + 1] = undefined;
          }

          lib$es6$promise$asap$$len = 0;
        }

        function lib$es6$promise$asap$$attemptVertx() {
          try {
            var r = _dereq_;
            var vertx = r('vertx');
            lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
            return lib$es6$promise$asap$$useVertxTimer();
          } catch (e) {
            return lib$es6$promise$asap$$useSetTimeout();
          }
        }

        var lib$es6$promise$asap$$scheduleFlush;
        // Decide what async method to use to triggering processing of queued callbacks:
        if (lib$es6$promise$asap$$isNode) {
          lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
        } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
          lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
        } else if (lib$es6$promise$asap$$isWorker) {
          lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
        } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof _dereq_ === 'function') {
          lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
        } else {
          lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
        }

        function lib$es6$promise$$internal$$noop() {}

        var lib$es6$promise$$internal$$PENDING = void 0;
        var lib$es6$promise$$internal$$FULFILLED = 1;
        var lib$es6$promise$$internal$$REJECTED = 2;

        var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

        function lib$es6$promise$$internal$$selfFulfillment() {
          return new TypeError("You cannot resolve a promise with itself");
        }

        function lib$es6$promise$$internal$$cannotReturnOwn() {
          return new TypeError('A promises callback cannot return that same promise.');
        }

        function lib$es6$promise$$internal$$getThen(promise) {
          try {
            return promise.then;
          } catch (error) {
            lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
            return lib$es6$promise$$internal$$GET_THEN_ERROR;
          }
        }

        function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
          try {
            then.call(value, fulfillmentHandler, rejectionHandler);
          } catch (e) {
            return e;
          }
        }

        function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
          lib$es6$promise$asap$$asap(function (promise) {
            var sealed = false;
            var error = lib$es6$promise$$internal$$tryThen(then, thenable, function (value) {
              if (sealed) {
                return;
              }
              sealed = true;
              if (thenable !== value) {
                lib$es6$promise$$internal$$resolve(promise, value);
              } else {
                lib$es6$promise$$internal$$fulfill(promise, value);
              }
            }, function (reason) {
              if (sealed) {
                return;
              }
              sealed = true;

              lib$es6$promise$$internal$$reject(promise, reason);
            }, 'Settle: ' + (promise._label || ' unknown promise'));

            if (!sealed && error) {
              sealed = true;
              lib$es6$promise$$internal$$reject(promise, error);
            }
          }, promise);
        }

        function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
          if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
            lib$es6$promise$$internal$$fulfill(promise, thenable._result);
          } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
            lib$es6$promise$$internal$$reject(promise, thenable._result);
          } else {
            lib$es6$promise$$internal$$subscribe(thenable, undefined, function (value) {
              lib$es6$promise$$internal$$resolve(promise, value);
            }, function (reason) {
              lib$es6$promise$$internal$$reject(promise, reason);
            });
          }
        }

        function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
          if (maybeThenable.constructor === promise.constructor) {
            lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
          } else {
            var then = lib$es6$promise$$internal$$getThen(maybeThenable);

            if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
              lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
            } else if (then === undefined) {
              lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
            } else if (lib$es6$promise$utils$$isFunction(then)) {
              lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
            } else {
              lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
            }
          }
        }

        function lib$es6$promise$$internal$$resolve(promise, value) {
          if (promise === value) {
            lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
          } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
            lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }

        function lib$es6$promise$$internal$$publishRejection(promise) {
          if (promise._onerror) {
            promise._onerror(promise._result);
          }

          lib$es6$promise$$internal$$publish(promise);
        }

        function lib$es6$promise$$internal$$fulfill(promise, value) {
          if (promise._state !== lib$es6$promise$$internal$$PENDING) {
            return;
          }

          promise._result = value;
          promise._state = lib$es6$promise$$internal$$FULFILLED;

          if (promise._subscribers.length !== 0) {
            lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
          }
        }

        function lib$es6$promise$$internal$$reject(promise, reason) {
          if (promise._state !== lib$es6$promise$$internal$$PENDING) {
            return;
          }
          promise._state = lib$es6$promise$$internal$$REJECTED;
          promise._result = reason;

          lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
        }

        function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
          var subscribers = parent._subscribers;
          var length = subscribers.length;

          parent._onerror = null;

          subscribers[length] = child;
          subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
          subscribers[length + lib$es6$promise$$internal$$REJECTED] = onRejection;

          if (length === 0 && parent._state) {
            lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
          }
        }

        function lib$es6$promise$$internal$$publish(promise) {
          var subscribers = promise._subscribers;
          var settled = promise._state;

          if (subscribers.length === 0) {
            return;
          }

          var child, callback, detail = promise._result;

          for (var i = 0; i < subscribers.length; i += 3) {
            child = subscribers[i];
            callback = subscribers[i + settled];

            if (child) {
              lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
            } else {
              callback(detail);
            }
          }

          promise._subscribers.length = 0;
        }

        function lib$es6$promise$$internal$$ErrorObject() {
          this.error = null;
        }

        var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

        function lib$es6$promise$$internal$$tryCatch(callback, detail) {
          try {
            return callback(detail);
          } catch (e) {
            lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
            return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
          }
        }

        function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
          var hasCallback = lib$es6$promise$utils$$isFunction(callback),
            value, error, succeeded, failed;

          if (hasCallback) {
            value = lib$es6$promise$$internal$$tryCatch(callback, detail);

            if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
              failed = true;
              error = value.error;
              value = null;
            } else {
              succeeded = true;
            }

            if (promise === value) {
              lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
              return;
            }

          } else {
            value = detail;
            succeeded = true;
          }

          if (promise._state !== lib$es6$promise$$internal$$PENDING) {
            // noop
          } else if (hasCallback && succeeded) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else if (failed) {
            lib$es6$promise$$internal$$reject(promise, error);
          } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
            lib$es6$promise$$internal$$fulfill(promise, value);
          } else if (settled === lib$es6$promise$$internal$$REJECTED) {
            lib$es6$promise$$internal$$reject(promise, value);
          }
        }

        function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
          try {
            resolver(function resolvePromise(value) {
              lib$es6$promise$$internal$$resolve(promise, value);
            }, function rejectPromise(reason) {
              lib$es6$promise$$internal$$reject(promise, reason);
            });
          } catch (e) {
            lib$es6$promise$$internal$$reject(promise, e);
          }
        }

        function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
          var enumerator = this;

          enumerator._instanceConstructor = Constructor;
          enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

          if (enumerator._validateInput(input)) {
            enumerator._input = input;
            enumerator.length = input.length;
            enumerator._remaining = input.length;

            enumerator._init();

            if (enumerator.length === 0) {
              lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
            } else {
              enumerator.length = enumerator.length || 0;
              enumerator._enumerate();
              if (enumerator._remaining === 0) {
                lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
              }
            }
          } else {
            lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
          }
        }

        lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function (input) {
          return lib$es6$promise$utils$$isArray(input);
        };

        lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function () {
          return new Error('Array Methods must be provided an Array');
        };

        lib$es6$promise$enumerator$$Enumerator.prototype._init = function () {
          this._result = new Array(this.length);
        };

        var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

        lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function () {
          var enumerator = this;

          var length = enumerator.length;
          var promise = enumerator.promise;
          var input = enumerator._input;

          for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
            enumerator._eachEntry(input[i], i);
          }
        };

        lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function (entry, i) {
          var enumerator = this;
          var c = enumerator._instanceConstructor;

          if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
            if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
              entry._onerror = null;
              enumerator._settledAt(entry._state, i, entry._result);
            } else {
              enumerator._willSettleAt(c.resolve(entry), i);
            }
          } else {
            enumerator._remaining--;
            enumerator._result[i] = entry;
          }
        };

        lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function (state, i, value) {
          var enumerator = this;
          var promise = enumerator.promise;

          if (promise._state === lib$es6$promise$$internal$$PENDING) {
            enumerator._remaining--;

            if (state === lib$es6$promise$$internal$$REJECTED) {
              lib$es6$promise$$internal$$reject(promise, value);
            } else {
              enumerator._result[i] = value;
            }
          }

          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
          }
        };

        lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function (promise, i) {
          var enumerator = this;

          lib$es6$promise$$internal$$subscribe(promise, undefined, function (value) {
            enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
          }, function (reason) {
            enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
          });
        };

        function lib$es6$promise$promise$all$$all(entries) {
          return new lib$es6$promise$enumerator$$default(this, entries).promise;
        }
        var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;

        function lib$es6$promise$promise$race$$race(entries) {
          /*jshint validthis:true */
          var Constructor = this;

          var promise = new Constructor(lib$es6$promise$$internal$$noop);

          if (!lib$es6$promise$utils$$isArray(entries)) {
            lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
            return promise;
          }

          var length = entries.length;

          function onFulfillment(value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          }

          function onRejection(reason) {
            lib$es6$promise$$internal$$reject(promise, reason);
          }

          for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
            lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
          }

          return promise;
        }
        var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;

        function lib$es6$promise$promise$resolve$$resolve(object) {
          /*jshint validthis:true */
          var Constructor = this;

          if (object && typeof object === 'object' && object.constructor === Constructor) {
            return object;
          }

          var promise = new Constructor(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$resolve(promise, object);
          return promise;
        }
        var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;

        function lib$es6$promise$promise$reject$$reject(reason) {
          /*jshint validthis:true */
          var Constructor = this;
          var promise = new Constructor(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$reject(promise, reason);
          return promise;
        }
        var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

        var lib$es6$promise$promise$$counter = 0;

        function lib$es6$promise$promise$$needsResolver() {
          throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
        }

        function lib$es6$promise$promise$$needsNew() {
          throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
        }

        var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
        /**
          Promise objects represent the eventual result of an asynchronous operation. The
          primary way of interacting with a promise is through its `then` method, which
          registers callbacks to receive either a promise's eventual value or the reason
          why the promise cannot be fulfilled.

          Terminology
          -----------

          - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
          - `thenable` is an object or function that defines a `then` method.
          - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
          - `exception` is a value that is thrown using the throw statement.
          - `reason` is a value that indicates why a promise was rejected.
          - `settled` the final resting state of a promise, fulfilled or rejected.

          A promise can be in one of three states: pending, fulfilled, or rejected.

          Promises that are fulfilled have a fulfillment value and are in the fulfilled
          state.  Promises that are rejected have a rejection reason and are in the
          rejected state.  A fulfillment value is never a thenable.

          Promises can also be said to *resolve* a value.  If this value is also a
          promise, then the original promise's settled state will match the value's
          settled state.  So a promise that *resolves* a promise that rejects will
          itself reject, and a promise that *resolves* a promise that fulfills will
          itself fulfill.


          Basic Usage:
          ------------

          ```js
          var promise = new Promise(function(resolve, reject) {
            // on success
            resolve(value);

            // on failure
            reject(reason);
          });

          promise.then(function(value) {
            // on fulfillment
          }, function(reason) {
            // on rejection
          });
          ```

          Advanced Usage:
          ---------------

          Promises shine when abstracting away asynchronous interactions such as
          `XMLHttpRequest`s.

          ```js
          function getJSON(url) {
            return new Promise(function(resolve, reject){
              var xhr = new XMLHttpRequest();

              xhr.open('GET', url);
              xhr.onreadystatechange = handler;
              xhr.responseType = 'json';
              xhr.setRequestHeader('Accept', 'application/json');
              xhr.send();

              function handler() {
                if (this.readyState === this.DONE) {
                  if (this.status === 200) {
                    resolve(this.response);
                  } else {
                    reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
                  }
                }
              };
            });
          }

          getJSON('/posts.json').then(function(json) {
            // on fulfillment
          }, function(reason) {
            // on rejection
          });
          ```

          Unlike callbacks, promises are great composable primitives.

          ```js
          Promise.all([
            getJSON('/posts'),
            getJSON('/comments')
          ]).then(function(values){
            values[0] // => postsJSON
            values[1] // => commentsJSON

            return values;
          });
          ```

          @class Promise
          @param {function} resolver
          Useful for tooling.
          @constructor
        */
        function lib$es6$promise$promise$$Promise(resolver) {
          this._id = lib$es6$promise$promise$$counter++;
          this._state = undefined;
          this._result = undefined;
          this._subscribers = [];

          if (lib$es6$promise$$internal$$noop !== resolver) {
            if (!lib$es6$promise$utils$$isFunction(resolver)) {
              lib$es6$promise$promise$$needsResolver();
            }

            if (!(this instanceof lib$es6$promise$promise$$Promise)) {
              lib$es6$promise$promise$$needsNew();
            }

            lib$es6$promise$$internal$$initializePromise(this, resolver);
          }
        }

        lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
        lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
        lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
        lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
        lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
        lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
        lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

        lib$es6$promise$promise$$Promise.prototype = {
          constructor: lib$es6$promise$promise$$Promise,

          /**
            The primary way of interacting with a promise is through its `then` method,
            which registers callbacks to receive either a promise's eventual value or the
            reason why the promise cannot be fulfilled.

            ```js
            findUser().then(function(user){
              // user is available
            }, function(reason){
              // user is unavailable, and you are given the reason why
            });
            ```

            Chaining
            --------

            The return value of `then` is itself a promise.  This second, 'downstream'
            promise is resolved with the return value of the first promise's fulfillment
            or rejection handler, or rejected if the handler throws an exception.

            ```js
            findUser().then(function (user) {
              return user.name;
            }, function (reason) {
              return 'default name';
            }).then(function (userName) {
              // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
              // will be `'default name'`
            });

            findUser().then(function (user) {
              throw new Error('Found user, but still unhappy');
            }, function (reason) {
              throw new Error('`findUser` rejected and we're unhappy');
            }).then(function (value) {
              // never reached
            }, function (reason) {
              // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
              // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
            });
            ```
            If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

            ```js
            findUser().then(function (user) {
              throw new PedagogicalException('Upstream error');
            }).then(function (value) {
              // never reached
            }).then(function (value) {
              // never reached
            }, function (reason) {
              // The `PedgagocialException` is propagated all the way down to here
            });
            ```

            Assimilation
            ------------

            Sometimes the value you want to propagate to a downstream promise can only be
            retrieved asynchronously. This can be achieved by returning a promise in the
            fulfillment or rejection handler. The downstream promise will then be pending
            until the returned promise is settled. This is called *assimilation*.

            ```js
            findUser().then(function (user) {
              return findCommentsByAuthor(user);
            }).then(function (comments) {
              // The user's comments are now available
            });
            ```

            If the assimliated promise rejects, then the downstream promise will also reject.

            ```js
            findUser().then(function (user) {
              return findCommentsByAuthor(user);
            }).then(function (comments) {
              // If `findCommentsByAuthor` fulfills, we'll have the value here
            }, function (reason) {
              // If `findCommentsByAuthor` rejects, we'll have the reason here
            });
            ```

            Simple Example
            --------------

            Synchronous Example

            ```javascript
            var result;

            try {
              result = findResult();
              // success
            } catch(reason) {
              // failure
            }
            ```

            Errback Example

            ```js
            findResult(function(result, err){
              if (err) {
                // failure
              } else {
                // success
              }
            });
            ```

            Promise Example;

            ```javascript
            findResult().then(function(result){
              // success
            }, function(reason){
              // failure
            });
            ```

            Advanced Example
            --------------

            Synchronous Example

            ```javascript
            var author, books;

            try {
              author = findAuthor();
              books  = findBooksByAuthor(author);
              // success
            } catch(reason) {
              // failure
            }
            ```

            Errback Example

            ```js

            function foundBooks(books) {

            }

            function failure(reason) {

            }

            findAuthor(function(author, err){
              if (err) {
                failure(err);
                // failure
              } else {
                try {
                  findBoooksByAuthor(author, function(books, err) {
                    if (err) {
                      failure(err);
                    } else {
                      try {
                        foundBooks(books);
                      } catch(reason) {
                        failure(reason);
                      }
                    }
                  });
                } catch(error) {
                  failure(err);
                }
                // success
              }
            });
            ```

            Promise Example;

            ```javascript
            findAuthor().
              then(findBooksByAuthor).
              then(function(books){
                // found books
            }).catch(function(reason){
              // something went wrong
            });
            ```

            @method then
            @param {Function} onFulfilled
            @param {Function} onRejected
            Useful for tooling.
            @return {Promise}
          */
          then: function (onFulfillment, onRejection) {
            var parent = this;
            var state = parent._state;

            if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
              return this;
            }

            var child = new this.constructor(lib$es6$promise$$internal$$noop);
            var result = parent._result;

            if (state) {
              var callback = arguments[state - 1];
              lib$es6$promise$asap$$asap(function () {
                lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
              });
            } else {
              lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
            }

            return child;
          },

          /**
            `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
            as the catch block of a try/catch statement.

            ```js
            function findAuthor(){
              throw new Error('couldn't find that author');
            }

            // synchronous
            try {
              findAuthor();
            } catch(reason) {
              // something went wrong
            }

            // async with promises
            findAuthor().catch(function(reason){
              // something went wrong
            });
            ```

            @method catch
            @param {Function} onRejection
            Useful for tooling.
            @return {Promise}
          */
          'catch': function (onRejection) {
            return this.then(null, onRejection);
          }
        };

        function lib$es6$promise$polyfill$$polyfill() {
          var local;

          if (typeof global !== 'undefined') {
            local = global;
          } else if (typeof self !== 'undefined') {
            local = self;
          } else {
            try {
              local = Function('return this')();
            } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
            }
          }

          var P = local.Promise;

          if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
            return;
          }

          local.Promise = lib$es6$promise$promise$$default;
        }
        var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

        var lib$es6$promise$umd$$ES6Promise = {
          'Promise': lib$es6$promise$promise$$default,
          'polyfill': lib$es6$promise$polyfill$$default
        };

        /* global define:true module:true window: true */
        if (typeof define === 'function' && define['amd']) {
          define(function () {
            return lib$es6$promise$umd$$ES6Promise;
          });
        } else if (typeof module !== 'undefined' && module['exports']) {
          module['exports'] = lib$es6$promise$umd$$ES6Promise;
        } else if (typeof this !== 'undefined') {
          this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
        }

        lib$es6$promise$polyfill$$default();
      }).call(this);


    }).call(this, _dereq_('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {
    "_process": 4
  }],
  4: [function (_dereq_, module, exports) {
    // shim for using process in browser

    var process = module.exports = {};
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;

    function cleanUpNextTick() {
      draining = false;
      if (currentQueue.length) {
        queue = currentQueue.concat(queue);
      } else {
        queueIndex = -1;
      }
      if (queue.length) {
        drainQueue();
      }
    }

    function drainQueue() {
      if (draining) {
        return;
      }
      var timeout = setTimeout(cleanUpNextTick);
      draining = true;

      var len = queue.length;
      while (len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
          if (currentQueue) {
            currentQueue[queueIndex].run();
          }
        }
        queueIndex = -1;
        len = queue.length;
      }
      currentQueue = null;
      draining = false;
      clearTimeout(timeout);
    }

    process.nextTick = function (fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
          args[i - 1] = arguments[i];
        }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
      }
    };

    // v8 likes predictible objects
    function Item(fun, array) {
      this.fun = fun;
      this.array = array;
    }
    Item.prototype.run = function () {
      this.fun.apply(null, this.array);
    };
    process.title = 'browser';
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = ''; // empty string to avoid regexp issues
    process.versions = {};

    function noop() {}

    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;

    process.binding = function (name) {
      throw new Error('process.binding is not supported');
    };

    process.cwd = function () {
      return '/'
    };
    process.chdir = function (dir) {
      throw new Error('process.chdir is not supported');
    };
    process.umask = function () {
      return 0;
    };

  }, {}],
  5: [function (_dereq_, module, exports) {
    module.exports = _dereq_('./lib/simple_lru.js');

  }, {
    "./lib/simple_lru.js": 6
  }],
  6: [function (_dereq_, module, exports) {
    "use strict";

    /**
     * LRU cache based on a double linked list
     */

    function ListElement(before, next, key, value) {
      this.before = before
      this.next = next
      this.key = key
      this.value = value
    }

    ListElement.prototype.setKey = function (key) {
      this.key = key
    }

    ListElement.prototype.setValue = function (value) {
      this.value = value
    }


    function Cache(options) {
      if (!options)
        options = {}
      this.maxSize = options.maxSize
      this.reset()
    }


    Cache.prototype.reset = function () {
      this.size = 0
      this.cache = {}
      this.tail = undefined
      this.head = undefined
    }


    Cache.prototype.get = function (key, hit) {
      var cacheVal = this.cache[key]
        /*
         * Define if the egt function should hit the value to move
         * it to the head of linked list
         */
      hit = hit != undefined && hit != null ? hit : true;
      if (cacheVal && hit)
        this.hit(cacheVal)
      else
        return undefined
      return cacheVal.value
    }

    Cache.prototype.set = function (key, val, hit) {
      var actual = this.cache[key]
        /*
         * Define if the set function should hit the value to move
         * it to the head of linked list
         */
      hit = hit != undefined && hit != null ? hit : true;


      if (actual) {
        actual.value = val
        if (hit) this.hit(actual)
      } else {
        var cacheVal
        if (this.size >= this.maxSize) {
          var tailKey = this.tail.key
          this.detach(this.tail)

          /*
           * If max is reached we'llreuse object to minimize GC impact
           * when the objects are cached short time
           */
          cacheVal = this.cache[tailKey]
          delete this.cache[tailKey]

          cacheVal.next = undefined
          cacheVal.before = undefined

          /*
           * setters reuse the array object
           */
          cacheVal.setKey(key)
          cacheVal.setValue(val)
        }

        cacheVal = cacheVal ? cacheVal : new ListElement(undefined, undefined, key, val)
        this.cache[key] = cacheVal
        this.attach(cacheVal)
      }
    }

    Cache.prototype.del = function (key) {
      var val = this.cache[key]
      if (!val)
        return;
      this.detach(val)
      delete this.cache[key]
    }

    Cache.prototype.hit = function (cacheVal) {
      //Send cacheVal to the head of list
      this.detach(cacheVal)
      this.attach(cacheVal)
    }

    Cache.prototype.attach = function (element) {
      if (!element)
        return;
      element.before = undefined
      element.next = this.head
      this.head = element
      if (!element.next)
        this.tail = element
      else
        element.next.before = element
      this.size++
    }

    Cache.prototype.detach = function (element) {
      if (!element)
        return;
      var before = element.before
      var next = element.next
      if (before) {
        before.next = next
      } else {
        this.head = next
      }
      if (next) {
        next.before = before
      } else {
        this.tail = before
      }
      this.size--
    }

    Cache.prototype.forEach = function (callback) {
      var self = this
      Object.keys(this.cache).forEach(function (key) {
        var val = self.cache[key]
        callback(val.value, key)
      })
    }
    module.exports = Cache

  }, {}],
  7: [function (_dereq_, module, exports) {
    (function (root, factory) {
      'use strict';
      // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

      /* istanbul ignore next */
      if (typeof define === 'function' && define.amd) {
        define('stack-generator', ['stackframe'], factory);
      } else if (typeof exports === 'object') {
        module.exports = factory(_dereq_('stackframe'));
      } else {
        root.StackGenerator = factory(root.StackFrame);
      }
    }(this, function (StackFrame) {
      return {
        backtrace: function StackGenerator$$backtrace(opts) {
          var stack = [];
          var maxStackSize = 10;

          if (typeof opts === 'object' && typeof opts.maxStackSize === 'number') {
            maxStackSize = opts.maxStackSize;
          }

          var curr = arguments.callee;
          while (curr && stack.length < maxStackSize) {
            // Allow V8 optimizations
            var args = new Array(curr['arguments'].length);
            for (var i = 0; i < args.length; ++i) {
              args[i] = curr['arguments'][i];
            }
            if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
              stack.push(new StackFrame(RegExp.$1 || undefined, args));
            } else {
              stack.push(new StackFrame(undefined, args));
            }

            try {
              curr = curr.caller;
            } catch (e) {
              break;
            }
          }
          return stack;
        }
      };
    }));

  }, {
    "stackframe": 8
  }],
  8: [function (_dereq_, module, exports) {
    (function (root, factory) {
      'use strict';
      // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

      /* istanbul ignore next */
      if (typeof define === 'function' && define.amd) {
        define('stackframe', [], factory);
      } else if (typeof exports === 'object') {
        module.exports = factory();
      } else {
        root.StackFrame = factory();
      }
    }(this, function () {
      'use strict';

      function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
      }

      function StackFrame(functionName, args, fileName, lineNumber, columnNumber, source) {
        if (functionName !== undefined) {
          this.setFunctionName(functionName);
        }
        if (args !== undefined) {
          this.setArgs(args);
        }
        if (fileName !== undefined) {
          this.setFileName(fileName);
        }
        if (lineNumber !== undefined) {
          this.setLineNumber(lineNumber);
        }
        if (columnNumber !== undefined) {
          this.setColumnNumber(columnNumber);
        }
        if (source !== undefined) {
          this.setSource(source);
        }
      }

      StackFrame.prototype = {
        getFunctionName: function () {
          return this.functionName;
        },
        setFunctionName: function (v) {
          this.functionName = String(v);
        },

        getArgs: function () {
          return this.args;
        },
        setArgs: function (v) {
          if (Object.prototype.toString.call(v) !== '[object Array]') {
            throw new TypeError('Args must be an Array');
          }
          this.args = v;
        },

        // NOTE: Property name may be misleading as it includes the path,
        // but it somewhat mirrors V8's JavaScriptStackTraceApi
        // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
        // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
        getFileName: function () {
          return this.fileName;
        },
        setFileName: function (v) {
          this.fileName = String(v);
        },

        getLineNumber: function () {
          return this.lineNumber;
        },
        setLineNumber: function (v) {
          if (!_isNumber(v)) {
            throw new TypeError('Line Number must be a Number');
          }
          this.lineNumber = Number(v);
        },

        getColumnNumber: function () {
          return this.columnNumber;
        },
        setColumnNumber: function (v) {
          if (!_isNumber(v)) {
            throw new TypeError('Column Number must be a Number');
          }
          this.columnNumber = Number(v);
        },

        getSource: function () {
          return this.source;
        },
        setSource: function (v) {
          this.source = String(v);
        },

        toString: function () {
          var functionName = this.getFunctionName() || '{anonymous}';
          var args = '(' + (this.getArgs() || []).join(',') + ')';
          var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
          var lineNumber = _isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
          var columnNumber = _isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
          return functionName + args + fileName + lineNumber + columnNumber;
        }
      };

      return StackFrame;
    }));

  }, {}],
  9: [function (_dereq_, module, exports) {
    var Opbeat = _dereq_('./opbeat')
    var Instrumentation = _dereq_('./instrumentation')

    var TraceBuffer = _dereq_('./instrumentation/traceBuffer')
    var transactionStore = _dereq_('./instrumentation/transactionStore')

    var utils = _dereq_('./instrumentation/utils')
    var logger = _dereq_('./lib/logger')

    function ngOpbeatProvider() {
      this.config = function config(properties) {
        Opbeat.config(properties)
      }

      this.install = function install() {
        Opbeat.install()
      }

      this.version = 'v1.2.3'

      this.$get = [
        function () {
          return {
            getConfig: function config() {
              return Opbeat.config()
            },
            captureException: function captureException(exception, cause) {
              Opbeat.captureException(exception, cause)
            },

            setUserContext: function setUser(user) {
              Opbeat.setUserContext(user)
            },

            setExtraContext: function setExtraContext(data) {
              Opbeat.setExtraContext(data)
            }
          }
        }
      ]
    }

    function $opbeatErrorProvider($provide) {
      $provide.decorator('$exceptionHandler', ['$delegate', '$opbeat', function $ExceptionHandlerDecorator($delegate, $opbeat) {
        return function $ExceptionHandler(exception, cause) {
          $opbeat.captureException(exception)
          return $delegate(exception, cause)
        }
      }])
    }

    function $opbeatInstrumentationProvider($provide, $opbeat) {
      var config = $opbeat.$get[0]().getConfig()
      var transactionOptions = {
        config: config
      }

      var instrumentation = new Instrumentation()

      // Before controller intialize transcation
      var traceBuffer = new TraceBuffer('beforeControllerTransaction', transactionOptions)

      // Route controller Instrumentation
      $provide.decorator('$controller', ['$delegate', '$location', '$rootScope', '$injector', function ($delegate, $location, $rootScope, $injector) {
        transactionStore.init($injector)

        var onRouteChange = function (e, current) {
          logger.log('opbeat.decorator.controller.onRouteChange', current)

          if (!config.get('isInstalled')) {
            logger.log('opbeat.instrumentation.onRouteChange.not.installed')
            return
          }

          if (!config.get('performance.enable')) {
            logger.log('- %c opbeat.instrumentation.disabled', 'color: #3360A3')
            return
          }

          var routeControllerName
          var routeController
          var transactionName

          // Detect controller
          if (current.controller) {
            routeController = current.controller
          } else if (current.views) {
            var keys = Object.keys(current.views)
            if (keys) {
              routeController = current.views[keys[0]].controller
            }
          }

          // Extract controller name
          if (typeof (routeController) === 'string') {
            routeControllerName = routeController
          }

          if (!routeControllerName) {
            logger.log('%c opbeat.decorator.controller.onRouteChange.error.routeControllerName.missing', 'background-color: #ffff00', current)
            return
          }

          if (current.$$route) { // ngRoute
            transactionName = current.$$route.originalPath
          } else if (current.url) { // UI Router
            transactionName = current.name // Use state name over URL
          }

          if (!transactionName) {
            logger.log('%c opbeat.decorator.controller.onRouteChange.error.transactionName.missing', 'background-color: #ffff00', current)
            return
          }

          var transaction = instrumentation.startTransaction(transactionName, 'transaction', transactionOptions)
          transaction.metadata.controllerName = routeControllerName

          // Update transaction store
          transactionStore.pushToUrl(window.location.href, transaction)

          // Update transaction reference in traceBuffer
          traceBuffer.setTransactionReference(transaction)

          // Lock traceBuffer, as we only want to migrate the initial traces to the first transaction
          traceBuffer.lock()

          // Add finished traces to transaction and flush buffer
          transaction.addEndedTraces(traceBuffer.traces)
          traceBuffer.flush()
        }

        $rootScope.$on('$routeChangeSuccess', onRouteChange) // ng-router
        $rootScope.$on('$stateChangeSuccess', onRouteChange) // ui-router

        return function () {
          logger.log('opbeat.decorator.controller.ctor')

          var args = Array.prototype.slice.call(arguments)
          var result = $delegate.apply(this, args)

          if (!config.get('performance.enable')) {
            logger.log('- %c opbeat.instrumentation.disabled', 'color: #3360A3')
            return result
          }

          var url = window.location.href
          var transaction = transactionStore.getRecentByUrl(url)

          var controllerInfo = utils.getControllerInfoFromArgs(args)
          var controllerName = controllerInfo.name
          var controllerScope = controllerInfo.scope
          var isRouteController = controllerName && transaction && transaction.metadata.controllerName === controllerName

          var onViewFinished = function (argument) {
            logger.log('opbeat.angular.controller.$onViewFinished')
            transactionStore.getAllByUrl(url).forEach(function (trans) {
              transaction.end()
            })
            transactionStore.clearByUrl(url)
          }

          if (isRouteController && controllerScope) {
            logger.log('opbeat.angular.controller', controllerName)
            controllerScope.$on('$ionicView.enter', onViewFinished)
            controllerScope.$on('$viewContentLoaded', onViewFinished)
          }

          logger.log('opbeat.decorator.controller.end')
          return result
        }
      }])

      $provide.decorator('$controller', ['$delegate', '$rootScope', '$rootElement', function ($delegate, $rootScope, $rootElement) {
        $rootScope._opbeatHasInstrumentedFactories = false
        $rootScope._opbeatHasInstrumentedDirectives = false

        var directivesInstrumentation = _dereq_('./instrumentation/angular/directives')($provide, traceBuffer)

        // Factory instrumentation
        if (!$rootScope._opbeatHasInstrumentedFactories) {
          var factories = utils.resolveAngularDependenciesByType($rootElement, 'factory')
          _dereq_('./instrumentation/angular/factories')($provide, traceBuffer).instrumentAll(factories)
          $rootScope._opbeatHasInstrumentedFactories = true
        }

        if (!$rootScope._opbeatHasInstrumentedDirectives) {
          // Custom directive instrumentation
          var directives = utils.resolveAngularDependenciesByType($rootElement, 'directive')
          directivesInstrumentation.instrumentAll(directives)
          $rootScope._opbeatHasInstrumentedDirectives = true

          // Core directives instrumentation
          directivesInstrumentation.instrumentCore()
        }

        return $delegate
      }])

      // Angular Core Instrumentation
      _dereq_('./instrumentation/angular/cacheFactory')($provide, traceBuffer)
      _dereq_('./instrumentation/angular/compile')($provide, traceBuffer)
      _dereq_('./instrumentation/angular/controller')($provide, traceBuffer)
      _dereq_('./instrumentation/angular/http')($provide, traceBuffer)
        // require('./instrumentation/angular/httpBackend')($provide, traceBuffer)
      _dereq_('./instrumentation/angular/resource')($provide, traceBuffer)
      _dereq_('./instrumentation/angular/templateRequest')($provide, traceBuffer)
    }

    window.angular.module('ngOpbeat', [])
      .provider('$opbeat', ngOpbeatProvider)
      .config(['$provide', '$opbeatProvider', $opbeatErrorProvider])
      .config(['$provide', '$opbeatProvider', $opbeatInstrumentationProvider])

    window.angular.module('angular-opbeat', ['ngOpbeat'])

  }, {
    "./instrumentation": 22,
    "./instrumentation/angular/cacheFactory": 14,
    "./instrumentation/angular/compile": 15,
    "./instrumentation/angular/controller": 16,
    "./instrumentation/angular/directives": 17,
    "./instrumentation/angular/factories": 18,
    "./instrumentation/angular/http": 19,
    "./instrumentation/angular/resource": 20,
    "./instrumentation/angular/templateRequest": 21,
    "./instrumentation/traceBuffer": 24,
    "./instrumentation/transactionStore": 27,
    "./instrumentation/utils": 28,
    "./lib/logger": 32,
    "./opbeat": 36
  }],
  10: [function (_dereq_, module, exports) {
    var Promise = _dereq_('es6-promise').Promise
    var utils = _dereq_('../lib/utils')
    var fileFetcher = _dereq_('../lib/fileFetcher')

    module.exports = {

      getFileSourceMapUrl: function (fileUrl) {
        var fileBasePath

        if (!fileUrl) {
          return Promise.reject('no fileUrl')
        }

        function _findSourceMappingURL(source) {
          var m = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)$/.exec(source)
          if (m && m[1]) {
            return m[1]
          }
          return null
        }

        if (fileUrl.split('/').length > 1) {
          fileBasePath = fileUrl.split('/').slice(0, -1).join('/') + '/'
        } else {
          fileBasePath = '/'
        }

        return new Promise(function (resolve, reject) {
          fileFetcher.getFile(fileUrl).then(function (source) {
            var sourceMapUrl = _findSourceMappingURL(source)
            if (sourceMapUrl) {
              sourceMapUrl = fileBasePath + sourceMapUrl
              resolve(sourceMapUrl)
            } else {
              reject('no sourceMapUrl')
            }
          }, reject)
        })
      },

      getExceptionContexts: function (url, line) {
        if (!url || !line) {
          return Promise.reject('no line or url')
        }

        return new Promise(function (resolve, reject) {
          fileFetcher.getFile(url).then(function (source) {
            line -= 1 // convert line to 0-based index

            var sourceLines = source.split('\n')
            var linesBefore = 5
            var linesAfter = 5

            var contexts = {
              preContext: [],
              contextLine: null,
              postContext: []
            }

            if (sourceLines.length) {
              var isMinified

              // Treat HTML files as non-minified
              if (source.indexOf('<html') > -1) {
                isMinified = false
              } else {
                isMinified = this.isSourceMinified(source)
              }

              // Don't generate contexts if source is minified
              if (isMinified) {
                return reject()
              }

              // Pre context
              var preStartIndex = Math.max(0, line - linesBefore - 1)
              var preEndIndex = Math.min(sourceLines.length, line - 1)
              for (var i = preStartIndex; i <= preEndIndex; ++i) {
                if (!utils.isUndefined(sourceLines[i])) {
                  contexts.preContext.push(sourceLines[i])
                }
              }

              // Line context
              contexts.contextLine = sourceLines[line]

              // Post context
              var postStartIndex = Math.min(sourceLines.length, line + 1)
              var postEndIndex = Math.min(sourceLines.length, line + linesAfter)
              for (var j = postStartIndex; j <= postEndIndex; ++j) {
                if (!utils.isUndefined(sourceLines[j])) {
                  contexts.postContext.push(sourceLines[j])
                }
              }
            }

            var charLimit = 1000
              // Circuit breaker for huge file contexts
            if (contexts.contextLine.length > charLimit) {
              reject('aborting generating contexts, as line is over 1000 chars')
            }

            contexts.preContext.forEach(function (line) {
              if (line.length > charLimit) {
                reject('aborting generating contexts, as preContext line is over 1000 chars')
              }
            })

            contexts.postContext.forEach(function (line) {
              if (line.length > charLimit) {
                reject('aborting generating contexts, as postContext line is over 1000 chars')
              }
            })

            resolve(contexts)
          }.bind(this), reject)
        }.bind(this))
      },

      isSourceMinified: function (source) {
        // Source: https://dxr.mozilla.org/mozilla-central/source/devtools/client/debugger/utils.js#62
        var SAMPLE_SIZE = 50 // no of lines
        var INDENT_COUNT_THRESHOLD = 5 // percentage
        var CHARACTER_LIMIT = 250 // line character limit

        var isMinified
        var lineEndIndex = 0
        var lineStartIndex = 0
        var lines = 0
        var indentCount = 0
        var overCharLimit = false

        if (!source) {
          return false
        }

        // Strip comments.
        source = source.replace(/\/\*[\S\s]*?\*\/|\/\/(.+|\n)/g, '')

        while (lines++ < SAMPLE_SIZE) {
          lineEndIndex = source.indexOf('\n', lineStartIndex)
          if (lineEndIndex === -1) {
            break
          }
          if (/^\s+/.test(source.slice(lineStartIndex, lineEndIndex))) {
            indentCount++
          }
          // For files with no indents but are not minified.
          if ((lineEndIndex - lineStartIndex) > CHARACTER_LIMIT) {
            overCharLimit = true
            break
          }
          lineStartIndex = lineEndIndex + 1
        }

        isMinified = ((indentCount / lines) * 100) < INDENT_COUNT_THRESHOLD || overCharLimit

        return isMinified
      }

    }

  }, {
    "../lib/fileFetcher": 31,
    "../lib/utils": 35,
    "es6-promise": 3
  }],
  11: [function (_dereq_, module, exports) {
    var Promise = _dereq_('es6-promise').Promise

    var logger = _dereq_('../lib/logger')
    var config = _dereq_('../lib/config')
    var transport = _dereq_('../lib/transport')
    var utils = _dereq_('../lib/utils')
    var context = _dereq_('./context')
    var stackTrace = _dereq_('./stacktrace')

    var promiseSequence = function (tasks) {
      var current = Promise.resolve()
      var results = []

      for (var k = 0; k < tasks.length; ++k) {
        results.push(current = current.then(tasks[k]))
      }

      return Promise.all(results)
    }

    module.exports = {

      getFramesForCurrent: function () {
        return stackTrace.get().then(function (frames) {
          var tasks = frames.map(function (frame) {
            return this.buildOpbeatFrame.bind(this, frame)
          }.bind(this))

          var allFrames = promiseSequence(tasks)

          return allFrames.then(function (opbeatFrames) {
            return opbeatFrames
          })
        }.bind(this))
      },

      buildOpbeatFrame: function buildOpbeatFrame(stack) {
        return new Promise(function (resolve, reject) {
          if (!stack.fileName && !stack.lineNumber) {
            // Probably an stack from IE, return empty frame as we can't use it.
            return resolve({})
          }

          if (!stack.columnNumber && !stack.lineNumber) {
            // We can't use frames with no columnNumber & lineNumber, so ignore for now
            return resolve({})
          }

          var filePath = this.cleanFilePath(stack.fileName)
          var fileName = this.filePathToFileName(filePath)

          if (this.isFileInline(filePath)) {
            fileName = '(inline script)'
          }

          // Build Opbeat frame data
          var frame = {
            'filename': fileName,
            'lineno': stack.lineNumber,
            'colno': stack.columnNumber,
            'function': stack.functionName || '<anonymous>',
            'abs_path': stack.fileName,
            'in_app': this.isFileInApp(filePath)
          }

          // Detect Sourcemaps
          var sourceMapResolver = context.getFileSourceMapUrl(filePath)

          sourceMapResolver.then(function (sourceMapUrl) {
            frame.sourcemap_url = sourceMapUrl
            resolve(frame)
          }, function () {
            // // Resolve contexts if no source map
            var filePath = this.cleanFilePath(stack.fileName)
            var contextsResolver = context.getExceptionContexts(filePath, stack.lineNumber)

            contextsResolver.then(function (contexts) {
              frame.pre_context = contexts.preContext
              frame.context_line = contexts.contextLine
              frame.post_context = contexts.postContext
              resolve(frame)
            })['catch'](function () {
              resolve(frame)
            })
          }.bind(this))
        }.bind(this))
      },

      stackInfoToOpbeatException: function (stackInfo) {
        return new Promise(function (resolve, reject) {
          if (stackInfo.stack && stackInfo.stack.length) {
            var tasks = stackInfo.stack.map(function (frame) {
              return this.buildOpbeatFrame.bind(this, frame)
            }.bind(this))

            var allFrames = promiseSequence(tasks)

            allFrames.then(function (frames) {
              stackInfo.frames = frames
              stackInfo.stack = null
              resolve(stackInfo)
            })
          } else {
            resolve(stackInfo)
          }
        }.bind(this))
      },

      processOpbeatException: function (exception) {
        var type = exception.type
        var message = String(exception.message) || 'Script error'
        var filePath = this.cleanFilePath(exception.fileurl)
        var fileName = this.filePathToFileName(filePath)
        var frames = exception.frames || []
        var culprit

        if (frames && frames.length) {
          // Opbeat.com expects frames oldest to newest and JS sends them as newest to oldest
          frames.reverse()
        } else if (fileName) {
          frames.push({
            filename: fileName,
            lineno: exception.lineno
          })
        }

        var stacktrace = {
          frames: frames
        }

        // Set fileName from last frame, if filename is missing
        if (!fileName && frames.length) {
          var lastFrame = frames[frames.length - 1]
          if (lastFrame.filename) {
            fileName = lastFrame.filename
          } else {
            // If filename empty, assume inline script
            fileName = '(inline script)'
          }
        }

        if (this.isFileInline(filePath)) {
          culprit = '(inline script)'
        } else {
          culprit = fileName
        }

        var data = {
          message: type + ': ' + message,
          culprit: culprit,
          exception: {
            type: type,
            value: message
          },
          http: {
            url: window.location.href
          },
          stacktrace: stacktrace,
          user: config.get('context.user'),
          level: null,
          logger: null,
          machine: null
        }

        data.extra = this.getBrowserSpecificMetadata()

        if (config.get('context.extra')) {
          data.extra = utils.mergeObject(data.extra, config.get('context.extra'))
        }

        logger.log('opbeat.exceptions.processOpbeatException', data)
        transport.sendError(data)
      },

      cleanFilePath: function (filePath) {
        if (!filePath) {
          filePath = ''
        }

        if (filePath === '<anonymous>') {
          filePath = ''
        }

        return filePath
      },

      filePathToFileName: function (fileUrl) {
        var origin = window.location.origin || window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : '')

        if (fileUrl.indexOf(origin) > -1) {
          fileUrl = fileUrl.replace(origin + '/', '')
        }

        return fileUrl
      },

      isFileInline: function (fileUrl) {
        if (fileUrl) {
          return window.location.href.indexOf(fileUrl) === 0
        } else {
          return false
        }
      },

      isFileInApp: function (filename) {
        var pattern = config.get('libraryPathPattern')
        return !RegExp(pattern).test(filename)
      },

      getBrowserSpecificMetadata: function () {
        var viewportInfo = utils.getViewPortInfo()
        var extra = {
          'environment': {
            'utcOffset': new Date().getTimezoneOffset() / -60.0,
            'browserWidth': viewportInfo.width,
            'browserHeight': viewportInfo.height,
            'screenWidth': window.screen.width,
            'screenHeight': window.screen.height,
            'language': navigator.language,
            'userAgent': navigator.userAgent,
            'platform': navigator.platform
          },
          'page': {
            'referer': document.referrer,
            'host': document.domain,
            'location': window.location.href
          }
        }

        return extra
      }

    }

  }, {
    "../lib/config": 30,
    "../lib/logger": 32,
    "../lib/transport": 34,
    "../lib/utils": 35,
    "./context": 10,
    "./stacktrace": 13,
    "es6-promise": 3
  }],
  12: [function (_dereq_, module, exports) {
    var Promise = _dereq_('es6-promise').Promise
    var stackTrace = _dereq_('./stacktrace')
    var frames = _dereq_('./frames')

    var Exceptions = function () {

    }

    Exceptions.prototype.install = function () {
      window.onerror = function (msg, file, line, col, error) {
        processError.call(this, error, msg, file, line, col)
      }.bind(this)
    }

    Exceptions.prototype.uninstall = function () {
      window.onerror = null
    }

    Exceptions.prototype.processError = function (err) {
      processError(err)
    }

    function processError(error, msg, file, line, col) {
      if (msg === 'Script error.' && !file) {
        // ignoring script errors: See https://github.com/getsentry/raven-js/issues/41
        return
      }

      var exception = {
        'message': error ? error.message : msg,
        'type': error ? error.name : null,
        'fileurl': file || null,
        'lineno': line || null,
        'colno': col || null
      }

      if (!exception.type) {
        // Try to extract type from message formatted like 'ReferenceError: Can't find variable: initHighlighting'
        if (exception.message.indexOf(':') > -1) {
          exception.type = exception.message.split(':')[0]
        }
      }

      var resolveStackFrames

      if (error) {
        resolveStackFrames = stackTrace.fromError(error)
      } else {
        resolveStackFrames = new Promise(function (resolve, reject) {
          resolve([{
            'fileName': file,
            'lineNumber': line,
            'columnNumber': col
          }])
        })
      }

      resolveStackFrames.then(function (stackFrames) {
        exception.stack = stackFrames || []
        return frames.stackInfoToOpbeatException(exception).then(function (exception) {
          frames.processOpbeatException(exception)
        })
      })['catch'](function () {})
    }

    module.exports = Exceptions

  }, {
    "./frames": 11,
    "./stacktrace": 13,
    "es6-promise": 3
  }],
  13: [function (_dereq_, module, exports) {
    var ErrorStackParser = _dereq_('error-stack-parser')
    var StackGenerator = _dereq_('stack-generator')
    var Promise = _dereq_('es6-promise').Promise
    var utils = _dereq_('../lib/utils')
    var ErrorStackNormalizer = _dereq_('error-stack-normalizer')

    var defaultOptions = {
      filter: function (stackframe) {
        // Filter out stackframes for this library by default
        return (stackframe.functionName || '').indexOf('StackTrace$$') === -1 &&
          (stackframe.functionName || '').indexOf('ErrorStackParser$$') === -1 &&
          (stackframe.functionName || '').indexOf('StackGenerator$$') === -1 &&
          (stackframe.functionName || '').indexOf('opbeatFunctionWrapper') === -1 &&
          (stackframe.fileName || '').indexOf('angular-opbeat.js') === -1 &&
          (stackframe.fileName || '').indexOf('angular-opbeat.min.js') === -1 &&
          (stackframe.fileName || '').indexOf('opbeat.js') === -1 &&
          (stackframe.fileName || '').indexOf('opbeat.min.js') === -1
      }
    }

    module.exports = {
      get: function StackTrace$$generate(opts) {
        try {
          // Error must be thrown to get stack in IE
          throw new Error()
        } catch (err) {
          if (_isShapedLikeParsableError(err)) {
            return this.fromError(err, opts)
          } else {
            return this.generateArtificially(opts)
          }
        }
      },

      generateArtificially: function StackTrace$$generateArtificially(opts) {
        opts = utils.mergeObject(defaultOptions, opts)

        var stackFrames = StackGenerator.backtrace(opts)
        if (typeof opts.filter === 'function') {
          stackFrames = stackFrames.filter(opts.filter)
        }

        stackFrames = ErrorStackNormalizer(stackFrames)

        return Promise.resolve(stackFrames)
      },

      fromError: function StackTrace$$fromError(error, opts) {
        opts = utils.mergeObject(defaultOptions, opts)

        return new Promise(function (resolve) {
          var stackFrames = ErrorStackParser.parse(error)
          if (typeof opts.filter === 'function') {
            stackFrames = stackFrames.filter(opts.filter)
          }

          stackFrames = ErrorStackNormalizer(stackFrames)

          resolve(Promise.all(stackFrames.map(function (sf) {
            return new Promise(function (resolve) {
              resolve(sf)
            })
          })))
        })
      }
    }

    function _isShapedLikeParsableError(err) {
      return err.stack || err['opera#sourceloc']
    }

  }, {
    "../lib/utils": 35,
    "error-stack-normalizer": 1,
    "error-stack-parser": 2,
    "es6-promise": 3,
    "stack-generator": 7
  }],
  14: [function (_dereq_, module, exports) {
    var utils = _dereq_('../utils')

    module.exports = function ($provide, traceBuffer) {
      // $cacheFactory instrumentation (this happens before routeChange -> using traceBuffer)
      $provide.decorator('$cacheFactory', ['$delegate', '$injector', function ($delegate, $injector) {
        return utils.instrumentModule($delegate, $injector, {
          traceBuffer: traceBuffer,
          prefix: function (args) {
            if (args.length) {
              return args[0] + 'Cache'
            } else {
              return 'cacheFactory'
            }
          },
          type: function () {
            return 'cache.' + this.prefix
          },
          signatureFormatter: function (key, args, options) {
            return ['$' + options.prefix, key.toUpperCase(), args[0]].join(' ')
          }
        })
      }])
    }

  }, {
    "../utils": 28
  }],
  15: [function (_dereq_, module, exports) {
    var utils = _dereq_('../utils')

    module.exports = function ($provide, traceBuffer) {
      // Template Compile Instrumentation
      $provide.decorator('$compile', ['$delegate', '$injector', function ($delegate, $injector) {
        return utils.instrumentModule($delegate, $injector, {
          type: 'template.$compile',
          prefix: '$compile',
          instrumentConstructor: true,
          traceBuffer: traceBuffer
        })
      }])
    }

  }, {
    "../utils": 28
  }],
  16: [function (_dereq_, module, exports) {
    var utils = _dereq_('../utils')
    var transactionStore = _dereq_('../transactionStore')

    module.exports = function ($provide, traceBuffer) {
      // Controller Instrumentation
      $provide.decorator('$controller', ['$delegate', '$injector', function ($delegate, $injector) {
        return function () {
          var args = Array.prototype.slice.call(arguments)
          var controllerInfo = utils.getControllerInfoFromArgs(args)

          if (controllerInfo.name) { // Only instrument controllers with a name
            return utils.instrumentModule($delegate, $injector, {
              traceBuffer: traceBuffer,
              instrumentConstructor: true,
              type: 'app.$controller',
              prefix: '$controller.' + controllerInfo.name
            }).apply(this, arguments)
          }

          return $delegate.apply(this, args)
        }
      }])
    }

  }, {
    "../transactionStore": 27,
    "../utils": 28
  }],
  17: [function (_dereq_, module, exports) {
    var utils = _dereq_('../utils')

    module.exports = function ($provide, traceBuffer) {
      var instrumentDirective = function (name) {
        var directiveName = name + 'Directive'
        $provide.decorator(directiveName, ['$delegate', '$injector', function ($delegate, $injector) {
          utils.instrumentObject($delegate[0], $injector, {
            type: 'template.$directive',
            prefix: '$directive.' + name,
            traceBuffer: traceBuffer
          })
          return $delegate
        }])
      }

      return {
        instrumentAll: function (modules) {
          modules.forEach(function (name) {
            instrumentDirective(name)
          })
        },
        instrumentCore: function () {
          // Core directive instrumentation
          var coreDirectives = ['ngBind', 'ngClass', 'ngModel', 'ngIf', 'ngInclude', 'ngRepeat', 'ngSrc', 'ngStyle', 'ngSwitch', 'ngTransclude']
          coreDirectives.forEach(function (name) {
            instrumentDirective(name)
          })
        }
      }
    }

  }, {
    "../utils": 28
  }],
  18: [function (_dereq_, module, exports) {
    var utils = _dereq_('../utils')

    module.exports = function ($provide, traceBuffer) {
      return {
        instrumentAll: function (modules) {
          modules.forEach(function (name) {
            $provide.decorator(name, ['$delegate', '$injector', function ($delegate, $injector) {
              utils.instrumentObject($delegate, $injector, {
                type: 'app.$factory',
                prefix: '$factory.' + name,
                traceBuffer: traceBuffer
              })
              return $delegate
            }])
          })
        }
      }
    }

  }, {
    "../utils": 28
  }],
  19: [function (_dereq_, module, exports) {
    var utils = _dereq_('../utils')

    module.exports = function ($provide, traceBuffer) {
      // HTTP Instrumentation
      $provide.decorator('$http', ['$delegate', '$injector', function ($delegate, $injector) {
        return utils.instrumentModule($delegate, $injector, {
          type: 'ext.$http',
          prefix: '$http',
          traceBuffer: traceBuffer,
          instrumentConstructor: true,
          signatureFormatter: function (key, args) {
            var text = ['$http']
            if (args.length) {
              if (args[0] !== null && typeof args[0] === 'object') {
                if (!args[0].method) {
                  args[0].method = 'get'
                }
                text = ['$http', args[0].method.toUpperCase(), args[0].url]
              } else if (typeof args[0] === 'string') {
                text = ['$http', args[0]]
              }
            }
            return text.join(' ')
          }
        })
      }])
    }

  }, {
    "../utils": 28
  }],
  20: [function (_dereq_, module, exports) {
    var utils = _dereq_('../utils')

    module.exports = function ($provide, traceBuffer) {
      try {
        // ngResource instrumentation
        $provide.decorator('$resource', ['$delegate', '$injector', function ($delegate, $injector) {
          return utils.instrumentModule($delegate, $injector, {
            traceBuffer: traceBuffer,
            prefix: '$resource',
            type: 'ext.$resource',
            signatureFormatter: function (key, args) {
              return ['$resource', key.toUpperCase(), args[0]].join(' ')
            }
          })
        }])
      } catch (e) {}
    }

  }, {
    "../utils": 28
  }],
  21: [function (_dereq_, module, exports) {
    var utils = _dereq_('../utils')

    module.exports = function ($provide, traceBuffer) {
      try {
        // Template Request Instrumentation
        $provide.decorator('$templateRequest', ['$delegate', '$injector', function ($delegate, $injector) {
          return utils.instrumentModule($delegate, $injector, {
            type: 'template.$templateRequest',
            prefix: '$templateRequest',
            traceBuffer: traceBuffer,
            instrumentConstructor: true,
            signatureFormatter: function (key, args) {
              var text = ['$templateRequest', args[0]]
              return text.join(' ')
            }
          })
        }])
      } catch (e) {}
    }

  }, {
    "../utils": 28
  }],
  22: [function (_dereq_, module, exports) {
    var Transaction = _dereq_('./transaction')
    var request = _dereq_('../lib/transport')
    var logger = _dereq_('../lib/logger')

    var Instrumentation = function () {
      this._queue = []
      this.scheduler = setInterval(this._dispatch.bind(this), 5000)
    }

    Instrumentation.prototype.add = function (transaction) {
      this._queue.push(transaction)
    }

    Instrumentation.prototype.startTransaction = function (name, type, options) {
      return new Transaction(this, name, type, options)
    }

    Instrumentation.prototype._flush = function () {
      this._queue = []
    }

    Instrumentation.prototype._dispatch = function () {
      logger.log('Instrumentation.scheduler._dispatch', this._queue.length)

      if (!this._queue.length) {
        return
      }

      var transactions = this._formatTransactions()
      var flush = this._flush.bind(this)

      request.sendTransaction(transactions).then(flush, flush)
    }

    Instrumentation.prototype._formatTransactions = function () {
      var transactions = groupTransactions(this._queue)

      var traces = [].concat.apply([], this._queue.map(function (trans) {
        return trans.traces
      }))

      var groupedTraces = groupTraces(traces)
      var groupedTracesTimings = getRawGroupedTracesTimings(traces, groupedTraces)

      return {
        transactions: transactions,
        traces: {
          groups: groupedTraces,
          raw: groupedTracesTimings
        }
      }
    }

    function groupTransactions(transactions) {
      var groups = grouper(transactions, transactionGroupingKey)
      return Object.keys(groups).map(function (key) {
        var trans = groups[key][0]
        var durations = groups[key].map(function (trans) {
          return trans.duration()
        })
        return {
          transaction: trans.name,
          result: trans.result,
          kind: trans.type,
          timestamp: groupingTs(trans._startStamp).toISOString(),
          durations: durations
        }
      })
    }

    function getRawGroupedTracesTimings(traces, groupedTraces) {
      var getTraceGroupIndex = function (col, item) {
        var index = 0
        var targetGroup = traceGroupingKey(item)

        col.forEach(function (item, i) {
          if (item._group === targetGroup) {
            index = i
          }
        })

        return index
      }

      var groupedByTransaction = grouper(traces, function (trace) {
        return trace.transaction.name + '|' + trace.transaction._start
      })

      return Object.keys(groupedByTransaction).map(function (key) {
        var traces = groupedByTransaction[key]
        var transaction = traces[0].transaction

        var data = [transaction.duration()]

        traces.forEach(function (trace) {
          var groupIndex = getTraceGroupIndex(groupedTraces, trace)
          var relativeTraceStart = trace._start - transaction._start

          if (relativeTraceStart > transaction.duration()) {
            logger.log('%c -- opbeat.instrumentation.getRawGroupedTracesTimings.error.relativeTraceStartLargerThanTransactionDuration', 'color: #ff0000', relativeTraceStart, transaction._start, transaction.duration(), {
              trace: trace,
              transaction: transaction
            })
          } else if (relativeTraceStart < 0) {
            logger.log('%c -- opbeat.instrumentation.getRawGroupedTracesTimings.error.negativeRelativeTraceStart!', 'color: #ff0000', relativeTraceStart, trace._start, transaction._start, trace)
          } else if (trace.duration() > transaction.duration()) {
            logger.log('%c -- opbeat.instrumentation.getRawGroupedTracesTimings.error.traceDurationLargerThanTranscationDuration', 'color: #ff0000', trace.duration(), transaction.duration(), {
              trace: trace,
              transaction: transaction
            })
          } else {
            data.push([groupIndex, relativeTraceStart, trace.duration()])
          }
        })

        return data
      })
    }

    function groupTraces(traces) {
      var groupedByMinute = grouper(traces, traceGroupingKey)

      return Object.keys(groupedByMinute).map(function (key) {
        var trace = groupedByMinute[key][0]

        var startTime = trace._start
        if (trace.transaction) {
          startTime = startTime - trace.transaction._start
        } else {
          startTime = 0
        }

        return {
          transaction: trace.transaction.name,
          signature: trace.signature,
          kind: trace.type,
          timestamp: trace._startStamp.toISOString(),
          parents: trace.ancestors(),
          extra: {
            _frames: trace.frames
          },
          _group: key
        }
      }).sort(function (a, b) {
        return a.start_time - b.start_time
      })
    }

    function grouper(arr, func) {
      var groups = {}

      arr.forEach(function (obj) {
        var key = func(obj)
        if (key in groups) {
          groups[key].push(obj)
        } else {
          groups[key] = [obj]
        }

        obj._traceGroup = key
      })

      return groups
    }

    function groupingTs(ts) {
      return new Date(ts.getFullYear(), ts.getMonth(), ts.getDate(), ts.getHours(), ts.getMinutes())
    }

    function transactionGroupingKey(trans) {
      return [
        groupingTs(trans._startStamp).getTime(),
        trans.name,
        trans.result,
        trans.type
      ].join('-')
    }

    function traceGroupingKey(trace) {
      var ancestors = trace.ancestors().map(function (trace) {
        return trace.signature
      }).join(',')

      return [
        groupingTs(trace._startStamp).getTime(),
        trace.transaction.name,
        ancestors,
        trace.signature,
        trace.type
      ].join('-')
    }

    module.exports = Instrumentation

  }, {
    "../lib/logger": 32,
    "../lib/transport": 34,
    "./transaction": 26
  }],
  23: [function (_dereq_, module, exports) {
    var Promise = _dereq_('es6-promise').Promise
    var logger = _dereq_('../lib/logger')
    var frames = _dereq_('../exceptions/frames')
    var traceCache = _dereq_('./traceCache')

    var Trace = module.exports = function (transaction, signature, type, options) {
      this.transaction = transaction
      this.signature = signature
      this.type = type
      this.ended = false
      this._parent = null
      this._diff = null
      this._end = null

      // Start timers
      this._start = window.performance.now()
      this._startStamp = new Date()

      this._isFinish = new Promise(function (resolve, reject) {
        this._markFinishedFunc = resolve
      }.bind(this))

      var shouldGenerateStackFrames = options.config.get('performance.enableStackFrames')

      logger.log('%c -- opbeat.instrumentation.trace.shouldGenerateStackFrames', 'color: #9a6bcb', this.signature, shouldGenerateStackFrames)

      if (shouldGenerateStackFrames) {
        this.getTraceStackFrames(function (frames) {
          if (frames) {
            this.frames = frames.reverse() // Reverse frames to make Opbeat happy
          }
          this._markFinishedFunc() // Mark the trace as finished
        }.bind(this))
      } else {
        this._markFinishedFunc() // Mark the trace as finished
      }

      logger.log('%c -- opbeat.instrumentation.trace.start', 'color: #9a6bcb', this.signature, this._start)
    }

    Trace.prototype.calcDiff = function () {
      if (!this._end || !this._start) {
        return
      }
      this._diff = this._end - this._start
    }

    Trace.prototype.end = function () {
      this._end = window.performance.now()

      this.calcDiff()
      this.ended = true

      logger.log('%c -- opbeat.instrumentation.trace.end', 'color: #9a6bcb', this.signature, this._end, this._diff)

      this._isFinish.then(function () {
        this.transaction._onTraceEnd(this)
      }.bind(this))
    }

    Trace.prototype.duration = function () {
      if (!this.ended) {
        logger.log('%c -- opbeat.instrumentation.trace.duration.error.un-ended.trace!', 'color: #ff0000', this.signature, this._diff)
        return null
      }

      return parseFloat(this._diff)
    }

    Trace.prototype.startTime = function () {
      if (!this.ended || !this.transaction.ended) {
        logger.log('%c -- opbeat.instrumentation.trace.startTime.error.un-ended.trace!', 'color: #ff0000', this.signature, this._diff)
        return null
      }

      return this._start
    }

    Trace.prototype.ancestors = function () {
      var parent = this.parent()
      if (!parent) {
        return []
      } else {
        return [parent.signature]
      }
    }

    Trace.prototype.parent = function () {
      return this._parent
    }

    Trace.prototype.setParent = function (val) {
      this._parent = val
    }

    Trace.prototype.getFingerprint = function () {
      var key = [this.transaction.name, this.signature, this.type]

      // Iterate over parents
      var prev = this._parent
      while (prev) {
        key.push(prev.signature)
        prev = prev._parent
      }

      return key.join('-')
    }

    Trace.prototype.getTraceStackFrames = function (callback) {
      // Use callbacks instead of Promises to keep the stack
      var key = this.getFingerprint()
      var traceFrames = traceCache.get(key)
      if (traceFrames) {
        callback(traceFrames)
      } else {
        frames.getFramesForCurrent().then(function (traceFrames) {
          traceCache.set(key, traceFrames)
          callback(traceFrames)
        })['catch'](function () {
          callback(null)
        })
      }
    }

    module.exports = Trace

  }, {
    "../exceptions/frames": 11,
    "../lib/logger": 32,
    "./traceCache": 25,
    "es6-promise": 3
  }],
  24: [function (_dereq_, module, exports) {
    var logger = _dereq_('../lib/logger')
    var Trace = _dereq_('./trace')

    var TraceBuffer = function (name, options) {
      this.traces = []
      this.activetraces = []
      this.traceTransactionReference = this
      this._isLocked = false
      this._options = options
    }

    TraceBuffer.prototype.startTrace = function (signature, type) {
      logger.log('opbeat.instrumentation.TraceBuffer.startTrace', signature)

      var trace = new Trace(this.traceTransactionReference, signature, type, this._options)

      if (this._isLocked) {
        trace.setParent(this.traceTransactionReference._rootTrace)
      }

      this.activetraces.push(trace)

      return trace
    }

    TraceBuffer.prototype._onTraceEnd = function (trace) {
      logger.log('opbeat.instrumentation.TraceBuffer._endTrace', trace.signature)
      this.traces.push(trace)

      var index = this.activetraces.indexOf(trace)
      if (index > -1) {
        this.activetraces.splice(index, 1)
      }
    }

    TraceBuffer.prototype.setTransactionReference = function (transaction) {
      logger.log('opbeat.instrumentation.TraceBuffer.setTransactionReference', transaction)

      if (this._isLocked) {
        return
      }

      this.traceTransactionReference = transaction

      this.activetraces.forEach(function (trace) {
        trace.transaction = this.traceTransactionReference
        trace.setParent(this.traceTransactionReference._rootTrace)
      }.bind(this))

      this.traces.forEach(function (trace) {
        trace.transaction = this.traceTransactionReference
        trace.setParent(this.traceTransactionReference._rootTrace)
      }.bind(this))
    }

    TraceBuffer.prototype.flush = function () {
      this.traces = []
      this.activetraces = []
    }

    TraceBuffer.prototype.lock = function () {
      this._isLocked = true
    }

    TraceBuffer.prototype.isLocked = function () {
      return this._isLocked
    }

    module.exports = TraceBuffer

  }, {
    "../lib/logger": 32,
    "./trace": 23
  }],
  25: [function (_dereq_, module, exports) {
    var SimpleCache = _dereq_('simple-lru-cache')

    module.exports = new SimpleCache({
      'maxSize': 5000
    })

  }, {
    "simple-lru-cache": 5
  }],
  26: [function (_dereq_, module, exports) {
    var logger = _dereq_('../lib/logger')
    var Trace = _dereq_('./trace')
    var utils = _dereq_('../lib/utils')

    var Transaction = function (queue, name, type, options) {
      this.metadata = {}
      this.name = name
      this.type = type
      this.ended = false
      this._markDoneAfterLastTrace = false
      this._isDone = false
      this._options = options
      this.uuid = utils.generateUuid()

      this.traces = []
      this._activeTraces = {}
      this._queue = queue

      logger.log('- %c opbeat.instrumentation.transaction.ctor', 'color: #3360A3', this.name)

      // A transaction should always have a root trace spanning the entire transaction.
      this._rootTrace = this.startTrace('transaction', 'transaction', this._options)
      this._startStamp = this._rootTrace._startStamp
      this._start = this._rootTrace._start

      this.duration = this._rootTrace.duration.bind(this._rootTrace)
    }

    Transaction.prototype.startTrace = function (signature, type) {
      var trace = new Trace(this, signature, type, this._options)
      if (this._rootTrace) {
        trace.setParent(this._rootTrace)
      }

      this._activeTraces[trace.getFingerprint()] = trace

      logger.log('- %c  opbeat.instrumentation.transaction.startTrace', 'color: #3360A3', trace.signature)

      return trace
    }

    Transaction.prototype.end = function () {
      if (this.ended) {
        return
      }

      this.ended = true
      this._rootTrace.end()

      logger.log('- %c opbeat.instrumentation.transaction.end', 'color: #3360A3', this.name, Object.keys(this._activeTraces).length)

      if (Object.keys(this._activeTraces).length > 0) {
        this._markDoneAfterLastTrace = true
      } else {
        this._markAsDone()
      }
    }

    Transaction.prototype.addEndedTraces = function (existingTraces) {
      this.traces = this.traces.concat(existingTraces)
    }

    Transaction.prototype._markAsDone = function () {
      logger.log('- %c opbeat.instrumentation.transaction._markAsDone', 'color: #3360A3', this.name)

      if (this._isDone) {
        return
      }

      this._isDone = true

      // When all traces are finished, the transaction can be added to the queue
      var whenAllTracesFinished = this.traces.map(function (trace) {
        return trace._isFinish
      })

      Promise.all(whenAllTracesFinished).then(function () {
        logger.log('- %c opbeat.instrumentation.transaction.whenAllTracesFinished', 'color: #3360A3', this.name)

        this._adjustStartToEarliestTrace()
        this._adjustDurationToLongestTrace()

        this._queue.add(this)
      }.bind(this))
    }

    Transaction.prototype._adjustStartToEarliestTrace = function () {
      var trace = getEarliestTrace(this.traces)

      if (trace) {
        this._rootTrace._start = trace._start
        this._rootTrace._startStamp = trace._startStamp
        this._rootTrace.calcDiff()

        this._startStamp = this._rootTrace._startStamp
        this._start = this._rootTrace._start
      }
    }

    Transaction.prototype._adjustDurationToLongestTrace = function () {
      var trace = getLongestTrace(this.traces)

      if (trace) {
        var currentDuration = this._rootTrace._diff
        var maxDuration = trace.duration()
        if (maxDuration > currentDuration) {
          this._rootTrace._diff = maxDuration
        }
      }
    }

    Transaction.prototype._onTraceEnd = function (trace) {
      this.traces.push(trace)

      logger.log('-- %c  opbeat.instrumentation.transaction.traceCount', 'color: red', this.traces.length)
      logger.log('- %c  opbeat.instrumentation.transaction._endTrace', 'color: #3360A3', trace.signature)

      // Remove trace from _activeTraces
      delete this._activeTraces[trace.getFingerprint()]

      if (this._markDoneAfterLastTrace && Object.keys(this._activeTraces).length === 0) {
        this._markAsDone()
      }
    }

    function getLongestTrace(traces) {
      var match = null

      traces.forEach(function (trace) {
        if (!match) {
          match = trace
        }
        if (match && match.duration() < trace.duration()) {
          match = trace
        }
      })

      return match
    }

    function getEarliestTrace(traces) {
      var earliestTrace = null

      traces.forEach(function (trace) {
        if (!earliestTrace) {
          earliestTrace = trace
        }
        if (earliestTrace && earliestTrace._start > trace._start) {
          earliestTrace = trace
        }
      })

      return earliestTrace
    }

    module.exports = Transaction

  }, {
    "../lib/logger": 32,
    "../lib/utils": 35,
    "./trace": 23
  }],
  27: [function (_dereq_, module, exports) {
    var logger = _dereq_('../lib/logger')

    var TransactionStore = function () {

    }

    TransactionStore.prototype.init = function ($injector) {
      this.$rootScope = $injector.get('$rootScope')
      this.$rootScope._opbeatTransactionStore = {}
    }

    TransactionStore.prototype.pushToUrl = function (url, transaction) {
      var transactions = this.$rootScope._opbeatTransactionStore[url] || []
      transactions.push(transaction)

      logger.log('opbeat.instrumentation.TransactionStore.pushToUrl', url, transaction)

      this.$rootScope._opbeatTransactionStore[url] = transactions
    }

    TransactionStore.prototype.getAllByUrl = function (url) {
      logger.log('opbeat.instrumentation.TransactionStore.pushToUrl', url, this.$rootScope)

      if (!this.$rootScope) {
        return []
      }

      return this.$rootScope._opbeatTransactionStore[url] || []
    }

    TransactionStore.prototype.getRecentByUrl = function (url) {
      var transactions

      if (this.$rootScope) {
        transactions = this.$rootScope._opbeatTransactionStore[url]
      }

      logger.log('opbeat.instrumentation.TransactionStore.getRecentByUrl', url, transactions)

      if (transactions && transactions.length) {
        return transactions.slice(-1)[0]
      }

      return null
    }

    TransactionStore.prototype.clearByUrl = function (url) {
      this.$rootScope._opbeatTransactionStore[url] = []
    }

    module.exports = new TransactionStore()

  }, {
    "../lib/logger": 32
  }],
  28: [function (_dereq_, module, exports) {
    var logger = _dereq_('../lib/logger')
    var utils = _dereq_('../lib/utils')
    var config = _dereq_('../lib/config')
    var transactionStore = _dereq_('./transactionStore')

    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m
    var FN_ARG_SPLIT = /,/
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg

    module.exports = {
      wrapMethod: function (_opbeatOriginalFunction, _opbeatBefore, _opbeatAfter, _opbeatContext) {
        var namedArguments = _extractNamedFunctionArgs(_opbeatOriginalFunction).join(',')
        var context = {
          _opbeatOriginalFunction: _opbeatOriginalFunction,
          _opbeatBefore: _opbeatBefore,
          _opbeatAfter: _opbeatAfter,
          _opbeatContext: _opbeatContext
        }

        return _buildWrapperFunction(context, namedArguments)
      },

      instrumentMethodWithCallback: function (fn, fnName, type, options) {
        options = options || {}
        var nameParts = []

        if (!config.get('isInstalled')) {
          logger.log('opbeat.instrumentation.instrumentMethodWithCallback.not.installed')
          return fn
        }

        if (!config.get('performance.enable')) {
          logger.log('- %c opbeat.instrumentation.instrumentMethodWithCallback.disabled', 'color: #3360A3')
          return fn
        }

        if (options.prefix) {
          if (typeof options.prefix === 'function') {
            var args = options.wrapper ? options.wrapper.args : []
            options.prefix = options.prefix.call(this, args)
          }
          nameParts.push(options.prefix)
        }

        if (fnName) {
          nameParts.push(fnName)
        }

        var name = nameParts.join('.')
        var ref = fn
        var context = {
          traceName: name,
          traceType: type,
          traceBuffer: options.traceBuffer,
          transactionStore: transactionStore,
          fn: fn,
          options: options
        }

        var wrappedMethod = this.wrapMethod(ref, function instrumentMethodWithCallbackBefore(context) {
          var args = Array.prototype.slice.call(arguments).slice(1)
          var callback = args[options.callbackIndex]

          if (typeof callback === 'function') {
            // Wrap callback
            var wrappedCallback = this.wrapMethod(callback, function instrumentMethodWithCallbackBeforeCallback() {
              instrumentMethodAfter.apply(this, [context])
              return {}
            }, null)

            // Override callback with wrapped one
            args[context.options.callbackIndex] = wrappedCallback
          }

          // Call base
          return instrumentMethodBefore.apply(this, [context].concat(args))
        }.bind(this), null, context)

        wrappedMethod.original = ref

        return wrappedMethod
      },

      instrumentMethod: function (fn, type, options) {
        options = options || {}

        var nameParts = []

        if (options.prefix) {
          if (typeof options.prefix === 'function') {
            var args = options.wrapper ? options.wrapper.args : []
            options.prefix = options.prefix.call(this, args)
          }
          nameParts.push(options.prefix)
        }

        var fnName
        if (typeof fn === 'function' && fn.name) {
          fnName = fn.name
        } else if (options.fnName) {
          fnName = options.fnName
        }

        if (fnName) {
          nameParts.push(fnName)
        }

        var name = nameParts.join('.')

        if (!config.get('isInstalled')) {
          logger.log('opbeat.instrumentation.instrumentMethod.not.installed')
          return fn
        }

        if (!config.get('performance.enable')) {
          logger.log('- %c opbeat.instrumentation.instrumentMethod.disabled', 'color: #3360A3')
          return fn
        }

        var traceType
        if (typeof type === 'function') {
          traceType = type.call(options)
        } else {
          traceType = type
        }

        var context = {
          traceName: name,
          traceType: traceType,
          traceBuffer: options.traceBuffer,
          options: options,
          fn: fn,
          fnName: fnName,
          transactionStore: transactionStore
        }

        var wrappedMethod = this.wrapMethod(fn, instrumentMethodBefore, instrumentMethodAfter, context)
        wrappedMethod.original = fn

        // Copy all properties over
        _copyProperties(wrappedMethod.original, wrappedMethod)

        return wrappedMethod
      },

      instrumentModule: function ($delegate, $injector, options) {
        var self = this

        if (!config.get('isInstalled')) {
          logger.log('opbeat.instrumentation.instrumentModule.not.installed')
          return $delegate
        }

        if (!config.get('performance.enable')) {
          logger.log('- %c opbeat.instrumentation.instrumentModule.disabled', 'color: #3360A3')
          return $delegate
        }

        var opbeatInstrumentInstanceWrapperFunction = function () {
          var args = Array.prototype.slice.call(arguments)

          var wrapped = $delegate

          // Instrument wrapped constructor
          if (options.instrumentConstructor) {
            wrapped = self.instrumentMethod($delegate, options.type, options)
          }

          var result = wrapped.apply(this, args)

          options.wrapper = {
            args: args
          }

          self.instrumentObject(result, $injector, options)
          return result
        }

        // Copy all static properties over
        _copyProperties($delegate, opbeatInstrumentInstanceWrapperFunction)
        this.instrumentObject(opbeatInstrumentInstanceWrapperFunction, $injector, options)

        return opbeatInstrumentInstanceWrapperFunction
      },

      instrumentObject: function (object, $injector, options) {
        options = options || {}

        if (!config.get('isInstalled')) {
          logger.log('opbeat.instrumentation.instrumentObject.not.installed')
          return object
        }

        if (!config.get('performance.enable')) {
          logger.log('- %c opbeat.instrumentation.instrumentObject.disabled', 'color: #3360A3')
          return object
        }

        // Instrument static functions
        this.getObjectFunctions(object).forEach(function (funcScope) {
          var subOptions = utils.mergeObject(options, {})
          subOptions.fnName = funcScope.property
          object[funcScope.property] = this.instrumentMethod(funcScope.ref, options.type, subOptions)
        }.bind(this))

        return object
      },

      uninstrumentMethod: function (module, fn) {
        var ref = module[fn]
        if (ref.original) {
          module[fn] = ref.original
        }
      },

      getObjectFunctions: function (scope) {
        return Object.keys(scope).filter(function (key) {
          return typeof scope[key] === 'function'
        }).map(function (property) {
          var ref = scope[property]
          return {
            scope: scope,
            property: property,
            ref: ref
          }
        })
      },

      getControllerInfoFromArgs: function (args) {
        var scope, name

        if (typeof args[0] === 'string') {
          name = args[0]
        } else if (typeof args[0] === 'function') {
          name = args[0].name

          // Function has been wrapped by us, use original function name
          if (name === 'opbeatFunctionWrapper' && args[0].original) {
            name = args[0].original.name
          }
        }

        if (typeof args[1] === 'object') {
          scope = args[1].$scope
        }

        return {
          scope: scope,
          name: name
        }
      },

      resolveAngularDependenciesByType: function ($rootElement, type) {
        var appName = $rootElement.attr('ng-app') || config.get('angularAppName')

        if (!appName) {
          return []
        }

        return window.angular.module(appName)._invokeQueue.filter(function (m) {
          return m[1] === type
        }).map(function (m) {
          return m[2][0]
        })
      }
    }

    function instrumentMethodBefore(context) {
      // Optimized copy of arguments (V8 https://github.com/GoogleChrome/devtools-docs/issues/53#issuecomment-51941358)
      var args = new Array(arguments.length)
      for (var i = 0, l = arguments.length; i < l; i++) {
        args[i] = arguments[i]
      }

      args = args.slice(1)

      var name = context.traceName
      var transactionStore = context.transactionStore

      var transaction = transactionStore.getRecentByUrl(window.location.href)
      if (!transaction && context.traceBuffer && !context.traceBuffer.isLocked()) {
        transaction = context.traceBuffer
      }

      if (context.options.signatureFormatter) {
        name = context.options.signatureFormatter.apply(this, [context.fnName, args, context.options])
      }

      if (transaction) {
        var trace = transaction.startTrace(name, context.traceType, context.options)
        context.trace = trace
      } else {
        logger.log('%c instrumentMethodBefore.error.transaction.missing', 'background-color: #ffff00', context)
      }

      return {
        args: args
      }
    }

    function _copyProperties(source, target) {
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          target[key] = source[key]
        }
      }
    }

    function instrumentMethodAfter(context) {
      if (context.trace) {
        context.trace.end()
      }
    }

    function _extractNamedFunctionArgs(fn) {
      var fnText = fn.toString().replace(STRIP_COMMENTS, '')
      var argDecl = fnText.match(FN_ARGS)

      if (argDecl && argDecl.length && argDecl.length === 2) {
        return argDecl[1].split(FN_ARG_SPLIT)
      }

      return []
    }

    function _buildWrapperFunction(ctx, funcArguments) {
      var funcBody = 'var args = new Array(arguments.length)\n' +
        'for (var i = 0, l = arguments.length; i < l; i++) {\n' +
        '  args[i] = arguments[i]\n' +
        '}\n' +
        '// Before callback\n' +
        'if (typeof _opbeatBefore === "function") {\n' +
        'var beforeData = _opbeatBefore.apply(this, [_opbeatContext].concat(args))\n' +
        'if (beforeData.args) {\n' +
        ' args = beforeData.args\n' +
        '}\n' +
        '}\n' +
        '// Execute original function\n' +
        'var result = _opbeatOriginalFunction.apply(this, args)\n' +
        '// After callback\n' +
        'if (typeof _opbeatAfter === "function") {\n' +
        '  // After + Promise handling\n' +
        '  if (result && typeof result.then === "function") {\n' +
        '    result.finally(function () {\n' +
        '      _opbeatAfter.apply(this, [_opbeatContext].concat(args))\n' +
        '    }.bind(this))\n' +
        '  } else {\n' +
        '    _opbeatAfter.apply(this, [_opbeatContext].concat(args))\n' +
        '  }\n' +
        '}\n' +
        'return result\n'

      var newBody = []
      for (var k in ctx) {
        var i = 'var ' + k + ' = ctx["' + k + '"];'
        newBody.push(i)
      }

      var res = 'return function opbeatFunctionWrapper(' + funcArguments + '){ ' + funcBody + ' }'
      newBody.push(res)
      var F = new Function('ctx', newBody.join('\n')) // eslint-disable-line no-new-func
      return F(ctx)
    }

  }, {
    "../lib/config": 30,
    "../lib/logger": 32,
    "../lib/utils": 35,
    "./transactionStore": 27
  }],
  29: [function (_dereq_, module, exports) {
    var utils = _dereq_('./utils')

    function api(opbeat, queuedCommands) {
      this.q = []

      this.opbeat = opbeat
      this.execute = utils.functionBind(this.execute, this)
      this.push = utils.functionBind(this.push, this)

      if (queuedCommands) {
        for (var i = 0; i < queuedCommands.length; i++) {
          var cmd = queuedCommands[i]
          this.push.apply(this, cmd)
        }
      }
    }

    api.prototype.execute = function (cmd, args) {
      return this.opbeat[cmd].apply(this.opbeat, args)
    }

    api.prototype.push = function () {
      var argsArray = Array.prototype.slice.call(arguments)

      var cmd = argsArray.slice(0, 1)[0]
      var args = argsArray.slice(1)

      this.execute(cmd, args)
    }

    module.exports = api

  }, {
    "./utils": 35
  }],
  30: [function (_dereq_, module, exports) {
    var utils = _dereq_('./utils')
    var storage = _dereq_('./storage')

    function Config() {
      this.config = {}
      this.defaults = {
        VERSION: 'v1.2.3',
        apiHost: 'intake.opbeat.com',
        isInstalled: false,
        orgId: null,
        appId: null,
        angularAppName: null,
        performance: {
          enable: true,
          enableStackFrames: false
        },
        libraryPathPattern: '(node_modules|bower_components|webpack)',
        context: {
          user: {
            uuid: _generateUUID()
          },
          extra: null
        }
      }

      // Only generate stack frames 10% of the time
      var shouldGenerateStackFrames = utils.getRandomInt(0, 10) === 1
      if (shouldGenerateStackFrames) {
        this.defaults.performance.enableStackFrames = shouldGenerateStackFrames
      }
    }

    Config.prototype.init = function () {
      var scriptData = _getConfigFromScript()
      this.setConfig(scriptData)
    }

    Config.prototype.get = function (key) {
      return utils.arrayReduce(key.split('.'), function (obj, i) {
        return obj[i]
      }, this.config)
    }

    Config.prototype.set = function (key, value) {
      var levels = key.split('.')
      var max_level = levels.length - 1
      var target = this.config

      utils.arraySome(levels, function (level, i) {
        if (typeof level === 'undefined') {
          return true
        }
        if (i === max_level) {
          target[level] = value
        } else {
          var obj = target[level] || {}
          target[level] = obj
          target = obj
        }
      })
    }

    Config.prototype.setConfig = function (properties) {
      properties = properties || {}
      this.config = utils.mergeObject(this.defaults, properties)
    }

    Config.prototype.isValid = function () {
      var requiredKeys = ['appId', 'orgId']
      var values = utils.arrayMap(requiredKeys, utils.functionBind(function (key) {
        return (this.config[key] === null) || (this.config[key] === undefined)
      }, this))

      return utils.arrayIndexOf(values, true) === -1
    }

    function _generateUUID() {
      var key = 'opbeat-uuid'
      var uuid = storage.get(key)

      if (!uuid) {
        uuid = utils.generateUuid()
        storage.set(key, uuid)
      }

      return uuid
    }

    var _getConfigFromScript = function () {
      var script = utils.getCurrentScript()
      var config = _getDataAttributesFromNode(script)
      return config
    }

    function _getDataAttributesFromNode(node) {
      var dataAttrs = {}
      var dataRegex = /^data\-([\w\-]+)$/

      if (node) {
        var attrs = node.attributes
        for (var i = 0; i < attrs.length; i++) {
          var attr = attrs[i]
          if (dataRegex.test(attr.nodeName)) {
            var key = attr.nodeName.match(dataRegex)[1]

            // camelCase key
            key = utils.arrayMap(key.split('-'), function (group, index) {
              return index > 0 ? group.charAt(0).toUpperCase() + group.substring(1) : group
            }).join('')

            dataAttrs[key] = attr.value || attr.nodeValue
          }
        }
      }

      return dataAttrs
    }

    module.exports = new Config()

  }, {
    "./storage": 33,
    "./utils": 35
  }],
  31: [function (_dereq_, module, exports) {
    var Promise = _dereq_('es6-promise').Promise
    var SimpleCache = _dereq_('simple-lru-cache')
    var transport = _dereq_('./transport')

    var cache = new SimpleCache({
      'maxSize': 1000
    })

    var fetchQueue = {}

    var getFileFromNetwork = function (url) {
      return new Promise(function (resolve, reject) {
        if (fetchQueue[url]) {
          fetchQueue[url].push(resolve)
          return
        }

        fetchQueue[url] = []

        transport.getFile(url).then(function (source) {
          cache.set(url, source)
          resolve(source)

          if (fetchQueue[url]) {
            fetchQueue[url].forEach(function (fn) {
              fn()
            })
          }
          fetchQueue[url] = null
        }, function (err) {
          fetchQueue[url] = null
          reject(err)
        })
      })
    }

    var getFileFromCache = function (url, missCallback) {
      return new Promise(function (resolve, reject) {
        var cachedSource = cache.get(url)
        if (cachedSource) {
          resolve(cachedSource)
        } else {
          reject()
        }
      })
    }

    module.exports = {

      getFile: function (url) {
        return new Promise(function (resolve, reject) {
          getFileFromCache(url).then(function (fileSource) { // Try to get from cache
            resolve(fileSource)
          }, function () {
            getFileFromNetwork(url).then(function (fileSource) { // then try network
                resolve(fileSource)
              }, reject) // give up
          })
        })
      }
    }

  }, {
    "./transport": 34,
    "es6-promise": 3,
    "simple-lru-cache": 5
  }],
  32: [function (_dereq_, module, exports) {
    var config = _dereq_('./config')

    var logStack = []

    module.exports = {
      getLogStack: function () {
        return logStack
      },

      error: function (msg, data) {
        return this.log('%c ' + msg, 'color: red', data)
      },

      warning: function (msg, data) {
        return this.log('%c ' + msg, 'background-color: ffff00', data)
      },

      log: function (message, data) {
        // Optimized copy of arguments (V8 https://github.com/GoogleChrome/devtools-docs/issues/53#issuecomment-51941358)
        var args = new Array(arguments.length)
        for (var i = 0, l = arguments.length; i < l; i++) {
          args[i] = arguments[i]
        }

        var isDebugMode = config.get('debug') === true || config.get('debug') === 'true'
        var hasConsole = window.console

        logStack.push({
          msg: message,
          data: args.slice(1)
        })

        if (isDebugMode && hasConsole) {
          if (typeof Function.prototype.bind === 'function') {
            return window.console.log.apply(window.console, args)
          } else {
            return Function.prototype.apply.call(window.console.log, window.console, args)
          }
        }
      }
    }

  }, {
    "./config": 30
  }],
  33: [function (_dereq_, module, exports) {
    module.exports = {
      set: function (key, val) {
        window.localStorage.setItem(key, JSON.stringify(val))
        return val
      },

      get: function (key) {
        var value = window.localStorage.getItem(key)
        if (typeof value !== 'string') {
          return undefined
        }

        try {
          return JSON.parse(value)
        } catch (e) {
          return value || undefined
        }
      }
    }

  }, {}],
  34: [function (_dereq_, module, exports) {
    var logger = _dereq_('./logger')
    var config = _dereq_('./config')
    var Promise = _dereq_('es6-promise').Promise

    module.exports = {
      sendError: function (data) {
        return _sendToOpbeat('errors', data)
      },

      sendTransaction: function (data) {
        return _sendToOpbeat('transactions', data)
      },

      getFile: function (fileUrl) {
        return _makeRequest(fileUrl, 'GET', '', {})
      }
    }

    function _sendToOpbeat(endpoint, data) {
      logger.log('opbeat.transport.sendToOpbeat', data)

      var url = 'https://' + config.get('apiHost') + '/api/v1/organizations/' + config.get('orgId') + '/apps/' + config.get('appId') + '/client-side/' + endpoint + '/'

      var headers = {
        'X-Opbeat-Client': 'opbeat-js/' + config.get('VERSION')
      }

      return _makeRequest(url, 'POST', 'JSON', data, headers)
    }

    function _makeRequest(url, method, type, data, headers) {
      return new Promise(function (resolve, reject) {
        var xhr = new window.XMLHttpRequest()

        xhr.open(method, url, true)
        xhr.timeout = 10000

        if (type === 'JSON') {
          xhr.setRequestHeader('Content-Type', 'application/json')
        }

        if (headers) {
          for (var header in headers) {
            if (headers.hasOwnProperty(header)) {
              xhr.setRequestHeader(header.toLowerCase(), headers[header])
            }
          }
        }

        xhr.onreadystatechange = function (evt) {
          if (xhr.readyState === 4) {
            var status = xhr.status
            if (status === 0 || status > 399 && status < 600) {
              // An http 4xx or 5xx error. Signal an error.
              var err = new Error(url + ' HTTP status: ' + status)
              err.xhr = xhr
              reject(err)
              logger.log('opbeat.transport.makeRequest.error', err)
            } else {
              resolve(xhr.responseText)
              logger.log('opbeat.transport.makeRequest.success')
            }
          }
        }

        xhr.onerror = function (err) {
          reject(err)
          logger.log('opbeat.transport.makeRequest.error', err)
        }

        if (type === 'JSON') {
          data = JSON.stringify(data)
        }

        xhr.send(data)
      })
    }

  }, {
    "./config": 30,
    "./logger": 32,
    "es6-promise": 3
  }],
  35: [function (_dereq_, module, exports) {
    module.exports = {
      getViewPortInfo: function getViewPort() {
        var e = document.documentElement
        var g = document.getElementsByTagName('body')[0]
        var x = window.innerWidth || e.clientWidth || g.clientWidth
        var y = window.innerHeight || e.clientHeight || g.clientHeight

        return {
          width: x,
          height: y
        }
      },

      mergeObject: function (o1, o2) {
        var a
        var o3 = {}

        for (a in o1) {
          o3[a] = o1[a]
        }

        for (a in o2) {
          o3[a] = o2[a]
        }

        return o3
      },

      arrayReduce: function (arrayValue, callback, value) {
        // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
        if (arrayValue == null) {
          throw new TypeError('Array.prototype.reduce called on null or undefined')
        }
        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function')
        }
        var t = Object(arrayValue)
        var len = t.length >>> 0
        var k = 0

        if (!value) {
          while (k < len && !(k in t)) {
            k++
          }
          if (k >= len) {
            throw new TypeError('Reduce of empty array with no initial value')
          }
          value = t[k++]
        }

        for (; k < len; k++) {
          if (k in t) {
            value = callback(value, t[k], k, t)
          }
        }
        return value
      },

      arraySome: function (value, callback, thisArg) {
        // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
        if (value == null) {
          throw new TypeError('Array.prototype.some called on null or undefined')
        }

        if (typeof callback !== 'function') {
          throw new TypeError()
        }

        var t = Object(value)
        var len = t.length >>> 0

        if (!thisArg) {
          thisArg = void 0
        }

        for (var i = 0; i < len; i++) {
          if (i in t && callback.call(thisArg, t[i], i, t)) {
            return true
          }
        }
        return false
      },

      arrayMap: function (arrayValue, callback, thisArg) {
        // Source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Map
        var T, A, k

        if (this == null) {
          throw new TypeError(' this is null or not defined')
        }
        var O = Object(arrayValue)
        var len = O.length >>> 0

        if (typeof callback !== 'function') {
          throw new TypeError(callback + ' is not a function')
        }
        if (arguments.length > 1) {
          T = thisArg
        }
        A = new Array(len)
        k = 0
        while (k < len) {
          var kValue, mappedValue
          if (k in O) {
            kValue = O[k]
            mappedValue = callback.call(T, kValue, k, O)
            A[k] = mappedValue
          }
          k++
        }
        return A
      },

      arrayIndexOf: function (arrayVal, searchElement, fromIndex) {
        // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
        var k
        if (arrayVal == null) {
          throw new TypeError('"arrayVal" is null or not defined')
        }

        var o = Object(arrayVal)
        var len = o.length >>> 0

        if (len === 0) {
          return -1
        }

        var n = +fromIndex || 0

        if (Math.abs(n) === Infinity) {
          n = 0
        }

        if (n >= len) {
          return -1
        }

        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0)

        while (k < len) {
          if (k in o && o[k] === searchElement) {
            return k
          }
          k++
        }
        return -1
      },

      functionBind: function (func, oThis) {
        // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
        var aArgs = Array.prototype.slice.call(arguments, 2)
        var FNOP = function () {}
        var fBound = function () {
          return func.apply(oThis, aArgs.concat(Array.prototype.slice.call(arguments)))
        }

        FNOP.prototype = func.prototype
        fBound.prototype = new FNOP()
        return fBound
      },

      getRandomInt: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
      },

      isUndefined: function (obj) {
        return (typeof obj) === 'undefined'
      },

      isCORSSupported: function () {
        var xhr = new window.XMLHttpRequest()
        return 'withCredentials' in xhr
      },

      getCurrentScript: function () {
        // Source http://www.2ality.com/2014/05/current-script.html
        return document.currentScript || (function () {
          var scripts = document.getElementsByTagName('script')
          return scripts[scripts.length - 1]
        })()
      },

      generateUuid: function () {
        function _p8(s) {
          var p = (Math.random().toString(16) + '000000000').substr(2, 8)
          return s ? '-' + p.substr(0, 4) + '-' + p.substr(4, 4) : p
        }
        return _p8() + _p8(true) + _p8(true) + _p8()
      }

    }

  }, {}],
  36: [function (_dereq_, module, exports) {
    var logger = _dereq_('./lib/logger')
    var utils = _dereq_('./lib/utils')
    var config = _dereq_('./lib/config')
    var Exceptions = _dereq_('./exceptions')
    var API = _dereq_('./lib/api')

    function Opbeat() {
      this._config = config
      this._config.init()

      var queuedCommands = []
      if (window._opbeat) {
        queuedCommands = window._opbeat.q
      }
      this.api = new API(this, queuedCommands)
      window._opbeat = this.api.push

      this.install()
    }

    Opbeat.prototype.VERSION = 'v1.2.3'

    Opbeat.prototype.isPlatformSupport = function () {
      return typeof Array.prototype.forEach === 'function' &&
        typeof JSON.stringify === 'function' &&
        typeof Function.bind === 'function' &&
        window.performance &&
        typeof window.performance.now === 'function' &&
        utils.isCORSSupported()
    }

    /*
     * Configure Opbeat with Opbeat.com credentials and other options
     *
     * @param {object} options Optional set of of global options
     * @return {Opbeat}
     */
    Opbeat.prototype.config = function (properties) {
      if (properties) {
        config.setConfig(properties)
      }

      this.install()

      return this._config
    }

    /*
     * Installs a global window.onerror error handler
     * to capture and report uncaught exceptions.
     * At this point, install() is required to be called due
     * to the way TraceKit is set up.
     *
     * @return {Opbeat}
     */

    Opbeat.prototype.install = function () {
      if (!config.isValid()) {
        logger.warning('opbeat.install.config.invalid')
        return this
      }

      if (!this.isPlatformSupport()) {
        logger.warning('opbeat.install.platform.unsupported')
        return this
      }

      if (this._config.get('isInstalled')) {
        logger.warning('opbeat.install.already.installed')
        return this
      }

      this._exceptions = new Exceptions()

      this._exceptions.install()
      this._config.set('isInstalled', true)

      return this
    }

    /*
     * Uninstalls the global error handler.
     *
     * @return {Opbeat}
     */
    Opbeat.prototype.uninstall = function () {
      this._exceptions.uninstall()
      this._config.set('isInstalled', false)

      return this
    }

    /*
     * Manually capture an exception and send it over to Opbeat.com
     *
     * @param {error} ex An exception to be logged
     * @param {object} options A specific set of options for this error [optional]
     * @return {Opbeat}
     */
    Opbeat.prototype.captureException = function (ex, options) {
      if (!this._config.get('isInstalled')) {
        return logger.error('Can\'t capture exception. Opbeat isn\'t intialized')
        return this
      }

      if (!(ex instanceof Error)) {
        logger.error('Can\'t capture exception. Passed exception needs to be an instanceof Error')
        return this
      }

      // TraceKit.report will re-raise any exception passed to it,
      // which means you have to wrap it in try/catch. Instead, we
      // can wrap it here and only re-raise if TraceKit.report
      // raises an exception different from the one we asked to
      // report on.

      this._exceptions.processError(ex, options)

      return this
    }

    /*
     * Set/clear a user to be sent along with the payload.
     *
     * @param {object} user An object representing user data [optional]
     * @return {Opbeat}
     */
    Opbeat.prototype.setUserContext = function (user) {
      // Get existing user UUID
      user.uuid = config.get('context.user.uuid')

      config.set('context.user', user)

      return this
    }

    /*
     * Set extra attributes to be sent along with the payload.
     *
     * @param {object} extra An object representing extra data [optional]
     * @return {Opbeat}
     */
    Opbeat.prototype.setExtraContext = function (extra) {
      config.set('context.extra', extra)

      return this
    }

    module.exports = new Opbeat()

  }, {
    "./exceptions": 12,
    "./lib/api": 29,
    "./lib/config": 30,
    "./lib/logger": 32,
    "./lib/utils": 35
  }]
}, {}, [9]);
