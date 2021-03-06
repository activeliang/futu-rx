const path = require("path");
const protoLoader = require('./helper/protoLoader');
const mergeMap = require("rxjs/operators").mergeMap;
const filter = require('rxjs/operators').filter;
const switchMap = require('rxjs/operators').switchMap;
const rxjs = require('rxjs');
const interval = rxjs.interval;

const protoPath = path.resolve(__dirname, "../pb/KeepAlive.proto");
const [Request, Response] = protoLoader.load(protoPath);

// https://futunnopen.github.io/futu-api-doc/protocol/base_define.html#keepalive-proto-1004
module.exports = function () {
  const self = this;
  const args = Array.prototype.slice.call(arguments);
  self
    ._protocolStateSubject
    .pipe(filter((keySets) => {
      // trigger the keep alive packet send routine, cancel previous routine if there
      // is any by using switchMap
      return keySets.has('aesKey') && keySets.has('keepAliveInterval');
    }), switchMap(() => {
      // send keep alive packet every 'keepAliveInterval' seconds
      return interval(self._protocolStateObj['keepAliveInterval'] * 1000);
    }), mergeMap(() => {
      const protoId = '1004';
      var c2sPayload = {
        time: Math.floor(new Date().getTime() / 1000)
      }
      return self._requestProcessor
        .process(protoId, Request, Response, c2sPayload, {
          func: "KeepAlive",
          args: args
        });
    }))
    .subscribe();
}
