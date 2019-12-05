/***************************************************************
 * 
 * ActinicExtras.js	-	additional utility functions
 *
 * Copyright (c) 2014 SellerDeck Limited
 *
 ****************************************************************/

var bDebug = false;
var bShowErrors = true;

var g_arrAJAX = []; // array of actions to pass to script
var g_mapAJAXArgs = {}; // map of parameters to pass to script
var g_mapAJAXResults = {}; // map of results from script
var g_mapDynPrices = {};
//
// Stock information - retained in page after initial download
//
var g_mapStockByRef = {}; // map of stock levels obtained from server
var g_bStockUpdateInProgress = false;
var g_bDynamicPriceUpdatePending = false;
var g_bChoicesUpdatePending = false;

//
// Dispatch table for actions
//
var g_mapAJAXActions = {
    'GetBreadcrumbTrail': SetBreadcrumbTrail
};

var PRICING_MODEL_COMPONENTS_SUM = 1;

/***********************************************************************
 *
 * AddAJAXCall - Add an ajax call to the list
 *
 * Input:	arguments	- first item is the action, rest are parameters to pass to the script
 *
 ************************************************************************/

function AddAJAXCall() {
    var sAction = arguments[0];
    g_arrAJAX.push(sAction); // add the action to the array
    for (var i = 1; i < arguments.length; i++) // make sure the rest of the arguments are only added once
    {
        if (!g_mapAJAXArgs[arguments[i]]) // not already added?
        {
            g_mapAJAXArgs[arguments[i]] = 1; // add the argument
        }
    }
}

/***********************************************************************
 *
 * AJAXCall - Make the ajax call and process the results
 *
 ************************************************************************/

function AJAXCall() {
    if (g_arrAJAX.length == 0) // if no actions, quit
    {
        return;
    }
    var ajaxRequest = new ajaxObject(g_sAJAXScriptURL);
    ajaxRequest.callback = function(responseText) {
        if (bDebug)
            alert(responseText);
        g_mapAJAXResults = responseText.parseJSON(); // parse the JSON
        if (g_mapAJAXResults.Error) // handle script error
        {
            if (bDebug)
                alert('Programming Error:' +
                    g_mapAJAXResults.Error);
        } else {
            ProcessAJAXResults(g_mapAJAXResults); // perform necessary action
        }
    }
    //
    // Add the parameters for the script
    //
    var sParams = 'ACTIONS=' + g_arrAJAX.join(',');
    for (var sArg in g_mapAJAXArgs) {
        if (sArg)
            sParams += '&' + sArg;
    }
    ajaxRequest.update(sParams, "GET");
}

/***********************************************************************
 *
 * ProcessAJAXResults - Process the results of an AJAX call
 *
 * Input: mapResults	- map of response JSON objects
 *
 ************************************************************************/

function ProcessAJAXResults(mapResults) {
    for (var sAction in mapResults) // for each action
    {
        if (g_mapAJAXActions[sAction]) // get JSON object
        {
            g_mapAJAXActions[sAction](mapResults[sAction]); // pass the object to appropriate function
        }
    }
}

/***********************************************************************
 *
 * AddAJAXBreadcrumbTrail - Add an ajax call to get the dynamic breadcrumb trail
 *
 * Input: sProdRef	- product reference
 *
 ************************************************************************/

function AddAJAXBreadcrumbTrail(sProdRef) {
    //
    // Get breadcrumb trail elements
    //
    var elemBreadcrumbsTop = document.getElementById('idBreadcrumbsTop');
    var elemBreadcrumbsBottom = document.getElementById('idBreadcrumbsBottom');
    if (!elemBreadcrumbsTop && !elemBreadcrumbsBottom) {
        return;
    }
    //
    // Return if no section links generated
    //
    var elemBreadcrumbs = elemBreadcrumbsTop || elemBreadcrumbsBottom;
    var collLinks = elemBreadcrumbs.getElementsByTagName('a');
    if (collLinks.length == 0) {
        return;
    }
    AdjustPageFileNameSIDAnchor() // adjust the section ID anchor
    //
    // Add the arguments for the call
    //
    var arrExtraArgs = [];
    if (document.location.href.match(/\bSID=(\d+)\b/)) {
        arrExtraArgs.push('SID=' + RegExp.$1); // add section ID
    } else {
        return; // no SID, leave bread crumbs as they are
    }
    //
    // Hide the elements
    //
    if (elemBreadcrumbsTop) {
        elemBreadcrumbsTop.style.visibility = 'hidden'; // hide top breadcrumb
    }
    if (elemBreadcrumbsBottom) {
        elemBreadcrumbsBottom.style.visibility = 'hidden'; // hide bottom breadcrumb
    }

    var elemLink = collLinks[0];
    if (elemLink.className.match(/\bajs-bc-home\b/)) // if home link is present
    {
        arrExtraArgs.push('ROOTCLASS=' + elemLink.className); // add the home link class
    }
    var collAll = GetAllElements(elemBreadcrumbs);
    for (var i = 0; i < collAll.length; i++) {
        if (collAll[i].className.match(/\bajs-bc-prod\b/)) // if the product element is present
        {
            arrExtraArgs.push('PRODCLASS=' + collAll[i].className); // add the class
            break;
        }
    }

    AddAJAXCall('GetBreadcrumbTrail', 'REF=' + encodeURIComponent(sProdRef), arrExtraArgs.join('&')); // add the call to the list
}

/***********************************************************************
 *
 * SetBreadcrumbTrail - Update the breadcrumb trails
 *
 * Input: oResp	- response JSON object
 *
 ************************************************************************/

function SetBreadcrumbTrail(oResp) {
    if (oResp.HTML) // if we got some HTML
    {
        var elemBreadcrumbsTop = document.getElementById('idBreadcrumbsTop');
        var elemBreadcrumbsBottom = document.getElementById('idBreadcrumbsBottom');
        var sHTML = decodeURIComponent(oResp.HTML); // decode it
        if (elemBreadcrumbsTop) // update top breadcrumb trail
        {
            elemBreadcrumbsTop.innerHTML = sHTML;
            elemBreadcrumbsTop.style.visibility = 'visible';
        }
        if (elemBreadcrumbsBottom) // update bottom breadcrumb trail
        {
            elemBreadcrumbsBottom.innerHTML = sHTML;
            elemBreadcrumbsBottom.style.visibility = 'visible';
        }
    }
    if (bDebug)
        alert('Breadcrumb Trail:' + (oResp.HTML || oResp.Error));
    if (bShowErrors && oResp.Error)
        alert('Breadcrumb Trail:' + oResp.Error);
}

/***********************************************************************
 *
 * AdjustPageFileNameSIDAnchor - Adjust the PAGEFILENAME value
 *
 ************************************************************************/

