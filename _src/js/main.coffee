$ ->
  page = location.pathname.replace(/\//g, "")
  $(".#{page}").addClass("active")
  $window = $(window)
  $window.on 'scroll', ->
    return unless $window.width() > 992
    if $window.scrollTop() > 80
      $('.toc').addClass('fixed')
    else
      $('.toc').removeClass('fixed')
