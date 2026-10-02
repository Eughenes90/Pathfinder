// ==UserScript==
// @author         you
// @name           Export Uncaptured Portals (JSON)
// @category       Layer
// @version        0.1.0
// @description    Esporta in JSON i portali NON catturati (unique) attualmente caricati sulla mappa Intel
// @id             export-uncaptured-portals
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
if (typeof window.plugin !== 'function') window.plugin = function () {};

plugin_info.buildName = 'custom';
plugin_info.dateTimeVersion = '2026-09-26';
plugin_info.pluginId = 'export-uncaptured-portals';

const plugin = window.plugin.exportUncapturedPortals = function () {};

// Stessi bit del plugin highlight-intel-uniques
const VISITED = 1, CAPTURED = 2, SCANNED = 4;

// Estrae il bitmask "history" per un portale, provando entrambe le fonti note
function getHistoryBits(portal) {
    const data = portal.options.data;
    if (data && data.history && data.history._raw != null) return data.history._raw;
    if (portal.options.ent && portal.options.ent[2] && portal.options.ent[2][18] != null) {
        return portal.options.ent[2][18];
    }
    return 0; // nessun dato storico = mai visitato/catturato
}

function isCaptured(portal) {
    return (getHistoryBits(portal) & CAPTURED) !== 0;
}

function collectUncaptured() {
    const result = [];
    for (const guid in window.portals) {
        const portal = window.portals[guid];
        if (!portal || !portal.options) continue;
        if (isCaptured(portal)) continue; // salta i già catturati

        const d = portal.options.data;
        const latlng = portal.getLatLng ? portal.getLatLng() : null;
        if (!latlng || !d) continue;

        result.push({
            guid: guid,
            title: d.title || null,
            lat: latlng.lat,
            lng: latlng.lng,
            team: d.team || null,
            level: d.level != null ? d.level : null,
            historyBits: getHistoryBits(portal)
        });
    }
    return result;
}

function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

plugin.exportNow = function () {
    const zoom = map.getZoom();
    if (zoom < 15) {
        alert('Attenzione: a zoom < 15 IITC non riceve i dati completi dei portali.\n' +
              'Aumenta lo zoom (livello 15+) prima di esportare, altrimenti risultati incompleti o mancanti.');
    }
    const portals = collectUncaptured();
    if (portals.length === 0) {
        alert('Nessun portale non-catturato trovato nella vista corrente (o dati non ancora caricati).');
        return;
    }
    downloadJSON(portals, 'uncaptured-portals-' + Date.now() + '.json');
    console.log('[export-uncaptured-portals] Esportati ' + portals.length + ' portali non catturati.');
};

var setup = function () {
    // Aggiunge una voce al menu IITC in alto
    $('#toolbox').append(
        '<a onclick="window.plugin.exportUncapturedPortals.exportNow()" title="Esporta i portali non catturati visibili come JSON">Export non-catturati</a>'
    );
};

setup.info = plugin_info;
if (!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
if (window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end

var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
    info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
}
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);
