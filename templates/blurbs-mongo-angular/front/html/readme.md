Place html views/partials in this folder. Write them using raw html or jade.

Create folders and filenames that reflect the back-end API so that they can
be automatically loaded when requesting a route.

Each folder should be the nested resource it's used for viewing. The name of the
file should be the same as the name as the request handler function.

For example, if you have a resource called 'articles' and a child resource
called 'comments', and you want a view dedicated for viewing a particular comment
then create the following file in the current folder:
'articles/comments/get.html'.
