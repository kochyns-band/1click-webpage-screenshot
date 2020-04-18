var popup = {
    ready: function () {
        $(".capture-visible").click(popup.captureVisible);
        $(".capture-all").click(popup.captureAll);
        $(".capture-region").click(popup.captureRegion);
        $(".capture-webcam").click(popup.captureWebcam);
        $(".capture-desktop").click(popup.captureDesktop);
        $(".capture-clipboard").click(popup.captureClipboard);
        $(".blank-canvas").click(popup.paintbrush);
        $(".edit-content").click(popup.editContent);
        $(".create-task").click(popup.createTask);
        $(".update-task-problem").click(popup.updateTaskProblem);
        $(".update-task-solution").click(popup.updateTaskSolution);
        $(".settings").click(() => {
            chrome.runtime.openOptionsPage();
        });
        $("#working, #message").click(function () {
            $(this).fadeOut();
        });
        $(".ver").text(extension.version);
        popup.checkSupport();
        popup.hideOdooElements();
        popup.showScheenshotHistory();
    },

    hideOdooElements: function () {
        chrome.extension.getBackgroundPage().console.log("hideOdooElements22");
        chrome.tabs.getSelected(null, function (tab) {
            var odoo_url = new URL(tab.url);
            var odoo_url_params = new URLSearchParams(odoo_url.hash);
            var data = {'data': 'ping'};
            chrome.extension.getBackgroundPage().console.log(odoo_url.origin + '/smart_screenshots/ping/');
            $.ajax({
                url: odoo_url.origin + '/smart_screenshots/ping/',
                type: 'post',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(data)
            }).done(function (response) {
                debugger;
                chrome.extension.getBackgroundPage().console.log("hideOdooElementsDone");
                chrome.extension.getBackgroundPage().console.log(response);
                if (response['result'] && response['result']['status'] === 'pong') {
                    chrome.extension.getBackgroundPage().console.log('show Eleement');
                    $("a.create-task").parent('li').css("display", "block");
                    var is_open_form_task_view = odoo_url_params.get('view_type') === 'form' && odoo_url_params.get('model') === 'project.task';
                    if (is_open_form_task_view) {
                        $("div.update-task").parent('li').css("display", "block");
                    }
                }
            });
        });

    },

    showScheenshotHistory: function () {
        chrome.storage.local.get('odoo_screenshots', function (data) {
            chrome.extension.getBackgroundPage().console.log('Storage sync');
            var window_image_history = $('.window_image_history');
            if ($('.window_image_history').length) {
                $('.window_image_history').empty();
                var data = data['odoo_screenshots'];
                chrome.extension.getBackgroundPage().console.log('####################################');
                for (var key in data) {
                    var value = data[key];
                    chrome.extension.getBackgroundPage().console.log(value);
                    window_image_history.append('<div class="screenshot"><img class="screenshot_image" src="' + value['src'] + '"/>' +
                        '<button class="screenshot_image_remove" data-id="' + value['id'] + '">&#10006;</button></div>');
                }

                // remove from page and storage
                $('button.screenshot_image_remove').bind('click', function () {
                    chrome.extension.getBackgroundPage().console.log('Click screenshot_image_remove!!!');
                    chrome.extension.getBackgroundPage().console.log(arguments);
                    $(this).parent('div').remove();
                    var id = $(this).attr('data-id');
                    delete data[id];
                    chrome.storage.local.set({'odoo_screenshots': data}, function () {
                    });
                })
            }
        });
    },

    paintbrush: () => {
        var backgroundWindow = chrome.extension.getBackgroundPage();
        with (backgroundWindow) {
            if (!screenshot.canvas) {
                screenshot.canvas = document.createElement("canvas");
            }

            screenshot.canvas.width = window.screen.availWidth - 50;
            screenshot.canvas.height = window.screen.availHeight - 250;
            var ctx = screenshot.canvas.getContext("2d");
            ctx.beginPath();
            ctx.rect(0, 0, screenshot.canvas.width, screenshot.canvas.height);
            ctx.fillStyle = "white";
            ctx.fill();
        }
        chrome.tabs.create({
            url: chrome.extension.getURL("editor.html") + "#last",
        });
    },
    notifyTabsForStorageUpdate: function () {
        chrome.extension
            .getBackgroundPage()
            .codeinjector.executeCodeOnAllTabs("extStorageUpdate()");
    },

    checkSupport: function () {
        chrome.tabs.query({active: true, currentWindow: true}, function (t) {
            t = t[0];
            var url = t.url;
            if (
                url.indexOf("chrome://") >= 0 ||
                url.indexOf("chrome-extension:") >= 0 ||
                url.indexOf("https://chrome.google.com") >= 0
            ) {
                popup.disableScrollSupport();
            }
            if (url.indexOf("file:") == 0) {
                var scriptNotLoaded = setTimeout(popup.disableScrollSupport, 500);
                chrome.tabs.sendMessage(
                    t.id,
                    {
                        type: "checkExist",
                    },
                    function () {
                        if (chrome.runtime.lastError) {
                            $("#noall")
                                .html(
                                    'Go to chrome://extensions, and check the box "Allow access to file URLs"'
                                )
                                .css({
                                    cursor: "pointer",
                                    color: "blue",
                                    textDecoration: "underline",
                                })
                                .click(function () {
                                    premissions.checkPermissions(
                                        {origins: ["<all_urls>"]},
                                        function (a) {
                                            chrome.tabs.create({
                                                url:
                                                    "chrome://extensions?id=akgpcdalpfphjmfifkmfbpdmgdmeeaeo",
                                            });
                                        }
                                    );
                                });
                        } else {
                            clearTimeout(scriptNotLoaded);
                        }
                    }
                );
            }
        });
    },

    disableScrollSupport: function () {
        $(".capture-all").hide();
        $(".capture-region").hide();
        $(".edit-content").hide();
        $("#noall").show();
    },

    translationBar: function () {
        var did = ",en,";
        chrome.i18n.getAcceptLanguages(function (lang) {
            var ht = "";
            for (var i = 0; i < lang.length; i++) {
                if (did.indexOf("," + lang[i].substring(0, 2) + ",") >= 0) {
                    continue;
                }
                var $e = $('<a lang="' + lang[i] + '" class="btn">' + lang[i] + "</a>");
                $e.on("click", function () {
                    var t = this;
                    chrome.tabs.create({
                        url:
                            "https://docs.google.com/forms/d/1PxQumU94cpqjz_p9mQpNIIdW4WBIL-SRARIkk2I4grA/viewform?entry.893813915&entry.1011219305&entry.510290200=" +
                            t.getAttribute("lang"),
                    });
                });
                $(".window_translate")
                    .show()
                    .append($e);
            }
        });
    },
    /**
     * Function execution from remote scripts such as background.js
     * @param data
     */
    exec: function (data) {
        $("#working").fadeOut();
        $("#message").fadeOut();
        switch (data.type) {
            case "working":
                $("#working").fadeIn();
                break;
            case "message":
                $("#message")
                    .fadeIn()
                    .find(".message-container")
                    .text(data.message);
                break;
            default:
                console.warn("Invalid message", data);
        }
    },
    captureVisible: function () {
        popup.sendMessage({
            data: "captureVisible",
        });
    },
    captureAll: function () {
        popup.sendMessage({
            data: "captureAll",
        });
    },
    captureRegion: function () {
        popup.sendMessage({
            data: "captureRegion",
        });
    },
    captureWebcam: function () {
        popup.sendMessage({
            data: "captureWebcam",
        });
    },
    captureDesktop: function () {
        chrome.permissions.request({permissions: ["desktopCapture"]}, function () {
            popup.sendMessage({
                data: "captureDesktop",
            });
        });
    },
    captureClipboard: function () {
        popup.sendMessage({
            data: "captureClipboard",
        });
    },
    editContent: function () {
        popup.sendMessage({
            data: "editContent",
        });
    },
    createTask: function () {
        popup.sendMessage({
            data: "createTask",
        });
    },
    updateTaskProblem: function () {
        popup.sendMessage({
            data: "updateTaskProblem",
        });
    },
    updateTaskSolution: function () {
        popup.sendMessage({
            data: "updateTaskSolution",
        });
    },
    sendMessage: function (data) {
        chrome.runtime.sendMessage(data, function (x) {
            console.warn("popup_fail", x);
        });
    },
};
$(popup.ready);
