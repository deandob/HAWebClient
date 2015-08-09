///////////// Framework functions for widgets. Runs in the context of the widget to setup the framework for the widget

//TODO: Build a persistent state store for storing widget data like dimmer value
var _widgetName, _widgetNum, _iniWidth, _iniHeight, _widgetID, _gScale, _attribs, _scaleX, _scaleY, _groupID, _usePtr;
var _designing = false, _started = false, _toolbox = false, _editing = false;
var _cacheIni = [];

// As widget loading and the loading this script is async, wait until the parent has inserted widget name so I know who I am before I can start
setTimeout(_nameLoaded, 1)

function _nameLoaded() {
    _widgetName = document.getElementById("widget").getAttribute("data-widgetName");               // Name of widget in parent DOM 'objWidgetX'
    
    if (_widgetName === null) {
        setTimeout(_nameLoaded, 1)                                                                   // not ready, wait and try again
    } else {
        _widgetNum = parseInt(_widgetName.replace("objWidget", "").replace("TB", ""))
        if (parent.design === true) {                                                               // In design mode?
            _designing = true;
            if (_widgetName.indexOf("TB") === -1) {                                                 // canvas widget in design mode
                _fw_loaded("design");                                                               // run widget startup
                _fw_scale(parent.widgets[_widgetNum].scaleX, parent.widgets[_widgetNum].scaleY)
                _fw_startDesign();
                parent.widgetRequest(_widgetName, "display", true);
            } else {                                                                                // Toolbox widget
                _fw_loaded("toolbox");
                if (parent.TBWidth / parseInt(_iniWidth) <= 1) _fw_scale(parent.TBWidth / parseInt(_iniWidth), parent.TBWidth / parseInt(_iniWidth));   // keep aspect ratio when scaling for toolbox
                else _fw_scale(1, 1);                                                               // don't scale if the widget is smaller that the toolbox width
            }
        } else {
            if (_fw_loaded("dashboard")) {                                                           // canvas widget in dashboard mode
                _fw_scale(parent.widgets[_widgetNum].scaleX, parent.widgets[_widgetNum].scaleY)      // if loaded & _started, scale widget as saved
                _started = true;
                parent.widgetRequest(_widgetName, "display", true);
                for (var ini in _cacheIni) {
                    _fw_hostRequest(_cacheIni[ini].func, _cacheIni[ini].param0, _cacheIni[ini].param1, _cacheIni[ini].param2)        // process ini messages cached before widget finished loading
                }
            }
        }
    }
}

// Runs when the widget is started, optionally run widget specific routine
function _fw_loaded(start) {          
    _widgetID = document.getElementById("widget");                                          // DOM ID for manipulating widget
    _gScale = document.getElementById("scale");                                             // DOM group that scales when scale is called
    _groupID = document.getElementById("group");                                            // DOM group for all active elements
    _attribs = []
    _usePtr = _widgetID.style.getPropertyValue("cursor")                                    // Reset pointer to default when in design mode
    if (start === "toolbox") {
        _toolbox = true;
        _widgetID.setAttribute("draggable", "true")                                         // Allow dragging in the toolbox
        _widgetID.style.setProperty("cursor", "move")
        _iniHeight = parseInt(_widgetID.getAttribute("height") || _widgetID.style.getAttribute("height"))
        _iniWidth = parseInt(_widgetID.getAttribute("width") || _widgetID.style.getAttribute("width"))
        if (typeof toolboxStart === "function") return toolboxStart(start);
    } else {
        _toolbox = false;
        _iniHeight = parent.widgets[_widgetNum].iniHeight
        _iniWidth = parent.widgets[_widgetNum].iniWidth
        _attribs = parent.widgets[_widgetNum].attribs;
        if (typeof widgetStart === "function") return widgetStart(start);                   // widget plugin startup routine (if present)
    }
    return false;
}

// called when editing started
function _fw_startEdit(param) {
    _editing = true;
    if (typeof startEdit === "function") return startEdit(param);
    return false;
}

