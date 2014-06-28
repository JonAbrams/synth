## Features Overview

- Easily create new RESTful API resources by just creating folders and naming functions a certain way.
- Return data or promises from these functions and they'll be rendered to the client as JSON.
- Throw an error, and it'll be logged. If running in dev mode, the error will also be returned to the client.
- Preload angular model data on page load (saving an extra roundtrip).
- Preload html view on page load (saving another extra roundtrip!)
- A simplified project structure where front-end code (angular code, html, css, bower packages, etc) is in the 'front' folder and back-end code (node code and node packages) are in the 'back' folder.
- A command-line tool for installing third party packages, using npm + bower, that auto-updates manifest files.
- Auto compilation of assets on request for dev, and pre-compilation for prod (including minification and ngmin).
- Auto-restarts the server when changes are detected.
- Support for various back-end and front-end templates to help get a new project going quickly.
