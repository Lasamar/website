var content_folder = "content/";
var documentation_folder = content_folder + "documentation/";
var visited_menu = false;

var ext_to_lang_hash = {
    "ext": {
        "xml": {
            "lang": "xml"
        },
        "html": {
            "lang": "xml"
        },
        "json": {
            "lang": "jscript"
        },
        "js": {
            "lang": "jscript"
        },
        "ol": {
            "lang": "jolie"
        },
        "iol": {
            "lang": "jolie"
        },
        "java": {
            "lang": "java"
        },
        "txt": {
            "lang": "plain"
        }
    }
};

$(document).ready(function() {
    SyntaxHighlighter.defaults["toolbar"] = false;
    SyntaxHighlighter.defaults["auto-links"] = false;
    History.Adapter.bind(window, "statechange", history);
    history();
});

// GENERIC FUNCTIONS
$(window).resize(function() {
    $("#menu_content").css("height", "auto");
    adjustHeights();
});

function colAdjust(){
    $.each( $( ".col_container" ), function(i,e){
        var height = 0;
        $.each( $( e ).find( ".business_card" ), function(i, se){
                $( se ).css( "height", "");
                height = Math.max( parseInt( $( se ).css( "height" )), height );
                $( se ).css( "height", "100%");
            });
        $( e ).css( "height", height+"px" );
    });
}

function history() {
    var url = History.getState().url;
    if (url.indexOf("#") > -1) {
        url = url.substring(0, url.indexOf("#"));
    }
    var url_params = URL2jParam(url);
    
    if (!url_params.top_menu) {

        menu($("a[ref='news']"));

    } 

    else if (url_params.top_menu == "documentation" && url_params.sideMenuAction) {
        // if its NOT the first visit, only load the doc page and opens its topic in side menu
        if (!visited_menu) {
            menu($("a[ref='documentation']"), url_params.sideMenuAction );
        }
        loadDocContent(url_params.sideMenuAction); /// <--- loads doc page content

    } 

    else if (url_params.top_menu == "community") {
        if (!url_params.sideMenuAction) {
            sideMenuAction('community', 'people', true);
        } else {
            // loads the proper community page
            var callback = function(){
                loadCommunityContent("li[ref='" + url_params.sideMenuAction + "']", url_params.sideMenuAction);
            };
            menu($("a[ref='community']"), url_params.sideMenuAction, callback);
        }
    } 

    else if (url_params.top_menu == "projects") {
        if (!url_params.sideMenuAction) {
            //sideMenuAction('projects', 'intro', true);
            sideMenuAction('projects', 'chor', true);
        } else {
            // loads the proper projects page
            var callback = function(){
                loadProjectsContent("li[ref='" + url_params.sideMenuAction + "']", url_params.sideMenuAction);
            };
            menu($("a[ref='projects']"), url_params.sideMenuAction, callback);
        }
    } 

    else if (url_params.top_menu == "about_jolie") {
        if (!url_params.sideMenuAction) {
            sideMenuAction('about_jolie', 'jolie_style', true);
        } else {
            var callback = function(){
                loadAboutJolieContent("li[ref='" + url_params.sideMenuAction + "']", url_params.sideMenuAction);
            };
            menu($("a[ref='about_jolie']"), url_params.sideMenuAction, callback);
        }
    } 

    else {
        menu($("a[ref='" + url_params.top_menu + "']"));
    }
}

function menu(elem, rel_value, callback) {
    if (!$(elem).attr("src")) {
        showErrorPage( $( "#menu_content" ), "Bad request");
    } else {
        $("#top_menu *").each(function(i, e) {
            $(e).removeAttr("id");
        });
        $(elem).attr("id", "active");
        visited_menu = true;
        if ( $( elem ).attr( "ref" ) == "news" ){
            loadNews( $( elem ).attr( "src" ) );
        } else {

            loadMenuContent($(elem).attr("src"), callback ); /// <---- loads the page-specific content

            if ($(elem).attr("ref") == "documentation") {
                docLoadSideMenu(rel_value);
                zenMenu(true);
            } else if ( $(elem).attr("ref") == "about_jolie"    ||
                        $(elem).attr("ref") == "community"      ||
                        $(elem).attr("ref") == "projects"
                    ){
                zenMenu(true);
            } else {
                zenMenu(false);
            }
        }
    }
}

function loadMenuContent(content_path, callback) {
    setLoading( "#menu_content ");
    $.ajax({
        url: content_folder + content_path,
        success: function( data ) {
            $( "#menu_content" ).append( "<div class=\"temp\">" + data + "<div>" );
            loadCode( content_folder + content_path.split("/")[0] + "/" );
            if(callback){
                callback.apply();
            }
            colAdjust();
            // timeout due to @font-face load latency
            setTimeout(function(){colAdjust();},1000);
        },
        error: function(errorType, textStatus, errorThrown) {
            showErrorPage( $( "#menu_content" ), errorType, textStatus, errorThrown);
        }
    });
}

