/***************************************************************
 * 
 * dynamic.js	-	utility functions for dynamic prices and choices
 *
 * Copyright (c) 2014 SellerDeck Limited
 *
 ****************************************************************/

var g_mapProds = {};
var timeout = null;
var g_nTimeout = 1000; // 1 sec
var g_sDynamicPriceURL = '';

/***********************************************************************
 *
 * OnProdLoad	- onload handler for this page
 *
 ************************************************************************/

function OnProdLoad(sURL, sSID, sShopID) {
    //
    // Need to handle a single add to cart button
    //
    if (sURL) // if we are using dynamic prices
    {
        g_sDynamicPriceURL = sURL;
        getAllDynamicPrices(sURL, sSID, sShopID); // get all dynamic prices for this page init
    } else // handle dynamic choices if applicable
    {
        g_sDynamicPriceURL = '';
        if (g_bStockUpdateInProgress) {
            //			
            // do not update choices when products stock update is in progress
            // note: currently selected options may be changed during stock update process
            // 
            g_bChoicesUpdatePending = true;
            return;
        }
        //
        // Store variant settings
        //
        SetupVariants(false);
        //
        // Update dynamic choices to remove invalid generated choices
        // and to handle sequential dynamic choices if applicable
        //
        for (var sProdRef in g_mapProds) {
            var oProd = g_mapProds[sProdRef];
            UpdateChoices(oProd, true, undefined);
        }
    }
}

/***********************************************************************
 *
 * GetAttrFromSuffix	- Get the attribute from the UI number
 *
 * Input: oProd	- product object
 *			nUI	- UI number
 *
 * Returns: Object	-	attribute object or undefined
 *
 ************************************************************************/

function GetAttrFromSuffix(oProd, nUI) {
    if (!oProd.mapAttr) // if this is first time
    {
        oProd.mapAttr = {};
        for (var i = 0; i < oProd.arrComps.length; i++) // for each component
        {
            var oComp = oProd.arrComps[i];
            if (oComp.aA) // if it has attributes
            {
                for (var n = 0; n < oComp.aA.length; n++) {
                    oProd.mapAttr[oComp.aA[n].nUI] = oComp.aA[n]; // map attribute to UI number
                }
            }
        }
    }
    return oProd.mapAttr[nUI]; // return attribute
}

/***********************************************************************
 *
 * UpdateChoices	- Update the choices for this product
 *
 * Input: oProd		-	product object
 *			bLoading	-	whether this is the initial call
 *
 ************************************************************************/

function UpdateChoices(oProd, bLoading, elemChanged) {
    if (!oProd || oProd.bFixChoices ||
        oProd.bNoATC || !oProd.arrComps) // skip if product isn't mapped, or it's not dynamic or no valid choices
    {
        return;
    }
    //
    // IE restores user choices on a refresh but appears to use the index of
    // the choice rather than the value which might not be the same. We save
    // the choices to a textarea (which IE restores) to get the correct choice
    // values
    //
    var arrProdChoices = GetProdChoices(oProd, elemChanged, bLoading); // get user input
    var oChangedIndices = GetChangedElemIndices(oProd, elemChanged);
    var nStartCompIndex = oChangedIndices ? oChangedIndices.nCompIndex : 0;
    var arrComps = oProd.arrComps;
    var nCompCount = arrComps.length;
    for (var i = nStartCompIndex; i < nCompCount; i++) // for each component from changed component
    {
        var arrCompChoices = arrProdChoices[i];
        var oComp = arrComps[i];
        if (!oComp.aA) // skip components with no attributes
        {
            continue;
        }
        if (bLoading) // if this is first time
        {
            MapInvalidPermutations(oComp); // filter out price permutations
        }
        if (oComp.mP || // if we have permutations
            oProd.bSequentialChoices) // or we are using sequential choices
        {
            //
            // To simplify processing of permutations when sequential choices
            // aren't used, we transform the permuation map so that the choices
            // are specified in the order the user selected them
            //
            if (!oComp.arrUserSeq) {
                oComp.arrUserSeq = [];
            }
            if (!oProd.bSequentialChoices && oChangedIndices && i == oChangedIndices.nCompIndex) {
                UpdateUserSequence(oComp, oChangedIndices.nAttrIndex, arrProdChoices[i]);
            }
            NormaliseAttrSeq(oComp);
            //
            // Update the user's choice array so that the choices are in the order
            // the user selected them
            //
            var arrCompChoices = NormaliseUserChoices(oComp, arrProdChoices[i]);
            //
            // Update the permutation map so that the choices are in the order
            // the user selected them
            //
            NormalisePerms(oComp);
            //
            // If we are using sequential choices and know which attribute choice changed
            // we only update from the changed choice
            //
            var nStartAttrIndex = 0;
            if (oProd.bSequentialChoices && // if we are using sequential choices
                i == nStartCompIndex && oChangedIndices) // and we know which element changed
            {
                nStartAttrIndex = oChangedIndices.nAttrIndex; // only update choices from the changed attribute
            }
            //
            // Now update the choices
            //
            UpdateCompChoices(oProd, oComp, arrCompChoices, nStartAttrIndex); // update choices for this component
        }
    }
    //
    // Updating choices  loses the disabled status of options due to out-of-stock products
    // so re-apply the stock levels.
    // false indicates that selections aren't to be changed. As out of stock options will have
    // been disabled they will not be selectable here anyway.
    //
    updateStockDisplay(g_mapStockByRef, false);
    //
    // Enforce sequential choices if merchant wants it
    //
    if (oProd.bSequentialChoices) {
        UpdateSequentialDisplay(oProd, arrProdChoices);
    }
}

/***********************************************************************
 *
 * UpdateSequentialDisplay	- Update the sequential display of choices
 *
 * Input: oProd					-	product object
 *			arrProdChoices		-	array of arrays containing choices
 *
 ************************************************************************/

function UpdateSequentialDisplay(oProd, arrProdChoices) {
    var bSequentialDisable = false;
    for (var i = 0; i < oProd.arrComps.length; i++) {
        var oComp = oProd.arrComps[i];
        bSequentialDisable = UpdateSequentialCompDisplay(oProd, oComp, arrProdChoices[i], 0, bSequentialDisable);
    }
}

/***********************************************************************
 *
 * UpdateSequentialCompDisplay	- Update the sequential display of component choices
 *
 * Input: oProd						- product object
 *			oComp						- component object
 *			arrChoices				- array of choices for the component
 *			nStartIndex				- index into array of choices to start from
 *			bSequentialDisable	- whether containing element should be disabled
 *
 * Returns: boolean - true if subsequent choices should be disabled
 *
 ************************************************************************/

