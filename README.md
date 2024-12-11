# SYNTH

The first back-end framework specially designed for single-page web applications.

## Current status

**Version 0.6.1 (latest)**:

**Note:** Despite being fully functional, **_synth_ is still in beta**. It hasn't been fully tested in production and since it's in active development, implementation and interface details are likely to change.

[![Build Status](https://travis-ci.org/JonAbrams/synth.png?branch=master)](https://travis-ci.org/JonAbrams/synth)
[![Code Climate](https://codeclimate.com/github/JonAbrams/synth.png)](https://codeclimate.com/github/JonAbrams/synth)

_Synth_ is an API-first web app framework (built on NodeJS) that provides the following features:

- Easily create new RESTful API resources by just creating folders and naming functions a certain way.
- Preload angular model data on page load (saving an extra roundtrip).
- Preload html view on page load (saving another extra roundtrip!)
- A simplified project structure where front-end code (angular code, html, css, bower packages, etc) is in the 'front' folder and back-end code (node code and node packages) are in the 'back' folder.
- A command-line tool for installing third party packages, using npm + bower, that auto-updates manifest files.
- Auto compilation of assets on request for dev, and pre-compilation for prod (including minification and ng-annotate).
- Auto-restarts the server when changes are detected.
- Support for various back-end and front-end templates to help get a new project going quickly.

## Documentation + Tutorial

For complete up-to-date documentation, tutorials, and example apps, check out [synthjs.com](http://www.synthjs.com).

## Components

While Synth is an opinionated framework that provides everything you need to make a great web app, parts of it are available to be used by existing web apps:

- [synth-api](https://github.com/JonAbrams/synth-api) – Easily generate a back-end JSON API for Express based on your app's directory structure.
- [synth-di](https://github.com/JonAbrams/synth-di) – The dependency-injection library used by synth-api.
- [apiPrefetch.js](https://github.com/JonAbrams/apiPrefetch.js) - Used to take advantage of api prefetching on the front-end.
- [heroku-buildpack-synth](https://github.com/JonAbrams/heroku-buildpack-synth) - Use this buildpack to easily deploy Synth apps on Heroku or other compatible cloud hosting platforms.

## Sample App

Blurbs ~~[Live Demo](http://blurbs.synthjs.com)~~ - [Source](https://github.com/JonAbrams/synth-example-blurbs)

## License

[MIT](https://github.com/JonAbrams/synth/blob/master/LICENSE)

## Credit

- This project was created by Jon Abrams (~~Twitter~~ | [Blue Sky](https://bsky.app/profile/jonabrams.com) | [GitHub](https://github.com/JonAbrams)).
- Thanks to [Katie Lefevre](https://github.com/ktel1218) for the logo.
- Thanks to Stephen Ausman (aka [stackd](https://github.com/stackd)) for handing over control of the 'synth' package on NPM.
