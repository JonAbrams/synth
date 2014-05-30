var cssHash = '973388f18ee6903be4c67fde2d916e92';
var jsHash = 'ad65a088b5dc9472d8ede5d1f1029369';

var request = require('supertest');
var requireUncached = require('../lib/requireUncached.js');
require('should');

describe('synth module', function () {
  var synth, app;
  beforeEach(function () {
    synth = requireUncached('../synth.js');
    app = synth({ apiTimeout: 100 });
  });

  before(function () {
    process.chdir(__dirname + '/sample_project');
  });

  describe('the api', function () {
    it('returns 404 when no match is found', function (done) {
      request(app).get('/api/thing-that-doesnt-exist')
      .expect(404)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ error: 'Resource not found' })
      .end(done);
    });

    it('fetches the list of products', function (done) {
      request(app).get('/api/products')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({
        injection: "<script>alert('hi')</script>",
        products: [
          {
            name: "Fancy Shoes",
            price: 99.99
          }
        ]
      })
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

    it('creates a custom action handler', function (done) {
      request(app).get('/api/products/specials')
      .expect(200)
      .expect({
        specials: []
      })
      .end(done);
    });

    describe('API error handling', function () {
      var consoleError;
      var errorLog = '';
      before(function () {
        consoleError = console.error;
        console.error = function (msg) {
          errorLog = msg;
        };
      });
      after(function () {
        console.error = consoleError;
      });

      it('handles a thrown error', function (done) {
        request(app).get('/api/products/oops')
        .expect(500)
        .expect({ error: 'Ouch!' })
        .end(function () {
          errorLog.should.eql('Error thrown by GET /api/products/oops : {"error":"Ouch!"}');
          done();
        });
      });

      it('handles a thrown error with custom code', function (done) {
        request(app).put('/api/products/501oops')
        .expect(501)
        .expect('Ouch!')
        .end(function () {
          errorLog.should.eql('Error thrown by PUT /api/products/501Oops : Ouch!');
          done();
        });
      });

      it('suppresses error in production', function (done) {
        process.env.NODE_ENV = 'production';
        request(app).put('/api/products/501oops')
        .expect(501)
        .expect('An error occurred')
        .end(function () {
          errorLog.should.eql('Error thrown by PUT /api/products/501Oops : Ouch!');
          delete process.env.NODE_ENV;
          done();
        });
      });

      it('times out if not resolved', function (done) {
        request(app).get('/api/products/forever')
        .expect(500)
        .end(function () {
          errorLog.should.eql('Error thrown by GET /api/products/forever : API Request timed out');
          done();
        });
      });
    });
  });

  describe('front end', function () {
    beforeEach(function () {
      synth = requireUncached('../synth.js');

      synth.app.use(function (req, res, next) {
        req.renderData = {
          anAPIKey: "12345abcde"
        };
        next();
      });

      app = synth({ apiTimeout: 100 });
    });
    it('serves up the index.html', function (done) {
      request(app).get('/')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<html>[^]*<\/html>/)
      .expect(/<script src="\/js\/main\.js"><\/script>/)
      .end(done);
    });

    it('preloads data with request', function (done) {
      request(app).get('/products')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<html>[^]*<\/html>/)
      .expect(/<script>/)
      .expect(/var preloadedData = {"injection":"<script>alert\('hi'\)<\\\/script>","products":\[{"name":"Fancy Shoes","price":99\.99}]};/)
      .expect(/<\/script>/)
      .end(done);
    });

    it('preloads html with request', function (done) {
      request(app).get('/products')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<html>[^]*<\/html>/)
      .expect(/<script type="text\/ng-template" id="\/html\/products\/getIndex\.html">/)
      .expect(/<ul><li ng-repeat="product in products">\{\{ product.name }} - \{\{ product\.price \| currency }}\S*<\/li><\/ul>/)
      .end(done);
    });

    it('works without preloading html with request', function (done) {
      request(app).get('/products/5')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<html>[^]*<\/html>/)
      .expect(function (res) {
        if ( /<script type="text\/ng-template"/.test(res.text) ) {
          throw "Found preloaded HTML where there should not have been any";
        }
      })
      .end(done);
    });

    it('allows for custom renderData', function (done) {
      request(app).get('/products')
      .expect(200)
      .expect(/var apiKey = "12345abcde";/)
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
      .expect('var hello;\n\nhello = function() {\n  return "hello";\n};\n')
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
      .expect('div img {background-color:red;}.outer .inner {display:none;}')
      .end(done);
    });

    it('exposes jsFiles', function () {
      synth.jsFiles.should.eql(['/js/main.js', '/js/more.js']);
    });

    it('exposes cssFiles', function () {
      synth.cssFiles.should.eql(['/css/main.css', '/css/more.css', '/css/another.css']);
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

describe('production mode', function () {
  var stdoutWrite = process.stdout.write;
  var synth, app;
  before(function () {
    // Suppress stdout output
    process.stdout.write = function () {};
    process.chdir(__dirname + '/sample_project');
  });
  beforeEach(function () {
    synth = require('../synth.js');
    app = synth({ production: true });
  });
  afterEach(function () {
    delete require.cache[require.resolve('../synth.js')];
  });

  after(function () {
    // Restore stdout
    process.stdout.write = stdoutWrite;
  });

  it('pre-compiles CSS and JS and adds a reference to it', function (done) {
    request(app).get('/')
    .expect(new RegExp('<script src="/js/main-' + jsHash + '.js"></script>'))
    .expect(new RegExp('<link rel="stylesheet" href="/css/main-' + cssHash + '.css">'))
    .end(done);
  });

  it('serves up expected JS', function (done) {
    request(app).get('/js/main-' + jsHash + '.js')
    .expect('Content-Type', 'application/javascript')
    .expect('Cache-Control', 'public, max-age=600')
    .expect('function main(){return!0}(function(){var n;n=function(){return"hello"}}).call(this);')
    .end(done);
  });

  it('serves up expected CSS', function (done) {
    request(app).get('/css/main-' + cssHash + '.css')
    .expect('Content-Type', 'text/css')
    .expect('Cache-Control', 'public, max-age=600')
    .expect(
      '.main{display:block}div img{background-color:red}' +
      '.outer .inner{display:none}div{background-color:#00f;color:red}'
    )
    .end(done);
  });
});
