// Fetch some blurbs

exports.getIndex = function (req, res) {
  db.find('blurbs', {}, function (err, data) {
    if (err) return res.json(err);
    res.json(data);
  });
};