function loadGenericContent(content_path, dom_location) {
    setLoading( dom_location );
    $.ajax({
        url: content_folder + content_path,
        success: function(data) {
            $(dom_location).html(data);
            scrollify(".scrollable_container");
            colAdjust();
        },
        error: function(errorType, textStatus, errorThrown) {
            showErrorPage( $( "#menu_content" ), errorType, textStatus, errorThrown);
        }
    });
}

function loadDocContent(content_path) {
    setLoading("#doc_content");
    $.ajax({
        url: documentation_folder + content_path + ".html",
        error: function(errorType, textStatus, errorThrown) {
            showErrorPage( $( "#doc_content" ), errorType, textStatus, errorThrown);
        },
        success: function(data) {
            $("#doc_content").append("<div class=\"temp\">" + data + "<div>");
            loadCode( documentation_folder + content_path.split("/")[0] + "/", true );
        }
    });
}

function loadCallback( isDoc ){
    code_to_load--;
    if ( code_to_load <= 0){
        if ( isDoc ){
            $("#doc_content").html( $( ".temp" ).html() );
            parseAnchors();
            TOCCreator( true );
            scrollify( "#doc_content" );
        } else {
            $( "#menu_content ").html( $( ".temp" ).html() );
            scrollify( ".scrollable_container" );
        }
        SyntaxHighlighter.highlight();
        adjustDocPrintHeight();
    }
}

function loadCode( folder, isDoc ) {
    code_to_load = $("div.syntax, div.code").size();
    if ( code_to_load ){
        if (typeof folder == "undefined") {
            folder = documentation_folder;
        }
        $( "div.syntax, div.code" ).each(function() {
            var el = $(this);
            var src_file = el.attr("src");
            // IF SOURCE HAS TO BE LOADED
            if (src_file) {
                // IF IT'S IN SYNTAX
                var content = "";
                if (el.hasClass("syntax")) {
                    $.get(folder + "syntax/" + src_file, function(data) {
                        content = data;
                        el.after("<pre class=\"brush: " + 
                            getLanguageFromExtension(src_file) +
                             "\">" + content + "</pre>");
                        loadCallback( isDoc );
                    }, "text");
                }
                // IF IT'S IN CODE	
                else {
                    $.get(folder + "code/" + src_file, function(data) {
                        content = data;
                        el.after("<pre class=\"brush: " + 
                            getLanguageFromExtension(src_file) +
                             "\">" + content + "</pre>");
                        loadCallback( isDoc );
                    },"text");
                }
                // OR HAS JUST TO BE HIGHLIGHTED (EMBEDDED)
            } else {
                var lang = "plain";
                if (el.attr("lang")){
                    lang = el.attr("lang");
                }
                el.after("<pre class=\"brush: " + lang + "\">" + el.html() + "</pre>");
                el.html("");
                loadCallback( isDoc );
            }
        });
    } else {
        loadCallback( isDoc );
    }
}

function top_menu(href) {
    History.pushState(null, null, "?top_menu=" + $("a[href='" + href + "'][ref]").attr("ref"));
    TOCCreator(false);
}

function URL2jParam(url) {
    jParam = {};
    var uParams = url.substring(url.indexOf("?") + 1);
    uParams = uParams.split("&");
    $.each(uParams, function(key, sParam) {
        var key = sParam.substring(0, sParam.indexOf("="));
        var value = sParam.substring(sParam.indexOf("=") + 1);
        jParam[key] = value;
    });
    return jParam;
}

function adjustDocPrintHeight(){
    var content_height = 0;
    var elements = "";
    $.each($("#doc_content .content > *"),function() {
        var that = this;
        if ( $( "> .syntaxhighlighter", this ).size() > 0 ){
            that = $( "> .syntaxhighlighter", this );
        }
        var eh = parseInt ( $( that ).outerHeight( true ) );
        content_height += eh;
    });
    $("style").html( "@media print{#menu_content{display: block; height:" + 
                    content_height + "px !important;}}" );
}

function adjustHeights() {
    menu_content_h = $("#menu_content").height();
    var body_h = $("body").height();
    var header_h = $("#header").height();
    var subheader_h = $("#logo-down").height();
    var footer_h = $("#footer").height();
    var menu_content_h = body_h - (header_h + subheader_h + footer_h + 1);
    $("#menu_content").height(menu_content_h);
    $("#doc_content").height(menu_content_h+5);
    $("#community_content").height(menu_content_h+5);
    $("#projects_content").height(menu_content_h+5);
    $("#about_jolie_content").height(menu_content_h+5);
}

