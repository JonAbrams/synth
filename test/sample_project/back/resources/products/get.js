// Returns a list of products in the system

exports.getIndex = function (req, res) {
  return {
    injection: "<script>alert('hi')</script>",
    products: [
      {
        name: "Fancy Shoes",
        price: 99.99
      }
    ]
  };
};

// Returns detailed info about a particular product

exports.get = function (req, res) {
  return {
    name: "Fancy Shoes",
    price: 99.99,
    colors: [
      "red",
      "green",
      "aubergine"
    ]
  };
};

// Returns 'special' products

exports.getSpecials = function (req, res) {
  return {
    specials: []
  };
};

exports.getOops = function (req, res) {
  throw { error: "Ouch!" };
};

exports.put501Oops = function (req, res) {
  throw { statusCode: 501, message: "Ouch!" };
};