function AdjustPageFileNameSIDAnchor() {
    var elemInput = GetInputElement(document, 'PAGEFILENAME');
    if (!elemInput) {
        return;
    }
    var sSID = GetSIDAnchor(); // get the SID anchor
    if (sSID) // if present
    {
        elemInput.value = elemInput.value.replace(/#SID=\d+/, '#SID=' + sSID); // adjust the input value
        //
        // Need to make sure that the correct section ID is used for dynamic breadcrumb trail
        //
        var elemSID = GetInputElement(elemInput.form, 'SID');
        if (elemSID) {
            elemSID.value = sSID;
        }
    }
}

/***********************************************************************
 *
 * GetSIDAnchor - Get the section ID from URL anchor
 *
 * Returns:	string	- section ID or empty string
 *
 ************************************************************************/

function GetSIDAnchor() {
    var aSIDAnchor = document.location.href.split('#SID=');
    return (aSIDAnchor.length == 2) ? aSIDAnchor[1] : '';
}

/***********************************************************************
 *
 * AppendParentSection - Add the SID to the anchor
 *
 * Input:	elemLink	- <a> element
 *			nSID		- section ID
 *
 ************************************************************************/

function AppendParentSection(elemLink, nSID) {
    if (arguments.length == 1) // if nSID isn't supplied
    {
        var elemInput = GetInputElement(document, 'PAGE'); // only do this for product pages or search results for product pages
        if (!elemInput || elemInput.value != 'PRODUCT') {
            return;
        }
        //
        // Need to make sure that the correct section ID is used for dynamic breadcrumb trail
        //
        var elemSID = GetInputElement(elemInput.form, 'SID');
        if (elemSID) {
            nSID = elemSID.value;
        }
        if (elemLink.href.indexOf('?') > -1) // needs reviewing
        {
            elemLink.href += '&SID=' + nSID;
        }
        return;
    }
    elemLink.href += '#SID=' + nSID; // add an SID anchor to the link
}

/***********************************************************************
 *
 * getCartItem		-	Gets the Actinic Cart Value & No of Items
 *
 * Input: nIndex	-	Cart item index to retrieve
 *							1 = TOTAL_VALUE
 *							3 = CART_COUNT
 *
 * Returns:				Requested cart item or 0 (zero) if not found
 *
 ************************************************************************/

//CART_CONTENT = Cookie name
//1 = TOTAL_VALUE
//3 = CART_COUNT

var PASSWORD_MATCH_ERROR = "Passwords do not match.";

function getCartItem(nIndex) {
    var act_cart = getCookie("CART_CONTENT")
    var sTemp = (act_cart != null) ? sTemp = act_cart.split("\t") : 0;
    return (sTemp.length > 0) ? sTemp[nIndex] : 0;
}

/***********************************************************************
 *
 * GotoAnchor - JS for jumping to an anchor - some user agents don't handle
 *				anchors correctly if BASE HREF is present
 *
 * Input: 				sAnchor
 *
 * Returns:				nothing
 *
 ************************************************************************/

function GotoAnchor(sAnchor) {
    window.location.hash = sAnchor;
}

// The following block implements the string.parseJSON method
(function(s) {
    // This prototype has been adapted from https://github.com/douglascrockford/JSON-js/blob/master/json2.js.
    // Large comments have been removed - Hugh Gibson 7/12/2012
    // Original Authorship: Douglas Crockford
    // Augment String.prototype. We do this in an immediate anonymous function to
    // avoid defining global variables.
    s.parseJSON = function(filter) {
        try {
            if (typeof JSON === 'object') // if JSON is defined, use that
            {
                return JSON.parse(this, filter);
            }
            // otherwise use old parser
            var j;
            // Walk function to implement filtering if used
            function walk(holder, key) {
                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }
            // Replace certain Unicode characters with escape sequences.
            var text = String(this);
            var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function(a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            // Run the text against regular expressions that look for non-JSON patterns.
            if (/^[\],:{}\s]*$/
                .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                    .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                    .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                // Use the eval function to compile the text
                j = eval('(' + text + ')');
                // Optionally recursively walk the new structure, passing
                // each name/value pair to a reviver function for possible transformation.
                return typeof reviver === 'function' ?
                    walk({
                        '': j
                    }, '') :
                    j;
            }
        } catch (e) {
            // Fall through if the regexp test fails.
        }
        // If the text is not JSON parseable, then a SyntaxError is thrown.
        throw new SyntaxError("parseJSON");
    };
})(String.prototype);
// End public domain parseJSON block


/***********************************************************************
 *
 * ajaxObject - ajax communication library
 *
 * Input: 		url 				- the url of the json provider
 *			callbackFunction 	- what function to call after communication
 *
 * Returns:				nothing
 *
 ************************************************************************/

function ajaxObject(url, callbackFunction) {
    if (url.match(/^https?:/)) {
        //
        // Adjust the URL to match the document protocol
        //
        var sDocProto = document.location.protocol;
        var sURLProto = url.split('//')[0];
        if (sURLProto != sDocProto) {
            url = url.replace(new RegExp('^' + sURLProto), sDocProto);
        }
        //
        // Adjust the URL to match the top-level domain
        //
        var sURLHost = url.split('//')[1].split('/')[0];
        if (sURLHost != document.location.host) {
            url = url.replace(sURLHost, document.location.host);
        }
    }
    var that = this;
    this.updating = false;
    this.abort = function() {
        if (that.updating) {
            that.updating = false;
            that.AJAX.abort();
            that.AJAX = null;
        }
    }
    this.update = function(passData, postMethod, bAsync) {
        bAsync = (typeof(bAsync) !== 'undefined' ? bAsync : true);
        if (that.updating) {
            return false;
        }
        that.AJAX = null;
        if (window.XMLHttpRequest) {
            that.AJAX = new XMLHttpRequest();
        } else {
            that.AJAX = new ActiveXObject("Microsoft.XMLHTTP");
        }
        if (that.AJAX == null) {
            return false;
        } else {
            that.AJAX.onreadystatechange = function() {
                if (that.AJAX.readyState == 4) {
                    that.updating = false;
                    that.callback(that.AJAX.responseText, that.AJAX.status, that.AJAX.responseXML);
                    that.AJAX = null;
                }
            }
            that.updating = new Date();
            if (/post/i.test(postMethod)) {
                var uri = urlCall; // POST is never cached so no need to add random data; it breaks PERL parsing of POST params anyway
                that.AJAX.open("POST", uri, bAsync);
                that.AJAX.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                that.AJAX.send(passData); // Content-length is provided by the browser
            } else {
                var uri = urlCall + '?' + ((passData == '') ? '' : (passData + '&')) + 'timestamp=' + (that.updating.getTime());
                that.AJAX.open("GET", uri, bAsync);
                that.AJAX.send(null);
            }
            return true;
        }
    }
    var urlCall = url;
    this.callback = callbackFunction || function() {};
}

/***********************************************************************
 *
 * getStockNodes - Get the nodes of the DOM tree where nodes are used to  
 *		dynamic stock display. These tags are marked with "ActinicRTS" class
 *		
 * Output: array of elements matching the above criteria
 *
 ************************************************************************/

function getStockNodes() {
    var arrOut = new Array();

    if (document.evaluate) {
        var xpathString = "//*[@class='ActinicRTS']"
        var xpathResult = document.evaluate(xpathString, document, null, 0, null);
        while ((arrOut[arrOut.length] = xpathResult.iterateNext())) {}
        arrOut.pop();
    } else if (document.getElementsByTagName) {
        var aEl = document.getElementsByTagName('*');
        for (var i = 0, j = aEl.length; i < j; i += 1) {
            if (aEl[i].className == 'ActinicRTS') {
                arrOut.push(aEl[i]);
            };
        };
    };
    return arrOut;
}

/***********************************************************************
 *
 * getProductStock - Gets the stock for a single product
 *
 * Input:	sURL	- the ajax script URL to call
 *		sProdRef - product reference
 *		sStock	- stock level (used for preview)
 *		sShopID	- the shop ID (only used in host mode)
 *
 ************************************************************************/

function getProductStock(sURL, sProdRef, sStock, sShopID) {
    return getStock(sURL, null, sProdRef, sStock, sShopID);
}

/***********************************************************************
 *
 * getSectionStock - Gets the stock for products in a section
 *
 * Input:	sURL - the ajax script URL to call
 *		sSID - the section ID list to be passed in to the ajax script
 *		sProdRefs - list of the products with stock monitoring on in this section
 *		sStockList - the stock level of the products in the list above
 *		sShopID - the shop ID (only used in host mode)
 *
 ************************************************************************/

function getSectionStock(sURL, sSID, sProdRefs, sStockList, sShopID) {
    return getStock(sURL, sSID, sProdRefs, sStockList, sShopID)
}

/***********************************************************************
 *
 * getStock - Call our server script to determine the real time stock levels 
 *	of the products in the given section
 *	When the page is previewed from the desktop (within EC) we do not want to make
 *	server calls for RTS levels. Therefore in this case we are passing in the 
 *	list of stock monitored products and their offline stock level in sProdRefs and
 *	sStockList parameters.
 *
 * Input:	sURL - the ajax script URL to call
 *		sSID - the section ID list to be passed in to the ajax script or null if for a single product
 *		sProdRefs - list of the products with stock monitoring on in this section or a single product refence
 *		sStockList - the stock level of the products in the list above
 *		sShopID - the shop ID (only used in host mode)
 *
 ************************************************************************/

function getStock(sURL, sSID, sProdRefs, sStockList, sShopID) {
    //
    // In case of preview use passed in data
    //
    if (sURL.indexOf("file://") == 0) {
        var arrProds = sProdRefs.split("|");
        var arrStock = sStockList.split("|");
        for (var i = 0; i < arrProds.length; i++) {
            var aRef = arrProds[i].split("!");
            var sKey = aRef[aRef.length - 1];
            g_mapStockByRef[sKey] = arrStock[i];
        }
        updateStockDisplay(g_mapStockByRef, true);
    } else {
        g_bStockUpdateInProgress = true;
        var ajaxRequest = new ajaxObject(sURL);
        ajaxRequest.callback = function(responseText) {
            if (responseText.match(/^-?\d+$/)) // if response is a number
            {
                g_mapStockByRef[sProdRefs] = responseText; // assume this is for a single product
            } else if (responseText) // otherwise
            {
                g_mapStockByRef = responseText.parseJSON(); // parse response as JSON
            }
            updateStockDisplay(g_mapStockByRef, true);
            g_bStockUpdateInProgress = false;
            //
            // update dynamic prices if the process is still pending
            //
            if (g_bDynamicPriceUpdatePending &&
                g_sDynamicPriceURL !== '') {
                if (sSID == undefined) {
                    var sSectionID = GetSIDAnchor();
                    if ("" == sSectionID) {
                        var elemInput = GetInputElement(document, 'PAGE'); // only do this for product pages
                        if (elemInput &&
                            ('PRODUCT' == elemInput.value)) {
                            var elemSID = GetInputElement(elemInput.form, 'SID');
                            if (elemSID) {
                                sSectionID = elemSID.value;
                            }
                        }
                    }
                    if (sSectionID) {
                        getAllDynamicPrices(g_sDynamicPriceURL, sSectionID, sShopID);
                    }
                } else {
                    getAllDynamicPrices(g_sDynamicPriceURL, sSID, sShopID);
                }
            }
            //
            // update choices if the process is still pending
            //
            else if (g_bChoicesUpdatePending) {
                SetupChoicesAllProducts(sURL, sSID, sShopID);
                g_bChoicesUpdatePending = false;
            }
        }
        //
        // If we don't supply a section ID, assume this is for a single product
        //
        var sParams = (sSID != null) ?
            ("ACTION=GETSECTIONSTOCK&SID=" + sSID) :
            ("ACTION=GETSTOCK&REF=" + encodeURIComponent(sProdRefs));
        if (sSID == null && nAssocProdRefSID > 0) // if we want associated product stock
        {
            sParams += '&SID=' + nAssocProdRefSID; // supply the section ID
        }
        if (sShopID) {
            sParams += '&SHOP=' + sShopID;
        }
        ajaxRequest.update(sParams, "GET");
    }
}

/***********************************************************************
 *
 * updateStockDisplay - dynamically update the DOM tree depending on stock levels
 *
 * This is called on initial page load, and then after a selection is changed.
 * In that case we don't want to change the selection that the user has just made,
 * so the bUpdateSelection parameter is false.
 *
 * Input:	mapStockByRef		- product ref to stock level map
 *			bUpdateSelection	- true if selections are to be updated
 *
 ************************************************************************/

function updateStockDisplay(mapStockByRef, bUpdateSelection) {
    //
    // Detect which components don't have any in-stock choices and either
    // prevent the component being selected or prevent parent being added to the cart
    //
    var mapOOSComps = {};
    var reRTS = /\brts_([^_]+)_/;
    var reChk = /\bchk_(v_[^_]+_\d+)_/;
    //
    // Start with choices in dropdowns
    //
    var arrSelect = document.getElementsByTagName('SELECT');
    for (var i = 0; i < arrSelect.length; i++) {
        var elemSelect = arrSelect[i];
        if (elemSelect.name.indexOf('v_') != 0) // skip any non-attribute dropdowns eg date fields
        {
            continue;
        }
        //
        // Try and detect the optional element if present
        //
        var elemOptional = null;
        var oMatch = elemSelect.className.match(reChk);
        if (oMatch)
            elemOptional = document.getElementsByName(oMatch[1])[0];
        var nInStockChoices = 0;
        var bSelectedByDefault = false;
        var bSelectNextChoice = false;
        for (var o = 0; o < elemSelect.options.length; o++) // go through option in dropdown
        {
            var oOpt = elemSelect.options[o];
            if (oOpt.value == "" || oOpt.value == -1) {
                elemOptional = oOpt; // the optional ui is part of the dropdown
                bSelectedByDefault = !elemOptional.selected;
            }
            var sClass = oOpt.className;
            var oMatch = sClass.match(reRTS);
            if (oMatch) // does this have an associated product?
            {
                var sRef = oMatch[1]; // save assoc product reference
                if (mapStockByRef[sRef] != undefined && // if we have a stock level
                    mapStockByRef[sRef] <= 0) // and it is out of stock
                {
                    oOpt.disabled = true; // disable the option
                    if (oOpt.selected) // currently selected?
                    {
                        oOpt.selected = false; // deselect it
                        bSelectNextChoice = true; // set the flag to select next valid choice
                    }
                } else {
                    oOpt.disabled = false;
                    nInStockChoices++; // increment in-stock choices
                    if (nInStockChoices == 1 && // first valid choice? and
                        (bSelectNextChoice ||
                            bUpdateSelection)) // changing selection
                    {
                        oOpt.selected = true; // select it
                    }
                }
            } else if (oOpt.value > 0) // if this is a real choice
            {
                nInStockChoices++; // increment count
                if (nInStockChoices == 1 && // first choice?
                    bUpdateSelection) // and updating selection?
                {
                    oOpt.selected = true; // select it
                }
            }
        }
        if (nInStockChoices == 0 || // no in-stock choices?
            (elemOptional && // or optional component and
                !bSelectedByDefault)) // we don't want to select a valid option
        {
            if (elemOptional && // if component is optional and
                (elemOptional.tagName == 'INPUT' || // it's a checkbox allowing item to be chosen or not or
                    elemOptional.value == -1)) // it's an option and value is -1 indicating "None" as an acceptable choice
            {
                if (elemOptional.tagName == 'OPTION') // optional element is an option?
                {
                    if (bUpdateSelection) // if updating selection
                    {
                        elemOptional.selected = true; // select it
                    }
                } else if (nInStockChoices == 0) // no in-stock options for this component
                {
                    elemOptional.checked = false; // uncheck optional checkbox
                    elemOptional.disabled = true; // prevent user input
                }
            } else if (elemOptional && // otherwise component is not optional - but is there a "Please Select" item there?
                elemOptional.value == "" &&
                nInStockChoices > 0) // and there's some stock
            {
                if (elemOptional.tagName == 'OPTION' && // optional element is an option?
                    bUpdateSelection) // and updating selection
                {
                    elemOptional.selected = true; // select it
                }
            } else {
                var sParentProd =
                    elemSelect.name.match(/^v_([^_]+)_/)[1];
                mapOOSComps[sParentProd] = 1; // mark parent product as out of stock

                if ((nInStockChoices == 0) &&
                    (elemSelect.options.length > 0)) {
                    //
                    // ensure out stock choices are shown in the drop down list
                    //
                    if ((typeof(elemSelect.options[0]) != 'undefined') &&
                        (elemSelect.options[0].tagName == 'OPTION')) {
                        elemSelect.options[0].selected = true;
                    }
                }
            }
        }
    }
    //
    // Now handle radio and push buttons
    //
    var mapRBGroups = {};
    var mapOptComp = {};
    var arrInput = document.getElementsByTagName('INPUT');
    for (var i = 0; i < arrInput.length; i++) {
        var bSelectedByDefault = false;
        var elemInput = arrInput[i];
        //
        // Detect any optional checkboxes
        //
        if (elemInput.type == 'checkbox') {
            var oRef = elemInput.name.match(/^v_([^_]+)/);
            if (oRef) {
                mapOptComp['_' + oRef[1]] = elemInput;
            }
            bSelectedByDefault = elemInput.checked; // remember if it was checked by default
        }
        //
        // Check class name for associated prod refs
        //
        var oMatch = elemInput.className.match(reRTS);
        if (oMatch) {
            var sName = elemInput.name; // get cgi name of element
            if (!mapRBGroups[sName]) // if this is first time we've hit this name
            {
                //
                // Try and get the optional element
                //
                var elemOptional = elemInput.type == 'checkbox' ? elemInput : null; // if this is a checkbox, this is the optional element
                oMatch = elemInput.className.match(reChk);
                if (oMatch) // if optional element is in the class name
                    elemOptional = document.getElementsByName(oMatch[1])[0]; // save it
                if (!elemOptional && mapOptComp[sName]) // is it in our map?
                    elemOptional = mapOptComp[sName]; // save it
                var nInStockChoices = 0;
                //
                // Go though all elements with this name
                //
                var collNames = document.getElementsByName(sName);
                for (var n = 0; n < collNames.length; n++) {
                    var elemName = collNames[n];
                    if (elemName.value == -1)
                        elemOptional = elemName; // optional element is a radio button
                    oMatch = elemName.className.match(reRTS);
                    if (oMatch) // if this has an associated product
                    {
                        var sRef = oMatch[1]; // save product ref
                        if (mapStockByRef[sRef] != undefined && // if we have a stock level
                            mapStockByRef[sRef] <= 0) // and it's out of stock
                        {
                            elemName.disabled = true; // disable choice
                            if (elemName.type == 'submit') {
                                elemName.parentNode.style.display = 'none';
                            }
                        } else // in stock or no stock level?
                        {
                            elemName.disabled = false;
                            nInStockChoices++; // increment in-stock choices
                            if (nInStockChoices == 1 && // first choice?
                                bUpdateSelection && // and updating selection?
                                bSelectedByDefault) {
                                elemName.checked = true; // select it
                            }
                        }
                    } else if (elemName.type == 'submit' || // if this is a push-button
                        elemName.value > 0) // or a real choice
                    {
                        elemName.disabled = false;
                        nInStockChoices++; // increment in-stock choices
                        if (nInStockChoices == 1 && // first choice?
                            bUpdateSelection) // and updating selection?
                        {
                            elemName.checked = true; // select it
                        }
                    }
                }
                if (!nInStockChoices) // handle no in-stock choices
                {
                    if (elemOptional) // optional component?
                    {
                        if (elemOptional.type == 'radio') // if radio button optional element
                        {
                            if (bUpdateSelection) // updating selection?
                            {
                                elemOptional.checked = true; // select it
                            }
                        } else {
                            if (bUpdateSelection) // updating selection?
                            {
                                elemOptional.checked = false; // uncheck optional checkbox
                            }
                            elemOptional.disabled = true;
                        }
                    } else {
                        var sParentProd = sName.indexOf('_') == 0 ?
                            sName.substr(1) : // for push buttons
                            sName.match(/^v_([^_]+)_/)[1]; // for radio buttons
                        mapOOSComps[sParentProd] = 1; // mark parent product as out of stock
                    }
                }
                mapRBGroups[sName] = 1; // mark name as processed
            }
        }
    }

    //
    // For each product reference set the stock level and enable/disable 
    // the controlling DIV tags in the page source
    //
    var arrStockElems = getStockNodes();

    for (var nIndex = 0; nIndex < arrStockElems.length; nIndex++) {
        var aRef = arrStockElems[nIndex].id.split("_");
        var sProdRef = aRef[aRef.length - 1];
        //
        // Double-check each product if it's an assembly product and has mandatory components
        // bound to associated products with a stock level not enough for a single pack
        //
        var oProd = GetProductFromMap(sProdRef);
        var nAssemblyStock = -1;
        if (oProd &&
            oProd.bAssemblyProduct) {
            if (oProd.arrComps) {
                for (var i = 0; i < oProd.arrComps.length; i++) {
                    var oComp = oProd.arrComps[i];
                    var nQ = oComp.nQ ? oComp.nQ : 1; // default the quantity used to one if not set
                    if (null == mapStockByRef[oComp.sAsscProdRef] || // no stock level so no stock control for this component
                        oComp.bOpt) // or an optional component so we don't care when displaying the stock level on the page
                    {
                        continue;
                    }
                    if (!mapOOSComps[sProdRef] &&
                        !oComp.bOpt &&
                        oComp.sAsscProdRef != null &&
                        nQ > mapStockByRef[oComp.sAsscProdRef]) {
                        mapOOSComps[sProdRef] = 1; // at least one of the components has less in stock than the quantity used					
                    }
                    var nCompMaxStock = Math.floor(mapStockByRef[oComp.sAsscProdRef] / nQ); // max orderable from this component
                    nAssemblyStock = (-1 == nAssemblyStock) ? nCompMaxStock : (Math.min(nAssemblyStock, nCompMaxStock));
                }
            }
            if (-1 == nAssemblyStock) {
                mapOOSComps[sProdRef] = 1; // no stock control used for any of the associated products, so the stock is zero
            }
        }
        var sIDStart = aRef[0];
        if (mapStockByRef[sProdRef] != null) {
            //
            // The stock level
            //
            if (sIDStart == 'StockLevel') {
                if (oProd &&
                    oProd.bAssemblyProduct && // ignore main product stock if an assembly product
                    nAssemblyStock > -1) {
                    arrStockElems[nIndex].innerHTML = nAssemblyStock;
                } else {
                    arrStockElems[nIndex].innerHTML = mapStockByRef[sProdRef];
                }
            }
            //
            // Out of stock
            //
            if (sIDStart == 'EnableIfOutOfStock') {
                if (((mapStockByRef[sProdRef] <= 0) && !(oProd && oProd.bAssemblyProduct)) || // ignore parent out of stock if an assembly product
                    mapOOSComps[sProdRef]) {
                    arrStockElems[nIndex].style.visibility = "visible";
                    arrStockElems[nIndex].style.display = "inline";
                    var elemQty = GetElementByName('Q_' + sProdRef);
                    if (elemQty) {
                        elemQty.value = 0;
                        elemQty.disabled = true;
                    }
                } else {
                    arrStockElems[nIndex].style.visibility = "hidden";
                    arrStockElems[nIndex].style.display = "none";
                }
            }

            if (sIDStart == 'RemoveIfOutOfStock') {
                if (((mapStockByRef[sProdRef] <= 0) && !(oProd && oProd.bAssemblyProduct)) || // ignore parent out of stock if an assembly product
                    mapOOSComps[sProdRef]) {
                    arrStockElems[nIndex].innerHTML = "";
                }
            }
            //
            // In stock
            //
            if (sIDStart == 'EnableIfInStock') {
                if (mapStockByRef[sProdRef] > 0 && !mapOOSComps[sProdRef]) {
                    arrStockElems[nIndex].style.visibility = "visible";
                    arrStockElems[nIndex].style.display = "inline";
                } else {
                    arrStockElems[nIndex].style.visibility = "hidden";
                    arrStockElems[nIndex].style.display = "none";
                }
            }
            if (sIDStart == 'RemoveIfInStock') {
                if (mapStockByRef[sProdRef] > 0 && !mapOOSComps[sProdRef]) {
                    arrStockElems[nIndex].innerHTML = "";
                }
            }
            //
            // Generic flag to indicate ajax call went fine
            //
            if (sIDStart == 'EnableIfStockOk') {
                arrStockElems[nIndex].style.visibility = "visible";
                arrStockElems[nIndex].style.display = "inline";
            }
        }
    }
}

/***********************************************************************
 *
 * DisableOOSComponents - Ensure out of stock components can't be added to the cart
 *
 * This is used to clean up the generated html to prevent optional components being added
 * or prevent add to cart being added
 *
 * Input:	sAttrName		- CGI name of the attribute
 *			sOptCompName	- CGI name of the optional component element if present
 *
 ************************************************************************/

function DisableOOSComponents(sAttrName, sOptCompName) {
    var collName = document.getElementsByName(sAttrName); // get elements for this name
    for (var i = 0; i < collName.length; i++) {
        var elemName = collName[i];
        if (elemName.tagName == 'SELECT') // if this is a dropdown
        {
            if (elemName.options.length == 0) // with no options?
            {
                HandleAllChoicesOutOfStock(sAttrName, sOptCompName); // handle no in stock choices
            } else if (elemName.options.length == 1) // or if we have a single choice
            {
                if (elemName.options[0].value == -1) // and it is 'None'
                {
                    elemName.options[0].selected = true; // ensure selected
                } else if (!elemName.options[0].value) // single 'Please select' choice
                {
                    elemName.options[0].selected = false;
                    HandleAllChoicesOutOfStock(sAttrName, sOptCompName); // handle no in stock choices
                }
            }
        } else if (collName.length == 1) // if single radio button
        {
            if (elemName.value == -1) // 'None' choice?
            {
                elemName.checked = true; // select it
            } else if (!elemName.value) // 'Please select' choice?
            {
                elemName.disabled = true;
                HandleAllChoicesOutOfStock(sAttrName, sOptCompName); // handle no in stock choices
            }

        }
    }

    if (collName.length == 0) // no radio or push buttons
    {
        HandleAllChoicesOutOfStock(sAttrName, sOptCompName); // handle no in stock choices
    }
}

/***********************************************************************
 *
 * HandleAllChoicesOutOfStock - Ensure an out of stock component can't be added to the cart
 *
 * Either ensure optional checkbox is unchecked or add to cart is disabled
 *
 * Input:	sAttrName		- CGI name of the attribute
 *			sOptCompName	- CGI name of the optional component element if present
 *
 ************************************************************************/

function HandleAllChoicesOutOfStock(sAttrName, sOptCompName) {
    if (sOptCompName) // if we have a checkbox
    {
        var elemOpt = GetElementByName(sOptCompName); // get element
        elemOpt.checked = false; // uncheck it
        elemOpt.disabled = true; // prevent user changing it
    } else {
        DisableAddToCart(sAttrName); // hide add to cart for non-optional components
    }
}

/***********************************************************************
 *
 * DisableAddToCart - Disable the add to cart button for an out of stock component
 *
 * Input:	sAttrName		- CGI name of the attribute
 *
 ************************************************************************/

function DisableAddToCart(sAttrName) {
    var oMatch = sAttrName.match(/v_([^_]+)_/); // try and get product ref from the name
    if (!oMatch) {
        return;
    }
    var sProdRef = oMatch[1];
    //
    // Disable the quantity field so single add to cart can't be used
    //
    var elemQty = GetElementByName('Q_' + sProdRef);
    if (elemQty) {
        elemQty.value = 0;
        elemQty.disabled = true;
    }
    //
    // Now handle RTS elements if they are present
    //
    var elemStock = document.getElementById('EnableIfOutOfStock_' + sProdRef);
    if (elemStock) {
        elemStock.style.visibility = "visible";
        elemStock.style.display = "inline";
    }

    elemStock = document.getElementById('RemoveIfOutOfStock_' + sProdRef);
    if (elemStock) {
        elemStock.innerHTML = '';
    }

    elemStock = document.getElementById('EnableIfInStock_' + sProdRef);
    if (elemStock) {
        elemStock.style.visibility = "hidden";
        elemStock.style.display = "";
    }
}

/***********************************************************************
 *
 * GetElementByName - Get the first element with a name
 *
 * Input:	sName 	- name of the element
 *
 * Returns:	first element or null if missing
 *
 ************************************************************************/

function GetElementByName(sName) {
    var collName = document.getElementsByName(sName);
    return (collName.length == 0) ? null : collName[0];
}

/***********************************************************************
 *
 * AttachEvent - Cross browser attachEvent function
 *
 * Input:	obj 			- object which event is to be attached
 *		eventName 	- name of the event to listen
 *		eventHandler	- the function to attach to the event
 *
 ************************************************************************/

function AttachEvent(obj, eventName, eventHandler) {
    if (obj) {
        if (eventName.substring(0, 2) == "on") {
            eventName = eventName.substring(2, eventName.length);
        }
        if (obj.addEventListener) {
            obj.addEventListener(eventName, eventHandler, false);
        } else if (obj.attachEvent) {
            obj.attachEvent("on" + eventName, eventHandler);
        }
    }
}

/***********************************************************************
 *
 * ValidateCartNameDetails - Validate the cart name and password for saving
 *
 * Returns:	true if data is OK
 *
 ************************************************************************/

function ValidateCartNameDetails() {
    if (document.location.href.indexOf('SID=') > -1) // TODO: move this to a better named function
    {
        document.location.href.match(/\bSID=(\d+)/); // deduce section ID
        var sSID = RegExp.$1;
        var elemBuyNow = GetInputElement(document, 'ACTION_BUYNOW'); // cart should always have this
        var elemForm = elemBuyNow.form; // got the form

        var elemSID = GetInputElement(elemForm, 'SID'); // see if there is an SID element in the form
        if (!elemSID) // no element so...
        {
            elemSID = document.createElement('INPUT'); // create an element for the SID
            elemSID.type = 'hidden';
            elemSID.name = 'SID';
            elemForm.appendChild(elemSID); // add it to the form
        }
        elemSID.value = sSID;
    }

    var elemDiv = document.getElementById("idRowCartNamePassword");
    if (!elemDiv) {
        return true;
    }
    if (elemDiv.style.display == "none") {
        elemDiv.style.display = "";
        return (false);
    }
    var elemInput = document.getElementById("idCartName");
    if (elemInput.value == '') {
        alert('Username must be filled in');
        return false;
    }
    elemInput = document.getElementById("idCartPassword");
    if (elemInput.value == '') {
        alert('Password must be filled in');
        return false;
    }
    return true;
}

/***********************************************************************
 *
 * DeliveryCountryChanged - Handler for dynamic delivery state selection
 *
 ************************************************************************/

function DeliveryCountryChanged() {
    CountryChanged('Delivery');
}

/***********************************************************************
 *
 * InvoiceCountryChanged - Handler for dynamic invoice state selection
 *
 ************************************************************************/

function InvoiceCountryChanged() {
    CountryChanged('Invoice');
}

/***********************************************************************
 *
 * CountryChanged - Handler for dynamic state selection
 *
 * Input:	sLocationType	- 'Invoice' or 'Delivery'
 *
 ************************************************************************/

function CountryChanged(sLocationType) {
    //
    // Get appropriate country select element
    //
    var cmbCountry = document.getElementById('lst' + sLocationType + 'Country');
    //
    // Get appropriate state/region select element
    //
    var cmbState = document.getElementById('lst' + sLocationType + 'Region');
    if (!cmbCountry) {
        if (cmbState) {
            cmbState.style.display = "none"; // hide state select			
        }
        return;
    }
    SetCountryTextFieldDisplay(sLocationType, '');

    if (!cmbState || !cmbState.options) {
        return;
    }
    //
    // Get appropriate state/region text element
    //
    var editState = document.getElementById('id' + sLocationType + 'RegionEdit');
    var sStateName = editState ? editState.value : '';
    //
    // Save current state value
    //
    var sCurrentState = cmbState.value;
    cmbState.options.length = 1; // clear the state select options
    if (cmbCountry.value == "UndefinedRegion") // if no country is selected
    {
        cmbState.style.display = "none"; // hide state select
        if (editState) {
            editState.style.display = "";
        }
        return;
    }
    var chkSeparateShip = document.getElementById("idSEPARATESHIP");
    var bSeparateShip = chkSeparateShip && chkSeparateShip.checked;
    //
    // Get the js country state map
    //
    var mapCountries = (sLocationType == 'Delivery') ?
        g_mapDeliveryCountryStateMap :
        g_mapInvoiceCountryStateMap;
    //
    // Get states from the map
    //
    var arrOptions = mapCountries[cmbCountry.value];
    if (!arrOptions &&
        sLocationType == 'Invoice' &&
        !bSeparateShip &&
        g_mapDeliveryCountryStateMap[cmbCountry.value]) {
        arrOptions = g_mapDeliveryCountryStateMap[cmbCountry.value];
    }
    if (!arrOptions) // if there are no states
    {
        cmbState.style.display = "none"; // hide state select
        if (editState) {
            editState.style.display = "";
        }
        return;
    }
    cmbState.style.display = ""; // show the state select
    if (editState) {
        editState.style.display = "none";
    }
    var bFound = false;
    for (var i = 0; i < arrOptions.length; i += 2) // go through state data
    {
        var oOption = document.createElement("OPTION"); // create an option
        oOption.text = arrOptions[i + 1]; // set state name
        oOption.value = arrOptions[i]; // set state code
        if (oOption.value == sCurrentState || // is this our current value?
            oOption.text == sStateName) // or it matches the text field
        {
            bFound = true; // mark as selected
            sCurrentState = oOption.value;
            oOption.selected = true;
        }
        cmbState.options.add(oOption); // add option to select element
    }
    if (bFound) {
        cmbState.value = sCurrentState; // restore current selection
    }
}

/***********************************************************************
 *
 * SetCountryTextFieldDisplay - Set display of country text field
 *
 * Input:	sLocationType	- 'Invoice' or 'Delivery'
 *			sDisplay			- '' to display or 'none' to hide
 *
 ************************************************************************/

function SetCountryTextFieldDisplay(sLocationType, sDisplay) {
    var sTextID = (sLocationType == 'Delivery') ?
        'idDELIVERCOUNTRYText' :
        'idINVOICECOUNTRYText';
    var elemCountryText = document.getElementById(sTextID);
    if (elemCountryText) {
        //
        // Get appropriate country select element
        //
        var cmbCountry = document.getElementById('lst' + sLocationType + 'Country');
        elemCountryText.style.display = (cmbCountry && cmbCountry.value == '---') ? sDisplay : 'none';
    }
}

/***********************************************************************
 *
 * SetDeliveryAddressVisibility - Handler for showing or hiding delivery address fields
 *
 ************************************************************************/

function SetDeliveryAddressVisibility() {
    if (document.getElementById("idInvoiceRule") || document.getElementById("idDeliveryRule")) {
        SetAccountAddressVisibility();
        return;
    }
    var bResponsive = SD.Responsive.getResponsiveDeliveryFields();
    SetInvoiceCountries();
    var bDisplay = IsElementChecked("idSEPARATESHIP")
    if (bResponsive) {
        //
        // Hide or show delivery field divs
        //
        $("#idBothAddressesTable #idDeliverHeader").toggle(bDisplay);
        $("#idBothAddressesTable > > .DeliverField:not(#idSeparateShipRow)").toggle(bDisplay);
        //
        // If we aren't showing the delivery fields, make the invoice field wider
        //
        $("#idBothAddressesTable > > .InvoiceField:not(#idSeparateShipRow)").toggleClass("wideInput", !bDisplay);
    } else {
        //
        // Set width of separate ship cell to cover full table
        //
        $("#idSeparateShipCell").attr('colSpan', $("#idDeliverHeader").length && bDisplay ? 2 : 1);
        //
        // Hide or show delivery fields as required
        //
        $("#idBothAddressesTable > > tr > td.DeliverField").toggle(bDisplay);
    }
    //
    // Hide residential flag for Invoice address if delivery address shown
    //
    $("#idINVOICERESIDENTIAL").toggle(!bDisplay);
    InvoiceCountryChanged();
}

/***********************************************************************
 *
 * SetAccountAddressVisibility - Handler for showing or hiding delivery address fields
 *
 ************************************************************************/

function SetAccountAddressVisibility() {
    var bResponsive = SD.Responsive.getResponsiveDeliveryFields();

    /***********************************************************************
     *
     * SetAddressesTableCellsChildDisplay - Show or hide cell's children in addresses table based on cell class name
     *
     * Input:	sClassName		- class name of cells to show or hide
     *			bDisplay			- show or hide
     *			bBothDisplayed	- are both sets of fields being displayed?
     *
     ************************************************************************/

    var SetAddressesTableCellsChildDisplay = function(sClassName, bDisplay, bBothDisplayed) {
        if (bResponsive) {
            $("#idBothAddressesTable >") // select fieldset
                .children("." + sClassName) // children of the given class - should all be divs
                .filter("div:not(#idInvoiceAccountAddresses, #idDeliverAccountAddresses, #idSeparateShipRow)") // field divs only
                .toggle(bDisplay) // hide or show
                .toggleClass("wideInput", bDisplay && !bBothDisplayed); // add wideInput if we are showing this field and not both fields are displayed
        } else {
            $("#idBothAddressesTable tr:not(.ShowAlways) ." + sClassName) // all rows that don't have class ShowAlways and have matching sClassName elements
                .children() // we are hiding/showing elements in the cells
                .filter(":not([id^='pcaDiv'])") // not the post-code anywhere div
                .toggle(bDisplay); // display or not display
        }
    }

    var bNewInvoiceAddress = IsElementChecked("idINVOICEADDRESSSELECT_0");
    var bNewDeliverAddress = IsElementChecked("idDELIVERADDRESSSELECT_0");
    //
    // Hide address fields is neither 'Or enter new address is enabled
    //
    var bDisplay = (bNewInvoiceAddress || bNewDeliverAddress);
    //
    // Show or hide the delivery/invoice address area as appropriate
    //	
    var jqElements;
    if (bResponsive) {
        jqElements = $("#idBothAddressesTable >"). // select fieldset
        children("div:not(#idInvoiceAccountAddresses, #idDeliverAccountAddresses), label, input"); // field divs, label or input checkbox children
    } else {
        //
        // As there are nested table rows that don't have a class of ShowAlways, 
        // make sure that we only choose children of outer table that don't have ShowAlways
        //
        jqElements = $("#idBothAddressesTable > > tr:not(.ShowAlways)");
    }
    jqElements.toggle(bDisplay); // hide or show
    if (!bDisplay) // nothing more to do if we're hiding rows
    {
        return;
    }
    //
    // Calculate delivery fields value
    // Show only if necessary
    //
    var bDeliveryDisplayed = false;
    if (bNewDeliverAddress) {
        if (!bNewInvoiceAddress || // if we're just showing delivery fields
            IsElementChecked("idSEPARATESHIP")) // or we showing a different delivery address from user entered invoice address
        {
            bDeliveryDisplayed = true; // display delivery fields
        }
    }
    var bBothDisplayed = (bNewInvoiceAddress && bDeliveryDisplayed); // both sets of fields displayed?
    //
    // Handle invoice fields
    // Simply hide or show depending on corresponding radio button
    //
    SetAddressesTableCellsChildDisplay("InvoiceField", bNewInvoiceAddress, bBothDisplayed);
    if (bNewInvoiceAddress) {
        InvoiceCountryChanged();
    }
    SetAddressesTableCellsChildDisplay("DeliverField", bDeliveryDisplayed, bBothDisplayed);
    if (bDeliveryDisplayed) {
        DeliveryCountryChanged(); // call state/country set up after general blitz of delivery fields
    }
    //
    // Show the separate ship button if both addresses possible
    //
    $("#idSeparateShipRow").toggle(bNewInvoiceAddress && bNewDeliverAddress);
}

/***********************************************************************
 *
 * IsElementChecked - Returns whether a radio-button or checkbox is checked 
 *
 * Input:	sID	- id of element to check
 *
 * Returns:	true if element exists and ic checked
 *
 ************************************************************************/

function IsElementChecked(sID) {
    var elemCheck = document.getElementById(sID);
    if (elemCheck && elemCheck.checked) {
        return true;
    }
    return false;
}

/***********************************************************************
 *
 * SetShoppingCartVisibility - Handler for showing or hiding cart details
 *
 ************************************************************************/

function SetShoppingCartVisibility() {
    var elemShowHide = document.getElementById("idShowHide");
    if (!elemShowHide) {
        return;
    }

    var spanShoppingCart = document.getElementById("idShoppingCartGrid");
    if (!spanShoppingCart) {
        return;
    }
    var elemCartHeadingTotal = document.getElementById("idCartHeadingTotal");
    var elemCartChangeCell = document.getElementById("idCartChangeCell");
    if (spanShoppingCart.style.display == "none") {
        setCookie('cartDisplayPreference', 'show');
        spanShoppingCart.style.display = "";
        elemShowHide.innerHTML = 'hide';
        elemCartHeadingTotal.style.display = 'none';
        if (elemCartChangeCell) {
            document.getElementById("idCartChangeCell").style.display = '';
        }
    } else {
        setCookie('cartDisplayPreference', 'hide');
        spanShoppingCart.style.display = "none";
        elemShowHide.innerHTML = 'show';
        elemCartHeadingTotal.style.display = '';
        if (elemCartChangeCell) {
            document.getElementById("idCartChangeCell").style.display = 'none';
        }
    }
}

/***********************************************************************
 *
 * HideCartDetailsOnCheckoutPages - Hiding cart details on all but the first page by default
 *
 ************************************************************************/

function HideCartDetailsOnCheckoutPages() {
    var sCartDisplayPreference = getCookie('cartDisplayPreference');
    if (sCartDisplayPreference !== 'show') {
        SetShoppingCartVisibility();
    }
}


/***********************************************************************
 *
 * SetCreditCardFieldsVisibility - Handler for showing or hiding credit card fields
 *
 ************************************************************************/

function SetCreditCardFieldsVisibility() {
    //
    // Hide or show fields used for entering credit card details
    //
    // For the non-responsive checkout we have a table with id idPaymentMethodTable, with rows with class CreditCardField below it.
    // For responsive, we have a div with id idPaymentMethodTable with divs with class CreditCardField below it (but in a tbody in the dom)
    //
    // Therefore to be compatible with both we simple ignore the type of elements
    //
    $("#idPaymentMethodTable .CreditCardField").toggle(GetPaymentMethod() == "10005");
    //
    // v12 Finance code
    //
    if (GetPaymentMethod() !== "90") {
        $("#idPaymentMethodTable .v12FinanceFields").hide();
        return;
    }
    GetAvailableFinanceProducts();
}

/***********************************************************************
 *
 * CheckForm - Validate a form before submission
 *
 * Input:	elemBtn	- element doing the submission
 *
 * Returns:	true to let form submit, false to prevent bubbling up
 *
 ************************************************************************/

function CheckForm(elemBtn) {
    //
    // Find the form element in ancestors
    //
    var elemForm = elemBtn.parentElement ? elemBtn.parentElement : elemBtn.parentNode;
    while (elemForm &&
        elemForm.tagName != "FORM") {
        elemForm = elemForm.parentElement ? elemForm.parentElement : elemForm.parentNode;
    }
    if (!elemForm) // if form doesn't exist, bail out
    {
        return true;
    }
    //
    // We are submitting a form, add a hidden parameter JS="1"
    // to indicate that Javascript is enabled in this browser
    //
    $('#idCheckoutForm').append('<input type="hidden" name="JS" value="1" />');
    if ($('#idPickupSelect') &&
        $('#lstClass').prop("disabled")) // make sure that the shipping class value is posted even if dropdown disabled
    {
        $('#idCheckoutForm').append('<input type="hidden" name="ShippingClass" value="' + $('#lstClass').val() + '" />');
    }
    //
    // Decide whether we should validate the confirmation email address
    // We don't confirm emails if we're selecting an account address
    // or a delivery address if it is the same as invoice address
    //
    var bAccountCustomer = (document.getElementsByName('INVOICEADDRESSSELECT').length > 0);
    var bSkipInvoice = false;
    if (bAccountCustomer) {
        bSkipInvoice = !IsElementChecked("idINVOICEADDRESSSELECT_0"); // skip invoice if we're selecting an address
    }
    var chkSeparateShip = document.getElementById('idSEPARATESHIP');
    var bSkipDeliver = false;
    if (bAccountCustomer) {
        bSkipDeliver = !IsElementChecked("idDELIVERADDRESSSELECT_0"); // skip delivery if we're selecting an address
    }
    if (!bSkipDeliver) // if we're not selecting an address
    {
        bSkipDeliver = (chkSeparateShip && !chkSeparateShip.checked); //	skip if delivery is same as invoice
    }
    if (bSkipInvoice && bSkipDeliver) // if we skip both addresses
    {
        return true; // nothing to check
    }

    var arrDescendants = GetAllElements(elemForm);
    for (var i = 0; i < arrDescendants.length; i++) {
        var elemThis = arrDescendants[i];
        if ((elemThis.id == 'idINVOICEEMAIL_CONFIRM' && !bSkipInvoice) ||
            (elemThis.id == 'idDELIVEREMAIL_CONFIRM' && !bSkipDeliver)) {
            var elemEmail = document.getElementById(elemThis.id.replace(/_CONFIRM$/, ''));
            if (elemEmail.style.display != 'none' && elemEmail.value != elemThis.value) {
                var sMsg = GetLabelText(elemThis) + "\n\n";
                sMsg += "'" + elemThis.value + "' does not match '" + elemEmail.value + "'";
                alert(sMsg);
                elemThis.focus();
                return false;
            }
        }
        if ((elemThis.id == 'idNEWCUSTOMERPASSWORD2') &&
            (IsElementChecked('idCREATEANACCOUNT') ||
                document.getElementById('idCREATEANACCOUNT') == null)) {
            var elemPwd = document.getElementById('idNEWCUSTOMERPASSWORD');
            if (elemPwd.style.display != 'none' && elemPwd.value != elemThis.value) {
                var sMsg = PASSWORD_MATCH_ERROR;
                alert(sMsg);
                elemThis.focus();
                return false;
            }
        }
    }
    if (bSkipInvoice && !bSkipDeliver) {
        chkSeparateShip.checked = true;
    }
    return true;
}

/***********************************************************************
 *
 * GetAllElements - Get all descendants of an element
 *
 * Input:	elemParent	- parent element
 *
 * Returns:	collection of descendant elements
 *
 ************************************************************************/

function GetAllElements(elemParent) {
    if (elemParent.all) // IE-specific
    {
        return elemParent.all;
    } else if (elemParent.getElementsByTagName) // W3C compliant browsers
    {
        return elemParent.getElementsByTagName('*');
    }
}

/***********************************************************************
 *
 * SubmitPSPForm - Submit a form to a PSP
 *
 * Input:	sShopID - the shop ID (only used in host mode)
 *
 * Returns:	true to let form submit, false to prevent bubbling up
 *
 ************************************************************************/
var g_sConfirmOrderInitText = '';

function SubmitPSPForm(sShopID) {
    if (GetPaymentMethod() === "90") // v12 Finance
    {
        var sError = CheckMinMaxDeposit()
        if (sError !== "") {
            $("#idFinanceDepositError").html(sError);
            $("#idFinanceDepositError").show();
            $("#idFinanceDeposit").focus();
            return false;
        }
    }
    var nPaymentMethod = GetPaymentMethod();
    if (nPaymentMethod == -1) {
        return true;
    }
    //
    // Drop a hidden wait message into the span place folder for the PSP form
    // Display the message on a greyed screen that disables all further input
    //
    var elemSpanPSPForm = document.getElementById("idSpanPSPForm");
    if (elemSpanPSPForm) {
        elemSpanPSPForm.innerHTML = '<div id="pspwait" style="display:none;">Saving your order... Please wait</div>';
        ShowPSPWait('pspwait');
        ShowPSPForm();
    }

    if (nPaymentMethod >= 10000 &&
        nPaymentMethod < 30000) // if this ia an inbuilt payment method
    {
        return true; // don't get PSP form
    }

    GetPSPFormAndSubmit(nPaymentMethod, sShopID);
    return false;
}

/***********************************************************************
 *
 * SubmitPPEForm - Submit the PayPal Express form
 *
 * Input:	pForm - the form object
 *
 * Returns:	false to prevent calling method from submitting form
 *
 ************************************************************************/
var g_bConfirmOrderDone = false;

function SubmitPPEForm(pForm) {
    if (g_bConfirmOrderDone) // have we already submitted the form?
    {
        alert("Your order is being completed"); // tell the user what's happening
        return false;
    }
    g_bConfirmOrderDone = true;
    if ($('#idPickupSelect') &&
        $('#lstClass').prop("disabled")) // make sure that the shipping class value is posted even if dropdown disabled
    {
        $(pForm).append('<input type="hidden" name="ShippingClass" value="' + $('#lstClass').val() + '" />');
    }

    pForm.submit(); // submit the form

    return false;
}

/***********************************************************************
 *
 * GetPaymentMethod - Get the payment method
 *
 * Returns:	payment method or -1 if not found
 *
 ************************************************************************/

function GetPaymentMethod() {
    var cmbPaymentMethod = document.getElementById("idPAYMENTMETHOD");
    if (cmbPaymentMethod) // if we have an element with correct id
    {
        return cmbPaymentMethod.value; // return it
    }
    //
    // Get radio buttons or hidden by name if present
    //
    var collPaymentMethods = document.getElementsByName("PAYMENTMETHOD");
    if (!collPaymentMethods) {
        return -1;
    }
    if (collPaymentMethods.length == 1) // might have a single method in which case it will be hidden input
    {
        return collPaymentMethods[0].value;
    }
    for (var i = 0; i < collPaymentMethods.length; i++) // find checked radio button
    {
        if (collPaymentMethods[i].checked) {
            return collPaymentMethods[i].value;
        }
    }
    return -1;
}

/***********************************************************************
 *
 * GetPSPFormAndSubmit - Submit a form to a PSP
 *
 * Input:	nPaymentMethod	- payment method
 *			sShopID - the shop ID (only used in host mode)
 *
 ************************************************************************/

function GetPSPFormAndSubmit(nPaymentMethod, sShopID) {
    var ajaxRequest = new ajaxObject(document.location.href.split('?')[0]);
    ajaxRequest.callback = function(responseText, responseStatus) {
        if ((200 != responseStatus) ||
            (responseText.substring(0, 6) == "Error:")) {
            alert(responseText);
            ShowPSPForm(false); // make sure the pop up window is removed
            return;
        }
        //
        // Get the placeholder span for the PSP form
        //
        var elemSpanPSPForm = document.getElementById("idSpanPSPForm");
        if (!elemSpanPSPForm) {
            return;
        }
        elemSpanPSPForm.innerHTML = responseText;
        //
        // Try to get the standard PSP form
        //
        var elemPSPForm = document.getElementById("idPSPForm");
        if (elemPSPForm) {
            //
            // Submit the PSP form if present
            //
            elemPSPForm.submit();
            return;
        }
        //
        // If not found then this may be an InContext PSP
        //
        // Note: We are using file type .htm with .js to be able to maintain backwards compatibility
        // Only .htm or .html files are not signed by ISControl.ocx.
        // If the js file is signed it won't work
        //
        RequireScript("psplib" + nPaymentMethod + ".htm.js",
            function() {
                GetPSPHelper(); // call the PSP Helper function
            }
        );
        return;
    }
    var sParams = "ACTION=GETPSPFORM&PAYMENTMETHOD=" + nPaymentMethod;
    if (sShopID) {
        sParams += '&SHOP=' + sShopID;
    }
    var elemPONumber = document.getElementsByName('PAYMENTPONO');
    if (elemPONumber.length) {
        sParams += '&PAYMENTPONO=' + escape(elemPONumber[0].value);
    }
    var elemPayUserDef = document.getElementsByName('PAYMENTUSERDEFINED');
    if (elemPayUserDef.length) {
        sParams += '&PAYMENTUSERDEFINED=' + escape(elemPayUserDef[0].value);
    }
    if ("90" === nPaymentMethod) {

        sParams += GetParams(); // add DEPOSIT, PRODUCTID and PRODUCTGUID

    }
    ajaxRequest.update(sParams, "GET");
}

/***********************************************************************
 *
 * CloseForm - Close the pop up form, called directly from the checkout page
 *
 ************************************************************************/

function CloseForm() {
    ShowPSPForm(false); // make sure the pop up window is removed
}

/***********************************************************************
 *
 * RequireScript - Add a required script to the DOM and optionally call a
 *						function when the script has loaded
 *
 * Input:	sFile		- name of the script to load
 *			callback - callback function to run after script is loaded (optional)
 *
 ************************************************************************/

function RequireScript(sFile, callback) {
    var newjs = document.createElement('script');
    var script = document.getElementsByTagName('script')[0];
    //
    // error handler
    //
    newjs.onerror = function() {
        alert('Error loading [' + sFile + ']. Please try another payment method.');
        ShowPSPForm(false); // make sure the pop up window is removed
        return;
    };
    //
    // IE file loaded event
    //
    if (callback != undefined) {
        newjs.onreadystatechange = function() {
            if (newjs.readyState === 'loaded' || newjs.readyState === 'complete') {
                callback();
            }
        };
        //
        // Other browsers file loaded event
        //
        newjs.onload = function() {
            callback();
        };
    }

    newjs.src = sFile;
    script.parentNode.insertBefore(newjs, script);
}

/***********************************************************************
 *
 * ShowPSPForm - Show or hide the PSP form
 *
 * Input:	bShow	- true to show, false to hide
 *							optional, default is true
 *
 ************************************************************************/

function ShowPSPForm(bShow) {
    var elemDivPSPForm = document.getElementById("idDivPSPForm");
    if (elemDivPSPForm) {
        if (bShow == null || bShow) {
            elemDivPSPForm.style.display = 'inline';
        } else {
            elemDivPSPForm.style.display = 'none';
        }
    }
}

/***********************************************************************
 *
 * ShowPSPWait - Show or hide a PSP wait message
 *
 * Input:	id		- id of the message to show or hide
 *			bShow	- true to show, false to hide
 *							optional, default is true
 *
 ************************************************************************/

function ShowPSPWait(id, bShow) {
    if (bShow == null || bShow) {
        //
        // Show the message and then the panel
        //
        document.getElementById(id).style.display = 'inline';
        document.getElementById('pspwait').style.display = 'inline';
    } else {
        //
        // hide the panel and then the message
        //
        document.getElementById('pspwait').style.display = 'none';
        document.getElementById(id).style.display = 'none';
    }
}

/***********************************************************************
 *
 * SFDropDownMenu - Javascript function to handle Suckerfish drop-down menus in IE
 *
 * Input:	sID	- ID of the <UL> element
 *
 ************************************************************************/

function SFDropDownMenu(sID) {
    var collElems = document.getElementById(sID).getElementsByTagName("LI");
    for (var i = 0; i < collElems.length; i++) {
        collElems[i].onmouseover = function() {
            this.className += " sfhover";
        }
        collElems[i].onmouseout = function() {
            this.className = this.className.replace(new RegExp(" sfhover\\b"), "");
        }
    }
}

/***********************************************************************
 *
 * ShowHideHelp - Show or hide the help for a field under the field
 *
 * Input:	elemSource	- the field control
 *			sDisplay		- string to set style.display ('' to show, 'none' to hide)
 *
 ************************************************************************/

function ShowHideHelp(elemSource, sDisplay) {
    var elemHelp = document.getElementById(elemSource.id + 'help'); // get associated help element
    if (!elemHelp) {
        return;
    }
    elemHelp.style.display = sDisplay; // show or hide help element
}

/***********************************************************************
 *
 * ShowHideHelpDiv - Show or hide the help for a field in the help area
 *
 * Input:	elemSource	- the field control
 *			sDisplay		- string to set style.display ('' to show, 'none' to hide)
 *
 ************************************************************************/

function ShowHideHelpDiv(elemSource, sDisplay) {
    var elemHelp = document.getElementById(elemSource.id + 'help'); // get associated help element
    if (!elemHelp) {
        return;
    }
    var elemHelpElem = document.getElementById('idCheckoutHelp'); // get help display element
    if (!elemHelpElem) {
        return;
    }
    var sText = elemHelp.innerHTML;
    var elemLabel = document.getElementById(elemSource.id + 'label'); // try and get label area
    if (elemLabel &&
        elemLabel.className == 'actrequired') // if it's a required field
    {
        sText += ' This is a required field.'; // tell user
    }
    elemHelpElem.innerHTML = sDisplay == '' ? sText : ''; // set html for help display
}

/***********************************************************************
 *
 * GetLabelText - Get the label text associated with a control
 *
 * Input:	elemSource	- user UI element
 *
 ************************************************************************/

function GetLabelText(elemSource) {
    var elemLabel = document.getElementById(elemSource.id + 'label'); // try and get label area
    if (!elemLabel) {
        elemLabel = document.getElementById(elemSource.id.replace(/DELIVER/, 'INVOICE') + 'label');
    }
    if (elemLabel) {
        var sLabel = elemLabel.innerHTML;
        sLabel = sLabel.replace(/(\n|\t)/, ' ');
        sLabel = sLabel.replace(/<.*?>/g, '');
        sLabel = sLabel.replace(/\s*\*$/, '');
        return sLabel;
    }
    return '';
}

/***********************************************************************
 *
 * SetFocusToID - Set focus to element with supplied id
 *
 * Input:	sID	- id of element
 *
 ************************************************************************/

function SetFocusToID(sID) {
    var elemFocus = document.getElementById(sID); // get element to set focus to
    if (!elemFocus) {
        return;
    }
    if (elemFocus.style.display != 'none')
        elemFocus.focus(); // set focus
}

/***********************************************************************
 *
 * SetInvoiceCountries - Populate the invoice countries dropdown depending upon
 *		different address checkbox
 *
 ************************************************************************/
var g_sInvoiceCountryCode = '';

function SetInvoiceCountries() {
    var cmbCountry = document.getElementById('lstInvoiceCountry');
    if (!cmbCountry || !cmbCountry.options) {
        return;
    }
    var editCountry = document.getElementById('idINVOICECOUNTRYText');
    var chkSeparateShip = document.getElementById('idSEPARATESHIP');
    var bSeparateShip = (chkSeparateShip && chkSeparateShip.checked) ? true : false;
    //
    // Save current country value
    //
    var sCurrentCountryCode = cmbCountry.value ? cmbCountry.value : g_sInvoiceCountryCode;
    var sCurrentCountryText = ((sCurrentCountryCode == '' || sCurrentCountryCode == '---') && editCountry) ? editCountry.value : '';
    cmbCountry.options.length = 1; // clear the state select options except for 'Select country'
    var sFoundCode = '';
    var sFoundNameCode = '';
    for (var i in g_arrCountries) {
        var arrCountry = g_arrCountries[i];
        var bAdd = true;
        if (g_bInvoiceLocationRestrictive) {
            if (!bSeparateShip && g_bDeliveryLocationRestrictive) {
                bAdd = arrCountry[2] && arrCountry[3];
            } else {
                bAdd = arrCountry[2];
            }
        } else if (g_bDeliveryLocationRestrictive && !bSeparateShip) {
            bAdd = arrCountry[3];
        } else {
            bAdd = arrCountry[2] || arrCountry[3];
        }
        if (bAdd) {
            var oOption = document.createElement("OPTION"); // create an option
            oOption.value = arrCountry[0]; // set country code
            oOption.text = arrCountry[1]; // set country name
            if (sCurrentCountryCode && oOption.value == sCurrentCountryCode) // if it matches the code
            {
                sFoundCode = oOption.value;
            }
            if (sCurrentCountryCode != '---' && oOption.text == sCurrentCountryText) // if it matches the code
            {
                sFoundNameCode = oOption.value;
            }
            cmbCountry.options.add(oOption); // add option to select element
        }
    }
    if (sFoundCode) {
        cmbCountry.value = sFoundCode;
    }
    if (sFoundNameCode) {
        cmbCountry.value = sFoundNameCode;
    }
    if (cmbCountry.value) {
        g_sInvoiceCountryCode = cmbCountry.value;
    }
}

/***********************************************************************
 *
 * StateDropdownChanged - The selection in state dropdown has changed
 *
 * Input:	cmbState	- state dropdown
 *
 ************************************************************************/

function StateDropdownChanged(cmbState) {
    //
    // Get edit control
    //
    var idEdit = (cmbState.id.indexOf('Invoice') != -1) ? 'idInvoiceRegionEdit' : 'idDeliveryRegionEdit';
    var editState = document.getElementById(idEdit);
    if (!editState || // if there's no text control
        cmbState.value == 'UndefinedRegion') // or the state is undefined
    {
        return; // quit
    }
    //
    // Update the text control with the text from combo
    //
    var nIndex = cmbState.selectedIndex;
    editState.value = cmbState.options[nIndex].text;
}

/***********************************************************************
 *
 * LoadXMLDoc - Load the doc specified by input URL and return the XML response
 *
 * Input:	sURL			- URL of document
 *			bReturnDoc	- true if we want DOM document, false if we want XML string
 *
 * Returns:	DOM document or XML string
 *
 ************************************************************************/

function LoadXMLDoc(sURL, bReturnDoc) {
    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    } else {
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET", sURL, false);
    xhttp.send(null);
    if (bReturnDoc) {
        return xhttp.responseXML;
    } else {
        return xhttp.responseText;
    }
}

/***********************************************************************
 *
 * DOMDocFromXML - Create a DOM document from an XML string
 *
 * Input:	sXML	- source XML string
 *
 * Returns:	DOM document or null if no parser supported
 *
 ************************************************************************/

function DOMDocFromXML(sXML) {
    var docDOM = null;
    if (window.ActiveXObject) // IE code
    {
        docDOM = new ActiveXObject("Microsoft.XMLDOM");
        docDOM.async = "false";
        docDOM.loadXML(sXML);
    } else if (window.DOMParser) // other browsers
    {
        var oParser = new DOMParser();
        docDOM = oParser.parseFromString(sXML, "text/xml");
    }
    return docDOM;
}

/***********************************************************************
 *
 * DisplayFeefoFeedback - Display the feefo XML feed for products or the whole site
 *
 * Input:	nLimit	- the max number of comments to be displayed
 *			sSiteURL	- URL of the acatalog folder (needed to prefix extra data)
 *			sCGIURL	- URL to the cart script wrapper
 *			sLogon	- feefo logon
 *			sProduct - the product reference (if this is an empty string, site feed displayed)
 *			sShopID	- shop ID for host mode (empty string in non-host mode)
 *
 ************************************************************************/

function DisplayFeefoFeedback(nLimit, sSiteURL, sCGIURL, sLogon, sProduct, sShopID) {
    var sParams = escape("?logon=" + sLogon); // escape the parameter
    //
    // If product ref specified then add it to the param String
    //
    var sNode = "FeefoFeedback";
    if (sProduct != "") {
        sParams += escape("&vendorref=" + sProduct);
        sNode += "_" + sProduct;
    }
    //
    // Add the limit parameter
    //
    sParams += escape("&limit=" + nLimit);
    //
    // We need cdata
    //
    sParams += escape("&mozillahack=true");
    //
    // Load the files
    //
    var sFeefoURL = sCGIURL + "?ACTION=FEEFOXML&FEEFOPARAM=" + sParams;
    if (sShopID) // add shop id in host mode
    {
        sFeefoURL += "&SHOP=" + escape(sShopID);
    }
    var xml = LoadXMLDoc(sFeefoURL, true); //?logon=www.examplesupplier.com");
    if (xml == null || xml.xml == "") {
        return;
    }
    var sXslXML = LoadXMLDoc(sSiteURL + "feedback.xsl", false); // get xsl as string 
    //
    // Convert css and image files to full URLs
    //
    var reFiles = /(feefo\.css|plus\.gif|minus\.gif)/ig;
    sXslXML = sXslXML.replace(reFiles, sSiteURL + "$1"); // convert to full URLs
    var docXSL = DOMDocFromXML(sXslXML); // create a DOM doc from XML string
    //
    // code for IE
    //
    if (window.ActiveXObject) {
        ex = xml.transformNode(docXSL);
        document.getElementById(sNode).innerHTML = ex;
    }
    //
    // code for Mozilla, Firefox, Opera, etc.
    //
    else if (document.implementation && document.implementation.createDocument) {
        xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(docXSL);
        resultDocument = xsltProcessor.transformToFragment(xml, document);
        document.getElementById(sNode).appendChild(resultDocument);
    }
}

/***********************************************************************
 *
 * ShowBackLink - Display the back link for SPP pages
 *
 ************************************************************************/

function ShowBackLink() {
    var sLastSection = getCookie('LAST_SECTION_URL'); // get last section page URL
    if (!sLastSection) {
        return;
    }
    var elemBackLink =
        document.getElementById('idSPPBackLink'); // get the back link
    if (!elemBackLink) {
        return;
    }
    elemBackLink.href = sLastSection; // set the url						
    elemBackLink.style.display = ''; // show the link
}

/***********************************************************************
 *
 * CheckPassword - Do the passwords match
 *
 * Input:	elemPwd		- password element
 *			elemRetype	- confirm password element
 *
 * Returns:	true if the two passwords match
 *
 ************************************************************************/

function CheckPassword(elemPwd, elemRetype) {
    if (!elemPwd.value ||
        !elemRetype.value ||
        elemPwd.value != elemRetype.value) {
        var sMsg = PASSWORD_MATCH_ERROR;
        var elemFocus = elemPwd;
        if (!elemPwd.value) {
            sMsg = 'Please enter a value for ' + GetLabelText(elemPwd);
        } else if (!elemRetype.value) {
            sMsg = 'Please enter a value for ' + GetLabelText(elemRetype);
            elemFocus = elemRetype;
        }
        alert(sMsg);
        elemFocus.focus();
        return false;
    }
    return true;
}

/***********************************************************************
 *
 * GetScriptURL - Get the current location with no parameters
 *
 * Returns:	current location with any parameters removed
 *
 ************************************************************************/

function GetScriptURL() {
    var sURL = document.location.href;
    return sURL.split('?')[0];
}

/***************************************************************
 *
 * IsLoggedIn	- Returns whether the user is logged in
 *
 ***************************************************************/

function IsLoggedIn() {
    var sBusinessCookie = getCookie('ACTINIC_BUSINESS');
    if (!sBusinessCookie) {
        return false;
    }
    var arrFields = sBusinessCookie.split(/\n/);
    for (var i = 0; i < arrFields.length; i++) {
        var arrNameValue = arrFields[i].split(/\t/);
        if (arrNameValue[0] == 'USERNAME' &&
            arrNameValue[1] != '') {
            return true;
        }
    }
    return false;
}

/***************************************************************
 *
 * GetScriptPrefix	- Returns the 2 letter script prefix
 *
 ***************************************************************/

function GetScriptPrefix() {
    var nLastSlash = location.pathname.lastIndexOf('/');
    if (nLastSlash != -1) {
        var sScript = location.pathname.substr(nLastSlash + 1);
        return sScript.substr(0, 2);
    }
}

/***************************************************************
 *
 * SetBusinessCookies	- Sets business cookies for customer accounts in split SSL
 *
 * Input:	sBusinessCookie	- business cookie or undefined if logging out
 *			sCartCookie			- cart cookie (ignored if logging out)
 *
 ***************************************************************/

function SetBusinessCookies(sBusinessCookie, sCartCookie) {
    if (!sBusinessCookie) {
        setCookie('CART_CONTENT', 'CART_TOTAL\t0\tCART_COUNT\t0');
        setCookie('ACTINIC_BUSINESS', 'BASEFILE');
        document.location.replace(document.location.href.replace(/#logout$/, ''));
    }
}

/***************************************************************
 *
 * OnKeyDownForm	- Handle a key-down even in the login form
 *
 * This is to workaround an IE9 bug that prevents the enter key
 * from submitting the login form
 *
 ***************************************************************/

function OnKeyDownForm() {
    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) // test for IE
    {
        var nVersion = new Number(RegExp.$1) // get the version
        if (nVersion >= 9) // if it is IE9
        {
            if (window.event.keyCode == 13) // if this is the Enter key
            {
                var elemSrc = window.event.srcElement; // get element that received the key press
                if (elemSrc.tagName == 'INPUT' &&
                    (elemSrc.type == 'submit' || elemSrc.type == 'button')) // if it is a button
                {
                    return; // let browser handle it
                }
                for (var i = 0; i < elemSrc.form.all.length; i++) {
                    var elemHTML = elemSrc.form.all[i];
                    if (elemHTML.tagName == 'INPUT' && elemHTML.type == 'submit') // if this is a submit button
                    {
                        elemHTML.click(); // simulate a click
                        window.event.cancelBubble = true; // we've handled the key-press
                        window.event.returnValue = false;
                        return;
                    }
                }
            }
        }
    }
}

/***********************************************************************
 *
 * Sprintf - Very simple emulation of sprintf
 *
 * Only %s format specifier is supported and not tested against things like %%s
 *
 * Input:	sFormat	- format string
 *			...		- arguments to substitute
 *
 * Returns:	formatted string
 *
 ***********************************************************************/

function Sprintf(sFormat) {
    var sResult = sFormat;
    for (var i = 1; i < arguments.length; i++) {
        sResult = sResult.replace(/%s/, arguments[i]);
    }
    return sResult;
}

/***********************************************************************
 *
 * Actinic Mega Menu
 *
 * Author:				Fergus Weir
 * Modified by:			Hugh Gibson
 *						Tibor Kristof
 *
 ************************************************************************/
//
// Variables
//
var g_mm_nMenuCloseTimeout = 500; // period of time that the menu remains before being cleared
var g_mm_closeTimer = null; // ID of close timer
var g_mm_menuParent = null; // active parent menu element 
var g_mm_menuItem = null; // active sub-menu element
var g_mm_NO_MENU_ITEM = -1; // constant to indicate no menu item active
var g_mm_nIDRecentMouseOver = g_mm_NO_MENU_ITEM; // menu item that had a recent mouseover - used to detect click via a touch device
var g_mm_timerRecentMouseOver = null; // timer for recent mouseover
var g_mm_nIDForMouseUp = g_mm_NO_MENU_ITEM; // menu item that had a mouseup. If a mouseout occurs immediately afterwards, then it's a windows device and we ignore mouseout
var g_mm_nWindowsTouchOn = g_mm_NO_MENU_ITEM; // for windows devices, there was a touch on this menu
var g_mm_mapListenersAdded = {}; // we add listeners to menu items - this map prevents us doing this multiple times

/***********************************************************************
 *
 * $tb		-	Shortcut for getElementById(element)
 * Returns:	-	element with matching ID
 *
 * Author:				Fergus Weir
 *
 ************************************************************************/
var $ge = function(id) {
    return document.getElementById(id);
};

/***********************************************************************
 *
 * mmClick	- handle a mega menu main item click. Prevent click on touch devices in some circumstances
 *
 * Input: evClick 	- event
 *			nID		- ID of mega menu
 *
 * Returns:	false if preventing click; modifies ev.
 *
 ************************************************************************/
function mmClick(evClick, nID) {
    //
    // We detect a tap on the mega menu item if there is a mouseover directly followed by a click event.
    // On some touch devices the delay from the mouseover to the click can be significant - 300ms to 400ms.
    // Therefore we ignore click events for a button for a period after the mouseover.
    // g_mm_nIDRecentMouseOver is set to the id of the mega menu being shown during the period after the mouseover.
    // This means that the first tap opens up a mega menu, and a second tap follows the hotlink.
    //
    if (g_mm_nIDRecentMouseOver == nID) // recent mouseover for this mega menu tab?
    {
        if (evClick.preventDefault) // might not support in IE older versions
        {
            evClick.preventDefault(); // don't allow the click
        }
        return false;
    }
}

/***********************************************************************
 *
 * mmClose		-	Hides the menu element
 * Returns:		-	nothing
 *
 * Author:				Fergus Weir
 *
 ************************************************************************/
function mmClose() {
    if (g_mm_menuItem) {
        g_mm_menuItem.style.display = 'none';
        g_mm_menuItem = null;
    }
    if (g_mm_menuParent) {
        g_mm_menuParent.className = '';
        g_mm_menuParent = null;
    }
}

/***********************************************************************
 *
 * mmCloseTime		-	Starts mega menu closing timer
 * Returns:			-	nothing
 *
 * Author:				Fergus Weir
 *
 ************************************************************************/
function mmCloseTime() {
    //
    // If a normal mouseout then we just set up to close the menu 
    //
    if (g_mm_nIDForMouseUp == g_mm_NO_MENU_ITEM) {
        if (g_mm_closeTimer) {
            window.clearTimeout(g_mm_closeTimer);
            g_mm_closeTimer = null;
        }
        g_mm_closeTimer = window.setTimeout(mmClose, g_mm_nMenuCloseTimeout);
    } else {
        //
        // In this case the mouseout occurred while mouseup was being handled so
        // we know it's a windows phone and we ignore the mouseout
        //
        g_mm_nWindowsTouchOn = g_mm_nIDForMouseUp;
    }
}

/***********************************************************************
 *
 * mmCancelCloseTime	-	cancels the resetting of mega menu closing timer
 * Returns:	 		-	nothing
 *
 * Author:				Fergus Weir
 *
 ************************************************************************/
function mmCancelCloseTime() {
    if (g_mm_closeTimer) {
        window.clearTimeout(g_mm_closeTimer);
        g_mm_closeTimer = null;
    }
    if (g_mm_menuParent) {
        g_mm_menuParent.className = 'sel';
    }
}

/***********************************************************************
 *
 * mmOpen		-	Function is called from mouseOver event and positions
 *                   the mega menu drop down in correct position as well
 *                   as ensuring it is made visible
 * Returns:		-	nothing
 *
 * Author:				Fergus Weir
 *
 ************************************************************************/
function mmOpen(id) {
    //
    // If the mini navigation menu is shown i.e. its a compact touch device just ignore mouseover
    // This is because the sub-menu display is inline with the main menu and moves everything around.
    // This causes havoc with touch devices particularly as there is a delay to the click.
    // We let the More.. button open up because it's at the end, and there's no other way of seeing the 
    // top level sections in it.
    //
    if ($("div.miniNav").is(":visible") && // if the miniNav bar is visible
        $("#main-link" + id).attr("href") != '#') // and the mouseover is not on the "More.." button then ignore it
    {
        g_mm_nIDRecentMouseOver = g_mm_NO_MENU_ITEM; // reset just in case
        return;
    }
    //
    // Check if Windows touch in which case a mouseout will have occurred after tap.
    // If there is another mouseover then we just ignore it as the mega menu is already dropped.
    //
    if (g_mm_nWindowsTouchOn == id) {
        return;
    }
    //
    // If we get a click event before the timer below fires, we know it was a touch event so we can
    // ignore it if it is for the current tab. If the click occurs after the timer has fired then we 
    // let it go through. That way the first tap opens the mega menu; second tap follows the hotlink.
    //
    g_mm_nIDRecentMouseOver = id; // this indicates that a recent mouseover event occurred on this item
    if (g_mm_timerRecentMouseOver) // reset the timer if it's already active for another item
    {
        window.clearTimeout(g_mm_timerRecentMouseOver);
    }
    g_mm_timerRecentMouseOver = window.setTimeout(function() {
            g_mm_nIDRecentMouseOver = g_mm_NO_MENU_ITEM; // no recent mouseover now
            g_mm_timerRecentMouseOver = null;
        },
        500); // can be adjusted if some touch devices are very slow at sending the click through after a mouseover
    // cancel close timer
    mmCancelCloseTime();
    // close old layer
    mmClose();
    // get new layer and show it
    menuDiv = $ge('mega-menu');
    g_mm_menuParent = $ge('main-link' + id);
    //
    // Set up mouseup handler so we can detect Windows touch device which sends mouseup & then mouseout after a tap
    //
    if (!g_mm_mapListenersAdded['mouseup' + id]) {
        AddEvent(g_mm_menuParent, "mouseup", mmMouseUpHandler(id));
        g_mm_mapListenersAdded['mouseup' + id] = true;
    }
    g_mm_menuItem = $ge('tc' + id);
    //show the menu to enable dimension properties and show on page
    g_mm_menuItem.style.display = 'block';
    //reposition 
    //get position and size dimensions
    var topNavWidth = menuDiv.offsetWidth;
    var menuDropWidth = g_mm_menuItem.offsetWidth;
    var menuPosOnPage = findLeftPos(menuDiv);
    var itemPosOnPage = findLeftPos(g_mm_menuParent);
    // the width from the default menu start position to the edge of the container
    var MenuPlaceholderwidth = (topNavWidth - itemPosOnPage);
    //alert('menu placeholder width = ' + MenuPlaceholderwidth);

    //if the menu to display is greater than the top nav 
    if (topNavWidth < menuDropWidth) {
        //get difference
        var widthDifference = menuDropWidth - topNavWidth;
        //center item
        g_mm_menuItem.style.left = (-1 * (itemPosOnPage + Math.floor((widthDifference / 2)) - menuPosOnPage)) + "px";
    } else if (topNavWidth < ((itemPosOnPage - menuPosOnPage) + menuDropWidth)) {
        // off the page so align to right
        g_mm_menuItem.style.left = -1 * (((itemPosOnPage - menuPosOnPage) + menuDropWidth) - topNavWidth) + "px";
    } else {
        //not wider than menu; not off the page, so set to standard
        g_mm_menuItem.style.left = 0 + "px";
    }
}

/***********************************************************************
 *
 * mmMouseUpHandler	-	MouseUp handler
 *
 * Returns:				-	nothing
 *
 ************************************************************************/

function mmMouseUpHandler(id) {
    var nID = id;
    return (
        function() {
            g_mm_nIDForMouseUp = nID;
            //
            // If mouseout occurs before the timer below fires we detect it and set g_mm_nWindowsTouchOn
            //
            window.setTimeout(function() {
                    g_mm_nIDForMouseUp = g_mm_NO_MENU_ITEM;
                },
                0);
        });
}

/***********************************************************************
 *
 * findPos		-	Finds the  left position of an element in the window
 * Returns:		-   x coordinate of object in visible window
 *
 * Author:				Fergus Weir
 *
 ************************************************************************/
function findLeftPos(obj) {
    var curleft = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
        } while (obj = obj.offsetParent);
        return curleft;
    }
}

