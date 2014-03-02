var synth = require('synth');

var app = synth.app;

/* Define your middleware here */
app.use(function (req, res, next) {
  req.appName = "${ appName }";
  next();
});

module.exports = synth();
