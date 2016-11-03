angular.module('chatapp.controllers', [])

.run(['FBFactory', '$rootScope', 'UserFactory', 'Utils', function(FBFactory, $rootScope, UserFactory, Utils) {

  $rootScope.chatHistory = [];
  var baseChatMonitor = FBFactory.chatBase();

  var unwatch = baseChatMonitor.$watch(function(snapshot) {  
    var user = UserFactory.getUser();

    if (!user) return;

    if (snapshot.event == 'child_added' || snapshot.event  == 'child_changed') {                
      var key = snapshot.key;                
      if (key.indexOf(Utils.escapeEmailAddress(user.email)) >= 0) {                    
        var otherUser = snapshot.key.replace(/_/g,  '')
          .replace('chat', '')
          .replace(Utils.escapeEmailAddress(user.email), '');                    

        if ($rootScope.chatHistory.join('_'). indexOf(otherUser) === -1) {                        
          $rootScope.chatHistory.push(otherUser);                    
        }                    

        $rootScope.$broadcast('newChatHistory');

        /*                    
         *  TODO: PRACTICE                    
         *  Fire a local notification when a new chat  comes in.                    
         */                
      }            
    }        
  });    
}])

.controller('MainCtrl', ['$scope', 'Loader', '$ionicPlatform',  '$cordovaOauth', 'FBFactory', 
  'GOOGLEKEY', 'GOOGLEAUTHSCOPE',  'UserFactory', 'currentAuth', '$state', 
  function($scope, Loader, $ionicPlatform, $cordovaOauth,  FBFactory, GOOGLEKEY, GOOGLEAUTHSCOPE, 
  UserFactory, currentAuth,  $state) {
  
  $ionicPlatform.ready(function() {            
    Loader.hide();

    $scope.$on('showChatInterface', function($event,  authData) {
      console.log('showChatInterface');
      console.log('authData', authData);

      if (authData.user) {
        authData = authData.user;                
      }               

      UserFactory.setUser(authData);                
      Loader.toggle('Redirecting..');                
      
      $scope.onlineusers = FBFactory.olUsers();

      $scope.onlineusers.$loaded().then(function(data) {
        console.log(data);

        var user = {                            
          picture:  authData.photoURL,                            
          name: authData.displayName,                            
          email: authData.email,                            
          login: Date.now()                        
        };

        console.log('add user', user);

        $scope.onlineusers.$add(user).then(function(ref) {                            
          console.log(ref);

          UserFactory.setPresenceId(ref.key); 
          UserFactory.setOLUsers($scope.onlineusers);

          $state.go('tab.dash');                        
        });

      }, function(err) {

        console.log(err);
      });                

      return;            
    });
            
    if (currentAuth) {
      console.log('Autenticado!');
      $scope.$broadcast('showChatInterface',  currentAuth);            
    } else {
      console.log('Nao Autenticado!');
    }

    $scope.loginWithGoogle = function() {
      Loader.show('Authenticating..');     
      
      $cordovaOauth.google(
        '170954706458-d9mugut5tevd5hsq7lahmnoe49oh7dmo.apps.googleusercontent.com', 
        ['email']).then(function(result) {

        console.log(result);
        //https://www.thepolyglotdeveloper.com/2015/03/sign-into-firebase-with-facebook-using-ionic-framework/
        var provider = new firebase.auth.GoogleAuthProvider();

        firebase.auth().authWithOAuthToken(provider, result.access_token).then(function(result) {
          // This gives you a Google Access Token. You can use it to access the Google API.
          var token = result.credential.accessToken;
          // The signed-in user info.
          var user = result.user;
                             
          $scope.$broadcast('showChatInterface', result);

        }, function(error) {
          console.log('login error', error);
          Loader.toggle(error);
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...
        });
      
      }, function(error) {                    
        
        console.log('Error Google ', error);
        Loader.toggle(error);               

      });

    }

  });

}]) 

/**
 * Dash
 */
.controller('DashCtrl', ['$scope', 'UserFactory', '$ionicPlatform', '$state', '$ionicHistory', 
  function($scope, UserFactory, $ionicPlatform, $state, $ionicHistory) {

    $ionicPlatform.ready(function() {
      // apaga o histórica, caso o usuario pressionar voltar, 
      // ele saia da aplicação e não vá pra tela de login.
      $ionicHistory.clearHistory();

      $scope.users = UserFactory.getOLUsers();
      console.log($scope.users);
      $scope.currUser = UserFactory.getUser();
      console.log($scope.currUser);

      var presenceId = UserFactory.getPresenceId();

      $scope.redir = function(user) {
        $state.go('chat-detail', {
          otherUser: user
        })
      }
    });

}])

/**
 * Chats
 */
.controller('ChatsCtrl', ['$scope', '$rootScope', 'UserFactory',  'Utils', '$ionicPlatform', '$state', 
  function($scope, $rootScope,  UserFactory, Utils, $ionicPlatform, $state) { 
  
  $ionicPlatform.ready(function() {        
    $scope.$on('$ionicView.enter', function(scopes, states) {            
      var olUsers = UserFactory.getOLUsers();
      $scope.chatHistory = [];            

      $scope.$on('AddNewChatHistory', function() {                
        var ch = $rootScope.chatHistory, matchedUser;                

        for (var i = 0; i < ch.length; i++) {                    
          for (var j = 0; j < olUsers.length; j++) {                        
            if (Utils.escapeEmailAddress(olUsers[j].email) == ch[i]) {                            
              matchedUser = olUsers[j];                        
            }                    
          };                    

          if (matchedUser) {                        
            $scope.chatHistory.push(matchedUser);                    
          } else {                        
            $scope.chatHistory.push({
              email: Utils.unescapeEmailAddress(ch[i]),                            
              name: 'User Offline'                        
            })                    
          }                
        };
      });

      $scope.redir = function(user) {                
        $state.go('chat-detail', {                    
          otherUser: user                
        });            
      }            

      $rootScope.$on('newChatHistory', function($event) {                
        $scope.$broadcast('AddNewChatHistory');            
      });            

      $scope.$broadcast('AddNewChatHistory');        
    });

  });
}])

