'use strict';

/* Controllers */

angular.module('myApp.controllers', ['firebase.utils', 'simpleLogin'])
  .controller('LoungeCtrl', ['$scope', 'fbutil', 'user', 'FBURL', '$window', function($scope, fbutil, user, FBURL, $window) {
    var profile = fbutil.syncObject(['users', user.uid]);
    profile.$bindTo($scope, 'profile');

    var onlineusers = fbutil.syncObject('presences');
    onlineusers.$bindTo($scope, 'onlineusers');

    profile.$loaded().then(function(snap) {
      var listRef = new $window.Firebase(FBURL + '/presences');
      var userObj = {
        id: snap.userid,
        name: snap.name,
        avatar: snap.avatar,
        score: snap.score,
        status: '★ online'
      };
      var userRef = listRef.push(userObj);

      var presenceRef = new $window.Firebase(FBURL + '/.info/connected');
      presenceRef.on('value', function(snap) {
        userRef.onDisconnect().remove();
      });

      var onIdle = function () {
        console.log('idle');
        userRef.update({status: '☆ idle'});
      }
      var onAway = function () {
        console.log('away');
        userRef.update({status: '☄ away'});
      }
      var onBack = function () {
        console.log('online');
        userRef.update({status: '★ online'});
      }

      var idle = new $window.Idle({
        onHidden : onIdle,
        onVisible : onBack,
        onAway : onAway,
        onAwayBack : onBack,
        awayTimeout : 8000 //away with default value of the textbox
      });
    });
  }])

  .controller('GameoverCtrl', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    
  }])

  .controller('GameCtrl', ['$scope','$rootScope', '$location', function($scope, $rootScope, $location) {
    $scope.p1 = [{
      id: 0,
      source: 1,
      val: 1
    },{
      id: 1,
      source: 1,
      val: 1
    }];
    $scope.p2 = [{
      id: 0,
      source: 2,
      val: 1
    },{
      id: 1,
      source: 2,
      val: 1
    }];
    $scope.turn = 1;
    $scope.getParent = function(target) {
      if (target.source == 1) {
        return $scope.p1;
      } else {
        return $scope.p2;
      }
    }
    $scope.checkSwapped = function(source, target, given) {
      var temp1, temp2; //check whether just swapped or not  
      temp1 = $scope.getParent(target)[0].val;
      temp2 = $scope.getParent(target)[1].val;
      if (target.id == 0) {
        temp1 += given;
        temp2 -= given;
      } else {
        temp1 -= given;
        temp2 += given;
      }
      return ($scope.getParent(target)[0].val == temp2 && $scope.getParent(target)[1].val == temp1);
    }
    $scope.checkExceed = function(source, target, given) {
      var tmptarget = $.extend(true,{},target);
      tmptarget.val += given;
      return (tmptarget.val >= 5);
    }
    $scope.changeTurn = function() {
      if ($scope.turn == 1) {
        $scope.turn = 2;
      } else {
        $scope.turn = 1;
      }
      //check winner
      if ($scope.p1[0].val == 0 && $scope.p1[1].val == 0) {
        $rootScope.winner = 2;
        $location.path('/game/over');
      } else if ($scope.p2[0].val == 0 && $scope.p2[1].val == 0) {
        $rootScope.winner = 1;
        $location.path('/game/over');
      }
    }
    $scope.validate = function(source, target) {
      if (source.val == 0) {
        // do nothing
      } else if (source.source != $scope.turn) {
        alert('Not your turn');
      } else if (source.source == target.source && source.id == target.id) {
        alert('You cannot drop here...');
      } else if (target.val == 0) {
        alert('You cannot drop to zero...');
      } else if (source.source != target.source) { //diffrent source
        target.val += source.val;
        if (target.val > 5) {
          target.val -= 5;
        } else if (target.val == 5) {
          target.val = 0;
        }
        $scope.changeTurn();
      } else { //same source
        var given, error = '', finish = false; 
        while (!finish) {
          given = prompt('How many stick ['+ ((source.val == 1) ? 1 : ('1-'+source.val) ) +']\n'+error, 1);
          if (given == undefined) break;
          given = parseInt(given);
          if (given < 1 || given > source.val) {
            finish = false;
            error = 'stick number out of range';
          } else if ($scope.checkSwapped(source, target, given)) {
            finish = false;
            error = 'the hand is just swapped, try diffrent number';
          } else if ($scope.checkExceed(source, target, given)) {
            finish = false;
            error = 'the target hand is too much';
          } else {
            finish = true;
          }         
        }
        if (given != undefined) {
          target.val += given;
          source.val -= given;
          $scope.changeTurn();
        }
      }
    }

    $scope.onDropCompleteP1_0=function(data,evt){
      $scope.validate(data, $scope.p1[0]);
    }
    $scope.onDropCompleteP1_1=function(data,evt){
      $scope.validate(data, $scope.p1[1]);
    }
    $scope.onDropCompleteP2_0=function(data,evt){
      $scope.validate(data, $scope.p2[0]); 
    }
    $scope.onDropCompleteP2_1=function(data,evt){
      $scope.validate(data, $scope.p2[1]);
    }
  }])

  .controller('MenuCtrl', ['$scope', 'simpleLogin', '$location', 'createProfile', function($scope, simpleLogin, $location, createProfile) {

    $scope.login = function() {
      $scope.err = null;
      console.log('login');
      simpleLogin.login()
        .then(function( user ) {
          console.log(user);
          createProfile(user.uid, user.displayName, user.id, user.thirdPartyUserData.picture.data.url, 0).then(function() {
            $location.path('/lounge');
          });
        }, function(err) {
          $scope.err = errMessage(err);
        });
    };

    function errMessage(err) {
      return angular.isObject(err) && err.code? err.code : err + '';
    }
  }])

  .controller('AccountCtrl', ['$scope', 'simpleLogin', 'fbutil', 'user', '$location',
    function($scope, simpleLogin, fbutil, user, $location) {
      // create a 3-way binding with the user profile object in Firebase
      var profile = fbutil.syncObject(['users', user.uid]);
      profile.$bindTo($scope, 'profile');

      // expose logout function to scope
      $scope.logout = function() {
        profile.$destroy();
        simpleLogin.logout();
        $location.path('/login');
      };

      $scope.clear = resetMessages;

      function resetMessages() {
        $scope.err = null;
        $scope.msg = null;
        $scope.emailerr = null;
        $scope.emailmsg = null;
      }
    }
  ]);