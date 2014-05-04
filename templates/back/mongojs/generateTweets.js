var db = require('promised-mongo')('tweets-db');
var Promise = require('bluebird');

var lorem = 'Semiotics ethnic drinking vinegar, Vice meh chia tattooed mumblecore DIY. Keytar banjo typewriter, Shoreditch biodiesel distillery shabby chic vegan. Chia Intelligentsia deep v church-key, trust fund farm-to-table raw denim post-ironic chambray kitsch disrupt mumblecore. Next level 90\'s Cosby sweater fingerstache, fixie ethical trust fund irony Banksy fap locavore Wes Anderson food truck. Art party dreamcatcher Schlitz chia, semiotics narwhal vinyl pop-up readymade Pitchfork. Flexitarian Etsy Thundercats, lomo fingerstache bitters fashion axe viral VHS trust fund fap occupy ethical. Church-key freegan fixie deep v Portland pour-over. Single-origin coffee Etsy Brooklyn Vice, tote bag tofu fixie occupy. Tumblr keytar 3 wolf moon, polaroid chambray tofu literally iPhone deep v plaid. Stumptown Intelligentsia actually, Bushwick church-key High Life readymade sartorial gastropub Thundercats letterpress umami. Banh mi gluten-free Pinterest hoodie lo-fi flexitarian. Slow-carb blog drinking vinegar farm-to-table try-hard. Pour-over lo-fi mlkshk Godard. Brooklyn bespoke +1 chillwave, bicycle rights butcher brunch ennui.'.split(' ');

var rand = function (max) {
  if (max == null) max = 100;
  return Math.floor( Math.random() * max );
};

var randomContent  = function () {
  var tweet = '';
  var word;
  while (tweet.length < 140) {
    word = lorem[ rand(lorem.length) ] + ' ';
    if (tweet + word > 140) break;
    tweet += word;
  }
  return tweet;
};

var promises = [];
for (var i=0; i < 30; i++) {
  promises.push(
    db.collection('tweets').insert({
      content: randomContent(),
      created_at: new Date( new Date() - rand(3.15569e10) ) /* any time in the past year */
    })
  );
}

Promise.all(promises).then(function () {
  process.exit();
});
