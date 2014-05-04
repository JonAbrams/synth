exports.getIndex = function (req, res) {
  return req.db.collection('tweets').find()
    .sort({ created_at: -1 })
    .limit(30)
    .toArray().then(function (tweets) {
      return {
        tweets: tweets
      };
    });
};