function showErrorPage(inElement , errorType, textStatus, errorThrown) {
    $( inElement ).html("<div style=\"margin-top:50px\" " + "class=\"grid_14 push_8\"><h1>404</h1>" + "<h3>Text Status</h3><p>" + textStatus + "</p>" + "<h3>Error Thrown</h3><p>" + errorThrown + "</p></div>");
    scrollify( inElement );

}

function scrollify(element) {
    $.each($(element), function(key, e) {
        var content = $(e).html();
        $(e).html("<div class=\"content\">" + content + "</div>");
        $(e).addClass("nano");
        $(e).nanoScroller();
    });
}

function zenMenu(zen) {
    var border="";
    if (zen){
        border="1px solid #C4C4C4";
    }
    $("#logo-down").css("border-right",border);
    adjustHeights();
    social_links();
}

function social_links(){
    var currentUrl = window.location.href;
    var social_links =  "<a class=\"fbIcon\" href=\"http://www.facebook.com/sharer.php?u=" + 
                            currentUrl + "\"></a>" +
                        "<a class=\"twIcon\" href=\"http://twitter.com/intent/tweet?source=sharethiscom&url=" + 
                            currentUrl + "\"></a>" +
                        "<a class=\"gpIcon\" href=\"https://plus.google.com/share?url=" + 
                            currentUrl + "\"></a>";
    $("#social_links").html( social_links );
}

// NEWS FUNCTIONS

function loadNews( content_path ){
    zenMenu(false);
    setLoading( "#menu_content ");
    $.ajax({
        dataType: "text",
        type: "POST",
        url: "/getNews",
        success: function( data ) {
            data = $( $.parseXML( $ ( "<div></div>" ).html( data ).text()));

            var newsData = "<div style=\"text-align:right;\"><a href=\"?top_menu=community&sideMenuAction=contacts\">Register</a> to our Mailing List</div><div class=\"hyphenate scrollable_container\">";
            $.each( data.find("article"), function(i, item) {
                newsData += marked ( $( item ).find( "text").text());
                newsData += "<div class=\"news_separator\">Published on <span class=\"time\">" +
                        $ ( item ).find( "date" ).text() + 
                        "</span>, by <span class=\"user\">" +
                        $ ( item ).find( "author" ).text() + 
                        "</span></div>";
            });
            newsData += "</div>";
            $("#menu_content").html( newsData );
            scrollify(".scrollable_container");
        },
        error: function(errorType, textStatus, errorThrown) {
            showErrorPage( $( "#menu_content" ), errorType, textStatus, errorThrown);
        }
    });
}

// DOCUMENTATION FUNCTIONS

function docLoadSideMenu(rel_value) {
    $.ajax({
		url: '/documentationMenu',
        dataType: 'json',
		contentType: 'application/json',
        success: function(data) {
            var doc_side_menu = $("#doc_side_menu");
            doc_side_menu.html("");
			if ( !(data.topics instanceof Array) ) {
				data.topics = [ data.topics ];
			}
			//alert( data.topics.length );
            doc_side_menu.tree({
                data: addNodeId(data.topics),
                autoOpen: false,
                selectable: true
            });
            loadMenuEvents();
            openTopic(doc_side_menu, rel_value);
        },
        error: function(errorType, textStatus, errorThrown) {
            showErrorPage( $( "#menu_content" ), errorType, textStatus, errorThrown);
        }
    });
}

function addNodeId(json) {
    var id = 1;
	//alert( JSON.stringify( json.topics ) );
    $.each(json, function(ti, topic) {
        $.each(topic.children, function(ni, child) {
			if ( !(topic.children instanceof Array) ) {
				topic.children = [ topic.children ];
			}
            child["id"] = id++;
        })
    });
    return json;
}

function loadMenuEvents() {
    $('#doc_side_menu').bind('tree.click', function(event) {
        var node = event.node;
        if (typeof node.url != "undefined") {
            History.pushState("", "", "?top_menu=documentation&sideMenuAction=" + node.url);
        } else {
            $("#doc_side_menu").tree('toggle', node);
            $(".jqtree-selected").removeClass("jqtree-selected");
        }
    });
}

function pushDocLink(page_name) {
    visited_menu = false;
    History.pushState("", "", "?top_menu=documentation&sideMenuAction=" + page_name);
}

