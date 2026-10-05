(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          this.listeners[eventName].splice(index, 1);
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js
  var AdmobConsentStatus;
  var init_consent_status_enum = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js"() {
      (function(AdmobConsentStatus2) {
        AdmobConsentStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
        AdmobConsentStatus2["OBTAINED"] = "OBTAINED";
        AdmobConsentStatus2["REQUIRED"] = "REQUIRED";
        AdmobConsentStatus2["UNKNOWN"] = "UNKNOWN";
      })(AdmobConsentStatus || (AdmobConsentStatus = {}));
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js
  var PrivacyOptionsRequirementStatus;
  var init_privacy_options_requirement_status_enum = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js"() {
      (function(PrivacyOptionsRequirementStatus2) {
        PrivacyOptionsRequirementStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
        PrivacyOptionsRequirementStatus2["REQUIRED"] = "REQUIRED";
        PrivacyOptionsRequirementStatus2["UNKNOWN"] = "UNKNOWN";
      })(PrivacyOptionsRequirementStatus || (PrivacyOptionsRequirementStatus = {}));
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    AdMobWeb: () => AdMobWeb
  });
  var AdMobWeb;
  var init_web = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/web.js"() {
      init_dist();
      init_consent_status_enum();
      init_privacy_options_requirement_status_enum();
      AdMobWeb = class extends WebPlugin {
        async initialize() {
          console.log("initialize");
        }
        async requestTrackingAuthorization() {
          console.log("requestTrackingAuthorization");
        }
        async trackingAuthorizationStatus() {
          return {
            status: "authorized"
          };
        }
        async requestConsentInfo(options) {
          console.log("requestConsentInfo", options);
          return {
            status: AdmobConsentStatus.REQUIRED,
            isConsentFormAvailable: true,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
          };
        }
        async showPrivacyOptionsForm() {
          console.log("showPrivacyOptionsForm");
        }
        async showConsentForm() {
          console.log("showConsentForm");
          return {
            status: AdmobConsentStatus.REQUIRED,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
          };
        }
        async resetConsentInfo() {
          console.log("resetConsentInfo");
        }
        async setApplicationMuted(options) {
          console.log("setApplicationMuted", options);
        }
        async setApplicationVolume(options) {
          console.log("setApplicationVolume", options);
        }
        async showBanner(options) {
          console.log("showBanner", options);
        }
        // Hide the banner, remove it from screen, but can show it later
        async hideBanner() {
          console.log("hideBanner");
        }
        // Resume the banner, show it after hide
        async resumeBanner() {
          console.log("resumeBanner");
        }
        // Destroy the banner, remove it from screen.
        async removeBanner() {
          console.log("removeBanner");
        }
        async prepareInterstitial(options) {
          console.log("prepareInterstitial", options);
          return {
            adUnitId: options.adId
          };
        }
        async showInterstitial() {
          console.log("showInterstitial");
        }
        async prepareRewardVideoAd(options) {
          console.log(options);
          return {
            adUnitId: options.adId
          };
        }
        async showRewardVideoAd() {
          return {
            type: "",
            amount: 0
          };
        }
        async prepareRewardInterstitialAd(options) {
          console.log(options);
          return {
            adUnitId: options.adId
          };
        }
        async showRewardInterstitialAd() {
          return {
            type: "",
            amount: 0
          };
        }
      };
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor-community/admob/dist/esm/definitions.js
  var MaxAdContentRating;
  (function(MaxAdContentRating2) {
    MaxAdContentRating2["General"] = "General";
    MaxAdContentRating2["ParentalGuidance"] = "ParentalGuidance";
    MaxAdContentRating2["Teen"] = "Teen";
    MaxAdContentRating2["MatureAudience"] = "MatureAudience";
  })(MaxAdContentRating || (MaxAdContentRating = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-plugin-events.enum.js
  var BannerAdPluginEvents;
  (function(BannerAdPluginEvents2) {
    BannerAdPluginEvents2["SizeChanged"] = "bannerAdSizeChanged";
    BannerAdPluginEvents2["Loaded"] = "bannerAdLoaded";
    BannerAdPluginEvents2["FailedToLoad"] = "bannerAdFailedToLoad";
    BannerAdPluginEvents2["Opened"] = "bannerAdOpened";
    BannerAdPluginEvents2["Closed"] = "bannerAdClosed";
    BannerAdPluginEvents2["AdImpression"] = "bannerAdImpression";
  })(BannerAdPluginEvents || (BannerAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js
  var BannerAdPosition;
  (function(BannerAdPosition2) {
    BannerAdPosition2["TOP_CENTER"] = "TOP_CENTER";
    BannerAdPosition2["CENTER"] = "CENTER";
    BannerAdPosition2["BOTTOM_CENTER"] = "BOTTOM_CENTER";
  })(BannerAdPosition || (BannerAdPosition = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js
  var BannerAdSize;
  (function(BannerAdSize2) {
    BannerAdSize2["BANNER"] = "BANNER";
    BannerAdSize2["FULL_BANNER"] = "FULL_BANNER";
    BannerAdSize2["LARGE_BANNER"] = "LARGE_BANNER";
    BannerAdSize2["MEDIUM_RECTANGLE"] = "MEDIUM_RECTANGLE";
    BannerAdSize2["LEADERBOARD"] = "LEADERBOARD";
    BannerAdSize2["ADAPTIVE_BANNER"] = "ADAPTIVE_BANNER";
    BannerAdSize2["SMART_BANNER"] = "SMART_BANNER";
  })(BannerAdSize || (BannerAdSize = {}));

  // node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-ad-plugin-events.enum.js
  var InterstitialAdPluginEvents;
  (function(InterstitialAdPluginEvents2) {
    InterstitialAdPluginEvents2["Loaded"] = "interstitialAdLoaded";
    InterstitialAdPluginEvents2["FailedToLoad"] = "interstitialAdFailedToLoad";
    InterstitialAdPluginEvents2["Showed"] = "interstitialAdShowed";
    InterstitialAdPluginEvents2["FailedToShow"] = "interstitialAdFailedToShow";
    InterstitialAdPluginEvents2["Dismissed"] = "interstitialAdDismissed";
  })(InterstitialAdPluginEvents || (InterstitialAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-plugin-events.enum.js
  var RewardInterstitialAdPluginEvents;
  (function(RewardInterstitialAdPluginEvents2) {
    RewardInterstitialAdPluginEvents2["Loaded"] = "onRewardedInterstitialAdLoaded";
    RewardInterstitialAdPluginEvents2["FailedToLoad"] = "onRewardedInterstitialAdFailedToLoad";
    RewardInterstitialAdPluginEvents2["Showed"] = "onRewardedInterstitialAdShowed";
    RewardInterstitialAdPluginEvents2["FailedToShow"] = "onRewardedInterstitialAdFailedToShow";
    RewardInterstitialAdPluginEvents2["Dismissed"] = "onRewardedInterstitialAdDismissed";
    RewardInterstitialAdPluginEvents2["Rewarded"] = "onRewardedInterstitialAdReward";
  })(RewardInterstitialAdPluginEvents || (RewardInterstitialAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum.js
  var RewardAdPluginEvents;
  (function(RewardAdPluginEvents2) {
    RewardAdPluginEvents2["Loaded"] = "onRewardedVideoAdLoaded";
    RewardAdPluginEvents2["FailedToLoad"] = "onRewardedVideoAdFailedToLoad";
    RewardAdPluginEvents2["Showed"] = "onRewardedVideoAdShowed";
    RewardAdPluginEvents2["FailedToShow"] = "onRewardedVideoAdFailedToShow";
    RewardAdPluginEvents2["Dismissed"] = "onRewardedVideoAdDismissed";
    RewardAdPluginEvents2["Rewarded"] = "onRewardedVideoAdReward";
  })(RewardAdPluginEvents || (RewardAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/consent/index.js
  init_consent_status_enum();

  // node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.js
  var AdmobConsentDebugGeography;
  (function(AdmobConsentDebugGeography2) {
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["DISABLED"] = 0] = "DISABLED";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["EEA"] = 1] = "EEA";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["NOT_EEA"] = 2] = "NOT_EEA";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["US"] = 3] = "US";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["OTHER"] = 4] = "OTHER";
  })(AdmobConsentDebugGeography || (AdmobConsentDebugGeography = {}));

  // node_modules/@capacitor-community/admob/dist/esm/index.js
  var AdMob = registerPlugin("AdMob", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.AdMobWeb())
  });

  // src/app.js
  var STORAGE_KEY = "aquenys_state_v1";
  var CONFIG = {
    decayPerHour: {
      oxygen: 2,
      food: 2.5,
      clean: 1.5
    },
    maintenance: {
      oxygen: { duration: 90, gain: 20 },
      food: { duration: 60, gain: 25 },
      clean: { duration: 120, gain: 20 }
    },
    protectionDuration: 2 * 60 * 60 * 1e3,
    protectionCooldown: 6 * 60 * 60 * 1e3,
    protectionDecayMultiplier: 0.25,
    protectionMaintenanceMultiplier: 2
  };
  var now = Date.now();
  var state = {
    oxygen: 100,
    food: 100,
    clean: 100,
    createdAt: now,
    lastUpdate: now,
    protectionUntil: 0,
    nextProtectionAt: 0,
    rewardAdsWatched: 0,
    recordMs: 0
  };
  var activeTasks = {
    oxygen: null,
    food: null,
    clean: null
  };
  function clamp(value) {
    return Math.max(0, Math.min(100, value));
  }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        state = { ...state, ...saved };
      }
    } catch (error) {
      console.warn("No se pudo cargar el estado guardado.", error);
    }
    applyOfflineDecay();
    saveState();
  }
  function saveState() {
    state.lastUpdate = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function applyOfflineDecay() {
    const current = Date.now();
    const previous = Number(state.lastUpdate) || current;
    if (current <= previous) {
      state.lastUpdate = current;
      return;
    }
    let normalMs = current - previous;
    let protectedMs = 0;
    if (state.protectionUntil > previous) {
      protectedMs = Math.max(
        0,
        Math.min(current, state.protectionUntil) - previous
      );
      normalMs -= protectedMs;
    }
    const normalHours = normalMs / 36e5;
    const protectedHours = protectedMs / 36e5;
    state.oxygen = clamp(
      state.oxygen - CONFIG.decayPerHour.oxygen * (normalHours + protectedHours * CONFIG.protectionDecayMultiplier)
    );
    state.food = clamp(
      state.food - CONFIG.decayPerHour.food * (normalHours + protectedHours * CONFIG.protectionDecayMultiplier)
    );
    state.clean = clamp(
      state.clean - CONFIG.decayPerHour.clean * (normalHours + protectedHours * CONFIG.protectionDecayMultiplier)
    );
    state.lastUpdate = current;
  }
  function getStability() {
    return clamp((state.oxygen + state.food + state.clean) / 3);
  }
  function getStatus(stability) {
    if (stability <= 0) {
      return {
        text: "COLAPSO",
        className: "collapsed"
      };
    }
    if (stability < 35) {
      return {
        text: "CR\xCDTICO",
        className: "critical"
      };
    }
    if (stability < 60) {
      return {
        text: "DETERIORADO",
        className: "degraded"
      };
    }
    if (stability < 80) {
      return {
        text: "SALUDABLE",
        className: "healthy"
      };
    }
    return {
      text: "PERFECTO",
      className: "perfect"
    };
  }
  function formatClock(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1e3));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }
  function formatProtection(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1e3));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }
  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }
  function setWidth(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.style.width = `${clamp(value)}%`;
    }
  }
  function updateAquariumStatus(status) {
    const app = document.getElementById("app");
    if (!app) return;
    app.classList.remove(
      "perfect",
      "healthy",
      "degraded",
      "critical",
      "collapsed"
    );
    app.classList.add(status.className);
  }
  function updateUI() {
    const current = Date.now();
    const stability = getStability();
    const status = getStatus(stability);
    const survivalMs = Math.max(0, current - state.createdAt);
    if (stability > 0) {
      state.recordMs = Math.max(state.recordMs || 0, survivalMs);
    }
    const dayNumber = Math.floor(survivalMs / 864e5) + 1;
    const timeInsideDay = survivalMs % 864e5;
    setText("day", `D\xCDA ${dayNumber}`);
    setText("clock", formatClock(timeInsideDay));
    setText("stability", `${Math.round(stability)}%`);
    setText("status", status.text);
    setText("oxygen", `${Math.round(state.oxygen)}%`);
    setText("foodValue", `${Math.round(state.food)}%`);
    setText("clean", `${Math.round(state.clean)}%`);
    setWidth("oxygenFill", state.oxygen);
    setWidth("foodFill", state.food);
    setWidth("cleanFill", state.clean);
    const oxygenBar = document.getElementById("oxygenBar");
    const foodBar = document.getElementById("foodBar");
    const cleanBar = document.getElementById("cleanBar");
    if (oxygenBar) oxygenBar.value = state.oxygen;
    if (foodBar) foodBar.value = state.food;
    if (cleanBar) cleanBar.value = state.clean;
    updateAquariumStatus(status);
    const protectionElement = document.getElementById("protection");
    const rewardButton = document.getElementById("reward");
    if (state.protectionUntil > current) {
      const remaining = state.protectionUntil - current;
      if (protectionElement) {
        protectionElement.textContent = `ACTIVA \xB7 ${formatProtection(remaining)}`;
      }
      if (rewardButton) {
        rewardButton.disabled = true;
        rewardButton.textContent = "PROTECCI\xD3N ACTIVA";
      }
    } else {
      if (state.protectionUntil !== 0) {
        state.protectionUntil = 0;
      }
      if (current < state.nextProtectionAt) {
        const remaining = state.nextProtectionAt - current;
        if (protectionElement) {
          protectionElement.textContent = `Disponible en ${formatProtection(remaining)}`;
        }
        if (rewardButton) {
          rewardButton.disabled = true;
          rewardButton.textContent = `DISPONIBLE EN ${formatProtection(remaining)}`;
        }
      } else {
        if (protectionElement) {
          protectionElement.textContent = "Disponible";
        }
        if (rewardButton) {
          rewardButton.disabled = false;
          if (state.rewardAdsWatched === 0) {
            rewardButton.textContent = "VER 2 ANUNCIOS";
          } else {
            rewardButton.textContent = "VER SEGUNDO ANUNCIO";
          }
        }
      }
    }
  }
  function createBubble() {
    const container = document.getElementById("bubbles");
    if (!container) return;
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    bubble.style.left = `${8 + Math.random() * 84}%`;
    bubble.style.width = `${4 + Math.random() * 8}px`;
    bubble.style.height = bubble.style.width;
    bubble.style.animationDuration = `${3 + Math.random() * 4}s`;
    container.appendChild(bubble);
    setTimeout(() => {
      bubble.remove();
    }, 7500);
  }
  function createFoodParticle() {
    const container = document.getElementById("food");
    if (!container) return;
    const particle = document.createElement("span");
    particle.className = "food-particle";
    particle.style.left = `${20 + Math.random() * 60}%`;
    particle.style.animationDuration = `${2 + Math.random() * 2}s`;
    container.appendChild(particle);
    setTimeout(() => {
      particle.remove();
    }, 4500);
  }
  function maintenanceEffect(type) {
    if (type === "oxygen") {
      for (let i = 0; i < 5; i++) {
        setTimeout(createBubble, i * 120);
      }
    }
    if (type === "food") {
      for (let i = 0; i < 5; i++) {
        setTimeout(createFoodParticle, i * 130);
      }
    }
    if (type === "clean") {
      const aquarium = document.getElementById("aquarium");
      if (aquarium) {
        aquarium.classList.add("filtering");
        setTimeout(() => {
          aquarium.classList.remove("filtering");
        }, 700);
      }
    }
  }
  function startMaintenance(type, button) {
    if (activeTasks[type]) return;
    const config = CONFIG.maintenance[type];
    if (!config) return;
    if (state[type] >= 95) {
      const original = button.textContent;
      button.textContent = type === "food" ? "NO NECESITA ALIMENTO" : type === "oxygen" ? "OX\xCDGENO SUFICIENTE" : "AGUA LIMPIA";
      setTimeout(() => {
        button.textContent = original;
      }, 1800);
      return;
    }
    const originalText = button.textContent;
    const startedAt = Date.now();
    const initialValue = state[type];
    button.disabled = true;
    activeTasks[type] = setInterval(() => {
      const current = Date.now();
      const elapsedSeconds = (current - startedAt) / 1e3;
      const progress = Math.min(1, elapsedSeconds / config.duration);
      const multiplier = state.protectionUntil > current ? CONFIG.protectionMaintenanceMultiplier : 1;
      const targetGain = config.gain * multiplier;
      state[type] = clamp(initialValue + targetGain * progress);
      maintenanceEffect(type);
      const remaining = Math.max(
        0,
        Math.ceil(config.duration - elapsedSeconds)
      );
      button.textContent = `${remaining}s`;
      updateUI();
      if (progress >= 1) {
        clearInterval(activeTasks[type]);
        activeTasks[type] = null;
        state[type] = clamp(initialValue + targetGain);
        button.disabled = false;
        button.textContent = originalText;
        saveState();
        updateUI();
      }
    }, 1e3);
  }
  async function activateReward() {
    const button = document.getElementById("reward");
    const current = Date.now();
    if (!button) return;
    if (state.protectionUntil > current || current < state.nextProtectionAt) return;
    button.disabled = true;
    try {
      await AdMob.prepareRewardVideoAd({
        adId: "ca-app-pub-3940256099942544/5224354917",
        isTesting: true
      });
      const reward = await AdMob.showRewardVideoAd();
      if (!reward) {
        button.disabled = false;
        return;
      }
      state.rewardAdsWatched += 1;
      if (state.rewardAdsWatched < 2) {
        button.textContent = "VER SEGUNDO ANUNCIO";
        button.disabled = false;
        saveState();
        return;
      }
      const now2 = Date.now();
      state.rewardAdsWatched = 0;
      state.protectionUntil = now2 + CONFIG.protectionDuration;
      state.nextProtectionAt = now2 + CONFIG.protectionCooldown;
      saveState();
      updateUI();
    } catch (error) {
      console.error("Error mostrando anuncio recompensado:", error);
      button.disabled = false;
    }
  }
  function attachSettings() {
    const openButton = document.getElementById("settingsButton");
    const panel = document.getElementById("settingsPanel");
    const closeButton = document.getElementById("closeSettings");
    if (!openButton || !panel || !closeButton) return;
    openButton.addEventListener("click", () => {
      panel.style.display = "flex";
    });
    closeButton.addEventListener("click", () => {
      panel.style.display = "none";
    });
    panel.addEventListener("click", (event) => {
      if (event.target === panel) {
        panel.style.display = "none";
      }
    });
  }
  function attachEvents() {
    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        startMaintenance(button.dataset.action, button);
      });
    });
    const rewardButton = document.getElementById("reward");
    if (rewardButton) {
      rewardButton.addEventListener("click", activateReward);
    }
  }
  function gameTick() {
    const current = Date.now();
    const elapsedMs = current - state.lastUpdate;
    if (elapsedMs > 0) {
      const hours = elapsedMs / 36e5;
      const decayMultiplier = state.protectionUntil > current ? CONFIG.protectionDecayMultiplier : 1;
      state.oxygen = clamp(
        state.oxygen - CONFIG.decayPerHour.oxygen * hours * decayMultiplier
      );
      state.food = clamp(
        state.food - CONFIG.decayPerHour.food * hours * decayMultiplier
      );
      state.clean = clamp(
        state.clean - CONFIG.decayPerHour.clean * hours * decayMultiplier
      );
      state.lastUpdate = current;
    }
    updateUI();
  }
  async function initializeAdMob() {
    try {
      await AdMob.initialize({
        initializeForTesting: true
      });
      await AdMob.showBanner({
        adId: "ca-app-pub-3940256099942544/6300978111",
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0
      });
      console.log("AdMob de prueba iniciado correctamente");
    } catch (error) {
      console.error("Error iniciando AdMob:", error);
    }
  }
  loadState();
  attachEvents();
  attachSettings();
  updateUI();
  initializeAdMob();
  setInterval(gameTick, 1e3);
  setInterval(saveState, 15e3);
  setInterval(createBubble, 900);
  window.addEventListener("beforeunload", saveState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      applyOfflineDecay();
      updateUI();
    } else {
      saveState();
    }
  });
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
