const { PeerRPCServer, PeerRPCClient } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');
const { Order, orderTypes } = require('./order-model');
const services = require('./service');
const constants = require('./constants');
const mapper = require('./mapper');

let records = {};

const { getRequestHandler } = services(records);

const serverLink = new Link({
  grape: 'http://127.0.0.1:30001'
});
serverLink.start();

const peerServer = new PeerRPCServer(serverLink, {
  timeout: 300000
});
peerServer.init();

const port = 1024 + Math.floor(Math.random() * 1000);
const service = peerServer.transport('server');
service.listen(port);

setInterval(function () {
  serverLink.announce(`exchange_server`, service.port, {});
}, 1000);

const clientLink = new Link({
  grape: 'http://127.0.0.1:30001'
});
clientLink.start();

const peerClient = new PeerRPCClient(clientLink, {});
peerClient.init();

service.on('request', (rid, key, payload, handler) => {
  if (port === payload.issuer) return;
  getRequestHandler(payload, handler.reply);
});
const mapOrder = mapper(records, port);

peerClient.map('exchange_server', {
  action: constants.FETCH_RECORD,
  issuer: port
}, { timeout: 10000 }, (err, result) => {
  if (result && result.length && result[0]) {
    records = Object.assign(records, { ...result[0].records });
  }
  try {
    mapOrder(new Order({ issuer: port, units: 1, type: orderTypes.sell, amount: 100, credit: 0 }), peerClient);
    // mapOrder(new Order({ issuer: port, units: 1, type: orderTypes.buy, amount: 200, credit: 0 }), peerClient);
    // mapOrder(new Order({ issuer: port, units: 2, type: orderTypes.sell, amount: 450, credit: 0 }), peerClient);
  } catch (err) {
    console.error(err);
  }

});