function parseAnchors() {
    $.each($("#doc_content a"), function() {
        if(!$(this).parent().hasClass("download")){
            var link = $(this).attr("href");
            // if it's an page internal anchor
            if( /^(?:#\w+)$/.test( link ) ){
                $(this).removeAttr("href");
                link = /^(?:#)(\w+)$/.exec( link )[1];
                $(this).attr("onclick","docContentScroll('" + link + "')");
            } 
            // if it's an in-site external anchor
            else if ( !/^(?:\w+:\/{2,3}.+)$/.test( link ) ) {
                $(this).removeAttr("href");
                $(this).attr("onclick", "pushDocLink('" + link + "');");
            }
        }
        else {
            var link = $(this).attr("href");
            var dom = History.getState().url.split("?")[0];
            $(this).attr("href", content_folder+link);
        }
    });
}

function setLoading( element ){
    $( element ).html( "<div class=\"ajax_load\"></div>");
}


function getLanguageFromExtension(fileName) {
    var extension = fileName.substring(fileName.lastIndexOf(".") + 1);
    if (ext_to_lang_hash.ext[extension] && ext_to_lang_hash.ext[extension].lang) {
        return ext_to_lang_hash.ext[extension].lang
    } else {
        return "jolie"
    }
}

function openTopic(jqTree, content_path) {
    var jT = jqTree.tree('toJson');
    var nodeId = findNodeByURL(jT, content_path);
    jqTree.tree("selectNode", jqTree.tree("getNodeById", nodeId), true);

}

function findNodeByURL(json, url) {
    var id = "";
    $.each(json, function(ti, topic) {
        $.each(topic.children, function(ni, node) {
            if (node.url == url) {
                id = node.id;
                return false;
            }
        });
        if (id != "") {
            return false
        }
    });
    return id;
}

function TOCCreator(create) {
    if (create) {
        var tn = 0;
        var titles = $("#doc_content h2");
        var title_list = "<div class='grid_5 dropdown'>" + "<div class='dropdowntitle'>Table of Contents</div>";
        title_list += "<div class='grid_9 submenu'><ul class='root'>";
        $.each(titles, function(key, title) {
            title_list += "<li onclick='TOC_scroll(  " + (tn++) + "  );'>" + $(title).text() + "</li>"
        });
        title_list += "</ul></div></div><div class=\"grid_4 push_10 to_top\"" + " onclick='$(  \"#doc_content\"  ).nanoScroller(  { scroll:\"top\"}  );'>" + "Return to Top<span style='padding-left:5px; color:grey'>" + unescape("%u21E7") + "</span></div>";
        $("#TOC_menu").html(title_list);
    } else {
        $("#TOC_menu").html("");
    }
    TOCEvents();
}

function docContentScroll( anchorName ){
    $("#doc_content").nanoScroller({
        scroll: 'top'
    });
    $( "#doc_content" ).nanoScroller({
        scrollTo: $("a[name=" + anchorName + "]")
    }); 
}

function TOC_scroll(ei) {
    $("#doc_content").nanoScroller({
        scroll: 'top'
    });
    $("#doc_content").nanoScroller({
        scrollTo: $($("h2")[ei])
    });
}

function TOCEvents() {
    $(".dropdowntitle, .submenu").click(function() {
        if ($(".dropdown").css("border-bottom-width") == "1px") {
            $(".dropdown").css("border-bottom-width", "0px");
        } else {
            $(".dropdown").css("border-bottom-width", "1px")
        }
        $(".submenu").slideToggle(200);
    });
    $(".submenu").mouseleave(function() {
        $(".dropdown").css("border-bottom-width", "1px");
        $(".submenu").slideUp();
    });
}

function sideMenuAction(page, content, isDefault) {
    if ( !content ){
        content = (/(?:&sideMenuAction=)(\w+)(?:|&)/.exec(page))[1];
        page = (/(?:\?top_menu=)(\w+)(?:|&)/.exec(page))[1];
    }
    if (isDefault) {
        History.replaceState("", "", "?top_menu=" + page + "&sideMenuAction=" + content);
    } else {
        History.pushState("", "", "?top_menu=" + page + "&sideMenuAction=" + content);
    }
}

// COMMUNITY FUNCTIONS

function loadCommunityContent(element, page_title) {
    $("#community_sideMenuAction li").removeAttr("id");
    $(element).attr("id", "active");
    loadGenericContent("community/" + page_title + ".html", "#community_content");
}

// PROJECTS FUNCTIONS

function loadProjectsContent(element, page_title) {
    $("#community_sideMenuAction li").removeAttr("id");
    $(element).attr("id", "active");
    loadGenericContent("projects/" + page_title + ".html", "#projects_content");
}

// ABOUT JOLIE FUNCTIONS

function loadAboutJolieContent(element, page_title) {
    $("#about_jolie_sideMenuAction li").removeAttr("id");
    $(element).attr("id", "active");
    loadGenericContent("about_jolie/" + page_title + ".html", "#about_jolie_content");
}