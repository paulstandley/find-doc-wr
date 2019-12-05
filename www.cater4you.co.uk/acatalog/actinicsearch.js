/***************************************************************
 *
 * ActinicSearch.js	-	utility functions for search functionality
 *
 * Copyright (c) 2012-2014 SellerDeck Limited
 *
 ****************************************************************/

//--------------------------------------------------------------
//
// Common functions
//
// For example initialisation
//
//--------------------------------------------------------------
//
// Global variables for debugging
//
var g_bIsDebugging = false; // make it true for debugging
var g_ErrorCode = {
    TAG: 1, // tag not found
    LOGIC: 2, // logical error
    IO: 3, // input/output error
    UNDEFINED: 4 // global variable undefined
};
/***********************************************************************
 *
 * ShowError									- Show error message
 * Inputs: 	sMessage						- message to log
 *			nErrorType						- error type code
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ShowError(sMessage, nErrorType) {
    var sErrorType = "";
    switch (nErrorType) {
        case g_ErrorCode.TAG: // tag not found error
            sErrorType = "Tag not found error";
            break;
        case g_ErrorCode.LOGIC: // logical error
            sErrorType = "Logical error";
            break;
        case g_ErrorCode.IO: // input/output error
            sErrorType = "Input output error";
            break;
        case g_ErrorCode.UNDEFINED:
            sErrorType = "Variable undefined error";
            break;
        default: // unknown error
            sErrorType = "Unknown error";
            break;
    }
    var sError = "Error: " + sErrorType + "\nMessage: " + sMessage;
    if (g_bIsDebugging) // is debugging enabled
    {
        console.log(sError); // show error message
    }
}

/***********************************************************************
 *
 * GetIEVersion								- Get IE version
 *
 * Returns:  								- version
 *
 ************************************************************************/
function GetIEVersion() {
    var nVersion = 0; // default for other browsers
    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) // test for IE
    {
        nVersion = new Number(RegExp.$1) // get the version
    }
    return nVersion;
}

/***********************************************************************
 *
 * GetArrayIndex							- Get index of given key in an array
 *
 * Inputs:	arrInput						- input array
 *				sKey							- key to match
 *
 * Returns:									- return the matched index
 *
 ************************************************************************/
function GetArrayIndex(arrInput, sKey) {
    if (!Array.prototype.indexOf) // no indexOf defined
    {
        var nLen = arrInput.length;
        for (var nIdx = 0; nIdx < nLen; nIdx++) {
            if (arrInput[nIdx] === sKey)
                return nIdx; // match found
        }
        return -1; // no match found
    } else {
        return (arrInput.indexOf(sKey));
    }
}

/***********************************************************************
 *
 * InsertSort								- Sort array
 *
 * Inputs:	arrToStart					- array to sort
 *
 * Returns:									- sorted array
 * Ref: http://jsperf.com/
 ************************************************************************/
function InsertSort(arrToStart) {
    for (var nIdx = 1; nIdx < arrToStart.length; nIdx++) {
        var tmpVal = arrToStart[nIdx];
        var nIdxToComp = nIdx;
        while (arrToStart[nIdxToComp - 1] > tmpVal) {
            arrToStart[nIdxToComp] = arrToStart[nIdxToComp - 1];
            --nIdxToComp;
        }
        arrToStart[nIdxToComp] = tmpVal;
    }
    return arrToStart;
}

/***********************************************************************
 *
 * IsPreview									- Check if we are in page/design preview
 *
 * Returns:									- true/false
 *
 ************************************************************************/
function IsPreview() {
    if (window.location.href.indexOf('file://') == 0) // preview?
    {
        return true;
    }
    return false;
}

/***********************************************************************
 *
 * EscapeRegExp								- Escape Regular Expressions
 *
 * Inputs:	sString						- string to escape
 *
 * Returns:									- modified string
 *
 ************************************************************************/
