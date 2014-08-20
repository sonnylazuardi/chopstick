'use strict';

/* Controllers */

angular.module('myApp.controllers', ['firebase.utils', 'simpleLogin'])
  .controller('LoungeCtrl', ['$scope', 'fbutil', 'user', 'FBURL', '$window', '$location', function($scope, fbutil, user, FBURL, $window, $location) {
    // var profile = fbutil.syncObject(['users', user.uid]);
    // profile.$bindTo($scope, 'profile');

    // var onlineusers = fbutil.syncObject('presences');
    // onlineusers.$bindTo($scope, 'onlineusers');

    // var duels = fbutil.syncObject(['duels', user.uid]);
    // duels.$bindTo($scope, 'duels');

    // $scope.versus = {};

    // profile.$loaded().then(function(snap) {
    //   var listRef = fbutil.ref('presences');
    //   console.log(snap);
    //   var userObj = {
    //     uid: user.uid,
    //     name: snap.name,
    //     avatar: snap.avatar,
    //     score: snap.score,
    //     status: '★ online'
    //   };
    //   var userRef = listRef.push(userObj);

    //   $scope.duel = function(uid) {
    //     console.log('duels');
    //     var roomid = user.uid + '::' + uid;
    //     var dueling = fbutil.syncObject(['duels', uid]);
    //     dueling.versus = userObj;
    //     dueling.roomid = roomid;
    //     dueling.$save();

    //     var check_accepted = fbutil.syncObject(['versus', roomid]);
    //     check_accepted.$watch(function() {
    //       if (check_accepted.start)
    //         $location.path('versus/'+roomid);
    //     })
    //   }

    //   $scope.accept_duel = function(roomid) {
    //     console.log('accept duels');
    //     var dueling = fbutil.ref('duels', user.uid);
    //     dueling.remove();
    //     //redirect to room id
    //     $location.path('versus/'+roomid);
    //   }

    //   var presenceRef = fbutil.ref('.info', 'connected');
    //   presenceRef.on('value', function(snap) {
    //     userRef.onDisconnect().remove();
    //   });

    //   var onIdle = function () {
    //     userRef.update({status: '☆ idle'});
    //   }
    //   var onAway = function () {
    //     userRef.update({status: '☄ away'});
    //   }
    //   var onBack = function () {
    //     userRef.update({status: '★ online'});
    //   }

    //   var idle = new $window.Idle({
    //     onHidden : onIdle,
    //     onVisible : onBack,
    //     onAway : onAway,
    //     onAwayBack : onBack,
    //     awayTimeout : 8000 //away with default value of the textbox
    //   });
    // });
  }])

  .controller('GameoverCtrl', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    
  }])

  .controller('VersusOverCtrl', ['$scope', '$rootScope', '$location', 'fbutil', function($scope, $rootScope, $location, fbutil) {
    $scope.reset = function() {
      console.log('delete versus');
      var ref = fbutil.ref('versus', $rootScope.roomid);
      ref.remove();
    }
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
      if (parseInt($scope.turn) == 1) {
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

  .controller('VersusCtrl', ['$scope','$rootScope', '$location', '$routeParams', 'fbutil', 'user', function($scope, $rootScope, $location, $routeParams, fbutil, user) {
    var roomid = String($routeParams.id);
    $rootScope.roomid = roomid;
    var roomsplit = roomid.split("::");

    if (roomsplit[0] == user.uid)
      $scope.statusPlayer = 1;
    else 
      $scope.statusPlayer = 2;

    var player1 = fbutil.syncObject(['users', roomsplit[0]]);
    player1.$bindTo($scope, 'player1');

    var player2 = fbutil.syncObject(['users', roomsplit[1]]);
    player2.$bindTo($scope, 'player2');

    var p1 = [{
      id: 0,
      source: 1,
      val: 1
    },{
      id: 1,
      source: 1,
      val: 1
    }];

    var p2 = [{
      id: 0,
      source: 2,
      val: 1
    },{
      id: 1,
      source: 2,
      val: 1
    }];

    var turn = 1;
    var win = false;
    var winner = null;

    var current_game = fbutil.syncObject(['versus', roomid]);
    current_game.$loaded().then(function() {
      if (!current_game.start) {
        //init new game
        current_game.start = true;
        current_game.state = {p1: p1, p2: p2, turn: turn, win: win, winner: winner};
        current_game.$save();
        $scope.state = current_game.state;
      }
    });

    var state = fbutil.syncObject(['versus', roomid, 'state']);
    state.$bindTo($scope, 'state');

    state.$watch(function() {
      if (state.win) {
        $rootScope.winner = state.winner;
        $location.path('/versus/over');
      }
    });
    
    $scope.getParent = function(target) {
      if (target.source == 1) {
        return $scope.state.p1;
      } else {
        return $scope.state.p2;
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
      if (parseInt($scope.state.turn) == 1) {
        $scope.state.turn = 2;
      } else {
        $scope.state.turn = 1;
      }
      //check winner
      if ($scope.state.p1[0].val == 0 && $scope.state.p1[1].val == 0) {
        $scope.state.winner = $scope.player2.name;
        $scope.player2.score += 10;
        $scope.player1.score += 1;
        $scope.state.win = true;
        $location.path('/versus/over');
      } else if ($scope.state.p2[0].val == 0 && $scope.state.p2[1].val == 0) {
        $scope.state.winner = $scope.player1.name;
        $scope.player1.score += 10;
        $scope.player2.score += 1;
        $scope.state.win = true;
        $location.path('/versus/over');
      }
    }
    $scope.validate = function(source, target) {
      if (source.val == 0) {
        // do nothing
      } else if (source.source != $scope.statusPlayer) {
        alert("It's not your hand");
      } else if (source.source != $scope.state.turn) {
        alert("It's not your turn");
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
      $scope.validate(data, $scope.state.p1[0]);
    }
    $scope.onDropCompleteP1_1=function(data,evt){
      $scope.validate(data, $scope.state.p1[1]);
    }
    $scope.onDropCompleteP2_0=function(data,evt){
      $scope.validate(data, $scope.state.p2[0]); 
    }
    $scope.onDropCompleteP2_1=function(data,evt){
      $scope.validate(data, $scope.state.p2[1]);
    }
  }])

  .controller('MenuCtrl', ['$scope', 'simpleLogin', '$location', 'createProfile', function($scope, simpleLogin, $location, createProfile) {

    $scope.login = function() {
      $scope.err = null;
      simpleLogin.login()
        .then(function( user ) {
          console.log(user);
          createProfile(user.uid, user.displayName, user.thirdPartyUserData.picture.data.url, 0).then(function() {
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
        $location.path('/menu');
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