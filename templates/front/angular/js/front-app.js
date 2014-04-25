angular.module('${appName}', ['ngRoute'])
.config(function ($routeProvider, $locationProvider) {
  $routeProvider
  .when('/tweets', {
    templateUrl: '/html/tweets/getIndex.html',
    controller: 'tweetsController',
    resolve: {
      data: 'dataLoader'
    }
  })
  .otherwise({
    redirectTo: '/tweets'
  });

  $locationProvider.html5Mode(true);
})
.service('dataLoader', function ($location, $http) {
  if (preloadedData) {
    var data = preloadedData;
    preloadedData = null;
    return data;
  } else {
    return $http.get( '/api' + $location.path() ).then(function (res) {
      return res.data;
    });
  }
});
