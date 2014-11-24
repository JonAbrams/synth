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

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
})
.service('dataLoader', function ($location, $http) {
  return function () {
    return $http.get( '/api' + $location.path() ).then(function (res) {
      return res.data;
    });
  };
});
