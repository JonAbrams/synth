require('should');

describe('resourceParser module', function () {
  var resourceParser = require('../lib/resourceParser.js');
  var rootDir = __dirname + '/resources';
  var resourceTree = resourceParser.parse(rootDir);

  it('returns the expected structure', function () {
    resourceTree.should.eql({
      handlers: [],
      orders: {
        handlers: [
          {
            file: __dirname + '/resources/orders/create.js',
            method: 'post',
            path: '/api/orders',
            funcName: 'post',
            resources: [
              'orders'
            ]
          }
        ]
      },
      products: {
        handlers: [
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
          }
        ],
        variations: {
          handlers: [
            {
              file: __dirname + '/resources/products/variations/get.js',
              method: 'get',
              path: '/api/products/:id/variations',
              funcName: 'getIndex',
              resources: [
                'products',
                'variations'
              ]
            }
          ]
        }
      }
    });
  });

  it('returns functions', function () {
    resourceTree.products.handlers[0].func().should.be.type('function');
  });
});
