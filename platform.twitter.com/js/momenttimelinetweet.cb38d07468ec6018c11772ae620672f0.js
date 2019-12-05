(window.__twttrll = window.__twttrll || []).push([
    [0], {
        170: function(t, e, r) {
            var i = r(41),
                n = r(173),
                o = r(7);
            (i = Object.create(i)).build = o(i.build, null, n), t.exports = i
        },
        171: function(t, e, r) {
            var i = r(40),
                n = r(35),
                o = r(39),
                s = r(0),
                a = r(7),
                c = r(34),
                u = r(5),
                l = r(177);
            t.exports = function(t) {
                t.params({
                    partner: {
                        fallback: a(c.val, c, "partner")
                    }
                }), t.define("scribeItems", function() {
                    return {}
                }), t.define("scribeNamespace", function() {
                    return {
                        client: "tfw"
                    }
                }), t.define("scribeData", function() {
                    return {
                        widget_origin: o.rootDocumentLocation(),
                        widget_frame: o.isFramed() && o.currentDocumentLocation(),
                        widget_partner: this.params.partner,
                        widget_site_screen_name: l(c.val("site")),
                        widget_site_user_id: u.asNumber(c.val("site:id")),
                        widget_creator_screen_name: l(c.val("creator")),
                        widget_creator_user_id: u.asNumber(c.val("creator:id"))
                    }
                }), t.define("scribe", function(t, e, r) {
                    t = s.aug(this.scribeNamespace(), t || {}), e = s.aug(this.scribeData(), e || {}), i.scribe(t, e, !1, r)
                }), t.define("scribeInteraction", function(t, e, r) {
                    var i = n.extractTermsFromDOM(t.target);
                    i.action = t.type, "url" === i.element && (i.element = n.clickEventElement(t.target)), this.scribe(i, e, r)
                })
            }
        },
        172: function(t, e, r) {
            var i = r(5),
                n = r(0);
            t.exports = function(t) {
                t.define("widgetDataAttributes", function() {
                    return {}
                }), t.define("setDataAttributes", function() {
                    var t = this.sandbox.sandboxEl;
                    n.forIn(this.widgetDataAttributes(), function(e, r) {
                        i.hasValue(r) && t.setAttribute("data-" + e, r)
                    })
                }), t.after("render", function() {
                    this.setDataAttributes()
                })
            }
        },
        173: function(t, e, r) {
            var i = r(42),
                n = r(0),
                o = r(174);

            function s() {
                i.apply(this, arguments), this.Widget = this.Component
            }
            s.prototype = Object.create(i.prototype), n.aug(s.prototype, {
                factory: o,
                build: function() {
                    return i.prototype.build.apply(this, arguments)
                },
                selectors: function(t) {
                    var e = this.Widget.prototype.selectors;
                    t = t || {}, this.Widget.prototype.selectors = n.aug({}, t, e)
                }
            }), t.exports = s
        },
        174: function(t, e, r) {
            var i = r(6),
                n = r(36),
                o = r(43),
                s = r(0),
                a = r(7),
                c = r(175),
                u = "twitter-widget-";
            t.exports = function() {
                var t = o();

                function e(e, r) {
                    t.apply(this, arguments), this.id = u + c(), this.sandbox = r
                }
                return e.prototype = Object.create(t.prototype), s.aug(e.prototype, {
                    selectors: {},
                    hydrate: function() {
                        return i.resolve()
                    },
                    prepForInsertion: function() {},
                    render: function() {
                        return i.resolve()
                    },
                    show: function() {
                        return i.resolve()
                    },
                    resize: function() {
                        return i.resolve()
                    },
                    select: function(t, e) {
                        return 1 === arguments.length && (e = t, t = this.el), t ? (e = this.selectors[e] || e, s.toRealArray(t.querySelectorAll(e))) : []
                    },
                    selectOne: function() {
                        return this.select.apply(this, arguments)[0]
                    },
                    selectLast: function() {
                        return this.select.apply(this, arguments).pop()
                    },
                    on: function(t, e, r) {
                        var i, o = this.el;
                        this.el && (t = (t || "").split(/\s+/), 2 === arguments.length ? r = e : i = e, i = this.selectors[i] || i, r = a(r, this), t.forEach(i ? function(t) {
                            n.delegate(o, t, i, r)
                        } : function(t) {
                            o.addEventListener(t, r, !1)
                        }))
                    }
                }), e
            }
        },
        175: function(t, e) {
            var r = 0;
            t.exports = function() {
                return String(r++)
            }
        },
        177: function(t, e) {
            t.exports = function(t) {
                return t && "@" === t[0] ? t.substr(1) : t
            }
        },
        178: function(t) {
            t.exports = {
                TWEET: 0,
                RETWEET: 10,
                CUSTOM_TIMELINE: 17,
                LIVE_VIDEO_EVENT: 28,
                QUOTE_TWEET: 23
            }
        },
        179: function(t, e, r) {
            var i = r(178);
            t.exports = function(t) {
                return t ? (t = Array.isArray(t) ? t : [t]).reduce(function(t, e) {
                    var r = e.getAttribute("data-tweet-id"),
                        n = e.getAttribute("data-rendered-tweet-id") || r;
                    return e.getAttribute("data-tweet-item-type") === i.QUOTE_TWEET.toString() ? t[r] = {
                        item_type: i.QUOTE_TWEET
                    } : r === n ? t[n] = {
                        item_type: i.TWEET
                    } : r && (t[n] = {
                        item_type: i.RETWEET,
                        target_type: i.TWEET,
                        target_id: r
                    }), t
                }, {}) : {}
            }
        },
        180: function(t, e, r) {
            var i = r(71),
                n = r(183),
                o = r(7),
                s = r(72);

            function a(t, e, r, o) {
                var a, c;
                return r = function(t) {
                    return "dark" === t ? "dark" : "light"
                }(r), a = i.isRtlLang(e) ? "rtl" : "ltr", c = [t, o ? n.holdback_css : n.css, r, a, "css"].join("."), s.resourceBaseUrl + (o ? "/holdback" : "") + "/css/" + c
            }
            t.exports = {
                dmButton: function() {
                    return s.resourceBaseUrl + "/css/" + ["dm_button", n.css, "css"].join(".")
                },
                tweet: o(a, null, "tweet"),
                timeline: o(a, null, "timeline"),
                video: o(a, null, "video"),
                moment: o(a, null, "moment"),
                grid: o(a, null, "grid"),
                periscopeOnAir: function() {
                    return s.resourceBaseUrl + "/css/" + ["periscope_on_air", n.css, "css"].join(".")
                }
            }
        },
        181: function(t, e, r) {
            var i = r(33),
                n = r(170),
                o = r(179);
            t.exports = n.couple(r(171), function(t) {
                t.selectors({
                    tweetIdInfo: ".js-tweetIdInfo",
                    quotedTweetInfo: '[data-tweet-item-type="23"]'
                }), t.define("scribeClickInteraction", function(t, e) {
                    var r = i.closest(this.selectors.tweetIdInfo, e, this.el),
                        n = r && r.querySelector(this.selectors.quotedTweetInfo);
                    this.scribeInteraction(t, function(t, e) {
                        var r;
                        if (t) return r = o(e ? [t, e] : [t]), {
                            item_ids: Object.keys(r),
                            item_details: r
                        }
                    }(r, n))
                }), t.after("render", function() {
                    this.on("click", "A", this.scribeClickInteraction), this.on("click", "BUTTON", this.scribeClickInteraction)
                })
            })
        },
        182: function(t, e, r) {
            var i = r(187),
                n = r(30),
                o = r(3),
                s = r(6),
                a = "data-url-ref-attrs-injected";
            t.exports = function(t) {
                var e = {};
                t.define("injectRefUrlParams", function(t) {
                    return o.isTwitterURL(t.href) ? t.getAttribute(a) ? s.resolve() : (e = {
                        twcamp: this.params.productName,
                        twterm: this.params.id,
                        twcon: t.getAttribute("data-twcon")
                    }, n.getActiveExperimentDataString().then(function(r) {
                        t.setAttribute(a, !0), e.twgr = r, t.href = i(t.href, e)
                    }.bind(this)).catch(function() {
                        t.setAttribute(a, !0), t.href = i(t.href, e)
                    }.bind(this))) : s.resolve()
                }), t.after("render", function() {
                    this.on("click", "A", function(t, e) {
                        this.injectRefUrlParams(e)
                    })
                })
            }
        },
        183: function(t) {
            t.exports = {
                css: "a4ac5782325ad1b5e51c8b06daf47853",
                holdback_css: "a4ac5782325ad1b5e51c8b06daf47853"
            }
        },
        184: function(t, e, r) {
            var i = r(4),
                n = r(5),
                o = i.createElement("div");
            t.exports = function(t) {
                return n.isNumber(t) && (t += "px"), o.style.width = "", o.style.width = t, o.style.width || null
            }
        },
        185: function(t, e, r) {
            var i = r(35),
                n = r(170),
                o = r(44),
                s = r(188);
            t.exports = n.couple(r(171), function(t) {
                t.selectors({
                    inViewportMarker: ".js-inViewportScribingTarget"
                }), t.define("scribeInViewportSeen", function(t, e) {
                    var r = i.extractTermsFromDOM(t);
                    r.action = "seen", this.scribe(r, e, o.version)
                }), t.after("show", function() {
                    var t = this.selectors.inViewportMarker;
                    this.select(t).forEach(function(t) {
                        t && s.inViewportOnce(t, this.sandbox.sandboxEl, function() {
                            this.scribeInViewportSeen(t, this.scribeItems())
                        }.bind(this))
                    }, this)
                })
            })
        },
        187: function(t, e, r) {
            var i = r(11),
                n = r(39),
                o = "^",
                s = "|",
                a = "twsrc",
                c = "twterm",
                u = "twcamp",
                l = "twgr",
                d = "twcon";

            function f(t, e) {
                return t + o + e
            }
            t.exports = function(t, e) {
                var r = [f(a, "tfw")];
                return e && (r = r.concat(function(t) {
                        var e = [];
                        return t.twcamp && e.push(f(u, t.twcamp)), t.twterm && e.push(f(c, t.twterm)), t.twgr && e.push(f(l, t.twgr)), t.twcon && e.push(f(d, t.twcon)), e
                    }(e))),
                    function(t, e) {
                        return i.url(t, {
                            ref_src: e,
                            ref_url: n.rootDocumentLocation()
                        })
                    }(t, function(t) {
                        return t.reduce(function(t, e) {
                            return t + s + e
                        })
                    }(r))
            }
        },
        188: function(t, e, r) {
            var i = r(202),
                n = r(47),
                o = r(203),
                s = r(1),
                a = r(21),
                c = function(t) {
                    return (s.requestIdleCallback || s.requestAnimationFrame || function(t) {
                        t()
                    })(t)
                },
                u = function() {
                    this.observers = []
                };
            u.prototype._register = function(t, e, r) {
                var n, u = this;
                return a.hasIntersectionObserverSupport() ? ((n = new s.IntersectionObserver(function(t) {
                    t.forEach(function(t) {
                        t.intersectionRatio >= 1 && (c(r), u._unregister(n))
                    })
                }, {
                    threshold: 1
                })).observe(t), n) : (n = {
                    update: function(o, s) {
                        i(t, {
                            viewportWidth: o,
                            viewportHeight: s,
                            sandboxEl: e
                        }) && (r(), u._unregister(n))
                    }
                }, this.observers.push(n), 1 === this.observers.length && (this.unlisten = o.addScrollListener(this._onViewportChange.bind(this))), this._onViewportChange(), n)
            }, u.prototype._unregister = function(t) {
                var e;
                a.hasIntersectionObserverSupport() && t instanceof s.IntersectionObserver ? t.disconnect() : (e = this.observers.indexOf(t)) > -1 && (this.observers.splice(e, 1), 0 === this.observers.length && this.unlisten && this.unlisten())
            }, u.prototype._onViewportChange = function() {
                n(c(function() {
                    this._notify(o.getWidth(), o.getHeight())
                }.bind(this)), 50, this)
            }, u.prototype._notify = function(t, e) {
                this.observers.forEach(function(r) {
                    r.update(t, e)
                })
            }, u.prototype.inViewportOnce = function(t, e, r) {
                return this._register(t, e, r)
            }, t.exports = new u
        },
        190: function(t, e, r) {
            var i = r(18),
                n = r(191),
                o = 375;
            t.exports = function(t) {
                t.after("prepForInsertion", function(t) {
                    n.sizeIframes(t, this.sandbox.width, o, i.sync)
                }), t.after("resize", function() {
                    n.sizeIframes(this.el, this.sandbox.width, o, i.write)
                })
            }
        },
        191: function(t, e, r) {
            var i = r(1),
                n = r(0),
                o = r(46),
                s = r(11),
                a = r(82),
                c = r(21),
                u = r(225),
                l = r(10),
                d = "https://pbs.twimg.com/cards/player-placeholder",
                f = /max-width:\s*([\d.]+px)/,
                h = /top:\s*(-?[\d.]+%)/,
                p = /left:\s*(-?[\d.]+%)/,
                m = /padding-bottom:\s*([\d.]+%)/,
                b = {
                    64: "tiny",
                    120: "120x120",
                    240: "240x240",
                    360: "360x360",
                    680: "small",
                    900: "900x900",
                    1200: "medium",
                    2048: "large",
                    4096: "4096x4096"
                },
                g = Object.keys(b).sort(function(t, e) {
                    return t - e
                }),
                v = 2;

            function w(t, e) {
                t.getAttribute("data-image") === d ? t.src = d + ".png" : t.getAttribute("data-image") ? x(t, e) : E(t, e)
            }

            function y(t, e, r) {
                var i, n, o, s, a;
                if (n = I(t), o = e.split(",").map(function(t) {
                        return new function(t) {
                            var e = t.split(" ");
                            this.url = decodeURIComponent(e[0].trim()), this.width = +e[1].replace(/w$/, "").trim()
                        }(t.trim())
                    }), r)
                    for (a = 0; a < o.length; a++) o[a].url === r && (i = o[a]);
                return s = o.reduce(function(t, e) {
                    return e.width < t.width && e.width >= n ? e : t
                }, o[0]), i && i.width > s.width ? i : s
            }

            function x(t, e) {
                var r, i, n, o, c, u, l;
                i = (r = s.decodeURL(t.src).name) && a(g, function(t) {
                    if (b[t] === r) return t
                }), n = function(t) {
                    return {
                        width: parseInt(t.getAttribute("width")),
                        height: parseInt(t.getAttribute("height")) || 1
                    }
                }(t), i >= (c = ((l = n).height > l.width ? I(e) * n.height / n.width : I(e)) || 680) || (o = t.getAttribute("data-image"), u = a(g, function(t) {
                    if (t >= c) return t
                }) || 4096, t.src = s.url(o, {
                    format: t.getAttribute("data-image-format") || "jpg",
                    name: b[u]
                }))
            }

            function I(t) {
                return i.devicePixelRatio ? t * Math.min(i.devicePixelRatio, v) : t
            }

            function E(t, e) {
                var r, i = t.getAttribute("data-srcset"),
                    n = t.src;
                i && (r = y(e, i, n), t.src = r.url)
            }

            function C(t, e, r) {
                t && (n.toRealArray(t.querySelectorAll(".NaturalImage-image")).forEach(function(t) {
                    r(function() {
                        w(t, e)
                    })
                }), n.toRealArray(t.querySelectorAll(".CroppedImage-image")).forEach(function(t) {
                    r(function() {
                        w(t, e / 2)
                    })
                }), n.toRealArray(t.querySelectorAll("img.autosized-media")).forEach(function(t) {
                    r(function() {
                        w(t, e), t.removeAttribute("width"), t.removeAttribute("height")
                    })
                }))
            }

            function _(t, e, r, i) {
                t && n.toRealArray(t.querySelectorAll("iframe.autosized-media, .wvp-player-container")).forEach(function(t) {
                    var n = A(t.getAttribute("data-width"), t.getAttribute("data-height"), u.effectiveWidth(t.parentElement) || e, r);
                    i(function() {
                        t.setAttribute("width", n.width), t.setAttribute("height", n.height), l.present(t, "wvp-player-container") ? (t.style.width = n.width, t.style.height = n.height) : (t.width = n.width, t.height = n.height)
                    })
                })
            }

            function A(t, e, r, i, n, o) {
                return r = r || t, i = i || e, n = n || 0, o = o || 0, t > r && (e *= r / t, t = r), e > i && (t *= i / e, e = i), t < n && (e *= n / t, t = n), e < o && (t *= o / e, e = o), {
                    width: Math.floor(t),
                    height: Math.floor(e)
                }
            }

            function k(t, e, r, i) {
                n.toRealArray(t.querySelectorAll(e)).forEach(function(t) {
                    var e = t.getAttribute("style") || t.getAttribute("data-style"),
                        n = i.test(e) && RegExp.$1;
                    n && (t.setAttribute("data-csp-fix", !0), t.style[r] = n)
                })
            }
            t.exports = {
                scaleDimensions: A,
                retinize: function(t, e) {
                    e = void 0 !== e ? !!e : c.retina(), n.toRealArray(t.getElementsByTagName("IMG")).forEach(function(t) {
                        var r = t.getAttribute("data-src-1x") || t.getAttribute("src"),
                            i = t.getAttribute("data-src-2x");
                        e && i ? t.src = i : r && (t.src = r)
                    })
                },
                setSrcForImgs: C,
                sizeIframes: _,
                constrainMedia: function(t, e, r, i) {
                    C(t, e, i), _(t, e, r, i)
                },
                fixMediaCardLayout: function(t) {
                    o.inlineStyle() || (k(t, ".MediaCard-widthConstraint", "maxWidth", f), k(t, ".MediaCard-mediaContainer", "paddingBottom", m), k(t, ".CroppedImage-image", "top", h), k(t, ".CroppedImage-image", "left", p))
                },
                __setSrcFromSet: E,
                __setSrcFromImage: x,
                __setImageSrc: w
            }
        },
        192: function(t, e, r) {
            var i = r(46),
                n = (r(12), r(0)),
                o = /^([a-zA-Z-]+):\s*(.+)$/;

            function s(t) {
                var e = (t.getAttribute("data-style") || "").split(";").reduce(function(t, e) {
                    var r, i, n;
                    return o.test(e.trim()) && (r = RegExp.$1, i = RegExp.$2, t[(n = r, n.replace(/-(.)/g, function(t, e) {
                        return e.toUpperCase()
                    }))] = i), t
                }, {});
                0 !== Object.keys(e).length && (t.setAttribute("data-csp-fix", "true"), n.forIn(e, function(e, r) {
                    t.style[e] = r
                }))
            }
            t.exports = function(t) {
                t.selectors({
                    cspForcedStyle: ".js-cspForcedStyle"
                }), t.after("prepForInsertion", function(t) {
                    i.inlineStyle() || this.select(t, "cspForcedStyle").forEach(s)
                })
            }
        },
        193: function(t, e, r) {
            var i = r(191);
            t.exports = function(t) {
                t.after("prepForInsertion", function(t) {
                    i.retinize(t)
                })
            }
        },
        194: function(t, e, r) {
            var i = r(18),
                n = r(191);
            t.exports = function(t) {
                t.after("prepForInsertion", function(t) {
                    n.setSrcForImgs(t, this.sandbox.width, i.sync)
                }), t.after("resize", function() {
                    n.setSrcForImgs(this.el, this.sandbox.width, i.write)
                })
            }
        },
        195: function(t, e) {
            var r = "data-iframe-title";
            t.exports = function(t) {
                t.after("render", function() {
                    var t = this.el.getAttribute(r);
                    t && this.sandbox.setTitle && this.sandbox.setTitle(t)
                })
            }
        },
        196: function(t, e, r) {
            var i = r(6),
                n = r(5),
                o = "env-bp-",
                s = o + "min";

            function a(t) {
                return t.every(n.isInt)
            }

            function c(t) {
                var e = t.map(function(t) {
                    return {
                        size: +t,
                        className: o + t
                    }
                }).sort(function(t, e) {
                    return t.size - e.size
                });
                return e.unshift({
                    size: 0,
                    className: s
                }), e
            }
            t.exports = function(t) {
                t.params({
                    breakpoints: {
                        required: !0,
                        validate: a,
                        transform: c
                    }
                }), t.define("getClassForWidth", function(t) {
                    var e, r, i;
                    for (r = this.params.breakpoints.length - 1; r >= 0; r--)
                        if (t > (i = this.params.breakpoints[r]).size) {
                            e = i.className;
                            break
                        }
                    return e
                }), t.after("initialize", function() {
                    this.allBreakpoints = this.params.breakpoints.map(function(t) {
                        return t.className
                    })
                }), t.define("recalculateBreakpoints", function() {
                    var t = this.getClassForWidth(this.sandbox.width);
                    return t && this.sandbox.hasRootClass(t) ? i.resolve() : i.all([this.sandbox.removeRootClass(this.allBreakpoints), this.sandbox.addRootClass(t)])
                }), t.after("render", function() {
                    return this.recalculateBreakpoints()
                }), t.after("resize", function() {
                    return this.recalculateBreakpoints()
                })
            }
        },
        197: function(t, e, r) {
            var i = r(2),
                n = r(81),
                o = r(227),
                s = null;

            function a(t, e) {
                var r, i;
                if (i = {
                        scribeContext: (e = e || {}).scribeContext || {
                            client: "tfw"
                        },
                        languageCode: e.languageCode,
                        hideControls: e.hideControls || !1,
                        addTwitterBranding: e.addBranding || !1,
                        widgetOrigin: e.widgetOrigin,
                        borderRadius: e.borderRadius,
                        autoPlay: e.autoPlay
                    }, (r = n(t, ".wvp-player-container")).length > 0) return s && o.setBaseUrl(s), {
                    element: r[0],
                    options: i
                }
            }
            t.exports = {
                insertForTweet: function(t, e, r) {
                    var n, s = new i,
                        c = a(t, r);
                    if (c) return (n = o.createPlayerForTweet(c.element, e, c.options)) ? (s.resolve(n), s.promise) : s.reject(new Error("unable to create tweet video player"))
                },
                insertForEvent: function(t, e, r) {
                    var n, s = new i,
                        c = a(t, r);
                    return c ? ((n = o.createPlayerForLiveVideo(c.element, e, c.options)).on("ready", function() {
                        n.playPreview(), s.resolve(n)
                    }), s.promise) : s.reject(new Error("unable to initialize event video player"))
                },
                remove: function(t) {
                    var e = t.querySelector(".wvp-player-container"),
                        r = e && o.findPlayerForElement(e);
                    if (r) return r.teardown()
                },
                find: function(t) {
                    return o.findPlayerForElement(t)
                }
            }
        },
        198: function(t, e, r) {
            var i = r(33),
                n = r(228),
                o = r(170),
                s = r(30),
                a = r(35),
                c = r(0),
                u = r(6),
                l = "data-click-to-open-target";
            t.exports = o.couple(r(171), function(t) {
                t.selectors({
                    clickToOpen: ".js-clickToOpenTarget"
                }), t.define("shouldOpenTarget", function(t) {
                    var e = i.closest("A", t.target, this.el),
                        r = i.closest("BUTTON", t.target, this.el),
                        n = this.sandbox.hasSelectedText();
                    return !e && !r && !n
                }), t.define("openTarget", function(t, e) {
                    var r = e && e.getAttribute(l),
                        i = {
                            twcamp: this.params.productName,
                            twterm: this.params.id,
                            twcon: e.getAttribute("data-twcon")
                        };
                    return r ? s.getActiveExperimentDataString().then(function(e) {
                        i.twgr = e, n(r, i), this.scribeOpenClick(t)
                    }.bind(this)).catch(function() {
                        n(r, i), this.scribeOpenClick(t)
                    }.bind(this)) : u.resolve()
                }), t.define("attemptToOpenTarget", function(t, e) {
                    return this.shouldOpenTarget(t) ? this.openTarget(t, e) : u.resolve()
                }), t.define("scribeOpenClick", function(t) {
                    var e = a.extractTermsFromDOM(t.target),
                        r = {
                            associations: a.formatTweetAssociation(e)
                        },
                        i = c.aug({}, {
                            element: "chrome",
                            action: "click"
                        }, e);
                    this.scribe(i, r)
                }), t.after("render", function() {
                    this.on("click", "clickToOpen", this.attemptToOpenTarget)
                })
            })
        },
        199: function(t, e, r) {
            var i = r(33),
                n = r(34),
                o = r(73),
                s = r(39),
                a = r(11),
                c = r(3),
                u = r(7),
                l = "data-url-params-injected";
            t.exports = function(t) {
                t.params({
                    productName: {
                        required: !0
                    },
                    dataSource: {
                        required: !1
                    },
                    related: {
                        required: !1
                    },
                    partner: {
                        fallback: u(n.val, n, "partner")
                    }
                }), t.selectors({
                    timeline: ".timeline",
                    tweetIdInfo: ".js-tweetIdInfo"
                }), t.define("injectWebIntentParams", function(t) {
                    var e = i.closest(this.selectors.timeline, t, this.el),
                        r = i.closest(this.selectors.tweetIdInfo, t, this.el);
                    t.getAttribute(l) || (t.setAttribute(l, !0), t.href = a.url(t.href, {
                        tw_w: this.params.dataSource && this.params.dataSource.id,
                        tw_i: r && r.getAttribute("data-tweet-id"),
                        tw_p: this.params.productName,
                        related: this.params.related,
                        partner: this.params.partner,
                        query: e && e.getAttribute("data-search-query"),
                        profile_id: e && e.getAttribute("data-profile-id"),
                        original_referer: s.rootDocumentLocation()
                    }))
                }), t.after("render", function() {
                    this.on("click", "A", function(t, e) {
                        c.isIntentURL(e.href) && (this.injectWebIntentParams(e), o.open(e.href, this.sandbox.sandboxEl, t))
                    })
                })
            }
        },
        200: function(t, e, r) {
            var i = r(21);
            t.exports = function(t) {
                t.before("render", function() {
                    i.ios() && this.sandbox.addRootClass("env-ios"), i.ie9() && this.sandbox.addRootClass("ie9"), i.touch() && this.sandbox.addRootClass("is-touch")
                })
            }
        },
        201: function(t, e, r) {
            var i = r(229);
            t.exports = function(t) {
                t.params({
                    pageForAudienceImpression: {
                        required: !0
                    }
                }), t.before("hydrate", function() {
                    i.scribeAudienceImpression(this.params.pageForAudienceImpression)
                })
            }
        },
        202: function(t, e, r) {
            var i = r(4),
                n = r(1);
            t.exports = function(t, e) {
                var r, o, s, a;
                return o = (e = e || {}).viewportWidth || n.innerWidth, r = e.viewportHeight || n.innerHeight, s = t.getBoundingClientRect(), t.ownerDocument !== i && e.sandboxEl && (a = e.sandboxEl.getBoundingClientRect(), s = {
                    top: s.top + a.top,
                    bottom: s.bottom + a.top,
                    left: s.left + a.left,
                    right: s.right + a.left
                }), s.top >= 0 && s.left >= 0 && s.bottom <= r && s.right <= o
            }
        },
        203: function(t, e, r) {
            var i = r(1),
                n = {
                    _addListener: function(t, e) {
                        var r = function() {
                            e()
                        };
                        return i.addEventListener(t, r),
                            function() {
                                i.removeEventListener(t, r)
                            }
                    },
                    addScrollListener: function(t) {
                        return this._addListener("scroll", t)
                    },
                    getHeight: function() {
                        return i.innerHeight
                    },
                    getWidth: function() {
                        return i.innerWidth
                    }
                };
            t.exports = n
        },
        204: function(t, e, r) {
            var i = r(170),
                n = r(230),
                o = 1;
            t.exports = i.couple(r(171), function(t) {
                var e = {
                        action: "dimensions"
                    },
                    r = new n(o);
                t.after("show", function() {
                    var t;
                    r.nextBoolean() && (t = {
                        widget_width: this.sandbox.width,
                        widget_height: this.sandbox.height
                    }, this.scribe(e, t))
                })
            })
        },
        225: function(t, e) {
            t.exports = {
                effectiveWidth: function t(e) {
                    return e && 1 === e.nodeType ? e.offsetWidth || t(e.parentNode) : 0
                }
            }
        },
        227: function(t, e, r) {
            var i, n;
            n = this, void 0 === (i = function() {
                return n.TwitterVideoPlayer = function() {
                    var t = "https://twitter.com",
                        e = /^https?:\/\/([a-zA-Z0-9]+\.)*twitter.com(:\d+)?$/,
                        r = {
                            suppressScribing: !1,
                            squareCorners: !1,
                            hideControls: !1,
                            addTwitterBranding: !1
                        },
                        i = 0,
                        n = {};

                    function o(t) {
                        if (t && t.data && t.data.params && t.data.params[0]) {
                            var e = t.data.params[0],
                                r = t.data.id;
                            if (e && e.context && "TwitterVideoPlayer" === e.context) {
                                var i = e.playerId;
                                delete e.playerId, delete e.context;
                                var o = n[i];
                                o && o.processMessage(t.data.method, e, r)
                            }
                        }
                    }

                    function s(e, r, s, a, c) {
                        var u = e.ownerDocument,
                            l = u.defaultView;
                        l.addEventListener("message", o), this.playerId = i++;
                        var d = {
                            embed_source: "clientlib",
                            player_id: this.playerId,
                            rpc_init: 1,
                            autoplay: a.autoPlay
                        };
                        if (this.scribeParams = {}, this.scribeParams.suppressScribing = a && a.suppressScribing, !this.scribeParams.suppressScribing) {
                            if (!a.scribeContext) throw "video_player: Missing scribe context";
                            if (!a.scribeContext.client) throw "video_player: Scribe context missing client property";
                            this.scribeParams.client = a.scribeContext.client, this.scribeParams.page = a.scribeContext.page, this.scribeParams.section = a.scribeContext.section, this.scribeParams.component = a.scribeContext.component
                        }
                        this.scribeParams.debugScribe = a && a.scribeContext && a.scribeContext.debugScribing, this.scribeParams.scribeUrl = a && a.scribeContext && a.scribeContext.scribeUrl, this.promotedLogParams = a.promotedContext, this.adRequestCallback = a.adRequestCallback, a.languageCode && (d.language_code = a.languageCode), "tfw" === this.scribeParams.client && (d.use_syndication_guest_id = !0), a.autoPlay && (d.autoplay = 1);
                        var f = function(t, e, r) {
                            var i = Object.keys(r).filter(function(t) {
                                return null != r[t]
                            }).map(function(t) {
                                var e = r[t];
                                return encodeURIComponent(t) + "=" + encodeURIComponent(e)
                            }).join("&");
                            return i && (i = "?" + i), t + e + i
                        }(t, r, d);
                        return this.videoIframe = document.createElement("iframe"), this.videoIframe.setAttribute("src", f), this.videoIframe.setAttribute("allowfullscreen", ""), this.videoIframe.setAttribute("allow", "autoplay; fullscreen"), this.videoIframe.setAttribute("id", s), this.videoIframe.setAttribute("style", "width: 100%; height: 100%; position: absolute; top: 0; left: 0;"), this.domElement = e, this.domElement.appendChild(this.videoIframe), n[this.playerId] = this, this.eventCallbacks = {}, this.emitEvent = function(t, e) {
                            var r = this.eventCallbacks[t];
                            void 0 !== r && r.forEach(function(t) {
                                t.apply(this.playerInterface, [e])
                            }.bind(this))
                        }, this.jsonRpc = function(t) {
                            var e = this.videoIframe.contentWindow;
                            t.jsonrpc = "2.0", e && e.postMessage && e.postMessage(JSON.stringify(t), "*")
                        }, this.jsonRpcCall = function(t, e) {
                            this.jsonRpc({
                                method: t,
                                params: e
                            })
                        }, this.jsonRpcResult = function(t, e) {
                            this.jsonRpc({
                                result: t,
                                id: e
                            })
                        }, this.processMessage = function(t, e, r) {
                            switch (t) {
                                case "requestPlayerConfig":
                                    this.jsonRpcResult({
                                        scribeParams: this.scribeParams,
                                        promotedLogParams: this.promotedLogParams,
                                        squareCorners: a.squareCorners,
                                        borderRadius: a.borderRadius,
                                        hideControls: a.hideControls,
                                        embedded: a.addTwitterBranding,
                                        widgetOrigin: a.widgetOrigin,
                                        ignoreFineGrainGeoblocking: a.ignoreFineGrainGeoblocking
                                    }, r);
                                    break;
                                case "videoPlayerAdStart":
                                    this.emitEvent("adStart", e);
                                    break;
                                case "videoPlayerAdEnd":
                                    this.emitEvent("adEnd", e);
                                    break;
                                case "videoPlayerPlay":
                                    this.emitEvent("play", e);
                                    break;
                                case "videoPlayerPause":
                                    this.emitEvent("pause", e);
                                    break;
                                case "videoPlayerMute":
                                    this.emitEvent("mute", e);
                                    break;
                                case "videoPlayerUnmute":
                                    this.emitEvent("unmute", e);
                                    break;
                                case "videoPlayerPlaybackComplete":
                                    this.emitEvent("playbackComplete", e);
                                    break;
                                case "videoPlayerReady":
                                    this.emitEvent("ready", e);
                                    break;
                                case "videoView":
                                    this.emitEvent("view", e);
                                    break;
                                case "debugLoggingEvent":
                                    this.emitEvent("logged", e);
                                    break;
                                case "requestDynamicAd":
                                    "function" == typeof this.adRequestCallback ? this.jsonRpcResult(this.adRequestCallback(), r) : this.jsonRpcResult({}, r);
                                    break;
                                case "videoPlayerError":
                                    e && "NO_COOKIES_ERROR" === e.error_category ? this.emitEvent("noCookiesError", e) : e && "GEOBLOCK_ERROR" === e.error_category && this.emitEvent("geoblockError", e)
                            }
                        }, this.playerInterface = {
                            on: function(t, e) {
                                return void 0 === this.eventCallbacks[t] && (this.eventCallbacks[t] = []), this.eventCallbacks[t].push(e), this.playerInterface
                            }.bind(this),
                            off: function(t, e) {
                                if (void 0 === e) delete this.eventCallbacks[t];
                                else {
                                    var r = this.eventCallbacks[t];
                                    if (void 0 !== r) {
                                        var i = r.indexOf(e);
                                        i > -1 && r.splice(i, 1)
                                    }
                                }
                                return this.playerInterface
                            }.bind(this),
                            play: function() {
                                return this.jsonRpcCall("play"), this.playerInterface
                            }.bind(this),
                            pause: function() {
                                return this.jsonRpcCall("pause"), this.playerInterface
                            }.bind(this),
                            mute: function() {
                                return this.jsonRpcCall("mute"), this.playerInterface
                            }.bind(this),
                            unmute: function() {
                                return this.jsonRpcCall("unmute"), this.playerInterface
                            }.bind(this),
                            playPreview: function() {
                                return this.jsonRpcCall("autoPlayPreview"), this.playerInterface
                            }.bind(this),
                            pausePreview: function() {
                                return this.jsonRpcCall("autoPlayPreviewStop"), this.playerInterface
                            }.bind(this),
                            updatePosition: function(t) {
                                return this.jsonRpcCall("updatePosition", [t]), this.playerInterface
                            }.bind(this),
                            updateLayoutBreakpoint: function(t) {
                                return this.jsonRpcCall("updateLayoutBreakpoint", [t]), this.playerInterface
                            }.bind(this),
                            enterFullScreen: function() {
                                return this.jsonRpcCall("enterFullScreen"), this.playerInterface
                            }.bind(this),
                            exitFullScreen: function() {
                                return this.jsonRpcCall("exitFullScreen"), this.playerInterface
                            }.bind(this),
                            teardown: function() {
                                this.eventCallbacks = {}, e.removeChild(this.videoIframe), this.videoIframe = void 0, delete n[this.playerId]
                            }.bind(this)
                        }, this.playerInterface
                    }
                    return {
                        setBaseUrl: function(r) {
                            e.test(r) ? t = r : window.console.error("newBaseUrl " + r + " not allowed")
                        },
                        createPlayerForTweet: function(t, e, i) {
                            var n = "/i/videos/tweet/" + e,
                                o = "player_tweet_" + e;
                            return new s(t, n, o, i || r)
                        },
                        createPlayerForDm: function(t, e, i) {
                            var n = "/i/videos/dm/" + e,
                                o = "player_dm_" + e;
                            return new s(t, n, o, i || r)
                        },
                        createPlayerForLiveVideo: function(t, e, i) {
                            var n = "/i/videos/live_video/" + e,
                                o = "player_live_video_" + e;
                            return new s(t, n, o, i || r)
                        },
                        findPlayerForElement: function(t) {
                            for (var e in n)
                                if (n.hasOwnProperty(e)) {
                                    var r = n[e];
                                    if (r && r.domElement === t) return r.playerInterface
                                }
                            return null
                        }
                    }
                }()
            }.call(e, r, e, t)) || (t.exports = i)
        },
        228: function(t, e, r) {
            var i = r(1),
                n = r(187),
                o = r(3);
            t.exports = function(t, e) {
                o.isTwitterURL(t) && (t = n(t, e)), i.open(t)
            }
        },
        229: function(t, e, r) {
            var i = r(80),
                n = r(35),
                o = r(79),
                s = {};

            function a(t) {
                o.isHostPageSensitive() || s[t] || (s[t] = !0, i.scribe(n.formatClientEventNamespace({
                    page: t,
                    action: "impression"
                }), n.formatGenericEventData("syndicated_impression", {}), n.AUDIENCE_ENDPOINT))
            }
            t.exports = {
                scribeAudienceImpression: a,
                scribePartnerTweetAudienceImpression: function() {
                    a("partnertweet")
                },
                scribeTweetAudienceImpression: function() {
                    a("tweet")
                },
                scribeTimelineAudienceImpression: function() {
                    a("timeline")
                },
                scribeVideoAudienceImpression: function() {
                    a("video")
                }
            }
        },
        230: function(t, e) {
            function r(t) {
                this.percentage = t
            }
            r.prototype.nextBoolean = function() {
                return 100 * Math.random() < this.percentage
            }, t.exports = r
        }
    }
]);