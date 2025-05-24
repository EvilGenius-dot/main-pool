TAC.enc.rsaPublicKey = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCkXPmCoecPScG8hG11Ue8cMJqyrTUFJcRZWLnrBgLeruGkGVXXtBU5QzfVYFXZdHPK8QRQS2doOPt8Z9Jm4mYN6b2s4HGWoOKyDkJpXhzi67DUen4JI6SEcxt8z33oMlPSUUrpCvnbmHqhLgc2xnc15dUMYkBFLctq/stonb+BOQIDAQAB";

(() => {
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'test', data: 'native' }));
    } else {
        console.log('Not in WebView');
    }
    
    const _Func = {
        getSafeMark: (url) => {
            try {
                const urlObj = new URL(url);
                // 拆分路径并过滤空值
                const segments = urlObj.pathname.split('/').filter(s => s);
                
                // 核心检测逻辑：当且仅当满足以下条件时返回随机路径
                // 1. 至少有2个路径段
                // 2. 第二个路径段是 "captcha"
                if (segments.length >= 2 && segments[1] === 'captcha') {
                    return segments[0];
                }
                
                // 未匹配到有效模式时返回 null
                return null;
            } catch (e) {
                console.error('Invalid URL:', e);
                return null;
            }
        },
        recaptcha: (success_callback, error_callback, close_callback) => {
            let captcha_box = document.getElementById('captcha-box');
    
            const show = () => {
                captcha_box.style.display = 'flex'
    
                setTimeout(() => {
                    captcha_box.style.transform = 'scale(1)'
                    // captcha_box.style.opacity = '1'
                }, 10)
                
                setTimeout(() => {
                    showProgress()
                }, 500);
            }
    
            const rotateRefresh = () => {
                let el = document.getElementById('tianai-captcha-slider-refresh-btn');
    
                if (el) {
                    el.style.transform = 'rotate(180deg)';
    
                    setTimeout(() => {
                        el.style.transform = 'rotate(0deg)';
                    }, 300);
                }
            }
    
            const showProgress = () => {
                let el = document.getElementById('tianai-captcha-parent');
    
                if (el) {
                    el.style.setProperty('--after-percent', '100%');
                }
            }
    
            const hideProgress = () => {
                let el = document.getElementById('tianai-captcha-parent');
    
                if (el) {
                    el.style.setProperty('--after-percent', '0%');
                }
            }
    
            const hide = (tac) => {
                captcha_box.style.transform = 'scale(0)'
                // captcha_box.style.opacity = '0'
    
                hideProgress()
    
                setTimeout(() => {
                    captcha_box.style.display = 'none'
    
                    tac.destroyWindow();
    
                    close_callback && close_callback()
                }, 500)
            }

            let requestCaptchaDataUrl = '/api/captcha/image';
            let validCaptchaUrl = '/api/captcha/check';
            let safeMark = _Func.getSafeMark(window.location.href);

            if (safeMark) {
                requestCaptchaDataUrl = `/${safeMark}/api/captcha/image`
                validCaptchaUrl = `/${safeMark}/api/captcha/check`;
            }
    
            const config = {
                requestCaptchaDataUrl,
                validCaptchaUrl,
                bindEl: "#captcha-box",
                btnCloseFun: (el, tac) => {
                    hide(tac)
                },
                validSuccess: (res, c, tac) => {
                    if (res.code == 200) {
                        success_callback && success_callback(res.data.token)
                    } else {
                        error_callback && error_callback(res)
                    }
    
                    hide(tac)
                },
                validFail: (res, c, tac) => {
                    error_callback && error_callback(res)
                    tac.reloadCaptcha();
                },
                btnRefreshFun: (el, tac) => {
                    tac.reloadCaptcha();
    
                    rotateRefresh()
                    hideProgress()
                    setTimeout(() => {
                        showProgress()
                    }, 300);
                },
            }
    
            const style= {
                // 不传默认为中文
                btnUrl: "/captcha/images/btn3_final.png",
                bgUrl: "/captcha/images/b3.png",
                logoUrl: "/captcha/images/captcha-logo.png",
                moveTrackMaskBgColor: "#1d4ed8",
                moveTrackMaskBorderColor: "#1d4ed8",
                i18n: null,
            }
            
            let tac = new TAC(config, style);
    
            show();
            tac.init();
        }
    }
    
    document.addEventListener('UniAppJSBridgeReady', () => {
        _Func.recaptcha(cRes => {
            uni.postMessage({
                data: {
                    action: 'success',
                    data: cRes
                }
            });

            window.parent.postMessage({
                action: 'success',
                data: cRes
            }, '*');

            // react native 调用
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    action: 'success',
                    data: cRes
                }));
            }
        }, eRes => {
            uni.postMessage({
                data: {
                    action: 'error',
                    data: eRes
                }
            });

            window.parent.postMessage({
                action: 'error',
                data: eRes
            }, '*');

            // react native 调用
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    action: 'error',
                    data: eRes
                }));
            }
        }, () => {
            uni.postMessage({
                data: {
                    action: 'close'
                }
            });

            window.parent.postMessage({
                action: 'close'
            }, '*')

            // react native 调用
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    action: 'close'
                }));
            }
        })
    })
})()