/***********************************************************************
 *
 * findPosX		-	Finds the  left position of an element in the window
 *
 * Returns:		-   x coordinate of object in visible window
 *
 ************************************************************************/
function findPosX(obj) {
    var left = 0;
    if (obj.offsetParent) {
        while (1) {
            left += obj.offsetLeft;
            if (!obj.offsetParent)
                break;
            obj = obj.offsetParent;
        }
    } else if (obj.x) {
        left += obj.x;
    }
    return left;
}

/***********************************************************************
 *
 * findPosY		-	Finds the  left position of an element in the window
 *
 * Returns:		-   y coordinate of object in visible window
 *
 ************************************************************************/
function findPosY(obj) {
    var top = 0;
    if (obj.offsetParent) {
        while (1) {
            top += obj.offsetTop;
            if (!obj.offsetParent)
                break;
            obj = obj.offsetParent;
        }
    } else if (obj.y) {
        top += obj.y;
    }
    return top;
}

/***********************************************************************
 *
 * getDynamicAccPrice - Call our server script to determine the total price
 *		depending on the selection 
 *
 * Input:	sURL - the ajax script URL to call
 *		sSID - the section ID list to be passed in to the ajax script or null if for a single product
 *		oProd - the product
 *		sShopID - the shop ID (only used in host mode)
 *
 ************************************************************************/

