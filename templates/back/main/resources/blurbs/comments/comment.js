// Store a new comment
exports.post = function (req, res) {
  db.insert('comments', {
    blurbsId: req.params.blurbsId,
    message: req.body.message,
    author: req.body.author
  }, function (err) {
    if (err) res.json(err);
    res.end();
  });
};

// Get all the comments for a blurb
exports.getIndex = function (req, res) {
  db.find('comments', {
    blurbsId: req.params.blurbsId
  }, function (err, data) {
    res.json(data);
  });
};
