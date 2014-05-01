# SYNTH

The easiest web framework for synthesizing API-first web apps that also have web front-ends.

## Current status

**Version 0.4.11 (latest)**:

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

## Documentation

For complete up-to-date documentation, tutorials, and example apps, check out [synthjs.com](http://www.synthjs.com).

## License

[MIT](https://github.com/JonAbrams/synth/blob/master/LICENSE)

## Credit

- This project was created by Jon Abrams ([Twitter](https://twitter.com/JonathanAbrams) | [GitHub](https://github.com/JonAbrams)).
- Special thanks to Stephen Ausman (aka [stackd](https://github.com/stackd)) for handing over control of the 'synth' package on NPM.
