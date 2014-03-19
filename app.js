var app = angular.module('angularDocTalk', ['ui.bootstrap']);

var mainCtrl = function($sce) {
    this.$sce = $sce;

    this.searchTerms = [];
    this.docInfo = {};

    for (key in NG_PAGES) {
        //noinspection JSUnfilteredForInLoop
        var curDocInfo = NG_PAGES[key];
        if (curDocInfo.searchTerms && curDocInfo.searchTerms.titleWords) {
            this.searchTerms.push(curDocInfo.searchTerms.titleWords);
            this.docInfo[curDocInfo.searchTerms.titleWords] = curDocInfo;
        }
    }
};

mainCtrl.prototype.search = function() {
    if (this.docInfo[this.userSearchTerm]) {
        this.selectedDocInfo = this.docInfo[this.userSearchTerm];
        this.docUrl = this.$sce.trustAsResourceUrl("http://code.angularjs.org/1.2.14/docs/" + this.selectedDocInfo.outputPath);
    }
};