/***************************************************************
 * 
 * ActinicCore.js	-	core utility functions
 *
 * Copyright (c) 2014 SellerDeck Limited
 *
 ****************************************************************/

var bPageIsLoaded = false;

/***********************************************************************
 *
 * setCookie -	Generic Set Cookie routine
 *
 * Input: sName	 -	Name of cookie to create
 *	 sValue	 -	Value to assign to the cookie
 *	 sExpire -	Cookie expiry date/time (optional)
 *
 * Returns: null
 *
 ************************************************************************/

function setCookie(sName, sValue, sExpire) {
    var sCookie = sName + "=" + escape(sValue) + "; path=/"; // construct the cookie
    if (sExpire) {
        sCookie += "; expires=" + sExpire.toGMTString(); // add expiry date if present
    }
    document.cookie = sCookie; // store the cookie
    return null;
}

/***********************************************************************
 *
 * getCookie	-	Generic Get Cookie routine
 *
 * Input: sName	-	Name of cookie to retrieve
 *
 * Returns:		Requested cookie or null if not found
 *
 ************************************************************************/

function getCookie(sName) {
    var sCookiecrumbs = document.cookie.split("; "); // break cookie into crumbs array
    var sNextcrumb
    for (var i = 0; i < sCookiecrumbs.length; i++) {
        sNextcrumb = sCookiecrumbs[i].split("="); // break into name and value
        if (sNextcrumb[0] == sName) // if name matches
        {
            return unescape(sNextcrumb[1]); // return value
        }
    }
    return null;
}

/***********************************************************************
 *
 * saveReferrer -	Saves the referrer to a Cookie
 *
 * Input: 		nothing
 *
 * Returns:		null
 *
 ************************************************************************/

function saveReferrer() {
    if (window.name == 'ActPopup') return; // don't save if on popup page
    var bSetCookie = false;
    if (parent.frames.length == 0) // No FrameSet
    {
        bSetCookie = true;
    } else // FrameSet in use
    {
        var bCatalogFrameSet = false;
        for (var nFrameId = parent.frames.length; nFrameId > 0; nFrameId--) {
            if (parent.frames[nFrameId - 1].name == 'CatalogBody') // Catalog FrameSet used
            {
                bCatalogFrameSet = true;
                break;
            }
        }
        if (bCatalogFrameSet) // Catalog FrameSet
        {
            if (window.name == 'CatalogBody') // and this is the CatalogBody frame
            {
                bSetCookie = true;
            }
        } else // Not Catalog FrameSet
        {
            bSetCookie = true;
        }
    }
    if (bSetCookie) {
        var sUrl = document.URL;
        var nHashPos = sUrl.lastIndexOf("#"); // Look for URL anchor
        var nSIDHashPos = sUrl.lastIndexOf("#SID="); // Look for URL with SID anchor
        if (nHashPos > 0 && nSIDHashPos == -1) // if it exists
        {
            sUrl = sUrl.substring(0, nHashPos); // then remove it
        }
        setCookie("ACTINIC_REFERRER", sUrl); // Emulates HTTP_REFERER
    }
    return null;
}

/***********************************************************************
 *
 * CreateArray	creates an array with n elements
 *
 * Input: n	-	number of elements
 *
 * Returns:		the created array
 *
 ************************************************************************/

function CreateArray(n) {
    this.length = n;
    for (var i = 1; i <= n; i++) // for all ns
    {
        this[i] = new Section(); // create a section structure
    }
    return this; // return the created array
}

/***********************************************************************
 *
 * Section	-	creates the section structure for raw section lists
 *
 * Input: 				nothing
 *
 * Returns:				nothing
 ************************************************************************/

function Section() {
    this.sURL = null;
    this.sName = null;
    this.sImage = null;
    this.nImageWidth = null;
    this.nImageHeight = null;
    this.nSectionId = null;
    this.pChild = null;
}

/***********************************************************************
 *
 * SwapImage			-	swaps an image to the alternative
 *
 * Input:	sName		-	name of the image
 *
 *			sAltImage	-	filename of the alternative image
 *
 ************************************************************************/

function SwapImage(sName, sAltImage) {
    var nCount = 0;
    document.aSource = new Array; // array for images
    if (document[sName] != null) // if image name exists
    {
        document.aSource[nCount++] = document[sName]; // store image
        if (null == document[sName].sOldSrc) {
            document[sName].sOldSrc = document[sName].src; // store image source
        }
        document[sName].src = sAltImage; // change image source to alternative
    }
}

/***********************************************************************
 *
 * RestoreImage		-	restores an image to the original
 *
 * Input: 				nothing
 *
 * Returns:				nothing
 ************************************************************************/

