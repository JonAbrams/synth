var request = require('supertest');
require('should');

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
