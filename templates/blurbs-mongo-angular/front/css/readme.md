Place any custom CSS or SASS/SCSS files that you want available here.

If you want the files to be automatically loaded in the front-end, add a
reference to each file to cssFiles.json

For example, if you have a file in with the path: myapp/front/css/main.scss
then add the string 'main.css' to the array in the cssFiles.json manifest
file (note that the extension was changed to .css)

Each file listed in cssFiles.json will be loaded in order.

If you are using @import with SASS, then you only need to include the top-level
SASS file.
