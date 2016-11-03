// Ionic Starter App
// console.log(config.databaseURL);
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('IonicChatApp', ['ionic', 'chatapp.controllers', 'chatapp.services',
  'chatapp.directives', 'ngCordova', 'ngCordovaOauth', 'firebase'])

.run(["$rootScope", "$state", "$ionicPlatform", function($rootScope, $state, $ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    // verifica se não foi autenticado
    $rootScope.$on('$stateChangeError', function(event, toState,  toParams, fromState, fromParams, error) { 
      if (error === 'AUTH_REQUIRED') {
        console.log('AUTH_REQUIRED!');     
        $state.go('main'); 
      } else {
        console.log('! AUTH_REQUIRED');
      }
    });
  });
}])

// Constantes
//.constant('FBURL', config.databaseURL) 
.constant('GOOGLEKEY', '884868911991-enelr2592e8p5lspsiea6a4l49kd89pq.apps.googleusercontent.com') 
.constant('GOOGLEAUTHSCOPE', ['email'])

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyAwyaLYPdjvTaT1xFdsV3b48aEZfT4xqk0",
    authDomain: "chat2-b29ad.firebaseapp.com",
    databaseURL: "https://chat2-b29ad.firebaseio.com",
    storageBucket: "chat2-b29ad.appspot.com",
    messagingSenderId: "170954706458"
  };
  firebase.initializeApp(config);

  // não é necessário (exemplo de uso em aplicações realtime)
  $ionicConfigProvider.backButton.previousTitleText(false);
  $ionicConfigProvider.views.transition('platform');
  $ionicConfigProvider.navBar.alignTitle('center');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('main', {            
    url: '/',            
    templateUrl: 'templates/main.html',            
    controller: 'MainCtrl',            
    cache: false,            
    resolve: {
      'currentAuth': ['FBFactory', 'Loader',  function(FBFactory, Loader) {                    
        Loader.show('Checking Auth..');

        return FBFactory.auth().$waitForSignIn();                
    }]}     
  }) 

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    cache: false,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:
  .state('tab.dash', {
    url: '/dash',
    cache: false,
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    },
    resolve: {                
      'currentAuth': ['FBFactory', function(FBFactory) {                    
        return FBFactory.auth().$requireSignIn();
      }]
    }         
  })

  // mostra os chats
  .state('tab.chats', {
    url: '/chats',
    cache: false,
    views: {
      'tab-chats': {
        templateUrl: 'templates/tab-chats.html',
        controller: 'ChatsCtrl'
      }
    },
    resolve: {
      'currentAuth': ['FBFactory', function(FBFactory) {
        console.log('app chats');

        return FBFactory.auth().$requireSignIn();
      }]
    }
  })

  // tela para sign out
  .state('tab.account', {
    url: '/account',
    cache: false,
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    },
    resolve: {
      'currentAuth': ['FBFactory', function(FBFactory) {
        return FBFactory.auth().$requireSignIn();
      }]
    }
  })

  // chat entre duas pessoas
  .state('chat-detail', {
    url: '/chats/:otherUser',
    templateUrl: 'templates/chat-detail.html',
    controller: 'ChatDetailCtrl',
    cache: false,
    resolve: {
      'currentAuth': ['FBFactory', 'Loader', function(FBFactory, Loader) {
        Loader.show('Checking Auth...');

        return FBFactory.auth().$requireSignIn();
      }]
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

});