// called when editing finishes
function _fw_endEdit(param) {
    _editing = false;
    if (typeof endEdit === "function") return endEdit(param);
    return false;
}

// called when the widget design menu has been updated
function _fw_menuUpdate(param) {
    if (typeof menuUpdate === "function") return menuUpdate(param);
    return false;
}

// called when switching to design mode
function _fw_startDesign(param) {
    _designing = true;
    _widgetID.style.setProperty("cursor", "default");
    if (typeof startDesign === "function") return startDesign(param);
    return false;
}

// called when switching from design mode
function _fw_endDesign(param) {
    _designing = false;
    _widgetID.style.setProperty("cursor", _usePtr);
    if (typeof endDesign === "function") return endDesign(param);                               // reload all settings for any changes
    return false;
}

// called just before destroying widget when moving between tabs
function _fw_endSession(param) {
    if (typeof endSession === "function") return endSession(param);                               // reload all settings for any changes
    return false;
}

// manage scaling only for the scale DOM group
function _fw_scale(scaleX, scaleY) {
    if (_gScale !== null) _gScale.setAttribute("transform", "scale(" + scaleX + "," + scaleY + ")");
    _scaleX = scaleX;
    _scaleY = scaleY;
    if (typeof scale === "function") return scale(scaleX, scaleY);
    return true;
}

// User clicks widget
function _fw_clicked(event) {
    if (typeof clicked === "function") return clicked(event);
    return false;
}

// Right click widget in design mode
function _fw_designClicked(event) {
    if (typeof designClicked === "function") return designClicked(event);
    return false;
}

// User double clicks widget (click fires first)
function _fw_dblClicked(event) {             
    if (typeof dblClicked === "function") return dblClicked(event);
    return false;
}

// actions requested from the host: msg.Instance, msg.Scope, msg.Data
function _fw_hostRequest(func, param0, param1, param2) {
    if (!_designing) {                                      // Don't process feeds when _designing
        if (_attribs === undefined) {
            setTimeout(_fw_hostRequest, 5, func, param0, param1, param2)           // widget function being called before widget setup
        } else {
            switch (func) {
                case "feed":                                    // channel event updates
                    if (typeof feed === "function") return feed(param0, param1, param2);
                    break;
                case "ini":                                     // initial channel state
                    if (_started) {
                        if (typeof ini === "function") return ini(param0, param1, param2);
                    } else {
                        _cacheIni.push({ "func": func, "param0": param0, "param1": param1, "param2": param2 })       // save ini data for when widget _started
                    }
                    break;
                case "msg":                                     // any general message
                    if (typeof msg === "function") return msg(param0, param1, param2);
                    break;
                case "history":                                 // history of message logs in JSON
                    if (typeof history === "function") return history(param0, param1, param2)
                    break;
                default:
                    return false;
            }
        }
    } else if (typeof designAction === "function") return designAction(func, param0, param1, param2);
}

// widget help
function _fw_help() {
    if (typeof help === "function") {
        return { title: document.title, desc: document.getElementById("TBtooltip").getAttribute("data-default"), text: help() }
    }
}

// Access general framework functions from dashboard
function fwFunc(funcName, param0, param1, param2) {
    if (typeof parent.widgetRequest === "function") {
        var result = parent.widgetRequest(_widgetName, funcName, param0, param1, param2);
        if (_widgetName.substr(0, 11) !== "objWidgetTB") _attribs = parent.widgets[_widgetNum].attribs;        // reload attributes in case attribs are updated
        return result;
    }
}

// send channel data to the host
function channelSend(channel, scope, data) {
    //BUG: when switching screens, old widget seems to be sending data and it errors out here.....
    if (typeof parent.widgetRequest === "function") return parent.widgetRequest(_widgetName, "send", channel, scope, data);
}


//document.addEventListener("custom", function (me) {
//    alert("here")
//})                         // tied to DOM so slow & cumbersome
//var evt = document.createEvent("event")
//evt.initEvent("custom", true, false);
//evt.foo = "xxx"
//document.dispatchEvent(evt);

