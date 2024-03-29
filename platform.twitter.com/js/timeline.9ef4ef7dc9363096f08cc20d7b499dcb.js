(window.__twttrll = window.__twttrll || []).push([
    [6], {
        176: function(e, t, i) {
            var n = i(0);
            e.exports = function(e) {
                return n.isType("string", e)
            }
        },
        186: function(e, t) {
            var i = /^(dark|light)$/;
            e.exports = function(e) {
                return i.test(e)
            }
        },
        189: function(e, t) {
            var i = /^#(?:[a-f\d]{3}){1,2}$/i;
            e.exports = function(e) {
                return i.test(e)
            }
        },
        205: function(e, t, i) {
            var n = i(0);
            e.exports = function(e) {
                var t = {
                    transparent: !1,
                    hideBorder: !1,
                    hideHeader: !1,
                    hideFooter: !1,
                    hideScrollBar: !1
                };
                return e = e || "", n.contains(e, "transparent") && (t.transparent = !0), n.contains(e, "noborders") && (t.hideBorder = !0), n.contains(e, "noheader") && (t.hideHeader = !0), n.contains(e, "nofooter") && (t.hideFooter = !0), n.contains(e, "noscrollbar") && (t.hideScrollBar = !0), t
            }
        },
        206: function(e, t, i) {
            var n = i(10),
                r = i(33),
                s = i(4),
                o = i(0),
                a = "is-openedAbove",
                l = "is-openedBelow";
            e.exports = function(e) {
                e.selectors({
                    shareMenuOpener: ".js-showShareMenu",
                    shareMenu: ".timeline-ShareMenu",
                    shareMenuTimelineHeader: ".timeline-Header",
                    shareMenuTimelineFooter: ".timeline-Footer"
                }), e.define("getHeaderHeight", function() {
                    var e = this.selectOne("shareMenuTimelineHeader");
                    return e ? e.getBoundingClientRect().height : 0
                }), e.define("getFooterHeight", function() {
                    var e = this.selectOne("shareMenuTimelineFooter");
                    return e ? e.getBoundingClientRect().height : 0
                }), e.define("getShareMenuPositionClass", function(e) {
                    var t = e.getBoundingClientRect(),
                        i = t.top - this.getHeaderHeight();
                    return this.sandbox.height - t.bottom - this.getFooterHeight() < i ? a : l
                }), e.after("render", function() {
                    this.on("click", "shareMenuOpener", function(e, t) {
                        var i, a = this,
                            l = r.closest(this.selectors.shareMenu, e.target, this.el);

                        function d() {
                            n.remove(l, i), a.el.removeEventListener("click", d, !1), s.removeEventListener("click", d, !1)
                        }
                        e.preventDefault(), l && (i = this.getShareMenuPositionClass(t), n.add(l, i), o.async(function() {
                            a.el.addEventListener("click", d, !1), s.addEventListener("click", d, !1)
                        }))
                    })
                })
            }
        },
        207: function(e) {
            e.exports = {
                INITIAL: 1,
                NEWER: 2,
                OLDER: 3
            }
        },
        208: function(e, t, i) {
            var n = i(73),
                r = i(3),
                s = i(5);
            e.exports = function(e) {
                e.selectors({
                    followButton: ".follow-button"
                }), e.define("handleFollowButtonClick", function(e, t) {
                    var i = r.intentForFollowURL(t.href);
                    s.asBoolean(t.getAttribute("data-age-gate")) || n.open(i, this.sandbox.sandboxEl, e)
                }), e.after("render", function() {
                    this.on("click", "followButton", function(e, t) {
                        this.handleFollowButtonClick(e, t)
                    })
                })
            }
        },
        209: function(e, t, i) {
            var n = i(33),
                r = i(10);
            e.exports = function(e) {
                e.selectors({
                    mediaCard: ".MediaCard",
                    mediaCardNsfwDismissalTarget: ".MediaCard-dismissNsfw"
                }), e.define("dismissNsfwWarning", function(e, t) {
                    var i = n.closest(this.selectors.mediaCard, t, this.el);
                    i && r.remove(i, "is-nsfw")
                }), e.after("render", function() {
                    this.on("click", "mediaCardNsfwDismissalTarget", this.dismissNsfwWarning)
                })
            }
        },
        210: function(e, t, i) {
            var n, r, s = i(10),
                o = i(31),
                a = i(170),
                l = i(33),
                d = i(71),
                c = i(18),
                u = i(11),
                h = i(197),
                f = i(6),
                m = {
                    autoplay: "1"
                },
                p = "js-forceRedraw";
            e.exports = a.couple(i(211), function(e) {
                function t(e) {
                    var t = e.createElement("div");
                    return t.className = "MediaCard-mediaAsset", t
                }
                e.params({
                    lang: {
                        required: !0,
                        transform: d.matchLanguage,
                        fallback: "en"
                    },
                    videoPlayerBorderRadius: {
                        fallback: {}
                    },
                    videoPlayerBranding: {
                        fallback: !0
                    }
                }), e.selectors({
                    mediaAsset: ".MediaCard-mediaAsset",
                    cardInterstitial: ".js-cardPlayerInterstitial",
                    wvpInterstitial: ".js-playableMediaInterstitial",
                    sourceIdInfo: ".js-tweetIdInfo"
                }), e.define("videoPlayerOptions", function() {
                    var e = (this.scribeData() || {}).widget_origin,
                        t = this.scribeNamespace() || {};
                    return {
                        addBranding: this.params.videoPlayerBranding,
                        borderRadius: this.params.videoPlayerBorderRadius,
                        languageCode: this.params.lang,
                        widgetOrigin: e,
                        autoPlay: !0,
                        scribeContext: {
                            page: t.page,
                            client: t.client
                        }
                    }
                }), e.define("replaceInterstitialWithMedia", function(e, t) {
                    return f.all([this.restoreLastMediaInterstitial(), c.write(function() {
                        n = e, r = e.parentNode, e.parentNode.replaceChild(t, e)
                    })])
                }), e.define("restoreLastMediaInterstitial", function() {
                    var e;
                    return n && r ? (e = r.firstElementChild, h.remove(e), c.write(function() {
                        r.replaceChild(n, e)
                    })) : f.resolve()
                }), e.define("playWebVideoPlayerMediaAsset", function(e, t) {
                    var i, n = l.closest(this.selectors.sourceIdInfo, t, this.el),
                        r = n.getAttribute("data-tweet-id"),
                        s = h.insertForTweet;
                    return r || (r = n.getAttribute("data-event-id"), s = h.insertForEvent), r ? (e.preventDefault(), i = this.selectOne(n, this.selectors.wvpInterstitial), this.getConsent(n, i).then(function() {
                        this.displayWebVideoPlayerMediaAsset(n, r, s)
                    }.bind(this))) : f.reject(new Error("No source id found for player"))
                }), e.define("displayWebVideoPlayerMediaAsset", function(e, i, n) {
                    var r = this.selectOne(e, this.selectors.mediaAsset),
                        s = t(this.sandbox),
                        o = this.sandbox.createElement("div"),
                        a = this.videoPlayerOptions();
                    return o.className = "wvp-player-container", s.appendChild(o), this.replaceInterstitialWithMedia(r, s).then(function() {
                        return n.call(this, s, i, a)
                    })
                }), e.define("displayIframeMediaAsset", function(e, i) {
                    var n, r, a, d = l.closest(this.selectors.mediaAsset, i, this.el),
                        h = l.closest(this.selectors.cardInterstitial, i, this.el),
                        w = h.getAttribute("data-player-src"),
                        v = h.getAttribute("data-player-width"),
                        g = h.getAttribute("data-player-height"),
                        b = h.getAttribute("data-player-title");
                    return w ? (e.preventDefault(), a = w, w = u.url(a, m), n = t(this.sandbox), (r = o({
                        src: w,
                        allowfullscreen: "true",
                        width: v,
                        height: g,
                        title: b || ""
                    })).className = "FilledIframe", n.appendChild(r), this.replaceInterstitialWithMedia(d, n).then(function() {
                        r.focus(), c.write(function() {
                            s.add(n, p), s.add(r, p)
                        })
                    })) : f.reject(new Error("No Player frame source"))
                }), e.after("render", function() {
                    var e = this.selectOne(this.selectors.wvpInterstitial);
                    e && s.remove(e, "u-hidden"), this.on("click", "cardInterstitial", this.displayIframeMediaAsset), this.on("click", "wvpInterstitial", this.playWebVideoPlayerMediaAsset)
                })
            })
        },
        211: function(e, t, i) {
            var n = i(10),
                r = i(212),
                s = i(2),
                o = i(19),
                a = i(18),
                l = i(22),
                d = i(6),
                c = i(30);
            e.exports = function(e) {
                e.selectors({
                    cookieConsentButton: ".js-cookieConsentButton",
                    interstitial: ".js-interstitial"
                }), e.define("getConsent", function(e, t) {
                    var i = this.selectOne(e, this.selectors.interstitial);
                    return i ? c.shouldObtainCookieConsent().catch(function() {
                        return d.resolve(!0)
                    }).then(function(e) {
                        var n, r;
                        return e ? (n = new s, r = function() {
                            this.handleCookieConsentClick(t, i), n.resolve()
                        }.bind(this), a.write(function() {
                            this.scribe({
                                component: "cookie_consent",
                                action: "show"
                            }), this.showConsentInterstitial(i, t), this.attachConsentListener(i, r)
                        }, this), n.promise) : d.resolve()
                    }.bind(this)) : d.resolve()
                }), e.define("attachConsentListener", function(e, t) {
                    var i = this.selectOne(e, this.selectors.cookieConsentButton);
                    i && i.addEventListener("click", t, {
                        once: !0
                    })
                }), e.define("showConsentInterstitial", function(e, t) {
                    n.remove(e, "u-hidden"), t && n.add(t, "is-backgrounded")
                }), e.define("hideConsentInterstitial", function(e, t) {
                    n.add(e, "u-hidden"), t && n.remove(t, "is-backgrounded")
                }), e.define("setCookieConsentCookie", function() {
                    return r.request(o.cookieConsent()).catch(function(e) {
                        throw new Error("CORS request failed: " + e)
                    })
                }), e.define("handleCookieConsentClick", function(e, t) {
                    return l.allSettled([a.write(this.hideConsentInterstitial.bind(this, t, e)), this.setCookieConsentCookie()])
                })
            }
        },
        212: function(e, t, i) {
            var n = i(2),
                r = i(6),
                s = i(21),
                o = i(32),
                a = i(11),
                l = i(0),
                d = i(1),
                c = {
                    method: "GET",
                    params: {},
                    headers: {},
                    credentials: "include",
                    isSuccess: function(e) {
                        return e >= 200 && e < 300
                    }
                },
                u = {
                    JSON: "application/json",
                    TEXT: "text/plain"
                },
                h = {
                    NO_XHR: new Error("No suitable XHR implementation available."),
                    REQUEST_FAILED: new Error("XHR request failed."),
                    REQUEST_ABORTED: new Error("XHR request aborted."),
                    REQUEST_TIMED_OUT: new Error("XHR request timed out."),
                    NETWORK_ERROR: new Error("Network error.")
                };
            e.exports = {
                request: function(e, t) {
                    var i, f;
                    return t = l.aug({}, c, t || {}), i = a.url(e, t.params), (f = d.fetch) ? f(i, t).catch(function() {
                        return r.reject(h.NETWORK_ERROR)
                    }).then(function(e) {
                        if (t.isSuccess(e.status)) return e.text().then(function(t) {
                            var i = e.headers.get("content-type");
                            return t && l.contains(i, u.JSON) ? o.parse(t) : t
                        });
                        throw new Error("Request failed with status: " + e.status)
                    }) : function(e, t) {
                        var i, a = new n,
                            c = s.ie9(),
                            f = c ? d.XDomainRequest : d.XMLHttpRequest;
                        if (!f) return r.reject(h.NO_XHR);

                        function m() {
                            var e = c ? i.contentType : i.getResponseHeader("content-type"),
                                n = l.contains(e, u.JSON) ? function(e) {
                                    return e ? o.parse(e) : e
                                }(i.responseText) : i.responseText;
                            c || t.isSuccess(i.status) ? a.resolve(n) : c || 0 !== i.status ? a.reject(n) : a.reject(h.NETWORK_ERROR)
                        }
                        return (i = new f).onreadystatechange = function() {
                            4 === i.readyState && m()
                        }, i.onload = m, i.onerror = function() {
                            a.reject(h.REQUEST_FAILED)
                        }, i.onabort = function() {
                            a.reject(h.REQUEST_ABORTED)
                        }, i.ontimeout = function() {
                            a.reject(h.REQUEST_TIMED_OUT)
                        }, i.open(t.method, e), "include" === t.credentials && (i.withCredentials = !0), i.setRequestHeader && l.forIn(t.headers, function(e) {
                            i.setRequestHeader(e, t.headers[e])
                        }), i.send(), a.promise
                    }(i, t)
                },
                mimeTypes: u,
                errors: h
            }
        },
        213: function(e, t, i) {
            var n = i(10),
                r = i(18),
                s = i(48),
                o = i(21),
                a = i(6),
                l = i(0),
                d = i(170),
                c = 50,
                u = "data-card-breakpoints",
                h = "data-theme",
                f = "is-loaded",
                m = "is-constrainedByMaxWidth";
            e.exports = d.couple(i(171), function(e) {
                e.selectors({
                    prerenderedCard: ".PrerenderedCard",
                    periscopeVideo: ".PlayerCard--video",
                    rootCardEl: ".TwitterCard .CardContent > *:first-child"
                }), e.define("scribeCardShown", function(e) {
                    this.scribe({
                        component: "card",
                        action: "shown"
                    }, {
                        items: [{
                            card_name: e.getAttribute("data-card-name")
                        }]
                    }, 2)
                }), e.define("resizeSandboxDueToCardChange", function() {
                    return this.sandbox.matchHeightToContent()
                }), e.define("markCardElAsLoaded", function(e) {
                    var t = this,
                        i = !1;

                    function s() {
                        i && t.resizeSandboxDueToCardChange()
                    }
                    return this.select(e, "img").forEach(function(e) {
                        e.addEventListener("load", s, !1)
                    }), this.scribeCardShown(e), r.write(function() {
                        n.add(e, f)
                    }).then(function() {
                        i = !0, t.resizeSandboxDueToCardChange()
                    })
                }), e.define("updateCardWidthConstraints", function() {
                    var e = this;
                    return a.all(this.select("prerenderedCard").map(function(t) {
                        var i = e.selectOne(t, "rootCardEl");
                        return r.defer(function() {
                            var e, r = 0;
                            o.ios() ? (n.remove(t, m), r = s(t.parentElement).width, t.style.maxWidth = r + "px") : r = s(t.parentElement).width, e = function(e) {
                                var t, i = "";
                                for (t = Math.floor(e / c); t > 0; t--) i += "w" + t * c + " ";
                                return i
                            }(r), i.setAttribute(u, e), n.add(t, m)
                        }).then(function() {
                            return e.resizeSandboxDueToCardChange()
                        })
                    }))
                }), e.define("setCardTheme", function(e) {
                    var t = this.selectOne(e, "rootCardEl");
                    this.params.theme && t.setAttribute(h, this.params.theme)
                }), e.after("prepForInsertion", function(e) {
                    var t = this,
                        i = this.select(e, "prerenderedCard").reduce(function(e, t) {
                            var i = t.getAttribute("data-css");
                            return i && (e[i] = e[i] || [], e[i].push(t)), e
                        }, {});
                    l.forIn(i, function(e, i) {
                        t.sandbox.prependStyleSheet(e).then(function() {
                            i.forEach(function(e) {
                                t.setCardTheme(e), t.markCardElAsLoaded(e)
                            })
                        })
                    })
                }), e.after("show", function() {
                    var e;
                    return o.anyIE() && (e = this.selectOne("periscopeVideo")) && (e.style.display = "none"), this.updateCardWidthConstraints()
                }), e.after("resize", function() {
                    return this.updateCardWidthConstraints()
                })
            })
        },
        214: function(e, t, i) {
            var n = i(1),
                r = i(0),
                s = /^#/;

            function o(e) {
                return n.parseInt(e, 16)
            }

            function a(e, t) {
                var i, n, a, l;
                if (e = function(e) {
                        return r.isType("string", e) ? (e = e.replace(s, ""), e += 3 === e.length ? e : "") : null
                    }(e), t = t || 0, e) return i = t < 0 ? 0 : 255, t = t < 0 ? -Math.max(t, -1) : Math.min(t, 1), n = o(e.substring(0, 2)), a = o(e.substring(2, 4)), l = o(e.substring(4, 6)), "#" + (16777216 + 65536 * (Math.round((i - n) * t) + n) + 256 * (Math.round((i - a) * t) + a) + (Math.round((i - l) * t) + l)).toString(16).slice(1)
            }
            e.exports = {
                darken: function(e, t) {
                    return a(e, -t)
                },
                lighten: function(e, t) {
                    return a(e, t)
                }
            }
        },
        215: function(e, t, i) {
            var n = i(33),
                r = i(45);
            e.exports = function(e) {
                e.after("render", function() {
                    var e, t = this.sandbox.sandboxEl,
                        i = t.tagName;
                    if (r(t, "td " + i)) return e = n.closest("td", t), this.sandbox.styleSelf({
                        maxWidth: e.clientWidth + "px"
                    })
                })
            }
        },
        219: function(e, t, i) {
            var n = i(207);
            e.exports = function(e, t, i) {
                switch (e.cursors = e.cursors || {}, e.pollInterval = t.pollInterval, i) {
                    case n.INITIAL:
                        e.cursors.min = t.minCursorPosition, e.cursors.max = t.maxCursorPosition;
                        break;
                    case n.NEWER:
                        e.cursors.max = t.maxCursorPosition || e.cursors.max;
                        break;
                    case n.OLDER:
                        e.cursors.min = t.minCursorPosition || e.cursors.min
                }
            }
        },
        234: function(e, t, i) {
            var n = i(6),
                r = i(180),
                s = i(18),
                o = i(34),
                a = i(5),
                l = i(0),
                d = i(170),
                c = i(7),
                u = i(179),
                h = i(184),
                f = i(176),
                m = i(71),
                p = i(186),
                w = i(219),
                v = i(178),
                g = i(207),
                b = "180px",
                C = "100%",
                T = "200px",
                x = "520px",
                E = "600px",
                I = 1;
            e.exports = d.couple(i(171), i(172), function(e) {
                e.params({
                    dataSource: {
                        required: !0
                    },
                    id: {
                        validate: f
                    },
                    lang: {
                        required: !0,
                        transform: m.matchLanguage,
                        fallback: "en"
                    },
                    isPreconfigured: {
                        required: !0,
                        fallback: !1
                    },
                    width: {
                        validate: h,
                        transform: h
                    },
                    height: {
                        validate: h,
                        transform: h
                    },
                    theme: {
                        fallback: [c(o.val, o, "widgets:theme")],
                        validate: p
                    },
                    tweetLimit: {
                        transform: a.asInt
                    },
                    partner: {
                        fallback: c(o.val, o, "partner")
                    },
                    staticContent: {
                        required: !1,
                        transform: a.asBoolean
                    }
                }), e.selectors({
                    header: ".timeline-Header",
                    footer: ".timeline-Footer",
                    viewport: ".timeline-Viewport",
                    tweetList: ".timeline-TweetList",
                    tweetsInStream: ".timeline-Tweet"
                }), e.around("scribeNamespace", function(e) {
                    return l.aug(e(), {
                        page: "timeline"
                    })
                }), e.around("scribeData", function(e) {
                    var t = this.params.dataSource.id;
                    return l.aug(e(), {
                        widget_id: a.isNumber(t) ? t : void 0,
                        widget_data_source: t,
                        query: this.el && this.el.getAttribute("data-search-query"),
                        profile_id: this.el && this.el.getAttribute("data-profile-id")
                    })
                }), e.around("widgetDataAttributes", function(e) {
                    return l.aug({
                        "widget-id": this.params.dataSource.id,
                        "user-id": this.el && this.el.getAttribute("data-profile-id"),
                        "search-query": this.el && this.el.getAttribute("data-search-query")
                    }, e())
                }), e.define("updateViewportHeight", function() {
                    var e, t = this.sandbox,
                        i = this.selectOne("header"),
                        n = this.selectOne("footer"),
                        r = this.selectOne("viewport");
                    return s.read(function() {
                        e = t.height - 2 * I, e -= i ? i.offsetHeight : 0, e -= n ? n.offsetHeight : 0
                    }), s.write(function() {
                        r.style.height = e + "px"
                    })
                }), e.define("adjustWidgetSize", function() {
                    return this.isFullyExpanded ? this.sandbox.matchHeightToContent() : this.updateViewportHeight()
                }), e.define("scribeImpressionsForInitialTweetSet", function() {
                    var e = u(this.select("tweetsInStream")),
                        t = Object.keys(e),
                        i = t.length ? "results" : "no_results",
                        n = this.el.getAttribute("data-collection-id");
                    n && (t.push(n), e[n] = {
                        item_type: v.CUSTOM_TIMELINE
                    }), this.scribe({
                        component: "timeline",
                        element: "initial",
                        action: i
                    }, {
                        item_ids: t,
                        item_details: e
                    })
                }), e.override("initialize", function() {
                    this.params.width || (this.params.width = this.params.isPreconfigured ? x : C), this.isStaticTimeline = this.params.staticContent || this.params.tweetLimit > 0, this.params.theme = this.params.theme || "light", this.isFullyExpanded = this.isStaticTimeline || !this.params.isPreconfigured && !this.params.height, this.isFullyExpanded || this.params.height || (this.params.height = E)
                }), e.override("hydrate", function() {
                    var e = this;
                    return this.params.dataSource.fetch().then(function(t) {
                        e.html = t.html, w(e, t, g.INITIAL)
                    })
                }), e.override("render", function() {
                    var e, t = this;
                    return this.el = this.sandbox.htmlToElement(this.html), this.el ? (this.el.lang = this.params.lang, this.isFullyExpanded && this.sandbox.addRootClass("var-fully-expanded"), this.isStaticTimeline && this.sandbox.addRootClass("var-static"), e = r.timeline(this.params.lang, this.params.theme), n.all([this.sandbox.appendStyleSheet(e), this.sandbox.styleSelf({
                        display: "inline-block",
                        maxWidth: C,
                        width: this.params.width,
                        minWidth: b,
                        marginTop: 0,
                        marginBottom: 0
                    })]).then(function() {
                        return t.prepForInsertion(t.el), t.sandbox.injectWidgetEl(t.el)
                    })) : n.reject(new Error("unable to render"))
                }), e.override("show", function() {
                    var e = this.sandbox,
                        t = this;
                    return this.sandbox.makeVisible().then(function() {
                        return e.styleSelf({
                            minHeight: t.isStaticTimeline ? void 0 : T,
                            height: t.params.height
                        })
                    }).then(function() {
                        return t.adjustWidgetSize()
                    }).then(function() {
                        return s.read(function() {
                            t.scribeImpressionsForInitialTweetSet()
                        })
                    })
                }), e.last("resize", function() {
                    return this.adjustWidgetSize()
                })
            })
        },
        235: function(e, t, i) {
            var n = i(18),
                r = i(205);
            e.exports = function(e) {
                e.params({
                    chrome: {
                        transform: r,
                        fallback: ""
                    }
                }), e.selectors({
                    streamContainer: ".timeline-Viewport",
                    tweetStream: ".timeline-TweetList"
                }), e.before("render", function() {
                    this.params.chrome.transparent && this.sandbox.addRootClass("var-chromeless"), this.params.chrome.hideBorder && this.sandbox.addRootClass("var-borderless"), this.params.chrome.hideHeader && this.sandbox.addRootClass("var-headerless"), this.params.chrome.hideFooter && this.sandbox.addRootClass("var-footerless")
                }), e.after("render", function() {
                    if (this.params.chrome.hideScrollBar) return this.hideScrollBar()
                }), e.after("resize", function() {
                    if (this.params.chrome.hideScrollBar) return this.hideScrollBar()
                }), e.define("hideScrollBar", function() {
                    var e = this.selectOne("streamContainer"),
                        t = this.selectOne("tweetStream");
                    return n.defer(function() {
                        var i, n;
                        e.style.width = "", i = e.offsetWidth - t.offsetWidth, n = e.offsetWidth + i, e.style.width = n + "px"
                    })
                })
            }
        },
        236: function(e, t) {
            e.exports = function(e) {
                e.params({
                    ariaLive: {
                        fallback: ""
                    }
                }), e.selectors({
                    newTweetsNotifier: ".new-tweets-bar"
                }), e.after("render", function() {
                    var e = this.selectOne("newTweetsNotifier");
                    "assertive" === this.params.ariaLive && e && e.setAttribute("aria-live", "assertive")
                })
            }
        },
        237: function(e, t, i) {
            var n = i(6),
                r = i(170);
            e.exports = r.couple(i(213), function(e) {
                e.override("resizeSandboxDueToCardChange", function() {
                    return this.isFullyExpanded ? this.sandbox.matchHeightToContent() : n.resolve()
                })
            })
        },
        238: function(e, t, i) {
            var n = i(2),
                r = i(6),
                s = i(10),
                o = i(18),
                a = i(1),
                l = i(9),
                d = i(0),
                c = i(170),
                u = i(179),
                h = i(239),
                f = i(219),
                m = i(24),
                p = i(240),
                w = i(207),
                v = 50,
                g = 5e3,
                b = 500,
                C = "is-atEndOfTimeline";
            e.exports = c.couple(i(171), function(e) {
                e.params({
                    dataSource: {
                        required: !0
                    },
                    isPreviewTimeline: {
                        required: !1,
                        fallback: !1
                    }
                }), e.selectors({
                    timelineTweet: ".timeline-Tweet",
                    viewport: ".timeline-Viewport",
                    tweetList: ".timeline-TweetList",
                    tweetsInStream: ".timeline-Tweet",
                    newTweetsNotifier: ".new-tweets-bar",
                    loadMore: ".timeline-LoadMore",
                    loadMoreButton: ".timeline-LoadMore-prompt"
                }), e.define("gcTweetsSync", function() {
                    var e = "custom" === this.el.getAttribute("data-timeline-type"),
                        t = this.selectOne("tweetList");
                    if (e) return r.resolve();
                    h(t, v)
                }), e.define("scribeImpressionsForDynamicTweetSet", function(e, t) {
                    var i = d.toRealArray(e.querySelectorAll(this.selectors.timelineTweet)),
                        n = u(i),
                        r = Object.keys(n),
                        s = t ? "newer" : "older",
                        o = t ? p.CLIENT_SIDE_APP : p.CLIENT_SIDE_USER;
                    this.scribe({
                        component: "timeline",
                        element: s,
                        action: "results"
                    }, {
                        item_ids: r,
                        item_details: n,
                        event_initiator: o
                    })
                }), e.define("fetchTweets", function(e, t) {
                    var i = this,
                        n = function(e, t, i) {
                            var n = {};
                            return e = e || {}, i && e.max ? n.minPosition = e.max : !i && e.min ? n.maxPosition = e.min : i ? n.sinceId = t : n.maxId = t, n
                        }(this.cursors, e, t);
                    return this.params.dataSource.poll(n, t).then(function(n) {
                        var r, s, o = i.sandbox.createFragment(),
                            a = i.sandbox.createElement("ol"),
                            l = t ? w.NEWER : w.OLDER;
                        return f(i, n, l), a.innerHTML = n.html, (r = a.firstElementChild) && (s = i.selectOne(r, "timelineTweet")), s && "LI" === r.tagName ? (s.getAttribute("data-tweet-id") === e && a.removeChild(r), i.scribeImpressionsForDynamicTweetSet(a, t), i.prepForInsertion(a), d.toRealArray(a.children).forEach(function(e) {
                            o.appendChild(e)
                        }), o) : o
                    }, function(e) {
                        return "404" === e ? i.pollInterval = null : "503" === e && (i.pollInterval *= 1.5), r.reject(e)
                    })
                }), e.define("loadOldTweets", function() {
                    var e = this,
                        t = this.selectLast("tweetsInStream"),
                        i = t && t.getAttribute("data-tweet-id");
                    return i ? this.fetchTweets(i, !1).then(function(t) {
                        var i = e.selectOne("tweetList"),
                            n = e.selectOne("loadMore");
                        return o.write(function() {
                            t.childNodes.length > 0 ? i.appendChild(t) : s.add(n, C)
                        })
                    }) : r.reject(new Error("unable to load more"))
                }), e.after("loadOldTweets", function() {
                    return m.trigger("timelineUpdated", {
                        target: this.sandbox.sandboxEl,
                        region: "older"
                    }), this.resize()
                }), e.define("loadNewTweets", function() {
                    var e = this,
                        t = this.selectOne("tweetsInStream"),
                        i = t && t.getAttribute("data-tweet-id");
                    return i ? this.fetchTweets(i, !0).then(function(t) {
                        var i, n, r = e.selectOne("viewport"),
                            s = e.selectOne("tweetList");
                        if (0 !== t.childNodes.length) return o.read(function() {
                            i = r.scrollTop, n = r.scrollHeight
                        }), o.defer(function() {
                            var o;
                            s.insertBefore(t, s.firstElementChild), o = i + r.scrollHeight - n, i > 40 || e.mouseIsOverWidget ? (r.scrollTop = o, e.showNewTweetsNotifier()) : (r.scrollTop = 0, e.gcTweetsSync())
                        })
                    }) : r.reject(new Error("unable to load new tweets"))
                }), e.after("loadNewTweets", function() {
                    return m.trigger("timelineUpdated", {
                        target: this.sandbox.sandboxEl,
                        region: "newer"
                    }), this.resize()
                }), e.define("showNewTweetsNotifier", function() {
                    var e = this,
                        t = this.selectOne("newTweetsNotifier"),
                        i = t && t.firstElementChild;
                    return a.setTimeout(function() {
                        e.hideNewTweetsNotifier()
                    }, g), o.write(function() {
                        t.removeChild(i), t.appendChild(i), s.add(t, "is-displayed")
                    }), o.defer(function() {
                        s.add(t, "is-opaque")
                    })
                }), e.define("hideNewTweetsNotifier", function(e) {
                    var t = new n,
                        i = this.selectOne("newTweetsNotifier");
                    return !(e = e || {}).force && this.mouseIsOverNewTweetsNotifier ? (t.resolve(), t.promise) : (o.write(function() {
                        s.remove(i, "is-opaque")
                    }), a.setTimeout(function() {
                        o.write(function() {
                            s.remove(i, "is-displayed")
                        }).then(t.resolve, t.reject)
                    }, b), t.promise)
                }), e.define("scrollToTopOfViewport", function() {
                    var e = this.selectOne("viewport");
                    return o.write(function() {
                        e.scrollTop = 0, e.focus()
                    })
                }), e.define("schedulePolling", function() {
                    var e = this,
                        t = l.get("timeline.pollInterval");

                    function i() {
                        e.isPollInProgress = !1
                    }! function n() {
                        var r = t || e.pollInterval;
                        r && a.setTimeout(function() {
                            e.isPollInProgress || (e.isPollInProgress = !0, e.loadNewTweets(e.sandbox).then(i, i)), n()
                        }, r)
                    }()
                }), e.after("initialize", function() {
                    this.isPollInProgress = !1, this.mouseIsOverWidget = !1, this.mouseIsOverNewTweetsNotifier = !1, this.cursors = {}, this.pollInterval = 1e4
                }), e.after("render", function() {
                    this.isStaticTimeline || this.params.isPreviewTimeline || (this.select("timelineTweet").length > 0 && this.schedulePolling(), this.on("mouseover", function() {
                        this.mouseIsOverWidget = !0
                    }), this.on("mouseout", function() {
                        this.mouseIsOverWidget = !1
                    }), this.on("mouseover", "newTweetsNotifier", function() {
                        this.mouseIsOverNewTweetsNotifier = !0
                    }), this.on("mouseout", "newTweetsNotifier", function() {
                        this.mouseIsOverNewTweetsNotifier = !1
                    }), this.on("click", "newTweetsNotifier", function() {
                        this.scrollToTopOfViewport(), this.hideNewTweetsNotifier({
                            force: !0
                        })
                    }), this.on("click", "loadMoreButton", function() {
                        this.loadOldTweets()
                    }))
                })
            })
        },
        239: function(e, t) {
            e.exports = function(e, t) {
                if (e)
                    for (; e.children[t];) e.removeChild(e.children[t])
            }
        },
        240: function(e) {
            e.exports = {
                CLIENT_SIDE_USER: 0,
                CLIENT_SIDE_APP: 2
            }
        },
        241: function(e, t, i) {
            var n = i(34),
                r = i(189),
                s = i(7),
                o = ".customisable-border";
            e.exports = function(e) {
                e.params({
                    borderColor: {
                        fallback: [s(n.val, n, "widgets:border-color")],
                        validate: r
                    }
                }), e.after("render", function() {
                    var e = this.params.borderColor;
                    e && this.sandbox.appendCss(function(e) {
                        return o + "{border-color:" + e + ";}"
                    }(e))
                })
            }
        },
        242: function(e, t, i) {
            var n = i(34),
                r = i(214),
                s = i(189),
                o = i(7),
                a = [".customisable", ".customisable:link", ".customisable:visited"],
                l = [".customisable:hover", ".customisable:focus", ".customisable:active", ".customisable-highlight:hover", ".customisable-highlight:focus", "a:hover .customisable-highlight", "a:focus .customisable-highlight"];

            function d(e) {
                return e.join(",")
            }
            e.exports = function(e) {
                e.params({
                    linkColor: {
                        fallback: o(n.val, n, "widgets:link-color"),
                        validate: s
                    }
                }), e.after("render", function() {
                    var e = this.params.linkColor;
                    e && this.sandbox.appendCss(function(e) {
                        return [d(a) + "{color:" + e + ";}", d(l) + "{color:" + r.lighten(e, .2) + ";}"].join("")
                    }(e))
                })
            }
        },
        90: function(e, t, i) {
            var n = i(170);
            e.exports = n.build([i(234), i(235), i(200), i(201), i(181), i(185), i(182), i(236), i(193), i(194), i(190), i(192), i(208), i(209), i(210), i(237), i(238), i(206), i(199), i(198), i(241), i(242), i(195), i(196), i(204), i(215)], {
                pageForAudienceImpression: "timeline",
                productName: "embeddedtimeline",
                breakpoints: [330, 430, 550, 660, 820, 970]
            })
        }
    }
]);