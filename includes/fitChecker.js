/**
 * Obsahuje API pro práci s FIT Checkerem. Základní metody pro zpracování dat,
 * přihlašování, ukládání atd.
 *
 * @author Martin Štekl <martin.stekl@gmail.com>
 */

/**
 * Samotná logika kontroly dat, přihlášení, requestů apod.
 */
var fitChecker = {
	/**
	 * @var Instance tlačítka v panelu
	 */
	theButton : null,

	// Informace o uživateli
	login : null,
	password : null,
	ga : 'yes',
	subjects : [],

	/**
	 * @var Říká, zda pomocí uložených dat je možné přihlášení na Edux
	 */
	canLogin : undefined,

	/**
	 * Inicializuje rozšíření.
	 */
	init : function() {
		this.toggleButton();
		this.loadUserData();
		this.userCanLogin();
	},

	/**
	 * Načítá uživatelská data.
	 */
	loadUserData : function() {
		var s = widget.preferences;
		if (!s['login']) {
			return false;
		}
		this.login = s['login'];
		this.password = s['password'];
		if (s['subjects']) {
			this.subjects = JSON.parse(s['subjects']);
		}
		this.ga = s['ga'];
	},

	/**
	 * Uloží zadaná data a spustí kontrolu na přihlásitelnost.
	 */
	save : function(data) {
		var savedData = widget.preferences;
		for (var p in data) {
			if (p == 'subjects') {
				savedData[p] = JSON.stringify(data[p]);
			} else {
				savedData[p] = data[p];
			}
		}
		this.loadUserData();
		this.userCanLogin();
		return true;
	},

	/**
	 * Zjistí, zda je možné se přihlásit, pokud ano, přihlásí se.
	 */
	userCanLogin : function() {
		$.ajax({
			async : false,
			type : 'POST',
			url : 'https://edux.fit.cvut.cz/start?do=login',
			data : {
				u : this.login,
				p : this.password,
				authnProvider : 2
			},
			success : function(html) {
				if ($('input[value="Přihlásit se"]', html).length > 0) {
					fitChecker.canLogin = false;
				} else {
					fitChecker.canLogin = true;
				}
			},
			error : function() {
				fitChecker.canLogin = false;
			}
		});

		if (this.subjects.length <= 0) {
			this.canLogin = false;
		}

		return this.toggleButton();
	},

	/**
	 * Změní funkcionalitu tlačítka v panelu, pokud se můžeme přihlásit na Edux.
	 */
	toggleButton : function() {
		if (this.theButton != null) {
			opera.contexts.toolbar.removeItem(this.theButton);
		}
		if (this.canLogin) {
			this.theButton = opera.contexts.toolbar.createItem(this.getLoggedButtonProperties());
			opera.contexts.toolbar.addItem(this.theButton);
			return true;
		} else {
			this.theButton = opera.contexts.toolbar.createItem(this.getDefaultButtonProperties());
			opera.contexts.toolbar.addItem(this.theButton);
			return false;
		}
	},

	/**
	 * Načte seznam předmětů z titulní stránky Eduxu.
	 */
	loadSubjectsFromEdux : function() {
		$.ajax({
			type : 'GET',
			url : 'https://edux.fit.cvut.cz/',
			success : function(html) {
				allSubjects = $("a[href^=/courses/]", html);
				var insert = '<table><tr>';
				var i = 0;
				allSubjects.each(function(index) {
					if ($.inArray($(this).text(), fitChecker.subjects) == -1) {
						checked = '';
					} else {
						checked = ' checked="checked"';
					}
					if (((i + 1) % 7) == 1) {
						insert += '</tr><tr>';
					}
					insert += '<td><input type="checkbox"' + checked +
						' id="' + $(this).text() + '" /> <label for="' +
						$(this).text() + '">' + $(this).text() + '</label></td>';
					i++;
				});
				insert += '</tr></table>';
				$("fieldset").append(insert);
			}
		});
	},

	/**
	 * Vrací nastavení pro výchozí tlačítko panelu.
	 */
	getDefaultButtonProperties : function() {
		return {
			title : 'Klikni pro otevření možností',
			icon : "icons/icon-18.png",
			onclick :function() {
				opera.extension.tabs.create({
					url : 'options.html',
					focused : true
				});
			}
		};
	},

	/**
	 * Vrací nastavení pro tlačítko, pokud je možné přihlášení na Edux.
	 */
	getLoggedButtonProperties : function() {
		return {
			title : 'Klikni pro zobrazení',
			icon : 'icons/icon-18.png',
			popup : {
				href : 'popup.html',
				width : "460px",
				height : "600px"
			}
		};
	}
};

/**
 * Umožňuje v nastavení zobrazovat zprávy o průběhu skriptu.
 */
