var dataLoaderRunner = [
  'dataLoader',
  function (dataLoader) {
    return dataLoader();
  }
];

angular.module('${appName}', ['ngRoute'])
.config(function ($routeProvider, $locationProvider) {
  $routeProvider
  .when('/tweets', {
    templateUrl: '/html/tweets/getIndex.html',
    controller: 'tweetsController',
    resolve: {
      data: dataLoaderRunner
    }
  })
  .otherwise({
    redirectTo: '/tweets'
  });

  $locationProvider.html5Mode(true);
})
.service('dataLoader', function ($location, $http) {
  return function () {
    if (preloadedData) {
      var data = preloadedData;
      preloadedData = null;
      return data;
    } else {
      return $http.get( '/api' + $location.path() ).success(function (data) {
        return data;
      });
    }
  };
});