function RestoreImage() {
    var nCount, aSource = document.aSource;
    if (aSource != null) // if array of images exists
    {
        for (nCount = 0; nCount < aSource.length; nCount++) // restore all images
        {
            if ((aSource[nCount] != null) &&
                (aSource[nCount].sOldSrc != null)) // if we stored something for this image
            {
                aSource[nCount].src = aSource[nCount].sOldSrc; // restore the original image
            }
        }
    }
}

/***********************************************************************
 *
 * PreloadImages		-	restores an image to the original
 *
 * Input: 				nothing
 *
 * Returns:				nothing
 *
 ************************************************************************/

function PreloadImages() {
    bPageIsLoaded = true;
    if (document.images) {
        if (!document.Preloaded) // preload array defined?
        {
            document.Preloaded = new Array(); // no, define it
        }
        var nCounter, nLen = document.Preloaded.length,
            saArguments = PreloadImages.arguments;
        for (nCounter = 0; nCounter < saArguments.length; nCounter++) // iterate through arguments
        {
            document.Preloaded[nLen] = new Image;
            document.Preloaded[nLen++].src = saArguments[nCounter];
        }
    }
}

/***********************************************************************
 *
 * ShowPopUp		-	creates pop up window
 *
 * Input: sUrl		-	URL of page to display
 *			nWidth	-	Width of window
 *			nHeight	-	Height of window
 *
 * Returns:				nothing
 *
 ************************************************************************/

function ShowPopUp(sUrl, nWidth, nHeight) {
    if (sUrl.indexOf("http") != 0 &&
        sUrl.indexOf("/") != 0) {
        var sBaseHref = GetDocumentBaseHref();
        sUrl = sBaseHref + sUrl;
    }
    window.open(sUrl, 'ActPopup', 'width=' + nWidth + ',height=' + nHeight + ',scrollbars, resizable');
    if (!bPageIsLoaded) {
        window.location.reload(true);
    }
    return false;
}

/***********************************************************************
 *
 * GetDocumentBaseHref	- Returns the href for the <base> element if it is defined
 *
 * Returns:	base href if defined or empty string
 *
 ************************************************************************/

function GetDocumentBaseHref() {
    var collBase = document.getElementsByTagName("base");
    if (collBase && collBase[0]) {
        var elemBase = collBase[0];
        if (elemBase.href) {
            return elemBase.href;
        }
    }
    return '';
}

/***********************************************************************
 *
 * DecodeMail		-	decodes the obfuscated mail address in 'contactus' link
 *
 * Input: 				nothing
 *
 * Returns:				nothing
 *
 ************************************************************************/

function DecodeMail() {
    var nIdx = 0;
    for (; nIdx < document.links.length; nIdx++)
        if (document.links[nIdx].name == "contactus") {
            var sOldRef = document.links[nIdx].href;

            while (sOldRef.indexOf(" [dot] ") != -1)
                sOldRef = sOldRef.replace(" [dot] ", ".");

            while (sOldRef.indexOf(" [at] ") != -1)
                sOldRef = sOldRef.replace(" [at] ", "@");

            document.links[nIdx].href = sOldRef;
        }
}

/***********************************************************************
 *
 * HtmlInclude		-	Parses the page for <a href> tags and if any found 
 *							with rel="fragment" attribute then create an XMLHTTP
 *							request to download the referenced file and insert the
 *							file content in place of the referring tag.
 *							In case of error just leave it as is.
 *
 *	NOTE: this function is automatically attached to the onload event handler
 *	therefore this processing is done on all pages where this js file is included.
 *
 * Returns:				nothing
 *
 * Author:				Zoltan Magyar
 *
 ************************************************************************/

function HtmlInclude() {
    var req;
    //
    // Check browser type
    //
    if (typeof(XMLHttpRequest) == "undefined") // IE
    {
        try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                req = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) // no luck?
            {
                return; // nothing to do then
            }
        }
    } else // Mozzila
    {
        req = new XMLHttpRequest();
    }
    //
    // Get <a href> tags and iterate on them
    //
    var tags = document.getElementsByTagName("A");
    var i;
    for (i = 0; i < tags.length; i++) {
        //
        // Check if we got "fragment" as rel attribute
        //
        if (tags[i].getAttribute("rel") == "fragment") {
            try {
                //
                // Try to pull the referenced file from the server
                //
                req.open('GET', tags[i].getAttribute("href"), false);
                if (document.characterSet) {
                    req.overrideMimeType("text/html; charset=" + document.characterSet);
                }
                req.send(null);
                if (req.status == 200) // got the content?
                {
                    //
                    // Replace the reference with the pulled in content
                    //
                    var span = document.createElement("SPAN");
                    span.innerHTML = req.responseText;
                    tags[i].parentNode.replaceChild(span, tags[i]);
                }
            } catch (e) // couldn't pull it from the server (maybe preview)
            {
                return; // don't do anything then
            }
        }
    }
}