function getDynamicAccPrice(sURL, sSID, oProd, sShopID) {
    //
    // In case of preview use passed in data
    //
    var bPreview = (sURL.indexOf("file://") == 0);
    var sProdRef = oProd.sProdRef;
    var sVariantSettings = "";
    if (bPreview) {
        return;
    } else {
        //
        // Get the element containing variants
        //
        var sName = 'v_' + sProdRef + '_';
        var elemVars = document.getElementById('idVars' + sProdRef);
        if (elemVars) {
            if (oProd.arrComps) // if we have components
            {
                var arrComps = oProd.arrComps;
                var nLength = arrComps.length;
                for (var i = 0; i < nLength; i++) // for each one
                {
                    var oComp = arrComps[i];
                    var sCompHTMLName = sName + oComp.nUI;
                    var elemComp = document.getElementsByName(sCompHTMLName)[0];
                    if (elemComp.type == 'checkbox') {
                        sVariantSettings += "&" + sCompHTMLName + "=" + (elemComp.checked ? "on" : "off");
                    } else {
                        sVariantSettings += "&" + sCompHTMLName + "=" + elemComp.value;
                    }
                    oComp.elemHTML = elemComp; // store the UI element
                }
            }
            //
            // Store the attribute UI element
            //
            var mapElemAttr = GetAttributes(elemVars);
            var arrElemAttr = mapElemAttr[sProdRef];
            if (arrElemAttr) {
                var nVarSuffix = parseInt(arrElemAttr[0].name.match(/_(\d+)$/)[1]);
                var nAttrElemCount = arrElemAttr.length
                for (var i = 0; i < nAttrElemCount; i++) {
                    var elemAttr = arrElemAttr[i];
                    nVarSuffix = parseInt(elemAttr.name.match(/_(\d+)$/)[1]);
                    if (oProd.arrComps) {
                        var oAttr = GetAttrFromSuffix(oProd, nVarSuffix);
                        //
                        // Make sure the initial HTML elements are used before the javascript pixies
                        // do any mischief
                        //
                        if (!oAttr.elem) {
                            oAttr.elem = new CSelect(elemAttr);
                        }
                    }
                    if (document.getElementsByName(elemAttr.name)[0].type == 'radio') {
                        var oElement = document.getElementsByName(elemAttr.name)[0];
                        for (var j = 0; oElement != null;) {
                            if (oElement.checked) {
                                sVariantSettings += "&" + elemAttr.name + "=" + oElement.value;
                                break;
                            }
                            oElement = document.getElementsByName(elemAttr.name)[++j];
                        }
                    } else {
                        sVariantSettings += "&" + elemAttr.name + "=" + elemAttr.value;
                    }
                }
            }
        }
        //
        // Handle default setting for push button grids
        //		
        var GridVariants = "sPushBtnGridVariants_" + sProdRef;
        if (typeof window[GridVariants] != 'undefined') {
            sVariantSettings += "&" + window[GridVariants];
        }
        var sQuantity = "Q_" + sProdRef;
        sVariantSettings += "&" + sQuantity + "=" + document.getElementsByName(sQuantity)[0].value;
        var ajaxRequest = new ajaxObject(sURL);
        ajaxRequest.callback = function(responseText, responseStatus) {
            if (responseStatus != 200) // request returned other than OK, default too static price		
            {
                var elemPriceContainer = document.getElementById('id' + oProd.sProdRef + 'DynamicPrice');
                var elemStPriceContainer = document.getElementById('id' + oProd.sProdRef + 'StaticPrice');
                if (oProd.bOvrStaticPrice &&
                    elemStPriceContainer &&
                    !oProd.bQuantityBreak) {
                    elemStPriceContainer.style.visibility = "visible";
                    elemStPriceContainer.style.display = "";
                }
                if (elemPriceContainer) {
                    elemPriceContainer.style.display = 'none';
                    elemPriceContainer.style.visibility = 'hidden';
                }
                return;
            }
            var elemPriceExc = document.getElementById('id' + sProdRef + 'TaxExcPrice');
            var elemPriceInc = document.getElementById('id' + sProdRef + 'TaxIncPrice');
            var elemTaxMsg = document.getElementById('id' + oProd.sProdRef + 'VATMsg'); // get the tax message element (e.g Including VAT at 20%)
            if (responseText != null) {
                try {
                    var Results = responseText.parseJSON();
                    if (Results.ErrorMsg) // is there an error with quality validation?
                    {
                        if (elemTaxMsg) {
                            elemTaxMsg.style.visibility = "hidden";
                            elemTaxMsg.style.display = "none";
                        }
                        if (elemPriceExc) // display the error message instead of the price
                        {
                            elemPriceExc.innerHTML = Results.ErrorMsg;
                        } else if (elemPriceInc) {
                            elemPriceInc.innerHTML = Results.ErrorMsg;
                        }
                        return;
                    }
                    if (elemTaxMsg) {
                        elemTaxMsg.style.visibility = "visible";
                        elemTaxMsg.style.display = "";
                    }
                    var nTotalExcTax = Results.Total;
                    var nTotalIncTax = Results.Total + Results.Tax1 + Results.Tax2;
                    if (elemPriceExc) {
                        elemPriceExc.innerHTML = FormatPrices(nTotalExcTax);
                    }
                    if (elemPriceInc) {
                        elemPriceInc.innerHTML = FormatPrices(nTotalIncTax);
                    }
                } catch (e) {}
            }
        }
        //
        // If we don't supply a section ID, assume this is for a single product
        //
        var sParams = ("ACTION=GETACCPRICE&PRODREF=" + sProdRef + "&SID=" + sSID);
        sParams += sVariantSettings;
        if (sShopID) {
            sParams += '&SHOP=' + sShopID;
        }
        ajaxRequest.update(sParams, "GET");
    }
}

