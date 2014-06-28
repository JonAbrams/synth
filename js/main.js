$(function() {
  var $window, page;
  page = location.pathname.replace(/\//g, "");
  $("." + page).addClass("active");
  $window = $(window);
  return $window.on('scroll', function() {
    if (!($window.width() > 992)) {
      return;
    }
    if ($window.scrollTop() > 80) {
      return $('.toc').addClass('fixed');
    } else {
      return $('.toc').removeClass('fixed');
    }
  });
});
