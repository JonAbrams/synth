// Returns a list of products in the system

exports.getList = function (req, res) {
  res.write(
    JSON.stringify([
      {
        name: "Fancy Shoes",
        price: 99.99
      }
    ])
  );
  res.end();
};

// Returns detailed info about a particular product

exports.get = function (req, res) {
  res.write(
    JSON.stringify({
      name: "Fancy Shoes",
      price: 99.99,
      colors: [
        "red",
        "green",
        "aubergine"
      ]
    })
  );
  res.end();
};