function EscapeRegExp(sString) {
    return sString.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

//--------------------------------------------------------------
//
// Tweaks on standard functionality
//
// For example handling "Any" in multi-select UIs
//
//--------------------------------------------------------------


//--------------------------------------------------------------
//
// Auto-suggestion in search text boxes
//
//--------------------------------------------------------------
/***********************************************************************
 *
 * Based on script written by Alen Grakalic, provided by Css Globe (cssglobe.com)
 * More info @ http://cssglobe.com/post/1202/style-your-websites-search-field-with-jscss/
 *
 * Written by Jawahar Jeyaraman	
 * Note: Make sure the global variable 'pg_sSearchScript' defined in html page
 *
 ************************************************************************/
/***********************************************************************
 *
 * AutoSuggest 								- Add autosuggest functionality to search field
 *
 * Inputs: 	thisSearch					- auto suggest field
 *
 * Affects: functions added to thisSearch to implement auto-suggest
 *
 ************************************************************************/

function AutoSuggest(thisSearch) {
    //
    // The following values are incorporated into a closure that controls auto-suggest for the field
    //
    var mc_nTimerDelay = 500; // standard delay before auto-suggest kicks in
    var mc_bIsTimerOn = false; // is timer on for providing auto-suggest items
    var mc_nTimerID;
    var mc_arrPreviousSearchWords = new Array(); // previous word list
    var mc_arrUnchangedSearchWords = new Array(); // unchanged search word list
    var mc_mapUnmatchedSearchWords = {}; // unmatched word list	
    var mc_sLastSearchText = ''; // last search text
    var mc_nSelectedIndex = 0; // currently selected item in suto-suggest drop-down
    //
    // variables to define keys
    //
    var AS_KEYS = {
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        LEFTARROW: 37,
        UP: 38,
        RIGHTARROW: 39,
        DOWN: 40
    };
    //
    // Ensure the following are defined
    //	- pg_sSearchScript
    //	- thisSearch
    //
    if ((typeof(pg_sSearchScript) !== 'undefined') && thisSearch) {
        if (thisSearch.value === 'Quick Search') // clear the default text
        {
            thisSearch.value = ""; // empty the text
        }

        var mc_elASDiv = document.createElement("div"); // div that contains the AutoSuggest list
        var posX = findPosX(thisSearch);
        var posY = findPosY(thisSearch);
        posY += thisSearch.offsetHeight;
        mc_elASDiv.style.left = posX + "px";
        mc_elASDiv.style.top = posY + "px";
        var mc_elASList = document.createElement("ul"); // list of AutoSuggest words
        mc_elASList.style.display = "none";
        mc_elASDiv.className = "sf_suggestion";
        mc_elASList.style.width = thisSearch.offsetWidth + "px";
        mc_elASDiv.appendChild(mc_elASList);
        thisSearch.parentNode.appendChild(mc_elASDiv);

        /***********************************************************************
         *
         * onblur 									- Focus has been lost from this field
         *
         * Auto-suggest div is removed from the parent
         *
         ************************************************************************/
        thisSearch.onblur = function() {
            if (mc_elASDiv.parentNode === thisSearch.parentNode) // div is there?
            {
                thisSearch.parentNode.removeChild(mc_elASDiv); // remove the div tag completely
            }
        }

        /***********************************************************************
         *
         * onkeypress 								- User has pressed a key
         *
         * Input:	e 									- event for key that was pressed
         *
         ************************************************************************/
        thisSearch.onkeypress = function(e) {
            var key = thisSearch.AS_getKeyCode(e);
            if (key == AS_KEYS.ENTER && // it's the enter key
                mc_elASList.style.display != 'none' && // list is displayed currently
                mc_nSelectedIndex != 0) // and there is a selection in the list
            {
                thisSearch.AS_selectList(); // select that item
                mc_nSelectedIndex = 0;
            }
            return true;
        }

        /***********************************************************************
         *
         * onkeyup 									- User has released a key
         *
         * Inputs:	e								- event
         *
         ************************************************************************/
        thisSearch.onkeyup = function(e) {
            var key = thisSearch.AS_getKeyCode(e);
            switch (key) {
                case AS_KEYS.LEFTARROW: // ignore these
                case AS_KEYS.RIGHTARROW:
                case AS_KEYS.ENTER:
                    return false;

                case AS_KEYS.ESC: // clear list on escape
                    thisSearch.value = "";
                    mc_nSelectedIndex = 0;
                    thisSearch.AS_clearList();
                    break;

                case AS_KEYS.UP: // go up in the list
                    thisSearch.AS_navList("up");
                    break;

                case AS_KEYS.DOWN: // go down in the list
                    thisSearch.AS_navList("down");
                    break;

                default:
                    if (thisSearch.value == '') // if the text entered is now empty (perhaps Delete pressed)
                    {
                        thisSearch.AS_clearList(); // make sure list is empty
                    } else { // otherwise there's some valid input
                        thisSearch.AS_clearTimer(); // clear mc_nTimerID before starting so if user typing, we don't look for suggestions too early
                        thisSearch.AS_setTimer(mc_nTimerDelay); // set the time for a delay
                    }
                    break;
            }
        }

        /***********************************************************************
         *
         * AS_getListItems							- Get the result list
         *
         * Called on a timer to fill the list of items
         *
         ************************************************************************/
        thisSearch.AS_getListItems = function() {
            var arrSearchHits = new Array();
            var arrCurrentSearchWordsNoEmpty = new Array(); // words without empty
            var sJsonResponse = {};
            var httpRequest;
            var sCleanWordCharacterSet = pg_sSearchValidWordCharacters;
            sCleanWordCharacterSet = sCleanWordCharacterSet.replace(/([\^\$\.\*\+\?\=\!\:\|\\\/\(\)\[\]\{\}])/g, "\\$1"); // escape any regular expression characters
            var reNonWordCharacterSet = new RegExp("[^" + sCleanWordCharacterSet + "]"); // create regular expression that matches any non-word characters
            var arrCurrentSearchWords = thisSearch.value.split(reNonWordCharacterSet); // split input on non-word characters
            var sSearchText = '';
            arrCurrentSearchWordsNoEmpty.length = 0;
            //
            // clean list of words without empty
            //
            for (var i = 0; i < arrCurrentSearchWords.length; i++) {
                if (arrCurrentSearchWords[i]) {
                    arrCurrentSearchWordsNoEmpty.push(arrCurrentSearchWords[i]);
                }
            }
            var arrChangedSearchWord = thisSearch.AS_getChangedSearchWord(arrCurrentSearchWordsNoEmpty);
            sSearchText = arrChangedSearchWord[arrChangedSearchWord.length - 1];
            arrChangedSearchWord.length = 0;
            if (typeof(sSearchText) === 'undefined') {
                return;
            }
            //
            // global variable 'pg_sSearchScript' defined in html page
            //
            var sUrl = pg_sSearchScript;
            //
            // send request
            //
            var ajaxRequest = new ajaxObject(sUrl);
            ajaxRequest.callback = function(responseText) {
                if (responseText === '') {
                    return;
                }
                try {
                    sJsonResponse = responseText.parseJSON();
                } catch (e) {
                    return;
                }
                if (sJsonResponse.count != 0) {
                    arrSearchHits = sJsonResponse.words;
                    if (thisSearch.value.length > 0) {
                        thisSearch.AS_createList(arrSearchHits, arrCurrentSearchWordsNoEmpty, sSearchText, true);
                        mc_sLastSearchText = sSearchText;
                    } else {
                        thisSearch.AS_clearList();
                    }
                } else if (sSearchText) // capture unmatched words
                {
                    mc_sLastSearchText = sSearchText;
                    arrSearchHits.push(sSearchText);
                    mc_mapUnmatchedSearchWords[sSearchText] = '';
                    thisSearch.AS_createList(arrSearchHits, arrCurrentSearchWordsNoEmpty, sSearchText, false);
                }
            }
            var sParams = 'ACTION=MATCH&TEXT=' + sSearchText;
            if (IsHostMode()) {
                sParams += '&SHOP=' + pg_sShopID;
            }
            ajaxRequest.update(sParams, "GET");
            mc_arrPreviousSearchWords = arrCurrentSearchWordsNoEmpty;
            thisSearch.AS_clearTimer();
        }

        /***********************************************************************
         *
         * AS_getChangedSearchWord				- Get changed search words
         *
         * Inputs:	arrCurrentSearchWords	- current search words
         *
         * Returns:									- array of changed search words
         *
         ************************************************************************/
        thisSearch.AS_getChangedSearchWord = function(arrCurrentSearchWords) {
            var arrNewSearchWords = new Array(); // new search word list
            if (arrCurrentSearchWords.length > 0) {
                for (var i = 0; i < arrCurrentSearchWords.length; i++) {
                    if (thisSearch.AS_findFromArray(mc_arrPreviousSearchWords, arrCurrentSearchWords[i])) {
                        mc_arrUnchangedSearchWords.push(arrCurrentSearchWords[i]);
                    } else {
                        arrNewSearchWords.push(arrCurrentSearchWords[i]);
                    }
                }
            }
            return arrNewSearchWords;
        }

        /***********************************************************************
         *
         * AS_createList							- Create auto suggest list
         * Inputs: 	arrSearchHits 				- search hits
         *			arrCurrentSearchWords		- current search words
         *			sSearchText						- active search word
         *			bMatchFound						- match found?
         *
         * Returns:									- nothing
         *
         ************************************************************************/
        thisSearch.AS_createList = function(arrSearchHits, arrCurrentSearchWords, sSearchText, bMatchFound) {
            thisSearch.AS_resetList();
            if (arrSearchHits.length > 0) {
                for (var i = 0; i < arrSearchHits.length; i++) {
                    var elListItem = document.createElement("li");
                    elListItem.className = "notselected";
                    var elAnchor = document.createElement("a");
                    elAnchor.href = "javascript:void(0);";
                    elAnchor.m_nIndex = i + 1;
                    var sFormatedSearchHit = sSearchText + "<b>" + arrSearchHits[i].substr(sSearchText.length) + "</b>"; // format the search hit
                    if (!bMatchFound) {
                        elAnchor.innerHTML = "<strike>" + sFormatedSearchHit + "</strike>";
                    } else {
                        elAnchor.innerHTML = sFormatedSearchHit;
                    }
                    elListItem.m_nIndex = i + 1;

                    /***********************************************************************
                     *
                     * onmouseover - override mouse over to highlight list item
                     *
                     ************************************************************************/
                    elListItem.onmouseover = function() {
                        thisSearch.AS_navListItem(this.m_nIndex);
                    }

                    /***********************************************************************
                     *
                     * onmousedown - when clicked, select this item
                     *
                     ************************************************************************/
                    elAnchor.onmousedown = function() {
                        mc_nSelectedIndex = this.m_nIndex;
                        thisSearch.AS_selectList(this.m_nIndex);
                        return false;
                    }

                    //
                    // Add to the overall list
                    //
                    elListItem.appendChild(elAnchor);
                    mc_elASList.setAttribute("tabindex", "-1");
                    mc_elASList.appendChild(elListItem);
                }
                mc_elASList.style.display = "block";
            } else {
                thisSearch.AS_clearList();
            }
        }

        /***********************************************************************
         *
         * AS_resetList								- Resetting the created auto suggest list
         *
         ************************************************************************/
        thisSearch.AS_resetList = function() {
            var elListItem = mc_elASList.getElementsByTagName("li");
            var nLen = elListItem.length;
            for (var i = 0; i < nLen; i++) {
                mc_elASList.removeChild(elListItem[0]);
            }
        }

        /***********************************************************************
         *
         * AS_navList 								- Navigation (up/down) of list
         *
         * Inputs: 	dir 							- direction of navigation
         *
         ************************************************************************/
        thisSearch.AS_navList = function(dir) {
            mc_nSelectedIndex += (dir == "down") ? 1 : -1;
            var elListItem = mc_elASList.getElementsByTagName("li");
            if (mc_nSelectedIndex < 1) {
                mc_nSelectedIndex = elListItem.length;
            }
            if (mc_nSelectedIndex > elListItem.length) {
                mc_nSelectedIndex = 1;
            }
            thisSearch.AS_navListItem(mc_nSelectedIndex);
        }

        /***********************************************************************
         *
         * AS_navListItem							- List navigation and selection
         *
         * Inputs: 	index 						- list index to select
         *
         ************************************************************************/
        thisSearch.AS_navListItem = function(index) {
            mc_nSelectedIndex = index;
            var elListItem = mc_elASList.getElementsByTagName("li");
            for (var i = 0; i < elListItem.length; i++) {
                elListItem[i].className = (i == (mc_nSelectedIndex - 1)) ? "selected" : "notselected";
            }
        }

        /***********************************************************************
         *
         * AS_selectList 							- Selects item from the auto-suggest and clears the list
         *
         ************************************************************************/
        thisSearch.AS_selectList = function() {
            var elListItem = mc_elASList.getElementsByTagName("li");
            var elAnchor = elListItem[mc_nSelectedIndex - 1].getElementsByTagName("a")[0];
            //
            // Tidy up the selected text
            //
            var sSelectedText = elAnchor.innerHTML.replace(/(<strike>(.*)<\/strike>)|(<[^>]+>)/g, "");
            var sSearchValue = '';
            for (var nSrchIndx = 0; nSrchIndx < mc_arrPreviousSearchWords.length; nSrchIndx++) {
                if (typeof(mc_mapUnmatchedSearchWords[mc_arrPreviousSearchWords[nSrchIndx]]) !== 'undefined') {
                    continue;
                }
                if (mc_arrPreviousSearchWords[nSrchIndx] === mc_sLastSearchText) {
                    sSearchValue += sSelectedText + ' '; // append selected text
                } else {
                    sSearchValue += mc_arrPreviousSearchWords[nSrchIndx] + ' ';
                }
            }
            thisSearch.value = sSearchValue;
            thisSearch.AS_clearList();
        }

        /***********************************************************************
         *
         * AS_clearList								- Clears the auto-suggest list
         *
         ************************************************************************/
        thisSearch.AS_clearList = function() {
            if (mc_elASList) {
                mc_elASList.style.display = "none";
                selectedIndex = 0;
            }
            mc_arrPreviousSearchWords.length = 0;
        }

        /***********************************************************************
         *
         * AS_getKeyCode 							- Get the keycode
         *
         * Inputs: 	e								- event
         *
         * Returns:  code							- key code
         *
         ************************************************************************/
        thisSearch.AS_getKeyCode = function(e) {
            var code;
            if (!e) // if IE mode
            {
                var e = window.event; // use global window.event object
            }
            if (e.keyCode) // check again - code there?
            {
                code = e.keyCode; // use that
            }
            return code;
        }

        /***********************************************************************
         *
         * AS_findFromArray 						- Find the value from the given array
         *
         * Inputs: 	arrInputArray 				- input array
         *				objToFind					- object to find
         *
         * Returns:	true if found
         *
         ************************************************************************/
        thisSearch.AS_findFromArray = function(inputArray, textToFind) {
            for (var i = 0; i < inputArray.length; i++) {
                if (inputArray[i] == textToFind) {
                    return true;
                }
            }
            return false;
        }

        /***********************************************************************
         *
         * AS_setTimer 								- start AutoSuggest timer
         *
         * Inputs: 	nTime							- time in milliseconds
         *
         ************************************************************************/
        thisSearch.AS_setTimer = function(nTime) {
            if (!mc_bIsTimerOn) {
                mc_nTimerID = setTimeout(thisSearch.AS_getListItems, nTime); // start executing the function after 'nTime' ms 
                mc_bIsTimerOn = true; // set the mc_nTimerID
            }
        }

        /***********************************************************************
         *
         * AS_clearTimer							- Clear AutoSuggest timer
         *
         * Returns:									- nothing
         *
         ************************************************************************/
        thisSearch.AS_clearTimer = function() {
            if (mc_bIsTimerOn) {
                clearTimeout(mc_nTimerID); // clear the mc_nTimerID 
                mc_bIsTimerOn = false; // reset the mc_nTimerID
            }
        }
    }
}

/***********************************************************************
 *
 * AddAutoSuggest							- Add autosuggest functionality
 *
 * Returns:  								- nothing
 *
 ************************************************************************/

function AddAutoSuggest() {
    if (IsPreview()) // preview?
    {
        return;
    }
    if (typeof(pg_sSearchScript) === "undefined" || pg_sSearchScript === '') {
        //
        // Update to user
        //
        var sErrorMsg = "Variable \"pg_sSearchScript\" undefined OR null, autosuggest may not work";
        ShowError(sErrorMsg, g_ErrorCode.UNDEFINED);
        return;
    }
    //
    // add auto suggest for all form fields named as 'SS'
    // NOTE: change field name 'SS' appropriately if needed
    //
    for (var nIndex = 0; nIndex < document.forms.length; nIndex++) {
        if (document.forms[nIndex] && document.forms[nIndex].SS) {
            document.forms[nIndex].SS.setAttribute('autocomplete', 'off');
            document.forms[nIndex].SS.setAttribute('onfocus', 'AutoSuggest(this)');
        }
    }
}

//--------------------------------------------------------------
//
// In-place updating of search results
//
//--------------------------------------------------------------
//
// Call functions onready
//
$(document).ready(function() {
    AddAutoSuggest();
    AddOnFilter();
    CheckHashChangeEvent();
});

//
// Global variables
//
var g_eResultLayout = { // result layout type
    STD: 1, // standard layout
    TABULAR: 2, // tabular layout
    UNDEFINED: 3 // layout variable undefined
};
var gArrSortedProductRefs = new Array(); // sorted product references alone
var gArrResultSet = new Array(); // result set containing decorated product refs
var gArrayDefinedPropertiesSorted = new Array(); // sorted defined properties for the current page
var gArrProperty = new Array(); // array of properties
var gArrFilterGrpIdSorted = new Array(); // array of sorted filter group ids
var gMapObjProductDetails = {}; // map product details with ProdRef as key
var gMapPropIdDecoratedChoices = {}; // map of property id to decorated choices
var gMapInvalidProdRefs = {}; // map of prod refs marked as invalid 
var gMapInvalidEmptyPermsProdRefs = {}; // map of prod refs with empty permutations marked as invalid 
var gMapPropNameToPropId = {}; // map of prop name to prop id
var gMapFilterGrpIdToFilterGrpName = {}; // map of property id to prop name
var gMapParams = {}; // map of url paramters, updated whenever needed
var gMapProdRefToDecProdRef = {}; // map of product refs to decorated products refs
var g_sSearchResultsTemplate = ''; // search result template
var g_sListStartTemplate = ''; // list start template
var g_sListRowStartTemplate = ''; // row template
var g_sListCellStartTemplate = ''; // cell start template (say <td>)
var g_sListCellEndTemplate = ''; // cell end template
var g_sListRowEndTemplate = ''; // row end template
var g_sListEndTemplate = ''; // list end template
var g_sResultLayout = g_eResultLayout.UNDEFINED; // result layout type
var g_nListColCount = 0; // no of columns in the result list
var gMapAltProdToParentProductRef = {}; // map of alternate product ref to parent product reference
var gMapProdToAltProdArray = {};
var gMapMatchedProducts = {};
var g_sDefinedPropertiesPattern; // defined properties pattern
var gMapRefStock = {}; // map of product reference to stock
var gMapChildToParentProducts = {}; // map of child product to parent
//
// Initialize the global arrays
//
gArrSortedProductRefs.length = 0;
gArrResultSet.length = 0;
//
// Globals variables for result pagination
//
var g_nProductMinIndex = 0; // product minimum index number
var g_nProductMaxIndex = 0; // product maximum index number
var g_nCurrenPageNumber = 0; // current search result page number
var g_nIEVersion = 0; // holds IE version, 0 for any other browser
//
// Filter timer variables
//
var g_eFilterTimer = { // enum for filter timer
    Cache: 1, // filter from cache
    Server: 2, // filter from server
    UNDEFINED: 3 // undefined
};
var g_hFilterTimer; // filter timer handler
var g_bFilterTimerOn = false; // flag to check filter timer
//
// Filter count variables
//
var g_bFirstLoad = false; // first time loaded?
var g_bCacheStock = true; // cache stock filter
var g_bClearAll = false; // clear all?
var g_bHasPresetOptions = false; // has preset filter options?
//
// Filter storage variables
//
var g_bUseStorageFromClick = false; // use storage when selecting filter options
var g_bUseStorageSortPage = false; // use storage when sorting and pagination
var g_bSortOrder = ''; // sort order
var g_eFilterSettings = { // enum for filter settings
    FILTER: 1, // filter setting
    SORTORDER: 2, // sort order setting
    PAGINATION: 3 // pagination setting
};

/***********************************************************************
 *
 * AddOnFilter								- Add OnFilter call dynamically
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function AddOnFilter() {
    if (IsPreview()) // preview?
    {
        return;
    }
    var filterForm = document.forms['filter'];
    if (typeof(filterForm) === "undefined") {
        return;
    }
    if (typeof(pg_sSearchScript) === "undefined" || pg_sSearchScript === '') {
        // Update to user
        var sErrorMsg = "Variable \"pg_sSearchScript\" undefined OR null, filtering may not work";
        ShowError(sErrorMsg, g_ErrorCode.UNDEFINED);
        return;
    }
    g_nIEVersion = GetIEVersion(); // get IE version
    //
    // Loop through the form elements and add dynamic filter call for the 
    // required elements alone
    // Below are the supported elements
    // 		- INPUT (Checkbox Or radio button)
    //		- SELECT (Different list controls)
    //
    var filterFormElements = document.forms['filter'].elements; // filter form elements
    for (var nIndex = 0; nIndex < filterFormElements.length; nIndex++) {
        if (filterFormElements[nIndex].tagName === 'INPUT' && // input element?
            (filterFormElements[nIndex].type === 'radio' || filterFormElements[nIndex].type === 'checkbox')) {
            filterFormElements[nIndex].setAttribute('onclick', 'OnFilter(this);');
        } else if ((filterFormElements[nIndex].tagName === 'INPUT') &&
            (filterFormElements[nIndex].type === 'submit')) {
            filterFormElements[nIndex].setAttribute('onclick', 'OnFilter(this, "link", false); return false;');
        }
    }
    //
    // Intercept the sorting form controls.
    //
    var elSelectSortOrder = GetSelectWithinSortForm('filter_sortorder');
    if (elSelectSortOrder) {
        elSelectSortOrder.setAttribute('onchange', 'OnSort(this);'); // handle sort locally
    }
    //
    // When loaded from a static page there is a duplicate that we have to handle differently
    //
    elSelectSortOrder = GetSelectWithinSortForm('filter_sortorder_static');
    if (elSelectSortOrder) {
        elSelectSortOrder.setAttribute('onchange', 'OnSortStatic(this);'); // handle sort locally - using special function that copies the index to other form
    }
    //
    // Get the search result element globally
    //
    if (typeof(filterForm) !== "undefined") {
        var sSearchResultElement = document.getElementById('SearchResults');
        if (sSearchResultElement) {
            g_sSearchResultsTemplate = sSearchResultElement.innerHTML; // get the search result template
            g_sSearchResultsTemplate = g_sSearchResultsTemplate.replace(/(<actinic:xmltemplate name=\"ImageLine\">((.*?)|(.*?(\n))+.*?)<\/actinic:xmltemplate>)/ig, '');
            //
            // Substitute appropriate tags for product links in result template
            //
            g_sSearchResultsTemplate = g_sSearchResultsTemplate.replace(/(<script(\s*)type=\"text\/template\">([^`]*?)<\/script>)/ig, '$3');
            //
            // Replace any custome scripts inlcuded in the template
            // Example: <script type="text/template"><sd_script language="javascript" type="text/javascript">document.write('Hello');</sd_script></script>
            //
            g_sSearchResultsTemplate = g_sSearchResultsTemplate.replace(/(<sd_script)/ig, '<script');
            g_sSearchResultsTemplate = g_sSearchResultsTemplate.replace(/(<\/sd_script)/ig, '</script');
        } else {
            // Update to user
            var sErrorMsg = "Element with id \"SearchResults\" not found in result template, search might not work properly";
            ShowError(sErrorMsg, g_ErrorCode.TAG);
        }
        g_sResultLayout = GetResultLayoutUsed();
        //
        // Get all tabular template and cache
        //
        if (g_sResultLayout === g_eResultLayout.TABULAR) // tabular list used
        {
            var sListStartElement = '';
            var sListRowStartElement = '';
            var sListCellStartElement = '';
            var sListCellEndElement = '';
            var sListRowEndElement = '';
            var sListEndElement = '';
            sListStartElement = document.getElementById('S_LISTSTART');
            sListRowStartElement = document.getElementById('S_LISTROWSTART');
            sListCellStartElement = document.getElementById('S_LISTCELLSTART');
            sListCellEndElement = document.getElementById('S_LISTCELLEND');
            sListRowEndElement = document.getElementById('S_LISTROWEND');
            sListEndElement = document.getElementById('S_LISTEND');
            if (sListStartElement) {
                g_sListStartTemplate = sListStartElement.innerHTML;
                g_sListStartTemplate = g_sListStartTemplate.replace(/(&lt;)/ig, '<');
                g_sListStartTemplate = g_sListStartTemplate.replace(/(&gt;)/ig, '>');
            }
            if (sListRowStartElement) {
                g_sListRowStartTemplate = sListRowStartElement.innerHTML;
                g_sListRowStartTemplate = g_sListRowStartTemplate.replace(/(&lt;)/ig, '<');
                g_sListRowStartTemplate = g_sListRowStartTemplate.replace(/(&gt;)/ig, '>');
            }
            if (sListCellStartElement) {
                g_sListCellStartTemplate = sListCellStartElement.innerHTML;
                g_sListCellStartTemplate = g_sListCellStartTemplate.replace(/(&lt;)/ig, '<');
                g_sListCellStartTemplate = g_sListCellStartTemplate.replace(/(&gt;)/ig, '>');
            }
            if (sListCellEndElement) {
                g_sListCellEndTemplate = sListCellEndElement.innerHTML;
                g_sListCellEndTemplate = g_sListCellEndTemplate.replace(/(&lt;)/ig, '<');
                g_sListCellEndTemplate = g_sListCellEndTemplate.replace(/(&gt;)/ig, '>');
            }
            if (sListRowEndElement) {
                g_sListRowEndTemplate = sListRowEndElement.innerHTML;
                g_sListRowEndTemplate = g_sListRowEndTemplate.replace(/(&lt;)/ig, '<');
                g_sListRowEndTemplate = g_sListRowEndTemplate.replace(/(&gt;)/ig, '>');
            }
            if (sListEndElement) {
                g_sListEndTemplate = sListEndElement.innerHTML;
                g_sListEndTemplate = g_sListEndTemplate.replace(/(&lt;)/ig, '<');
                g_sListEndTemplate = g_sListEndTemplate.replace(/(&gt;)/ig, '>');
            }
        }
        ResetSortOrder(); // reset the sort order
    }
    CacheProperties(); // cache the properties defined
    CacheFilterSections(); // cahce filter sections
    CacheDefinedPriceBands(); // cache defined price bands
    CachePriceBandPriceRange(); // cache defined price range
    CacheDefinedChoices(); // cache defined choices	
    SetDefaultSelection(); // set default selections
    SortFilterGroup(); // sort filter group
    g_bHasPresetOptions = HasPresetFilterOptions(); // has preset filter options defined?
    SetSelectionMapsFromStorage(); // set the selection map from storage settings
    SetStoredPageNumber(); // set the page number
    if (IsFilterCountEnabled()) {
        //
        // Filter products for count alone
        //
        OnFilter(null, null, true); // filter only for count
    } else {
        GenerateDynamicFilterOptions(); // generate dynamic filter options
        if (IsFilterAsDefaultView()) {
            OnFilter(null, null, true); // filter only for count
        } else {
            OnFilter(null, null, false); // filter only for result
        }
    }
    HideModifyStaticControls(); // hide/modify static controls
}

/***********************************************************************
 *
 * HasFilterStorage						- Check if the page has the filter settings 
 *													stored
 *
 * Returns:  								- true/false
 *
 ************************************************************************/
function HasFilterStorage() {
    var sStoredFilterSettings = SDStorage.readPage('filterSettings');
    if (sStoredFilterSettings === null || sStoredFilterSettings === '') {
        return false;
    }
    return true;
}

/***********************************************************************
 *
 * IsUseFilterStorage						- Check if we can use filter storage settings
 *
 * Returns:  								- true/false
 *
 ************************************************************************/
function IsUseFilterStorage() {
    //
    // Check if the URL has the hash 'usestorage'
    //
    if (window.location.hash.search('usestorage') == -1) {
        return false;
    }
    return true;
}

/***********************************************************************
 *
 * CacheProperties							- Cache defined properties
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CacheProperties() {
    for (var nPropIndx = 0; nPropIndx < pg_arrayPropertyName.length; nPropIndx++) {
        if (typeof(pg_arrayPropertyName[nPropIndx]) !== "undefined") {
            var sProperty = pg_arrayPropertyName[nPropIndx].replace(/(&#95;)/g, "_"); // replace the encoded character
            var sPropIdPropName = sProperty.split(':');
            var sPropId = sPropIdPropName[0];
            var sPropName = sPropIdPropName[1];
            var sDataType = sPropId.substr(sPropId.lastIndexOf('_') + 1);
            var sDecPropName = (sPropName + '_' + sDataType).toUpperCase();
            gMapPropNameToPropId[sDecPropName] = sPropId; // property name to property id map
            gMapFilterGrpIdToFilterGrpName[sPropId] = sDecPropName; // property id to property name map
            gArrFilterGrpIdSorted.push(sPropId);
            gArrayDefinedPropertiesSorted.push(sDecPropName);
            gArrProperty.push(sPropId); // global property array
        }
    }
    InsertSort(gArrayDefinedPropertiesSorted); // sort properties
    g_sDefinedPropertiesPattern = '-' + gArrayDefinedPropertiesSorted.join('--') + '-';
}

/***********************************************************************
 *
 * SortFilterGroup							- Sort the filter group
 *
 ************************************************************************/
function SortFilterGroup() {
    InsertSort(gArrFilterGrpIdSorted);
}

/***********************************************************************
 *
 * GetSelectWithinSortForm				- Get select element within a sort form
 *
 * Inputs:	sFormName					- form name
 *
 * Returns:  								- SELECT element, or null if not found
 *
 ************************************************************************/

function GetSelectWithinSortForm(sFormName) {
    var filterSortOrderForm = document.forms[sFormName];
    if (typeof(filterSortOrderForm) !== "undefined") {
        var filterSortOrderFormElements = filterSortOrderForm.elements;
        if (typeof(filterSortOrderFormElements) !== "undefined") {
            for (var nIndex = 0; nIndex < filterSortOrderFormElements.length; nIndex++) {
                if (filterSortOrderFormElements[nIndex].tagName === 'SELECT') // select element?
                {
                    return filterSortOrderFormElements[nIndex];
                }
            }
        }
    }
    return null;
}

/***********************************************************************
 *
 * OnFilter									- Filtering functionality
 *
 * Inputs: 	element						- current element
 *				sControl						- control type
 *				bOnload						- onload for the first time?
 *				bClearAll					- clear all?
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function OnFilter(element, sControl, bOnload, bClearAll) {
    var sParams = ''; // filtering parameters
    var filterForm = document.forms['filter']; // to be modified if different filter form is used
    //
    // Added new parameter to store up and retrieve filter settings
    //
    if (typeof(element) !== "undefined" && element !== null) {
        AppendUseStorageHash(g_eFilterSettings.FILTER);
    }
    if (g_bUseStorageFromClick) {
        ResetAllStorage();
        g_bUseStorageFromClick = false;
    }
    ResetSortOrder();
    if (typeof(element) !== "undefined" && element !== null) {
        if (g_nCurrenPageNumber != -1) {
            SetCurrentPageNumber(0);
        }
    }
    //
    // Add other default params needed for filtering
    //
    if (bOnload) {
        g_bFirstLoad = true; // loaded
    } else {
        g_bFirstLoad = false;
    }
    if (bClearAll) // set/unset the clear all functionality
    {
        g_bClearAll = true;
    } else {
        g_bClearAll = false;
    }
    if (!g_bFirstLoad) {
        ClearCtrlSelectionMap(); // clear control selection map		
    }
    ClearURLParamCache(); // clear the URL parameter cache
    ShowLoadingDialog(); // show the loading dialog
    sParams += 'PAGE=' + 'DynamicFilter' + '&'; // parameter representing dynamic filter
    //
    // Handling of clickable links
    //
    if ((typeof(element) !== "undefined") &&
        (typeof(sControl) !== "undefined" && sControl === "link") &&
        (!g_bFirstLoad) &&
        (element.id !== 'update_lnk' && element.id !== 'update_btn') // when is not update link or button
    ) {
        var sInputId = "hf_" + element.name;
        var sInputClickableLinkElement = '';
        sInputClickableLinkElement = document.getElementById(sInputId);
        if (sInputClickableLinkElement) {
            sInputClickableLinkElement.parentNode.removeChild(sInputClickableLinkElement); // remove the input with the name starts with "hf_"
        }
        var inputName = '';
        if (element.name === 'PR') {
            inputName = "hf_PR";
        } else if (element.name === 'SX') {
            inputName = "hf_SX";
        } else {
            inputName = "hf_" + element.id;
        }

        //
        // Tweaks for IE as setting of name attribute is not working
        //
        var input = '';
        if ((g_nIEVersion < 9) && (g_nIEVersion !== 0)) // if IE and version < 9
        {
            input = document.createElement('<input name="' + inputName + '">');
        } else {
            input = document.createElement('input');
            input.name = inputName;
        }
        input.id = "hf_" + element.name; // add id to hidden parameter if not price band
        input.type = "hidden";
        input.value = element.value;
        element.parentNode.appendChild(input); // add new input tag for the clicked link
        //
        // Edit the clickable links
        //
        if (element.parentNode !== null) // NOTE: the parent node must not be modified from layout
        {
            var parentLI = GetParent('li', element);
            EditLabel(parentLI);
        }
    }
    ReadFilterParamsFromPage(); // read filter form page

    if (IsFilterCountEnabled()) {
        HideOptionAny(); // hide option before hand
    }
    ClearButtonHandler(); // handle clear button
    if ((IsFilterCountEnabled() || IsFilterAsDefaultView()) && (!g_bFirstLoad)) {
        ClearFilterTimer();
        SetFilterTimer(g_eFilterTimer.Cache);
    } else {
        //
        // Do not send filter request when 'Clear All' button clicked or 
        // accessed directly/indirectly
        //
        if ((!g_bFirstLoad) && (g_bClearAll || (GetClearButtonCount() < 1))) // clear all?
        {
            HideLoadingDialog();
            return; // no operation
        }
        if (g_bFirstLoad && g_bCacheStock) {
            CacheStockFilter(); // cache stockfilter
        }
        //
        // 1. Get all products during onload
        // 2. Do always send filtering request from server when count OR filter default 
        //	   is not enabled
        //			
        sParams += GetURLParam(g_bClearAll); // get url parameter string
        //
        // Shop id for host mode
        //
        if (IsHostMode()) {
            sParams += 'SHOP=' + pg_sShopID + '&';
        }
        //
        // current filtering section ID
        //
        if (IsFilterCountEnabled() || IsFilterAsDefaultView()) {
            sParams += 'SID=' + pg_nCurrentFilterSectionID + '&';
        }
        //
        // Add default action parameter
        //
        if (filterForm.Action) // action name
        {
            var fieldValue = filterForm.Action.value;
            sParams += 'Action' + '=' + fieldValue;
        }
        ClearFilterTimer();
        SetFilterTimer(g_eFilterTimer.Server, sParams);
    }
}

/***********************************************************************
 *
 * ReadFilterParamsFromPage				- Read filter parameters from page and cache 
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ReadFilterParamsFromPage() {
    //
    // Get other dynamic filter parameters
    //
    var filterForm = document.forms['filter']; // to be modified if different filter form is used
    var filterFormElements = filterForm.elements; // filter form elements
    for (var nIndex = 0; nIndex < filterFormElements.length; nIndex++) {
        //
        // Reset the URL parameters
        //
        var sControlId = ''; // control id used
        var sValue = ''; // control value
        var sListParams = ''; // list params		
        var bIncludeParam = false; // whether include param?
        var fieldName = ''; // field name
        var fieldValue = ''; // field value
        var bIncludeListBoxParams = false; // whether include list param?
        //
        // Select appropriate filtering elements and enable them for 
        // filtering
        //
        if ((filterFormElements[nIndex].tagName === 'INPUT') && // input element?
            ((filterFormElements[nIndex].type === 'checkbox') || (filterFormElements[nIndex].type === 'radio')) // checkbox or radio button
        ) {
            if (filterFormElements[nIndex].checked === true) // is checked?
            {
                fieldName = filterFormElements[nIndex].name;
                fieldValue = filterFormElements[nIndex].value;
                if (fieldName === 'SX') {
                    sControlId = fieldValue;
                } else {
                    sControlId = filterFormElements[nIndex].id;
                    sValue = filterFormElements[nIndex].value;
                }
                bIncludeParam = true;
            } else {
                bIncludeParam = false;
            }
        } else if ((filterFormElements[nIndex].tagName === 'INPUT') && // input element?
            ((filterFormElements[nIndex].type === 'hidden') && // hidden parameter
                (filterFormElements[nIndex].name !== "PAGE") && // PAGE parameter will not be added
                (filterFormElements[nIndex].name !== "FILTERPAGE") && // FILTERPAGE parameter will not be added
                (filterFormElements[nIndex].name !== "ACTINIC_REFERRER") && // ACTINIC_REFERRER parameter will not be added
                (filterFormElements[nIndex].name !== "Action") && // Action parameter will not be added
                (filterFormElements[nIndex].name.match(/hf_/g) === null)) // hidden parameter for clickable link
        ) {
            fieldName = filterFormElements[nIndex].name;
            fieldValue = filterFormElements[nIndex].value;
            bIncludeParam = true;
        } else if (filterFormElements[nIndex].tagName === 'SELECT') // select element?
        {
            var currentElement = filterFormElements[nIndex];
            sListParams = GetSelections(currentElement); // get the selected item
            bIncludeParam = false;
            bIncludeListBoxParams = true; // include list parameters
        } else if ((filterFormElements[nIndex].tagName === 'INPUT') &&
            (filterFormElements[nIndex].type === 'hidden')) {
            if (filterFormElements[nIndex].name.substr(0, 3) === 'hf_') // tweaks for IE
            {
                var tmpFieldName = filterFormElements[nIndex].name.substr(3, filterFormElements[nIndex].name.length);
                fieldName = tmpFieldName.split('-')[0];
                fieldValue = filterFormElements[nIndex].value;
                if (fieldName === "PR" || fieldName === "SX") {
                    sControlId = fieldValue; // add control id
                } else {
                    sControlId = tmpFieldName; // add control id
                    sValue = fieldValue; // add the field value
                }
                bIncludeParam = true;
            }
        } else {
            bIncludeParam = false;
        }
        //
        // Construct the required parameters
        //
        if (bIncludeParam) {
            var tmpFieldValue = encodeURIComponent(fieldValue).replace(/!|'|\(|\)|\*|%20|%C2/g, function(x) {
                return {
                    "!": "%21",
                    "'": "%27",
                    "(": "%28",
                    ")": "%29",
                    "*": "%2A",
                    "%20": "+",
                    "%C2": ""
                }[x];
            });
            if (!g_bFirstLoad) {
                GetControlSelections(fieldName, sControlId, sValue); // fill the control selection map			
            }
            CacheURLParams(fieldName, tmpFieldValue);
        }
    }
}

/***********************************************************************
 *
 * ClearButtonHandler						- Clear button handler
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ClearButtonHandler() {
    for (var sFilterGroup in gMapFilters) // for each filter group
    {
        var bShow = IsShowClearButton(sFilterGroup); // check if clear to show
        ShowHideClearButton(bShow, sFilterGroup); // show/hide clear button		
    }
}

/***********************************************************************
 *
 * SetFilterTimer							- Set filter timer
 *
 * Inputs: 	eFilterTimer				- enum for filter timer
 *				sParams						- url parameters
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function SetFilterTimer(eFilterTimer, sParams) {
    if (!g_bFilterTimerOn) {
        g_hFilterTimer = setTimeout(
            function() {
                if (eFilterTimer === g_eFilterTimer.Cache) {
                    FilterProductsFromCache(); // filter within cached data
                } else if (eFilterTimer === g_eFilterTimer.Server) {
                    FilterProductsFromServer(sParams); // filter from server
                }
            }, 25 // need for browser to update UI
        );
        g_bFilterTimerOn = true; // set the timer flag
    }
}

/***********************************************************************
 *
 * ClearFilterTimer						- Reset filter timer
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ClearFilterTimer() {
    if (g_bFilterTimerOn) {
        clearTimeout(g_hFilterTimer); // clear the g_hFilterTimer 
        g_bFilterTimerOn = false; // reset the timer flag
    }
}

/***********************************************************************
 *
 * FilterProductsFromServer				- Filter products by sending the Ajax request
 *
 * Inputs:	sParams						- URL paramters
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function FilterProductsFromServer(sParams) {
    if ((typeof(pg_bFilteringCacheEnabled) !== "undefined") &&
        (pg_bFilteringCacheEnabled !== 0) &&
        (IsFilterCountEnabled() || IsFilterAsDefaultView())) {
        var xmlHttpClient = new XMLHttpRequest();
        var sCacheFileName = "AjaxProductList_" + pg_nUploadReferenceNumber + "_" + pg_nCurrentFilterSectionID + ".js"
        try {
            xmlHttpClient.open("GET", GetFilterCacheURL(sCacheFileName), false);
            xmlHttpClient.send();
            if ((xmlHttpClient.status === 200) || (xmlHttpClient.status === 304)) {
                var arrayJSONResponse = {};
                try {
                    arrayJSONResponse = xmlHttpClient.responseText.parseJSON();
                } catch (e) {
                    GetProductListFromServer(sParams);
                    return;
                }
                if (arrayJSONResponse.ProductSearchResults.ResultCount != 0) // match found
                {
                    gArrResultSet.length = 0;
                    gArrResultSet = arrayJSONResponse.ProductSearchResults.ResultSet;
                    var sSortOrder = GetSortOrder(); // get the sort order
                    DoSort(sSortOrder, gArrResultSet); // sort product references
                    RetrieveProductDetails(g_nCurrenPageNumber, true); // get product details
                } else // no match found
                {
                    if (!g_bFirstLoad || IsFilterAsDefaultView()) {
                        FormatResultHTML(false, null, null, false); // format the result
                    }
                }
                HideLoadingDialog();
                return;
            }
        } catch (e) {}
    }
    GetProductListFromServer(sParams);
}

/***********************************************************************
 *
 * GetProductListFromServer	- retrieves the product list thru AJAX call
 *
 * Input:	sParams - URL paramters
 *
 * Returns:  		- nothing
 *
 ************************************************************************/

function GetProductListFromServer(sParams) {
    //
    // Send Ajax request
    // NOTE: make sure the variable 'pg_sSearchScript' is declared in the HTML
    //
    var sUrl = pg_sSearchScript;
    var ajaxRequest = new ajaxObject(sUrl);
    ajaxRequest.callback = function(responseText) {
        if (responseText === '') {
            return;
        }
        var arrayJSONResponse = {};
        try {
            arrayJSONResponse = responseText.parseJSON();
        } catch (e) {
            ShowJSONError(e); // show json error
            return;
        }
        if (arrayJSONResponse.ProductSearchResults.ResultCount != 0) // match found
        {
            gArrResultSet.length = 0;
            gArrResultSet = arrayJSONResponse.ProductSearchResults.ResultSet;
            var sSortOrder = GetSortOrder(); // get the sort order
            DoSort(sSortOrder, gArrResultSet); // sort product references
            RetrieveProductDetails(g_nCurrenPageNumber, true); // get product details
        } else // no match found
        {
            if (!g_bFirstLoad || IsFilterAsDefaultView()) {
                FormatResultHTML(false, null, null, false); // format the result
            }
            HideLoadingDialog();
        }
    };
    ajaxRequest.update(sParams, "GET"); // send the ajax request
}

/***********************************************************************
 *
 * FilterProductsFromCache				- Filter products from cached product details
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function FilterProductsFromCache() {
    if (GetClearButtonCount() < 1) // no clear button?
    {
        ClearCtrlSelectionMap(); // clear control selections
        g_bClearAll = true; // See if clear all is called indirectly from selecting/de-selecting an option
    } else {
        g_bClearAll = false;
    }
    if (g_bClearAll && (!IsFilterAsDefaultView())) // clear all?
    {
        UpdateFilterCount(); // calculate only count
        HideLoadingDialog();
        return;
    }
    var sFilterPattern = '';
    if (!g_bClearAll) // not clear all?
    {
        sFilterPattern = GetFilterPatternForResult(); // get filter pattern for result
    }
    gArrResultSet.length = 0;
    var arrFilteredProds = GetFilteredProducts(sFilterPattern); // get the filtered prods
    gArrResultSet = GetDecoratedProdRefs(arrFilteredProds);
    var sSortOrder = GetSortOrder(); // get the sort order
    DoSort(sSortOrder, gArrResultSet); // sort product references
    RetrieveProductDetails(g_nCurrenPageNumber, true); // show the result
}

/***********************************************************************
 *
 * GetDecoratedProdRefs					- Get the decorated prod refs for given array
 *													of prod refs
 *
 * Inputs:	arrProdRefs					- array of prod refs
 *
 * Returns:  								- array of decorated prod refs
 *
 ************************************************************************/
function GetDecoratedProdRefs(arrProdRefs) {
    var arrDecProds = new Array();
    for (var nProdIndx = 0; nProdIndx < arrProdRefs.length; nProdIndx++) {
        var sProdRef = arrProdRefs[nProdIndx];
        if (typeof(gMapProdRefToDecProdRef[sProdRef]) !== 'undefined') {
            arrDecProds.push(gMapProdRefToDecProdRef[sProdRef]);
        }
    }
    return arrDecProds;
}

/***********************************************************************
 *
 * GetFilterPatternForResult			- Format the pattern for filter result
 *
 * Returns:  								- filter pattern
 *
 ************************************************************************/
function GetFilterPatternForResult() {
    //
    // Get the filter selections in regular expression
    //
    var mapPropIdToFilterSelections = {}; // map of property controlid to selections
    var sPattern = '';
    for (var sFilterGroup in gMapFilterGrpIdToFilterGrpName) {
        //
        // Format the filter selection regular expression by considering all the filter
        // options
        //
        if (typeof(gMapControlToSelection[sFilterGroup]) !== 'undefined') {
            var mapFilterGroup = gMapControlToSelection[sFilterGroup];
            var arrChoices = new Array();
            var sChoices = '';
            if (sFilterGroup === 'PR') // price group?
            {
                for (var sFilterCtrlId in mapFilterGroup) {
                    var sChoice = sFilterGroup + '_' + sFilterCtrlId;
                    arrChoices.push(sChoice);
                }
            } else if (sFilterGroup === 'SX') // section group?
            {
                //
                // Get the sub section details as well
                //
                var mapSecs = {};
                for (var sFilterCtrlId in mapFilterGroup) {
                    mapSecs[sFilterCtrlId] = '';
                    var arrSubSecIDs = gMapFilters['SX'][sFilterCtrlId].m_arrSubSectionIds;
                    for (var nSecIdx = 0; nSecIdx < arrSubSecIDs.length; nSecIdx++) {
                        if (GetArrayIndex(gArraySectionIDs, arrSubSecIDs[nSecIdx]) !== -1) // if sub section included
                        {
                            mapSecs[arrSubSecIDs[nSecIdx]] = '';
                        }
                    }
                }
                for (var sSecId in mapSecs) {
                    var sChoice = sFilterGroup + '_' + sSecId;
                    arrChoices.push(sChoice);
                }
            } else // other filter groups
            {
                for (var sFilterChoiceCtrlId in mapFilterGroup) {
                    if (typeof(gMapControlIdChoiceName[sFilterChoiceCtrlId]) !== 'undefined') {
                        var sChoice = sFilterGroup + ':' + gMapControlIdChoiceName[sFilterChoiceCtrlId];
                        arrChoices.push(sChoice);
                    }
                }
            }
            //
            // Format the regular expression
            //
            if (arrChoices.length > 0) {
                mapPropIdToFilterSelections[sFilterGroup] = '(\\!' + arrChoices.join('\\!|\\!') + '\\!)';
            }
        }
    }
    for (var nFltrIdx = 0; nFltrIdx < gArrFilterGrpIdSorted.length; nFltrIdx++) {
        var sFltrGrpId = gArrFilterGrpIdSorted[nFltrIdx];
        if (typeof(mapPropIdToFilterSelections[sFltrGrpId]) !== 'undefined') {
            if (sPattern.length > 0) {
                sPattern += '.*'
            }
            sPattern += mapPropIdToFilterSelections[sFltrGrpId];
        }
    }
    return sPattern;
}

/***********************************************************************
 *
 * CacheURLParams							- Cache URL parameter
 *
 * Inputs:	sParamName					- paramter name
 * 				sParamValue					- paramter value
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CacheURLParams(sParamName, sParamValue) {
    //
    // Cache URL parameters into gMapParams
    //
    if (typeof(gMapParams[sParamName]) !== 'undefined') {
        gMapParams[sParamName].push(sParamValue);
    } else {
        gMapParams[sParamName] = new Array();
        gMapParams[sParamName].push(sParamValue);
    }
}

/***********************************************************************
 *
 * ClearURLParamCache						- Clear URL parameter cache
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ClearURLParamCache() {
    for (var sParam in gMapParams) {
        gMapParams[sParam] = new Array();
    }
}

/***********************************************************************
 *
 * GetURLParam								- Get URL parameter string
 *
 * Inputs:	bUseDefault					- use default paramters
 *
 * Returns:  								- parameter string
 *
 ************************************************************************/
function GetURLParam(bUseDefault) {
    var sParam = '';
    var bGetAllProds = false;
    if (bUseDefault) // use default options?
    {
        UpdateDefaultParams();
    }
    //
    // Reset the parameters to get all products
    //
    if ((IsFilterAsDefaultView() || IsFilterCountEnabled()) && g_bFirstLoad) {
        for (var sPropId in gMapDefCtrlSelections) {
            if (typeof(gMapParams[sPropId]) !== 'undefined') // reset for choices
            {
                gMapParams[sPropId] = new Array();
                gMapParams[sPropId].push('');
            }
        }
        if (typeof(gMapParams['PR']) !== 'undefined') // reset for price band
        {
            gMapParams['PR'] = new Array();
            gMapParams['PR'].push('-1');
        }
        if (typeof(gMapParams['SX']) !== 'undefined') // rest for section
        {
            gMapParams['SX'] = new Array();
            gMapParams['SX'].push('-1');
        }
    }
    //
    // Create parameter string for each parameter
    //
    for (var sParamName in gMapParams) {
        var arrParamVal = gMapParams[sParamName];
        var nLength = arrParamVal.length;
        if (nLength == 0) // use default when no options selected
        {
            var sParamValue = '';
            if (sParamName === 'PR' || sParamName === 'SX') {
                sParamValue = '-1';
            }
            sParam += sParamName + '=' + sParamValue + '&';
            continue;
        }
        for (var nParamIdx = 0; nParamIdx < nLength; nParamIdx++) // create the parameter string
        {
            var sParamValue = arrParamVal[nParamIdx];
            sParam += sParamName + '=' + sParamValue + '&';
        }
    }
    return sParam;
}

/***********************************************************************
 *
 * UpdateDefaultParams					- Update default parameters
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function UpdateDefaultParams() {
    var sParams = '';
    //
    // Update the default filter options in 'gMapParams'
    //
    for (var sSelection in gMapDefCtrlSelections) {
        var sKey = sSelection + '-' + gMapDefCtrlSelections[sSelection];
        var sChoice = '';
        if (typeof(gMapControlIdChoiceName[sKey]) !== 'undefined') {
            sChoice = gMapControlIdChoiceName[sKey];
        }
        var sTmpChoice = encodeURIComponent(sChoice).replace(/!|'|\(|\)|\*|%20|%C2/g, function(x) {
            return {
                "!": "%21",
                "'": "%27",
                "(": "%28",
                ")": "%29",
                "*": "%2A",
                "%20": "+",
                "%C2": ""
            }[x];
        });
        if (typeof(gMapParams[sSelection]) !== 'undefined') // update for choices
        {
            gMapParams[sSelection] = new Array();
            gMapParams[sSelection].push(sTmpChoice);
        }
    }
    if (typeof(gMapParams['PR']) !== 'undefined') // update for price band
    {
        gMapParams['PR'] = new Array();
        gMapParams['PR'].push('-1');
    }
    if (typeof(gMapParams['SX']) !== 'undefined') // update for section
    {
        gMapParams['SX'] = new Array();
        gMapParams['SX'].push('-1');
    }
}

/***********************************************************************
 *
 * GetSelections							- Get selected item from list box
 *
 * Inputs:	elements						- current select elements
 *
 * Returns:  								- selected parameters
 *
 ************************************************************************/
function GetSelections(elements) {
    var sParam = '';
    var sControlId = '';
    var sValue = '';
    for (var nElmCount = 0; nElmCount < elements.options.length; nElmCount++) {
        //
        // Format needed parameters
        //
        if (elements.options[nElmCount].selected === true) {
            var sParamName = elements.name;
            var sParamValue = encodeURIComponent(elements.options[nElmCount].value);
            sParam += sParamName + '=' + sParamValue + '&';
            if (sParamName === "PR" || sParamName === "SX") {
                sControlId = elements.options[nElmCount].value;
            } else {
                sControlId = elements.options[nElmCount].id;
                sValue = elements.options[nElmCount].value;;
            }
            //
            // Remember the selections
            //
            if (!g_bFirstLoad) {
                GetControlSelections(sParamName, sControlId, sValue);
            }
            CacheURLParams(sParamName, sParamValue);
        }
    }
    return sParam;
}

/***********************************************************************
 *
 * ValidateMultipleListBox				- Validate list box
 *
 * Inputs:	elements						- current select elements
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ValidateMultipleListBox(elements) {
    var nSelectedCount = 0;
    for (var nElmCount = 0; nElmCount < elements.options.length; nElmCount++) {
        if (elements.options[nElmCount].selected === true) {
            nSelectedCount++;
        }
    }
}

/***********************************************************************
 *
 * DoSort										- Sort the result set of product references
 *
 * Inputs:	sSort							- sort order
 *				arrSearchResults			- result set of product references array
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function DoSort(sSort, arrSearchResults) {
    //
    // Stuff which has to be passed in from somewhere
    // Note: Make sure 'pg_sSortOrdersPrependedToProdRefs' defined in the html file
    //
    var sSortOrdersPrependedToReferences = pg_sSortOrdersPrependedToProdRefs; // which sort orders are prepended to product references, in this order
    //
    // Split the sort order from the keys, then sort by that.
    // The product references as keys of rhashResults are constructed as <sort order 1><sort order 2>...<sort order n><product ref>
    // The sort orders are specially encoded into strings that retain order when compared as strings.
    // This means they don't have to be decoded for sorting, and also are more compact.
    //
    // The values in rhashResults are the relevance scores for each product reference given the search words.
    // These may be 0 if relevance information is not stored or if not searching for words but just filtering.
    //
    var arrSort = sSort.split('_'); // separate the various sort params in the list
    arrSort.push("0", "0", "0", "0"); // make array long enough and ensure that we finish with product reference
    for (var nIndex = 0; nIndex < arrSort.length; nIndex++) {
        arrSort[nIndex] = parseInt(arrSort[nIndex]);
    }
    var arrSortOrders = sSortOrdersPrependedToReferences.split(","); // get list of sort orders prepended to product reference
    for (var nIndex = 0; nIndex < arrSortOrders.length; nIndex++) {
        arrSortOrders[nIndex] = parseInt(arrSortOrders[nIndex]);
    }
    //
    // Translates sort order to whether to sort ascending or not.
    // Extend with new sort orders when defined.
    // 1 indicates ascending, -1 indicates descending
    //
    var mapSortAsc = {
        0: 1, // product reference - eSortProdRef
        1: -1, // Relevance			- eSortRelevance
        2: 1, // price ascending 	- eSortPriceAsc
        3: -1, // price descending 	- eSortPriceDesc
        4: 1, // name ascending 	- eSortNameAsc
        5: -1, // name descending 	- eSortNameDesc
        6: 1, // recommended			- eSortRecommended
        7: -1, // new products		- eSortNewProducts
        8: -1, // best sellers		- eSortBestSellers
        9: -1 // feedback rating 	- eSortCustomerFeedback
    };
    //
    // Translates given sort order to actual order stored with the product reference.
    // Extend with new sort orders when defined.
    //
    var mapSortBaseOrder = {
        0: 0, // product reference	- eSortProdRef
        1: 1, // Relevance			- eSortRelevance
        2: 2, // price ascending 	- eSortPriceAsc
        3: 2, // price descending 	- eSortPriceDesc
        4: 4, // name ascending 	- eSortNameAsc
        5: 4, // name descending 	- eSortNameDesc
        6: 6, // recommended			- eSortRecommended
        7: 7, // new products		- eSortNewProducts
        8: 8, // best sellers		- eSortBestSellers
        9: 9 // feedback rating 	- eSortCustomerFeedback
    };
    //
    // Extract the sort orders. Use a regular expression constructed dynamically.
    //
    var nSortOrderCount = arrSortOrders.length; // get number of sort orders defined
    var sPattern = "^"; // start matching at start of decorated reference
    sPattern += "([0-9]*)\:"; // first match is relevance, purely numerical followed by colon
    //
    // Form the pattern to match a sort order - either 2, 4 or 5 characters long 
    // depending on lead-in char
    //
    sPattern += "([i|v])"; // valid/invalid prod ref notation
    for (var nCount = 0; nCount < nSortOrderCount; nCount++) {
        sPattern += "([0-9A-Za-z\?\_]{2}|\{[0-9A-Za-z\?\_]{3}|\}[0-9A-Za-z\?\_]{4})";
    }
    sPattern += "(.*)$"; // last match item is product reference, finish at end of decorated reference
    var regPattern = new RegExp(sPattern);
    //
    // Split the sorting information and product refs
    //
    var mapProdRefToSortOrders = {}; // maps product reference to an array of sort orders; last two items are product reference and relevance
    gArrSortedProductRefs.length = 0; // sorted product references
    for (var nIndex = 0; nIndex < arrSearchResults.length; nIndex++) // iterate search results array
    {
        var arrMatches = arrSearchResults[nIndex].match(regPattern);
        if (arrMatches) // got a match?
        {
            var sProductRef = arrMatches[nSortOrderCount + 3]; // ref is last group in regular expression
            var arrProductRefs = sProductRef.split(':');
            if (arrProductRefs.length == 2) {
                sProductRef = arrProductRefs[0];
                gMapAltProdToParentProductRef[sProductRef] = arrProductRefs[1];
            }
            gArrSortedProductRefs[nIndex] = sProductRef; // get list of product references
            arrMatches[1] = String("0000000000" + arrMatches[1]).substr(-10, 10); // relevance is numeric so ensure that it sorts correctly by prepending leading zeros and limiting size
            mapProdRefToSortOrders[sProductRef] = arrMatches; // map product reference to all the matches
            if (arrMatches[2] === 'i') // get the validity of the product
            {
                gMapInvalidProdRefs[sProductRef] = ''; // cache it in a global map
            }
            if (((IsFilterCountEnabled() || IsFilterAsDefaultView()) && g_bFirstLoad) ||
                (!IsFilterCountEnabled())) {
                gMapProdRefToDecProdRef[sProductRef] = arrSearchResults[nIndex]; // cache map of prod refs to decorated prod refs
            }
        } else {
            // severe problem, give error message
            var sErrorMsg = "Logical error occurred during sorting";
            ShowError(sErrorMsg, g_ErrorCode.LOGIC);
        }
    }
    //
    // We need to translate the requested sort order into a list of indexes of the sort
    // orders to apply. We use mapSortOrderIndex as a helper array mapping requested sort to
    // position in the arrays stored in mapProdRefToSortOrders
    //
    var mapSortOrderIndex = {};
    for (var nOrderIndex = 0; nOrderIndex < nSortOrderCount; nOrderIndex++) {
        //
        // First element in match result is matched string; second element is relevance therefore have to add 2 to get decorated sort orders
        //
        mapSortOrderIndex[arrSortOrders[nOrderIndex]] = nOrderIndex + 3;
    }
    mapSortOrderIndex[0] = nSortOrderCount + 3; // index of product reference (sort order 0) in match array
    mapSortOrderIndex[1] = 1; // index of relevance (sort order 1) in match array
    //
    // Now get vars indicating sort order and index for each sort order requested
    // If there is ever more than a primary, secondary and tertiary sort then additional variables and compares are required.
    //
    var arrAsc = new Array(
        mapSortAsc[arrSort[0]], // indicates if first sortable item is ascending or not
        mapSortAsc[arrSort[1]], // etc.
        mapSortAsc[arrSort[2]],
        mapSortAsc[arrSort[3]]);
    var arrOrderIndex = new Array(
        mapSortOrderIndex[mapSortBaseOrder[arrSort[0]]], // index of first requested sort order in array stored against product reference
        mapSortOrderIndex[mapSortBaseOrder[arrSort[1]]], // etc.
        mapSortOrderIndex[mapSortBaseOrder[arrSort[2]]],
        mapSortOrderIndex[mapSortBaseOrder[arrSort[3]]]);
    //
    // Do the sort. Use the array of items at each index, selecting appropriate one each time.
    //
    gArrSortedProductRefs.sort(function(sRefA, sRefB) {
        var sFirst;
        var sSecond;
        for (var nSortIndex = 0; nSortIndex < 4; nSortIndex++) {
            sFirst = mapProdRefToSortOrders[sRefA][arrOrderIndex[nSortIndex]];
            sSecond = mapProdRefToSortOrders[sRefB][arrOrderIndex[nSortIndex]];
            //
            // Compare the values. Note that localeCompare can't be used as it gives
            // strange results with characters outside of 0..9A..Za..z with IE and FF.
            //
            if (sFirst < sSecond) {
                return (-1 * arrAsc[nSortIndex]); // invert sort result if arrAsc contains -1
            } else if (sFirst > sSecond) {
                return (arrAsc[nSortIndex]);
            }
        }
        return (0);
    });
};

/***********************************************************************
 *
 * RetrieveProductDetails				- Get product details for the given
 *							  		  				Product References
 *
 * Inputs:	nPageNumber					- page number
 *				bFilterPropertyChanged	- whether filter property changed
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function RetrieveProductDetails(nPageNumber, bFilterPropertyChanged) {
    var bRetrieveProdDetails = false; // flag to indicate need for product details request
    var bCacheDetailsOnServer = false; // flag to indicate if the server should cache the request for product details
    //
    // Format DPR parameter from the product references
    //
    ShowLoadingDialog(); // show loading dialog if not already shown
    SetCurrentPageNumber(nPageNumber); // set the current page number
    StoreSettings(); // store filter settings
    var arrNonCachedProdRefs = GetProdRefsOfNonCachedProductDetails(gArrSortedProductRefs); // get non cached product references
    if (arrNonCachedProdRefs.length > 0) {
        bRetrieveProdDetails = true; // retrieve product details
    }
    bCacheDetailsOnServer = (arrNonCachedProdRefs.length === gArrSortedProductRefs.length);
    var bNeedFilter = false;
    if (bFilterPropertyChanged || bRetrieveProdDetails) {
        bNeedFilter = true; // need filtering and count update?
    }
    //
    // Ajax call to get product details
    //
    if (bRetrieveProdDetails) // retrieve product details?
    {
        if ((typeof(pg_bFilteringCacheEnabled) !== "undefined") &&
            (pg_bFilteringCacheEnabled !== 0) &&
            (IsFilterCountEnabled() || IsFilterAsDefaultView())) {
            var xmlHttpClient = new XMLHttpRequest();
            var sCacheFileName = "AjaxProductDetails_" + pg_nUploadReferenceNumber + "_" + pg_nCurrentFilterSectionID + ".js";
            xmlHttpClient.open("GET", GetFilterCacheURL(sCacheFileName), false);
            xmlHttpClient.send();
            if ((xmlHttpClient.status === 200) || (xmlHttpClient.status === 304)) {
                var arrayJSONResponse = {};
                try {
                    arrayJSONResponse = xmlHttpClient.responseText.parseJSON();
                    if (arrayJSONResponse.ProductDetails.ProductInfoCount == 0 || // empty product details in ajax file
                        arrayJSONResponse.ProductDetails.ProductInfoCount !== arrNonCachedProdRefs.length) // different number of products in product details file
                    {
                        UpdateProductDetailsFromServer(arrNonCachedProdRefs, bCacheDetailsOnServer, bNeedFilter); // call the script directly to re-cache it
                        return;
                    }
                } catch (e) {
                    UpdateProductDetailsFromServer(arrNonCachedProdRefs, bCacheDetailsOnServer, bNeedFilter);
                    return;
                }
                UpdateProductDetails(arrayJSONResponse, bNeedFilter);
            } else {
                UpdateProductDetailsFromServer(arrNonCachedProdRefs, bCacheDetailsOnServer, bNeedFilter);
            }
        } else {
            UpdateProductDetailsFromServer(arrNonCachedProdRefs, bCacheDetailsOnServer, bNeedFilter);
        }
    } else {
        //
        // Check if the product references are not empty
        //
        if (gArrSortedProductRefs.length !== 0) {
            var bFilterDefView = IsFilterAsDefaultView();
            var bFilterStorage = HasFilterStorage();
            if (!g_bFirstLoad || bFilterDefView || bFilterStorage) {
                if ((bFilterDefView || IsFilterCountEnabled()) && bFilterPropertyChanged) {
                    var sFilterPattern = GetFilterPatternForResult(); // get filter pattern for result
                    gArrResultSet.length = 0;
                    var arrFilteredProds = GetFilteredProducts(sFilterPattern); // get the filtered prods
                    gArrResultSet = GetDecoratedProdRefs(arrFilteredProds);
                    var sSortOrder = GetSortOrder(); // get the sort order
                    DoSort(sSortOrder, gArrResultSet); // sort product references					
                }
                FormatResultHTML(true, gArrSortedProductRefs, nPageNumber, bNeedFilter); // display result from the cached product details
            } else {
                UpdateFilterCount();
            }
        } else {
            if (!g_bFirstLoad || IsFilterAsDefaultView()) {
                FormatResultHTML(true, null, null, bNeedFilter); // display no result
            }
        }
    }
}

/***********************************************************************
 *
 * UpdateProductDetailsFromServer -  updates the product details by AJAX call
 *
 * Input:  arrNonCachedProdRefs  - array of non-cached product references
 *		  bEnableAJAXCallCache	- flag to enable AJAX call caching
 *		  bNeedFilter			- whether filtering and count update needed?
 *
 * Returns:  					- nothing
 *
 ************************************************************************/

function UpdateProductDetailsFromServer(arrNonCachedProdRefs, bEnableAJAXCallCache, bNeedFilter) {
    var sParamPrdDetails = '';
    for (var nIndex = 0; nIndex < arrNonCachedProdRefs.length; nIndex++) {
        if (typeof(arrNonCachedProdRefs[nIndex]) !== "undefined") {
            sParamPrdDetails += arrNonCachedProdRefs[nIndex];
            if (nIndex + 1 < arrNonCachedProdRefs.length) {
                sParamPrdDetails += '_';
            }
        }
    }
    var sUrl = pg_sSearchScript;
    var arrayJSONResponse = {};
    var ajaxRequest = new ajaxObject(sUrl);
    ajaxRequest.callback = function(responseText) {
        if (responseText === '') {
            return;
        }
        var arrayJSONResponse = {};
        try {
            arrayJSONResponse = responseText.parseJSON();
        } catch (e) {
            ShowJSONError(e); // show json error
            return;
        }
        UpdateProductDetails(arrayJSONResponse, bNeedFilter);
    };
    //
    // Construct parameter to fetch product details
    //
    sParamPrdDetails = 'PAGE=' + 'DynamicFilter&' + 'DPR=' + sParamPrdDetails;
    //
    // Fetch sub section details only once at the first load
    //
    if (IsSearchBySubSection() && g_bFirstLoad) // subsection search enabled?
    {
        var sSIDs = '';
        for (var nSXIndx = 0; nSXIndx < gArraySectionIDs.length; nSXIndx++) {
            sSIDs += gArraySectionIDs[nSXIndx];
            if (nSXIndx + 1 < gArraySectionIDs.length) {
                sSIDs += '_';
            }
        }
        if (sSIDs !== '') {
            sParamPrdDetails += '&SIDS=' + sSIDs;
        }
    }

    if (bEnableAJAXCallCache) {
        sParamPrdDetails += '&SID=' + pg_nCurrentFilterSectionID;
    }
    //
    // Shop id for host mode
    //
    if (IsHostMode()) {
        sParamPrdDetails += '&SHOP=' + pg_sShopID;
    }
    ajaxRequest.update(sParamPrdDetails, "POST");
}

/***********************************************************************
 *
 * ShowJSONError					- Show JSON error
 *
 * Inputs: oExp 					- exception
 *
 * Returns:  						- nothing
 *
 ************************************************************************/
function ShowJSONError(oExp) {
    if (typeof(oExp) !== 'undefined') {
        if (oExp.length > 500) {
            oExp = oExp.substring(0, 500) + '...';
        }
    }
    var sError = 'The filter operation returned a script error. Please try again, and \
contact us if the error persists. The error was: \n\n[' + oExp + ']';
    alert(sError);
}

/***********************************************************************
 *
 * UpdateProductDetails			-  Updates product details in the page
 *
 * Inputs: arrayJSONResponse 	- array of JSON response
 *		  bNeedFilter			- whether filtering and count update needed?
 *
 * Returns:  					- nothing
 *
 ************************************************************************/
function UpdateProductDetails(arrayJSONResponse, bNeedFilter) {
    var nProductCount = arrayJSONResponse.ProductDetails.ProductInfoCount;
    if (typeof(arrayJSONResponse.SectionDetails) !== 'undefined' &&
        arrayJSONResponse.SectionDetails.SectionInfoCount != 0) // section details found
    {
        CacheSectionDetails(arrayJSONResponse.SectionDetails.SectionInfoSet); // cache section details
    }
    if (nProductCount != 0) // product details found
    {
        var arrProductDetailsSet = new Array();
        arrProductDetailsSet = arrayJSONResponse.ProductDetails.ProductInfoSet;
        CacheProductDetails(arrProductDetailsSet); // cache product details
        CacheProductDetailsWithFullPermutation(bNeedFilter);
    }
}

/***********************************************************************
 *
 * UpdateProductDetailsHelper	-  Updates product details helper function
 *
 * Inputs: bNeedFilter	- whether filtering and count update needed?
 *		  
 * Returns:  				- nothing
 *
 ************************************************************************/

function UpdateProductDetailsHelper(bNeedFilter) {
    //
    // Calcultae count & remove filter options with zero count when filter options has preset values
    //
    var bFilterStorage = HasFilterStorage();
    if (g_bFirstLoad && IsFilterCountEnabled() && (g_bHasPresetOptions || bFilterStorage)) // has preset value
    {
        CalculateCount(true); // calculate count
        RemoveFilterWithZeroCount(); // remove filter options with zero count
        ClearFilterCounts(); // clear off the filter options counts
    }
    var bFilterDefView = IsFilterAsDefaultView();
    if (!g_bFirstLoad || bFilterDefView || bFilterStorage) {
        if (bFilterDefView || IsFilterCountEnabled()) {
            var sFilterPattern = GetFilterPatternForResult(); // get filter pattern for result
            gArrResultSet.length = 0;
            var arrFilteredProds = GetFilteredProducts(sFilterPattern); // get the filtered prods
            gArrResultSet = GetDecoratedProdRefs(arrFilteredProds);
            var sSortOrder = GetSortOrder(); // get the sort order
            DoSort(sSortOrder, gArrResultSet); // sort product references
        }
        FormatResultHTML(true, gArrSortedProductRefs, g_nCurrenPageNumber, bNeedFilter); // format the result					
    } else {
        //
        // Update filter count
        //
        UpdateFilterCount();
        HideLoadingDialog();
    }
}

/***********************************************************************
 *
 * CacheProductDetailsWithFullPermutation	-  Downloads and cache the full permutation
 *
 * Inputs: bNeedFilter	- whether filtering and count update needed?
 *		  
 * Returns:  				- nothing
 *
 ************************************************************************/

function CacheProductDetailsWithFullPermutation(bNeedFilter) {
    //
    // NOTE: Check variable gArrSortedProductRefs and associated logic changes
    //
    var sProdRefParam = GetProdRefForFullPermutation();
    if (sProdRefParam == '') {
        UpdateProductDetailsHelper(bNeedFilter);
        return;
    }
    //
    // Get full permutation list
    // Sample Url: http://localhost/cgi-bin/ss000013.pl?ACTION=FULLPERMLIST&PRODREF=3_4_5
    //
    var arrProductToFullPermutation = new Array();
    var sUrl = pg_sSearchScript;
    var ajaxRequest = new ajaxObject(sUrl);
    ajaxRequest.callback = function(responseText) {
        if (responseText === '') {
            UpdateProductDetailsHelper(bNeedFilter);
            return;
        }
        UpdateProductDetailsWithFullPermutation(responseText);
        UpdateProductDetailsHelper(bNeedFilter);
    };
    sParams = 'ACTION=FULLPERMLIST&PRODREF=' + sProdRefParam;
    ajaxRequest.update(sParams, "GET", false); // send the ajax request
}

/***********************************************************************
 *
 * SetSelectionMapsFromStorage			-  Set the selection map from filter 
 *													storage settings
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function SetSelectionMapsFromStorage() {
    if (!HasFilterStorage()) {
        return;
    }
    var sStoredFilterSettings = SDStorage.readPage('filterSettings');
    ClearCtrlSelectionMap(); // clear control selection maps
    //
    // Fill up the control selection maps
    //
    arrSettings = sStoredFilterSettings.split(',');
    for (var nIdx = 0; nIdx < arrSettings.length; nIdx++) {
        var arrGrpControl = arrSettings[nIdx].split(':');
        var sCtlrName = arrGrpControl[0];
        var sContolID = arrGrpControl[1];
        if (typeof(gMapControlToSelection[sCtlrName]) === 'undefined') {
            gMapControlToSelection[sCtlrName] = {};
            gMapControlToSelection[sCtlrName][sContolID] = '';
        } else {
            gMapControlToSelection[sCtlrName][sContolID] = '';
        }

        if (sCtlrName === 'PR' || sCtlrName === 'SX') {
            gMapCtrlSelections[arrSettings[nIdx]] = true;
        } else {
            gMapCtrlSelections[sContolID] = true;
        }
        //
        // Fill the maps of 'Property Id to Selected Choice Ids' and 
        //	'Property Ids to array of selections (decorated)'
        //
        if (typeof(gMapFilterGrpIdToFilterGrpName[sCtlrName]) !== 'undefined' &&
            typeof(gMapControlIdChoiceName[sContolID]) !== 'undefined') {
            var sPropCtrlSelection = (gMapFilterGrpIdToFilterGrpName[sCtlrName] + ':' + gMapControlIdChoiceName[sContolID]).toUpperCase();
            gMapPropCtrlSelections[sPropCtrlSelection] = true;

            if (typeof(gMapPropIdToSelections[sCtlrName]) === 'undefined') {
                gMapPropIdToSelections[sCtlrName] = new Array() // property id to selections
            }
            if (GetArrayIndex(gMapPropIdToSelections[sCtlrName], sPropCtrlSelection) == -1) {
                gMapPropIdToSelections[sCtlrName].push(sPropCtrlSelection);
                if (gMapPropIdToSelections[sCtlrName].length > 0) {
                    InsertSort(gMapPropIdToSelections[sCtlrName]);
                }
            }
        }
    }
}

/***********************************************************************
 *
 * HasPresetFilterOptions				- Checks if the filter properties has 
 *													preset options
 *
 * Returns:  								- true/false
 *
 ************************************************************************/
function HasPresetFilterOptions() {
    var bPreset = false;
    for (var sFilterGroup in gMapFilters) // for each filter group
    {
        if (sFilterGroup !== 'PR' && sFilterGroup !== 'SX') // check only for properties
        {
            var sArrayChoices = gMapFilters[sFilterGroup].m_mapChoices;
            var nChoiceInx = 1; // starting choice index
            while (typeof(sArrayChoices[nChoiceInx]) !== "undefined") {
                var sChoiceID = sArrayChoices[nChoiceInx].m_sChoiceID; // get choice id (ex: S_417_1:2)
                if (typeof(gMapCtrlSelections[sChoiceID]) !== "undefined" &&
                    gMapFilters[sFilterGroup].m_mapChoices[nChoiceInx].m_sChoiceName !== '') // not 'Any'?
                {
                    bPreset = true; // has preset options
                }
                nChoiceInx++;
            }
        }
    }
    return bPreset;
}

/***********************************************************************
 *
 * FormatResultHTML						- Format the result page
 *
 * Inputs:	arrProductRefs 			- array of product references
 *				bFound						- identify if match found
 *				nPageNumber					- result page number
 *				bNeedFilter					- whether filtering and count update needed?
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function FormatResultHTML(bFound, arrProductRefs, nPageNumber, bNeedFilter) {
    if (bNeedFilter) {
        FilterProductsBasedOnPerms(); // validate product based on retrieved permutations
    }
    //
    // Remove the product list
    //
    var contentPageElement = document.getElementById('ContentPage');
    if (contentPageElement) {
        contentPageElement.style.display = "none"; // hide the content
    }
    //
    // Enable search result and sort by template
    //
    var resultAreaElement = document.getElementById("filter_results_area");
    if (resultAreaElement) {
        resultAreaElement.style.cssText = 'display:block';
    }
    var resultListElement = document.getElementById("search_results_list");
    if (resultListElement) {
        resultListElement.style.cssText = 'display:block';
    }
    var sortbyElement = document.getElementById("SortBy");
    if (sortbyElement) {
        sortbyElement.style.cssText = 'display:block';
    }
    //
    // When carousel visibility changes, they have to be reloaded.
    //
    ReloadCarousels();
    //
    // Display no match found message
    //
    if ((!bFound) || (gArrSortedProductRefs.length === 0)) // no matching products found
    {
        var resultContent = "No matching products were found.";
        UpdateResultContent(resultContent); // update result content
        UpdateResultSummary(false); // update summary
        UpdatePaginatedLinks(false); // update pagination links
        if (bNeedFilter) // need filtering
        {
            UpdateFilterCount(); // update the filter count	
        }
        gArrSortedProductRefs.length = 0; // sorted product references alone
        gArrResultSet.length = 0; // result set containing decorated product refs
        HideLoadingDialog(); // hide loading dialog if any
        return;
    }

    if (g_sResultLayout === g_eResultLayout.TABULAR) {
        FormatTabularResult(nPageNumber); // format the tabular result page
    } else {
        FormatStandardResult(nPageNumber); // format the standard result page
    }
    if (bNeedFilter) // need filtering
    {
        UpdateFilterCount(); // update the filter count	
    }
}

/***********************************************************************
 *
 * FormatStandardResult					- Format the standard result page
 *
 * Inputs:	nPageNumber					- result page number
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function FormatStandardResult(nPageNumber) {
    //
    // Format the actual result
    //
    var resultSet = ''; // contains all the result set
    var dummyResultTemplate = '';
    var sArrProductRefs = GetPaginatedProducts(gArrSortedProductRefs, nPageNumber); // get paginated list of prod refs
    if (sArrProductRefs.length == 0) {
        nPageNumber = 0;
        sArrProductRefs = GetPaginatedProducts(gArrSortedProductRefs, nPageNumber); // get paginated list from the first page
    }
    for (var nProdCount = 0; nProdCount < sArrProductRefs.length; nProdCount++) {
        var objProductDetails = new ProductDetails();
        objProductDetails = GetProductDetails(sArrProductRefs[nProdCount]); // get the product details from cache
        if (typeof(objProductDetails) !== "undefined") {
            dummyResultTemplate = ReplaceResultTemplates(objProductDetails, nProdCount);
            resultSet += '<div class="std-product-details">' + dummyResultTemplate + '<\/div>';
        }
    }
    UpdateResultContent(resultSet); // update result content
    UpdateResultSummary(true); // update summary
    //
    // Create and update the paginated links
    //
    var sResultPageLnksPgs = CreateSearchResultPageLinks(); // create pagination links
    //
    // No pagination links provided if the number of pages are not more than one
    //
    if (sResultPageLnksPgs[1] < 2) // check the no of pages
    {
        UpdatePaginatedLinks(false); // update pagination links
    } else {
        UpdatePaginatedLinks(true, sResultPageLnksPgs[0]);
    }
    HideLoadingDialog(); // hide loading dialog if any
}

/***********************************************************************
 *
 * FormatTabularResult					- Format the tabular result page
 *
 * Inputs:	nPageNumber					- result page number
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function FormatTabularResult(nPageNumber) {
    //
    // Format the actual result
    //
    var resultSet = ''; // contains all the result set
    var dummyResultTemplate = '';
    var sRowElements = '';
    var sArrProductRefs = GetPaginatedProducts(gArrSortedProductRefs, nPageNumber); // get paginated list of prod refs
    if (sArrProductRefs.length == 0) {
        nPageNumber = 0;
        sArrProductRefs = GetPaginatedProducts(gArrSortedProductRefs, nPageNumber); // get paginated list from the first page
    }
    var bInsertRow = false;
    for (var nProdCount = 0; nProdCount < sArrProductRefs.length; nProdCount++) {
        var objProductDetails = new ProductDetails();
        objProductDetails = GetProductDetails(sArrProductRefs[nProdCount]); // get the product details from cache
        if (typeof(objProductDetails) !== "undefined") {
            dummyResultTemplate = ReplaceResultTemplates(objProductDetails, nProdCount);
            if (g_nListColCount > 1) {
                if (((nProdCount + 1) % g_nListColCount) === 0) // insert row
                {
                    sRowElements += g_sListCellStartTemplate + dummyResultTemplate + g_sListCellEndTemplate;
                    bInsertRow = true;
                } else // insert column
                {
                    sRowElements += g_sListCellStartTemplate + dummyResultTemplate + g_sListCellEndTemplate;
                    bInsertRow = false;
                }
                if (bInsertRow) {
                    resultSet += g_sListRowStartTemplate + sRowElements + g_sListRowEndTemplate;
                    sRowElements = '';
                } else if (((nProdCount + 1) === sArrProductRefs.length)) // special handling for last prod if in odd
                {
                    resultSet += g_sListRowStartTemplate + sRowElements + g_sListRowEndTemplate;
                }
            } else // default single col list
            {
                resultSet += g_sListRowStartTemplate + g_sListCellStartTemplate + dummyResultTemplate + g_sListCellEndTemplate + g_sListRowEndTemplate;
            }
        }
    }
    resultSet = g_sListStartTemplate + resultSet + g_sListEndTemplate;
    //
    // Create and update the paginated links
    //
    var sResultPageLnksPgs = CreateSearchResultPageLinks(); // create pagination links
    //
    // No pagination links provided if the number of pages are not more than one
    //
    if (sResultPageLnksPgs[1] < 2) // check the no of pages
    {
        UpdatePaginatedLinks(false); // update pagination links
    } else {
        UpdatePaginatedLinks(true, sResultPageLnksPgs[0]);
    }
    UpdateResultContent(resultSet); // update result content
    HideLoadingDialog(); // hide loading dialog if any
}

/***********************************************************************
 *
 * ReplaceResultTemplates				- Replace result template with the actual values
 *
 * Inputs:	objProductDetails			- product details object
 *				nProdCount					- product count
 *
 * Returns:  								- modified content
 *
 ************************************************************************/
function ReplaceResultTemplates(objProductDetails, nProdCount) {

    var nProductCount = g_nProductMinIndex + 1 + nProdCount; // product count
    var sResultTemplate = g_sSearchResultsTemplate;
    sResultTemplate = ReplaceProductDetailstemplate(objProductDetails, sResultTemplate, nProductCount);
    //
    // Evaluate the script function call from the template
    //
    while (sResultTemplate.match(/<Actinic:ScriptFunctionCall[^>]*>([^`]*?)<\/Actinic:ScriptFunctionCall>/i)) {
        var arrMatch = sResultTemplate.match(/<Actinic:ScriptFunctionCall[^>]*>([^`]*?)<\/Actinic:ScriptFunctionCall>/i)
        if (arrMatch[1]) // script call available?
        {
            var scriptResult = '';
            try {
                scriptResult = eval(arrMatch[1]); // call the JS function in template
            } catch (e) // failed in evaluating!
            {
                console.log('Error in evaluating the statement: ' + arrMatch[1]);
            }
            sResultTemplate = sResultTemplate.replace(/<Actinic:ScriptFunctionCall[^>]*>([^`]*?)<\/Actinic:ScriptFunctionCall>/i, scriptResult);
        }
    }
    return sResultTemplate;
}

/***********************************************************************
 *
 * ReplaceProductDetailstemplate		- Replace products details for result template
 *
 * Inputs:	objProductDetails			- product details object
 *				sTemplate					- template to check against
 *				nProductCount				- product count
 *
 * Returns:  								- modified content
 *
 ************************************************************************/
function ReplaceProductDetailstemplate(objProductDetails, sTemplate, nProductCount) {
    var sFormattedPrice = FormatPrices(objProductDetails.m_sPrice) // function from dynamic.js
    sTemplate = sTemplate.replace(/(<Actinic:S_ITEM><\/Actinic:S_ITEM>)/ig, nProductCount);
    var sProductLinkHREF = '';
    if ((IsLoggedIn()) && (typeof(pg_sCustomerAccountsCGIURL) !== 'undefined') // logged in?
        &&
        (pg_sCustomerAccountsCGIURL !== '')) {
        //
        // Shop id for host mode
        //
        var sHostParam = '';
        if (IsHostMode()) {
            sHostParam = 'SHOP=' + pg_sShopID + '&';
        }
        sProductLinkHREF = '<a href=\"' + pg_sCustomerAccountsCGIURL + '?' + sHostParam + 'PRODUCTPAGE=' + objProductDetails.m_sAnchor + '\">';
    } else {
        sProductLinkHREF = '<a href=\"' + objProductDetails.m_sAnchor + '\">';
    }
    var sSectionName = "(" + objProductDetails.m_sSection + ")" + "&nbsp;";
    var sPrice = sFormattedPrice + "&nbsp;";
    var sDescription = objProductDetails.m_sDescription + "&nbsp;";
    sTemplate = sTemplate.replace(/((&lt;|<)Actinic:S_PNAME(&gt;|>)(&lt;|<)\/Actinic:S_PNAME(&gt;|>))/ig, objProductDetails.m_sName);
    sTemplate = sTemplate.replace(/(<Actinic:S_SNAME><\/Actinic:S_SNAME>)/ig, sSectionName);
    sTemplate = sTemplate.replace(/(<Actinic:S_LINK><\/Actinic:S_LINK>)/ig, sProductLinkHREF);
    sTemplate = sTemplate.replace(/(<Actinic:S_PRAWPRICE><\/Actinic:S_PRAWPRICE>)/ig, objProductDetails.m_sPrice);
    sTemplate = sTemplate.replace(/(<Actinic:S_PRICE><\/Actinic:S_PRICE>)/ig, sPrice);
    sTemplate = sTemplate.replace(/(<Actinic:S_DESCR><\/Actinic:S_DESCR>)/ig, sDescription);
    sTemplate = sTemplate.replace(/(<Actinic:S_STOCK><\/Actinic:S_STOCK>)/ig, objProductDetails.m_nStockLevel);
    //
    // Set the default product image
    //
    if (objProductDetails.m_sImage == '') {
        if (typeof(pg_sDefaultProductImage) !== "undefined") {
            objProductDetails.m_sImage = pg_sDefaultProductImage; // hope it has the real image		
        }
    }
    //
    // Image replacement
    //
    if (objProductDetails.m_sImage !== '') {
        var myRegExpImg = /(<div[^>]*ResultImage[^>]*>([^`]*?)<\/div>)/igm;
        var arrMatch = new Array();
        arrMatch = myRegExpImg.exec(sTemplate);
        if (arrMatch != null) {
            var sImageTags = arrMatch[2];
            var sImageSize = "";
            if ((typeof(pg_nProductImageWidth) !== 'undefined') && (pg_nProductImageWidth > 0)) {
                sImageSize += "width=\"" + pg_nProductImageWidth + "\" ";
            }
            if ((typeof(pg_nProductImageHeight) !== 'undefined') && (pg_nProductImageHeight > 0)) {
                sImageSize += "height=\"" + pg_nProductImageHeight + "\"";
            }
            sImageTags = sImageTags.replace(/=\"\"/ig, '');
            sImageTags = sImageTags.replace(/netquotevar:thumbnailsize/ig, sImageSize);
            sImageTags = sImageTags.replace(/\bNETQUOTEVAR:THUMBNAIL\b/ig, objProductDetails.m_sImage);
            sTemplate = sTemplate.replace(myRegExpImg, sImageTags);
        }
    } else // cleanup the image template when there is none to display
    {
        sTemplate = sTemplate.replace(/(<div[^>]*ResultImage[^>]*>([^`]*?)<\/div>)/ig, '');
    }

    //
    // Handle Feefo Logo
    //
    if (pg_bShowProductFeedback) {
        var myRegExpImg = /(<div[^>]*ResultFeefoLogo[^>]*>([^`]*?)<\/div>)/igm;
        var arrMatch = new Array();
        arrMatch = myRegExpImg.exec(sTemplate);
        if (arrMatch != null) {
            var sFeefoLogoTags = arrMatch[2];
            sFeefoLogoTags = sFeefoLogoTags.replace(/((&lt;|<)Actinic:S_PRODREF(&gt;|>)(&lt;|<)\/Actinic:S_PRODREF(&gt;|>))/ig, objProductDetails.m_sProdRef);
            sTemplate = sTemplate.replace(myRegExpImg, sFeefoLogoTags);
        }
    } else // cleanup the image template when there is none to display
    {
        sTemplate = sTemplate.replace(/(<div[^>]*ResultFeefoLogo[^>]*>([^`]*?)<\/div>)/ig, '');
    }

    sTemplate = UpdateUDPVariableTemplates(objProductDetails, sTemplate);
    return sTemplate;
}

/***********************************************************************
 *
 * UpdateUDPVariableTemplates			- Update the UDP variable templates
 *
 * Inputs:	objProductDetails			- product details object
 *				sTemplate               - result template
 *
 * Returns:  								- modified template
 *
 ************************************************************************/
function UpdateUDPVariableTemplates(objProjectDetails, sTemplate) {
    for (var sUDPVariableName in objProjectDetails.m_mapUDPs) {
        if (sUDPVariableName) {
            //
            // Create actinic template to replace
            //
            var sEscapedUDPVariableName = EscapeRegExp(DecodeHtmlEntity(sUDPVariableName)); // escape if any regex characters
            var sVariableTemplate = '(((&lt;)|(<))actinic:template[^((&gt;)|(>))]*name=((&quot;)|(\"))' +
                sEscapedUDPVariableName + '((&quot;)|(\"))((&gt;)|(>))((&lt;)|(<))\/actinic:template((&gt;)|(>)))';
            sTemplate = sTemplate.replace(new RegExp(sVariableTemplate, "ig"), objProjectDetails.m_mapUDPs[sUDPVariableName]);
        }
    }
    sTemplate = sTemplate.replace(/(<actinic:template[^>]*name[^>]*>([^`]*?)<\/actinic:template>)/ig, ''); // clean up of UDP template variables
    return sTemplate;
}

/***********************************************************************
 *
 * DecodeHtmlEntity						- Decode the HTML entity
 *
 * Inputs:	sText							- string to decode
 *
 * Returns:									- nothing
 *
 * Ref: https://gist.github.com/CatTail/4174511
 ************************************************************************/
var DecodeHtmlEntity = function(sText) {
    return sText.replace(/&#(\d+);/g, function(match, dec) {
        if (dec == '39' || dec == '34') // escape single and double quote
        {
            return ('\\' + String.fromCharCode(dec));
        }
        return String.fromCharCode(dec);
    });
}

/***********************************************************************
 *
 * EncodeHtmlEntity						- Encode HTML entity
 *
 * Inputs:	sText							- string to encode
 *
 * Returns:									- nothing
 *
 * Ref: Ref: https://gist.github.com/CatTail/4174511
 ************************************************************************/
var EncodeHtmlEntity = function(sText) {
    var sBuffer = [];
    for (var sIndex = sText.length - 1; sIndex >= 0; sIndex--) {
        sBuffer.unshift(['&#', sText[sIndex].charCodeAt(), ';'].join(''));
    }
    return sBuffer.join('');
}

/***********************************************************************
 *
 * ProductDetails							- Product details class definition
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ProductDetails() {
    this.m_sProdRef = ''; // product reference
    this.m_sSid = ''; // section id
    this.m_sName = ''; // product name
    this.m_sDescription = ''; // product description
    this.m_sSection = ''; // section name
    this.m_sImage = ''; // image name
    this.m_sAnchor = ''; // page name with anchor id
    this.m_sPrice = ''; // product price 
    this.m_mapProperties = {}; // properties map
    this.m_mapCompToPermutation = {}; // map of combinations to valid permutations
    this.m_sDecSection = ''; // decorated section
    this.m_sDecPriceBand = ''; // decorated price band
    this.m_sDecFilterString = ''; // decorated filter string
    this.m_mapDecChoices = {}; // decorated choice map
    this.m_mapUDPs = {}; // udps
    this.m_nStockLevel; // stock level
    this.m_bFullPermutation = false; // full permutation
}

/***********************************************************************
 *
 * ProductProperties						- Product properties
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ProductProperties() {
    this.m_mapChoices = {}; // choices content
    this.m_sPropID = ''; // property id
    this.m_bShow = false; // whether to show the property or not	
    this.m_bHideAlways = false; // hide always?
}

/***********************************************************************
 *
 * FilterChoiceDetails					- Product choices
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function FilterChoiceDetails() {
    this.m_sChoiceID = ''; // choice ID
    this.m_sChoiceName = ''; // choice name
    this.m_nChoiceCount = 0; // choice count
    this.m_bHideAlways = false; // hide always?
}

/***********************************************************************
 *
 * SetProductDetails						- Set the product details
 *
 * Inputs:	objProductDetails			- product details object
 *				arrProductInfo				- product information array
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function SetProductDetails(objProductDetails, arrProductInfo) {
    objProductDetails.m_sProdRef = arrProductInfo[0];
    objProductDetails.m_sSid = arrProductInfo[1];
    objProductDetails.m_sName = arrProductInfo[2];
    objProductDetails.m_sDescription = arrProductInfo[3];
    objProductDetails.m_sSection = arrProductInfo[4];
    objProductDetails.m_sImage = arrProductInfo[5];
    objProductDetails.m_sAnchor = arrProductInfo[6];
    objProductDetails.m_sPrice = arrProductInfo[7];
    var sPermutationString = arrProductInfo[8]; // simplified permutation string
    var sChildProducts = arrProductInfo[9]; // child products
    var sPropertiesString = arrProductInfo[10]; // properties string
    var sUDPstring = arrProductInfo[11]; // udp string
    objProductDetails.m_nStockLevel = arrProductInfo[14] // stock level

    var arrProperties = sPropertiesString.split(',');
    //
    // Create a map of child products to parent product
    //
    if (sChildProducts != '') {
        var arrChildProducts = sChildProducts.split('|');
        for (var nChildPodIdx = 0; nChildPodIdx < arrChildProducts.length; nChildPodIdx++) {
            var sChildProductRef = arrChildProducts[nChildPodIdx];
            if (sChildProductRef != '') {
                sChildProductRef = DecodeHtmlEntity(sChildProductRef);
                if (typeof(gMapChildToParentProducts[sChildProductRef]) === 'undefined') {
                    gMapChildToParentProducts[sChildProductRef] = new Array;
                }
                gMapChildToParentProducts[sChildProductRef].push(objProductDetails.m_sProdRef);
            }
        }
    }
    //
    // Set product properties details
    //
    var arrFilters = new Array();
    for (var nPropInx = 0; nPropInx < arrProperties.length; nPropInx++) {
        //
        // Create a map of product properties. The keys is the Propertiy ID
        //
        var arrPropDetails = arrProperties[nPropInx].split('!');
        var sPropId = arrPropDetails[0];
        var sPropCtrlId = 'S_' + sPropId;
        if (typeof(gMapFilterGrpIdToFilterGrpName[sPropCtrlId]) === 'undefined') {
            continue; // continue if property is defined
        }
        objProductDetails.m_mapProperties[sPropCtrlId] = new ProductProperties(); // map to array of properties
        for (var nChIdx = 1; nChIdx < arrPropDetails.length; nChIdx++) {
            var sChoices = arrPropDetails[nChIdx].replace(/(^\s*)|(\s*$)/gi, "");
            SetProductProperties(objProductDetails, sPropCtrlId, arrFilters, sPropId, sChoices);
        }
    }
    //
    // Set component details with decorated permutations for easy match
    // Example: (.*)\-S_654_0\:Red\-\-S_655_0\:Gold\-\-S_656_0\:I\-(.*)
    //
    var bInvalidEmptyPermsProduct = false;
    if (sPermutationString !== '') {
        var arrPermutations = sPermutationString.split(',');
        for (var nPermIdx = 0; nPermIdx < arrPermutations.length; nPermIdx++) {
            var sPattern = /(<(.*)>(.*))/igm;
            var arrMatch = sPattern.exec(arrPermutations[nPermIdx]);
            if (arrMatch !== null) {
                if (arrMatch[2] !== '') {
                    var arrAttributeCombinations = (arrMatch[2].toUpperCase()).split(':'); // attribute combination (Ex: S_254_0:S_255_0:S_256_0)
                    InsertSort(arrAttributeCombinations);
                    var sCombinationKey = arrAttributeCombinations.join(':');
                    //
                    // exclude undefined attribute combinations
                    //
                    for (var nAttrIdx = 0; nAttrIdx < arrAttributeCombinations.length; nAttrIdx++) {
                        if (typeof(gMapPropNameToPropId[arrAttributeCombinations[nAttrIdx]]) === 'undefined') {
                            arrAttributeCombinations.splice(nAttrIdx, 1);
                            nAttrIdx--;
                        }
                    }
                    //
                    // Check if any combination of attributes defined in filter options, if not the permutation
                    // details are not stored as they are not used 
                    //
                    var sTmpAttributes = '\\-' + arrAttributeCombinations.join('\\-.*\\-') + '\\-';
                    var oRegExAttr = new RegExp(sTmpAttributes, 'i'); // regular expression
                    if (arrAttributeCombinations.length == 0 || !oRegExAttr.test(g_sDefinedPropertiesPattern)) {
                        continue; // do not store the permutation
                    }
                    var sPerms = arrMatch[3];
                    if (sPerms === '') {
                        if (typeof(objProductDetails.m_mapCompToPermutation[sCombinationKey]) === 'undefined') {
                            objProductDetails.m_mapCompToPermutation[sCombinationKey] = 'EMPTY';
                            bInvalidEmptyPermsProduct = true;
                        }
                        continue;
                    }
                    var arrPermCombinations = (sPerms.toUpperCase()).split('|');
                    //
                    // Create a map of decorated valid permutations with the combination as key
                    //
                    for (var nIdx = 0; nIdx < arrPermCombinations.length; nIdx++) {
                        //
                        // prepare permutation regular expressions
                        //
                        var arrCombs = arrPermCombinations[nIdx].split('!!');
                        for (var nCombIdx = 0; nCombIdx < arrCombs.length; nCombIdx++) {
                            var arrTempComb = arrCombs[nCombIdx].split('!');
                            if (typeof(gMapPropNameToPropId[arrTempComb[0]]) === 'undefined') {
                                arrCombs.splice(nCombIdx, 1);
                                nCombIdx--;
                            }
                        }
                        if (arrCombs.length === 0) {
                            continue;
                        }
                        InsertSort(arrCombs);
                        var sTmpPerms = '\\-' + arrCombs.join('\\-.*\\-') + '\\-';
                        var arrTmpPerms = sTmpPerms.split('!');
                        var oRegEx = new RegExp(arrTmpPerms.join('\\:'), 'i'); // regular expression
                        //
                        // Create a map of valid permutations
                        //
                        if (typeof(objProductDetails.m_mapCompToPermutation[sCombinationKey]) === 'undefined' ||
                            objProductDetails.m_mapCompToPermutation[sCombinationKey] === 'EMPTY' || // might have been empty for some product
                            objProductDetails.m_mapCompToPermutation[sCombinationKey] === 'OSTOCK') // might have been out of stock for some product	
                        {
                            objProductDetails.m_mapCompToPermutation[sCombinationKey] = new Array;
                        }
                        objProductDetails.m_mapCompToPermutation[sCombinationKey].push(oRegEx); // permutation map of regular expressions
                    }
                }
            }
        }
    } else {
        objProductDetails.m_mapCompToPermutation['EMPTY'] = ''; // no permutation!
    }
    //
    // mark empty permutation products which are invalid
    //
    if (bInvalidEmptyPermsProduct && typeof(gMapInvalidProdRefs[objProductDetails.m_sProdRef]) !== 'undefined') {
        for (sCombinationKey in objProductDetails.m_mapCompToPermutation) {
            if (objProductDetails.m_mapCompToPermutation[sCombinationKey] !== 'EMPTY') {
                bInvalidEmptyPermsProduct = false;
            }
        }
        if (bInvalidEmptyPermsProduct) {
            gMapInvalidEmptyPermsProdRefs[objProductDetails.m_sProdRef] = 0;
        }
    }
    //
    // Update the price band count
    //
    if (IsFilterCountEnabled() || IsFilterAsDefaultView()) {
        var sPriceBand = GetPriceBand(parseInt(objProductDetails.m_sPrice));
        objProductDetails.m_sDecPriceBand = sPriceBand; // update the price band
        var sDecoratedPriceBand = 'PR_' + sPriceBand;
        arrFilters.push(sDecoratedPriceBand);
        objProductDetails.m_sDecSection = objProductDetails.m_sSid;
        var sDecoratedSection = 'SX_' + objProductDetails.m_sSid;
        arrFilters.push(sDecoratedSection);
    }
    //
    // Form decorated filter string for regexp match for filtering
    //
    InsertSort(arrFilters);
    var sDecoratedChoices = '!' + arrFilters.join('!!') + '!';
    objProductDetails.m_sDecFilterString = sDecoratedChoices;
    //
    // Fill in UDPs map
    //
    var arrUDPValues = sUDPstring.split(',');
    for (var nUDPIdx = 0; nUDPIdx < arrUDPValues.length; nUDPIdx++) {
        var arrUDPVarValues = arrUDPValues[nUDPIdx].split('|');
        objProductDetails.m_mapUDPs[arrUDPVarValues[0]] = arrUDPVarValues[1];
    }
}

/***********************************************************************
 *
 * SetProductProperties					- Set the product property details
 *
 * Inputs:	objProductDetails			- product details
 *				sPropCtrlId					- property control id
 *				arrFilters					- array of filter options
 *				sPropId						- product property id
 *				sChoices						- product property choices
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function SetProductProperties(objProductDetails, sPropCtrlId, arrFilters, sPropId, sChoices) {
    objProductProperties = objProductDetails.m_mapProperties[sPropCtrlId];
    objProductProperties.m_sPropID = sPropId;
    //
    // Special handling for choice type 'Any'
    // Note: Choice type 'Any' in the product details has property as '451_0:&#33;'
    //
    if (sChoices === '&#33;') {
        objProductProperties.m_mapChoices[0] = "";
        return;
    }
    var sArryChoices = sChoices.split('&#33;');
    //
    // Create array choices
    //
    for (var nChoiceIndx = 0; nChoiceIndx < sArryChoices.length; nChoiceIndx++) {
        var sChoice = sArryChoices[nChoiceIndx].replace(/(^\s*)|(\s*$)/gi, ""); // remove leading/trailing spaces
        var sCleanChoice = sChoice.replace(/(&#32;)/gi, " "); // replaces encoded charaters for space 
        objProductProperties.m_mapChoices[sCleanChoice] = nChoiceIndx;
        if (sCleanChoice !== '') {
            var sDecoratedChoice = 'S_' + sPropId + ':' + sCleanChoice;
            arrFilters.push(sDecoratedChoice);
            objProductDetails.m_mapDecChoices[sDecoratedChoice] = '';
        }
    }
}

/***********************************************************************
 *
 * OnSortStatic								- static sort order changing
 *
 * Inputs:	ctrlDropDown				- control name to identify
 *
 * Returns:  								- nothing
 *
 ************************************************************************/

function OnSortStatic(ctrlDropDown) {
    //
    // When loaded from a static page, there are two sort-order forms on the page.
    // This is the handler for the form in the static results. We have to update the
    // other form with the selection from this one, because after this one triggers it
    // is deleted and the dynamically inserted JS one is used.
    //
    var nSelectedIndex = ctrlDropDown.selectedIndex;

    var elFormSelectElement = GetSelectWithinSortForm('filter_sortorder');
    if (elFormSelectElement) {
        elFormSelectElement.selectedIndex = nSelectedIndex;
    }
    //
    // Continue with standard sorting
    //
    OnSort(ctrlDropDown);
}

/***********************************************************************
 *
 * OnSort										- Sorting local set of products
 *
 * Inputs:	ctrlDropDown				- control name to identify
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function OnSort(ctrlDropDown) {
    //
    // Note: Form name to be modified if different filter form is used
    //
    var filterSortOrderForm = document.forms['filter_sortorder'];
    var nSelectedIndex = ctrlDropDown.selectedIndex;
    var sSelectedSortOrder = ctrlDropDown.options[nSelectedIndex].value;
    g_bSortOrder = sSelectedSortOrder;
    AppendUseStorageHash(g_eFilterSettings.SORTORDER);
    if (g_nCurrenPageNumber != -1) {
        SetCurrentPageNumber(0);
    }
    //
    // Change the default sort order with the selected one
    //
    ShowLoadingDialog(); // show loading dialog
    UpdateSortOrder(sSelectedSortOrder);
    DoSort(sSelectedSortOrder, gArrResultSet); // do the sort
    RetrieveProductDetails(g_nCurrenPageNumber, false);
}

/***********************************************************************
 *
 * OnPagination								- Pagination of product results
 *
 * Inputs:	nPageNumber					- page number to navigate
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function OnPagination(nPageNumber) {
    AppendUseStorageHash(g_eFilterSettings.PAGINATION);
    RetrieveProductDetails(nPageNumber, false); // get product details
    $(function() {
        //
        // Scroll to filter result header
        //
        $("html, body").animate({
                scrollTop: $("#SortBy").offset().top
            },
            "slow");
    });
}

/***********************************************************************
 *
 * AppendUseStorageHash					- Append storage hash to URL
 *
 * Inputs:	eStorageSetting			- storage setting
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function AppendUseStorageHash(eStorageSetting) {
    if (!SDStorage.isSupported()) {
        return; // do not append hash if storage is not supported
    }
    var bHashAppended = false;
    if (window.location.hash == '') {
        window.location.hash = '#usestorage';
        bHashAppended = true;
    } else if (window.location.hash != '' && window.location.hash.indexOf('usestorage') != -1) {
        // do nothing
        bHashAppended = false;
    } else {
        window.location.hash = '#usestorage';
        bHashAppended = true;
    }
    if (eStorageSetting == g_eFilterSettings.FILTER) {
        g_bUseStorageFromClick = bHashAppended;
    } else {
        g_bUseStorageSortPage = bHashAppended;
    }
}

/***********************************************************************
 *
 * StoreSettings							- Store settings handler
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function StoreSettings() {
    if (!IsUseFilterStorage()) {
        return;
    }
    var sFilterOptions = ''; // filter settings to store
    var arrFilterSettings = new Array(); // array of filter settings
    var nFltrSetInd = 0;
    var bSel = false; // is there a selection to store?
    //
    // Get the filter selections from map and store the same
    //
    for (var sFilterGroup in gMapControlToSelection) {
        var mapFilterOptions = gMapControlToSelection[sFilterGroup];
        for (var sOption in mapFilterOptions) {
            var sKey = sFilterGroup + ':' + sOption;
            arrFilterSettings[nFltrSetInd++] = sKey;
            bSel = true;
        }
    }
    if (bSel) {
        sFilterOptions = arrFilterSettings.join(',');
    }
    SDStorage.writePage('filterSettings', sFilterOptions); // store filter options
    SDStorage.writePage('sortOrder', g_bSortOrder); // store filter sort order
    SDStorage.writePage('pageNumber', g_nCurrenPageNumber); // store filter pagination
}

/***********************************************************************
 *
 * ResetAllStorage							- Clear all storage settings
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ResetAllStorage() {
    ResetStorage(g_eFilterSettings.FILTER);
    ResetStorage(g_eFilterSettings.SORTORDER);
    ResetStorage(g_eFilterSettings.PAGINATION);
}

/***********************************************************************
 *
 * ResetStorage								- Reset storage setting
 *
 * Inputs:	eStorageSetting			- storage setting to reset
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ResetStorage(eStorageSetting) {
    switch (eStorageSetting) {
        case g_eFilterSettings.FILTER:
            SDStorage.writePage('filterSettings', '');
            break;

        case g_eFilterSettings.SORTORDER:
            g_bSortOrder = pg_sDefaultSortOrder;
            SDStorage.writePage('sortOrder', g_bSortOrder);
            break;

        case g_eFilterSettings.PAGINATION:
            g_nCurrenPageNumber = 0;
            SDStorage.writePage('pageNumber', g_nCurrenPageNumber);
            break;
    }
}

/***********************************************************************
 *
 * GetProductDetails						- Get the stored product details for the
 *								  		 			matched product reference
 *
 * Inputs:	sProdRef						- product reference to match
 *
 * Returns:  								- matched product details
 *
 ************************************************************************/
function GetProductDetails(sProdRef) {
    //
    // Look for the product details for the matched product reference
    //
    return gMapObjProductDetails[sProdRef];
}

/***********************************************************************
 *
 * IsProductDetailsCached				- Check if the product details are cached
 *
 * Inputs:	sProdRef						- product reference to match
 *
 * Returns:  								- true if matched
 *
 ************************************************************************/
function IsProductDetailsCached(sProdRef) {
    var bMatchFound = false;
    //
    // Look for the product details for the matched product reference
    //
    if (typeof(gMapObjProductDetails[sProdRef]) !== "undefined") {
        bMatchFound = true;
    }
    return bMatchFound;
}

/***********************************************************************
 *
 * GetPaginatedProducts					- Get the product numbers based on the page 
 *								  		 			for the given number
 *
 * Inputs:	arrInputProduct			- array of product references
 *				nPageNumber					- page number
 *
 * Returns:  arrProducts					- array of products found
 *
 ************************************************************************/
function GetPaginatedProducts(arrInputProduct, nPageNumber) {
    var arrProducts = new Array();
    if ((pg_nSearchResultsLimit === 0) || // believe that the global variable defined in HTML or
        (nPageNumber === -1)) // full page number is given?
    {
        g_nProductMinIndex = 0;
        g_nProductMaxIndex = arrInputProduct.length + 1;
    } else {
        g_nProductMinIndex = nPageNumber * pg_nSearchResultsLimit;
        g_nProductMaxIndex = (nPageNumber + 1) * pg_nSearchResultsLimit;
    }
    for (var nProductIndex = g_nProductMinIndex; nProductIndex < g_nProductMaxIndex; nProductIndex++) {
        if (typeof(arrInputProduct[nProductIndex]) !== "undefined") {
            arrProducts.push(arrInputProduct[nProductIndex]);
        }
    }
    return arrProducts;
}

/***********************************************************************
 *
 * GetParent									- Get the parent node
 *
 * Inputs: 	childObj						- child element for which the parent node
 *								  		  			to retrieve
 *		  		parentNodeName				- immediate parent node name
 *
 * Returns:  								- parent object
 *
 ************************************************************************/
function GetParent(parentNodeName, childObj) {
    var parentObj = childObj.parentNode;
    //
    // Find the immmediate parent node for the given node
    //
    if ((typeof(parentObj) != 'undefined') && (parentObj != null)) {
        if (parentObj.tagName != null) {
            while (parentObj.tagName !== parentNodeName.toUpperCase()) {
                parentObj = parentObj.parentNode;
            }
        }
    }
    return parentObj;
}

/***********************************************************************
 *
 * EditLabel									- Get the parent node
 *
 * Inputs: 	element						- element to be edited
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function EditLabel(element) {
    var childElements = element.childNodes; // get child nodes
    //
    // Process all the child nodes of the currently selected node
    //
    var liElements = element.parentNode.childNodes;
    for (var liIndex = 0; liIndex < liElements.length; liIndex++) {
        if (liElements[liIndex] !== null) {
            var liChildElements = liElements[liIndex].childNodes;
            for (var liChildInx = 0; liChildInx < liChildElements.length; liChildInx++) {
                if (liChildElements[liChildInx] !== null && liChildElements[liChildInx].nodeName == "LABEL") {
                    liChildElements[liChildInx].style.cssText = ''; // set the style attribute (IE & chrome tweaks)
                }
            }
        }
    }
    //
    // Process the child node of the currently selected node
    //
    for (var childIndex = 0; childIndex < childElements.length; childIndex++) {
        if ((childElements[childIndex] !== null) && (childElements[childIndex].nodeName == "LABEL")) {
            childElements[childIndex].style.cssText = 'color:red;'; // set the style attribute (IE tweaks)
        }
    }
}

/***********************************************************************
 *
 * UpdateResultSummary					- Update the result summary
 *
 * Inputs: 	bFound						- result found (true/false)
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function UpdateResultSummary(bFound) {
    //
    // Summary update
    //
    var elResultList = '';
    elResultList = document.getElementById("search_results_list");
    if (elResultList === null) // no result list?
    {
        ShowError('Tag with the id \'search_results_list\' is not found in Filter Results Layout, result summary might not be updated properly', g_ErrorCode.TAG);
        return;
    }
    if (!bFound) // no search result found
    {
        var sResultSummary = "<Actinic:S_SUMMARY></Actinic:S_SUMMARY>";
        elResultList.innerHTML = elResultList.innerHTML.replace(/(<Actinic:S_SUMMARY>(.*?)<\/Actinic:S_SUMMARY>)/ig, sResultSummary);
        return;
    }
    //
    // Get min max search result value to be displayed
    //
    var nMinMax = CalculateMinMaxSearchResult();
    var sResultSummary = "<Actinic:S_SUMMARY>" + "Results " + nMinMax[0] + "-" + nMinMax[1] + " of " + gArrSortedProductRefs.length + "</Actinic:S_SUMMARY>";
    elResultList.innerHTML = elResultList.innerHTML.replace(/(<Actinic:S_SUMMARY>(.*?)<\/Actinic:S_SUMMARY>)/ig, sResultSummary);
}

/***********************************************************************
 *
 * CalculateMinMaxSearchResult			- Calculate min max search result value 
 *									  				to be displayed
 *
 * Inputs: 	bFound						- result found (true/false)
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CalculateMinMaxSearchResult() {
    var nMinResultDisplay = g_nProductMinIndex + 1;
    var nMaxResultDisplay = 0;
    if (g_nProductMaxIndex > gArrSortedProductRefs.length) // result set size is less than the limit?
    {
        nMaxResultDisplay = gArrSortedProductRefs.length;
    } else {
        nMaxResultDisplay = g_nProductMaxIndex; // get the maximum value
    }
    return [nMinResultDisplay, nMaxResultDisplay];
}
/***********************************************************************
 *
 * UpdateResultContent					- Update the result content
 *
 * Inputs: 	resultContent				- content to update
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function UpdateResultContent(resultContent) {
    //
    // Cleanup any static contents
    //
    var searchResultContent = document.getElementById('FilterResultElements');
    var sStaticResults = document.getElementById('StaticResults');
    if (sStaticResults) {
        sStaticResults.innerHTML = '';
    }
    //
    // Update content
    //
    if (g_sResultLayout === g_eResultLayout.TABULAR) // for tabular layout
    {
        var productResultContent = '';
        productResultContent = document.getElementById('product-list');
        if (productResultContent) {
            productResultContent.innerHTML = resultContent;
        }
    } else // for standard layout
    {
        if (searchResultContent) {
            searchResultContent.innerHTML = resultContent; // stick to the html page
            searchResultContent.style.display = "block"; // ensure the block is displayed
        } else {
            //
            // Update to user
            //
            var sErrorMsg = "Tag with the id \"SearchResults\" is not found in filter option layout, filter might not work properly";
            ShowError(sErrorMsg, g_ErrorCode.TAG);
        }
    }
}

/***********************************************************************
 *
 * CreateSearchResultPageLinks			- Create search result page links
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CreateSearchResultPageLinks() {
    var resultListTemplate = document.getElementById("PaginationLinksTemplate");

    if (resultListTemplate) {
        //
        // pagination link template attributes
        //
        var sTemplate = resultListTemplate.innerHTML.replace(/(\n)/g, '');
        var mapPaginationDesignAttributes = {
            'nMaxVisibleLinks': '<Actinic:PAGINATION_VISIBLELINKS>(.*?)<\/Actinic:PAGINATION_VISIBLELINKS>',
            'sHeader': '<Actinic:PAGINATION_HEADER>(.*?)<\/Actinic:PAGINATION_HEADER>',
            'sShowFirstLink': '<Actinic:PAGINATION_SHOWFIRSTURL>(.*?)<\/Actinic:PAGINATION_SHOWFIRSTURL>',
            'sFirstPageURL': '<Actinic:PAGINATION_FIRSTPAGEURL>(.*?)<\/Actinic:PAGINATION_FIRSTPAGEURL>',
            'sPrevPageURL': '<Actinic:PAGINATION_PREVPAGEURL>(.*?)<\/Actinic:PAGINATION_PREVPAGEURL>',
            'sLinksPageURL': '<Actinic:PAGINATION_LINKSPAGEURL>(.*?)<\/Actinic:PAGINATION_LINKSPAGEURL>',
            'sNextPageURL': '<Actinic:PAGINATION_NEXTPAGEURL>(.*?)<\/Actinic:PAGINATION_NEXTPAGEURL>',
            'sLastPageURL': '<Actinic:PAGINATION_LASTPAGEURL>(.*?)<\/Actinic:PAGINATION_LASTPAGEURL>',
            'sFullPageURL': '<Actinic:PAGINATION_FULLPAGEURL>(.*?)<\/Actinic:PAGINATION_FULLPAGEURL>'
        }

        for (var key in mapPaginationDesignAttributes) {
            var pattern = new RegExp(mapPaginationDesignAttributes[key], 'gi');
            var arrMatches = pattern.exec(sTemplate);
            if (arrMatches) {
                var matchedValue = arrMatches[1];
                matchedValue = matchedValue.replace(/(&lt;)/ig, '<');
                matchedValue = matchedValue.replace(/(&gt;)/ig, '>');
                mapPaginationDesignAttributes[key] = matchedValue;
            } else {
                mapPaginationDesignAttributes[key] = '';
            }
        }
    }

    var sResultPageLinks = "";
    var nSearchResultsLimit = pg_nSearchResultsLimit;
    var nMaxVisibleLinks = parseInt(mapPaginationDesignAttributes['nMaxVisibleLinks']);
    //
    // ensure first split page is shown when full page is disabled
    //	
    if ((pg_bShowFullPageInPagination === 0) &&
        (g_nCurrenPageNumber === -1)) {
        g_nCurrenPageNumber = 0;
    }
    //
    // ensure filter results limit is not exceeded than the total number of results
    //
    if (nSearchResultsLimit > gArrSortedProductRefs.length) {
        nSearchResultsLimit = gArrSortedProductRefs.length;
    }
    //
    // Calculate number of pages
    //
    var nMaxPageCount = 0;
    if (nSearchResultsLimit !== 0) // if result limit is non zero
    {
        nMaxPageCount = Math.floor((gArrSortedProductRefs.length) / nSearchResultsLimit);
        if ((gArrSortedProductRefs.length) % nSearchResultsLimit !== 0) {
            nMaxPageCount++;
        }
    }

    if (nMaxPageCount < 2) // return if no of pages less than 2
    {
        return [sResultPageLinks, nMaxPageCount];
    }
    //
    // show first link when view all page is shown
    //
    if ((pg_bShowFullPageInPagination !== 0) &&
        (g_nCurrenPageNumber === -1)) {
        var sPageLabel = mapPaginationDesignAttributes['sShowFirstLink'];
        var sLink = "javascript:OnPagination(0)";
        sResultPageLinks = sPageLabel.replace(/<ACTINIC:PAGINATION_URLLINK><\/ACTINIC:PAGINATION_URLLINK>/gi, sLink);
        return [sResultPageLinks, nMaxPageCount];
    }

    //
    // include pagination header
    //
    sResultPageLinks = mapPaginationDesignAttributes['sHeader'];

    if (0 !== g_nCurrenPageNumber) // we are not on page 0
    {
        // 
        // first page URL
        //
        var sPageLabel = mapPaginationDesignAttributes['sFirstPageURL'];
        var sLink = "javascript:OnPagination(0)";
        sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_URLLINK><\/ACTINIC:PAGINATION_URLLINK>/gi, sLink);
        sResultPageLinks += sPageLabel;
        //
        // previous page URL
        //
        sPageLabel = mapPaginationDesignAttributes['sPrevPageURL'];
        sLink = "javascript:OnPagination(" + (g_nCurrenPageNumber - 1) + ")";
        sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_URLLINK><\/ACTINIC:PAGINATION_URLLINK>/gi, sLink);
        sResultPageLinks += sPageLabel;
    }

    if (nMaxVisibleLinks === 0) {
        nMaxVisibleLinks = nMaxPageCount;
    }

    //
    // calculate page offset w.r.t current page number
    //
    var nPageOffset = 0;
    if (g_nCurrenPageNumber > -1) {
        nPageOffset = Math.floor(g_nCurrenPageNumber / nMaxVisibleLinks);
    }

    var nStartPage = nPageOffset * nMaxVisibleLinks;
    var nMaxPage = nStartPage + nMaxVisibleLinks;

    if (nMaxPage > nMaxPageCount) {
        nMaxPage = nMaxPageCount;
    }
    //
    // format the page links
    //
    for (var nPageIndex = nStartPage; nPageIndex <= nMaxPage; nPageIndex++) // enumerate the result pages
    {
        var sLink = "javascript:OnPagination(" + nPageIndex + ")";
        var sPageLabel = mapPaginationDesignAttributes['sLinksPageURL'];
        var sLinkLable;
        var nPage = nPageIndex + 1;
        if (nPageIndex < nMaxPage) {
            if (nPageIndex === g_nCurrenPageNumber) {
                sLinkLable = " <b>" + nPage + "<\/b> ";
                sPageLabel = sPageLabel.replace(/<A(.*)<\/A>/gi, sLinkLable);
            } else {
                sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_INDEX><\/ACTINIC:PAGINATION_INDEX>/gi, nPage);
                sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_URLLINK><\/ACTINIC:PAGINATION_URLLINK>/gi, sLink);
            }
            sResultPageLinks += sPageLabel;
        } else if (nPageIndex < nMaxPageCount) {
            var sExtraLinks = "...";
            sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_INDEX><\/ACTINIC:PAGINATION_INDEX>/gi, sExtraLinks);
            sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_URLLINK><\/ACTINIC:PAGINATION_URLLINK>/gi, sLink);
            sResultPageLinks += sPageLabel;
        }
    }

    if (nMaxPageCount !== (g_nCurrenPageNumber + 1)) // we are not on page MAX (the + 1 is because the page number index is from 0 -> max - 1)
    {
        sLink = "javascript:OnPagination(" + (g_nCurrenPageNumber + 1) + ")";
        //
        // next page URL
        //
        sPageLabel = mapPaginationDesignAttributes['sNextPageURL'];
        sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_URLLINK><\/ACTINIC:PAGINATION_URLLINK>/gi, sLink);
        sResultPageLinks += sPageLabel;
        //
        // last page URL
        //		
        sLink = "javascript:OnPagination(" + (nMaxPageCount - 1) + ")";
        sPageLabel = mapPaginationDesignAttributes['sLastPageURL'];
        sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_URLLINK><\/ACTINIC:PAGINATION_URLLINK>/gi, sLink);
        sResultPageLinks += sPageLabel;
    }
    //
    // include view all page link if required
    //
    if (pg_bShowFullPageInPagination !== 0) {
        sPageLabel = mapPaginationDesignAttributes['sFullPageURL'];
        sLink = "javascript:OnPagination(-1)";
        var nTotalProducts = gArrSortedProductRefs.length;
        sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_URLLINK><\/ACTINIC:PAGINATION_URLLINK>/gi, sLink);
        sPageLabel = sPageLabel.replace(/<ACTINIC:PAGINATION_PRODUCTCOUNT><\/ACTINIC:PAGINATION_PRODUCTCOUNT>/gi, nTotalProducts);
        sResultPageLinks += sPageLabel;
    }
    return [sResultPageLinks, nMaxPageCount];
}

/***********************************************************************
 *
 * UpdatePaginatedLinks					- Create pagination links
 *
 * Inputs: 	bEnable						- enable pagination
 *				sPaginationLinks			- pagination links
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function UpdatePaginatedLinks(bEnable, sPaginationLinks) {
    //
    // Update pagination links top
    //
    var sResultPaginationLinksTop = document.getElementById('filter_pagination_links_top');
    if (sResultPaginationLinksTop) {
        if (bEnable) {
            sResultPaginationLinksTop.innerHTML = sPaginationLinks;
        } else {
            sResultPaginationLinksTop.innerHTML = '';
        }
    }
    //
    // Update pagination links top
    //
    var sResultPaginationLinksBottom = document.getElementById('filter_pagination_links_bottom');
    if (sResultPaginationLinksBottom) {
        if (bEnable) {
            sResultPaginationLinksBottom.innerHTML = sPaginationLinks;
        } else {
            sResultPaginationLinksBottom.innerHTML = '';
        }
    }
}

/***********************************************************************
 *
 * UpdateSortOrder							- Update sort order in filter form
 *
 * Inputs: 	sSortOrd						- sort order to update
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function UpdateSortOrder(sSortOrd) {
    var filterForm = document.forms['filter'];
    if (typeof(filterForm) !== "undefined") {
        var filterFormElements = filterForm.elements; // filter form elements
        for (var nIndex = 0; nIndex < filterFormElements.length; nIndex++) {
            if ((filterFormElements[nIndex].tagName === 'INPUT') && (filterFormElements[nIndex].name === 'SO')) {
                filterFormElements[nIndex].value = sSortOrd;
            }
        }
    }
}

/***********************************************************************
 *
 * GetPaginationDetails					- Get pagination details
 *
 * Returns:  								- actual search result limit and number of pages
 *
 ************************************************************************/
function GetPaginationDetails() {
    var nSearchResultLimit = 0;
    if (pg_nSearchResultsLimit > gArrSortedProductRefs.length) {
        nSearchResultLimit = gArrSortedProductRefs.length;
    } else {
        nSearchResultLimit = pg_nSearchResultsLimit;
    }
    //
    // Calculate number of pages
    //
    var nPages = 0;
    if (nSearchResultLimit !== 0) // if result limit is non zero
    {
        nPages = Math.floor((gArrSortedProductRefs.length) / nSearchResultLimit);
        if ((gArrSortedProductRefs.length) % nSearchResultLimit !== 0) {
            nPages++;
        }
    }
    return [nSearchResultLimit, nPages];
}

/***********************************************************************
 *
 * GetSortOrder								- Get sort order
 *
 * Returns:  								- sort order
 *
 ************************************************************************/
function GetSortOrder() {
    var sSortOrder = '';
    var filterForm = document.forms['filter'];
    if (typeof(filterForm) !== "undefined") {
        if (filterForm.SO) {
            sSortOrder = filterForm.SO.value;
        }
    }
    if ((sSortOrder === '') && (typeof(pg_sDefaultSortOrder) !== "undefined")) {
        sSortOrder = pg_sDefaultSortOrder; // default sort order
    }
    return sSortOrder;
}

/***********************************************************************
 *
 * ResetSortOrder							- Reset the with default sort order
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ResetSortOrder() {
    var filterForm = document.forms['filter'];
    var sStoredSortOrder = '';
    sStoredSortOrder = SDStorage.readPage('sortOrder');
    //
    //  loading sort order from local store if there is any
    //
    if (sStoredSortOrder) {
        g_bSortOrder = sStoredSortOrder;
        filterForm.SO.value = sStoredSortOrder;
    } else if ((typeof(filterForm) !== "undefined") && (typeof(pg_sDefaultSortOrder) !== "undefined")) {
        if (filterForm.SO) {
            g_bSortOrder = pg_sDefaultSortOrder;
            filterForm.SO.value = pg_sDefaultSortOrder;
        }
    }
    var frmFiltersortOrder = document.forms['filter_sortorder']
    var options = '';
    if (typeof(filterForm) !== "undefined") {
        options = frmFiltersortOrder.getElementsByTagName('option');
    }
    for (var i in options) {
        if (options[i].value === g_bSortOrder) {
            options[i].selected = 'selected';
        } else {
            options[i].selected = '';
        }
    }
}

/***********************************************************************
 *
 * SetCurrentPageNumber					- Set the current search result page number
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function SetCurrentPageNumber(nPageNumber) {
    g_nCurrenPageNumber = nPageNumber;
}

/***********************************************************************
 *
 * SetStoredPageNumber					- Set the stored page number and 
 *													set the global variable
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function SetStoredPageNumber() {
    var nPageNumber = SDStorage.readPage('pageNumber');
    if (nPageNumber != null) {
        g_nCurrenPageNumber = nPageNumber;
    } else {
        g_nCurrenPageNumber = 0;
    }
}

/***********************************************************************
 *
 * ShowLoadingDialog						- Show loading dialog
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ShowLoadingDialog() {
    var loadingDialog = document.getElementById('loading-dialog');
    if (loadingDialog) {
        loadingDialog.style.display = "block"; // show the dialog
    }
}

/***********************************************************************
 *
 * HideLoadingDialog						- Hide loading dialog
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function HideLoadingDialog() {
    var loadingDialog = document.getElementById('loading-dialog');
    if (loadingDialog) {
        loadingDialog.style.display = "none"; // hide the dialog
    }
}

/***********************************************************************
 *
 * GetProdRefsOfNonCachedProductDetails	- Get the product references of 
 *										  			  non cached product details
 *
 * Inputs:	arrProductRefs				- array of product to check
 *
 * Returns:  								- array of product refs of non cached 
 *										  		  product details
 *
 ************************************************************************/
function GetProdRefsOfNonCachedProductDetails(arrProductRefs) {
    var arrNonCachedProdRefs = new Array();
    arrNonCachedProdRefs.length = 0;
    if (arrProductRefs.length !== 0) {
        for (var prodRefIndx = 0; prodRefIndx < arrProductRefs.length; prodRefIndx++) {
            if (!IsProductDetailsCached(arrProductRefs[prodRefIndx])) {
                arrNonCachedProdRefs.push(arrProductRefs[prodRefIndx]);
            }
        }
    }
    return arrNonCachedProdRefs;
}

/***********************************************************************
 *
 * CacheProductDetails					- Cache product details on the global
 * 									  		 	 variable
 *
 * Inputs:	arrProductDetailsSet		- product details set return from ajax call
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CacheProductDetails(arrProductDetailsSet) {
    for (var nProdCount = 0; nProdCount < arrProductDetailsSet.length; nProdCount++) {
        var productInfo = arrProductDetailsSet[nProdCount].ProductInfo;
        var sProdRef = productInfo[0];
        //
        // Check stock and exclude the the product if necessary
        //
        // productInfo[12] -> stock controlled
        // productInfo[13] -> in stock
        //
        if (IsOutOfStock(sProdRef, productInfo[12], productInfo[13])) {
            continue; // not cached/excluded from filtering
        }
        gMapObjProductDetails[sProdRef] = new ProductDetails(); // product details map with ProdRef as index
        SetProductDetails(gMapObjProductDetails[sProdRef], productInfo); // set product details
    }
}

/***********************************************************************
 *
 * IsOutOfStock								- Is out stock in real time
 *
 * Inputs:	sProdRef						- product reference
 *				bIsStockControlled		- stock controlled?
 *				bInStockStatic				- static stock from product details
 *
 * Returns:  								- true/false
 *
 ************************************************************************/

function IsOutOfStock(sProdRef, bIsStockControlled, bInStockStatic) {
    var bOutOfStock = IsOutOfStockFromStockFilter(sProdRef); // is out stock from filter file
    if (IsExcludeOutOfStockItems() && bIsStockControlled) {
        if (bOutOfStock == null) // not found in stockfilter file
        {
            if (bInStockStatic <= 0) // out of stock as per assoc prod details
            {
                return (true);
            }
        } else {
            if (bOutOfStock) // out of stock as per stockfilter file
            {
                return (true);
            }
        }
    }
    return (false);
}

//--------------------------------------------------------------
//
// Filter Count
//
//--------------------------------------------------------------

//
// global variables for filter count
//	
var gMAX_INT = "9007199254740992"; // maximum int value
var gMapPriceBandPriceRange = {}; // formatted price range map with price band ID as key
var gMapFilters = {}; // properties map with property ID as key
var gMapDefCtrlSelections = {}; // map of default control selections
var gArrayPriceIDs = new Array(); // array of price band ID
var gArraySectionIDs = new Array(); // array of section ID
var gMapControlIdChoiceName = {}; // map of control id to choice name
var gMapPropIdToBtnClearStatus = {}; // map of property id to clear button status
var gMapCtrlSelections = {}; // map of control selections (example: S_0_422335_0-10:true)
var gMapPropCtrlSelections = {}; // map of property control selections (example: BRAND_0:ADIDAS:true)
var gMapPropIdToSelections = {}; // map of property id to selections (example: S_0_422335_0:Array[SIZE OPTIONS_0:UK 9, SIZE OPTIONS_0:UK 10])
var gMapControlToSelection = {}; // map of control selections (example: S_0_422335_0:Object[S_0_422335_0-10:"", S_0_422335_0-9:""])
//
// Enum for the control type
//
var g_eControlType = {
    BUTTON: 1, // check box/radio button
    LIST: 2, // list (single/multiple select/drop down)
    LINK: 4, // clickable link 
    UNDEFINED: 5 // undefined
};

/***********************************************************************
 *
 * UpdateFilterCount						- Main function to fetch and update filter
 *							  	  		  			count
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function UpdateFilterCount() {
    if (!IsFilterCountEnabled()) {
        return;
    }
    //
    // Return if the global variable is undefined
    //
    if ((typeof(pg_arrayPriceBandValues) === "undefined") || (typeof(pg_arrayProperties) === "undefined")) {
        return;
    }
    CalculateCount(false); // calculate count
    if (g_bFirstLoad && !g_bHasPresetOptions && !HasFilterStorage()) // has preset value
    {
        RemoveFilterWithZeroCount(); // remove filter options with zero count
    }
    GenerateDynamicFilterOptions(); // generate dynamic filter options
    ClearFilterCounts(); // clear off the filter options counts
}

/***********************************************************************
 *
 * CacheDefinedPriceBands				- Cache the price bands in numeric values
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function CacheDefinedPriceBands() {
    if (typeof(pg_arrayPriceBandValues) === "undefined") {
        var sErrorMsg = "Global variables 'pg_arrayPriceBandValues' is not defined, filtering functionality might not be available";
        ShowError(sErrorMsg, g_ErrorCode.UNDEFINED);
        return; // return if the the global variable is undefined
    }
    //
    // Create map of price bands with the key as the priceband id
    //
    gMapFilterGrpIdToFilterGrpName['PR'] = 'PR'
    gArrFilterGrpIdSorted.push('PR');
    gMapFilters['PR'] = {};
    gMapFilters['PR'].m_bShow = false;
    for (var nPRIndx = 0; nPRIndx < pg_arrayPriceBandValues.length; nPRIndx++) {
        var arrPriceBand = pg_arrayPriceBandValues[nPRIndx].split(":");
        var nMinMax = arrPriceBand[1].split("-");
        var sPriceBandID = arrPriceBand[0]; // price ID
        gArrayPriceIDs.push(sPriceBandID); // array to hold the price band ID
        gMapFilters['PR'][sPriceBandID] = new PriceBandDetails();
        if (nPRIndx === (pg_arrayPriceBandValues.length - 1)) {
            nMinMax[1] = gMAX_INT;
        }
        SetPriceDetails(gMapFilters['PR'][sPriceBandID], nMinMax[0], nMinMax[1]); // set the price band details
    }
}

/***********************************************************************
 *
 * PriceBandDetails						- Price band details class definition
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function PriceBandDetails() {
    this.m_nMin = 0; // minimum price
    this.m_nMax = 0; // maximum price
    this.m_nCount = 0; // number of product count
    this.m_bHideAlways = false; // hide always?
}

/***********************************************************************
 *
 * SetPriceDetails							- Set the price band details
 *
 * Inputs:	objPriceBandDetails		- price band details to update
 *				nMinValue					- minimum value
 *				nMaxValue					- maximum value
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function SetPriceDetails(objPriceBandDetails, nMinValue, nMaxValue) {
    objPriceBandDetails.m_nMin = parseInt(nMinValue);
    objPriceBandDetails.m_nMax = parseInt(nMaxValue);
}

/***********************************************************************
 *
 * GetPriceBand								- Get price band for the given price
 *
 * Inputs:	nPrice						- price to get the prceband
 *
 * Returns:  								- priceband id
 *
 ************************************************************************/
function GetPriceBand(nPrice) {
    var sPriceBandId = '-1'; // set to default band
    var mapPriceBands = gMapFilters['PR']; // get the priceband filters
    for (var sPriceId in mapPriceBands) {
        var nMinPrice = mapPriceBands[sPriceId].m_nMin;
        var nMaxPrice = mapPriceBands[sPriceId].m_nMax;
        if ((nPrice >= nMinPrice) && (nPrice <= nMaxPrice)) // price within the range?
        {
            sPriceBandId = sPriceId;
            break;
        }
    }
    return sPriceBandId;
}

/***********************************************************************
 *
 * GenerateDynamicFilterOptions		- Generate filter options
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function GenerateDynamicFilterOptions() {
    CreateFilterSectionOptions(); // generate section/department options
    CreateFilterPriceBandOptions(); // generate price band filter options
    CreateFilterPropertyOptions(); // generate filter property options
}

/***********************************************************************
 *
 * ClearFilterCounts						- Clear off filter options counts
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ClearFilterCounts() {
    for (var sFilterGroup in gMapFilters) {
        if (sFilterGroup === 'PR') // filter price group
        {
            var mapPriceBands = gMapFilters[sFilterGroup];
            for (var sPriceId in mapPriceBands) {
                mapPriceBands[sPriceId].m_nCount = 0;
            }
            gMapFilters[sFilterGroup].m_bShow = false; // do not show the group header by default
        } else if (sFilterGroup === 'SX') // filter section group
        {
            var mapSections = gMapFilters[sFilterGroup];
            for (var sSectionId in mapSections) {
                mapSections[sSectionId].m_nCumulativeCount = 0; // clear off the cumulative count
                mapSections[sSectionId].m_nCount = 0;
            }
            gMapFilters[sFilterGroup].m_bShow = false; // do not show the group header by default
        } else // filter property group
        {
            var mapChoices = gMapFilters[sFilterGroup].m_mapChoices;
            for (var sChoiceId in mapChoices) {
                mapChoices[sChoiceId].m_nChoiceCount = 0;
                gMapFilters[sFilterGroup].m_bShow = false; // do not show the group header by default
            }
        }
    }
}

/***********************************************************************
 *
 * cacheProductProperties				- Cache prduct properties
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CacheDefinedChoices() {
    if (typeof(pg_arrayProperties) === "undefined") {
        var sErrorMsg = "Global variables 'pg_arrayProperties' is not defined, filtering functionality might not be available";
        ShowError(sErrorMsg, g_ErrorCode.UNDEFINED);
        return;
    }
    for (var nPropIndx = 0; nPropIndx < pg_arrayProperties.length; nPropIndx++) {
        if (typeof(pg_arrayProperties[nPropIndx]) !== "undefined") {
            //
            // The pg_arrayProperties values will be of the format S&#95;451-1:Red (S_PropID-ChoiceNumber:ChoiceName)
            //
            var arrayPropIDChoice = pg_arrayProperties[nPropIndx].split(":");
            var sPropIDChoice = arrayPropIDChoice[0].replace(/(&#95;)/g, "_"); // replace the encoded character
            var sPropIDChoiceNo = sPropIDChoice.split("-");
            var sPropID = sPropIDChoiceNo[0]; // property ID
            var sChoiceNo = sPropIDChoiceNo[1]; // choice No
            var sChoiceName = arrayPropIDChoice[1];

            //
            // Create decorated choices in sorted order
            //
            gMapControlIdChoiceName[sPropIDChoice] = sChoiceName;
            if (typeof(gMapPropIdDecoratedChoices[sPropID]) === 'undefined') {
                gMapPropIdDecoratedChoices[sPropID] = new Array();
            }
            if (sChoiceName !== '') {
                var sDecoratedChoiceName = gMapFilterGrpIdToFilterGrpName[sPropID] + ':' + sChoiceName;
                sDecoratedChoiceName.toUpperCase();
                if (GetArrayIndex(gMapPropIdDecoratedChoices[sPropID], sDecoratedChoiceName) == -1) // create a map of decorated choices
                {
                    gMapPropIdDecoratedChoices[sPropID].push(sDecoratedChoiceName);
                    InsertSort(gMapPropIdDecoratedChoices[sPropID]); // sort
                }
            }
            //
            // Cache filters
            //
            if (typeof(gMapFilters[sPropID]) === "undefined") {
                gMapFilters[sPropID] = new ProductProperties(); // create a map of properties with the property ID as key
            }
            //
            // Create a map of product property choices with the key as ChoiceNo (1, 2, 3...)
            //
            if (typeof(gMapFilters[sPropID].m_mapChoices[sChoiceNo]) === "undefined") {
                gMapFilters[sPropID].m_mapChoices[sChoiceNo] = new FilterChoiceDetails(); // create a map of choices with choice ID as key
            }
            if (typeof(gMapFilters[sPropID].m_mapChoices[sChoiceNo]) !== "undefined") {
                SetDefinedChoices(gMapFilters[sPropID].m_mapChoices[sChoiceNo], sPropID, sPropIDChoice, sChoiceName); // set the defined choices
            }
        }
    }
}

/***********************************************************************
 *
 * SetDefinedChoices						- Get property choices count
 *
 * Inputs:	objDefinedChoices			- property choice object
 *				sPropID						- property ID
 *				sChoiceID					- choice ID (say, S_145-1)
 *				sChoiceName					- choice name
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function SetDefinedChoices(objDefinedChoices, sPropID, sChoiceID, sChoiceName) {
    objDefinedChoices.m_sChoiceID = sChoiceID; // set the choice ID
    objDefinedChoices.m_sChoiceName = sChoiceName; // set the choice name
    gMapFilters[sPropID].m_bShow = false; // mark to show this property
}

/***********************************************************************
 *
 * CachePriceBandPriceRange				- Cache the formatted price bands
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CachePriceBandPriceRange() {
    if (typeof(pg_arrayPriceBandRange) === "undefined") {
        return; // return if the the global variable is undefined
    }
    //
    // Create map of price bands with the key as the priceband id
    //
    for (var nPRIndx = 0; nPRIndx < pg_arrayPriceBandRange.length; nPRIndx++) {
        var arrPriceBand = pg_arrayPriceBandRange[nPRIndx].split(":");
        var sPriceBandId = arrPriceBand[0];
        gMapPriceBandPriceRange[sPriceBandId] = arrPriceBand[1];
    }
}

/***********************************************************************
 *
 * CreateFilterPriceBandOptions		- Create filter price band options dynamically
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CreateFilterPriceBandOptions() {
    //
    // 1. Read the filter priceband layout based on id "FilterPriceBandOptions"
    // 2. Read the filter priceband options template using the id "PriceOptionTemplate"
    // 3. Replace the Filter Tags with the appropriate value and generate the list of options
    //
    //  Sample filter option template:
    //  ------------------------------
    //	<div id="PriceOptionTemplate" style="display:none;">
    //	<input type="checkbox" value="<Actinic:PriceIndex></Actinic:PriceIndex>" name="PR" id="<Actinic:PriceIndex></Actinic:PriceIndex>"/>
    //	<label for="<Actinic:PriceIndex></Actinic:PriceIndex>"><Actinic:PriceBand></Actinic:PriceBand></label>
    //	<br/>
    //	</div>
    //
    var sFilterElement = ''; // filter element from price band options template
    var sFilterOptions = ''; // filter tags option from price option template
    sFilterElement = document.getElementById('FilterPriceBandOptions');
    sFilterOptions = document.getElementById('PriceOptionTemplate');
    if ((sFilterElement === null) || (sFilterOptions === null)) {
        var sErrorMsg = "Tag with the id \"FilterPriceBandOptions\" OR \"PriceOptionTemplate\" is not found in filter option layout, \
filter count might not work for price band";
        ShowError(sErrorMsg, g_ErrorCode.TAG);
        return; // return if undefined
    }
    //
    // Hide the price band label when all option count zero
    //
    var bHideLabel = false; // hide label?
    if ((IsHideChoiceWithZeroResults() && IsFilterCountEnabled()) ||
        (IsFilterCountEnabled() && g_bFirstLoad)) // check for hide filter group empty/all count 0 options for onload
    {
        var sPriceLabel = document.getElementById('PR');
        if (!gMapFilters['PR'].m_bShow) {
            sPriceLabel.style.display = "none"; // hide label
            bHideLabel = true;
        } else {
            sPriceLabel.style.display = "block"; // show label
            bHideLabel = false;
        }
    }
    var sFilterOptionsTemplate = sFilterOptions.outerHTML;
    var sFilterOptionTemplate = sFilterOptions.innerHTML;
    var sDummyFilterOptionTemplate = '';
    var sResultOptions = '';
    var sControl = GetLayoutType(sFilterOptionTemplate); // get layout type
    //
    // Create Select start template
    //
    var sPriceOptionTemplateSelectTemplate = ''; // Price option select template
    var sPriceOptionTemplateSelectStart = ''; // select opening tag
    var sPriceOptionTemplateSelectEnd = ''; // select closing tag
    var sPriceOptionTemplateSelect = ''; // select tag
    sPriceOptionTemplateSelect = document.getElementById('PriceOptionTemplateSelect');
    if (sPriceOptionTemplateSelect !== null) {
        sPriceOptionTemplateSelectTemplate = sPriceOptionTemplateSelect.outerHTML;
        var sPriceOptionTemplateSelectContent = sPriceOptionTemplateSelect.innerHTML;
        var sSelectTagIndex = sPriceOptionTemplateSelectContent.toLowerCase().indexOf("</act:select>");
        //
        // Format select tag used for list controls
        //
        if (sSelectTagIndex > 0) {
            sPriceOptionTemplateSelectStart = sPriceOptionTemplateSelectContent.substring(0, sSelectTagIndex);
            sPriceOptionTemplateSelectStart = sPriceOptionTemplateSelectStart.replace(/(ACT:SELECT)/ig, 'select');
            sPriceOptionTemplateSelectEnd = "</select>";
        }
    }
    //
    // Manipulation of UL tags
    //
    var sPriceOptionStartULElement = '';
    var sPriceOptionStartULContent = '';
    var sPriceOptionStartULTemplate = '';
    var sPriceOptionEndULElement = '';
    var sPriceOptionEndULContent = '';
    var sPriceOptionEndULTemplate = '';
    sPriceOptionStartULElement = document.getElementById('PriceOptionTemplateStartUL');
    if (sPriceOptionStartULElement !== null) {
        sPriceOptionStartULContent = sPriceOptionStartULElement.innerHTML;
        sPriceOptionStartULTemplate = sPriceOptionStartULElement.outerHTML;
        sPriceOptionStartULContent = sPriceOptionStartULContent.replace(/(&lt;)/ig, '<');
        sPriceOptionStartULContent = sPriceOptionStartULContent.replace(/(&gt;)/ig, '>');
    }
    sPriceOptionEndULElement = document.getElementById('PriceOptionTemplateEndUL');
    if (sPriceOptionEndULElement !== null) {
        sPriceOptionEndULContent = sPriceOptionEndULElement.innerHTML;
        sPriceOptionEndULTemplate = sPriceOptionEndULElement.outerHTML;
        sPriceOptionEndULContent = sPriceOptionEndULContent.replace(/(&lt;)/ig, '<');
        sPriceOptionEndULContent = sPriceOptionEndULContent.replace(/(&gt;)/ig, '>');
    }
    //
    // Create default options if dropdown listbox layout used
    //
    if (!bHideLabel && (sPriceOptionTemplateSelectTemplate !== '') && IsDropDownListBox(sPriceOptionTemplateSelectTemplate)) {
        sDummyFilterOptionTemplate = sFilterOptionTemplate;
        sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(&lt;Actinic:PriceIndex&gt;&lt;\/Actinic:PriceIndex&gt;)/ig, '-1');
        sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(<Actinic:PriceIndex><\/Actinic:PriceIndex>)/ig, '-1');
        sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(<Actinic:PriceBand><\/Actinic:PriceBand>)/ig, 'Any'); // devfault option
        var sKey = "PR:-1";
        var sSelection = '';
        if (typeof(gMapCtrlSelections[sKey]) !== "undefined") {
            sSelection = "selected"; // default list box
        }
        sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(ActinicDisabledCtrl=\"\")/ig, '');
        sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(ActinicDisabledStyle=\"\")/ig, '');
        sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(ActinicCustomSelection=\"\")/ig, sSelection);
        sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(ACT:OPTION)/ig, 'option');
        sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(<Actinic:HiddentInput><\/Actinic:HiddentInput>)/ig, ''); // hidden parameter
        sResultOptions += sDummyFilterOptionTemplate;
    }
    //
    // Create other price options
    //
    var nCount = 0;
    var nListCount = 1; // default size is one!
    sDummyFilterOptionTemplate = ''; // clear off
    for (var nPRIndx = 0; nPRIndx < gArrayPriceIDs.length; nPRIndx++) {
        var sPriceId = gArrayPriceIDs[nPRIndx];
        if (typeof(gMapFilters['PR'][sPriceId]) === "undefined" ||
            gMapFilters['PR'][sPriceId].m_bHideAlways) // hide always?
        {
            continue;
        }
        sHiddenInput = "";
        nCount = gMapFilters['PR'][sPriceId].m_nCount; // get the price band count
        if ((!IsFilterCountEnabled()) || // filter not enabled?
            ((IsHideChoiceWithZeroResults() && nCount > 0) || (!IsHideChoiceWithZeroResults()))) {
            nListCount++;
            //
            // Replace "Price Index", "Price Band" with count and Selection (checked / selected)
            //
            sDummyFilterOptionTemplate = sFilterOptionTemplate;
            sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(&lt;Actinic:PriceIndex&gt;&lt;\/Actinic:PriceIndex&gt;)/ig, gArrayPriceIDs[nPRIndx]);
            sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(<Actinic:PriceIndex><\/Actinic:PriceIndex>)/ig, gArrayPriceIDs[nPRIndx]);
            var sPriceBand = gMapPriceBandPriceRange[gArrayPriceIDs[nPRIndx]].replace(/(&nbsp;)/ig, ' ')
            if (IsFilterCountEnabled()) {
                sPriceBand += ' (' + nCount + ')';
            }
            sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(<Actinic:PriceBand><\/Actinic:PriceBand>)/ig, sPriceBand);
            //
            // Remember the previous selection
            //
            var sKey = "PR:" + gArrayPriceIDs[nPRIndx];
            var sSelection = "";
            var sDisabledStyle = ""; // disabled style for label
            var sDisabledCtrl = ""; // disabled control type
            if (typeof(gMapCtrlSelections[sKey]) !== "undefined") {
                if (sControl === 'LIST') {
                    sSelection = "selected"; // list box
                } else if (sControl === 'LINKS') {
                    //
                    // Edit style for submit button
                    //					
                    sSelection = "style=\"color:red\""; // clickable links
                    sHiddenInput = "<input type=\"hidden\" value=\"" + gArrayPriceIDs[nPRIndx] + "\" name=\"hf_PR\" id=\"hf_PR\"/>";
                } else {
                    sSelection = "checked"; // radio button / check box
                }
            }
            if (IsFilterCountEnabled() && !IsHideChoiceWithZeroResults()) {
                if (sControl === 'LIST') {
                    if (!(nCount > 0)) {
                        sDisabledCtrl = "disabled=\"disabled\""; // disable lists
                    }
                } else if (sControl === 'LINKS') {
                    if (!(nCount > 0)) {
                        sDisabledCtrl = "disabled=\"disabled\""; // disable
                        sDisabledStyle = "style=\"color:gray;cursor:default\""; // make gray
                    }
                } else {
                    if (!(nCount > 0)) {
                        sDisabledCtrl = "disabled=\"disabled\""; // disable buttons (check box/radio buttons)
                        sDisabledStyle = "style=\"color:gray\"";
                    }
                }
            }
            sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(ActinicDisabledCtrl=\"\")/ig, sDisabledCtrl);
            sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(ActinicDisabledStyle=\"\")/ig, sDisabledStyle);
            sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(ACT:OPTION)/ig, 'option'); // replace custom tag "ACT:OPTION" with "option"
            sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(ActinicCustomSelection=\"\")/ig, sSelection);
            sDummyFilterOptionTemplate = sDummyFilterOptionTemplate.replace(/(<Actinic:HiddentInput><\/Actinic:HiddentInput>)/ig, sHiddenInput);
            sResultOptions += sDummyFilterOptionTemplate;
        }
    }
    //
    // Update the count if any!
    //
    if (!bHideLabel) // hide label?
    {
        sPriceOptionTemplateSelectStart = sPriceOptionTemplateSelectStart.replace(/(&lt;Actinic:ListCount&gt;&lt;\/Actinic:ListCount&gt;)/ig, nListCount);
        sPriceOptionTemplateSelectStart = sPriceOptionTemplateSelectStart.replace(/(<Actinic:ListCount><\/Actinic:ListCount>)/ig, nListCount);
    } else {
        sPriceOptionTemplateSelectStart = '';
        sPriceOptionStartULContent = '';
        sResultOptions = '';
        sPriceOptionEndULContent = '';
        sPriceOptionTemplateSelectEnd = '';
    }
    //
    // Update the filter price band content with the template and the needed filter options
    //
    sFilterElement.innerHTML = (sPriceOptionTemplateSelectTemplate + // select tag template
        sFilterOptionsTemplate + // option template
        sPriceOptionStartULTemplate + // start UL template
        sPriceOptionEndULTemplate + // end UL template
        sPriceOptionTemplateSelectStart + // select start tag
        sPriceOptionStartULContent + // opening ul tag
        sResultOptions + // option tag
        sPriceOptionEndULContent + // closing ul tag
        sPriceOptionTemplateSelectEnd); // select end tag
}

/***********************************************************************
 *
 * CreateFilterPropertyOptions			- Create filter properties options dynamically
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CreateFilterPropertyOptions() {
    //
    // 1. Read the filter property layout based on id "FilterPropertyOptions_PropertyId"
    // 2. Read the filter property options template using the id "PropOptionTemplate_PropertyId"
    // 3. Replace the Filter Tags with the appropriate value and generate the list of options
    //
    //  Sample filter property option template:
    //  ---------------------------------------
    //	<div id="PropOptionTemplate_<actinic:variable name="FilterPropControlName" />" style="display:none;">
    //	<input type="checkbox" name="<Actinic:FilterPropValueName></Actinic:FilterPropValueName>" value="<Actinic:FilterPropValue></Actinic:FilterPropValue>" id="<Actinic:FilterPropChoiceID></Actinic:FilterPropChoiceID>"/>
    //	<label for="<Actinic:FilterPropChoiceID></Actinic:FilterPropChoiceID>"><Actinic:FilterPropText></Actinic:FilterPropText></label>
    //	<br/>
    //	</div>
    //
    for (var nPropIndx = 0; nPropIndx < gArrProperty.length; nPropIndx++) {
        if (typeof(gArrProperty[nPropIndx]) !== "undefined") {
            var sPropID = gArrProperty[nPropIndx];
            var sFilterPropTagName = "FilterPropertyOptions_" + sPropID; // get filter property option content
            var sFilterPropOptionTagName = "PropOptionTemplate_" + sPropID; // get property option template
            var sFilterPropertyElement = ''; // filter property element template
            var sFilterPropertyTag = ''; // filter property tag template
            sFilterPropertyElement = document.getElementById(sFilterPropTagName);
            sFilterPropertyTag = document.getElementById(sFilterPropOptionTagName);
            //
            // Check if the templates are defined
            //
            if ((sFilterPropertyElement === null) || (sFilterPropertyTag === null)) {
                var sErrorMsg = "Tag with the id" + sFilterPropTagName + " OR " + sFilterPropOptionTagName + "is not found in filter option layout, \
filter count might not work for the property ID " + sPropID;
                ShowError(sErrorMsg, g_ErrorCode.TAG);
                continue; // continue if undefined
            }
            var sFilterPropertyOptionTagContent = sFilterPropertyTag.innerHTML;
            var sFilterPropertyOptionTemplate = sFilterPropertyTag.outerHTML;
            var sControl = GetLayoutType(sFilterPropertyOptionTagContent); // get layout type
            //
            // Show only the options with count non-zero
            //
            var sDummyFilterPropOptionTemplate = '';
            var sResultOptions = '';
            var bHidden = false; // is property hidden?
            if (typeof(gMapFilters[sPropID]) !== "undefined") {
                var sArrayChoices = gMapFilters[sPropID].m_mapChoices;
                var nChoiceInx = 1;
                //
                // Check if the property group to be shown at all
                // Get element by id name (say S&#95;451) and hide/show
                //
                if ((IsHideChoiceWithZeroResults() && IsFilterCountEnabled()) ||
                    (IsFilterCountEnabled() && g_bFirstLoad) // check for hide filter group empty/all count 0 options for onload
                    ||
                    (gMapFilters[sPropID].m_bHideAlways)) // hide always?
                {
                    var sPropLabel = document.getElementById(sPropID);
                    if ((g_bFirstLoad && gMapFilters[sPropID].m_bHideAlways) || // onload and hide always
                        (g_bFirstLoad && !gMapFilters[sPropID].m_bShow && IsHideChoiceWithZeroResults()) || // onload, hide zero results & all filter options with zero counts
                        (!g_bFirstLoad && !gMapFilters[sPropID].m_bShow)) // not onload but all options count with zero
                    {
                        sPropLabel.style.display = "none"; // hide label
                        sFilterPropertyElement.style.display = "none"; // hide filter property element
                        bHidden = true; // property not hidden
                    } else {
                        sPropLabel.style.display = "block"; // show label
                        sFilterPropertyElement.style.display = "block"; // show filter property element
                        bHidden = false;
                    }
                }
                //
                // Manipulate for list controls
                //
                var sPropOptionSelectContent = ""; // select tag for property options (say: <ACT:SELECT ...></ACT:SELECT>)
                var sPropOptionSelectTemplate = ""; // select template (say: <div id="PropOptionTemplateSelect_PropId><ACT:SELECT ...></ACT:SELECT></div>)
                var sPropOptionSelectTemplateStart = ""; // select opening tag (say: <select ...>)
                var sPropOptionSelectTemplateEnd = ""; //  select ending tag (say: </select>)
                var sPropOptionSelectElement = ""; // select template element
                var sPropOptionTemplateSelectId = "PropOptionTemplateSelect_" + sPropID;
                sPropOptionSelectElement = document.getElementById(sPropOptionTemplateSelectId);
                if (sPropOptionSelectElement !== null) {
                    sPropOptionSelectContent = sPropOptionSelectElement.innerHTML;
                    sPropOptionSelectTemplate = sPropOptionSelectElement.outerHTML;
                    //
                    // Manipulate select tag
                    //
                    if (!bHidden) // not hidden?		
                    {
                        var sSelectTagIndex = sPropOptionSelectContent.toLowerCase().indexOf("</act:select>");
                        if (sSelectTagIndex > 0) {
                            sPropOptionSelectTemplateStart = sPropOptionSelectContent.substring(0, sSelectTagIndex);
                            sPropOptionSelectTemplateStart = sPropOptionSelectTemplateStart.replace(/(ACT:SELECT)/ig, 'select');
                            sPropOptionSelectTemplateStart = sPropOptionSelectTemplateStart.replace(/(&lt;Actinic:FilterPropValueName&gt;&lt;\/Actinic:FilterPropValueName&gt;)/ig, sPropID);
                            sPropOptionSelectTemplateStart = sPropOptionSelectTemplateStart.replace(/(<Actinic:FilterPropValueName><\/Actinic:FilterPropValueName>)/ig, sPropID);
                            sPropOptionSelectTemplateEnd = "</select>";
                        }
                    }
                }
                var bDropDwnLstBox = IsDropDownListBox(sPropOptionSelectContent);
                //
                // Manipulation of UL tags
                //
                var sPropOptionStartULElement = '';
                var sPropOptionStartULContent = '';
                var sPropOptionStartULTemplate = '';
                var sPropOptionEndULElement = '';
                var sPropOptionEndULContent = '';
                var sPropOptionEndULTemplate = '';
                sPropOptionStartULElement = document.getElementById('PropOptionTemplateStartUL_' + sPropID);
                if (sPropOptionStartULElement !== null) {
                    sPropOptionStartULContent = sPropOptionStartULElement.innerHTML;
                    sPropOptionStartULTemplate = sPropOptionStartULElement.outerHTML;
                    sPropOptionStartULContent = sPropOptionStartULContent.replace(/(&lt;)/ig, '<');
                    sPropOptionStartULContent = sPropOptionStartULContent.replace(/(&gt;)/ig, '>');
                }
                sPropOptionEndULElement = document.getElementById('PropOptionTemplateEndUL_' + sPropID);
                if (sPropOptionEndULElement !== null) {
                    sPropOptionEndULContent = sPropOptionEndULElement.innerHTML;
                    sPropOptionEndULTemplate = sPropOptionEndULElement.outerHTML;
                    sPropOptionEndULContent = sPropOptionEndULContent.replace(/(&lt;)/ig, '<');
                    sPropOptionEndULContent = sPropOptionEndULContent.replace(/(&gt;)/ig, '>');
                }
                //
                // Render filter property options
                //
                var nListCount = 0; // list count
                while (typeof(sArrayChoices[nChoiceInx]) !== "undefined") {
                    var bIncludeAny = false;
                    if (sArrayChoices[nChoiceInx].m_sChoiceName === '') // option 'Any'
                    {
                        if (bDropDwnLstBox && !bHidden) // drop down and not hidden
                        {
                            bIncludeAny = true;
                        } else {
                            nChoiceInx++;
                            continue;
                        }
                    }
                    if (sArrayChoices[nChoiceInx].m_sChoiceID === '' || // continue if choiceID is empty
                        (sArrayChoices[nChoiceInx].m_bHideAlways && !bIncludeAny)) // hide the option always?
                    {
                        nChoiceInx++;
                        continue;
                    }
                    var sHiddenInput = "";
                    var nCount = sArrayChoices[nChoiceInx].m_nChoiceCount; // choice count
                    if ((!IsFilterCountEnabled()) || // filter not enabled?
                        ((IsHideChoiceWithZeroResults() && nCount > 0) || (!IsHideChoiceWithZeroResults()) || bIncludeAny)) {
                        nListCount++;
                        sDummyFilterPropOptionTemplate = sFilterPropertyOptionTagContent;
                        //
                        // 'name' attribute
                        //
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(&lt;Actinic:FilterPropValueName&gt;&lt;\/Actinic:FilterPropValueName&gt;)/ig, sPropID);
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(<Actinic:FilterPropValueName><\/Actinic:FilterPropValueName>)/ig, sPropID);
                        //
                        // 'value' attribute
                        //
                        var sValue = sArrayChoices[nChoiceInx].m_sChoiceName;
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(&lt;Actinic:FilterPropValue&gt;&lt;\/Actinic:FilterPropValue&gt;)/ig, sValue);
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(<Actinic:FilterPropValue><\/Actinic:FilterPropValue>)/ig, sValue);
                        //
                        // Remember previous selection
                        //
                        var sKey = sPropID + "-" + nChoiceInx; // example: S_145-1
                        var sSelection = "";
                        var sDisabledCtrl = ""; // disable control type
                        var sDisabledStyle = ""; // disable label style
                        if (typeof(gMapCtrlSelections[sKey]) !== "undefined" && !g_bClearAll) {
                            if (sControl === 'LIST') {
                                sSelection = "selected"; // list box
                            } else if (sControl === 'LINKS') {
                                //
                                // Edit style for submit button
                                //
                                sSelection = "style=\"color:red\""; // click able links
                                sHiddenInput = "<input type=\"hidden\" value=\"" + sArrayChoices[nChoiceInx].m_sChoiceName + "\" name=\"hf_" + sArrayChoices[nChoiceInx].m_sChoiceID + "\" id=\"hf_" + sPropID + "\"/>";
                            } else {
                                sSelection = "checked"; // check box
                            }
                        }
                        if (IsFilterCountEnabled() && !IsHideChoiceWithZeroResults() && !bIncludeAny) {
                            if (sControl === 'LIST') {
                                if (!(nCount > 0)) {
                                    sDisabledCtrl = "disabled=\"disabled\""; // disable list
                                }
                            } else if (sControl === 'LINKS') {
                                if (!(nCount > 0)) {
                                    sDisabledCtrl = "disabled=\"disabled\""; // disable
                                    sDisabledStyle = "style=\"color:gray;cursor:default\""; // make gray
                                }
                            } else {
                                if (!(nCount > 0)) {
                                    sDisabledCtrl = "disabled=\"disabled\""; // disable buttons (check box/radio buttons)
                                    sDisabledStyle = "style=\"color:gray\"";
                                }
                            }
                        }
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(ACT:OPTION)/ig, 'option'); // replace custom tag "ACT:OPTION" with "option"
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(ActinicDisabledCtrl=\"\")/ig, sDisabledCtrl);
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(ActinicDisabledStyle=\"\")/ig, sDisabledStyle);
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(ActinicCustomSelection=\"\")/ig, sSelection);
                        //
                        // Value 'id' and 'for' attribute
                        //
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(&lt;Actinic:FilterPropChoiceID&gt;&lt;\/Actinic:FilterPropChoiceID&gt;)/ig, sArrayChoices[nChoiceInx].m_sChoiceID);
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(<Actinic:FilterPropChoiceID><\/Actinic:FilterPropChoiceID>)/ig, sArrayChoices[nChoiceInx].m_sChoiceID);
                        //
                        // Replace label tab content
                        //
                        var sLabelText = sArrayChoices[nChoiceInx].m_sChoiceName;
                        if (bIncludeAny) {
                            sLabelText = 'Any';
                        }
                        if (IsFilterCountEnabled() && !bIncludeAny) // show the count when count is enabled
                        {
                            sLabelText += ' (' + sArrayChoices[nChoiceInx].m_nChoiceCount + ')';
                        }
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(&lt;Actinic:FilterPropText&gt;&lt;\/Actinic:FilterPropText&gt;)/ig, sLabelText);
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(<Actinic:FilterPropText><\/Actinic:FilterPropText>)/ig, sLabelText);
                        sDummyFilterPropOptionTemplate = sDummyFilterPropOptionTemplate.replace(/(<Actinic:HiddentInput><\/Actinic:HiddentInput>)/ig, sHiddenInput);
                        sResultOptions += sDummyFilterPropOptionTemplate; // result options
                    }
                    nChoiceInx++;
                }
                //
                // Update the count if any!
                //
                if (nListCount === 1) {
                    nListCount++;
                }
                sPropOptionSelectTemplateStart = sPropOptionSelectTemplateStart.replace(/(&lt;Actinic:ListCount&gt;&lt;\/Actinic:ListCount&gt;)/ig, nListCount);
                sPropOptionSelectTemplateStart = sPropOptionSelectTemplateStart.replace(/(<Actinic:ListCount><\/Actinic:ListCount>)/ig, nListCount);
                //
                // Update the filter property content with the template and the filter needed property options
                //
                sFilterPropertyElement.innerHTML = ""; // remove the content
                sFilterPropertyElement.innerHTML = (sPropOptionStartULTemplate + // opening ul template
                    sPropOptionEndULTemplate + // closing ul template
                    sPropOptionSelectTemplate + // select template
                    sFilterPropertyOptionTemplate + // option template
                    sPropOptionSelectTemplateStart + // opening select tag
                    sPropOptionStartULContent + // opening ul tag
                    sResultOptions + // result option list
                    sPropOptionEndULContent + // closing ul tag
                    sPropOptionSelectTemplateEnd // closing select tag																
                ); // stick the filter options
            }
        }
    }
}

/***********************************************************************
 *
 * GetLayoutType							- Get the layout type
 *
 * Inputs:	sTemplate					- layout template to check
 *
 * Returns:  								- layout type
 *
 ************************************************************************/
function GetLayoutType(sTemplate) {
    var sControl;
    if (sTemplate.match(/(ACT:OPTION)/igm)) {
        sControl = 'LIST'; // list controls
    } else if (sTemplate.match(/(type=\"submit\")/igm) || sTemplate.match(/(type=submit)/igm)) {
        sControl = 'LINKS'; // clickable links
    } else {
        sControl = 'BUTTONS'; // chec kbox or radio buttons
    }
    return sControl;
}

/***********************************************************************
 *
 * IsDropDownListBox						- Check if dropdown list layout is used
 *
 * Inputs:	sTemplate					- layout template to check
 *
 * Returns:  								- true/false
 *
 ************************************************************************/
function IsDropDownListBox(sTemplate) {
    var bDropDownList = false;
    var arrMatch = sTemplate.match(/(ACT:SELECT(.*)size\s*=\s*["\']?([^"\' ]*)["\' ]\s*)/i);
    if (arrMatch) {
        if (typeof(arrMatch[3]) !== 'undefined' && arrMatch[3] === '1') // check size
        {
            bDropDownList = true;
        }
    } else if (sTemplate.match(/(ACT:SELECT)/i)) // dropdown list box
    {
        bDropDownList = true;
    }
    return bDropDownList;
}

/***********************************************************************
 *
 * GetControlSelections					- Get the control selections and cache as a
 *								  		  			map
 *
 * Inputs:	sCtlrName					- selected control name
 *				sContolID					- selected control id
 *				sValue						- selected control value
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function GetControlSelections(sCtlrName, sContolID, sValue) {
    //
    // Map of control selections with the key as below
    // Example for price band: PR:-1
    // Example for properties : S_451-1
    //
    var sKey = "";
    if ((sCtlrName === "SX") || (sCtlrName === "PR")) // price band
    {
        sKey = sCtlrName + ":" + sContolID;
        if (sContolID !== '-1') {
            if (typeof(gMapControlToSelection[sCtlrName]) === 'undefined') {
                gMapControlToSelection[sCtlrName] = {};
                gMapControlToSelection[sCtlrName][sContolID] = '';
            } else {
                gMapControlToSelection[sCtlrName][sContolID] = '';
            }
        }
    } else // properties
    {
        sKey = sContolID;
        //
        // Create map of property id to selection
        //
        if (sKey !== '' && sValue !== '') {
            if (typeof(gMapControlIdChoiceName[sKey]) !== 'undefined') {
                var sChoiceName = gMapControlIdChoiceName[sKey];
                var sPropId = sKey.split('-')[0];
                var sTmpSelKey = gMapFilterGrpIdToFilterGrpName[sPropId] + ':' + sChoiceName;
                var sSelKey = sTmpSelKey.toUpperCase();
                if (typeof(gMapPropIdToSelections[sPropId]) === 'undefined') {
                    gMapPropIdToSelections[sPropId] = new Array() // property id to selections
                }
                if (GetArrayIndex(gMapPropIdToSelections[sPropId], sSelKey) == -1) {
                    gMapPropIdToSelections[sPropId].push(sSelKey);
                    if (gMapPropIdToSelections[sPropId].length > 0) {
                        InsertSort(gMapPropIdToSelections[sPropId]);
                    }
                }
                if (!(typeof(gMapPropCtrlSelections[sSelKey]) !== 'undefined')) {
                    gMapPropCtrlSelections[sSelKey] = true; // property control selection
                }
            }
        }
        if (sKey !== '' && sCtlrName !== '' && sValue !== '') {
            if (typeof(gMapControlToSelection[sCtlrName]) === 'undefined') {
                gMapControlToSelection[sCtlrName] = {};
                gMapControlToSelection[sCtlrName][sKey] = '';
            } else {
                gMapControlToSelection[sCtlrName][sKey] = '';
            }
        }

    }
    if (sKey !== '') {
        gMapCtrlSelections[sKey] = true;
    }
}

/***********************************************************************
 *
 * ClearCtrlSelectionMap					- Clear control selection map
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function ClearCtrlSelectionMap() {
    gMapCtrlSelections = {}; // clear map
    gMapControlToSelection = {};
    gMapPropCtrlSelections = {}; // clear
    gMapPropIdToSelections = {}; // clear
}

/***********************************************************************
 *
 * IsFilterCountEnabled					- Check if filter count is enabled
 *
 * Returns:									- true/false
 *
 ************************************************************************/
function IsFilterCountEnabled() {
    if (typeof(pg_bEnableFilterCount) !== "undefined" && pg_bEnableFilterCount) {
        return true;
    }
    return false;
}

/***********************************************************************
 *
 * GetResultLayoutUsed					- Get the result layout used
 *
 * Returns:									- layout type (g_eResultLayout)
 *
 ************************************************************************/
function GetResultLayoutUsed() {
    var eResultLayout = g_eResultLayout.UNDEFINED;
    var sListColCountElement = '';
    sListColCountElement = document.getElementById('S_LISTCOLCOUNT');
    if (sListColCountElement) // table layout will 
    {
        eResultLayout = g_eResultLayout.TABULAR;
        //
        // Get the column count as well
        //
        g_nListColCount = parseInt(sListColCountElement.innerHTML);
    } else {
        eResultLayout = g_eResultLayout.STD;
    }
    return eResultLayout;
}

/***********************************************************************
 *
 * IsHostMode								- Check if site is in host mode
 *
 * Returns:									- true/false
 *
 ************************************************************************/
function IsHostMode() {
    if (typeof(pg_sShopID) !== "undefined" && pg_sShopID) {
        return true;
    }
    return false;
}

/***********************************************************************
 *
 * SetDefaultSelection					- Set the default filter options selections
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function SetDefaultSelection() {
    GetControlSelections('PR', '-1'); // set default to price band labeled 'Any'
    GetControlSelections('SX', '-1'); // set default to section labeled 'Any'
    //
    // Set the default properties in map
    //
    if (typeof(pg_arrayDefaultProperties) === "undefined") {
        return;
    }
    for (var nDefChoiceIndx = 0; nDefChoiceIndx < pg_arrayDefaultProperties.length; nDefChoiceIndx++) {
        if ((typeof(pg_arrayDefaultProperties[nDefChoiceIndx]) !== "undefined") &&
            (pg_arrayDefaultProperties[nDefChoiceIndx] !== null)) {
            var sPropID = pg_arrayDefaultProperties[nDefChoiceIndx].replace(/(&#95;)/g, "_"); // replace the encoded character
            var sPropIDChoiceID = sPropID.split('-');
            gMapDefCtrlSelections[sPropIDChoiceID[0]] = sPropIDChoiceID[1];
            GetControlSelections(sPropIDChoiceID[0], sPropID, gMapControlIdChoiceName[sPropID]);
        }
    }
}

/***********************************************************************
 *
 * CheckHashChangeEvent					- Correct the CGI urls from the url in browser
 *
 * Returns: 									- nothing
 *
 ************************************************************************/
function CheckHashChangeEvent() {
    if (IsPreview()) // preview?
    {
        return;
    }
    var nIEVersion = GetIEVersion(); // get the IE version
    if ((nIEVersion < 8) && (nIEVersion !== 0)) // if IE and version < 9
    { // have to explicitly call on a hash change
        var prevHash = ''; // so that initial setting of hash change is detected

        /***********************************************************************
         *
         * HashCheck					- Check if the hash has changed - using prevHash in closure
         *
         ************************************************************************/
        function HashCheck() {
            if (window.location.hash !== prevHash) // has the hash changed?
            {
                HashChangeHandler(); // handle change - required hash change event in IE ver < 9
                prevHash = window.location.hash; // remember the previous hash
            }
        }

        HashCheck(); // check for a hash value now - just in case
        window.setInterval(HashCheck, 500); // check every 500ms for another change
    } else {
        //
        // Newer browsers can just use hash change handler
        //
        AddEvent(window, "hashchange", HashChangeHandler);
        if (window.location.hash) // check if there is a hash value
        {
            HashChangeHandler(); // yes, trigger a handler call immediately
        }
    }
}

/***********************************************************************
 *
 * HashChangeHandler						- Hash change event handler
 *
 * Returns: 									- nothing
 *
 ************************************************************************/
function HashChangeHandler() {
    if (g_bUseStorageSortPage) {
        g_bUseStorageSortPage = false;
        return;
    }
    ResetSortOrder();
    SetStoredPageNumber(); // set the page number
    if (window.location.hash.search('usestorage') != -1) // use storage?
    {
        SetSelectionMapsFromStorage(); // Set the selection map from storage settings
        if (IsFilterCountEnabled()) {
            //
            // Filter products for count alone
            //
            OnFilter(null, null, true); // filter only for count
        } else {
            GenerateDynamicFilterOptions(); // generate dynamic filter options
            if (IsFilterAsDefaultView()) {
                OnFilter(null, null, true); // filter only for count
            } else {
                OnFilter(null, null, false); // filter only for result
            }
        }
        return;
    }
    //
    // Hide the filter result and show the section content
    //
    var resultAreaElement = '';
    resultAreaElement = document.getElementById("filter_results_area"); // get filter result content
    if (resultAreaElement) // go ahead when section has marked for filtering
    {
        var contentPageElement = '';
        contentPageElement = document.getElementById('ContentPage'); // get content page
        if (contentPageElement) {
            contentPageElement.style.display = "block"; // show the section content
        }
        resultAreaElement.style.display = "none"; // hide the filter result
        if (window.location.hash != '') {
            window.location.hash = window.location.hash; // scrolling to the anchor
        }
        ShowSectionContent(); // show the section content
        HideAllClearButtons(); // hide all clear buttons
        ResetStorage(g_eFilterSettings.FILTER); // clear filter storage settings			
    }
}

/***********************************************************************
 *
 * IsHideChoiceWithZeroResults			- Check if filter options need to be hidden
 *
 * Returns:									- true/false
 *
 ************************************************************************/
function IsHideChoiceWithZeroResults() {
    if (typeof(pg_bHideChoiceWithZeroResults) !== "undefined" &&
        (pg_bHideChoiceWithZeroResults === 1)) {
        return true;
    }
    return false;
}

/***********************************************************************
 *
 * CreateClearButton						- Create clear button dynamically
 *
 * Inputs:	sID							- property ID
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function CreateClearButton(sID) {
    var sClearButtonElement = document.getElementById(sID + '-clear-button'); // get the clear button elements	
    if (sClearButtonElement) // is already there?
    {
        sClearButtonElement.style.cssText = 'display:block'; // ensure to show
        return;
    }
    //
    // Create the clear button
    //
    var sFilterHeaderElement = document.getElementById(sID);
    if (sFilterHeaderElement) {
        var sClearButton = '<a href=\'javascript:ClearFilterOptions(\"' + sID + '\");\' id="' + sID + '-clear-button" class="clear-button">Clear</a>';
        sFilterHeaderElement.innerHTML = sFilterHeaderElement.innerHTML + sClearButton;
    }
}

/***********************************************************************
 *
 * ShowHideClearButton					- Show or hide the clear button dynamically
 *
 * Inputs:	bShow							- show/hide the clear button
 *				sID							- clear button ID
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function ShowHideClearButton(bShow, sID) {
    var sClearButtonElement = document.getElementById(sID + '-clear-button'); // get the clear button elements
    if (sClearButtonElement) {
        if (bShow) // show clear button
        {
            sClearButtonElement.style.cssText = 'display:block';
            gMapPropIdToBtnClearStatus[sID] = true; // button shown
        } else // hide clear button
        {
            sClearButtonElement.style.cssText = 'display:none';
            gMapPropIdToBtnClearStatus[sID] = false; // button hidden
        }
    } else if (bShow) {
        CreateClearButton(sID);
        gMapPropIdToBtnClearStatus[sID] = true; // button shown
    }
    if (GetClearButtonCount() < 1) {
        ShowSectionContent(); // show section content
    }
}

/***********************************************************************
 *
 * GetClearButtonCount					- Get clear button count that are shown
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function GetClearButtonCount() {
    var nCount = 0;
    for (sPropId in gMapPropIdToBtnClearStatus) {
        if (gMapPropIdToBtnClearStatus[sPropId] === true) {
            nCount++;
        }
    }
    return nCount;
}

/***********************************************************************
 *
 * ClearFilterOptions						- Clear filter options dynamically
 *
 * Inputs:	sFilterHeaderID			- filter header ID
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function ClearFilterOptions(sFilterHeaderID) {
    if (GetClearButtonCount() < 2) // single clear button?
    {
        OnClearAllOptions(); // same behaviour of Clear All
    } else {
        ClearFilterChoices(sFilterHeaderID); // clear filter choices
        OnFilter(); // filter based on the new options		
    }
}

/***********************************************************************
 *
 * ClearFilterChoices						- Clear filter choices
 *
 * Inputs:	sFilterHeaderID			- filter header ID
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function ClearFilterChoices(sFilterHeaderID) {
    //
    // Clear filter options
    //
    var sFilterForm = document.forms['filter'];
    if (typeof(sFilterForm) !== "undefined") {
        var sFilterFormElements = document.forms['filter'].elements; // filter form elements
        for (var nIndex = 0; nIndex < sFilterFormElements.length; nIndex++) {
            var eControlType = GetControlType(sFilterFormElements[nIndex]);
            if ((sFilterHeaderID === sFilterFormElements[nIndex].name) && (eControlType !== g_eControlType.UNDEFINED)) {
                ResetSelectionCheck(eControlType, sFilterFormElements[nIndex], sFilterHeaderID);
                if (eControlType === g_eControlType.LINK) {
                    break; // call only once for clickable links
                }
            }
        }
    }
}

/***********************************************************************
 *
 * GetControlType							- Get the control type
 *
 * Inputs:	sControl						- control element
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function GetControlType(sControl) {
    var eControlType = g_eControlType.UNDEFINED;
    var sControlType = sControl.type;
    var sControlTagName = sControl.tagName;
    if (sControlTagName === 'INPUT') {
        if (sControlType === 'checkbox' || sControlType === 'radio') {
            eControlType = g_eControlType.BUTTON;
        } else if (sControlType === 'submit') {
            eControlType = g_eControlType.LINK;
        }
    } else if (sControlTagName === 'SELECT') {
        eControlType = g_eControlType.LIST;
    }
    return (eControlType);
}

/***********************************************************************
 *
 * ResetSelectionCheck					- Reset filter options
 *
 * Inputs:	eControlType				- control type (g_eControlType)
 *				sElement						- control element
 *				sControlID					- control ID
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function ResetSelectionCheck(eControlType, sElement, sControlID) {
    switch (eControlType) // control type
    {
        case g_eControlType.BUTTON: // check box/radio buttons
            if (sElement.value != '-1' || sElement.value != '') {
                sElement.checked = false;
            }
            break;

        case g_eControlType.LIST: // list controls
            for (var nElmCount = 0; nElmCount < sElement.options.length; nElmCount++) {
                if (sElement.options[nElmCount].value != '-1' ||
                    sElement.options[nElmCount].value != '') {
                    sElement.options[nElmCount].selected = false;
                }
            }
            break;

        case g_eControlType.LINK: // clickable links
            //
            // Remove the selection
            //
            var elHfElement = document.getElementById('hf_' + sControlID);
            if (elHfElement) {
                var sValue = elHfElement.value;
                var sLabelID = '';
                if (sControlID === 'PR') {
                    sLabelID = 'lbl_' + sValue;
                } else if (sControlID === 'SX') {
                    sLabelID += 'lbl_SX_' + sValue;
                } else {
                    var sLabelFor = elHfElement.name.split('hf_');
                    sLabelID = 'lbl_' + sLabelFor[1];
                }
                var elLabel = document.getElementById(sLabelID);
                if (elLabel) {
                    elLabel.style.cssText = '';
                }
                elHfElement.parentNode.removeChild(elHfElement);
            }
            break;

        default:
            break;
    }
}

/***********************************************************************
 *
 * HideModifyStaticControls				- Hide/modify static controls
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function HideModifyStaticControls() {
    //
    // Hide update button at down
    //
    var sUpdateButtonBottomElement = document.getElementById('update_btn'); // update button bottom
    if (sUpdateButtonBottomElement) {
        var sFilterBtnWrprElmnt = sUpdateButtonBottomElement.parentNode;
        if (sFilterBtnWrprElmnt) {
            sFilterBtnWrprElmnt.parentNode.removeChild(sFilterBtnWrprElmnt);
        }
    }
    //
    // Modify the update button at top
    //
    var sUpdateButtonTopElement = document.getElementById('update_lnk'); // update button top
    if (sUpdateButtonTopElement) {
        sUpdateButtonTopElement.setAttribute('onclick', 'javascript:OnClearAllOptions(); return false;');
        sUpdateButtonTopElement.value = 'Clear All';
    }
}

/***********************************************************************
 *
 * OnClearAllOptions						- Clear all options to default
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function OnClearAllOptions() {
    if (GetClearButtonCount() < 1) {
        return; // return if nothing to clear
    }
    ShowSectionContent(); // show the section content
    HideAllClearButtons(); // hide all clear buttons
    ResetStorage(g_eFilterSettings.FILTER); // clear filter storage settings
    if (g_nCurrenPageNumber != -1) {
        ResetStorage(g_eFilterSettings.PAGINATION); // rest the pagination
    }
}

/***********************************************************************
 *
 * ShowSectionContent						- Show the section content
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function ShowSectionContent() {
    //
    // If filter view is not default, show the original section content
    //
    if (!IsFilterAsDefaultView()) {
        var elFilterResult = document.getElementById('filter_results_area');
        if (elFilterResult) {
            elFilterResult.style.cssText = 'display:none';
        }
        var elContentPage = document.getElementById('ContentPage');
        if (elContentPage) {
            elContentPage.style.cssText = 'display:block';
        }
        //
        // If carousel visibility changes they have to be reloaded
        //
        ReloadCarousels();
    }
}

/***********************************************************************
 *
 * HideAllClearButtons					- Hide all clear buttons
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function HideAllClearButtons() {
    //
    // Clear filter choices for each property group where 
    // 'Clear' button is shown
    //
    ClearCtrlSelectionMap(); // clear control selections
    for (var sPropId in gMapPropIdToBtnClearStatus) {
        if (gMapPropIdToBtnClearStatus[sPropId] === true) {
            ClearFilterChoices(sPropId); // clear filter choices
        }
    }
    OnFilter(null, null, false, true); // filter only for count
}

/***********************************************************************
 *
 * CacheFilterSections					- Cache filter section into a map
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function CacheFilterSections() {
    if (typeof pg_arrayFilterSections !== 'undefined') {
        gMapFilterGrpIdToFilterGrpName['SX'] = 'SX';
        gArrFilterGrpIdSorted.push('SX');
        gMapFilters['SX'] = {};
        gMapFilters['SX'].m_bShow = false;
        for (var nFltrSecIndx = 0; nFltrSecIndx < pg_arrayFilterSections.length; nFltrSecIndx++) {
            if ((typeof(pg_arrayFilterSections[nFltrSecIndx]) !== "undefined") &&
                (pg_arrayFilterSections[nFltrSecIndx] !== null)) {
                var sSectionIDName = pg_arrayFilterSections[nFltrSecIndx].split(':');
                var sKey = sSectionIDName[0]; // section ID
                gMapFilters['SX'][sKey] = new SectionDetails();
                gMapFilters['SX'][sKey].m_sSectionName = sSectionIDName[1];
                gArraySectionIDs.push(sKey);
            }
        }
    }
}

/***********************************************************************
 *
 * SectionDetails							- Section details class definition
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function SectionDetails() {
    this.m_sSectionName = ''; // section name
    this.m_nCount = 0; // count to hold number of prods belong to this
    this.m_nCumulativeCount = 0; // all product counts including current and sub sections
    this.m_arrSubSectionIds = new Array(); // sub section IDs
    this.m_bHideAlways = false; // hide always?
}

/***********************************************************************
 *
 * CreateFilterSectionOptions			- Create filter sections/department options dynamically
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function CreateFilterSectionOptions() {
    //
    // 1. Read the filter section layout based on id "FilterSectionOptions"
    // 2. Read the filter section options template using the id "SectionOptionTemplate"
    // 3. Replace the Filter Tags with the appropriate value and generate the list of options
    //
    //  Sample filter section option template:
    //  --------------------------------------
    // <div id="SectionOptionTemplate" style="display:none;">
    // <input type="checkbox" value="<Actinic:SectionIndex></Actinic:SectionIndex>" name="SX" id="SX_<Actinic:SectionIndex></Actinic:SectionIndex>" ActinicCustomSelection="" ActinicDisabledCtrl=""/>
    //	<label for="SX_<Actinic:SectionIndex></Actinic:SectionIndex>" ActinicDisabledStyle=""><Actinic:SectionName></Actinic:SectionName></label>
    //	<br/>
    //	</div>
    //
    var elFilterSection = ''; // filter element from price band options template
    var elFilterOption = ''; // filter tags option from price option template
    elFilterSection = document.getElementById('FilterSectionOptions');
    elFilterOption = document.getElementById('SectionOptionTemplate');
    if ((elFilterSection === null) || (elFilterOption === null)) {
        var sErrorMsg = "Tag with the id \"FilterSectionOptions\" OR \"SectionOptionTemplate\" is not found in filter option layout, \
filter count might not work for departments";
        ShowError(sErrorMsg, g_ErrorCode.TAG);
        return; // return if undefined
    }
    //
    // Hide the section label when all option count zero
    //
    var bHideLabel = false; // hide label?
    if ((IsHideChoiceWithZeroResults() && IsFilterCountEnabled()) ||
        (IsFilterCountEnabled() && g_bFirstLoad)) // check for hide filter group empty/all count 0 options for onload
    {
        var sSectionLabel = document.getElementById('SX');
        if (!gMapFilters['SX'].m_bShow) {
            sSectionLabel.style.display = "none"; // hide label
            bHideLabel = true;
        } else {
            sSectionLabel.style.display = "block"; // show label
            bHideLabel = false;
        }
    }
    var sFilterSectionOptionTemplateOutput = elFilterOption.outerHTML;
    var sFilterSectionOptionTemplate = elFilterOption.innerHTML;
    var sDummyFilterSectionOptionTemplate = '';
    var sResultOptions = '';
    var sControl = GetLayoutType(sFilterSectionOptionTemplate); // get layout type	
    //
    // Create Select start template
    //
    var sSectionOptionTemplateSelectTemplate = ''; // Price option select template
    var sSectionOptionTemplateSelectStart = ''; // select opening tag
    var sSectionOptionTemplateSelectEnd = ''; // select closing tag
    var sSectionOptionTemplateSelect = ''; // select tag
    sSectionOptionTemplateSelect = document.getElementById('SectionOptionTemplateSelect');
    if (sSectionOptionTemplateSelect !== null) {
        sSectionOptionTemplateSelectTemplate = sSectionOptionTemplateSelect.outerHTML;
        var sSectionOptionTemplateSelectContent = sSectionOptionTemplateSelect.innerHTML;
        var sSelectTagIndex = sSectionOptionTemplateSelectContent.toLowerCase().indexOf("</act:select>");
        //
        // Format select tag used for list controls
        //
        if (sSelectTagIndex > 0) {
            sSectionOptionTemplateSelectStart = sSectionOptionTemplateSelectContent.substring(0, sSelectTagIndex);
            sSectionOptionTemplateSelectStart = sSectionOptionTemplateSelectStart.replace(/(ACT:SELECT)/ig, 'select');
            sSectionOptionTemplateSelectEnd = "</select>";
        }
    }
    //
    // Manipulation of UL tags
    //
    var sSectionOptionStartULElement = '';
    var sSectionOptionStartULContent = '';
    var sSectionOptionStartULTemplate = '';
    var sSectionOptionEndULElement = '';
    var sSectionOptionEndULContent = '';
    var sSectionOptionEndULTemplate = '';
    sSectionOptionStartULElement = document.getElementById('SectionOptionTemplateStartUL');
    if (sSectionOptionStartULElement !== null) {
        sSectionOptionStartULContent = sSectionOptionStartULElement.innerHTML;
        sSectionOptionStartULTemplate = sSectionOptionStartULElement.outerHTML;
        sSectionOptionStartULContent = sSectionOptionStartULContent.replace(/(&lt;)/ig, '<');
        sSectionOptionStartULContent = sSectionOptionStartULContent.replace(/(&gt;)/ig, '>');
    }
    sSectionOptionEndULElement = document.getElementById('SectionOptionTemplateEndUL');
    if (sSectionOptionEndULElement !== null) {
        sSectionOptionEndULContent = sSectionOptionEndULElement.innerHTML;
        sSectionOptionEndULTemplate = sSectionOptionEndULElement.outerHTML;
        sSectionOptionEndULContent = sSectionOptionEndULContent.replace(/(&lt;)/ig, '<');
        sSectionOptionEndULContent = sSectionOptionEndULContent.replace(/(&gt;)/ig, '>');
    }
    //
    // Create default option if dropdown list layout used
    //
    if (!bHideLabel && (sSectionOptionTemplateSelectTemplate !== '') && IsDropDownListBox(sSectionOptionTemplateSelectTemplate)) {
        sDummyFilterSectionOptionTemplate = sFilterSectionOptionTemplate;
        sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(&lt;Actinic:SectionIndex&gt;&lt;\/Actinic:SectionIndex&gt;)/ig, '-1');
        sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(<Actinic:SectionIndex><\/Actinic:SectionIndex>)/ig, '-1');
        sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(<Actinic:SectionName><\/Actinic:SectionName>)/ig, 'Any');
        var sKey = "SX:-1";
        var sSelection = '';
        if (typeof(gMapCtrlSelections[sKey]) !== "undefined") {
            sSelection = "selected"; // list box
        }
        sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(ActinicDisabledCtrl=\"\")/ig, '');
        sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(ActinicDisabledStyle=\"\")/ig, '');
        sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(ActinicCustomSelection=\"\")/ig, sSelection);
        sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(ACT:OPTION)/ig, 'option');
        sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(<Actinic:HiddentInput><\/Actinic:HiddentInput>)/ig, ''); // hidden parameter
        sResultOptions += sDummyFilterSectionOptionTemplate;
    }
    //
    // Create other price options
    //
    var nCount = 0;
    var nListCount = 1; // default size is one!
    for (var nSXIndx = 0; nSXIndx < gArraySectionIDs.length; nSXIndx++) {
        sHiddenInput = "";
        if (typeof(gMapFilters['SX'][gArraySectionIDs[nSXIndx]]) === 'undefined' ||
            gMapFilters['SX'][gArraySectionIDs[nSXIndx]].m_bHideAlways) // hide always?
        {
            continue;
        }
        nCount = gMapFilters['SX'][gArraySectionIDs[nSXIndx]].m_nCumulativeCount; // get section/department count
        if ((!IsFilterCountEnabled()) || // filter not enabled?
            ((IsHideChoiceWithZeroResults() && nCount > 0) || (!IsHideChoiceWithZeroResults()))) {
            nListCount++;
            //
            // Replace "Price Index", "Price Band" with count and Selection (checked / selected)
            //
            sDummyFilterSectionOptionTemplate = sFilterSectionOptionTemplate;
            sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(&lt;Actinic:SectionIndex&gt;&lt;\/Actinic:SectionIndex&gt;)/ig, gArraySectionIDs[nSXIndx]);
            sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(<Actinic:SectionIndex><\/Actinic:SectionIndex>)/ig, gArraySectionIDs[nSXIndx]);
            var sSectionName = gMapFilters['SX'][gArraySectionIDs[nSXIndx]].m_sSectionName;
            if (IsFilterCountEnabled()) {
                sSectionName += ' (' + nCount + ')';
            }
            sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(<Actinic:SectionName><\/Actinic:SectionName>)/ig, sSectionName);
            //
            // Remember the previous selection
            //
            var sKey = "SX:" + gArraySectionIDs[nSXIndx];
            var sSelection = "";
            var sDisabledStyle = ""; // disabled style for label
            var sDisabledCtrl = ""; // disabled control type
            if (typeof(gMapCtrlSelections[sKey]) !== "undefined") {
                if (sControl === 'LIST') {
                    sSelection = "selected"; // list box
                } else if (sControl === 'LINKS') {
                    //
                    // Edit style for submit button
                    //					
                    sSelection = "style=\"color:red\""; // clickable links
                    sHiddenInput = "<input type=\"hidden\" value=\"" + gArraySectionIDs[nSXIndx] + "\" name=\"hf_SX\" id=\"hf_SX\"/>";
                } else {
                    sSelection = "checked"; // radio button / check box
                }
            }
            if (IsFilterCountEnabled() && !IsHideChoiceWithZeroResults()) {
                if (sControl === 'LIST') {
                    if (!(nCount > 0)) {
                        sDisabledCtrl = "disabled=\"disabled\""; // disable lists
                    }
                } else if (sControl === 'LINKS') {
                    if (!(nCount > 0)) {
                        sDisabledCtrl = "disabled=\"disabled\""; // disable
                        sDisabledStyle = "style=\"color:gray;cursor:default\""; // make gray
                    }
                } else {
                    if (!(nCount > 0)) {
                        sDisabledCtrl = "disabled=\"disabled\""; // disable buttons (check box/radio buttons)
                        sDisabledStyle = "style=\"color:gray\"";
                    }
                }
            }
            sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(ActinicDisabledCtrl=\"\")/ig, sDisabledCtrl);
            sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(ActinicDisabledStyle=\"\")/ig, sDisabledStyle);
            sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(ACT:OPTION)/ig, 'option'); // replace custom tag "ACT:OPTION" with "option"
            sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(ActinicCustomSelection=\"\")/ig, sSelection);
            sDummyFilterSectionOptionTemplate = sDummyFilterSectionOptionTemplate.replace(/(<Actinic:HiddentInput><\/Actinic:HiddentInput>)/ig, sHiddenInput);
            sResultOptions += sDummyFilterSectionOptionTemplate;
        }
    }
    //
    // Update the count if any!
    //
    if (!bHideLabel) // hide label?
    {
        sSectionOptionTemplateSelectStart = sSectionOptionTemplateSelectStart.replace(/(&lt;Actinic:ListCount&gt;&lt;\/Actinic:ListCount&gt;)/ig, nListCount);
        sSectionOptionTemplateSelectStart = sSectionOptionTemplateSelectStart.replace(/(<Actinic:ListCount><\/Actinic:ListCount>)/ig, nListCount);
    } else {
        sSectionOptionTemplateSelectStart = '';
        sSectionOptionStartULContent = '';
        sResultOptions = '';
        sSectionOptionEndULContent = '';
        sSectionOptionTemplateSelectEnd = '';
    }
    //
    // Update the filter price band content with the template and the needed filter options
    //
    elFilterSection.innerHTML = (sSectionOptionTemplateSelectTemplate + // select tag template
        sFilterSectionOptionTemplateOutput + // option template
        sSectionOptionStartULTemplate + // start UL template
        sSectionOptionEndULTemplate + // end UL template
        sSectionOptionTemplateSelectStart + // select start tag
        sSectionOptionStartULContent + // opening ul tag
        sResultOptions + // option tag
        sSectionOptionEndULContent + // closing ul tag
        sSectionOptionTemplateSelectEnd); // select end tag
}

/***********************************************************************
 *
 * IsSearchBySubSection					- Check if search by sub sections enabled
 *
 * Returns:									- true/false
 *
 ************************************************************************/
function IsSearchBySubSection() {
    if (typeof(pg_bSearchBySubSection) !== "undefined" &&
        (pg_bSearchBySubSection === 1)) {
        return true;
    }
    return false;
}

/***********************************************************************
 *
 * CacheSectionDetails					- Cache department information and store into 
 *													the section map
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function CacheSectionDetails(arrDepartmentInfo) {
    for (var nSecInfoIndx = 0; nSecInfoIndx < arrDepartmentInfo.length; nSecInfoIndx++) {
        var sSectionID = arrDepartmentInfo[nSecInfoIndx].SectionID;
        if (typeof(gMapFilters['SX'][sSectionID]) !== 'undefined') {
            gMapFilters['SX'][sSectionID].m_arrSubSectionIds = arrDepartmentInfo[nSecInfoIndx].SubSectionIDs;
        } else {
            gMapFilters['SX'][sSectionID] = new SectionDetails();
            gMapFilters['SX'][sSectionID].m_arrSubSectionIds = arrDepartmentInfo[nSecInfoIndx].SubSectionIDs;
        }
    }
}

/***********************************************************************
 *
 * UpdateCumulativeSectionCount		- Update the cumulative department count
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function UpdateCumulativeSectionCount() {
    if (!IsSearchBySubSection()) {
        return;
    }
    //
    // Loop through each section ID and update the cumulative count
    //
    for (var nSecIdx = 0; nSecIdx < gArraySectionIDs.length; nSecIdx++) {
        var sSectionId = gArraySectionIDs[nSecIdx];
        if (typeof(gMapFilters['SX'][sSectionId]) !== "undefined") {
            var arrSubSectionIDs = new Array();
            arrSubSectionIDs = gMapFilters['SX'][sSectionId].m_arrSubSectionIds;
            for (var nSubSecIndx = 0; nSubSecIndx < arrSubSectionIDs.length; nSubSecIndx++) {
                //
                // Add the sub section count
                //
                if (typeof(gMapFilters['SX'][arrSubSectionIDs[nSubSecIndx]]) !== 'undefined') {
                    gMapFilters['SX'][sSectionId].m_nCumulativeCount += gMapFilters['SX'][arrSubSectionIDs[nSubSecIndx]].m_nCount;
                }
            }
            //
            // Add the actual count
            //
            gMapFilters['SX'][sSectionId].m_nCumulativeCount += gMapFilters['SX'][sSectionId].m_nCount;
        }
    }
}

/***********************************************************************
 *
 * HideOptionAny							- Hiding option 'Any' from the static page
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function HideOptionAny() {
    //
    // Hide option 'Any' from departments
    //
    var bDefaultView = IsFilterAsDefaultView();
    var elSXAny = document.getElementById('SX_-1');
    if (elSXAny) {
        var elSXAnyParent = elSXAny.parentNode;
        var elChildAny;
        //
        // default view layouts from server will not have static controls such as <Actinic:StaticSearchField>
        //
        if (bDefaultView) {
            elChildAny = elSXAnyParent.childNodes;
        } else {
            elChildAny = elSXAnyParent.parentNode.childNodes;
        }
        for (var nIndx = 0; nIndx < elChildAny.length; nIndx++) {
            if (elChildAny[nIndx].tagName === 'LABEL' && elChildAny[nIndx].htmlFor === 'SX_-1') {
                elChildAny[nIndx].parentNode.removeChild(elChildAny[nIndx]);
            }
        }
        elSXAny.parentNode.removeChild(elSXAny);
    }
    //
    // Hide option 'Any' from price bands
    //		
    var elPRAny = document.getElementById('-1');
    if (elPRAny) {
        var elPRAnyParent = elPRAny.parentNode;
        var elChildAny;
        if (bDefaultView) {
            elChildAny = elPRAnyParent.childNodes;
        } else {
            elChildAny = elPRAnyParent.parentNode.childNodes;
        }
        for (var nIndx = 0; nIndx < elChildAny.length; nIndx++) {
            if (elChildAny[nIndx].tagName === 'LABEL' && elChildAny[nIndx].htmlFor === '-1') {
                elChildAny[nIndx].parentNode.removeChild(elChildAny[nIndx]);
            }
        }
        elPRAny.parentNode.removeChild(elPRAny);
    }
    //
    // Hide option 'Any' from filter properties
    //
    for (var nDefOptIdx = 0; nDefOptIdx < gArrProperty.length; nDefOptIdx++) {
        if (typeof(gArrProperty[nDefOptIdx]) !== 'undefined') {
            var sPropId = gArrProperty[nDefOptIdx];
            //
            // Do not remove 'Any' when dropdown list used
            //
            var sPropOptionSelectContent = '';
            var sPropOptTemplateSelectId = "PropOptionTemplateSelect_" + sPropId;
            var elPropOptionSelect = document.getElementById(sPropOptTemplateSelectId);
            if (elPropOptionSelect !== null) {
                sPropOptionSelectContent = elPropOptionSelect.innerHTML;
            }
            if (sPropOptionSelectContent !== '' && IsDropDownListBox(sPropOptionSelectContent)) {
                continue;
            }
            sPropId += '-1'; // property option 'Any'
            var elPropAny = document.getElementById(sPropId);
            if (elPropAny && elPropAny.value === '') // property value should be empty
            {
                var elPropAnyParent = elPropAny.parentNode;
                var elChildAny;
                if (bDefaultView) {
                    elChildAny = elPropAnyParent.childNodes;
                } else {
                    elChildAny = elPropAnyParent.parentNode.childNodes;
                }
                for (var nIndx = 0; nIndx < elChildAny.length; nIndx++) {
                    if (elChildAny[nIndx].tagName === 'LABEL' && elChildAny[nIndx].htmlFor === sPropId) {
                        elChildAny[nIndx].parentNode.removeChild(elChildAny[nIndx]);
                    }
                }
                elPropAnyParent.removeChild(elPropAny);
            }
        }
    }
}

/***********************************************************************
 *
 * IsFilterAsDefaultView					- Check if filter result is marked as default
 *													view
 *
 * Returns:									- true/false
 *
 ************************************************************************/
function IsFilterAsDefaultView() {
    if (typeof(pg_bFilterDefaultView) !== "undefined" && pg_bFilterDefaultView) {
        return true;
    }
    return false;
}

/***********************************************************************
 *
 * IsShowClearButton						- Check whether to show clear button
 *
 * Inputs:	sID							- filter element id
 *
 * Returns:									- true/false
 *
 ************************************************************************/
function IsShowClearButton(sID) {
    var bShow = false;
    if (sID === 'SX') // check for section/department
    {
        for (var nSectionID in gMapFilters['SX']) // for each section ID
        {
            if (typeof(gMapCtrlSelections['SX:' + nSectionID]) !== 'undefined') {
                if (gMapCtrlSelections[nSectionID] !== '-1') {
                    bShow = true;
                }
            }
        }
    } else if (sID === 'PR') // check for price band
    {
        for (var nPriceBandID in gMapFilters['PR']) {
            if (typeof(gMapCtrlSelections['PR:' + nPriceBandID]) !== 'undefined') {
                if (gMapCtrlSelections[nPriceBandID] !== '-1') {
                    bShow = true;
                }
            }
        }
    } else {
        if (typeof(gMapFilters[sID]) !== "undefined") {
            var sArrayChoices = gMapFilters[sID].m_mapChoices;
            var nChoiceInx = 1; // starting choice index
            while (typeof(sArrayChoices[nChoiceInx]) !== "undefined") {
                var sChoiceID = sArrayChoices[nChoiceInx].m_sChoiceID; // get choice id (ex: S_417_1:2)
                if (typeof(gMapCtrlSelections[sChoiceID]) !== "undefined" &&
                    gMapFilters[sID].m_mapChoices[nChoiceInx].m_sChoiceName !== '') // not 'Any'?
                {
                    bShow = true; // show clear button
                }
                nChoiceInx++;
            }
        }
    }
    return bShow;
}

/***********************************************************************
 *
 * FilterProductsBasedOnPerms			- Validate product references against permutations
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function FilterProductsBasedOnPerms() {
    var mapProdRefToValidity = {}; // map of product reference to validity (true/false based on permutation)
    var arrSelections = new Array();
    for (var sPropId in gMapPropCtrlSelections) {
        if (typeof(sPropId) !== 'undefined') {
            arrSelections.push(sPropId);
        }
    }
    if (arrSelections.length <= 0) // when no filter options selected				
    {
        var sKey = gArrayDefinedPropertiesSorted.join(':');
        for (var nProdIdx = 0; nProdIdx < gArrSortedProductRefs.length; nProdIdx++) {
            var sProdRef = gArrSortedProductRefs[nProdIdx];
            if (typeof(gMapInvalidProdRefs[sProdRef]) === 'undefined' && !gMapObjProductDetails[sProdRef].m_bFullPermutation) // valid product
            {
                mapProdRefToValidity[sProdRef] = true;
                continue;
            } else // invalid
            {
                var mapCompToPerms = gMapObjProductDetails[sProdRef].m_mapCompToPermutation;
                if (typeof(mapCompToPerms[sKey]) !== 'undefined' &&
                    (mapCompToPerms[sKey] === 'EMPTY' || mapCompToPerms[sKey] === 'OSTOCK')) // empty/out of stock permutation
                {
                    //
                    // Check if any perms from other component are valid
                    //
                    if (IsAllOtherPermsValid(mapCompToPerms, sKey)) {
                        mapProdRefToValidity[sProdRef] = true; // mark as valid (no perms defined for the current combination)
                    } else {
                        mapProdRefToValidity[sProdRef] = false; // mark as invalid (all permutations are invalid)
                    }
                } else {
                    //
                    // Some permutations are valid, counted for choices
                    //
                    mapProdRefToValidity[sProdRef] = true;
                }
            }
        }
    } else {
        InsertSort(arrSelections); // sort the selection
        //
        // Create selection string
        //
        var sSelections = GetPermSelectionString('');
        for (var nProdIdx = 0; nProdIdx < gArrSortedProductRefs.length; nProdIdx++) {
            var sProdRef = gArrSortedProductRefs[nProdIdx];
            if (typeof(gMapInvalidProdRefs[sProdRef]) === 'undefined' && !gMapObjProductDetails[sProdRef].m_bFullPermutation) {
                mapProdRefToValidity[sProdRef] = true;
                continue;
            }
            mapProdRefToValidity[sProdRef] = false; // intially mark all as invalid
            var mapCompToPerms = gMapObjProductDetails[sProdRef].m_mapCompToPermutation;
            //
            // All permutations are invalid???
            //
            if (typeof(mapCompToPerms['EMPTY']) !== 'undefined') // empty permutation
            {
                mapProdRefToValidity[sProdRef] = false; // mark as invalid (all permutations are invalid)
                continue;
            }
            var bInValid = true;
            //
            // For each component, check if any of the permutations is valid
            //
            var bCompMatched = false;
            for (sComponent in mapCompToPerms) {
                if (IsValidComponent(arrSelections, sComponent) === true) {
                    bCompMatched = true;
                    if (mapCompToPerms[sComponent] === 'EMPTY' || mapCompToPerms[sComponent] === 'OSTOCK') {
                        //
                        // Check if any other perms from other comp is valid
                        //
                        if (IsAllOtherPermsValid(mapCompToPerms, sComponent)) {
                            mapProdRefToValidity[gArrSortedProductRefs[nProdIdx]] = true; // valid as no perms are defined for the current component
                        }
                        continue;
                    }
                    var arrPermutations = mapCompToPerms[sComponent];
                    if (arrPermutations.length > 0) {
                        for (var nPermIdx = 0; nPermIdx < arrPermutations.length; nPermIdx++) {
                            if (TestRegExp(arrPermutations[nPermIdx], sSelections)) {
                                bInValid = false;
                                break;
                            }
                        }
                    }
                    //
                    // Mark the valid product refs based on valid permutations
                    //
                    if (bInValid === false) {
                        mapProdRefToValidity[gArrSortedProductRefs[nProdIdx]] = true;
                    }
                }
            }
            //
            // If no compoenents matched, then it is a valid product
            //
            if (!bCompMatched) {
                mapProdRefToValidity[gArrSortedProductRefs[nProdIdx]] = true;
            }
        }
    }
    //
    // Cleanup the global sorted array of product refs
    //
    for (var sProdRef in mapProdRefToValidity) {
        if (mapProdRefToValidity[sProdRef] === false) {
            var nIndex = GetArrayIndex(gArrSortedProductRefs, sProdRef);
            if (nIndex !== -1) // found?
            {
                gArrSortedProductRefs.splice(nIndex, 1); // filtered prod refs based on perms
                delete gMapMatchedProducts[sProdRef];
            }
        }
    }
    //
    // exclude alternative products if any
    //	
    for (var nIndex = 0; nIndex < gArrSortedProductRefs.length; nIndex++) {
        var sProdRef = gArrSortedProductRefs[nIndex];
        if ((typeof(gMapAltProdToParentProductRef[sProdRef]) !== 'undefined') &&
            (typeof(gMapMatchedProducts[gMapAltProdToParentProductRef[sProdRef]]) !== 'undefined')) {
            gArrSortedProductRefs.splice(nIndex, 1); // exclude the alternative from results
            nIndex--;
        }
    }

    //
    // Reset the global array
    //
    gArrResultSet.length = 0;
    gArrResultSet = GetDecoratedProdRefs(gArrSortedProductRefs);
}

/***********************************************************************
 *
 * IsValidComponent						- Validate product references against permutations
 *
 * Inputs:	arrSelections				- array of selections
 *				sComponent					- component string (combination)
 *
 * Returns:									- true/false
 *
 ************************************************************************/
function IsValidComponent(arrSelections, sComponent) {
    var bValid = false;
    var arrPropIds = sComponent.split(':');
    var sSelections = arrSelections.join('|');
    //
    // Substring check for each property id in combination 
    //
    for (var nCompIdx = 0; nCompIdx < arrPropIds.length; nCompIdx++) {
        var sPropName = arrPropIds[nCompIdx];
        if (sSelections.indexOf(sPropName) !== -1) {
            bValid = true;
            break;
        }
    }
    return bValid;
}

/***********************************************************************
 *
 * UpdatePermutationCount				- Check whether to show clear button
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function UpdatePermutationCount(sCurFltrGrp, arrProds) {
    var arrSelections = new Array();
    for (var sPropId in gMapPropCtrlSelections) {
        if (typeof(sPropId) !== 'undefined') {
            arrSelections.push(sPropId);
        }
    }
    if (sCurFltrGrp !== 'SX' && sCurFltrGrp !== 'PR') {
        var sChoiceNo = '';
        var mapChoices = gMapFilters[sCurFltrGrp].m_mapChoices;
        //
        // Update count for each choice of the choices
        //
        for (sChoiceNo in mapChoices) {
            if (sChoiceNo === '') // empty? look for next choice
            {
                continue;
            }
            var nCount = mapChoices[sChoiceNo].m_nChoiceCount; // get choice count
            if (nCount === 0) // If Choice selected or choice count is 0, look for next choice
            {
                continue;
            }
            var sSelString = '';
            var sPropId = sCurFltrGrp;
            var sChoiceName = mapChoices[sChoiceNo].m_sChoiceName;
            sSelString = GetPermSelectionString(sPropId, sChoiceName);
            //
            // For each product, get the permutation
            //
            for (var nProdIdx = 0; nProdIdx < arrProds.length; nProdIdx++) {
                var sProdRef = arrProds[nProdIdx];
                if ((typeof(gMapAltProdToParentProductRef[sProdRef]) !== 'undefined') &&
                    (typeof(gMapProdToAltProdArray[gMapAltProdToParentProductRef[sProdRef]]) !== 'undefined')) {
                    continue;
                } else if (typeof(gMapProdToAltProdArray[sProdRef]) !== 'undefined') {
                    if (!CheckAlternativePermutations(sProdRef, sCurFltrGrp, sChoiceName, arrSelections)) {
                        mapChoices[sChoiceNo].m_nChoiceCount--;
                    }
                    continue;
                }
                //
                // Apply the permutation only if the product has the choice defined
                //
                if (typeof(gMapObjProductDetails[sProdRef].m_mapProperties[sCurFltrGrp]) !== 'undefined') {
                    var mapChs = gMapObjProductDetails[sProdRef].m_mapProperties[sCurFltrGrp].m_mapChoices;
                    if (typeof(mapChs[sChoiceName]) === 'undefined') // choice not present
                    {
                        continue;
                    }
                } else // property not present
                {
                    continue;
                }
                var mapCompToPerms = gMapObjProductDetails[sProdRef].m_mapCompToPermutation;
                var sPropName = gMapFilterGrpIdToFilterGrpName[sPropId];
                //
                // Get the combination of permutation to check
                //
                var sCombination = GetCombination(sPropName, mapCompToPerms);
                if (sCombination !== '') {
                    if (!IsValidCombination(sProdRef, sSelString, sCombination)) {
                        mapChoices[sChoiceNo].m_nChoiceCount--; // decrement the count
                    }
                } else // non-permutation property
                {
                    //
                    // check for valid permutations in current selections
                    //
                    var sPermSelString = GetPermSelectionString('');
                    if (sPermSelString !== '') {
                        var bInvalid = false;
                        var sComponent = '';
                        for (sComponent in mapCompToPerms) {
                            if (((arrSelections.length == 0) ||
                                    IsValidComponent(arrSelections, sComponent)) &&
                                !IsValidCombination(sProdRef, sPermSelString, sComponent)) {
                                bInvalid = true;
                                break;
                            }
                        }
                        if (bInvalid) {
                            mapChoices[sChoiceNo].m_nChoiceCount--; // decrement the count
                        }
                    }
                }
            }
        }
    } else // Price or Section property
    {
        for (var nProdIdx = 0; nProdIdx < arrProds.length; nProdIdx++) {
            var sProdRef = arrProds[nProdIdx];
            if ((typeof(gMapAltProdToParentProductRef[sProdRef]) !== 'undefined') &&
                (typeof(gMapProdToAltProdArray[gMapAltProdToParentProductRef[sProdRef]]) !== 'undefined') &&
                ((sCurFltrGrp === 'PR' &&
                        gMapObjProductDetails[gMapAltProdToParentProductRef[sProdRef]].m_sDecPriceBand === gMapObjProductDetails[sProdRef].m_sDecPriceBand) ||
                    (sCurFltrGrp === 'SX' &&
                        gMapObjProductDetails[gMapAltProdToParentProductRef[sProdRef]].m_sDecSection === gMapObjProductDetails[sProdRef].m_sDecSection))) {
                continue;
            }
            //
            // check for valid permutations in current selections
            //
            var sPermSelString = GetPermSelectionString('');
            if (sPermSelString !== '') {
                var bInvalid = false;
                var sComponent = '';
                var mapCompToPerms = gMapObjProductDetails[sProdRef].m_mapCompToPermutation;
                for (sComponent in mapCompToPerms) {
                    if (((arrSelections.length == 0) ||
                            IsValidComponent(arrSelections, sComponent)) &&
                        !IsValidCombination(sProdRef, sPermSelString, sComponent)) {
                        bInvalid = true;
                        break;
                    }
                }
                if (bInvalid) {
                    if (sCurFltrGrp === 'PR') // price filter group
                    {
                        var sPriceBandId = gMapObjProductDetails[sProdRef].m_sDecPriceBand;
                        var mapPrices = gMapFilters['PR'];
                        for (var sPriceId in mapPrices) {
                            if (sPriceBandId === sPriceId) {
                                mapPrices[sPriceBandId].m_nCount--;
                                break;
                            }
                        }
                    } else if (sCurFltrGrp === 'SX') {
                        var sSectionGroupID = gMapObjProductDetails[sProdRef].m_sDecSection;
                        var mapSections = gMapFilters['SX'];
                        for (var sSectionID in mapSections) {
                            if (sSectionGroupID === sSectionID) {
                                mapSections[sSectionGroupID].m_nCount--;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}

/***********************************************************************
 *
 * CheckAlternativePermutations - checks for valid permutations in  
 *									 alternative products
 *
 * Inputs:  	sProdRef		- parent product reference
 *			sCurFltrGrp		- current filter group
 *			sChoiceName		- choice name
 *			arrSelections  -  array of current selections
 *
 * Returns:					- true if there a valid permutation
 *
 ************************************************************************/

function CheckAlternativePermutations(sProdRef, sCurFltrGrp, sChoiceName, arrSelections) {
    if (typeof(gMapProdToAltProdArray[sProdRef]) === 'undefined') {
        return (true);
    }

    var sSelectionString = '';
    var sPropId = sCurFltrGrp;

    var bValid = true;

    sSelectionString = GetPermSelectionString(sPropId, sChoiceName);

    var arrProds = gMapProdToAltProdArray[sProdRef];
    //
    // For each product, get the permutation
    //
    for (var nProdIdx = 0; nProdIdx < arrProds.length; nProdIdx++) {
        var sProdRef = arrProds[nProdIdx];
        //
        // Apply the permutation only if the product has the choice defined
        //
        if (typeof(gMapObjProductDetails[sProdRef].m_mapProperties[sCurFltrGrp]) !== 'undefined') {
            var mapChs = gMapObjProductDetails[sProdRef].m_mapProperties[sCurFltrGrp].m_mapChoices;
            if (typeof(mapChs[sChoiceName]) === 'undefined') // choice not present
            {
                continue;
            }
        } else // property not present
        {
            continue;
        }
        var mapCompToPerms = gMapObjProductDetails[sProdRef].m_mapCompToPermutation;
        var sPropName = gMapFilterGrpIdToFilterGrpName[sPropId];
        //
        // Get the combination of permutation to check
        //
        var sCombination = GetCombination(sPropName, mapCompToPerms);
        if (sCombination !== '') {
            var arrPerms = mapCompToPerms[sCombination];
            if (((typeof(gMapInvalidProdRefs[sProdRef]) !== 'undefined' && !gMapObjProductDetails[sProdRef].m_bFullPermutation) && // marked invalid product
                    arrPerms === 'EMPTY') || // current component permutations are empty(all are invalid)
                (arrPerms === 'OSTOCK')
            ) {
                //
                // check for any valid perms in other components
                //
                if (IsAllOtherPermsValid(mapCompToPerms, sCombination)) {
                    return (true);
                }
                bValid = false;
                continue;
            } else if (arrPerms === 'EMPTY') // all valid
            {
                return (true);
            }
            if (arrPerms.length > 0) {
                //
                // For each permutation
                //

                for (var nPermIdx = 0; nPermIdx < arrPerms.length; nPermIdx++) {
                    if (TestRegExp(arrPerms[nPermIdx], sSelectionString)) {
                        return (true);
                    }
                }
                if (nPermIdx === arrPerms.length) {
                    bValid = false;
                }
            }
        } else {
            //
            // check for valid permutations in current selections
            //
            var sPermSelString = GetPermSelectionString('');
            if (sPermSelString !== '') {
                var bInvalid = false;
                var sComponent = '';
                for (sComponent in mapCompToPerms) {
                    if (IsValidComponent(arrSelections, sComponent)) {
                        if (IsValidCombination(sProdRef, sPermSelString, sComponent)) {
                            return (true);
                        }
                        bValid = false;
                        break;
                    }
                }
            }
        }
    }
    return (bValid);
}

/***********************************************************************
 *
 * IsValidCombination - checks for valid combination
 *
 * Inputs:  	sProdRef		- product reference
 *			sSelString		- current selection string
 *			sCombination	- combination string
 *
 * Returns:					- true if its a valid combination
 *
 ************************************************************************/

function IsValidCombination(sProdRef, sSelString, sCombination) {
    var mapCompToPerms = gMapObjProductDetails[sProdRef].m_mapCompToPermutation;

    if (sCombination !== '') {
        var arrPerms = mapCompToPerms[sCombination];
        if (((typeof(gMapInvalidProdRefs[sProdRef]) !== 'undefined' && !gMapObjProductDetails[sProdRef].m_bFullPermutation) && // marked invalid product
                arrPerms === 'EMPTY') || // current component permutations are empty(all are invalid)
            (arrPerms === 'OSTOCK')
        ) {
            //
            // check for any valid perms in other components
            // if any perms are valid
            // current compo has no perms defined
            // else all invalid perms
            //
            if (IsAllOtherPermsValid(mapCompToPerms, sCombination)) {
                return (true); // no perms are defined for the current component
            } else {
                return (false);
            }
        } else if (arrPerms === 'EMPTY') // all valid
        {
            return (true);
        }
        if (arrPerms.length > 0) {
            //
            // For each permutation
            //
            for (var nPermIdx = 0; nPermIdx < arrPerms.length; nPermIdx++) {
                if (TestRegExp(arrPerms[nPermIdx], sSelString)) {
                    return (true);
                }
            }
            return (false);
        }
    }
    return (true);
}

/***********************************************************************
 *
 * GetPermSelectionString				- Create selection string
 *
 * Inputs:	sCurrentPropId				- current choice id
 *				sCurrentChoiceName		- current choice
 * Returns:									- selection string
 *
 ************************************************************************/
function GetPermSelectionString(sCurrentPropId, sCurrentChoiceName) {
    var sSelString = '';
    var sCurrentDecChoice = gMapFilterGrpIdToFilterGrpName[sCurrentPropId] + ':' + sCurrentChoiceName;
    //
    // Create selection string for the defined properties
    //
    for (var nPropIdx = 0; nPropIdx < gArrayDefinedPropertiesSorted.length; nPropIdx++) {
        var sProName = gArrayDefinedPropertiesSorted[nPropIdx];
        var sPropId = gMapPropNameToPropId[sProName];
        if (sCurrentPropId === sPropId) // check the current property
        {
            sSelString += '-' + sCurrentDecChoice + '-'; // include current choice alone
        } else if (typeof(gMapPropIdToSelections[sPropId]) !== 'undefined') // const strings
        {
            sSelString += '-' + gMapPropIdToSelections[sPropId].join('--') + '-';
        } else {
            sSelString += '-' + gMapPropIdDecoratedChoices[sPropId].join('--') + '-'; // string of all the choices of the group
        }
    }
    return sSelString;
}

/***********************************************************************
 *
 * GetCombination							- Get combination to check
 *
 * Inputs:	sPropName					- property name
 *				mapCompToPerms				- map of component to permutations
 *
 * Returns:									- attribute combination
 *
 ************************************************************************/
function GetCombination(sPropName, mapCompToPerms) {
    var sCombination = '';
    for (var sKey in mapCompToPerms) // check for each of the combinations
    {
        if (sKey === '') {
            continue;
        }
        if (sKey.indexOf(sPropName) !== -1) // match found?
        {
            sCombination = sKey;
            break; // return the combination
        }
    }
    return sCombination;
}

/***********************************************************************
 *
 * CalculateCount							- Calculate count for choices
 *
 * Inputs:	bForHideOptions			- calculate count for hiding options?
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function CalculateCount(bForHideOptions) {
    //
    // 1. Filter products based on the selected filter options
    // 2. Update count from properties
    // 3. Update count using permutations
    //
    for (var nFltrIdx = 0; nFltrIdx < gArrFilterGrpIdSorted.length; nFltrIdx++) {
        var sSelectionPattern = '';
        var sFilterGroup = gArrFilterGrpIdSorted[nFltrIdx];
        if (!bForHideOptions && !g_bClearAll) // pattern will be empty during onload or clear all 
        {
            sSelectionPattern = GetFilterPatternForCount(sFilterGroup);
        }
        //
        // Get filtered products based on the selected filter options
        //
        var arrFilteredProds = GetFilteredProducts(sSelectionPattern);
        //
        // Calculate count for each group
        //
        CountFilterOptions(sFilterGroup, arrFilteredProds);
        //
        // Update count based on permutations
        //
        UpdatePermutationCount(sFilterGroup, arrFilteredProds);
        //
        // Finally, find the cumulative count for all sub sections
        //
        if (sFilterGroup === 'SX') {
            UpdateCumulativeSectionCount();
        }
    }
}

/***********************************************************************
 *
 * GetFilterPatternForCount				- Get filter pattern for count
 *
 * Inputs:	sCurFilterGrp				- current filter group
 *
 * Returns:									- selection pattern for match
 *
 ************************************************************************/
function GetFilterPatternForCount(sCurFilterGrp) {
    //
    // Get the filter selections in regular expression. The selections are formulated by 
    // ignoring the current filter group for which the count is being calculated
    //
    var mapPropIdToFilterSelections = {}; // map of property controlid to selections
    var sPattern = '';
    for (var sFilterGroup in gMapFilterGrpIdToFilterGrpName) {
        if (sFilterGroup === sCurFilterGrp) // is this the current group to which count is being calculated?
        {
            continue;
        }
        //
        // Format the filter selection regular expression by considering all the filter
        // options selections excluding the current group for which the count is being
        // calculated
        //
        if (typeof(gMapControlToSelection[sFilterGroup]) !== 'undefined') {
            var mapFilterGroup = gMapControlToSelection[sFilterGroup];
            var arrChoices = new Array();
            var sChoices = '';
            if (sFilterGroup === 'PR') // price or section group?
            {
                for (var sFilterCtrlId in mapFilterGroup) {
                    var sChoice = sFilterGroup + '_' + sFilterCtrlId;
                    arrChoices.push(sChoice);
                }
            } else if (sFilterGroup === 'SX') {
                //
                // Get the sub section details as well
                //
                var mapSecs = {};
                for (var sFilterCtrlId in mapFilterGroup) {
                    mapSecs[sFilterCtrlId] = '';
                    var arrSubSecIDs = gMapFilters['SX'][sFilterCtrlId].m_arrSubSectionIds;
                    for (var nSecIdx = 0; nSecIdx < arrSubSecIDs.length; nSecIdx++) {
                        if (GetArrayIndex(gArraySectionIDs, arrSubSecIDs[nSecIdx]) !== -1) // if sub section included
                        {
                            mapSecs[arrSubSecIDs[nSecIdx]] = '';
                        }
                    }
                }
                for (var sSecId in mapSecs) {
                    var sChoice = sFilterGroup + '_' + sSecId;
                    arrChoices.push(sChoice);
                }
            } else // other filter groups
            {
                for (var sFilterChoiceCtrlId in mapFilterGroup) {
                    if (typeof(gMapControlIdChoiceName[sFilterChoiceCtrlId]) !== 'undefined') {
                        var sChoice = sFilterGroup + ':' + gMapControlIdChoiceName[sFilterChoiceCtrlId];
                        arrChoices.push(sChoice);
                    }
                }
            }
            //
            // Format the regular expression
            //
            if (arrChoices.length > 0) {
                mapPropIdToFilterSelections[sFilterGroup] = '\\!' + arrChoices.join('\\!|\\!') + '\\!';
            }
        }
    }
    for (var nFltrIdx = 0; nFltrIdx < gArrFilterGrpIdSorted.length; nFltrIdx++) {
        var sFltrGrpId = gArrFilterGrpIdSorted[nFltrIdx];
        if (typeof(mapPropIdToFilterSelections[sFltrGrpId]) !== 'undefined') {
            if (sPattern.length > 0) {
                sPattern += '.*'
            }
            sPattern += mapPropIdToFilterSelections[sFltrGrpId];
        }
    }
    return sPattern;
}

/***********************************************************************
 *
 * GetFilteredProducts					- Get the filtered products
 *
 * Inputs:	sRegExProps					- regular expression of property options
 *
 * Returns:									- array of matched products
 *
 ************************************************************************/
function GetFilteredProducts(sRegExProps) {
    var arrMatchedProd = new Array();
    var oRegExp = new RegExp(sRegExProps, 'i');
    gMapMatchedProducts = {};
    gMapProdToAltProdArray = {};
    for (var sProdRef in gMapObjProductDetails) {
        if (sRegExProps === '') {
            arrMatchedProd.push(sProdRef);
            gMapMatchedProducts[sProdRef] = '';
            continue;
        }
        //
        // Execute the regular pattern formed based on selection against the 
        // decorated choices string
        //
        var sDecProps = gMapObjProductDetails[sProdRef].m_sDecFilterString;
        //
        // Check if choice match found
        //
        if (TestRegExp(oRegExp, sDecProps)) {
            arrMatchedProd.push(sProdRef);
            gMapMatchedProducts[sProdRef] = '';
        }
    }
    //
    // create product alternatives lookup map
    //
    for (var nIndex = 0; nIndex < arrMatchedProd.length; nIndex++) {
        var sProdRef = arrMatchedProd[nIndex];
        if ((typeof(gMapAltProdToParentProductRef[sProdRef]) !== 'undefined') &&
            (typeof(gMapMatchedProducts[gMapAltProdToParentProductRef[sProdRef]]) !== 'undefined')) {
            if (typeof(gMapProdToAltProdArray[gMapAltProdToParentProductRef[sProdRef]]) === 'undefined') {
                gMapProdToAltProdArray[gMapAltProdToParentProductRef[sProdRef]] = new Array();
                gMapProdToAltProdArray[gMapAltProdToParentProductRef[sProdRef]].push(gMapAltProdToParentProductRef[sProdRef]);
            }
            gMapProdToAltProdArray[gMapAltProdToParentProductRef[sProdRef]].push(sProdRef);
        }
    }
    return arrMatchedProd;
}

/***********************************************************************
 *
 * TestRegExp						- Count filter property options
 *
 * Inputs:	sRegEx				- regular expression
 *				sPattern				- pattern to test
 *
 * Returns:							- true/false
 *
 ************************************************************************/
function TestRegExp(sRegEx, sPattern) {
    var bResult = false;
    if ((typeof(sRegEx) !== 'undefined') && (typeof(sPattern) !== 'undefined') &&
        sPattern != '') {
        bResult = sRegEx.test(sPattern);
    }
    return (bResult);
}

/***********************************************************************
 *
 * CountFilterOptions						- Count filter property options
 *
 * Inputs:	sCurFltrGrp					- current filter group to calculate count
 *				arrProds						- array of products for count calculation
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function CountFilterOptions(sCurFltrGrp, arrProds) {
    var mapProducts = {};
    //
    // prepare a result lookup map
    //
    for (var nProdIndx = 0; nProdIndx < arrProds.length; nProdIndx++) {
        mapProducts[arrProds[nProdIndx]] = '';
    }
    //
    // Update the count by looking up each product
    //
    for (var nProdIndx = 0; nProdIndx < arrProds.length; nProdIndx++) {
        var sProdRef = arrProds[nProdIndx];
        if (sCurFltrGrp === 'PR') // price filter group
        {
            var sPriceId = gMapObjProductDetails[arrProds[nProdIndx]].m_sDecPriceBand;
            //
            // ignore price count update if alternative product is listed with parent product
            //
            if ((typeof(gMapAltProdToParentProductRef[sProdRef]) === 'undefined') ||
                (typeof(mapProducts[gMapAltProdToParentProductRef[sProdRef]]) === 'undefined') ||
                (gMapObjProductDetails[gMapAltProdToParentProductRef[sProdRef]].m_sDecPriceBand !== sPriceId)) {
                UpdatePriceCount(sPriceId);
            }
        } else if (sCurFltrGrp === 'SX') // section filter group
        {
            var sSectionId = gMapObjProductDetails[arrProds[nProdIndx]].m_sDecSection;
            //
            // ignore section count update if alternative product is listed with parent product
            //
            if ((typeof(gMapAltProdToParentProductRef[sProdRef]) === 'undefined') ||
                (typeof(mapProducts[gMapAltProdToParentProductRef[sProdRef]]) === 'undefined') ||
                (gMapObjProductDetails[gMapAltProdToParentProductRef[sProdRef]].m_sDecSection !== sSectionId)) {
                UpdateSectionCount(sSectionId);
            }
        } else // choice filter group
        {
            var sChoicesString = gMapObjProductDetails[arrProds[nProdIndx]].m_sDecFilterString;
            var mapProdChoices = gMapObjProductDetails[arrProds[nProdIndx]].m_mapDecChoices;

            if ((typeof(gMapAltProdToParentProductRef[sProdRef]) === 'undefined') ||
                (typeof(mapProducts[gMapAltProdToParentProductRef[sProdRef]]) === 'undefined')) {
                UpdateChoiceCount(sCurFltrGrp, sChoicesString, mapProdChoices);
            } else {
                var mapParentProdChoices = gMapObjProductDetails[gMapAltProdToParentProductRef[sProdRef]].m_mapDecChoices;
                var mapProdMergedChoices = {};
                //
                // prepare the alternative product choices for the choice count calculation
                //
                for (var sDecChoice in mapProdChoices) {
                    mapProdMergedChoices[sDecChoice] = '';
                }
                //
                // exclude the alternative choices which are already present in parent product
                //
                for (var sDecChoice in mapParentProdChoices) {
                    if (typeof(mapProdMergedChoices[sDecChoice]) !== 'undefined') {
                        delete mapProdMergedChoices[sDecChoice];
                    }
                }
                UpdateChoiceCount(sCurFltrGrp, sChoicesString, mapProdMergedChoices);
            }
        }
    }
}

/***********************************************************************
 *
 * UpdatePriceCount						- Update price count
 *
 * Inputs:	sPriceId						- price id for count update
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function UpdatePriceCount(sPriceId) {
    var mapPrices = gMapFilters['PR'];
    var bShowPrGroup = false;
    for (var sPriceBandId in mapPrices) {
        if (sPriceBandId === sPriceId) {
            mapPrices[sPriceBandId].m_nCount++;
            bShowPrGroup = true;
            break;
        }
    }
    if (bShowPrGroup) {
        gMapFilters['PR'].m_bShow = true;
    }
}

/***********************************************************************
 *
 * UpdateSectionCount						- Update section count
 *
 * Inputs:	sSectionId					- section id for count update
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function UpdateSectionCount(sSectionId) {
    var mapSections = gMapFilters['SX'];
    var bShowSXGroup = false;
    for (var sSectionNo in mapSections) {
        if (sSectionNo === sSectionId) {
            mapSections[sSectionNo].m_nCount++;
            bShowSXGroup = true;
            break;
        }
    }
    if (bShowSXGroup) {
        gMapFilters['SX'].m_bShow = true;
    }
}

/***********************************************************************
 *
 * UpdateChoiceCount						- Update choice count
 *
 * Inputs:	mapChoices					- choices to update the count
 *				sChoicesString				- choices string from the product
 *				mapProdChoices				- map of product choices
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function UpdateChoiceCount(sCurFltrGrp, sChoicesString, mapProdChoices) {
    var mapFltrChoices = gMapFilters[sCurFltrGrp].m_mapChoices;
    var bShowFilterGroup = false;
    //
    // Update choice count for each choice
    //
    for (var nChoiceNo in mapFltrChoices) {
        var oChoice = mapFltrChoices[nChoiceNo];
        if (oChoice.m_sChoiceName === '') // default choice with 'Any'
        {
            continue;
        }
        //
        // Check if choice defined in the product
        //
        var sKey = sCurFltrGrp + ':' + oChoice.m_sChoiceName;
        if (typeof(mapProdChoices[sKey]) !== 'undefined') {
            oChoice.m_nChoiceCount++; // update count
            bShowFilterGroup = true;
        }
    }
    if (bShowFilterGroup) {
        gMapFilters[sCurFltrGrp].m_bShow = true; // show the group header		
    }
}

/***********************************************************************
 *
 * RemoveFilterWithZeroCount			- Remove filter options with count zero
 *
 * Returns:									- nothing
 *
 ************************************************************************/
function RemoveFilterWithZeroCount() {
    for (var sFilterGroup in gMapFilters) {
        if (sFilterGroup === 'PR') // filter price group
        {
            var mapPriceBands = gMapFilters[sFilterGroup];
            for (var sPriceId in mapPriceBands) {
                if (mapPriceBands[sPriceId].m_nCount == 0) {
                    mapPriceBands[sPriceId].m_bHideAlways = true; // hide the option always
                }
            }
        } else if (sFilterGroup === 'SX') // filter section group
        {
            var mapSections = gMapFilters[sFilterGroup];
            for (var sSectionId in mapSections) {
                if (mapSections[sSectionId].m_nCumulativeCount == 0) {
                    mapSections[sSectionId].m_bHideAlways = true; // hide the option always
                }
            }
        } else // filter property group
        {
            var mapChoices = gMapFilters[sFilterGroup].m_mapChoices;
            gMapFilters[sFilterGroup].m_bHideAlways = true;
            for (var sChoiceId in mapChoices) {
                if (mapChoices[sChoiceId].m_nChoiceCount == 0) {
                    mapChoices[sChoiceId].m_bHideAlways = true; // hide the option always
                } else {
                    gMapFilters[sFilterGroup].m_bHideAlways = false; // do not hide
                }
            }
        }
    }
}

/***********************************************************************
 *
 * IsAllOtherPermsValid				- Check if other permuations defined under 
 *													other component of the product
 *
 * Inputs:	mapCompToPerms				- permutation map
 *				sCurrentCombination		- current permutation combination
 *
 * Returns:									- true/false
 *
 ************************************************************************/
function IsAllOtherPermsValid(mapCompToPerms, sCurrentCombination) {
    var bValid = false;
    for (var sCombination in mapCompToPerms) {
        if (sCombination === sCurrentCombination) // do not check for the current combination
        {
            continue;
        } else {
            //
            // Check for the perms of other components
            //
            var arrPerms = mapCompToPerms[sCombination];
            if (arrPerms !== 'EMPTY' && arrPerms !== 'OSTOCK') {
                if (arrPerms.length > 0) {
                    bValid = true; // true if any valid perms
                    break;
                }
            }
        }
    }
    return bValid;
}

/***********************************************************************
 *
 * GetFilterCacheURL	- Adjust the filter cache file name for a base href if present
 *
 * Input:	sFileName	- file name
 *
 * Returns:	string	input file name or URL if base href is present adjusted for protocol and top-level domain
 *
 ************************************************************************/

function GetFilterCacheURL(sFileName) {
    var sURL = '';
    var collBase = document.getElementsByTagName('base');
    if (collBase && collBase.length > 0) {
        sURL = collBase[0].href;
        var sDocProto = document.location.protocol;
        var sURLProto = sURL.split('//')[0];
        if (sURLProto != sDocProto) {
            sURL = sURL.replace(new RegExp('^' + sURLProto), sDocProto);
        }
        var sURLHost = sURL.split('//')[1].split('/')[0];
        if (sURLHost != document.location.host) {
            sURL = sURL.replace(sURLHost, document.location.host);
        }
        if (!sURL.match(/\/$/)) {
            sURL += '//';
        }
        return sURL + sFileName;
    }
    return sFileName;
}

/***********************************************************************
 *
 * ReloadCarousels - re-initialise carousels/sliders, which is necessary after their visibility changes.
 *
 ************************************************************************/

function ReloadCarousels() {
    //
    // Reload all the carousels/sliders.
    // This is necessary when their visibility is changed.
    //
    $("div[class^='bxSlider']").each(
        function(index) {
            var oSlider = $(this).data('sd_BXSlider'); // slider object is stored as jQuery data for the div.
            if (oSlider) {
                oSlider.reloadSlider(); // start again
            }
        });
}

/***********************************************************************
 *
 * CacheStockFilter			- Cache stock filter file
 *
 ************************************************************************/

function CacheStockFilter() {
    if (!IsExcludeOutOfStockItems()) {
        return;
    }
    var stockFilterRequest = new ajaxObject('stockfilter.js');
    stockFilterRequest.callback = function(responseText) {
        if (responseText === '') {
            return;
        }
        g_bCacheStock = false;
        //
        // Cache stock details
        //
        var arrStockDetails = responseText.split('|')
        gMapRefStock = {}; // clear cache
        for (index = 0; index < arrStockDetails.length; index++) {
            if (arrStockDetails[index] == '') {
                continue;
            }
            var arrRefStock = arrStockDetails[index].split('_');
            gMapRefStock[arrRefStock[0]] = parseInt(arrRefStock[1]);
        }
    };
    stockFilterRequest.update('', "GET", false); // send the sync request
}

/***********************************************************************
 *
 * IsOutOfStockFromStockFilter		- Check if the product is out of stock
 *											with respect to stock filter file
 *
 * Returns:				- true/false
 *
 ************************************************************************/

function IsOutOfStockFromStockFilter(sProdRef) {
    if ((typeof(gMapRefStock[sProdRef]) === 'undefined')) {
        return (null);
    }
    if (gMapRefStock[sProdRef] <= 0) {
        return (true);
    }
    return (false);
}

/***********************************************************************
 *
 * IsExcludeOutOfStockItems	- Check if Exclude Out of Stock items enabled
 *
 * Returns:						- true/false
 *
 ************************************************************************/

function IsExcludeOutOfStockItems() {
    if (typeof(pg_bExcludeOutOfStockItems) !== 'undefined' &&
        pg_bExcludeOutOfStockItems !== 0) {
        return (true);
    }
    return (false);
}

/***********************************************************************
 *
 * GetProdRefForFullPermutation	- Get product reference parameter to 
 *												download full permutation list
 *
 * Returns: string 		- formatted product references
 *
 ************************************************************************/

function GetProdRefForFullPermutation() {
    //
    // Get full permutations for the out of stock items
    //
    var mapProducts = {};
    for (var sProdRef in gMapRefStock) // for each out of stock items
    {
        if (typeof(gMapChildToParentProducts[sProdRef]) !== 'undefined') {
            var arrParentProduct = gMapChildToParentProducts[sProdRef];
            for (var nParentProdIdx = 0; nParentProdIdx < arrParentProduct.length; nParentProdIdx++) {
                mapProducts[arrParentProduct[nParentProdIdx]] = null;
            }
        }
    }

    for (var sProdRef in gMapInvalidEmptyPermsProdRefs) // for each out of stock items
    {
        mapProducts[sProdRef] = null;
    }
    //
    // Format the product reference list
    //
    var sProdRefParam = '';
    var nCounter = 0;
    for (var sProdRef in mapProducts) {
        sProdRefParam += ((nCounter == 0) ? '' : '_') + sProdRef;
        nCounter++;
    }
    return (sProdRefParam);
}

/***********************************************************************
 *
 * UpdateProductDetailsWithFullPermutation	- Update product details with full 
 *															permutation list 
 *
 ************************************************************************/

function UpdateProductDetailsWithFullPermutation(sResponseText) {
    var arrayJSONResponse = {};
    try {
        arrayJSONResponse = sResponseText.parseJSON();
    } catch (e) {
        ShowJSONError(e); // show json error
        return;
    }
    arrProductToFullPermutation = arrayJSONResponse.FullPermutationList;
    //
    // Update full permutation for all products
    //
    for (var nProdIdx = 0; nProdIdx < arrProductToFullPermutation.length; nProdIdx++) {
        var mapProductToFullPerms = arrProductToFullPermutation[nProdIdx];
        for (var sProdRef in mapProductToFullPerms) {
            if (typeof(gMapObjProductDetails[sProdRef]) != 'undefined') {
                var objProductDetails = gMapObjProductDetails[sProdRef];
                UpdateCompToPermMapWithFullPermutation(objProductDetails, mapProductToFullPerms[sProdRef]);
                //
                // Discard products with all permutations out of stock
                //
                var mapCompToPermutation = gMapObjProductDetails[sProdRef].m_mapCompToPermutation;
                if (Object.keys(mapCompToPermutation).length == 0) {
                    continue;
                }
                var bAllOutOfStock = true;
                for (var sCombinationKey in mapCompToPermutation) {
                    if (mapCompToPermutation[sCombinationKey] !== 'OSTOCK') {
                        bAllOutOfStock = false;
                    }
                }
                if (bAllOutOfStock) {
                    delete gMapObjProductDetails[sProdRef]; // discard
                }
            }
        }
    }
}

/***********************************************************************
 *
 * UpdateCompToPermMapWithFullPermutation	- Update component to permutation map
 *														with full permutation list
 *
 * Input:	objProductDetails			- product details map
 * 			sFullPermutationString	- full permutation string
 *
 ************************************************************************/

function UpdateCompToPermMapWithFullPermutation(objProductDetails, sFullPermutationString) {
    //
    // Full permutation string format
    // <Attibute1_0:Attribute2_0>Attibute1_0!Ch12!!Attribute2_0!Ch21:1:0:v&#58;646!0!1!1!10!1
    //
    // Set component details with decorated permutations for easy match
    // Example: (.*)\-S_654_0\:Red\-\-S_655_0\:Gold\-\-S_656_0\:I\-(.*)
    //
    if (sFullPermutationString !== '') {
        objProductDetails.m_mapCompToPermutation = {};
        var arrPermutations = sFullPermutationString.split(',');
        for (var nPermIdx = 0; nPermIdx < arrPermutations.length; nPermIdx++) {
            var sPattern = /(<(.*)>(.*))/igm;
            var arrMatch = sPattern.exec(arrPermutations[nPermIdx]);
            if (arrMatch !== null) {
                if (arrMatch[2] !== '') {
                    var arrAttributeCombinations = (arrMatch[2].toUpperCase()).split(':'); // attribute combination (Ex: S_254_0:S_255_0:S_256_0)
                    InsertSort(arrAttributeCombinations);
                    var sCombinationKey = arrAttributeCombinations.join(':');
                    //
                    // exclude undefined attribute combinations
                    //
                    for (var nAttrIdx = 0; nAttrIdx < arrAttributeCombinations.length; nAttrIdx++) {
                        if (typeof(gMapPropNameToPropId[arrAttributeCombinations[nAttrIdx]]) === 'undefined') {
                            arrAttributeCombinations.splice(nAttrIdx, 1);
                            nAttrIdx--;
                        }
                    }
                    //
                    // Check if any combination of attributes defined in filter options, if not the permutation
                    // details are not stored as they are not used 
                    //
                    var sTmpAttributes = '\\-' + arrAttributeCombinations.join('\\-.*\\-') + '\\-';
                    var oRegExAttr = new RegExp(sTmpAttributes, 'i'); // regular expression
                    if (!oRegExAttr.test(g_sDefinedPropertiesPattern)) {
                        continue; // do not store the permutation
                    }
                    var sFullPermutation = arrMatch[3]; // full permutation with associated product details
                    if (sFullPermutation === '') {
                        continue; // no permutation?
                    }
                    var arrPermCombinations = sFullPermutation.split('|');
                    //
                    // Create a map of decorated valid permutations with the combination as key
                    //
                    for (var nIdx = 0; nIdx < arrPermCombinations.length; nIdx++) {
                        var sPattern = /(.*)\:(\d)\:.*\:(.*)/igm;
                        var arrMatch = sPattern.exec(arrPermCombinations[nIdx]);
                        //
                        // arrMatch[1] -> full permutation
                        // arrMatch[2] -> permutation validity
                        // arrMatch[3] -> associated product details
                        //
                        if (arrMatch[2] == 0) // is invalid permutation?
                        {
                            if (typeof(objProductDetails.m_mapCompToPermutation[sCombinationKey]) === 'undefined') {
                                objProductDetails.m_mapCompToPermutation[sCombinationKey] = 'EMPTY';
                            }
                            continue;
                        }
                        //
                        // Associated product details check for out-of-stock/in stock
                        //
                        var sAssocProductsDetails = arrMatch[3]; // associated product details
                        if (sAssocProductsDetails != '') // any associated product present
                        {
                            var arrAssocProductsDetails = sAssocProductsDetails.split('!');
                            var sAssocProdRef = arrAssocProductsDetails[0]; // product ref
                            sAssocProdRef = DecodeHtmlEntity(sAssocProdRef);
                            var bIsStockControlled = arrAssocProductsDetails[2]; // stock enabled for this permutation?
                            var bInStockStatic = arrAssocProductsDetails[3]; // stock as per associated details in full permutation
                            //
                            // Exclude out of stock permutations
                            //
                            if (IsOutOfStock(sAssocProdRef, bIsStockControlled, bInStockStatic)) {
                                if (typeof(objProductDetails.m_mapCompToPermutation[sCombinationKey]) === 'undefined' || // combination undefined?
                                    objProductDetails.m_mapCompToPermutation[sCombinationKey] === 'EMPTY') // some permutations are invalid
                                {
                                    objProductDetails.m_mapCompToPermutation[sCombinationKey] = 'OSTOCK';
                                }
                                continue;
                            }
                        }
                        var sPermutation = arrMatch[1]; // full permutation
                        //
                        // prepare permutation regular expressions
                        //
                        var arrCombs = (sPermutation.toUpperCase()).split('!!');
                        for (var nCombIdx = 0; nCombIdx < arrCombs.length; nCombIdx++) {
                            var arrTempComb = arrCombs[nCombIdx].split('!');
                            if (typeof(gMapPropNameToPropId[arrTempComb[0]]) === 'undefined') {
                                arrCombs.splice(nCombIdx, 1);
                                nCombIdx--;
                            }
                        }
                        if (arrCombs.length === 0) {
                            continue;
                        }
                        InsertSort(arrCombs);
                        var sTmpPerms = '\\-' + arrCombs.join('\\-.*\\-') + '\\-';
                        var arrTmpPerms = sTmpPerms.split('!');
                        var oRegEx = new RegExp(arrTmpPerms.join('\\:'), 'i'); // regular expression
                        //
                        // Create a map of valid permutations
                        //
                        if (typeof(objProductDetails.m_mapCompToPermutation[sCombinationKey]) === 'undefined' ||
                            objProductDetails.m_mapCompToPermutation[sCombinationKey] === 'EMPTY' || // might have been empty for some product
                            objProductDetails.m_mapCompToPermutation[sCombinationKey] === 'OSTOCK') // might have been out of stock for some product	
                        {
                            objProductDetails.m_mapCompToPermutation[sCombinationKey] = new Array;
                        }
                        objProductDetails.m_mapCompToPermutation[sCombinationKey].push(oRegEx); // permutation map of regular expressions
                    }
                }
            }
        }
        objProductDetails.m_bFullPermutation = true;
    } else {
        objProductDetails.m_mapCompToPermutation['EMPTY'] = ''; // no permutation!
    }
}