// Returns a list of products in the system

exports.getIndex = function (req, res) {
  res.json([
    {
      name: "Fancy Shoes",
      price: 99.99
    }
  ]);
};

// Returns detailed info about a particular product

exports.get = function (req, res) {
  res.json({
    name: "Fancy Shoes",
    price: 99.99,
    colors: [
      "red",
      "green",
      "aubergine"
    ]
  });
};

// Returns 'special' products

exports.getSpecials = function (req, res) { };
