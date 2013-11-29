var variations = [];

exports.post = function (req, res) {
  variations.push({
    name: req.body.name,
    productsId: req.params.productsId
  });
  res.end();
};

exports.getIndex = function (req, res) {
  res.json(variations);
};