function UpdateSequentialCompDisplay(oProd, oComp, arrCompChoices, nStartIndex, bSequentialDisable) {
    var elemComp = oComp.elemHTML; // get component element (hidden or checkbox)
    var bRequired = true; // default to required component
    if (elemComp.type == 'checkbox') // if this is a checkbox
    {
        elemComp.disabled = bSequentialDisable; // apply the disabled flag
        if (!bSequentialDisable) // if we aren't disabling the component
        {
            bRequired = elemComp.checked; // save whether it is included
        }
    }
    if (!oComp.aA) // if we have no attributes
    {
        return bSequentialDisable; // nothing more to do
    }
    //
    // Now update the attribute elements
    //
    var nCompAttrCount = oComp.aA.length;
    for (var i = nStartIndex; i < nCompAttrCount; i++) {
        var oAttr = oComp.aA[i];
        var oAttrSelect = oAttr.elem;
        var elemSelect = oAttrSelect.elemHTML; // get the attribute HTML element
        if (bSequentialDisable || // if previous choices need to be made or
            !bRequired) // this component isn't required
        {
            EnableSelectElement(elemSelect, false); // disable UI
            if (elemSelect.tagName == 'SELECT') {
                elemSelect.selectedIndex = 0; // revert to 'Please select'
            }
        } else {
            //
            // Now if there is only one valid choice, select it
            //
            var oResult = GetValidChoiceCount(elemSelect);
            if ((!oComp.bOpt || (nCompAttrCount > 1)) &&
                (oResult.nCount == 1)) {
                var nSelValue = GetAttributeValue(elemSelect); // save existing selection
                if (elemSelect.tagName == 'SELECT') // select the UI selection element
                {
                    oResult.elemFirstValid.selected = true;
                } else {
                    oResult.elemFirstValid.checked = true;
                }
                var sNewValue = GetAttributeValue(elemSelect); // get new value
                if (nSelValue != sNewValue) // if it changed
                {
                    arrCompChoices[i] = sNewValue ? parseInt(sNewValue) : 0;
                    UpdateCompChoices(oProd, oComp, arrCompChoices, i + 1); // update subsequent choices
                }
            }
            //
            // If we have a 'Please select' choice, disable subsequent choices
            //
            var nSelValue = GetAttributeValue(elemSelect);
            EnableSelectElement(elemSelect, true);
            if (nSelValue == '') // and it isn't 'None'
            {
                bSequentialDisable = true; // disable rest of elements
            }
        }
    }
    return bSequentialDisable; // tell caller if it should disable rest of choices
}

/***********************************************************************
 *
 * GetValidChoiceCount	- Get the number of valid choices and the first valid option available to the user
 *
 * Input: elemSelect	-	the select element
 *
 * Returns: Object		-	nCount property contains valid count, elemFirstValid contains the first valid element
 *
 ************************************************************************/

function GetValidChoiceCount(elemSelect) {
    var nCount = 0;
    var elemFirstOption = null;
    if (elemSelect.tagName == 'SELECT') {
        for (var i = 0; i < elemSelect.options.length; i++) {
            var oOption = elemSelect.options[i];
            var nValue = parseInt(oOption.value ? oOption.value : '0');
            if (nValue > 0 && !oOption.disabled) {
                nCount++;
                if (nCount == 1) {
                    elemFirstOption = oOption;
                }
            }
        }
    } else {
        var collSel = document.getElementsByName(elemSelect.name);
        for (var i = 0; i < collSel.length; i++) {
            var elemRadio = collSel[i];
            var nValue = parseInt(elemRadio.value ? elemRadio.value : '0');
            if (nValue > 0) {
                nCount++;
                if (nCount == 1) {
                    elemFirstOption = elemRadio;
                }
            }
        }
    }
    return {
        nCount: nCount,
        elemFirstValid: elemFirstOption
    };
}

/***********************************************************************
 *
 * EnableSelectElement	- Enable or disable user selection element(s)
 *
 * Input: elemSelect	-	selection element
 *			bEnable	-	false to disable
 *
 ************************************************************************/

function EnableSelectElement(elemSelect, bEnable) {
    if (elemSelect.tagName == 'SELECT') {
        elemSelect.disabled = !bEnable;
    } else {
        var collSel = document.getElementsByName(elemSelect.name);
        for (var i = 0; i < collSel.length; i++) {
            var elemRadio = collSel[i];
            elemRadio.disabled = !bEnable;
        }
    }
}

/***********************************************************************
 *
 * GetProdChoices	- Get current choices for this product
 *
 * Input: oProd			- product object
 *			elemChanged	- element that has changed
 *			bLoading		- true if we are loading the page
 *
 * Returns: Array	- array of arrays of choices
 *
 ************************************************************************/

function GetProdChoices(oProd, elemChanged, bLoading) {
    if (!oProd.arrComps) // ignore products with no components mapped
    {
        return [];
    }
    var bSequentialDisable = false; // flag for clearing subsequent flags
    var arrProdChoices = new Array(oProd.arrComps.length); // create an array for each component
    for (var i = 0; i < oProd.arrComps.length; i++) // for each component
    {
        var oComp = oProd.arrComps[i];
        if (oComp.aA) // if component has attributes
        {
            arrProdChoices[i] = new Array(oComp.aA.length); // create an array for each attribute
            for (var n = 0; n < oComp.aA.length; n++) // for each attribute
            {
                var oAttr = oComp.aA[n];
                if (oAttr.nCC &&
                    oAttr.elem) // if attribute has choices and a UI element
                {
                    if (bLoading) // if we are loading
                    {
                        if (oComp.bOpt && oComp.bSelDef && // if this is optional and default
                            oAttr.elem.elemHTML.tagName == 'SPAN') // and using radio buttons
                        {
                            arrProdChoices[i][n] = 1; // select first valid option
                        } else {
                            arrProdChoices[i][n] = 0; // treat as Please select or first valid choice
                        }
                    } else {
                        var sAttrValue = GetAttributeValue(oAttr.elem.elemHTML); // get value from UI
                        var nAttrValue = (sAttrValue == '') ? 0 : parseInt(sAttrValue, 10);
                        //
                        // For sequential choices, any elements following a 'Please select' choice
                        // should also be changed to 'Please select'
                        //
                        // Also any choices following an element that has changed should be reset
                        //
                        if (oProd.bSequentialChoices) {
                            if (bSequentialDisable) // if we have already hit a please select
                            {
                                nAttrValue = 0; // change to Please select
                            } else if (nAttrValue == 0 || // if user chose please select
                                (elemChanged &&
                                    elemChanged.name == oAttr.elem.elemHTML.name)) // or they changed this choice
                            {
                                if (!oComp.bOpt ||
                                    IsCompEnabled(oComp, arrProdChoices[i])) // if this isn't an unselected optional component
                                {
                                    bSequentialDisable = true; // reset subsequent choices
                                }
                            }
                        }
                        arrProdChoices[i][n] = nAttrValue;
                    }
                }
            }
        }
    }
    return arrProdChoices;
}

/***********************************************************************
 *
 * UpdateCompChoices	- Update choices for a component
 *
 * Input: oProd			- product object
 *			oComp			- component object
 *			arrValues	- array of user choices for the component
 *			nStartIndex	- index into the choices array to start from
 *
 ************************************************************************/

