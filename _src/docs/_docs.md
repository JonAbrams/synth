<div id="intro"></div>
# Intro

One big source of confusion when writing web apps powered by Node.js is the fact that both the front-end code (i.e. runs in the browser) and the back-end (i.e. runs on the server) are JavaScript. It gets even more confusing when both have controllers, models, views, etc.

Synth makes this easier by having any JavaScript, images, html, or other assets that are sent to the browser in the root folder _front_ and code that runs on the server is in the _back_ folder.

<div id="frontend"></div>
# Front-end

All front-end code goes into your app's _front/_ folder. Inside the _front_ folder there are some key files and folders you should take note of:

- `index.jade` - The main html file that is rendered server side. Think of it as the bridge that joins the back-end and the front-end. It is what is sent to the browser when a page is requested. It loads external JavaScript and CSS files. It specifies how preloaded data is exposed (more on that later) as well as the preloaded HTML view.
- `bower.json` - Tracks which third-party packages are needed from [bower](http://bower.io) for the app to work. You shouldn't need to edit this file directly since running `synth install -f package_name` will automatically add that package to the list of your app's front-end dependencies.
- `css/` - Place _.css_, _.scss_, _.sass_, and _.styl_ files go here. They'll automatically get converted to CSS when served up to the browser.
- `js/` - Place _.js_, and _.coffee_ files go here. CoffeeScript files will automatically get converted to JS when served up to the browser.
- `images/` - Place _.jpeg_, _.gif_, and _.png_ files here. They can then be referenced in HTML using _/images/&lt;filename.ext&gt;_.
- `html/` - Place _.html_, and _.jade_ files here. This is where you place the HTML partials that power your app's various views. These are not rendered server-side. The jade files are converted to html, but they're just served as static files.
- `misc/` - Any other static files that need to be made available to the browser go here. Files placed here are made available from the root path. For example, just place a [robots.txt](http://www.robotstxt.org/) file here and it'll be available at _/robots.txt_.
- `bower_components/` - Contains third-party packages installed by bower. The default _.gitignore_ file for synth projects filters this out since running _syth install -f_ rebuilds this folder.

<div id="backend"></div>
# Back-End

All back-end code goes into your app's _back/_ folder. It's a bit more involved than the front-end.

<div id="back-app-js"></div>
## back-app.js

This is the script that is run when starting up the server. It's for loading the main synth module, specifying information about the db, then launches the HTTP listener to handle incoming requests.

Here's an example:

```javascript
// Include modules
var synth = require("synth");
var mongojs = require("mongojs");

// Configure some values
var mongoUrl = process.env["MONGO_URL"] || "my_app";

// Init libraries
var db = mongojs(mongoUrl);

// Declare middleware (i.e. functions run for each incoming request)
var app = synth.app;
app.use(function (req, res, next) {
  // Make the db object available to request handlers by attaching it to the request object
  req.db = db;
  next();
});

// Initialize the server and return it
module.exports = synth();
```

<div id="creating-api-endpoints"></div>
## Creating API Resources + Endpoints

_Synth_ scans the `resources` folder for .js (or .coffee) files. An API is generated based on the names of the folders that they're in.

**Note:** The names of the js/coffee files themselves are not parsed by _synth_, so name them how you see fit.

For example, to create a _memoes_ resource, create a folder of that same name:

    | my_app
      | back
        | resources
          | memoes

You can then declare a request handler for a specific HTTP method in any file that is in the resources directory by assigning a function to `exports.<method><optional: ActionName>`.

Possible function names:

- `exports.get`: Creates a _get_ method that will expect the resources ID. It will handle a request of this form, for example: `/api/memoes/124`
- `exports.getIndex`: Special version of _get_ that won't expect a resource ID. e.g. `GET /api/memoes`. Use this for getting a list of resources.
- `exports.post`: Handles _post_ requests, does not expect a resource ID. e.g. `POST /api/memoes`. Use this for created new resources.
- `exports.put`: Similar to `exports.get` but will respond to requests using the _put_ method. Use this for making changes to the specified resource.
- `exports.delete`: Similar to `exports.get` but will respond to requests using the _delete_ method. Use this to delete the specified resource.
- `exports.getAnything_else`: Create custom actions for a resource by using one of the four methods followed by a custom name. e.g. `exports.postPublish` responds to `POST /api/memoes/publish?id=124`.

**Note**: By default, custom actions won't expect an ID. If you need to pass that info, use a query parameter. e.g. `/api/memoes/publish?id=124` and then access it in the request handler using `req.query.id`.

#### Promises

_Synth_ has been designed to handle promises returned by request handlers. In fact, it's recommended that you do so!

If a given request handler returns a promise, or an object that can be JSONified, _synth_ will automatically respond using the result of that promise.

On top of that handiness, it also enables _synth_ to preload data when opening subviews. (TODO: Explain this more!)

#### API endpoint example

Here's an example _GET_ request handler for the memoes resource that lists all the created memoes:

```javascript
exports.getIndex = function (req, res) {
  return req.db.find('memoes').then(function (data) {
    return data;
  });
};
```

**Note:** The above handler didn't need a `then` call, the promise could have been returned directly. It's just there to demonstrate what's happening.

#### Throwing errors

If for some reason you cannot complete the API request, you can throw an error and Synth will output it using console.error(). If you're running your app in dev mode, the error will be sent to the client too. In production mode a generic message "an error has occurred" will be sent to the client.

You can throw errors a few ways:

- `Number`: If you just throw a number, the server will respond with that HTTP response status code, but no message will be recorded.
- `String`: With a string, the status code of the HTTP response will be 500, and specified string will be recorded to the console. In dev mode, it'll be sent to the client as well.
- `{statusCode: Number, message: String}`: If you want to specify both a status code and a message, throw an object with the keys `statusCode` and `message`.

For example:

```javascript
exports.get = function (req, res) {
  if (!req.query.search) {
    throw {
      statusCode: 422,
      message: "The search parameter was not provided"
    };
  }
};
```

<div id="packages"></div>
# Third-party packages

Synth makes use of existing package managers to add third-party code to both your back-end and front-end. [NPM](https://npmjs.org/) is used for back-end packages, and [Bower](https://bower.io/) is used for front-end packages.

Synth provides a single unified interface to both, invoked from the root of your project.

<div id="installing-packages"></div>
## Installing packages

To install either a back-end or a front-end package, just use _synth_'s install command:

```bash
synth install -f jquery
```

You can specify that a package is meant for  the front or back-ends using the -b or -f flags:

```bash
synth install -f lodash  # Installs lodash for the front end (using bower)
synth install -b lodash  # Installs lodash for the back end (using npm)
```

<div id="supported-assets"></div>
## Supported assets

_Synth_ supports JavaScript/CoffeeScript, CSS/SASS/Stylus, and HTML/Jade. _Synth_ will also precompile, minify and concatenate your JS and CSS assets when set to run in production mode (with built-in support for [ngmin](https://github.com/btford/ngmin) to keep your angular dependencies automatically working).

<div id="front-end-manifest"></div>
## Front-end _Manifest_ files

Your project should contain manifest files for your front-end assets, one for CSS and the other JavaScript. You can find the CSS manifest in `front/css/cssFiles`, and the JavaScript one in `front/js/jsFiles`. Each contains the list of css/js files (separated by new-lines) that should be loaded by the client.

Each asset file is loaded in the order that they're listed in the given manifest. This is important if any asset depends on another. For example, make sure that the jquery library is listed before any jQuery plugins that depend on it.

Most front-end packages contain many extra files that shouldn't be served up to web browsers. _Synth_ reads the _bower.json_ that comes with most packages to look for the package's _main_ file. It will then place a reference to that file in the Manifest.

If there are extra files that need to be loaded from a package, or a bower package didn't list its main file, just add a reference to the front-end _Manifest_ file. For example, a reference to jquery's main file would look like `../bower_components/jquery/jquery.js`

When you serve up your app in dev mode, each front-end asset is loaded serparately, and unminified, to help with debugging. This also means that as you change the asset file, you don't need to recompile or restart the server.

When you serve up your app in production mode, all the assets are minified and concattenated into two files (one for css, one for javascript). This helps reduce server load and improve client-side performance. It sucks for development though since you need to restart the server if you make any changes.

## More about third-party packages

Back-end packages are installed in `back/node_modules` and front-end packages are installed in `front/bower_components`.

_Synth_ records which packages are installed in two files: `back/packages.json` (for back-end packages) and `front/bower.json` (for front-end packages). To make sure that you have installed all the packages specified in a _synth_ app, just run `synth install -b` and `synth install -f` from the app's root folder.

<div id="synth-json"></div>
# synth.json

All of the web apps settings and meta-info are stored in _synth.json_. This includes the web app's name, version, and homepage.

For `version`, it is recommended that you use the [semver](http://semver.org/) format.
