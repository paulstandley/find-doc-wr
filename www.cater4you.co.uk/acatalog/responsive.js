/***************************************************************
 * 
 * Responsive.js	-	 utility functions for responsive web design
 *
 * Copyright (c) 2014 SellerDeck Limited
 *
 ****************************************************************/

//--------------------------------------------------------------
//
// Create SD namespace if not defined
//
//--------------------------------------------------------------

if (typeof window.SD === 'undefined') {
    window.SD = {};
}

//--------------------------------------------------------------
//
// SD.Responsive - Responsive functions singleton
//
//--------------------------------------------------------------

window.SD.Responsive = {

    /***************************************************************
     *
     * CallFunctions - adds all responsive function; called on document load
     *
     ***************************************************************/

    CallFunctions: function() {
        SD.Responsive.contactInfoTop();
        SD.Responsive.menus();
        SD.Responsive.orderHistory();
        SD.Responsive.orderHistoryDisplay();
        SD.Responsive.searchButton();
        SD.Responsive.ie9();
        SD.Responsive.android();
        SD.Responsive.setBrowserSizeListener();
        SD.Responsive.moveSizeDependentComponents();
        SD.Responsive.quantityButtons();
        SD.Responsive.addNavigateOnClick();
        SD.Responsive.removeDuplicatedInfo();
        SD.Responsive.resizeImages();
    },

    /***************************************************************
     *
     * Function: contactInfoTop
     * Description: This function relates to the contact info icons, whereby on mobile, those icons act as a link to open up the relevant contact info.
     * The CSS holds the styles should JS not be enabled, but if it is, these are all inline styles, which overwrite those from the stylesheet.
     *
     ***************************************************************/

    contactInfoTop: function() {

        var clearStyles = function() {
            $(".topContactInfoMobile div").css("clear", "none");
            $(".topContactInfoMobile div").css("width", "");
            $(".topContactInfoMobile div p.contactInfoP").css("display", "none");
            $(".topContactInfoMobile div p.contactInfoP").css("width", "");
            $(".topContactInfoMobile .contactInfoTopCol1").removeClass("colClass");
            $(".topContactInfoMobile .contactInfoTopCol2").removeClass("colClass");
            $(".topContactInfoMobile .contactInfoTopCol3").removeClass("colClass");
            $(".navigation-bar .miniNav").removeAttr("style");
        }

        var moveLeft = function() {
            $(".navigation-bar .miniNav").css("float", "left");
        }

        clearStyles();

        var button1 = function() {
            clearStyles();
            $(".topContactInfoMobile .contactInfoTopCol1").addClass("colClass");
            $(".topContactInfoMobile .contactInfoTopCol1 p.contactInfoP").css("width", "95%");
            $(".topContactInfoMobile .contactInfoTopCol1 p.contactInfoP").toggle();
        }

        var button2 = function() {
            clearStyles();
            $(".topContactInfoMobile .contactInfoTopCol2").addClass("colClass");
            $(".topContactInfoMobile .contactInfoTopCol2 p.contactInfoP").css("width", "95%");
            $(".topContactInfoMobile .contactInfoTopCol2 p.contactInfoP").toggle();
        }

        var button3 = function() {
            clearStyles();
            $(".topContactInfoMobile .contactInfoTopCol3").addClass("colClass");
            $(".topContactInfoMobile .contactInfoTopCol3 p.contactInfoP").css("width", "95%");
            $(".topContactInfoMobile .contactInfoTopCol3 p.contactInfoP").toggle();
        }

        $(".topContactInfoMobile .contactInfoTopCol1 div.contactInfoClick").click(function() {
            button1();
            moveLeft();
            $(".topContactInfoMobile .contactInfoTopCol1 div.contactInfoClick").click(function() {
                SD.Responsive.contactInfoTop();
            });
        });

        $(".topContactInfoMobile .contactInfoTopCol2 div.contactInfoClick").click(function() {
            button2();
            moveLeft();
            $(".topContactInfoMobile .contactInfoTopCol2 div.contactInfoClick").click(function() {
                SD.Responsive.contactInfoTop();
            });
        });

        $(".topContactInfoMobile .contactInfoTopCol3 div.contactInfoClick").click(function() {
            button3();
            moveLeft();
            $(".topContactInfoMobile .contactInfoTopCol3 div.contactInfoClick").click(function() {
                SD.Responsive.contactInfoTop();
            });
        });
    },

    /***************************************************************
     *
     * Function: Menus
     * Description: This function controls the different menus for desktop/mobile.
     *
     ***************************************************************/

    menus: function() {
        // MEGA MENU
        // This command is to set the menuHide class to the main navigation on mobile.
        $("div #mega-menu").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the main navigation a sliding animation.
        $("#mainNav").click(function(event) {
            $("div #mega-menu").slideToggle("slow", function() {
                $("div #mega-menu").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // BROCHURE MENU
        // This command is to set the menuHide class to the main navigation on mobile.
        $("div #brochure-menu").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the main navigation a sliding animation.
        $("#mainNav").click(function(event) {
            $("div #brochure-menu").slideToggle("slow", function() {
                $("div #brochure-menu").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // QUICK SEARCH	
        // This command is to set the menuHide class to the quick search navigation on mobile.
        $("div #quickSearchLeft").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the quick search navigation a sliding animation.
        $("#quickSearchTitle").click(function(event) {
            $("#quickSearchLeft").slideToggle("slow", function() {
                $("#quickSearchLeft").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // CART SUMMARY	
        // This command is to set the menuHide class to the cart summary navigation on mobile.
        $("div #shoppingCartSummaryLeft").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the cart summary navigation a sliding animation.
        $("#shoppingCartSummaryTitle").click(function(event) {
            $("#shoppingCartSummaryLeft").slideToggle("slow", function() {
                $("#shoppingCartSummaryLeft").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // PRODUCT FILTERS	
        // This command is to set the menuHide class to the product filters navigation on mobile.
        $("div #productFiltersLeft").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the product filters navigation a sliding animation.
        $("#productFiltersTitle").click(function(event) {
            $("#productFiltersLeft").slideToggle("slow", function() {
                $("#productFiltersLeft").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // INFO BOX
        // This command is to set the menuHide class to the infobox navigation on mobile.
        $("div #infoBox").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the infobox navigation a sliding animation.
        $("#infoBoxTitle").click(function(event) {
            $("#infoBox").slideToggle("slow", function() {
                $("#infoBox").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // STORE SECTIONS
        // This command is to set the menuHide class to the Store Sections navigation on mobile.
        $("div #storeSections").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the Store Sections navigation a sliding animation.
        $("#storeSectionsTitle").click(function(event) {
            $("#storeSections").slideToggle("slow", function() {
                $("#storeSections").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // INFORMATION
        // This command is to set the menuHide class to the infomation navigation on mobile.
        $("div #information").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the infomation navigation a sliding animation.
        $("#informationTitle").click(function(event) {
            $("#information").slideToggle("slow", function() {
                $("#information").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // BEST SELLERS
        // This command is to set the menuHide class to the best sellers navigation on mobile.
        $("div #bestSellerLeft").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the best sellers navigation a sliding animation.
        $("#bestSellerTitle").click(function(event) {
            $("#bestSellerLeft").slideToggle("slow", function() {
                $("#bestSellerLeft").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // NEW PRODUCTS
        // This command is to set the menuHide class to the new products navigation on mobile.
        $("div #newProductLeft").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the new products navigation a sliding animation.
        $("#newProductTitle").click(function(event) {
            $("#newProductLeft").slideToggle("slow", function() {
                $("#newProductLeft").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });

        // COUPON FIELDS
        // This command is to set the menuHide class to the coupon fields navigation on mobile.
        $("div #couponFieldLeft").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the coupon fields navigation a sliding animation.
        $("#couponFieldTitle").click(function(event) {
            $("#couponFieldLeft").slideToggle("slow", function() {
                $("#couponFieldLeft").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
            event.preventDefault();
        });
    },

    /***************************************************************
     *
     * bResponsiveDeliveryFields - if responsive delivery fields are enabled
     * 
     * This indicates to the code that manages the address fields that the layout has changed from a table to divs etc.
     *
     ***************************************************************/

    m_bResponsiveDeliveryFields: false,

    setResponsiveDeliveryFields: function(bValue) // set value
    {
        SD.Responsive.m_bResponsiveDeliveryFields = bValue;
    },

    getResponsiveDeliveryFields: function() // get value
    {
        return SD.Responsive.m_bResponsiveDeliveryFields;
    },

    /***************************************************************
     *
     * Function: orderHistory
     * Description: This function counts the number of rows in the order history part of the 'My Account' page. orderHeaders sets the 'order
     * headers' and orderProduct sets the 'Product headers'.
     *
     ***************************************************************/

    orderHistory: function() {

        $("div#idORDER_TRACKING table tr.cart td:nth-child(1)").prepend("<span>Order Number:</span>");
        $("div#idORDER_TRACKING table tr.cart td:nth-child(2)").prepend("<span>Date Ordered:</span>");
        $("div#idORDER_TRACKING table tr.cart td:nth-child(3)").prepend("<span>Value:</span>");
        $("div#idORDER_TRACKING table tr.cart td:nth-child(4)").prepend("<span>Status:</span>");
        $("div#idORDER_TRACKING table tr.cart td:nth-child(5)").prepend("<span>Date Shipped:</span>");
        $("div#idORDER_TRACKING table tr.cart td:nth-child(6)").prepend("<span>Carrier:</span>");
        $("div#idORDER_TRACKING table tr.cart td:nth-child(7)").prepend("<span>Delivery Tracking:</span>");

        $("div#idORDER_TRACKING [id^=idORDER_DETAILS_] tr.cart td").find("span").remove("span");

        $("div#idORDER_TRACKING [id^=idORDER_DETAILS_] tr.cart td:nth-child(1)").prepend("<span>Product Ref:</span>");
        $("div#idORDER_TRACKING [id^=idORDER_DETAILS_] tr.cart td:nth-child(2)").prepend("<span>Item:</span>");
        $("div#idORDER_TRACKING [id^=idORDER_DETAILS_] tr.cart td:nth-child(3)").prepend("<span>Qty Ordered:</span>");
        $("div#idORDER_TRACKING [id^=idORDER_DETAILS_] tr.cart td:nth-child(4)").prepend("<span>Qty Shipped:</span>");
        $("div#idORDER_TRACKING [id^=idORDER_DETAILS_] tr.cart td:nth-child(5)").prepend("<span>Cancelled:</span>");
        $("div#idORDER_TRACKING [id^=idORDER_DETAILS_] tr.cart td:nth-child(6)").prepend("<span>Qty Back Ordered:</span>");
        $("div#idORDER_TRACKING [id^=idORDER_DETAILS_] tr.cart td:nth-child(7)").prepend("<span>Total Value:</span>");

        $("div#idORDER_TRACKING [id^=idORDER_DETAILS_] tr td").each(function() {
            var $this = $(this);
            $this.html($this.html().replace(/&nbsp;/g, ''));
        });
    },

    /***************************************************************
     *
     * Function: orderHistoryDisplay  
     *
     * The Recent Orders form is hidden after a search, and displayed when the Lookup Again button is clicked.
     *
     ***************************************************************/

    orderHistoryDisplay: function() {

        $("#idLookupAgain").addClass("hide");
        $("#idLOOKUPORDERSFORM fieldset input[value='Lookup Order']").on("click", function() {
            $("#idLookupAgain").removeClass("hide");
            $("#idLOOKUPORDERSFORM").toggle();
            $("div#idLOOKUPORDERS > p:nth-child(2)").toggle();
        });

        if ($("#idORDER_TRACKING").length) {
            $("#idLookupAgain").removeClass("hide");
            $("#idLOOKUPORDERSFORM").toggle();
            $("div#idLOOKUPORDERS > p:nth-child(2)").toggle();
        }

        $("#idLookupAgain").on("click", function() {
            $("#idLookupAgain").addClass("hide");
            $("#idLOOKUPORDERSFORM").toggle();
            $("div#idLOOKUPORDERS > p:nth-child(2)").toggle();
        });
    },

    /***************************************************************
     *
     * Function: searchButton
     * Description: This function is used to set the content on the search results page to hide when in mobile so that the search
     * results are seen quicker. I have not put this in with the Menus function because although it uses the same code and classes
     * it's not in the menu area. 
     *
     ***************************************************************/

    searchButton: function() {
        // This command is to set the menuHide class to the main navigation on mobile.
        $("div #searchFields").addClass("menuHide");

        // This command is switches between the menuHide and menuShow classes on mobile as well as gives the main navigation a sliding animation.
        $("#searchButton").click(function(event) {
            $("div #searchFields").slideToggle("slow", function() {
                $("div #searchFields").toggleClass("menuHide").toggleClass("menuShow").removeAttr("style");
            });
        });
    },

    /***************************************************************
     *
     * Function: ie9
     * Description: This function is to help target IE9.
     *
     ***************************************************************/

    ie9: function() {
        /***************************************************************
         *
         * isIEVersion9 - Determines if the browser is IE9
         *
         * Returns: 	boolean true if IE9
         *
         ***************************************************************/
        function isIEVersion9() {
            var bIsIE9 = false; // Return value assumes not IE 9.
            if (navigator.appName == 'Microsoft Internet Explorer') {
                var ua = navigator.userAgent;
                var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
                if (re.exec(ua) != null) {
                    bIsIE9 = (parseFloat(RegExp.$1) == 9);
                }
            }
            return bIsIE9;
        }
        //
        // Set up CSS classes according to whether the browser is IE9
        //
        if (isIEVersion9()) // if it's IE9
        {
            $("body").addClass("IeOnly"); // add the class back in
        } else {
            //
            // Ensure that the IEOnly class isn't present
            //
            $("body").removeClass("IeOnly");
        }
    },

    /***************************************************************
     *
     * Function: android
     * Description: This function is to help target native Android browsers.
     *
     ***************************************************************/

    android: function() {
        $("body").removeClass("androidOnly");

        var nua = navigator.userAgent;
        var is_android = ((nua.indexOf('Mozilla/5.0') > -1 && nua.indexOf('Android ') > -1 && nua.indexOf('AppleWebKit') > -1) && !(nua.indexOf('Chrome') > -1));
        if (is_android) {
            $("body").addClass("androidOnly");
        }
    },

    /***************************************************************
     *
     * Function: setBrowserSizeListener
     *
     * Description: This function adds a listener to changes in browser size
     *
     ***************************************************************/

    m_nWindowWidth: 0, // current window width
    m_timerResizeID: 0, // ID of resize timer

    setBrowserSizeListener: function() {
        SD.Responsive.m_nWindowWidth = SD.Responsive.getBrowserWidth(); // record the original size
        //
        // We only trigger a redraw after a delay. That prevents lots of repositioning of elements if mouse dragging
        //
        $(window).resize(function() {
            //
            // Clear the timeout if it is current
            //
            if (SD.Responsive.m_timerResizeID != null) {
                window.clearTimeout(SD.Responsive.m_timerResizeID);
            }
            //
            // Start a new timeout to reposition elements
            //
            SD.Responsive.m_timerResizeID = window.setTimeout(SD.Responsive.resizeIfNeeded, 20); // anything is better than nothing to prevent too-rapid retest
        });
    },

    /***************************************************************
     *
     * Function: resizeIfNeeded 
     *
     * Description: called on timer to determine if browser window has actually changed size
     *
     ***************************************************************/

    resizeIfNeeded: function() {
        SD.Responsive.m_timerResizeID = null; // reload timer has fired; reset the ID
        //
        // If the width has changed, reposition elements
        //
        if (SD.Responsive.m_nWindowWidth != SD.Responsive.getBrowserWidth()) {
            SD.Responsive.m_nWindowWidth = SD.Responsive.getBrowserWidth(); // remember new width
            SD.Responsive.moveSizeDependentComponents(); // reposition elements that depend on size
        }
    },

    /***************************************************************
     *
     * Function: getBrowserWidth
     *
     * Description: get actual browser width as used by media queries
     *
     ***************************************************************/

    getBrowserWidth: function() {
        //
        // Get actual width as used by media queries
        // $(window).width() returned a value that was about 15 too low. Therefore when resizing
        // the filter move kicked in first before the media queries had changed to the mini menu.
        //
        // See http://stackoverflow.com/questions/9410088/how-do-i-get-innerwidth-in-internet-explorer-8 for origin of this
        //
        return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    },

    /***************************************************************
     *
     * Function: moveSizeDependentComponents
     *
     * Description: All functions that are dependent on the size of the screen must be in here
     *
     ***************************************************************/

    moveSizeDependentComponents: function() {
        SD.Responsive.moveMiniNavItems();
        SD.Responsive.menuAlignment();
    },

    /***************************************************************
     *
     * Function: moveMiniNavItems
     * Description: This function moves mini navigation items, only doing it when mini Nav visibility changes
     *
     ***************************************************************/
    //
    // Visibility of the mini Nav bar
    // Default to false so that no repositioning is done when loading in the desktop or wider browser
    // This means the navigation items stay where they are as per the standard layout.
    //
    m_bMiniNavVisible: false,

    moveMiniNavItems: function() {
        var bCurrentVisibility = $("div.miniNav").is(":visible");
        //
        // Reset the menus if the visibility has changed
        //
        if (SD.Responsive.m_bMiniNavVisible != bCurrentVisibility) {
            SD.Responsive.m_bMiniNavVisible = bCurrentVisibility; // remember current state
            if (SD.Responsive.m_bMiniNavVisible) {
                //
                // Move items into the mini navigation bar
                //
                $("#mega-menu").insertAfter(".mainNav");
                $("#brochure-menu").insertAfter(".mainNav");
                $("#quickSearchLeft").insertAfter(".quickSearchTitle");
                $("#shoppingCartSummaryLeft").insertAfter("#shoppingCartSummaryTitle");
                $("#productFiltersLeft").insertAfter(".productFiltersTitle");
                $("#infoBox").insertAfter("#infoBoxTitle");
                $("#storeSections").insertAfter("#storeSectionsTitle");
                $("#information").insertAfter("#informationTitle");
                $("#bestSellerLeft").insertAfter("#bestSellerTitle");
                $("#newProductLeft").insertAfter("#newProductTitle");
                $("#couponFieldLeft").insertAfter("#couponFieldTitle");
            } else {
                //
                // Move items back into normal position
                //
                $("#mega-menu").insertAfter(".miniNav");
                $("#brochure-menu").insertAfter(".miniNav");
                $("#couponFieldLeft").prependTo("#left-sidebar > .sidebar");
                $("#newProductLeft").prependTo("#left-sidebar > .sidebar");
                $("#bestSellerLeft").prependTo("#left-sidebar > .sidebar");
                $("#information").prependTo("#left-sidebar > .sidebar");
                $("#storeSections").prependTo("#left-sidebar > .sidebar");
                $("#infoBox").prependTo("#left-sidebar > .sidebar");
                $("#productFiltersLeft").prependTo("#left-sidebar > .sidebar");
                $("#shoppingCartSummaryLeft").prependTo("#left-sidebar > .sidebar");
                $("#quickSearchLeft").prependTo("#left-sidebar > .sidebar");
            }
        }
    },

    /***************************************************************
     *
     * Function: quantityButtons
     * Description: This function is to add the quantity buttons. 
     *
     ***************************************************************/

    quantityButtons: function() {
        //
        // Add increment and decrement buttons
        //
        $("fieldset.quantity-box input[type!='hidden']").before('<button type="button" class="dec quantityButton">-</button>').after('<button type="button" class="inc quantityButton">+</button>');
        //
        // Add click handler for increment/decrement
        //
        $(".quantityButton").on("click", function(evClick) {
            var elButton = $(evClick.delegateTarget);
            var elInput = elButton.parent().find("input");
            if (elInput && $.isNumeric(elInput.val())) {
                var nOldVal = parseInt(elInput.val(), 10);
                var nNewVal;

                if (elButton.hasClass("inc")) {
                    nNewVal = nOldVal + 1;
                } else {
                    nNewVal = (nOldVal > 0) ? nOldVal - 1 : 0; // Don't allow decrementing below zero
                }
                elInput.val(nNewVal);
                var evKeyup = $.Event("keyup");
                evKeyup.which = 16; // shift key
                elInput.trigger(evKeyup); // to trigger recalculation of total price
            }
        });
    },

    /***************************************************************
     *
     * Function: addNavigateOnClick 
     *
     * Add navigation to blocks if they contain anchor tags
     *
     ***************************************************************/

    addNavigateOnClick: function() {
        //
        // Make blocks with class navigateOnClick work.
        // Simply find the first anchor tag in the block and navigate to that.
        //
        $(".navigateOnClick").on("click", function(evClick) {
            var elContainer = $(evClick.target).closest(".navigateOnClick");
            var elFirstAnchor = $(elContainer).find("a").filter(":first");

            if (elFirstAnchor) {
                window.location.href = elFirstAnchor.attr("href");
            }
        });
    },

    /***************************************************************
     *
     * Function: removeDuplicatedInfo 
     *
     * This function is to remove any duplicated information.
     *
     ***************************************************************/

    removeDuplicatedInfo: function() {
        // This code looks for the mobileHeader that contains REF, and a proceeding .floatLeft.
        // if the .floatLeft contains &nbsp;, then the mobileHeader and the .floatLeft are removed. 
        $(".checkout-cart tr td.cart").each(function() {
            $(this).find(".mobileHeader:contains('REF') + .floatLeft:contains('\u00a0')").prev().remove();
            $(this).find(".floatLeft:contains('\u00a0')").remove();
        });
    },

    /***************************************************************
     *
     * Function: resizeImages 
     *
     * This function is to help resize images when larger images are
     * added.
     *
     ***************************************************************/

    resizeImages: function() {
        //
        // Do this after the page has fully loaded as we depend on getting the width of the images
        //
        $(window).load(function() {
            //
            // Setting the maximum width for product and section images in a section page
            // Note: width 100% makes image responsive across all browsers and in all locations; 
            // max-width has to be set according to the image to prevent it growing too big.
            //
            if (!window.pg_nSectionImageMaxWidth || window.pg_nSectionImageMaxWidth != 0) {
                $(".section-link-details .section-link-image img, .product-details .product-image img").each(function() {
                    var naturalWidth = $(this).prop("naturalWidth");
                    var nWidth = naturalWidth > window.pg_nSectionImageMaxWidth ? window.pg_nSectionImageMaxWidth : naturalWidth;
                    $(this).css({
                        "max-width": nWidth + "px",
                        "width": "100%"
                    });
                });
            }
            //
            // Setting the maximum width for product images in a product page
            //
            if (!window.pg_nProductImageMaxWidth || window.pg_nProductImageMaxWidth != 0) {
                $("#product-page-body form .product-image img").each(function() {
                    var naturalWidth = $(this).prop("naturalWidth");
                    var nWidth = naturalWidth > window.pg_nProductImageMaxWidth ? window.pg_nProductImageMaxWidth : naturalWidth;
                    $(this).css({
                        "max-width": nWidth + "px",
                        "width": "100%"
                    });
                });
            }
        });
    },

    /***************************************************************
     *
     * Function: menuAlignment 
     *
     * This function is set to align the second, third etc. menus.
     *
     ***************************************************************/

    m_bMainNavVisible: false,

    menuAlignment: function() {
        var bCurrentVisibility = $("div#mega-menu").is(":visible");

        if (SD.Responsive.m_bMainNavVisible != bCurrentVisibility) {
            SD.Responsive.m_bMainNavVisible = bCurrentVisibility;
            if (SD.Responsive.m_bMainNavVisible) {
                $("#mega-menu ul li a, #brochure-menu ul li a").css({
                    height: ""
                });
                var highestBox = 0;
                $("#mega-menu ul li, #brochure-menu ul li").each(function() {
                    if ($(this).height() > highestBox) {
                        highestBox = $(this).height();
                    }
                });
                $("#mega-menu ul li a, #brochure-menu ul li a").css({
                    height: highestBox + "px"
                });
                $("#mega-menu ul li ul > li a, #brochure-menu ul li ul > li a").css({
                    height: ""
                });
            } else {
                $("#mega-menu ul li a, #brochure-menu ul li a").removeAttr("style");
            }
        }
    }
};