function UpdateCompChoices(oProd, oComp, arrValues, nStartIndex, nEndIndex) {
    if (!oComp.aA) {
        return;
    }

    var arrAttr = oComp.aA;
    if (nEndIndex == undefined) {
        nEndIndex = arrAttr.length;
    }
    for (var nAttrIndex = nStartIndex; nAttrIndex < nEndIndex; nAttrIndex++) // for each attribute
    {
        var nUserChoiceCount = GetUserChoiceCount(arrValues);
        var oAttr = GetNormAttr(oComp, nAttrIndex); // get the attribute
        var sUserValue = arrValues[nAttrIndex] ? arrValues[nAttrIndex] : ''; // save user's choice
        if (oAttr.elem == undefined) {
            continue;
        }
        var oSelect = oAttr.elem;
        var elemSelect = oSelect.elemHTML; // get HTML element
        var arrOptions = oSelect.arrOptions; // get original options
        var sHTML = '';
        if (elemSelect.tagName == 'SELECT') {
            elemSelect.options.length = 0; // remove all options
        } else {
            sHTML = oSelect.arrHTMLFrag[0]; // start with leading HTML
        }
        var nOptIndex = 0;
        var nAdded = 0;
        var nSelIndex = -1;
        var nRBColCount = oAttr.nRBCCount; // get the column count if present
        var nOptionCount = arrOptions.length;
        var nValidChoiceCount = 0;
        var nFirstValidChoice = -1;
        var bOnlyOptionalChoiceAdded = false;
        for (var n = 0; n < nOptionCount; n++) {
            //
            // Note: Indexes into the arrFields structure defined by
            // how entries are added in function GetOptionsArray below.
            //
            var arrFields = arrOptions[n];
            var sOptValue = arrFields[0];
            arrValues[nAttrIndex] = sOptValue ? parseInt(sOptValue) : 0;
            var sText = arrOptions[n][1];
            var sClass = arrOptions[n][2];
            if ((n == 0 && sText == '') || // if Please select or
                IsValidOption(oComp, arrValues, nAttrIndex, nAttrIndex, nUserChoiceCount)) // this is valid?
            {
                if (n == 0 && arrValues[n] == 0) {
                    bOnlyOptionalChoiceAdded = true;
                } else {
                    bOnlyOptionalChoiceAdded = false;
                }
                nAdded++;
                if (sOptValue) // if this is a specific choice
                {
                    nValidChoiceCount++; // increment specific choice count
                    if (nValidChoiceCount == 1) // first valid specific choice?
                    {
                        nFirstValidChoice = arrValues[nAttrIndex]; // save it
                    }
                }
                if (elemSelect.tagName == 'SELECT') // select element?
                {
                    AddOption(elemSelect, sOptValue, sText, sOptValue == sUserValue, sClass); // just add the option
                } else {
                    var sSepHTML = oSelect.arrHTMLFrag[nOptIndex + 1]; // get trailing html fragment
                    if (nRBColCount > 1 && // more than 1 column?
                        (nAdded % nRBColCount) == 0 && // and it's the first column
                        n < arrOptions.length - 1) // but not last choice
                    {
                        sSepHTML = oSelect.arrHTMLFrag[nRBColCount]; // use the separator from the column
                    }
                    sHTML += sText + sSepHTML; // add the name plus trailing html
                }
            }
            nOptIndex++;
        }
        //
        // If we only have one valid choice, select it
        //
        if ((!oComp.bOpt || (arrAttr.length > 1)) &&
            nValidChoiceCount == 1) {
            sUserValue = nFirstValidChoice;
            SetAttributeValue(elemSelect, sUserValue);
            //
            // If this is not a user-specified choice, then we need to
            // update any unspecified choices to reflect the new value
            //
            arrValues[nAttrIndex] = nFirstValidChoice;
            if (nAttrIndex > nUserChoiceCount) {
                UpdateCompChoices(oProd, oComp, arrValues, nUserChoiceCount, nAttrIndex);
            }
        }
        //
        // Disable the Add to cart if no valid choices
        //	
        if ((nAdded == 0) || // no valid options?	
            bOnlyOptionalChoiceAdded) {
            if (!oComp.bOpt) // not an optional component?
            {
                oProd.bNoATC = true;
                var sProdRef = oProd.sProdRef.replace(/^\d+!/, '');
                var sOutOfStockID = 'EnableIfOutOfStock_' + sProdRef;
                var elemStock = document.getElementById(sOutOfStockID);
                if (elemStock) {
                    elemStock.style.display = '';
                    elemStock.style.visibility = 'visible';
                }

                elemStock = document.getElementById('RemoveIfOutOfStock_' + sProdRef);
                if (elemStock) {
                    elemStock.style.display = 'none';
                    elemStock.style.visibility = 'hidden';
                }

                elemStock = document.getElementById('RemoveIfOutOfStock_ATC_' + sProdRef);
                if (elemStock) {
                    elemStock.style.display = 'none';
                    elemStock.style.visibility = 'hidden';
                }
            }
            if (elemSelect.tagName == 'SELECT') {
                elemSelect.style.display = 'none';
                oComp.elemHTML.value = '';
                oComp.elemHTML.style.display = 'none';
                if (oComp.elemHTML.type == 'checkbox') {
                    oComp.elemHTML.checked = false;
                }
            } else {}
        }
        if (elemSelect.tagName != 'SELECT') {
            var elemContainer = document.getElementById('id' + elemSelect.name + '_Table');
            elemContainer.innerHTML = sHTML;
            SetAttributeValue(elemSelect, sUserValue);
        } else {
            if (elemSelect.selectedIndex == -1) {
                elemSelect.selectedIndex = 0;
            }
        }
        var sAttrValue = GetAttributeValue(elemSelect);
        arrValues[nAttrIndex] = sAttrValue == '' ? 0 : parseInt(sAttrValue, 10);
    }
}

/***********************************************************************
 *
 * GetPricePerm	- Get a price permutation for user's choices
 *
 * Input: arrValues	- array of user choices for the component
 *			mapPerms		- map of permutations for the component
 *
 ************************************************************************/

function GetPricePerm(arrValues, mapPerms) {
    if (!mapPerms) {
        return undefined;
    }
    if (mapPerms[arrValues]) // if we have a price object for these choices
    {
        return mapPerms[arrValues]; // return it
    }
    var arrTemp = Clone(arrValues); // copy the choices
    for (var i = 0; i < arrValues.length; i++) // now go through testing for 'Any' permutation
    {
        if (arrValues[i]) // if this isn't already 'Any'
        {
            arrTemp[i] = 0;
            if (mapPerms[arrTemp]) // if we have a permuation?
            {
                return mapPerms[arrTemp]; // found it
            }
            arrTemp[i] = arrValues[i]; // set back to user's choice
        }
    }
    return undefined;
}

/***********************************************************************
 *
 * IsValidOption	- Is this a valid choice for an attribute
 *
 * Input: oComp					- component object
 *			arrChoices			- array of choices for this component
 *			nAttrIndex			- index of the attribute being tested
 *			nTestIndex			- index of the attribute whose choices are being populated
 *			nUserChoiceCount	- number of choices the user has made
 *
 * Returns: boolean	- true if this is a valid choice
 *
 ************************************************************************/

function IsValidOption(oComp, arrChoices, nAttrIndex, nTestIndex, nUserChoiceCount) {
    if (oComp.nInvalidPermCount == 0) // if no invalid permutations
    {
        return true; // it's valid
    }

    var nUserChoice = arrChoices[nAttrIndex]; // save the choice
    if (nUserChoice > 0 && // if this is a specific choice
        oComp.nInvalidAnyCount == 0 && // and we have no invalid Any choice permutations 
        oComp.arrInvalidPerms[nAttrIndex][nUserChoice] == 0) // and there are no invalid permutations for this choice
    {
        return true; // must be valid
    }

    var bValid = !IsInvalidAnyChoice(oComp, arrChoices, nAttrIndex, 0);
    if (bValid) {
        if (nAttrIndex != nTestIndex && // if this isn't the attribute we are testing
            nAttrIndex > nUserChoiceCount - 1) // and the choice wasn't set by the user
        {
            var oAttr = GetNormAttr(oComp, nAttrIndex); // get the attribute for this choice
            var nValidCount = oAttr.nCC - 1; // initialise number of valid specific choices
            for (var i = 1; i < oAttr.nCC; i++) // for each choice
            {
                arrChoices[nAttrIndex] = i; // update choice array
                if (nAttrIndex < arrChoices.length - 1) // if we have more attributes
                {
                    if (!IsValidOption(oComp, arrChoices, nAttrIndex + 1, nTestIndex, nUserChoiceCount)) // test against the next attribute
                    {
                        nValidCount--;
                    }
                } else if (oComp.mapNormPerms[arrChoices] == -1 || // if this choice is invalid
                    (nAttrIndex > 0 &&
                        !HasValidPrevChoices(oComp, arrChoices, nTestIndex - 1, nTestIndex))) // or there are no valid previous choices
                {
                    nValidCount--;
                }
            }
            bValid = nValidCount > 0;
        } else if (nAttrIndex < arrChoices.length - 1) // if not last attribute
        {
            bValid = IsValidOption(oComp, arrChoices, nAttrIndex + 1, nTestIndex, nUserChoiceCount); // check against rest of attributes
        }
    }
    arrChoices[nAttrIndex] = nUserChoice; // restore user choice
    if (bValid && nAttrIndex > 0) // if not the first attribute
    {
        if (!HasValidPrevChoices(oComp, arrChoices, nTestIndex - 1, nTestIndex)) // check against previous choices
        {
            bValid = false;
        }
    }
    return bValid;
}

