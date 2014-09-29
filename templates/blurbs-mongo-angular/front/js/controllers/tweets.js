angular.module('${ appName }')
.controller('tweetsController', function ($scope, data) {
  $scope.tweets = data.tweets;
});