/***********************************************************************
 *
 * SetupChoicesAllProducts - Update the choices and prices for all products
 * in the section
 *
 * Input:	sURL - the ajax script URL to call
 *		sSID - the section ID list to be passed in to the ajax script or null if for a single product
 *		sShopID - the shop ID (only used in host mode)
 *
 ************************************************************************/

function SetupChoicesAllProducts(sURL, sSID, sShopID) {
    for (var sProdRef in g_mapProds) {
        var oProd = g_mapProds[sProdRef];
        if (oProd) {
            //
            // Get the element containing variants
            //
            var sName = 'v_' + sProdRef + '_';
            var elemVars = document.getElementById('idVars' + sProdRef);
            if (elemVars) {
                if (oProd.arrComps) // if we have components
                {
                    var arrComps = oProd.arrComps;
                    var nLength = arrComps.length;
                    for (var i = 0; i < nLength; i++) // for each one
                    {
                        var oComp = arrComps[i];
                        var sCompHTMLName = sName + oComp.nUI;
                        var elemComp = document.getElementsByName(sCompHTMLName)[0];
                        oComp.elemHTML = elemComp; // store the UI element										
                    }
                    //
                    // Store the attribute UI element
                    //
                    var mapElemAttr = GetAttributes(elemVars);
                    var arrElemAttr = mapElemAttr[sProdRef];
                    if (arrElemAttr) {
                        var nVarSuffix = parseInt(arrElemAttr[0].name.match(/_(\d+)$/)[1]);
                        var nAttrElemCount = arrElemAttr.length
                        for (var i = 0; i < nAttrElemCount; i++) {
                            var elemAttr = arrElemAttr[i];
                            nVarSuffix = parseInt(elemAttr.name.match(/_(\d+)$/)[1]);
                            var oAttr = GetAttrFromSuffix(oProd, nVarSuffix);
                            //
                            // Make sure the initial HTML elements are used before the javascript pixies
                            // do any mischief
                            //
                            if (!oAttr.elem) {
                                oAttr.elem = new CSelect(elemAttr);
                            }
                        }
                        UpdateChoices(oProd, true); // update the choices
                    }
                }
                if (!(oProd.bOvrStaticPrice &&
                        oProd.nPricingModel == PRICING_MODEL_COMPONENTS_SUM) || // only component prices used?
                    (g_mapDynPrices[oProd.sProdRef] &&
                        (g_mapDynPrices[oProd.sProdRef].Total > 0))) // dynamic price calculated by default
                {
                    UpdatePrice(oProd, sURL, sSID, sShopID); // update the price	
                }
            }
        }
    }
    g_mapDynPrices = {}; // make sure it gets reloaded for individual products
}

