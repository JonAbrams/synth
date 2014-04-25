# SYNTH

The easiest web framework for synthesizing API-first web apps that also have web front-ends.

## Current status

**Version 0.4.8 (latest)**:

**Note:** Despite being fully functional, **_synth_ is not yet ready for production**. It hasn't been tested in production and since it's in active development, implementation and interface details are likely to change rapidly.

[![Build Status](https://travis-ci.org/JonAbrams/synth.png?branch=master)](https://travis-ci.org/JonAbrams/synth)
[![Code Climate](https://codeclimate.com/github/JonAbrams/synth.png)](https://codeclimate.com/github/JonAbrams/synth)

_Synth_ is an API-first web app framework (built on NodeJS) that provides the following features:

- Easily created new RESTful API resources by just creating folders and naming functions a certain way.
- Preload angular model data on page load (saving an extra roundtrip).
- Preload html view on page load (saving another extra roundtrip!)
- A simplified project structure where front-end code (angular code, html, css, bower packages, etc) is in the 'front' folder and back-end code (node code and node packages) are in the 'back' folder.
- A command-line tool for installing third party packages, using npm + bower, that auto-updates manifest files.
- Auto compilation of assets on request for dev, and pre-compilation for prod (including minification and ngmin).
- Auto-restarts the server when changes are detected.
- Support for various back-end and front-end templates to help get a new project going quickly.

### Install

Synth depends on [Node](http://nodejs.org/) and [NPM](http://npmjs.org/). Install it globally using npm to access it from the command-line:

    npm install -g synth

**Note**: You may need to do `sudo npm install -g synth` if you get any permission errors when attempting to install.

### Create a new app

    synth new my_app

This will create a new folder called `my_app`, you can of course change `my_app` to anything you like.

    cd my_app
    synth install -b
    synth install -f

Go into your new project and install any third-party back-end and front-end packages.

Even though you have already installed _synth_ globally, in order to use it on the command-line, each project needs its own copy of it. Running `synth install -b` will install it for you.

## Starting the app

To start the app, just run `synth server` or `synth s`.

To start it in production mode (where all the assets are minified and concattenated) run `synth prod` or run `synth server` with the environment variables _NODE_ENV_ set to "production".

You can specify the port that the server will listen to by setting the _PORT_ environment variable. 3000 is the default port.

## Third-party packages

Synth makes use of existing package managers to add third-party code to both your back-end and front-end. [NPM](https://npmjs.org/) is used for back-end packages, and [Bower](https://bower.io/) is used for front-end packages.

Synth provides a single unified interface to both, invoked from the root of your project.

#### Installing packages

To install either a back-end or a front-end package, just use _synth_'s install command:

    synth install -f jquery

You can specify that a package is meant for  the front or back-ends using the -b or -f flags:

    synth install -f lodash  # Installs lodash for the front end
    synth install -b lodash  # Installs lodash for the back end

#### Supported assets

_Synth_ supports JavaScript/CoffeeScript, CSS/SASS/Stylus, and HTML/Jade. _Synth_ will also precompile, minify and concatenate your JS and CSS assets when set to run in production mode (with built-in support for [ngmin](https://github.com/btford/ngmin) to keep your angular dependencies automatically working).

#### Front-end _Manifest_ files

Your project should contain manifest files for your front-end assets, one for CSS and the other JavaScript. You can find the CSS manifest in `front/css/cssFiles`, and the JavaScript one in `front/js/jsFiles`. Each contains the list of css/js files (separated by new-lines) that should be loaded by the client.

Each asset file is loaded in the order that they're listed in the given manifest. This is important if any asset depends on another. For example, make sure that the jquery library is listed before any jQuery plugins that depend on it.

Most front-end packages contain many extra files that shouldn't be served up to web browsers. _Synth_ reads the _bower.json_ that comes with most packages to look for the package's _main_ file. It will then place a reference to that file in the Manifest.

If there are extra files that need to be loaded from a package, or a bower package didn't list its main file, just add a reference to the front-end _Manifest_ file. For example, a reference to jquery's main file would look like `../bower_components/jquery/jquery.js`

When you serve up your app in dev mode, each front-end asset is loaded serparately, and unminified, to help with debugging. This also means that as you change the asset file, you don't need to recompile or restart the server.

When you serve up your app in production mode, all the assets are minified and concattenated into two files (one for css, one for javascript). This helps reduce server load and improve client-side performance. It sucks for development though since you need to restart the server if you make any changes.

#### More about third-party packages

Back-end packages are installed in `back/node_modules` and front-end packages are installed in `front/bower_components`.

_Synth_ records which packages are installed in two files: `back/packages.json` (for back-end packages) and `front/bower.json` (for front-end packages). To make sure that you have installed all the packages specified in a _synth_ app, just run `synth install -b` and `synth install -f` from the app's root folder.

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

## Creating API resources + endpoints

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
- `exports.getAnything_else`: Create custom actions for a resource by using one of the four methods followed by a custom name. By default they won't expect an ID. If you need to pass that info, use a URL parameter. e.g. `exports.postPublish` responds to `POST /api/memoes/publish?id=124`.

#### Promise endpoints

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

## synth.json

All of the web apps settings and meta-info are stored in _synth.json_. This includes the web app's name, version, and homepage.

For `version`, it is recommended that you use the [semver](http://semver.org/) format.

## Example apps

- Twitter-like clone: https://github.com/JonAbrams/synth-example-blurbs

## License

[MIT](https://github.com/JonAbrams/synth/blob/master/LICENSE)

## Credit

- This project was created by Jon Abrams [Twitter](https://twitter.com/JonathanAbrams) [GitHub](https://github.com/JonAbrams).
- Special thanks to Stephen Ausman (aka [stackd](https://github.com/stackd)) for handing over control of the 'synth' package on NPM.
