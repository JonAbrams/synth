Place any custom JavaScript or CoffeeScript files that you want available here.

If you want the files to be automatically loaded in the front-end, add a
reference to each file to jsFiles.json

For example, if you have a file in with the path: myapp/front/js/main.coffee
then add the string 'main.js' to the array in the jsFiles.json manifest
file (note that the extension was changed to .js)

Each file listed in jsFiles.json will be loaded in order. So make sure that
libraries like jQuery and Angular are loaded before your own code.