/***********************************************************************
 *
 * getAllDynamicPrices - Call our server script to determine the total price
 *		depending on the selection 
 *
 * Input:	sURL - the ajax script URL to call
 *		sSID - the section ID list to be passed in to the ajax script or null if for a single product
 *		sShopID - the shop ID (only used in host mode)
 *
 ************************************************************************/

function getAllDynamicPrices(sURL, sSID, sShopID) {
    //
    // In case of preview use passed in data
    //
    var bPreview = (sURL.indexOf("file://") == 0);
    if (bPreview) {
        SetupVariants(true);
        return "";
    } else {
        if (g_bStockUpdateInProgress) {
            //			
            // do not update dynamic prices when products stock update is in progress
            // note: currently selected options may be changed during stock update process
            // 
            g_bDynamicPriceUpdatePending = true;
            return "";
        }
        //
        // Get the element containing variants
        //		
        var ajaxRequest = new ajaxObject(sURL);
        ajaxRequest.callback = function(responseText, responseStatus) {
            if (responseText != null) {
                if (200 == responseStatus) {
                    try {
                        g_mapDynPrices = responseText.parseJSON();
                    } catch (e) {}
                }
                SetupChoicesAllProducts(sURL, sSID, sShopID);
            }
        }
        //
        // Get the prices for the whole section
        //
        var sParams = ("ACTION=GETALLPRICES&SID=" + sSID);
        var sVariantSettings = "";
        //
        // Add default variant settings
        //
        sVariantSettings = SetupVariants(true);
        sParams += sVariantSettings;
        if (sShopID) {
            sParams += '&SHOP=' + sShopID;
        }
        ajaxRequest.update(sParams, "GET");
        g_bDynamicPriceUpdatePending = false;
    }
}

