// Returns a list of products in the system

exports.getIndex = function () {
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

exports.get = function () {
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

exports.getSpecials = function () {
  return {
    specials: []
  };
};

exports.getOops = function () {
  throw { error: "Ouch!" };
};

exports.put501Oops = function () {
  throw { statusCode: 501, message: "Ouch!" };
};