/***********************************************************************
 *
 * IsInvalidAnyChoice	- Is this a valid choice for an attribute
 *
 * Input: oComp	- component object
 *			arrChoices	- array of choices for this component
 *			nAttrIndex	- index of the attribute being tested
 *			nStartIndex	- index of the attribute to start testing against
 *
 * Returns: boolean	- true if this is a valid choice
 *
 ************************************************************************/

function IsInvalidAnyChoice(oComp, arrChoices, nAttrIndex, nStartIndex) {
    if (oComp.mapNormPerms[arrChoices] == -1) // is this set of choices invalid?
    {
        return true;
    }
    if (oComp.nInvalidAnyCount == 0) // if there are no Any choice invalid permutations
    {
        return false; // choice is valid
    }
    for (var i = nStartIndex; i < arrChoices.length; i++) {
        if (arrChoices[i] == 0) // if this is Please select
        {
            //
            // Count how many specific choices are valid
            //
            var nValidCount = oComp.aA[nAttrIndex].nCC - 1;
            for (var nChoice = 1; nChoice < nValidCount; nChoice++) {
                arrChoices[i] = nChoice;
                if (oComp.mapNormPerms[arrChoices] == -1) {
                    nValidCount--;
                }
            }
            arrChoices[i] = 0;
            if (nValidCount <= 0) {
                return true;
            }
        }

        if (i != nAttrIndex) // if this isn't the attribute being populated
        {
            var bInvalid = false;
            var nUserChoice = arrChoices[i];
            arrChoices[i] = 0; // test against Any choice
            if (oComp.mapNormPerms[arrChoices] == -1) {
                bInvalid = true;
            } else if (i < arrChoices.length - 1) // if it's not the first attribute
            {
                if (IsInvalidAnyChoice(oComp, arrChoices, nAttrIndex, i + 1)) // check against Any choice for preceding attributes
                {
                    bInvalid = true;
                }
            }
            arrChoices[i] = nUserChoice; // restore previous value
            if (bInvalid) {
                return true;
            }
        }
    }
    return false;
}

/***********************************************************************
 *
 * HasValidPrevChoices	- Is this choice compatible with any preceding choices
 *
 * Input: oComp			- component object
 *			arrChoices	- array of choices for this component
 *			nAttrIndex	- index of the attribute being tested
 *			nTestIndex	- index of the attribute whose choices are being populated
 *
 * Returns: boolean	- true if the choice specified by the attribute index is compatible the other choices
 *
 ************************************************************************/

function HasValidPrevChoices(oComp, arrChoices, nAttrIndex, nTestIndex) {
    if (nAttrIndex < 0) // no more attributes?
    {
        return true; // it must have choices
    }
    var bInvalid = false;
    var nUserChoice = arrChoices[nAttrIndex];
    arrChoices[nAttrIndex] = 0; // check against Any choice
    if (oComp.mapNormPerms[arrChoices] == -1) {
        bInvalid = true;
    } else {
        arrChoices[nAttrIndex] = nUserChoice; // restore user choice
        if (nUserChoice == 0) // if this is Please select
        {
            var oAttr = GetNormAttr(oComp, nAttrIndex); // get the attribute object
            //
            // Count how many specific choices are valid
            //
            var nValidCount = oAttr.nCC - 1;
            for (var i = 1; i < oAttr.nCC; i++) {
                arrChoices[nAttrIndex] = i;
                if (oComp.mapNormPerms[arrChoices] == -1) {
                    nValidCount--;
                } else {
                    if (nAttrIndex > 0 && // if it is not previous attribute
                        !HasValidPrevChoices(oComp, arrChoices, nAttrIndex - 1, nTestIndex)) // check against previous attributes
                    {
                        nValidCount--;
                    }
                }
            }
            arrChoices[nAttrIndex] = nUserChoice;
            bInvalid = nValidCount < 1;
        }
        //
        // Check against previous attributes
        //
        if (!bInvalid &&
            nAttrIndex > 0 &&
            !HasValidPrevChoices(oComp, arrChoices, nAttrIndex - 1, nTestIndex)) {
            bInvalid = true;
        }
    }
    arrChoices[nAttrIndex] = nUserChoice;
    if (!bInvalid &&
        nAttrIndex > 0) {
        //
        // Check against previous attributes
        //
        bInvalid = !HasValidPrevChoices(oComp, arrChoices, nAttrIndex - 1, nTestIndex);
    }
    return !bInvalid;
}

/***********************************************************************
 *
 * IsCompEnabled	- Is a component enabled
 *
 * Input: oComp				-	component object
 *			arrCompChoices	-	array of choices for this component
 *
 * Returns: boolean	- true if enabled
 *
 ************************************************************************/

function IsCompEnabled(oComp, arrCompChoices) {
    if (!oComp || !oComp.elemHTML) {
        return (false);
    }
    var elemComp = oComp.elemHTML;
    var bEnabled = (elemComp.value == 'on');
    if (elemComp.type == 'checkbox') // if this is optional controlled by a checkbox
    {
        return elemComp.checked; // test if it is checked
    }
    if (arrCompChoices == undefined) // if component has no choices
    {
        return bEnabled; // no need to check for choice of -1
    }
    return (bEnabled && (arrCompChoices[0] > -1)) // handle case where first select option has value of -1
}

/***********************************************************************
 *
 * ChoiceChanged	- User has changed their choices
 *
 * Input: elemChanged	-	HTML element that changed
 *
 ************************************************************************/

function ChoiceChanged(elemChanged, sURL, sSID, sShopID) {
    var sName = elemChanged.name; // get name of HTML element
    var sProdRef;
    if (sName.indexOf('v_') == 0) // got the name?
    {
        var collMatch = sName.match(/^v_(.*)_\d+$/); // product ref is between 'v_' and '_nn'
        sProdRef = collMatch[1];
    } else if (sName.indexOf('Q_') == 0) {
        sProdRef = sName.substr(2);
    }
    if (sProdRef) {
        if (!g_oConfig.bEstimateChoicePrices &&
            !ValidateChoices(sProdRef, true, elemChanged)) {
            ShowDynamicPriceMessage(sProdRef, g_sUndeterminedPrice);
        }
        var oProd = g_mapProds[sProdRef]; // get the product
        UpdateChoices(oProd, false, elemChanged); // update the choices available
        UpdatePrice(oProd, sURL, sSID, sShopID); // update the price
    }
}

