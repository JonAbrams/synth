# SYNTH

The easiest web framework for synthesizing API-first web apps that also have web front-ends.

**Current status**: Mostly just this README file. Slowly churning out code.

Using Node.js to make an API-first web app is awesome but it has become rather complicated requiring knowledge of various technologies built on Node.js like _npm_, _grunt_, _bower_, and _express_, plus experience in how to organize and layout the app's folder structure. This has resulted in a needlessly steep learning curve for newbies, and a huge variation in app structure for pros.

_Synth_ simplifies making Node.js web apps by providing a single command-line tool to create, manage, and serve up such web apps. _Synth_ makes building API-first web apps easier by incorporating best-practices by default and by building on top of the fantastic previously mentioned tools.

_Synth_ provides a full assets pipeline out of the box, allowing you to use CoffeeScript, LESS, Stylus, and Jade right away. _Synth_ will also precompile, minify and concatenate your assets when set to run in production mode.

_Synth_ simplifies the process of generating and organizing API endpoints for your app. More on that later.

### Install

Synth depends on [Node](http://nodejs.org/) and [NPM](http://npmjs.org/). Install it globally using npm:

    npm install -g synthjs

**Note**: You may need to do `sudo npm install -g synthjs` if you get any errors when attempting to install.

### Create a new app

    synth new my_app

This will create a new folder called `my_app`, you can of course change `my_app` to anything you like.

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

    synth install jquery

_synth_ will  automatically figure out if the package belongs to the front-end or back-end. In cases where the named package is available for both the back-end and front-end, synth will ask you which one you want.

You can specify that a package is meant for  the front or back-ends using the -b or -f flags:

    synth install -f lodash  # Installs lodash for the front end
    synth install -b lodash  # Installs lodash for the back end

#### The front-end 'Manifest' file

The `Manifest` file located in the `front` folder contains the list of assets that will be loaded by the web app's front-end. Each file is loaded in the order that they're listed. Therefore, for example, make sure that the jquery library is listed before any JavaScript files that depend on it.

Most front-end packages contain many extra files that shouldn't be served up to web browsers. _synth_ reads the _bower.json_ that comes with most packages to look for the package's _main_ file. It will then place a reference to that file at the end of the Manifest.

If there are extra files that need to be loaded from a package, just add a reference to the front-end _Manifest_ file.

When you serve up your app in dev mode, each front end assets is loaded serparately, to help with debugging.

When you serve up your app in production mode, all the assets are minified and concattenated into two files (one for css, one for javascript). This helps reduce server load and improve client-side performance.

#### More about third-party packages

Back-end packages are installed in `my_app/back/node_modules` and front-end packages are installed in `my_app/front/bower_packages`.

Synth records which packages are installed in two files: `my_app/back/packages.json` (for back-end packages) and `my_app/front/bower.json` (for front-end packages). To make sure that you have installed all the packages specified in a _synth_ app, just run `synth install` from the app's root folder.

## back-app.js

This is the script that is run when starting up the server. It's for loading the main synth module, specifying information about the db, then launches the HTTP listener to handle incoming requests.

Here's an example:

```javascript
// Include modules
var synth = require("synth");
var mongojs = require("mongojs");

// Configure some values
var port = process.env.PORT || 3000;
var mongoUrl = process.env["MONGO_URL"] || "my_app";

// Init libraries
var app = synth();
var db = mongojs(mongoUrl);

// Declare middleware (i.e. functions run for each incoming request)
app.use(function (req, res, next) {
  // Make the db object available to request handlers by attaching it to the request object
  req.db = db;
  next();
});

// Listen for incoming HTTP requests
app.listen(port, function () {
  console.log("Synth server listening on port " + port);
});
```

## Creating API resources + endpoints

_Synth_ scans the `resources` folder for .js (or .coffee) files. An API is generated based on the names of those files, and the folders that they're in.

For example, to create a _memoes_ resource, create a folder of that same name:

    | my_app
      | back
        | resources
          | memoes

You can then declare a request handler for a specific HTTP method in any file that is in the resources directory by assigning a function to `exports.<method>`.

For example, to create _GET_ request handler for the memoes resource that lists all the created memoes, create a file called `getList.js` with the following contents:

```javascript
exports.getIndex = function (req, res) {
  req.db.find('memoes').then(function (data) {
    res.json(data);
  });
};
```

## synth.json

All of the web apps settings and meta-info are stored in _synth.json_. This includes common info like the web app's name, version, and homepage.

For now it just has two keys: `name` and `version`, both string. For `version`, it is recommended that you use a [semver](http://semver.org/) format.


## For the future

1. Write tests.
2. Write code.
3. Collect feedback.
4. Fix bugs.
5. Create more features that increase ease-of-use and simplicity.

### Some ideas

- Allow request handlers to return a promise that then returns an object to be rendered as JSON. This means that many request handlers can be written in a single line.
- Automatically preload view requests with data. Saving the initial extra roundtrip that the front-end needs to take to get data.
- Automatically preload view requests with the requested view partial/template. Saving another initial roundtrip.
- More db integration. Maybe an ORM?
