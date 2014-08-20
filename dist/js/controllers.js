'use strict';

/* Controllers */

angular.module('myApp.controllers', ['firebase.utils', 'simpleLogin'])
  .controller('HomeCtrl', ['$scope', 'fbutil', 'user', 'FBURL', function($scope, fbutil, user, FBURL) {
    $scope.syncedValue = fbutil.syncObject('syncedValue');
    $scope.user = user;
    $scope.FBURL = FBURL;
  }])

  .controller('ChatCtrl', ['$scope', 'messageList', function($scope, messageList) {
    $scope.messages = messageList;
    $scope.addMessage = function(newMessage) {
      if( newMessage ) {
        $scope.messages.$add({text: newMessage});
      }
    };
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
        $location.path('/gameover');
      } else if ($scope.p2[0].val == 0 && $scope.p2[1].val == 0) {
        $rootScope.winner = 1;
        $location.path('/gameover');
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

  .controller('LoginCtrl', ['$scope', 'simpleLogin', '$location', function($scope, simpleLogin, $location) {
    $scope.email = null;
    $scope.pass = null;
    $scope.confirm = null;
    $scope.createMode = false;

    $scope.login = function(email, pass) {
      $scope.err = null;
      simpleLogin.login(email, pass)
        .then(function(/* user */) {
          $location.path('/account');
        }, function(err) {
          $scope.err = errMessage(err);
        });
    };

    $scope.createAccount = function() {
      $scope.err = null;
      if( assertValidAccountProps() ) {
        simpleLogin.createAccount($scope.email, $scope.pass)
          .then(function(/* user */) {
            $location.path('/account');
          }, function(err) {
            $scope.err = errMessage(err);
          });
      }
    };

    function assertValidAccountProps() {
      if( !$scope.email ) {
        $scope.err = 'Please enter an email address';
      }
      else if( !$scope.pass || !$scope.confirm ) {
        $scope.err = 'Please enter a password';
      }
      else if( $scope.createMode && $scope.pass !== $scope.confirm ) {
        $scope.err = 'Passwords do not match';
      }
      return !$scope.err;
    }

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

      $scope.changePassword = function(pass, confirm, newPass) {
        resetMessages();
        if( !pass || !confirm || !newPass ) {
          $scope.err = 'Please fill in all password fields';
        }
        else if( newPass !== confirm ) {
          $scope.err = 'New pass and confirm do not match';
        }
        else {
          simpleLogin.changePassword(profile.email, pass, newPass)
            .then(function() {
              $scope.msg = 'Password changed';
            }, function(err) {
              $scope.err = err;
            })
        }
      };

      $scope.clear = resetMessages;

      $scope.changeEmail = function(pass, newEmail) {
        resetMessages();
        profile.$destroy();
        simpleLogin.changeEmail(pass, newEmail)
          .then(function(user) {
            profile = fbutil.syncObject(['users', user.uid]);
            profile.$bindTo($scope, 'profile');
            $scope.emailmsg = 'Email changed';
          }, function(err) {
            $scope.emailerr = err;
          });
      };

      function resetMessages() {
        $scope.err = null;
        $scope.msg = null;
        $scope.emailerr = null;
        $scope.emailmsg = null;
      }
    }
  ]);