/***********************************************************************
 *
 * ValidateChoices	- Make sure user has supplied all required info
 *
 * Input: sProdRef		-	product reference
 *			bSilent		-	true to suppress validation messages
 *			elemChanged	-	element that has changed
 *
 * Returns:	boolean	- true if OK
 *
 ************************************************************************/

function ValidateChoices(sProdRef, bSilent, elemChanged) {
    var oProd = g_mapProds[sProdRef]; // get the product
    if (!oProd || !oProd.arrComps) {
        return true;
    }
    var arrProdChoices = GetProdChoices(oProd, elemChanged); // get choices for this product
    for (var i = 0; i < oProd.arrComps.length; i++) // for each product
    {
        if (!arrProdChoices[i]) {
            continue;
        }
        var oComp = oProd.arrComps[i];
        if (IsCompEnabled(oComp, arrProdChoices[i]) && // if component is enabled
            !(oComp.bOpt && (oComp.aA.length == 1)) && // not an optional component with single attribute
            !ValidateComp(arrProdChoices[i], oComp.aA, bSilent)) // and the component doesn't have all selections
        {
            return false; // bomb out
        }
    }
    return true; // must be valid
}

/***********************************************************************
 *
 * ValidateComp	- Validate the choices for a component
 *
 * Input: arrCompChoices	- array of choices for a component
 *			arrAttr			- array of attributes
 *
 * Returns:	boolean	- true if OK
 *
 ************************************************************************/

function ValidateComp(arrCompChoices, arrAttr, bSilent) {
    for (var i = 0; i < arrCompChoices.length; i++) // for each choice
    {
        if (!arrCompChoices[i]) // valid choices are greater than 0 or -1 (for optional components)
        {
            if (!bSilent) {
                var sMsg = 'Please select a ' + arrAttr[i].sN;
                var elemHTML = arrAttr[i].elem.elemHTML;
                alert(sMsg);
                //
                // There is an IE issue with the DOM thinking the span enclosing a radio button as empty even though it isn't.
                // To get around this, get the name from the span id and derive the name from that and just select
                // the first element in the collection.
                //
                if (elemHTML.tagName != 'SELECT') {
                    var sFocusName = elemHTML.id.replace(/(_(\d+|))$/, ''); // get the name attribute of the element to focus
                    var collNamed = document.getElementsByName(sFocusName); // get the collection
                    if (collNamed.length > 0) {
                        elemHTML = collNamed[0]; // set focus to first element
                    }
                }
                elemHTML.focus();
            }
            return false; // need more info
        }
    }
    return true; // must be OK
}

/***********************************************************************
 *
 * UpdatePrice	- Update the price for a product
 *
 * Input: oProd	- product object
 *
 ************************************************************************/

function UpdatePrice(oProd, sURL, sSID, sShopID) {
    if (!oProd || oProd.bFixPrice || oProd.bNoATC || !sURL) // skip if no product, not dynamic pricing or no valid choices
    {
        return;
    }
    var elemTaxIncPrice =
        document.getElementById('id' + oProd.sProdRef + 'TaxIncPrice'); // get tax inclusive element
    var elemTaxExcPrice =
        document.getElementById('id' + oProd.sProdRef + 'TaxExcPrice'); // get tax exclusive element
    var elemAccPrice = document.getElementById('id' + oProd.sProdRef + 'AccountPrice'); // account price placeholder
    if (!elemTaxIncPrice && !elemTaxExcPrice && !elemAccPrice) // neither present?
    {
        return; // nothing to do
    }
    var elemTaxMsg =
        document.getElementById('id' + oProd.sProdRef + 'VATMsg'); // get the tax message element (e.g Including VAT at 20%)
    //
    // Display the price html
    //
    var elemPriceContainer = document.getElementById('id' + oProd.sProdRef + 'DynamicPrice');
    var elemStPriceContainer = document.getElementById('id' + oProd.sProdRef + 'StaticPrice');
    if (oProd.bOvrStaticPrice &&
        elemStPriceContainer &&
        !oProd.bQuantityBreak) {
        elemStPriceContainer.style.visibility = "hidden";
        elemStPriceContainer.style.display = "none";
    }
    var sOriginalRef = GetOriginalRef(oProd.sProdRef);
    if (!g_mapDynPrices[sOriginalRef] &&
        !g_mapDynPrices.ErrorMsg) {
        getDynamicAccPrice(sURL, sSID, oProd, sShopID); // calculate account prices dynamically
    } else {
        if (g_mapDynPrices.ErrorMsg ||
            g_mapDynPrices[sOriginalRef].ErrorMsg) // is there an error
        {
            if (elemTaxMsg) // make sure we have an element
            {
                elemTaxMsg.style.visibility = "hidden";
                elemTaxMsg.style.display = "none";
            }
            if (elemTaxExcPrice) // display the error message instead of the price
            {
                elemTaxExcPrice.innerHTML = g_mapDynPrices.ErrorMsg ? g_mapDynPrices.ErrorMsg : g_mapDynPrices[sOriginalRef].ErrorMsg;
            } else if (elemTaxIncPrice) {
                elemTaxIncPrice.innerHTML = g_mapDynPrices.ErrorMsg ? g_mapDynPrices.ErrorMsg : g_mapDynPrices[sOriginalRef].ErrorMsg;
            }
            if (elemPriceContainer) {
                elemPriceContainer.style.display = '';
                elemPriceContainer.style.visibility = 'visible';
            }
            return;
        }
        if (elemTaxMsg) // make sure we have an element
        {
            elemTaxMsg.style.visibility = "visible";
            elemTaxMsg.style.display = "";
        }
        var nTotalExcTax = g_mapDynPrices[sOriginalRef].Total;
        var nTotalIncTax = g_mapDynPrices[sOriginalRef].Total +
            g_mapDynPrices[sOriginalRef].Tax1 +
            g_mapDynPrices[sOriginalRef].Tax2;
        if (elemTaxExcPrice) {
            elemTaxExcPrice.innerHTML = FormatPrices(nTotalExcTax);
        }
        if (elemTaxIncPrice) {
            elemTaxIncPrice.innerHTML = FormatPrices(nTotalIncTax);
        }
    }
    if (elemPriceContainer) {
        elemPriceContainer.style.display = '';
        elemPriceContainer.style.visibility = 'visible';
    }
}

/***********************************************************************
 *
 * FormatPrices	-	Format main and alternate currency prices
 *
 * Input: nPrice	- price to format
 *
 * Returns:	String	- formatted price or prices
 *
 ************************************************************************/

function FormatPrices(nPrice) {
    var arrPrices = [];
    for (var i = 0; i < g_oConfig.arrCurrs.length; i++) {
        var oCurr = g_oConfig.arrCurrs[i];
        arrPrices.push(FormatPrice(nPrice, oCurr));
    }
    if (arrPrices.length == 1) {
        return arrPrices[0];
    } else {
        return Sprintf(g_oConfig.sPriceFmt, arrPrices[0], arrPrices[1]);
    }
}

/***********************************************************************
 *
 * ZeroPad	-	Returns a zero-padded number
 *
 * Input: nValue	- number to pad if necessary
 *			nLength	- length to pad to
 *
 * Returns:	String	- 0-padded number
 *
 ************************************************************************/

function ZeroPad(nValue, nLength) {
    var sZeros = '000000000000000';
    var sValue = nValue.toString();
    if (sValue.length < nLength) {
        sValue = sZeros.substr(0, nLength - sValue.length) + sValue;
    }
    return sValue;
}

