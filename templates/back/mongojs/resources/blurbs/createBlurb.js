// Create a new blurb entry in the db

exports.post = function (req, res) {
  db.insert('blurbs', req.body, function (err) {
    if (err) res.json(err);
    res.end();
  });
};
