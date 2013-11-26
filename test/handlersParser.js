var _ = require('lodash');
require('should');

describe('handlersParser module', function () {
  var resourceParser = require('../lib/handlersParser.js');

  describe('good resources dir', function () {
    var rootDir = __dirname + '/resources';
    var handlers = resourceParser.parse(rootDir);

    it('returns the expected structure', function () {
      handlers.should.eql([
        {
          file: __dirname + '/resources/orders/create.js',
          method: 'post',
          path: '/api/orders',
          funcName: 'post',
          resources: [
            'orders'
          ]
        },
        {
          file: __dirname + '/resources/products/get.js',
          method: 'get',
          path: '/api/products',
          funcName: 'getIndex',
          resources: [
            'products'
          ]
        },
        {
          file: __dirname + '/resources/products/get.js',
          method: 'get',
          path: '/api/products/:id',
          funcName: 'get',
          resources: [
            'products'
          ]
        },
        {
          file: __dirname + '/resources/products/get.js',
          method: 'get',
          path: '/api/products/specials',
          funcName: 'getSpecials',
          resources: [
            'products'
          ]
        },
        {
          file: __dirname + '/resources/products/new.js',
          method: 'post',
          path: '/api/products',
          funcName: 'post',
          resources: [
            'products'
          ]
        },
        {
          file: __dirname + '/resources/products/variations/variations.js',
          method: 'post',
          path: '/api/products/:productsId/variations',
          funcName: 'post',
          resources: [
            'products',
            'variations'
          ]
        },
        {
          file: __dirname + '/resources/products/variations/variations.js',
          method: 'get',
          path: '/api/products/:productsId/variations',
          funcName: 'getIndex',
          resources: [
            'products',
            'variations'
          ]
        }
      ]);
    });

    it('returns functions', function () {
      handlers[0].func().should.be.type('function');
    });
  });

  describe('bad resources dir', function () {
    var rootDir = __dirname + '/badResources';

    it('throws an error', function () {
      (function () {
        resourceParser.parse(rootDir);
      }).should.throw('Unrecognized method: not from '+ __dirname + '/badResources/broken.js');
    });
  });
});