/***********************************************************************
 *
 * FormatPrice	-	Format a currency price
 *
 * Input: nPrice	- price to format
 *			oCurr		- currency object
 *
 * Returns:	String	- formatted price
 *
 ************************************************************************/

function FormatPrice(nPrice, oCurr) {
    var dRate = parseFloat(oCurr.sRate);
    var nCurrPrice = Math.round(nPrice * dRate);
    var nDecsFactor = Math.pow(10, oCurr.nDecs);
    var nThousFactor = Math.pow(10, oCurr.nThous);
    var sPrice = '';
    var nTempPrice = nCurrPrice;
    if (nDecsFactor > 1) {
        var nDecPrice = nTempPrice % nDecsFactor;
        sPrice = oCurr.sDecSep + ZeroPad(nDecPrice, oCurr.nDecs);
        nTempPrice = parseInt(nTempPrice / nDecsFactor);
    }
    if (nTempPrice == 0) {
        sPrice = '0' + sPrice;
    } else {
        while (nTempPrice) {
            var nThous = nTempPrice % nThousFactor;
            nTempPrice = parseInt(nTempPrice / nThousFactor);
            if (nTempPrice) {
                sPrice = oCurr.sThouSep + ZeroPad(nThous, oCurr.nThous) + sPrice;
            } else {
                sPrice = nThous.toString() + sPrice;
            }
        }
    }
    return oCurr.sSym + sPrice;
}

/************************************************************************
 *
 * GetTaxRate	- Get tax rate from percentage
 *
 * Input:	sTaxRate	- tax rate as percentage
 *
 * Returns:	tax rate as fraction
 *
 ************************************************************************/

function GetTaxRate(sTaxRate) {
    return sTaxRate / 100;
}

/************************************************************************
 *
 * AddOption	- Add an option to a select element
 *
 * Input:	elemSelect	- select element
 *			sValue		- value
 *			sText			- text
 *			bSelected	- selected or not
 *			sClass		- class name
 *
 * Returns:	option element
 *
 ************************************************************************/

function AddOption(elemSelect, sValue, sText, bSelected, sClass) {
    var oOption = document.createElement("OPTION"); // create an option
    oOption.text = sText; // set text
    oOption.value = sValue; // set value
    if (bSelected) {
        oOption.selected = true;
    }
    oOption.className = sClass;
    elemSelect.options.add(oOption); // add option to select element
    return oOption;
}

/************************************************************************
 *
 * CSelect	- Object encapsulating the UI for choices
 *
 * Input:	elemHTML	- HTML element
 *
 ************************************************************************/

function CSelect(elemHTML) {
    this.elemHTML = elemHTML;
    if (elemHTML.tagName == 'SELECT') {
        this.arrOptions = GetOptionsArray(elemHTML);
        this.sValue = elemHTML.value;
    } else {
        this.arrOptions = GetOptionsArray(elemHTML, this);
    }
}

/************************************************************************
 *
 * GetOptionsArray	- Get options array
 *
 * Input:	elemSelect	- HTML element
 *			oSelect		- select object if choices are not a dropdown
 *
 * Returns:	array of arrays containing value, text and class name
 *
 ************************************************************************/

function GetOptionsArray(elemSelect, oSelect) {
    var arrOptions = [];
    if (elemSelect.tagName == 'SELECT') {
        //
        // Just go through the option of a select element
        //
        for (var i = 0; i < elemSelect.options.length; i++) {
            var elemOption = elemSelect.options[i];
            var arrData = [elemOption.value, elemOption.text, elemOption.className]; // these are accessed in function UpdateCompChoices above
            arrOptions.push(arrData);
        }
    } else {
        //
        // Radio buttons have the text as a separate element so we need to extract it from surrounding span
        //
        var elemContainer = document.getElementById('id' + elemSelect.name + '_Table');
        if (elemContainer) {
            var sHTML = elemContainer.innerHTML; // get the inner HTML
            var arrHTML = []; // set up an array of HTML fragments between attribute spans
            var collNames = document.getElementsByName(elemSelect.name); // get all elements with this name
            var nStart = 0;
            var nIndex = 0;
            for (var i = 0; i < collNames.length; i++) // go through the elements
            {
                var elemName = collNames[i];
                var sValue = elemName.value; // get the value
                var sClass = elemName.className;
                var sSpanID = elemSelect.name + '_' + sValue; // construct id of the span
                var elemSpan = document.getElementById(sSpanID);
                var sSpanHTML = elemSpan.outerHTML; // get whole HTML for the span
                if (!sSpanHTML) // outerHTML isn't supported universally
                {
                    var nIDStart = sHTML.indexOf(elemSpan.id); // find the start of the id
                    var nSpanStart = sHTML.lastIndexOf('<', nIDStart); // find start of the tag
                    var nSpanEnd = sHTML.indexOf('>',
                        nSpanStart + elemSpan.innerHTML.length); // find end of the tag
                    sSpanHTML = sHTML.substring(nSpanStart, nSpanEnd + 1);
                }
                arrOptions.push([sValue, sSpanHTML, sClass]); // add to the options array. These are accessed in function UpdateCompChoices above
                nIndex = sHTML.indexOf(sSpanHTML, nStart);
                arrHTML.push(sHTML.substring(nStart, nIndex)); // add the HTML before the span
                nStart = nIndex + sSpanHTML.length;
            }
            arrHTML.push(sHTML.substr(nStart)); // add any trailing HTML
            oSelect.arrHTMLFrag = arrHTML; // save to the select object
        }
    }
    return arrOptions;
}

/************************************************************************
 *
 * GetChoiceValues	- Get choice values selected by user
 *
 * Input:	elemForm	- form element
 *
 * Returns:	array of numeric values
 *
 ************************************************************************/

function GetChoiceValues(elemForm) {
    var arrValues = [];
    var arrElemAttr = GetAttributes(elemForm);
    for (var i = 0; i < arrElemAttr.length; i++) {
        var sAttrValue = GetAttributeValue(arrElemAttr[i]);
        var nAttrValue = (sAttrValue == '') ? 0 : parseInt(sAttrValue, 10);
        arrValues.push(nAttrValue);
    }
    return arrValues;
}

var reProdRefName = /^v_(.*)_\d+$/;
var reProdRefID = /^v_(.*)_\d+_\d+$/;

/************************************************************************
 *
 * GetProdRefFromElem	- Get product reference from an element
 *
 * Input:	elemHTML	- HTML element
 *
 * Returns:	product ref or empty string
 *
 ************************************************************************/

function GetProdRefFromElem(elemHTML) {
    var sName = elemHTML.name;
    if (!sName) {
        var oMatch = elemHTML.id.match(reProdRefID); // try and get prod ref from the ID attribute
        if (oMatch) {
            return oMatch[1];
        }
    }
    if (sName) {
        var oMatch = sName.match(reProdRefName); // try and get prod ref from name attribute
        if (oMatch) {
            return oMatch[1];
        }
    }
    return '';
}

var reAttr = /\bajs-attr\b/;

/************************************************************************
 *
 * GetAttributes	- Get attributes from a form
 *
 * Input:	elemForm	- form element
 *
 * Returns:	map of attributes keyed by prod refs
 *
 ************************************************************************/