var messages = {
	/**
	 * Schová všechny zprávy.
	 */
	hideMessage : function() {
		$('#messages').fadeOut();
	},

	/**
	 * Vypíše error a po 3 vterinach jej schova.
	 */
	setError : function(message) {
		$(document).scrollTop(0);
		$('#messages').html('<p class="error">' + message + '</p>');
		$('#messages').fadeIn();
		setTimeout(this.hideMessage, 3000);
	},

	/**
	 * Vypíše notice a po 3 vterinach jej schova.
	 */
	setNotice : function(message) {
		$(document).scrollTop(0);
		$('#messages').html('<p class="notice">' + message + '</p>');
		$('#messages').fadeIn();
		setTimeout(this.hideMessage, 3000);
	}
};

// -----------------------------------------------------------------------------
// Následující je od Radek Šimko, případně mnou upravené
// -----------------------------------------------------------------------------

fitChecker.loadUserData();

// jQuery extension
$.expr[':'].contentIs = function(el, idx, meta) {
    return $(el).text() === meta[3];
};

function hideStatus() {
    $("div#status").fadeOut();
}

function setStatus(text, type) {
    $(document).scrollTop(0);
    $("div#status").html(text).addClass(type);
    if (type == 'ok') {
        setTimeout(hideStatus, 500);
    }
}

function getLinksAlive(className) {
    if (className == null) {
        className = 'link';
    }
    $("a." + className).live('click', function() {
        openUrl($(this).attr('href'));
    });
}

function openUrl(url) {
    chrome.tabs.create({
        'url': url
    });
}

function fillData(username, subjects, contents, statuses, points) {
    var i = 0;
    var htmlList = '';
    var statusClass = '';
    var pointsContent = null;

    htmlList = '<ul>';
    for (i = 0; i < subjects.length; i++) {
        if (statuses[i] == 'inclusion') {
            statusClass = ' orange';
        } else if(statuses[i] == 'succeed') {
            statusClass = ' green';
        } else if(statuses[i] == 'failed') {
            statusClass = ' red';
        } else {
            statusClass = '';
        }
        htmlList += '<li><a class="tab' + statusClass + '" href="#" id="' +
        subjects[i] + '">' + subjects[i] + '</a></li>';
        if (contents[i] == null) {
            contents[i] = 'Data nejsou k dispozici.';
        }
        pointsContent = '';
        if (points[i] != null) {
            pointsContent = '<div class="points">' + points[i] + '</div>';
        }
        $("div#content").append('<div id="' + subjects[i] +
            '_content" class="subject">' + contents[i] + pointsContent +
                '<a class="edux-link" href="https://edux.fit.cvut.cz/courses/' +
                subjects[i] + '/classification/student/' + username +
                '/start">' + subjects[i] + ' na Eduxu</a>' +
            '</div>');
        $("div#" + subjects[i] + '_content').hide();
    }
    getLinksAlive('edux-link');
    htmlList += '</ul>';
    $("div#menu").html(htmlList);
    $("div#menu").css("display", "block");

    $("a#" + subjects[0]).parent().addClass("current");
    $("div#" + subjects[0] + '_content').show();

    setStatus('Sta\u017Eeno', 'ok');

    $('#menu a.tab').live('click', function() {
        // Get the tab name
        var contentname = $(this).attr("id") + "_content";

        // hide all other tabs
        $("div#content div.subject").hide();
        $("div#menu ul li").removeClass("current");

        // show current tab
        $("div#" + contentname).show();
        $(this).parent().addClass("current");
    });
}

function parseSubjectData(responseText) {
    status = null;
    sumOfPoints = null;

    subjectName = $("a.wikilink2", responseText).attr('href');
    subjectName = subjectName.replace(/\/courses\/([^\/]*)\/.*/, "$1");
    subjCont = $("div.overTable:eq(0)", responseText).html();

    if (subjCont != null) {
        // Get rid of unneccessary content
        subjCont = subjCont.replace(/(.*)<thead>.*<\/thead>(.*)/, "$1$2");
        subjCont = subjCont.replace(/(.*)<tr><td>login<\/td>.*<\/tr>(.*)/, "$1$2");

        inclusion = subjCont.replace(
            /.*<tr><td>zápočet<\/td><td[^>]*>([^<]*)<\/td><\/tr>.*/, "$1");
        if (inclusion == 'Z' || inclusion == 'ANO') {
            status = 'inclusion';
        }
        mark = subjCont.replace(
            /.*<tr><td>klasifikovaný zápočet<\/td><td[^>]*>([^<]*)<\/td><\/tr>.*/, "$1");
        if (mark == 'A' || mark == 'B' || mark == 'C' || mark == 'D' ||
            mark == 'E' || inclusion == 'A' || inclusion == 'B' ||
            inclusion == 'C' || inclusion == 'D' || inclusion == 'E') {
            status = 'succeed';
        } else if (mark == 'F') {
            status = 'failed';
        }

        // Get sum of all points
        var i = 0;
        var el;
        sumOfPoints = null;
        sumStrings = ['celkem', 'Celkem', 'suma', 'cvičení celkem', 'hodnoceni'];
        for (i = 0; i < sumStrings.length; i++) {
            el = $("td:contentIs('" + sumStrings[i] + "')", subjCont);
            if (el.length > 0) {
                sumOfPoints = el.next().text();
                break;
            }
        }
        secondTable = $("div.overTable:eq(1)", responseText).html();
        if (secondTable != null) {
            secondTable = secondTable.replace(/(.*)<thead>.*<\/thead>(.*)/, "$1$2");
            subjCont += '<h2><span>Shrnutí</span></h2>' + secondTable;
        }
    }

    return {
        'subject': subjectName,
        'status': status,
        'points': sumOfPoints,
        'content': subjCont
    };
}

