var app = angular.module('angularDocTalk', ['ui.bootstrap', 'firebase']);

var mainCtrl = function($sce, $firebaseSimpleLogin, $firebase) {
    var _this = this;

    this.$sce = $sce;

    this.dbRef = new Firebase('https://angular-doc-talk.firebaseio.com');
    this.auth = $firebaseSimpleLogin(this.dbRef);

    this.comments = $firebase(this.dbRef.child('comments'));

    this.searchTerms = [];
    this.docInfoByTerm = {};

    for (key in NG_PAGES) {
        //noinspection JSUnfilteredForInLoop
        var curDocInfo = NG_PAGES[key];
        if (curDocInfo.searchTerms && curDocInfo.searchTerms.titleWords) {
            this.searchTerms.push(curDocInfo.searchTerms.titleWords);
            this.docInfoByTerm[curDocInfo.searchTerms.titleWords] = curDocInfo;
        }
    }
};

mainCtrl.prototype.search = function() {
    if (this.docInfoByTerm[this.userSearchTerm]) {
        this.selectedDocInfo = this.docInfoByTerm[this.userSearchTerm];
        this.docUrl = this.$sce.trustAsResourceUrl("http://code.angularjs.org/1.2.14/docs/" + this.selectedDocInfo.outputPath);
    }
    else {
        this.docUrl = "";
    }
};

mainCtrl.prototype.loginWithGoogle = function() {
    this.auth.$login('google');
};

mainCtrl.prototype.logout = function() {
    this.auth.$logout();
};

mainCtrl.prototype.postComment = function() {
    this.comments.$add({comment: this.userComment});
};