function GetAttributes(elemForm) {
    var mapAttrElems = {};
    var mapRadioAttrElems = {};
    var arrAll = GetAllElements(elemForm);
    for (var i = 0; i < arrAll.length; i++) // go through all elements in the form
    {
        var elemHTML = arrAll[i];
        if (reAttr.test(elemHTML.className)) // does it have ajs-attr in class name
        {
            var sProdRef = GetProdRefFromElem(elemHTML); // get product reference
            if (!mapAttrElems[sProdRef]) // first for this ref?
            {
                mapAttrElems[sProdRef] = []; // create a map
            }
            if (elemHTML.tagName == 'SELECT') {
                mapAttrElems[sProdRef].push(elemHTML); // just add a select element
            } else {
                var sName = elemHTML.id.replace(/_\d+$/, ''); // derive name from id
                elemHTML.name = sName;
                if (!mapRadioAttrElems[sName]) // only add the first radio button with this name
                {
                    mapRadioAttrElems[sName] = elemHTML;
                    mapAttrElems[sProdRef].push(elemHTML);
                }
            }
        }
    }
    return mapAttrElems; // return our map
}

/************************************************************************
 *
 * GetAttributeValue	- Get an attribute value
 *
 * Input:	elemSelAttr	- element associated with an attribute
 *
 * Returns:	value HTML attribute associated with an attribute
 *
 ************************************************************************/

function GetAttributeValue(elemSelAttr) {
    if (elemSelAttr.tagName == 'SELECT') {
        return elemSelAttr.value;
    }
    var collSel = document.getElementsByName(elemSelAttr.name);
    for (var i = 0; i < collSel.length; i++) {
        if (collSel[i].checked) {
            return collSel[i].value;
        }
    }
    return 0;
}

/************************************************************************
 *
 * SetAttributeValue	- Set an attribute value
 *
 * Input:	elemSelAttr	- element associated with an attribute
 *			sValue		- value to set
 *
 ************************************************************************/

function SetAttributeValue(elemSelAttr, sValue) {
    if (elemSelAttr.tagName == 'SELECT') {
        elemSelAttr.value = sValue;
        return (elemSelAttr.value == sValue);
    }
    var collSel = document.getElementsByName(elemSelAttr.name);
    for (var i = 0; i < collSel.length; i++) {
        if (collSel[i].value == sValue) {
            collSel[i].checked = true;
            return true;
        }
    }
    if (collSel.length > 0)
        collSel[0].checked = true;
    return false;
}

/************************************************************************
 *
 * Clone	- Clone an array
 *
 * Input:	arrSource	- array to copy
 *
 * Returns:	copy of the array
 *
 ************************************************************************/

function Clone(arrSource) {
    var arrReturn = new Array(arrSource.length);
    for (var i = 0; i < arrSource.length; i++) {
        arrReturn[i] = arrSource[i];
    }
    return arrReturn;
}

/***********************************************************************
 *
 * QuantityTimer	- User has changed the quantity - timer fires
 *
 * Input: elemChanged	-	HTML element that changed
 *
 ************************************************************************/

function QuantityTimer(elemChanged, sURL, sSID, sShopID) {
    var sName = elemChanged.name; // get name of HTML element
    if (sName.indexOf('Q_') == 0) {
        sProdRef = sName.substr(2);
    }
    if (sProdRef) {
        var oProd = g_mapProds[sProdRef]; // get the product
        if (!g_oConfig.bEstimateChoicePrices &&
            !ValidateChoices(sProdRef, true, elemChanged)) {
            var elemPriceContainer = document.getElementById('id' + sProdRef + 'DynamicPrice');
            var elemStPriceContainer = document.getElementById('id' + sProdRef + 'StaticPrice');
            if (oProd.bOvrStaticPrice &&
                elemPriceContainer &&
                elemPriceContainer.style.display == "none") {
                if (elemStPriceContainer &&
                    !oProd.bQuantityBreak) {
                    elemStPriceContainer.style.visibility = "hidden";
                    elemStPriceContainer.style.display = "none";
                }
                elemPriceContainer.style.display = '';
                elemPriceContainer.style.visibility = 'visible';
            }
            ShowDynamicPriceMessage(sProdRef, g_sUndeterminedPrice);
            return;
        }
        if (oProd.arrComps) // if we have components
        {
            UpdateChoices(oProd, false, elemChanged); // update the choices available
        }
        UpdatePrice(oProd, sURL, sSID, sShopID); // update the price
    }
}

/***********************************************************************
 *
 * QuantityChanged	- User has changed the quantity
 *
 * Input: elemChanged	-	HTML element that changed
 *
 ************************************************************************/

function QuantityChanged(elemChanged, sURL, sSID, sShopID) {
    if (timeout) {
        clearTimeout(timeout); // reset
        timeout = null;
    }
    timeout = setTimeout(function() {
        QuantityTimer(elemChanged, sURL, sSID, sShopID)
    }, g_nTimeout);
}

/***********************************************************************
 *
 * ShowDynamicPriceMessage	- Update the dynamic price with an
 *	infomation/error message
 *
 * Input: sProdRef - the product reference
 *			sMsg		- the message
 *
 ************************************************************************/

function ShowDynamicPriceMessage(sProdRef, sMsg) {
    var elemTaxIncPrice =
        document.getElementById('id' + sProdRef + 'TaxIncPrice'); // get tax inclusive element
    var elemTaxExcPrice =
        document.getElementById('id' + sProdRef + 'TaxExcPrice'); // get tax exclusive element	
    var elemTaxMsg =
        document.getElementById('id' + sProdRef + 'VATMsg'); // get the tax message element (e.g Including VAT at 20%)
    if (elemTaxMsg) // might be hidden if dynamic prices turned off
    {
        elemTaxMsg.style.visibility = "hidden";
        elemTaxMsg.style.display = "none";
    }
    if (elemTaxIncPrice && elemTaxExcPrice) {
        elemTaxIncPrice.innerHTML = '';
        elemTaxExcPrice.innerHTML = sMsg;
    } else if (elemTaxIncPrice) {
        elemTaxIncPrice.innerHTML = sMsg;
    } else if (elemTaxExcPrice) {
        elemTaxExcPrice.innerHTML = sMsg;
    }
}

/************************************************************************
 *
 * GetChangedElemIndices	- Get the indices of component and attribute corresponding to an html element
 *
 * Input:	oProd			- product object
 *			elemChanged	- changed element
 *
 * Returns:	undefined if not found, otherwise an object with nCompIndex and nAttrIndex properties
 *
 ************************************************************************/

function GetChangedElemIndices(oProd, elemChanged) {
    if (!elemChanged || // if there's no changed element
        !oProd.arrComps) // or no components
    {
        return; // bomb out
    }
    for (var nCompIndex = 0; nCompIndex < oProd.arrComps.length; nCompIndex++) // for each component
    {
        var oComp = oProd.arrComps[nCompIndex];
        if (!oComp.aA) // skip components with no attributes
        {
            continue;
        }
        for (var nAttrIndex = 0; nAttrIndex < oComp.aA.length; nAttrIndex++) // for each attribute
        {
            var oAttr = oComp.aA[nAttrIndex];
            if (elemChanged.tagName == 'SELECT') {
                if (oAttr.elem.elemHTML == elemChanged) // is this the changed attribute?
                {
                    return {
                        nCompIndex: nCompIndex,
                        nAttrIndex: nAttrIndex
                    }; // return indices
                }
            } else if (elemChanged.tagName == 'INPUT' &&
                elemChanged.type == 'radio') {
                if (oAttr.elem.elemHTML.name == elemChanged.name) {
                    return {
                        nCompIndex: nCompIndex,
                        nAttrIndex: nAttrIndex
                    }; // return indices
                }
            }
        }
    }
}

/************************************************************************
 *
 * CloneArray	- Make a copy of an array
 *
 * Input:	arrSrc	- array to copy
 *
 * Returns:	Array	- copy of the array
 *
 ************************************************************************/

