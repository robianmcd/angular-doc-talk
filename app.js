var app = angular.module('angularDocTalk', ['ui.bootstrap', 'firebase']);

var MainCtrl = function($sce, $firebaseSimpleLogin, $firebase, $location) {
    var _this = this;

    this.$sce = $sce;
    this.$location = $location;

    this.dbRef = new Firebase('https://angular-doc-talk.firebaseio.com');
    this.auth = $firebaseSimpleLogin(this.dbRef);

    this.commentsDb = $firebase(this.dbRef.child('comments'));

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
        this.docUrl = this.$sce.trustAsResourceUrl("http://code.angularjs.org/1.2.14/docs/" + this.selectedDocInfo.outputPath);

        this.$location.search('search', this.selectedDocInfo.title);
    }
    else {
        this.docUrl = "";
    }
};

MainCtrl.prototype.loginWithGoogle = function() {
    this.auth.$login('google');
};

MainCtrl.prototype.logout = function() {
    this.auth.$logout();
};

MainCtrl.prototype.postComment = function() {
    this.commentsDb.$add({
        comment: this.userComment,
        poster: {
            pic: this.auth.user.thirdPartyUserData.picture,
            name: this.auth.user.displayName,
            uid: this.auth.user.uid
        }
    });

    this.userComment = "";
};