var app = angular.module('angularDocTalk', ['ui.bootstrap', 'firebase']);

var MainCtrl = function($scope, $rootScope, $firebaseSimpleLogin, $firebase, $location) {
    var _this = this;

    this.$scope = $scope;
    this.$location = $location;
    this.$firebase = $firebase;

    this.voteTypeEnum = {DOWN: -1, UP: 1};

    //Setup some default endpoints if no endpoints.js file is supplied.
    if (typeof endpoints === 'undefined') {
        window.endpoints = {
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

    for (var key in NG_PAGES) {
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

    $scope.wrappedGetCommentScore = function(commentInfo) {
        return _this.getCommentScore(commentInfo);
    }
};

MainCtrl.prototype.search = function() {
    if (this.docInfoByTitle[this.userSearch]) {
        this.selectedDocInfo = this.docInfoByTitle[this.userSearch];
        this.docUrl = 'docs/' + this.selectedDocInfo.outputPath;

        this.commentsForTopic = this.$firebase(this.dbRef.child('comments/' + this.selectedDocInfo.escapedTitle));
        this.votesForTopic = this.$firebase(this.dbRef.child('votes/' + this.selectedDocInfo.escapedTitle));
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

    //Log user in if they are not logged in and then try voting again.
    if (!this.auth.user) {
        this.loginWithGoogle().then(function() {
            _this.vote(commentInfo, voteType);
        });
        return;
    }

    var firebaseUserVote = this.votesForTopic.$child(commentInfo.$id).$child(this.auth.user.uid);

    if (this.votesForTopic[commentInfo.$id] &&
        this.votesForTopic[commentInfo.$id][this.auth.user.uid] === voteType) {
        firebaseUserVote.$remove();
    } else {
        firebaseUserVote.$set(voteType);
    }
};

MainCtrl.prototype.getCommentScore = function(commentInfo) {
    this.votesForTopic[commentInfo.$id] = this.votesForTopic[commentInfo.$id] || {};

    var score = 0;

    var votesForComment = this.votesForTopic[commentInfo.$id];

    for (var uid in votesForComment) {
        if (votesForComment.hasOwnProperty(uid)) {
            score += votesForComment[uid];
        }
    }

    return score;
};


MainCtrl.prototype.userHasUpVotedComment = function(commentInfo) {
    return this.userHasMatchingVoteTypeForComment(commentInfo, this.voteTypeEnum.UP);
};

MainCtrl.prototype.userHasDownVotedComment = function(commentInfo) {
    return this.userHasMatchingVoteTypeForComment(commentInfo, this.voteTypeEnum.DOWN);
};

MainCtrl.prototype.userHasMatchingVoteTypeForComment = function(commentInfo, voteType) {
    var votesForComment = this.votesForTopic[commentInfo.$id];

    return votesForComment &&
        this.auth.user &&
        votesForComment[this.auth.user.uid] === voteType;
};

MainCtrl.prototype.deleteComment = function(commentInfo) {
    this.commentsForTopic.$remove(commentInfo.$id);
};

MainCtrl.prototype.escapeForFirebase = function(str) {
    return str.replace(/[\.#$\[\]\/]/g, '');
};