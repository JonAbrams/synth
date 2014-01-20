# SYNTH

The easiest web framework for synthesizing API-first web apps that also have web front-ends.

**Current status**:

- Nearly everything outlined below is available. All that's missing is production server support. In other words, it only launches the server in dev mode currently. [2014-01-05]

[![Build Status](https://travis-ci.org/JonAbrams/synth.png?branch=master)](https://travis-ci.org/JonAbrams/synth)

Using Node.js to make an API-first web app is awesome but it has become rather complicated requiring knowledge of various technologies built on Node.js like _npm_, _grunt_, _bower_, and _express_, plus experience in how to organize and layout the app's folder structure. This has resulted in a needlessly steep learning curve for newbies, and a huge variation in app structure for pros.

_Synth_ simplifies making Node.js web apps by providing a single command-line tool to create, manage, and serve up such web apps. It makes building API-first web apps easier by letting you design your API with an easy to follow directory structure. It is a web API and app framework leveraging the best existing Node.js tools available.

_Synth_ provides a full assets pipeline out of the box, allowing you to use CoffeeScript, LESS, Stylus, and Jade right away. _Synth_ will also precompile, minify and concatenate your assets when set to run in production mode.

_Synth_ simplifies the process of generating and organizing API endpoints for your app. More on that later.

### Install

Synth depends on [Node](http://nodejs.org/) and [NPM](http://npmjs.org/). Install it globally using npm to access it from the command-line:

    npm install -g synth

**Note**: You may need to do `sudo npm install -g synth` if you get any errors when attempting to install.

### Create a new app

    synth new my_app

This will create a new folder called `my_app`, you can of course change `my_app` to anything you like.

    cd my_app
    synth install -b
    synth install -f

Go into your new project and install any third-party back-end and front-end packages.

Even though you have already installed _synth_ globally, in order to use it on the command-line, each project needs its own copy of it. Running `synth install -b` will install it for you.

### Default app directory structure

```
my_app/
  | .gitignore
  | synth.json
  | back/
    | node_modules/
    | resources/
      | blurbs/
        | getBlurbList.js
        | createBlurb.js
        | comments/
          |comment.js
    | back-app.js
    | packages.json
  | front/
    | Manifest
    | bower_packages/
    | css/
      | main.less
    | js/
      | front-app.js
      	| controllers
      	  | main.js
    | html
      | index.jade
      | views/
        | main.jade
```

## Starting the app

To start the app, just run `synth server` or `synth s`.

To start it in production mode (where all the assets are minified and concattenated) run `synth prod` or run `synth server` with the environment variables _SYNTH_MODE_ or _NODE_ENV_ set to "production".

You can specify the port that the server will listen to by setting the _SYNTH_PORT_ environment variable. 3000 is the default port.

## Third-party packages

Synth makes use of existing package managers to add third-party code to both your back-end and front-end. [NPM](https://npmjs.org/) is used for back-end packages, and [Bower](https://bower.io/) is used for front-end packages.

Synth provides a single unified interface to both, invoked from the root of your project.

#### Installing packages

To install either a back-end or a front-end package, just use _synth_'s install command:

    synth install -f jquery

You can specify that a package is meant for  the front or back-ends using the -b or -f flags:

    synth install -f lodash  # Installs lodash for the front end
    synth install -b lodash  # Installs lodash for the back end

#### Front-end _Manifest_ files

Your project should contain two JSON formatted manifest files for your front-end assets, one for CSS and the other JavaScript. You can find the CSS manifest in `front/css/cssFiles.json`, and the JavaScript one in `front/js/jsFiles.json`. Each contain the list of css/js files that should be loaded by the client.

Each asset file is loaded in the order that they're listed in the given manifest. This is important if any asset depends on another. For example, make sure that the jquery library is listed before any jQuery plugins that depend on it.

Most front-end packages contain many extra files that shouldn't be served up to web browsers. _synth_ reads the _bower.json_ that comes with most packages to look for the package's _main_ file. It will then place a reference to that file at the end of the Manifest.

If there are extra files that need to be loaded from a package, or a bower package didn't list its main file, just add a reference to the front-end _Manifest_ file. For example, a reference to jquery's main file would look like `"../bower_components/jquery/jquery.js"`

When you serve up your app in dev mode, each front end assets is loaded serparately, and unminified, to help with debugging.

When you serve up your app in production mode, all the assets are minified and concattenated into two files (one for css, one for javascript). This helps reduce server load and improve client-side performance.

#### More about third-party packages

Back-end packages are installed in `my_app/back/node_modules` and front-end packages are installed in `my_app/front/bower_components`.

Synth records which packages are installed in two files: `my_app/back/packages.json` (for back-end packages) and `my_app/front/bower.json` (for front-end packages). To make sure that you have installed all the packages specified in a _synth_ app, just run `synth install -b` and `synth install -f` from the app's root folder.

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

// Start the server and return it
module.exports = synth();
```

## Creating API resources + endpoints

_Synth_ scans the `resources` folder for .js (or .coffee) files. An API is generated based on the names of those files, and the folders that they're in.

For example, to create a _memoes_ resource, create a folder of that same name:

    | my_app
      | back
        | resources
          | memoes

You can then declare a request handler for a specific HTTP method in any file that is in the resources directory by assigning a function to `exports.<method><optional: ActionName>`.

For example, to create _GET_ request handler for the memoes resource that lists all the created memoes, create a file called `fetch.js` with the following contents:

```javascript
exports.getIndex = function (req, res) {
  req.db.find('memoes').then(function (data) {
    res.json(data);
  });
};
```

## synth.json

All of the web apps settings and meta-info are stored in _synth.json_. This includes the web app's name, version, and homepage.

For `version`, it is recommended that you use the [semver](http://semver.org/) format.

## License

[MIT](https://github.com/JonAbrams/synth/blob/master/LICENSE)

## Credit

- Thanks to Stephen Ausman ([stackd](https://github.com/stackd)) for handing over control of the 'synth' package on NPM.
