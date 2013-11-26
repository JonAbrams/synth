var request = require('supertest');
require('should');

describe('synth module', function () {
  var synth = require('../synth.js');
  var app = synth({ resourceDir: __dirname + '/resources'});

  it('returns 404 when no match is found', function (done) {
    request(app).get('/api/thing-that-doesnt-exist')
    .expect(404)
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect({ error: 'Resource not found'})
    .end(done);
  });

  it('fetches the list of products', function (done) {
    request(app).get('/api/products')
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8')
    .expect([
      {
        name: "Fancy Shoes",
        price: 99.99
      }
    ])
    .end(done);
  });

  it('created a new variation', function (done) {
    request(app).post('/api/products/52/variations')
    .send({ name: 'red' })
    .expect(200)
    .end(done);

    // request(app).get('/api/products/52/variations')
    // .expect(200)
    // .expect('Content-Type', 'application/json; charset=utf-8')
    // .expect([
    //   {
    //     name: 'red',
    //     productsId: '52'
    //   }
    // ])
    // .end(done);
  });
});
