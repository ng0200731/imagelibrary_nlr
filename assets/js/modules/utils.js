// Shared utility functions.
//
// NOTE: For now we keep the app as non-module (no import/export) to minimize risk.
// We attach helpers to `window` so existing code can keep calling them.

/* eslint-disable */

// Helper function to extract email prefix (part before "@")
window.getEmailPrefix = function getEmailPrefix(email) {
    if (!email) return '';
    const atIndex = email.indexOf('@');
    return atIndex > 0 ? email.substring(0, atIndex) : email;
};

// --- DPI Detection & Real Size Display ---
// Backed by localStorage keys: calibratedDPI / manualDPI
let detectedDPI = null;
let manualDPI = null;
let calibratedDPI = null;

// Load saved DPI values from localStorage
const savedCalibratedDPI = localStorage.getItem('calibratedDPI');
const savedManualDPI = localStorage.getItem('manualDPI');
if (savedCalibratedDPI) calibratedDPI = parseFloat(savedCalibratedDPI);
if (savedManualDPI) manualDPI = parseFloat(savedManualDPI);

window.detectDPI = function detectDPI() {
    const savedDPI = localStorage.getItem('calibratedDPI') || localStorage.getItem('manualDPI');
    if (savedDPI) {
        return parseFloat(savedDPI);
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const baseDPI = 96;
    const calculatedDPI = devicePixelRatio * baseDPI;

    detectedDPI = calculatedDPI;
    return calculatedDPI;
};

window.getCurrentDPI = function getCurrentDPI() {
    if (calibratedDPI) return calibratedDPI;
    if (manualDPI) return manualDPI;
    if (detectedDPI) return detectedDPI;
    return window.detectDPI();
};

window.mmToPixels = function mmToPixels(mm, dpi = null) {
    if (!mm || isNaN(mm)) return null;
    const currentDPI = dpi || window.getCurrentDPI();
    return (parseFloat(mm) * currentDPI) / 25.4;
};

// Initialize DPI on page load (same behavior as before)
detectedDPI = window.detectDPI();
