/* global Reveal */

// Modified from markdown.js from Hakim to handle external html files
(function () {
    /*jslint loopfunc: true, browser: true*/
    /*globals alert*/
    'use strict';

    var querySlidingHtml = function () {
        var sections = document.querySelectorAll('[data-html]'),
            section, j, jlen;

        for (j = 0, jlen = sections.length; j < jlen; j++) {
            section = sections[j];

            if (section.getAttribute('data-html').length) {

                var xhr = new XMLHttpRequest(),
                    url = section.getAttribute('data-html'),
                    cb = function () {
                        if (xhr.readyState === 4) {
                            if (
                                (xhr.status >= 200 && xhr.status < 300) ||
                                xhr.status === 0 // file protocol yields status code 0 (useful for local debug, mobile applications etc.)
                                ) {
                                section.innerHTML = xhr.responseText;
                            } else {
                                section.outerHTML = '<section data-state="alert">ERROR: The attempt to fetch ' + url + ' failed with the HTTP status ' + xhr.status + '. Check your browser\'s JavaScript console for more details.</p></section>';
                            }
                        }
                    };

                xhr.onreadystatechange = cb;

                xhr.open('GET', url, false);
                try {
                    xhr.send();
                } catch (e) {
                    alert('Failed to get file' + url + '.' + e);
                }
            }
        }
    };

    querySlidingHtml();

    var titleEl = document.createElement('div');
    titleEl.innerHTML = '<div class="background">' +
        '<div class="frame-wrapper"><iframe src="https://vine.co/v/eztZAqdEgAp/embed/postcard" width="300" height="480" frameborder="0"></iframe></div>' +
        '<div class="frame-wrapper"><iframe src="https://vine.co/v/hETDUMLddV6/embed/postcard" width="300" height="480" frameborder="0"></iframe></div>' +
        '<div class="frame-wrapper"><iframe src="https://vine.co/v/OLh9Tb17XZ0/embed/postcard" width="300" height="480" frameborder="0"></iframe></div>' +
        '</div><div class="content-main-title"><h2>Podatkovno rudarjenje</h2><h4>Mreze v socialnem omrezju Vine</h4><div><small>Marko Grešak</small></div>' +
        '<small>Mentorja: doc. dr. Tomaž Curk, Matrin Stražar</small></div>';

    var showTitle = function (rmClass) {
        if (rmClass) {
            titleEl.className = '';
        }
        titleEl.style.display = 'block';
        document.querySelector('.backgrounds').appendChild(titleEl);
    };

    var hideTitle = function () {
        titleEl.style.display = 'none';
    };

    window.onload = function () {
        if (Reveal.isFirstSlide()) {
            showTitle();
        }

        Reveal.addEventListener('slidechanged', function() {
            if (Reveal.isFirstSlide()) {
                setTimeout(function () {
                    showTitle(true);
                }, 250);
            }
            else {
                hideTitle();
            }
        });
    };
})();
