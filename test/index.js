var should = require('should');
var request = require('supertest');

describe('resourceParser module', function () {
  var resourceParser = require('../lib/resourceParser.js');
  var rootDir = __dirname + '/resources';
  it('returns the expected structure', function () {
    resourceParser.parse(rootDir).should.eql({
      handlers: [],
      orders: {
        handlers: []
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

describe.skip('synth module', function () {
  // var synth = require('../synth.js');
  // var app = synth();

  it('returns 404 when no match is found', function (done) {
    request(app).get('/api/thing-that-doesnt-exist')
    .expect(404)
    .expect('Content-Type', 'application/json')
    .expect({ error: 'Resource not found'})
    .end(done);
  });

  it('fetches the list of products', function (done) {
    request(app).get('/api/products')
    .expect(200)
    .expect('Content-Type', 'application/json')
    .expect('[{"name":"Fancy Shoes","price":99.99}]')
    .end(done);
  });
});