/***********************************************************************
 *
 * AddEvent									- Add event
 * Inputs:	obj							- object to add the event handler
 *				type							- type of the event
 *				fn								- event handler name
 *
 * Returns:  								- nothing
 *
 ************************************************************************/
function AddEvent(obj, type, fn) {
    if (obj.attachEvent) {
        obj['e' + type + fn] = fn;
        obj[type + fn] = function() {
            obj['e' + type + fn](window.event);
        }
        obj.attachEvent('on' + type, obj[type + fn]);
    } else {
        obj.addEventListener(type, fn, false);
    };
};

//
// The following lines will automatically parse all the pages 
// where this script is included by attaching the HtmlInclude
// function to the onload event.
//
AddEvent(window, "load", HtmlInclude);

/***************************************************************
 *
 * SDStorage				-	local storage or session storage methods
 *
 * Author:				Tibor Kristof
 *
 ****************************************************************/
window.SDStorage = {

    /***********************************************************************
     *
     * SDStorage.isSupported - check if storage is supported in client browser
     *
     * Return:
     *	true/false
     *
     ************************************************************************/
    isSupported: function() {
        try {
            var uid = new Date().valueOf();
            window.SDStorage.write(uid, uid, true);
            var storeuid = window.SDStorage.read(uid, true);
            window.SDStorage.remove(uid, true);
            return (uid == storeuid);
        } catch (e) {
            return false;
        }
    },

    /***********************************************************************
     *
     * SDStorage.writePage - writing a key-value pair to the store associated to the page
     *
     * Input:
     *	key	- key of the value to be associated and stored for the current page
     *	value	- value to be associated to the page
     *	 
     ************************************************************************/
    writePage: function(key, value) {
        try {
            window.SDStorage.write(key + '|' + window.location.href, value, true);
        } catch (e) {
            // do nothing
        }
    },

    /***********************************************************************
     *
     * SDStorage.readPage - reading values by key from the store associated to the page
     *
     * Input:
     *	key	- key of the value to be associated and stored for the current page
     *	
     * Return:
     *	any type of data
     *	 
     ************************************************************************/
    readPage: function(key) {
        return window.SDStorage.read(key + '|' + window.location.href, true);
    },

    /***********************************************************************
     *
     * SDStorage.writeGlobal - writing a key-value pair to the store that is independent of the current page
     *
     * Input:
     *	key	- key of the value to be associated and stored for the current page
     *	value	- value to be associated to the page
     *	 
     ************************************************************************/
    writeGlobal: function(key, value) {
        window.SDStorage.write(key + '|global', value, true);
    },

    /***********************************************************************
     *
     * SDStorage.readGlobal - reading values by key from the store that is independent of the current page
     *
     * Input:
     *	key	- key of the value to be associated and stored for the current page
     *	
     * Return:
     *	any type of data
     *	 
     ************************************************************************/
    readGlobal: function(key) {
        return window.SDStorage.read(key + '|global', true);
    },

    /***********************************************************************
     *
     * SDStorage.write - writing a key-value pair to the store
     *
     * Input:
     *	key	- key of the value to be stored on the client side
     *	value	- value to be stored
     *	session	- determines if we use session storage or not
     *	 
     ************************************************************************/
    write: function(key, value, session) {
        if (typeof(value) === 'object') {
            value = JSON.stringify(value)
        }
        if (session) {
            sessionStorage.setItem(key, value);
        } else {
            localStorage.setItem(key, value);
        }
    },

    /***********************************************************************
     *
     * SDStorage.read - reading a key-value pair from the store
     *
     * Input:
     *	key	- key of the value to get from the store
     *	session	- determines if we use session storage or not
     *	
     * Return:
     *	any type of data
     *	 
     ************************************************************************/
    read: function(key, session) {
        if (session) {
            var value = sessionStorage.getItem(key);
        } else {
            var value = localStorage.getItem(key);
        }
        try {
            var json = JSON.parse(value);
        } catch (e) {
            return value;
        }
        return json;
    },

    /***********************************************************************
     *
     * SDStorage.remove - removing a key and associate value from the store
     *
     * Input:
     *	key	- key of the value to be removed on the client side
     *	session	- determines if we use session storage or not
     *	 
     ************************************************************************/
    remove: function(key, session) {
        if (session) {
            sessionStorage.removeItem(key);
        } else {
            localStorage.removeItem(key);
        }
    }

};