function CloneArray(arrSrc) {
    var arrClone = new Array(arrSrc.length);
    for (var i = 0; i < arrSrc.length; i++) {
        arrClone[i] = arrSrc[i];
    }
    return arrClone;
}

/************************************************************************
 *
 * UpdateUserSequence	- Keep track of the order choices have been made
 *
 * Input:	oComp					- component object
 *			nChangedAttrIndex	- index of changed attribute 
 *			arrCompChoices		- array of user choices
 *
 ************************************************************************/

function UpdateUserSequence(oComp, nChangedAttrIndex, arrCompChoices) {
    var arrUserSeq = oComp.arrUserSeq;
    var nChangedValue = arrCompChoices[nChangedAttrIndex]; // save changed choice
    for (var i = 0; i < arrUserSeq.length; i++) {
        if (arrUserSeq[i] == nChangedAttrIndex) // if this is the changed attribute
        {
            arrUserSeq.splice(i, 1); // remove it from the sequence
            break;
        }
    }
    if (nChangedValue > 0) // if the changed choice wasn't to Please select
    {
        arrUserSeq.push(nChangedAttrIndex); // add to end of user choices
    }
}

/************************************************************************
 *
 * NormaliseAttrSeq	- Normalise the attribute sequence
 *
 * Populate an array so that the sequence of choices the user has made
 * can be tracked to the actual attribute
 *
 * Input:	oComp	- component object
 *
 ************************************************************************/

function NormaliseAttrSeq(oComp) {
    if (!oComp.aA) {
        return;
    }
    //
    // The sequence of attribute indices will be user-specified user choices
    // with the most recent last followed by any other unspecified choices
    //
    var arrNormAttrSeq = [];
    var mapUsed = {};
    //
    // Add user-selected choices
    //
    for (var i = 0; i < oComp.arrUserSeq.length; i++) {
        var nAttrIndex = oComp.arrUserSeq[i];
        mapUsed[nAttrIndex] = 1;
        arrNormAttrSeq.push(nAttrIndex);
    }
    //
    // Add unspecified choices
    //
    for (var i = 0; i < oComp.aA.length; i++) {
        if (!mapUsed[i]) {
            arrNormAttrSeq.push(i);
        }
    }
    oComp.arrNormAttrSeq = arrNormAttrSeq;
}

/************************************************************************
 *
 * NormaliseUserChoices	- Change the order of user choices to reflect the
 *		order the user made them
 *
 * Input:	oComp				- component object
 *			arrCompChoices	- index of choices in source code order
 *
 * Returns:	Array	- user choices in order the user made them
 *
 ************************************************************************/

function NormaliseUserChoices(oComp, arrCompChoices) {
    var arrNormChoices = [];
    for (var i = 0; i < oComp.arrNormAttrSeq.length; i++) {
        var nAttrIndex = oComp.arrNormAttrSeq[i];
        arrNormChoices.push(arrCompChoices[nAttrIndex]);
    }
    return arrNormChoices;
}

/************************************************************************
 *
 * GetNormAttr	- Get an attribute object from the index of the user choice
 *
 * Input:	oComp			- component object
 *			nNormIndex	- index of the attribute adjusted for the sequence of choices made
 *
 * Returns:	Object	- attribute object
 *
 ************************************************************************/

function GetNormAttr(oComp, nNormIndex) {
    var nRealAttrIndex = oComp.arrNormAttrSeq[nNormIndex];
    return oComp.aA[nRealAttrIndex];
}

/************************************************************************
 *
 * MapInvalidPermutations	- Check how many invalid permutations there are 
 *	and transfer invalid permuations to a new map
 *
 * Input:	oComp	- component object
 *
 ************************************************************************/

function MapInvalidPermutations(oComp) {
    oComp.nInvalidPermCount = 0;
    if (!oComp.mP) {
        return;
    }
    var mapInvalid = {};
    var mapPerms = oComp.mP;
    var bHideOutOfStock = oComp.hOS;
    for (var sKey in mapPerms) {
        var arrAssocDetails = mapPerms[sKey];
        if ((arrAssocDetails[0] == -1) || // permutation invalid?
            ((arrAssocDetails[0] == 0) && // permutation valid?
                (bHideOutOfStock && arrAssocDetails[1] != '') && // hide out of stock
                (g_mapStockByRef[arrAssocDetails[1]] != undefined && // if we have a stock
                    g_mapStockByRef[arrAssocDetails[1]] <= 0))) // out of stock
        {
            mapInvalid[sKey] = -1;
            oComp.nInvalidPermCount++;
        }
    }
    oComp.mapInvalid = mapInvalid;
}

/************************************************************************
 *
 * NormalisePerms	- Remap invalid permutations so they are keyed by user choice sequence
 *
 * Input:	oComp	- component object
 *
 ************************************************************************/

function NormalisePerms(oComp) {
    var mapNormPerms = {};
    var mapPerms = oComp.mapInvalid;
    for (var sKey in mapPerms) {
        if (oComp.aA.length == 1) // single attribute?
        {
            mapNormPerms[sKey] = -1; // use existing key
        } else {
            var arrValues = sKey.split(',');
            var arrIndices = [];
            for (var i = 0; i < oComp.arrNormAttrSeq.length; i++) {
                var nAttrIndex = oComp.arrNormAttrSeq[i];
                arrIndices.push(arrValues[nAttrIndex]);
            }
            mapNormPerms[arrIndices] = -1;
        }
    }
    oComp.mapNormPerms = mapNormPerms;
    GetInvalidAttrCounts(oComp);
}

/************************************************************************
 *
 * GetInvalidAttrCounts	- Calculate how many invalid permutations specify
 *		a specific choice
 *
 * Input:	oComp			- component object
 *
 ************************************************************************/

function GetInvalidAttrCounts(oComp) {
    oComp.nInvalidAnyCount = 0;
    //
    // Create the array of attributes with each choice set to 0
    //
    var arrInvalidPerms = new Array(oComp.aA.length);
    for (var nAttr = 0; nAttr < arrInvalidPerms.length; nAttr++) {
        var oAttr = GetNormAttr(oComp, nAttr);
        var nChoiceCount = oAttr.nCC
        var arrChoices = new Array(nChoiceCount);
        for (var i = 0; i < nChoiceCount; i++) {
            arrChoices[i] = 0;
        }
        arrInvalidPerms[nAttr] = arrChoices;
    }
    //
    // Update the counts for each specific choice
    //
    for (var sKey in oComp.mapNormPerms) {
        var arrVals = sKey.split(',');
        for (var nAttr = 0; nAttr < arrVals.length; nAttr++) // for each value
        {
            var arrInvalidAttrPerms = arrInvalidPerms[nAttr]; // get the attribute array
            var nVal = arrVals[nAttr]; // get choice value
            if (nVal != 0) {
                arrInvalidAttrPerms[nVal]++; // increment specific choice count
            } else {
                oComp.nInvalidAnyCount++; // increment global any choice count
            }
        }
    }
    oComp.arrInvalidPerms = arrInvalidPerms;
}

/************************************************************************
 *
 * GetUserChoiceCount	- Get how many specific choices there are
 *
 * Input:	arrUserChoices		- array of user choices
 *
 ************************************************************************/

function GetUserChoiceCount(arrUserChoices) {
    var nCount = 0;
    for (var i = 0; i < arrUserChoices.length; i++) {
        if (arrUserChoices[i] != 0) // not Please select?
        {
            nCount++; // increment count
        }
    }
    return nCount;
}