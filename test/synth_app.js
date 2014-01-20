var request = require('supertest');
require('should');

describe('synth module', function () {
  var synth, app;
  beforeEach(function () {
    synth = require('../synth.js');
    app = synth();
  });

  before(function () {
    process.chdir(__dirname + '/sample_project');
  });

  describe("the api", function () {
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
      .end(function () {
        request(app).get('/api/products/52/variations')
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect([
          {
            name: 'red',
            productsId: '52'
          }
        ])
        .end(done);
      });
    });
  });

  describe('front end', function () {
    it('servers up the index.html', function (done) {
      request(app).get('/')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<html>.*<\/html>/)
      .expect(/<script src="js\/main\.js"><\/script>/)
      .end(done);
    });

    it('serves up a png image', function (done) {
      request(app).get('/images/synth.png')
      .expect(200)
      .expect('Content-Type', 'image/png')
      .end(done);
    });

    it('reports 404 for missing asset', function (done) {
      request(app).get('/images/not_synth.png')
      .expect(404)
      .end(done);
    });

    it('serves up jade', function (done) {
      request(app).get('/html/more.html')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('<h1>Welcome to Synth!</h1>')
      .end(done);
    });

    it('serves up js', function (done) {
      request(app).get('/js/main.js')
      .expect(200)
      .expect('Content-Type', 'application/javascript')
      .expect(/function main \(\) \{/)
      .end(done);
    });

    it('serves up coffee-script', function (done) {
      request(app).get('/js/more.js')
      .expect(200)
      .expect('Content-Type', 'application/javascript')
      .expect('var aFunc;\n\naFunc = function() {};\n')
      .end(done);
    });

    it('serves up css', function (done) {
      request(app).get('/css/main.css')
      .expect(200)
      .expect('Content-Type', 'text/css; charset=UTF-8')
      .expect('.main {\n  display: block;\n}\n')
      .end(done);
    });

    it('serves up scss', function (done) {
      request(app).get('/css/more.css')
      .expect(200)
      .expect('Content-Type', 'text/css; charset=UTF-8')
      .expect('.outer .inner {display:none;}')
      .end(done);
    });

    it('exposes jsFiles', function () {
      synth.jsFiles.should.eql(['js/main.js', 'js/more.js']);
    });

    it('exposes jsFiles', function () {
      synth.cssFiles.should.eql(['css/main.css', 'css/more.css']);
    });

    it('can add references to other assets on demand', function (done) {
      synth.jsFiles.push('js/special.js');
      synth.cssFiles.push('css/special.css');
      request(app).get('/')
      .expect(/<script src="js\/special\.js"><\/script>/)
      .expect(/<link rel="stylesheet" href="css\/special\.css"/)
      .end(done);
    });
  });
});
