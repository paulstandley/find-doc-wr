/***************************************************************
 *
 *   Responsive Checkout
 *   Bee Web Design
 *
 ***************************************************************/

function responsivecheckout() {
    var delivertodifferentaddress = function() {
        if ($('input#idSEPARATESHIP').is(':checked')) {
            $(".InvoiceField").removeClass("wide");
            $(".InvoiceFieldLabel").removeClass("wide");
        } else {
            $(".InvoiceField").addClass("wide");
            $(".InvoiceFieldLabel").addClass("wide");
            $("#idBothAddressesTable tr.ShowAlways #idDeliverHeader").css("display", "none");
        }
    }
    delivertodifferentaddress();

    $("input#idSEPARATESHIP").click(function() {
        delivertodifferentaddress();
    });
}