/**
 * Created by Lara on 26.02.19.
 */

function loading() {
   $("#loading").show();
   $("#content").hide();
   $("#uploadOption").hide();
    
}

function showReplies() {
    $(".quote").hide();
    $("#hidequotenumber").hide();
}

function showQuotes() {
    $(".reply").hide();
    $("#hidereplynumber").hide();
}