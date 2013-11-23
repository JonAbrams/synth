require('should');

describe('resourceParser module', function () {
  var resourceParser = require('../lib/resourceParser.js');
  var rootDir = __dirname + '/resources';
  it('returns the expected structure', function () {
    resourceParser.parse(rootDir).should.eql({
      handlers: [],
      orders: {
        handlers: [
          {
            file: __dirname + '/resources/orders/create.js',
            method: 'POST',
            path: '/api/orders',
            funcName: 'post'
          }
        ]
      },
      products: {
        handlers: [
          {
            file: __dirname + '/resources/products/get.js',
            method: 'GET',
            path: '/api/products',
            funcName: 'getIndex'
          },
          {
            file: __dirname + '/resources/products/get.js',
            method: 'GET',
            path: '/api/products/:id',
            funcName: 'get'
          },
          {
            file: __dirname + '/resources/products/get.js',
            method: 'GET',
            path: '/api/products/specials',
            funcName: 'getSpecials'
          },
          {
            file: __dirname + '/resources/products/new.js',
            method: 'POST',
            path: '/api/products',
            funcName: 'post'
          }
        ],
        variations: {
          handlers: [
            {
              file: __dirname + '/resources/products/variations/get.js',
              method: 'GET',
              path: '/api/products/:id/variations',
              funcName: 'getIndex'
            }
          ]
        }
      }
    });
  });
});