/***********************************************************************
 *
 * SetupVariantsForProduct - sets up variants in order to use with dynamic 
 *	pricing/selection validation for a product
 *
 * Input:	sProdRef	- product reference
 *			bGetParams - if variant string should be constructed
 *
 * Returns: variant string
 *
 ************************************************************************/

function SetupVariantsForProduct(sProdRef, bGetParams) {
    var sVariantSettings = "";
    var oProd = g_mapProds[sProdRef];
    if (oProd) {
        var sName = 'v_' + sProdRef + '_';
        var elemVars = document.getElementById('idVars' + sProdRef);
        if (elemVars) {
            if (oProd.arrComps) // if we have components
            {
                var arrComps = oProd.arrComps;
                var nLength = arrComps.length;
                for (var i = 0; i < nLength; i++) // for each one
                {
                    var oComp = arrComps[i];
                    var sCompHTMLName = sName + oComp.nUI;
                    var elemComp = document.getElementsByName(sCompHTMLName)[0];
                    if (bGetParams) {
                        if (elemComp.type == 'checkbox') {
                            sVariantSettings += "&" + sCompHTMLName + "=" + (elemComp.checked ? "on" : "off");
                        } else {
                            sVariantSettings += "&" + sCompHTMLName + "=" + elemComp.value;
                        }
                    }
                    oComp.elemHTML = elemComp; // store the UI element
                }
                //
                // Store the attribute UI element
                //
                var mapElemAttr = GetAttributes(elemVars);
                var arrElemAttr = mapElemAttr[sProdRef];
                if (arrElemAttr) {
                    var nVarSuffix = parseInt(arrElemAttr[0].name.match(/_(\d+)$/)[1]);
                    var nAttrElemCount = arrElemAttr.length
                    for (var i = 0; i < nAttrElemCount; i++) {
                        var elemAttr = arrElemAttr[i];
                        nVarSuffix = parseInt(elemAttr.name.match(/_(\d+)$/)[1]);
                        var oAttr = GetAttrFromSuffix(oProd, nVarSuffix);
                        //
                        // Make sure the initial HTML elements are used before the javascript pixies
                        // do any mischief
                        //
                        if (!oAttr.elem) {
                            oAttr.elem = new CSelect(elemAttr);
                        }
                        if (bGetParams) {
                            if (document.getElementsByName(elemAttr.name)[0].type == 'radio') {
                                var oElement = document.getElementsByName(elemAttr.name)[0];
                                for (var j = 0; oElement != null;) {
                                    if (oElement.checked) {
                                        sVariantSettings += "&" + elemAttr.name + "=" + oElement.value;
                                        break;
                                    }
                                    oElement = document.getElementsByName(elemAttr.name)[++j];
                                }
                            } else {
                                sVariantSettings += "&" + elemAttr.name + "=" + elemAttr.value;
                            }
                        }
                    }
                }
            }
        }
        //
        // Handle default setting for push button grids if used
        //
        if (bGetParams) {
            var GridVariants = "sPushBtnGridVariants_" + sProdRef;
            if (typeof window[GridVariants] != 'undefined') {
                sVariantSettings += "&" + window[GridVariants];
            }
        }
    }
    return (sVariantSettings);
}

/***********************************************************************
 *
 * SetupVariants - sets up variants in order to use with dynamic pricing/
 *	selection validation
 *
 * Input:	bGetParams - if variant string should be constructed
 *
 * Returns: variant string
 *
 ************************************************************************/

function SetupVariants(bGetParams) {
    var sVariants = "";
    for (var sProdRef in g_mapProds) {
        sVariants += SetupVariantsForProduct(sProdRef, bGetParams);
    }
    return (sVariants);
}

/***********************************************************************
 *
 * GetInputElement	- Get a named INPUT element from a form
 *
 * Input: elemForm	- form element
 *			sID		- name of the input element
 *
 * Returns:	object/undefined	- named element or undefined
 *
 ************************************************************************/

function GetInputElement(elemForm, sID) {
    var collInput = elemForm.getElementsByTagName('INPUT');
    for (var nInputIndex = 0; nInputIndex < collInput.length; nInputIndex++) {
        var elemInput = collInput[nInputIndex];
        if (elemInput.name == sID) {
            return elemInput;
        }
    }
    return undefined;
}

/************************************************************************
 *
 * GetOriginalRef	- Get the product reference
 *
 * Input:	sProdRef - product reference, can be a duplicate one
 * Returns:	the product reference
 *
 ************************************************************************/

function GetOriginalRef(sProdRef) {
    var arrRef = sProdRef.split("!");
    return arrRef[arrRef.length - 1];
}

/************************************************************************
 *
 * GetProductFromMap	- Get the product from the map, even if only
 *	duplicates are present
 *
 * Input:	sProdRef - product reference, can be a duplicate one
 * Returns:	the product
 *
 ************************************************************************/

