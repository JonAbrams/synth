var cssHash = '973388f18ee6903be4c67fde2d916e92';
var jsHash = 'ad65a088b5dc9472d8ede5d1f1029369';

var request = require('supertest-as-promised');
var requireUncached = require('../lib/requireUncached.js');
require('should');

describe('synth module', function () {
  var synth, app;
  beforeEach(function () {
    synth = requireUncached('../synth.js');
    app = synth({ apiTimeout: 100 });
  });

  before(function (done) {
    process.chdir(__dirname + '/sample_project');
    done();
  });

  describe('the api', function () {
    it('returns 404 when no match is found', function (done) {
      request(app).get('/api/thing-that-doesnt-exist')
      .expect(404)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ error: 'Resource not found' })
      .end(done);
    });

    it('fetches the list of products', function () {
      return request(app).get('/api/products')
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
      });
    });

    it('created a new variation', function () {
      return request(app).post('/api/products/52/variations')
      .send({ name: 'red' })
      .expect(200)
      .then(function () {
        return request(app).get('/api/products/52/variations')
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect([
          {
            name: 'red',
            productsId: '52'
          }
        ]);
      });
    });

    it('creates a custom action handler', function () {
      return request(app).get('/api/products/specials')
      .expect(200)
      .expect({
        specials: []
      });
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

      it('handles a thrown error', function () {
        return request(app).get('/api/products/oops')
        .expect(500)
        .expect({ error: 'Ouch!' })
        .then(function () {
          errorLog.should.eql('Error thrown by GET /api/products/oops');
        });
      });

      it('handles a thrown error with custom code', function () {
        return request(app).put('/api/products/501oops')
        .expect(501)
        .expect('Ouch!')
        .then(function () {
          errorLog.should.eql('Error thrown by PUT /api/products/501Oops : Ouch!');
        });
      });

      it('suppresses error in production', function () {
        process.env.NODE_ENV = 'production';
        return request(app).put('/api/products/501oops')
        .expect(501)
        .expect('An error occurred')
        .then(function () {
          errorLog.should.eql('Error thrown by PUT /api/products/501Oops : Ouch!');
          delete process.env.NODE_ENV;
        });
      });

      it('times out if not resolved', function () {
        return request(app).get('/api/products/forever')
        .expect(500)
        .then(function () {
          errorLog.should.eql('Error thrown by GET /api/products/forever : API Request timed out');
        });
      });
    });
  });

  describe('front end', function () {
    beforeEach(function () {
      synth = requireUncached('../synth.js');

      synth.app.use(function (req, res, next) {
        res.renderData = {
          anAPIKey: "12345abcde"
        };
        next();
      });

      app = synth({ apiTimeout: 100 });
    });
    it('serves up the index.html', function () {
      return request(app).get('/')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<html>[^]*<\/html>/)
      .expect(/<script src="\/js\/main\.js"><\/script>/);
    });

    it('preloads data with request', function () {
      return request(app).get('/products')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<html>[^]*<\/html>/)
      .expect(/<script>/)
      .expect(/var preloadedData = {"injection":"<script>alert\('hi'\)<\\\/script>","products":\[{"name":"Fancy Shoes","price":99\.99}]};/)
      .expect(/<\/script>/);
    });

    it('preloads html with request (production)', function () {
      process.env.NODE_ENV = 'production';
      return request(app).get('/products')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<html>[^]*<\/html>/)
      .expect(/<script type="text\/ng-template" id="\/html\/products\/getIndex\.html">/)
      .expect(/<ul><li ng-repeat="product in products">\{\{ product.name }} - \{\{ product\.price \| currency }}\S*<\/li><\/ul>/)
      .then(function () {
        delete process.env.NODE_ENV;
      });
    });

    it('works without preloading html with request', function () {
      return request(app).get('/products/5')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<html>[^]*<\/html>/)
      .expect(function (res) {
        if ( /<script type="text\/ng-template"/.test(res.text) ) {
          throw "Found preloaded HTML where there should not have been any";
        }
      });
    });

    it('allows for custom renderData', function () {
      return request(app).get('/products')
      .expect(200)
      .expect(/var apiKey = "12345abcde";/);
    });


    it('serves up a png image', function () {
      return request(app).get('/images/synth.png')
      .expect(200)
      .expect('Content-Type', 'image/png');
    });

    it('reports 404 for missing asset', function () {
      return request(app).get('/images/not_synth.png')
      .expect(404);
    });

    it('serves up jade', function () {
      return request(app).get('/html/more.html')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('<h1>Welcome to Synth!</h1>');
    });

    it('serves up js', function () {
      return request(app).get('/js/main.js')
      .expect(200)
      .expect('Content-Type', 'application/javascript')
      .expect(/function main \(\) \{/);
    });

    it('serves up coffee-script', function () {
      return request(app).get('/js/more.js')
      .expect(200)
      .expect('Content-Type', 'application/javascript')
      .expect('var hello;\n\nhello = function() {\n  return "hello";\n};\n');
    });

    it('serves up css', function () {
      return request(app).get('/css/main.css')
      .expect(200)
      .expect('Content-Type', 'text/css; charset=UTF-8')
      .expect('.main {\n  display: block;\n}\n');
    });

    it('serves up scss', function () {
      return request(app).get('/css/more.css')
      .expect(200)
      .expect('Content-Type', 'text/css; charset=UTF-8')
      .expect('div img {background-color:red;}.outer .inner {display:none;}');
    });

    it('exposes jsFiles', function () {
      synth.jsFiles.should.eql(['/js/main.js', '/js/more.js']);
    });

    it('exposes cssFiles', function () {
      synth.cssFiles.should.eql(['/css/main.css', '/css/more.css', '/css/another.css']);
    });

    it('can add references to other assets on demand', function () {
      synth.jsFiles.push('js/special.js');
      synth.cssFiles.push('css/special.css');
      return request(app).get('/')
      .expect(/<script src="js\/special\.js"><\/script>/)
      .expect(/<link rel="stylesheet" href="css\/special\.css"/);
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

  it('pre-compiles CSS and JS and adds a reference to it', function () {
    return request(app).get('/')
    .expect(new RegExp('<script src="/js/main-' + jsHash + '.js"></script>'))
    .expect(new RegExp('<link rel="stylesheet" href="/css/main-' + cssHash + '.css">'));
  });

  it('serves up expected JS', function () {
    return request(app).get('/js/main-' + jsHash + '.js')
    .expect('Content-Type', 'application/javascript')
    .expect('Cache-Control', 'public, max-age=600')
    .expect('function main(){return!0}(function(){var n;n=function(){return"hello"}}).call(this);');
  });

  it('serves up expected CSS', function () {
    return request(app).get('/css/main-' + cssHash + '.css')
    .expect('Content-Type', 'text/css')
    .expect('Cache-Control', 'public, max-age=600')
    .expect(
      '.main{display:block}div img{background-color:red}' +
      '.outer .inner{display:none}div{background-color:#00f;color:red}'
    );
  });
});
