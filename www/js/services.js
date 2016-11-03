angular.module('chatapp.services', [])

// interação com o armazenamento local
.factory('LocalStorage', [function() {    
  return {        
    set: function(key, value) {            
      return localStorage.setItem(key,  JSON.stringify(value));
    },
    get: function(key) {
      return JSON.parse(localStorage.getItem(key));        
    },
    remove: function(key) {            
      return localStorage.removeItem(key);        
    },    
  }; 
}])

// gerencia o serviço de carregametno
.factory('Loader', ['$ionicLoading', '$timeout', function($ionicLoading, $timeout) {
  return {            
    show: function(text) {                
      //console.log('show', text);                
      $ionicLoading.show({                    
        content: (text || 'Loading...'),                    
        noBackdrop: true                
      });            
    },          
    hide: function() {                
      //console.log('hide');                
      $ionicLoading.hide();            
    },
    toggle: function(text, timeout) {                
      var that = this;                
      that.show(text);
      $timeout(function() {                    
        that.hide();                
      }, timeout || 3000);            
    }        
  };    
}])

// Interage com o firebase
.factory('FBFactory', ['$firebaseAuth', '$firebaseArray',  'Utils',    
  function($firebaseAuth, $firebaseArray, Utils) {        
    return {
      // retorna um objeto para autenticação            
      auth: function() { 
        return $firebaseAuth();
      },
      // retorna todos os usuários online            
      olUsers: function() {                
        var olUsersRef = firebase.database().ref('onlineUsers');                
        return $firebaseArray(olUsersRef);
      },
      // retorna os chats            
      chatBase: function() {                
        var chatRef = firebase.database().ref('chats');                
        return $firebaseArray(chatRef);            
      },
      // retorna chat entre 2 usuarios            
      chatRef: function(loggedInUser, OtherUser) {                
        var chatRef = firebase.database().ref('chats/chat_' +  Utils.getHash(OtherUser, loggedInUser));
        return $firebaseArray(chatRef);            
      }        
    };    
  } 
])

.factory('UserFactory', ['LocalStorage', function(LocalStorage) {
  var userKey = 'user',        
      presenceKey = 'presence',        
      olUsersKey = 'onlineusers';

  return {        
    onlineUsers: {},
    // adiciona o usuario localmente        
    setUser: function(user) {            
      return LocalStorage.set(userKey, user);        
    },
    // retorna o usuario local        
    getUser: function() {            
      return LocalStorage.get(userKey);        
    },
    // remove o usuario local       
    cleanUser: function() {            
      return LocalStorage.remove(userKey);        
    }, 
    // adiciona os usuario online localmente      
    setOLUsers: function(users) {            
      // >> we need to store users as pure object.
      // else we lose the $ method of FB.                        
      // >> sometime, onlineUsers becomes null while            
      // navigating between tabs, so we save a copy in LS            
      LocalStorage.set(olUsersKey, users);            
      return this.onlineUsers = users;        
    },
    // retorna os usuários online local        
    getOLUsers: function() {            
      if (this.onlineUsers && this.onlineUsers.length > 0) {                
        return this.onlineUsers            
      } else {               
        return LocalStorage.get(olUsersKey);            
      }        
    },
    // apagas os usuarion online localmente        
    cleanOLUsers: function() {            
      LocalStorage.remove(olUsersKey);            
      return onlineUsers = null;        
    },
    // adiciona a chave do usuario localmente        
    setPresenceId: function(presenceId) {            
      return LocalStorage.set(presenceKey, presenceId);        
    },
    // retorna a chave do usuario local        
    getPresenceId: function() {           
      return LocalStorage.get(presenceKey);        
    },
    // apaga a chave do usuario local        
    cleanPresenceId: function() {            
      return LocalStorage.remove(presenceKey);        
    },    
  }; 
}])

// Utilitários
.factory('Utils', [function() {    
  return {        
    escapeEmailAddress: function(email) {            
      if (!email) 
        return false;
      // Replace '.' (not allowed in a Firebase key)  with ','            
      email = email.toLowerCase();            
      email = email.replace(/\./g, ',');            
      return email.trim();        
    },        
    unescapeEmailAddress: function(email) {            
      if (!email) 
        return false;
      
      email = email.toLowerCase();
      email = email.replace(/,/g, '.');            

      return email.trim();        
    },        
    getHash: function(chatToUser, loggedInUser) {            
      var hash = '';            
      if (chatToUser > loggedInUser) {                
        hash = this.escapeEmailAddress(chatToUser) + '_' +  this.escapeEmailAddress(loggedInUser);            
      } else {                
        hash = this.escapeEmailAddress(loggedInUser) + '_'  + this.escapeEmailAddress(chatToUser);            
      }            
      return hash;        
    },        
    getBase64ImageFromInput: function(input, callback) {            
      window.resolveLocalFileSystemURL(input, function(fileEntry) {                    
        fileEntry.file(function(file) {                            
          var reader = new FileReader();                            
          reader.onloadend = function(evt) {                                
            callback(null, evt.target.result);                            
          };                            
          reader.readAsDataURL(file);                        
        },                        
        function() {                            
          callback('failed', null);                        
        });                
      },                
      function() {                    
        callback('failed', null);                
      });        
    }    
  }; 
}]) 

