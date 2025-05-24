/**
 * 一个动态加载js和css的插件
 * @type {Window}
 * @type {Document}
 */
// const document = window.document;
const Math = window.Math;
const head = document.getElementsByTagName("head")[0];
const TIMEOUT = 10000;
const TAC_LOADING_DIV =
`<div id="tac-loading" style="
    border: 1px solid #eee;
    /* background-color: #409EFF; */
    border-radius: 5px;
    width: 318px;
    height: 318px;
    line-height: 318px;
    color: #606266;
    text-align: center;
    position: relative;
    box-sizing: border-box;
">请稍等...</div>`;

function showLoading(div){
    var dom = document.querySelector(div);
    if (dom) {
        dom.innerHTML = TAC_LOADING_DIV;
    }
}

function hideLoading(div){
    let dom = document.querySelector(div)
    if (dom) {
        dom.innerHTML = "";
    }
}

function loadCaptchaScript(loadConfig, config, styleConfig, successCallback, errorCallback) {
    const scriptUrls = loadConfig.scriptUrls;
    const cssUrls = loadConfig.cssUrls;
    const timeout = loadConfig.timeout || TIMEOUT;
    let allUrlCount = scriptUrls.length + cssUrls.length;
    setTimeout(() => {
        if (allUrlCount !== 0){
            showLoading(config.bindEl);
        }
    }, 100);
    function handleCallback(loaded, url) {
        allUrlCount--;
        if (loaded && allUrlCount === 0) {
            hideLoading(config.bindEl);
            successCallback(new TAC(config, styleConfig));
        } else if (!loaded) {
            hideLoading(config.bindEl);
            errorCallback(url);
        }
    }


    scriptUrls.forEach(function (url) {
        let config = typeof url == 'string' ? {url} : url;
        loadResource(config, handleCallback, 'script', timeout);
    });
    cssUrls.forEach(function (url) {
        let config = typeof url == 'string' ? {url} : url;
        loadResource(config, handleCallback, 'link', timeout);
    });
}

function loadResource(urlConfig, callback, resourceType = 'script', timeout) {
    const existingResource = document.querySelector(`${resourceType}[${resourceType === 'script' ? 'src' : 'href'}="${urlConfig.url}"]`);
    if (existingResource) {
        callback(true, urlConfig);
        return;
    }
    let loaded = false;
    const resource = document.createElement(resourceType);
    if (resourceType === 'link') {
        resource.rel = 'stylesheet';
    } else {
        resource.async = true;
    }
    resource[resourceType === 'script' ? 'src' : 'href'] = urlConfig.url;
    const handleLoad = () => {
        if (!loaded &&
            (!resource.readyState || "loaded" === resource.readyState || "complete" === resource.readyState)) {
            checkOnReady(() => {
                loaded = true;
                setTimeout(() => callback(loaded, urlConfig), 0);
            })
        }
    };
    let checkOnReadTimeoutFlag
    function checkOnReady(cb) {
        if (urlConfig.checkOnReady) {
            checkOnReadTimeoutFlag = setTimeout(() => {
                if (urlConfig.checkOnReady()) {
                    cb();
                } else {
                    checkOnReady(cb);
                }
            }, 10)
        } else {
            cb();
        }

    }

    resource.onload = resource.onreadystatechange = handleLoad;
    resource.onerror = () => {
        loaded = true;
        callback(loaded, urlConfig);
    };

    head.appendChild(resource);

    setTimeout(() => {
        if (!loaded) {
            if (checkOnReadTimeoutFlag) {
                clearTimeout(checkOnReadTimeoutFlag);
            }
            resource.onload = resource.onerror = null;
            resource.remove && resource.remove();
            callback(loaded, urlConfig);
        }
    }, timeout || TIMEOUT);
}

window.loadCaptchaScript = loadCaptchaScript