/**
 * Chat detail
 */
.controller('ChatDetailCtrl', ['$scope', 'Loader',  '$ionicPlatform', '$stateParams', 
  'UserFactory', 'FBFactory',  '$ionicScrollDelegate', '$cordovaImagePicker', 'Utils',  
  '$timeout', '$ionicActionSheet', '$cordovaCapture',  '$cordovaGeolocation', '$ionicModal',    
  function($scope, Loader, $ionicPlatform, $stateParams,  UserFactory, FBFactory, $ionicScrollDelegate, 
  $cordovaImagePicker,  Utils, $timeout, $ionicActionSheet, $cordovaCapture,  $cordovaGeolocation, $ionicModal) 
  { 
    $ionicPlatform.ready(function() { 
      Loader.show('Establishing Connection...');          
      // controller code here.. 
      $scope.chatToUser = $stateParams.otherUser;
      $scope.chatToUser = JSON.parse($scope.chatToUser);
      $scope.user = UserFactory.getUser();

      $scope.messages = FBFactory.chatRef($scope.user.email,  $scope.chatToUser.email); 

      console.log('To user', $scope.chatToUser);

      $scope.messages.$loaded().then(function() {   
        Loader.hide();   
        $ionicScrollDelegate.scrollBottom(true); 
      });

      console.log('User', $scope.user);

      // adiciona uma nova mensagem no firebase
      function postMessage(msg, type, map) {                
        var d = new Date();                
        d = d.toLocaleTimeString().replace(/:\d+ /, ' ');                
        map = map || null;                
        
        $scope.messages.$add({
           content: msg,                    
           time: d,                    
           type: type,                    
           from: $scope.user.email,                    
           map: map                
        });

        $scope.chatMsg = '';                
        $ionicScrollDelegate.scrollBottom(true);            
      };

      // ação ao clicar em enviar mensagem
      $scope.sendMessage = function() {                
        if (!$scope.chatMsg) return;

        var msg = '<p>' + $scope.user.displayName  + ' says : <br/>' + $scope.chatMsg + '</p>';                
        var type = 'text';                
        
        postMessage(msg, type);            
      };

      // List options
      $scope.showActionSheet = function() {                
        var hideSheet = $ionicActionSheet.show({                    
          buttons: [
              {text: 'Share Picture'}, 
              {text: 'Take Picture'}, 
              {text: 'Share My Location'}
            ], 
          cancelText: 'Cancel', 
          cancel: function() {                        
            // add cancel code..                        
            Loader.hide();                    
          },                    
          buttonClicked: function(index) {                      
            // Clicked on Share Picture                        
            if (index === 0) {                            
              Loader.show('Processing...');                            
              var options = {                                
                maximumImagesCount: 1                            
              };

              $cordovaImagePicker.getPictures(options).then(function(results) {                                    
                if (results.length > 0) {                                        
                  var imageData = results[0];                                        
                  
                  Utils.getBase64ImageFromInput(imageData, function(err, base64Img) {
                    //Process the image  string.
                    postMessage('<p>' +  $scope.user.cachedUserProfile.name + 
                      ' posted : <br/><img  class="chat-img" src="' + base64Img + '">', 'img');

                    Loader.hide();                                        
                  });
                }
              }, function(error) {
                // error getting photos 
                console.log('error', error);
                Loader.hide();
              });
            } 
            // Clicked on Take Picture 
            else if (index === 1) {
              Loader.show('Processing...');
              var options = {
                limit: 1
              };

              $cordovaCapture.captureImage(options).then(function(imageData) {
                Utils.getBase64ImageFromInput(imageData[0].fullPath, function(err,  base64Img) {
                  //Process the image string.
                  postMessage('<p>' + $scope.user. cachedUserProfile.name + 
                    ' posted : <br/><img class="chat-img" src="' + base64Img + '">', 'img');

                  Loader.hide(); 
                });
              }, function(err) {
                console.log(err);
                Loader.hide();
              });
            }
            // clicked on Share my location 
            else if (index === 2) {                            
              $ionicModal.fromTemplateUrl('templates/ map-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'                            
              }).then(function(modal) {
                $scope.modal = modal;
                $scope.modal.show();
                $timeout(function() {
                  $scope.centerOnMe();
                }, 2000);
              });
            }

            return true;
          }
        });
      } 
    }); 
  }
]) 

/**
 * Logout.
 */
.controller('AccountCtrl', ['$scope', 'FBFactory', 'UserFactory',  '$state',    
  function($scope, FBFactory, UserFactory, $state) {
  
  $scope.logout = function() {  
    UserFactory.cleanUser();
    UserFactory.cleanOLUsers();
    
    // remove presence
    var onlineUsers = UserFactory.getOLUsers();
    
    if (onlineUsers && onlineUsers.$getRecord) {                
      var presenceId = UserFactory.getPresenceId();
      var user = onlineUsers.$getRecord();
      onlineUsers.$remove(user);            
    }

    UserFactory.cleanPresenceId();

    FBFactory.auth().$signOut();
    
    $state.go('main');
  }

}]);
