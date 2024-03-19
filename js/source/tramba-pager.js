/* Custom pager designed for trambabule */

var Pager = {};
Pager._objectID = {};
Pager.pages = {};
Pager.currentPage = {};

Pager.showPage = function (pageIndex){
    $('.page'+pageIndex).show();
}

Pager.hidePage = function (pageIndex){
    $('.page'+pageIndex).hide();
}

Pager.showCurrentPage = function (){
    Pager.showPage(Pager.currentPage);
}

Pager.showNextPage = function (){
    if (Pager.currentPage < (Pager.pages - 1)){
        Pager.hidePage(Pager.currentPage);
        Pager.currentPage +=1 ;
        Pager.showPage(Pager.currentPage);
    }

    if (Pager.currentPage == (Pager.pages - 1)){    
        $('#pager-button').hide();
        $('.modal-footer button').show();
    }
}

Pager.setToObject = function(objectID){
    Pager._objectID = objectID;

    var listOfPages = $("#"+ Pager._objectID + " > div");
    Pager.pages = listOfPages.length;
    Pager.currentPage = 0;
    for (let index = 0; index < listOfPages.length; index++) {
        const page = listOfPages[index];
        page.classList.add('page'+index);
    }

    listOfPages.hide();
    Pager.showCurrentPage();

    $('#pager-button').click(function(){
        Pager.showNextPage();
    });

    $('.modal-footer button').hide();
}