function GetProductFromMap(sProdRef) {
    //
    // If already in the map by the reference passed on, just return it
    //
    if (g_mapProds[sProdRef]) {
        return g_mapProds[sProdRef];
    }
    for (var sMapRef in g_mapProds) {
        if (GetOriginalRef(sMapRef) == sProdRef) {
            return g_mapProds[sMapRef];
        }
    }
}

/************************************************************************
 *
 * SetupDPDPickupOptions - DPD pickup options ajax call handler
 *
 * Input: oResp	- response JSON object
 *
 ************************************************************************/

function SetupDPDPickupOptions(oResp) {
    if (oResp.Error != null) {
        alert("There was an error in initializing the Collection Point Pickup service. Please select another shipping option");
        $("#idDPDShippingType3").attr('disabled', true);
        HideLoadingDialog();
        $("#idDPDShippingType1").click();
        return;
    }
    $("#map").css("left", "0");
    $("#map").css("position", "relative");
    $("#map").css("width", "100%");
    $('#map').show(); // just show the previously prepared controls
    g_mapPickupLocationsJSON = oResp; // don't have to call the service next time
    var mapDPDPickupLocations = oResp.data.results;
    var markers = [];
    markers.forEach(function(marker) {
        marker.setMap(null); // empty the map
    });
    markers = [];
    var bounds = new google.maps.LatLngBounds();
    mapDPDPickupLocations.forEach(function(location) {
        var lat = location.pickupLocation.addressPoint.latitude;
        var lng = location.pickupLocation.addressPoint.longitude;

        var myLatLng = new google.maps.LatLng(lat, lng);
        var LocationDetails = {
            "organisation": location.pickupLocation.address.organisation,
            "postcode": location.pickupLocation.address.postcode,
            "locality": location.pickupLocation.address.locality,
            "property": location.pickupLocation.address.property,
            "street": location.pickupLocation.address.street,
            "town": location.pickupLocation.address.town,
            "county": location.pickupLocation.address.county,
            "distance": Math.round(location.distance * 100) / 100,
            "disabledaccess": location.pickupLocation.disabledAccess,
            "parking": location.pickupLocation.parkingAvailable,
            "openlate": location.pickupLocation.openLate,
            "shortname": location.pickupLocation.shortName,
            "openhours": location.pickupLocation.pickupLocationAvailability.pickupLocationOpenWindow,
            "directions": location.pickupLocation.pickupLocationDirections
        };

        var marker = new google.maps.Marker({
            map: map,
            title: location.pickupLocation.address.organisation,
            position: myLatLng,
            pickupLocationCode: location.pickupLocation.pickupLocationCode,
            pickupLocationDetails: LocationDetails
        });
        markers.push(marker);
        if (!bounds.contains(myLatLng)) {
            bounds.extend(myLatLng);
        }
        marker.addListener('click', function() {
            infowindow.open(map, marker);
            infowindow.setContent(SetupInfoWindow(marker));
        });
        var sDetails = (location.pickupLocation.address.organisation != "" ? location.pickupLocation.address.organisation + "," : "") +
            (location.pickupLocation.address.property != "" ? location.pickupLocation.address.property + "," : "") +
            (location.pickupLocation.address.street != "" ? location.pickupLocation.address.street + "," : "") +
            (location.pickupLocation.address.locality != "" ? location.pickupLocation.address.locality + "," : "") +
            (location.pickupLocation.address.postcode != "" ? location.pickupLocation.address.postcode + "," : "") +
            (location.pickupLocation.address.county != "" ? location.pickupLocation.address.county + "," : "") +
            location.pickupLocation.address.town;
        g_mapCodeToDetail[location.pickupLocation.pickupLocationCode] = sDetails;
        g_mapCodeToMarker[location.pickupLocation.pickupLocationCode] = marker;
        var sOption = "<option value='" + location.pickupLocation.pickupLocationCode + "'" + ($("#idDPDPickupDefault").val() === location.pickupLocation.pickupLocationCode ? " selected" : "") + ">" + sDetails + "</option>";
        $("#idPickupSelect").append(sOption);
    });
    google.maps.event.trigger(map, "resize"); // make sure that the map is displaying properly
    map.fitBounds(bounds);
    $('#idPickupSelect').show();
    SelChangePickupLocations();
    HideLoadingDialog();
}

/************************************************************************
 *
 * SelectPickupLocation - Make a pickup location selection
 *
 * Input:	e - event object
 *			marker - marker to get the details for
 *
 ************************************************************************/

function SelectPickupLocation(e) {
    e.preventDefault();
    var oMarker = g_SelectedMarker;
    if (oMarker) {
        $("#idPickupSelect").val(oMarker.pickupLocationCode);
        $("input#idDPDPickupLocation").val(g_mapCodeToDetail[oMarker.pickupLocationCode]);
        $("#idMapBtn").text('Selected');
        $("#idMapBtn").prop('disabled', true);
    }
}

/************************************************************************
 *
 * SelChangePickupLocations -
 *
 ************************************************************************/

function SelChangePickupLocations() {
    var sCode = $("#idPickupSelect").val()
    var oMarker = g_mapCodeToMarker[sCode];
    if (oMarker) {
        $("input#idDPDPickupLocation").val(g_mapCodeToDetail[oMarker.pickupLocationCode]);
        google.maps.event.trigger(oMarker, 'click');
        $("#idMapBtn").text('Selected');
        $("#idMapBtn").prop('disabled', true);
    }
}

/************************************************************************
 *
 * ShippingTypeChanged
 *
 * Input: RadioButton value - of the button clicked
 *
 ************************************************************************/

function ShippingTypeChanged(nType) {
    switch (nType) {
        case "1": // Standard Delivery
            $('#map').hide();
            $('#idPickupSelect').hide();
            $('#idDeliveryDateFields').hide();
            $('#lstClass').prop("disabled", false);
            $("#lstClass > option").each(function() {
                if ($(this).attr("data-ship2shop")) {
                    $(this).prop("disabled", true);
                } else {
                    $(this).prop("disabled", false);
                }
            });
            $("#idSelectPickupLabel").hide();
            $('#lstClass').children('option:enabled').eq(0).prop('selected', true);
            break;
        case "2": // Specified Day delivery
            $('#map').hide();
            $('#idPickupSelect').hide();
            $('#lstClass').prop("disabled", false);
            SetupDeliveryDateList();
            FilterClassList();
            $('#idDeliveryDateFields').show();
            $("#idSelectPickupLabel").hide();
            break;
        case "3": // Collection Point Pickup
            $('#idDeliveryDateFields').hide();
            if (typeof g_mapPickupLocationsJSON.data === "undefined" &&
                typeof g_mapPickupLocationsJSON.error === "undefined") {
                ShowLoadingDialog();
                g_mapAJAXActions['GetDPDPickupLocations'] = SetupDPDPickupOptions; // add the handler function
                AddAJAXCall('GetDPDPickupLocations'); // add the call to the list
                AJAXCall();
            } else {
                $('#map').show(); // just show the previously prepared controls
                $('#idPickupSelect').show();
                SelChangePickupLocations();
            }
            $("#lstClass > option").each(function() {
                if ($(this).attr("data-ship2shop")) {
                    $(this).prop("disabled", false);
                    $('#lstClass').val(this.value);
                    $('#lstClass').prop("disabled", true);
                    return false;
                }
            });
            $("#idSelectPickupLabel").show();
            break;
    }
}

/************************************************************************
 *
 * SetupDeliveryDateList - set up available delivery dates dropdown
 *
 ************************************************************************/

function SetupDeliveryDateList() {
    var d = new Date();
    var sOption;
    var sDay, sMonth, nYear, nDayOfMonth, sDateVal;
    var bWeekend = (d.getDay() == 6) || (d.getDay() == 0); // weekend date? first available date is Tuesday
    var bFriday = (d.getDay() == 5);
    var bBeforeNoon = (d.getHours() < 12); // before noon ? next day delivery available
    $('#idDeliveryDate').empty();
    //
    // Decide the first available date
    //
    if (bWeekend ||
        (bFriday &&
            !bBeforeNoon)) {
        var nAdd = 1;
        switch (d.getDay()) {
            case 0: // Sunday
                nAdd = 2;
                break;
            case 6: // Saturday
                nAdd = 3;
                break;
            case 5: // Friday
                nAdd = 4;
                break;
        }
        d.setDate(d.getDate() + nAdd); // increment the date as appropriate
    } else if (bBeforeNoon) {
        d.setDate(d.getDate() + 1) // first day is tomorrow
    } else {
        d.setDate(d.getDate() + 2) // first day is the day after tomorrow
    }
    for (var i = 0; i < g_nMaxDays; i++) {
        sDay = aDaysOfWeek[d.getDay()];
        sMonth = aMonths[d.getMonth()];
        nYear = d.getFullYear();
        nDayOfMonth = d.getDate();
        sDateVal = nDayOfMonth + " " + sMonth + " " + nYear;
        sOption = "<option value='" + sDateVal + "'" + ($("#idDPDDateDefault").val() === sDateVal ? " selected" : "") + ">" + sDay + " " + nDayOfMonth + " " + sMonth + ", " + nYear + "</option>";
        $('#idDeliveryDate').append(sOption);
        d.setDate(d.getDate() + 1); // increment the date
    }
}

/************************************************************************
 *
 * FilterClassList - filter options based on specified delivery date
 *
 ************************************************************************/

function FilterClassList() {
    var d = new Date($('#idDeliveryDate').val());
    console.log(d.getDay());
    var dtoday = new Date();
    var bBeforeNoon = (dtoday.getHours() < 12); // before noon ? next day delivery available
    var bWeekDay = (d.getDay() < 6) && (d.getDay() > 0);
    $("#lstClass > option").each(function() {
        var bCondition = false;
        switch ($(this).attr("data-filter")) {
            case "w":
                $(this).prop("disabled", bWeekDay ? false : true); // weekdays
                break;
            case "st":
                $(this).prop("disabled", (d.getDay() == 6) ? false : true);
                break;
            case "sn":
                $(this).prop("disabled", (d.getDay() == 0) ? false : true);
                break;
            default:
                $(this).prop("disabled", true);
        }
        return true;
    });
    $('#lstClass').children('option:enabled').eq(0).prop('selected', true);
}

/************************************************************************
 *
 * SetupInfoWindow - Google Maps info window
 *
 * Input: oMarker - merker object
 *
 * Returns: the html created for the window
 *
 ************************************************************************/

function SetupInfoWindow(oMarker) {
    var oLocationDetails = oMarker.pickupLocationDetails;
    var aOpenHours = Array(7);
    var sHours = "";
    for (i = 0; i < oLocationDetails.openhours.length; i++) {
        sHours = "";
        if (aOpenHours[oLocationDetails.openhours[i].pickupLocationOpenWindowDay] != undefined) {
            var sPrevHours = aOpenHours[oLocationDetails.openhours[i].pickupLocationOpenWindowDay];
            var sEndTime = sPrevHours.substr(6);
            if (oLocationDetails.openhours[i].pickupLocationOpenWindowStartTime === sEndTime) {
                sHours = sPrevHours.substr(0, 5) + "-" + oLocationDetails.openhours[i].pickupLocationOpenWindowEndTime;
            } else {
                sHours = aOpenHours[oLocationDetails.openhours[i].pickupLocationOpenWindowDay] + "|" +
                    oLocationDetails.openhours[i].pickupLocationOpenWindowStartTime + "-" +
                    oLocationDetails.openhours[i].pickupLocationOpenWindowEndTime;
            }
        } else {
            sHours = oLocationDetails.openhours[i].pickupLocationOpenWindowStartTime + "-" +
                oLocationDetails.openhours[i].pickupLocationOpenWindowEndTime;
        }
        aOpenHours[oLocationDetails.openhours[i].pickupLocationOpenWindowDay] = sHours;
    }
    var sContent = '<div id="locationInfo">' +
        '<table style="line-height:1.3"><tr><td>' +
        '<strong>' + oLocationDetails.shortname + '</strong><br>' +
        (oLocationDetails.property != "" ? oLocationDetails.property + '<br>' : "") +
        (oLocationDetails.street != "" ? oLocationDetails.street + '<br>' : "") +
        (oLocationDetails.locality != "" ? oLocationDetails.locality + '<br>' : "") +
        (oLocationDetails.town != "" ? oLocationDetails.town + '<br>' : "") +
        (oLocationDetails.county != "" ? oLocationDetails.county + '<br>' : "") +
        oLocationDetails.postcode + '<br>';
    sContent += 'Distance:' + oLocationDetails.distance + ' miles<br>' +
        'Car Parking:' + (oLocationDetails.parking ? 'Yes' : 'No') + '<br>' +
        'Disabled Access:' + (oLocationDetails.disabledaccess ? 'Yes' : 'No') + '<br>';
    if (oLocationDetails.directions != "") {
        sContent += 'Additional directions:' + (oLocationDetails.directions) + '<br>';
    }
    sContent += '</td><td>';
    sContent +=
        '<strong>Normal opening hours:&nbsp;</strong><br>' +
        'Mon:&nbsp;' + (aOpenHours[1] != undefined ? aOpenHours[1] : "Closed") + '<br>' +
        'Tue:&nbsp;' + (aOpenHours[2] != undefined ? aOpenHours[2] : "Closed") + '<br>' +
        'Wed:&nbsp;' + (aOpenHours[3] != undefined ? aOpenHours[3] : "Closed") + '<br>' +
        'Thu:&nbsp;' + (aOpenHours[4] != undefined ? aOpenHours[4] : "Closed") + '<br>' +
        'Fri:&nbsp;' + (aOpenHours[5] != undefined ? aOpenHours[5] : "Closed") + '<br>';
    if (aOpenHours[6] != undefined) {
        sContent += 'Sat:&nbsp;' + aOpenHours[6] + '<br>';
    }
    if (aOpenHours[7] != undefined) {
        sContent += 'Sun:&nbsp;' + aOpenHours[7] + '<br>';
    }
    sContent += '</td></tr></table>';
    sContent += "<strong>Latitude:</strong>" + oMarker.position.lat().toFixed(5) + " | <strong>Longitude:</strong>" + oMarker.position.lng().toFixed(5) + "<br>";
    sContent += '<div align="center"><button class="btn btn-primary" id="idMapBtn" onclick="SelectPickupLocation(event)">Select</button></div>' +
        '</div>';
    g_SelectedMarker = oMarker;
    return sContent;
}

/************************************************************************
 *
 * SetDefaultShippingType
 *
 ************************************************************************/

function SetDefaultShippingType() {
    var nValue = $('input[name=DPDShippingType]:checked').val();
    ShippingTypeChanged(nValue);
}