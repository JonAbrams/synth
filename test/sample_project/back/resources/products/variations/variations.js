var variations = [];

exports.post = function (params, res) {
  variations.push({
    name: params.name,
    productsId: params.productsId
  });
  res.end();
};

exports.getIndex = function (res) {
  res.json(variations);
};
