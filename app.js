var app = angular.module('angularDocTalk', ['ui.bootstrap', 'firebase']);

var MainCtrl = function($scope, $rootScope, $sce, $firebaseSimpleLogin, $firebase, $location) {
    var _this = this;

    this.$scope = $scope;
    this.$sce = $sce;
    this.$location = $location;
    this.$firebase = $firebase;

    this.voteTypeEnum = {DOWN: 0, UP: 1};

    if (!endpoints) {
        var endpoints = {
            firebaseUrl: 'https://angular-doc-talk.firebaseio.com'
        };
    }

    this.dbRef = new Firebase(endpoints.firebaseUrl);
    this.auth = $firebaseSimpleLogin(this.dbRef);

    $rootScope.$on("$firebaseSimpleLogin:login", function(e, user) {
        _this.$firebase(_this.dbRef.child('user/' + user.uid)).$bind($scope, 'ctrl.userComment')
            .then(function(unbind) {
                _this.unbindUser = unbind;
            });
    });

    $rootScope.$on("$firebaseSimpleLogin:logout", function(e, user) {
        if (_this.unbindUser) {
            _this.unbindUser();
        }
    });

    this.docTitles = [];
    this.docInfoByTitle = {};

    for (key in NG_PAGES) {
        //noinspection JSUnfilteredForInLoop
        var curDocInfo = NG_PAGES[key];
        if (curDocInfo.searchTerms && curDocInfo.searchTerms.titleWords) {
            var title;

            //If there already exists documentation with the same title word then use the path as the search term.
            if (this.docInfoByTitle[curDocInfo.searchTerms.titleWords]) {
                title = curDocInfo.path;
            }
            else {
                title = curDocInfo.searchTerms.titleWords;
            }

            this.docTitles.push(title);
            curDocInfo.title = title;
            curDocInfo.escapedTitle = this.escapeForFirebase(title);
            this.docInfoByTitle[title] = curDocInfo;
        }
    }

    //If there is a search term in the url then search for it
    if (this.$location.search().search) {
        this.userSearch = this.$location.search().search;
        this.search();
    }
};

MainCtrl.prototype.search = function() {
    if (this.docInfoByTitle[this.userSearch]) {
        this.selectedDocInfo = this.docInfoByTitle[this.userSearch];
        this.docUrl = this.$sce.trustAsResourceUrl("//code.angularjs.org/1.2.14/docs/" + this.selectedDocInfo.outputPath);

        this.commentsForTopic = this.$firebase(this.dbRef.child('comments/' + this.selectedDocInfo.escapedTitle));
    }
    else {
        this.docUrl = "";
    }

    this.$location.search('search', this.userSearch);
};

MainCtrl.prototype.loginWithGoogle = function() {
    return this.auth.$login('google');
};

MainCtrl.prototype.logout = function() {
    this.auth.$logout();
};

MainCtrl.prototype.postComment = function() {
    this.commentsForTopic.$add({
        comment: this.userComment,
        creationDate: new Date(),
        poster: {
            pic: this.auth.user.thirdPartyUserData.picture,
            name: this.auth.user.displayName,
            uid: this.auth.user.uid
        }
    });

    this.userComment = "";
};

MainCtrl.prototype.vote = function(commentInfo, voteType) {
    var _this = this;
    if (!this.auth.user) {
        this.loginWithGoogle().then(function() {
            _this.vote(commentInfo, voteType);
        });
        return;
    }

    //Create these sets if they don't exist
    commentInfo.upVoterSet = commentInfo.upVoterSet || {};
    commentInfo.downVoterSet = commentInfo.downVoterSet || {};

    var clickedSet;
    var unclickedSet;

    if (voteType === this.voteTypeEnum.UP) {
        clickedSet = commentInfo.upVoterSet;
        unclickedSet = commentInfo.downVoterSet;
    } else if (voteType === this.voteTypeEnum.DOWN) {
        clickedSet = commentInfo.downVoterSet;
        unclickedSet = commentInfo.upVoterSet;
    }
    else {
        return;
    }

    if (this.auth.user.uid in clickedSet) {
        delete clickedSet[this.auth.user.uid];
    } else {
        clickedSet[this.auth.user.uid] = true;
        delete unclickedSet[this.auth.user.uid];
    }
    this.commentsForTopic.$save();
};

MainCtrl.prototype.getCommentScore = function(commentInfo) {
    //Create these sets if they don't exist
    commentInfo.upVoterSet = commentInfo.upVoterSet || {};
    commentInfo.downVoterSet = commentInfo.downVoterSet || {};

    return Object.keys(commentInfo.upVoterSet).length - Object.keys(commentInfo.downVoterSet).length;
};

MainCtrl.prototype.userHasUpVotedComment = function(commentInfo) {
    return commentInfo.upVoterSet && this.auth.user && this.auth.user.uid in commentInfo.upVoterSet;
};

MainCtrl.prototype.userHasDownVotedComment = function(commentInfo) {
    return commentInfo.downVoterSet && this.auth.user && this.auth.user.uid in commentInfo.downVoterSet;
};

MainCtrl.prototype.getSortField = function(commentInfo) {
    return this.getCommentScore(commentInfo);
};

MainCtrl.prototype.escapeForFirebase = function(str) {
    return str.replace(/[\.#$\[\]\/]/g, '');
};