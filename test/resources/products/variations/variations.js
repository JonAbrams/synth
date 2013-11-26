var variations = [];

exports.post = function (req, res) {
  variations.push({
    name: req.body.name,
    productId: req.params.productId
  });
  res.end();
};

exports.getIndex = function (req, res) {
  res.json(variations);
};