var subjects = [];
var statuses = [];
var points = [];
var subjectContents = [];

function downloadByLocalStorage(username, allSubjects, i) {
    xhrIn = new XMLHttpRequest();
    xhrIn.open("GET", "https://edux.fit.cvut.cz/courses/" +
        allSubjects[i] + "/_export/xhtml/" +
        "classification/student/" + username + "/start", true);
    xhrIn.onreadystatechange = function() {
        if (xhrIn.readyState == 4) {
            result = parseSubjectData(xhrIn.responseText);

            if (result != null && $.inArray(result.subject, subjects) == -1) {
                subjects.push(result.subject);
                statuses.push(result.status);
                points.push(result.points);
                subjectContents.push(result.content);
            }

            percents = Math.floor((((i+1)/allSubjects.length)*100));
            setStatus('Stahuji data - ' + percents + '%', 'loading');
            i++;

            // Final phase
            if ((i) == allSubjects.length) {
                fillData(username, subjects, subjectContents, statuses, points);
                return null;
            }
            downloadByLocalStorage(username, allSubjects, i);
        }
    };
    xhrIn.send();

}

function downloadData(detect) {
    var username;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://edux.fit.cvut.cz/", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.responseText == '') {
                setStatus('Edux je nedostupn\u00FD' +
                    '(<a href="#" onClick="synchronizeData()">' +
                    'zkusit znova</a>)', 'error');
                return false;
            }

            if ($('input[value="Přihlásit se"]', xhr.responseText).length > 0) {
                setStatus('Nejste p\u0159ihl\u00E1\u0161en/a na <a href="' +
                    'https://edux.fit.cvut.cz/start?do=login" class="link">' +
                    'Eduxu</a>', 'error');
                getLinksAlive();
                return false;
            }

            // Get logged user
            username = $("div.user", xhr.responseText).text().replace(/.*\(([a-z0-9]*)\).*/, "$1");

            opera.extension.bgProcess.bg_trackGAevent(username, 'request-opera-v' + widget.version);

            $("div#user").hide();
            $("div#user").text(username);
            $("div#user").fadeIn();

            $("div#status").text('Stahuji data - 0%').removeClass('error');

            if (detect == false) {
                downloadByLocalStorage(username, fitChecker.subjects, 0);
            } else {
                // Walk through ALL available subjects
                var i = 0;
                allSubjects = $("a[href^=/courses/]", xhr.responseText);
                allSubjects.each(function(index) {
                    var xhrIn = new XMLHttpRequest();

                    xhrIn.open("GET", "https://edux.fit.cvut.cz" +
                        $(this).attr('href') + "/_export/xhtml/" +
                        "classification/student/" + username + "/start", true);
                    xhrIn.onreadystatechange = function() {
                        if (xhrIn.readyState == 4) {
                            result = parseSubjectData(xhrIn.responseText);
                            if (result.content != null &&
                                    $.inArray(result.subject, subjects) == -1) {
                                subjects.push(result.subject);
                                statuses.push(result.status);
                                points.push(result.points);
                                subjectContents.push(result.content);
                            }
                            i++;

                            percents = Math.floor(((i/allSubjects.length)*100));
                            setStatus('Stahuji data - ' + percents + '%', 'loading');

                            // Final phase
                            if (i == allSubjects.length) {
                                fillData(username, subjects, subjectContents, statuses, points);
                                fitChecker.subjects = JSON.stringify(subjects);
                            }
                        }
                    };
                    xhrIn.send();
                });
            }
        }
    }
    xhr.send();
}

function synchronizeData() {
    var data = null;
    if (fitChecker.subjects == null) {
        data = downloadData(true);
    } else {
        data = downloadData(false);
    }
}
